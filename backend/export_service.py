"""Export & Local Deployment service for Soup LLM fine-tuning tool."""

import json
import logging
import os
import shutil
import subprocess
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, List, Optional
import httpx

logger = logging.getLogger("soup_studio")

DEFAULT_OLLAMA_URL = "http://localhost:11434"

CHAT_TEMPLATES = {
    "llama3": "{{ if .System }}<|start_header_id|>system<|end_header_id|>\n\n{{ .System }}<|eot_id|>{{ end }}{{ if .Prompt }}<|start_header_id|>user<|end_header_id|>\n\n{{ .Prompt }}<|eot_id|>{{ end }}<|start_header_id|>assistant<|end_header_id|>\n\n{{ .Response }}<|eot_id|>",
    "chatml": "{{ if .System }}<|im_start|>system\n{{ .System }}<|im_end|>\n{{ end }}{{ if .Prompt }}<|im_start|>user\n{{ .Prompt }}<|im_end|>\n{{ end }}<|im_start|>assistant\n{{ .Response }}<|im_end|>",
    "mistral": "{{ if .System }}[INST] {{ .System }}\n\n{{ .Prompt }} [/INST]{{ else }}[INST] {{ .Prompt }} [/INST]{{ end }} {{ .Response }}",
}

STOP_TOKENS = {
    "llama3": ["<|eot_id|>", "<|start_header_id|>", "<|end_header_id|>"],
    "chatml": ["<|im_end|>", "<|im_start|>"],
    "mistral": ["</s>", "[INST]", "[/INST]"],
}


class ExportService:
    def __init__(self, ollama_url: str = DEFAULT_OLLAMA_URL):
        self.ollama_url = os.getenv("OLLAMA_HOST", ollama_url).rstrip("/")

    async def check_ollama_status(self) -> Dict[str, Any]:
        """Check if local Ollama daemon is reachable and list existing models."""
        try:
            async with httpx.AsyncClient(timeout=2.5) as client:
                res = await client.get(f"{self.ollama_url}/api/version")
                if res.status_code == 200:
                    version = res.json().get("version", "unknown")
                    # fetch installed models
                    tags_res = await client.get(f"{self.ollama_url}/api/tags")
                    models = tags_res.json().get("models", []) if tags_res.status_code == 200 else []
                    return {
                        "online": True,
                        "url": self.ollama_url,
                        "version": version,
                        "installed_models": [m.get("name") for m in models],
                    }
        except Exception as e:
            logger.debug(f"Ollama check failed: {e}")

        return {
            "online": False,
            "url": self.ollama_url,
            "version": None,
            "installed_models": [],
            "error": "Ollama daemon not reachable at " + self.ollama_url,
        }

    def scan_checkpoints(self, search_dirs: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Find fine-tuned model checkpoints in standard Soup output paths."""
        if not search_dirs:
            search_dirs = ["./output", "./runs", "./checkpoints", "../output", "."]

        results = []
        seen = set()

        for base in search_dirs:
            path = Path(base).resolve()
            if not path.exists():
                continue

            # check if path itself is a checkpoint
            candidates = [path] if (path / "adapter_config.json").exists() or (path / "config.json").exists() else []
            # check subdirectories
            try:
                for sub in path.iterdir():
                    if sub.is_dir() and ((sub / "adapter_config.json").exists() or (sub / "config.json").exists() or any(sub.glob("*.gguf"))):
                        candidates.append(sub)
            except Exception:
                pass

            for c in candidates:
                c_str = str(c)
                if c_str in seen:
                    continue
                seen.add(c_str)

                meta = self._inspect_checkpoint(c)
                results.append(meta)

        return results

    def _inspect_checkpoint(self, path: Path) -> Dict[str, Any]:
        """Inspect checkpoint metadata from config files."""
        model_name = path.name
        arch = "Generic CausalLM"
        base_model = "unknown"
        is_adapter = False
        has_gguf = False
        gguf_files = [f.name for f in path.glob("*.gguf")]

        if gguf_files:
            has_gguf = True

        adapter_cfg = path / "adapter_config.json"
        if adapter_cfg.exists():
            is_adapter = True
            try:
                data = json.loads(adapter_cfg.read_text(encoding="utf-8"))
                base_model = data.get("base_model_name_or_path", "unknown")
            except Exception:
                pass

        config_file = path / "config.json"
        if config_file.exists():
            try:
                data = json.loads(config_file.read_text(encoding="utf-8"))
                arch = data.get("architectures", [data.get("model_type", "CausalLM")])[0]
                if base_model == "unknown":
                    base_model = data.get("_name_or_path", model_name)
            except Exception:
                pass

        # deduce template family
        combined = f"{model_name} {base_model} {arch}".lower()
        if "llama-3" in combined or "llama3" in combined:
            template_family = "llama3"
        elif "qwen" in combined or "chatml" in combined:
            template_family = "chatml"
        elif "mistral" in combined:
            template_family = "mistral"
        else:
            template_family = "chatml"

        return {
            "path": str(path),
            "name": model_name,
            "architecture": arch,
            "base_model": base_model,
            "is_adapter": is_adapter,
            "has_gguf": has_gguf,
            "gguf_files": gguf_files,
            "recommended_template": template_family,
        }

    def generate_modelfile(
        self,
        gguf_or_base: str,
        template_family: str = "llama3",
        system_prompt: str = "You are a helpful AI assistant fine-tuned with Soup.",
        temperature: float = 0.7,
        top_p: float = 0.9,
    ) -> str:
        """Create a standard Ollama Modelfile string."""
        template = CHAT_TEMPLATES.get(template_family, CHAT_TEMPLATES["chatml"])
        stops = STOP_TOKENS.get(template_family, STOP_TOKENS["chatml"])

        lines = [
            f'FROM "{gguf_or_base}"',
            f'TEMPLATE """{template}"""',
            f'SYSTEM """{system_prompt}"""',
            f"PARAMETER temperature {temperature}",
            f"PARAMETER top_p {top_p}",
        ]
        for s in stops:
            lines.append(f'PARAMETER stop "{s}"')

        return "\n".join(lines) + "\n"

    async def deploy_to_ollama(
        self,
        model_name: str,
        modelfile_content: str,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Deploy model directly to running Ollama via streaming API."""
        async with httpx.AsyncClient(timeout=300.0) as client:
            payload = {
                "name": model_name,
                "modelfile": modelfile_content,
                "stream": True,
            }
            try:
                async with client.stream("POST", f"{self.ollama_url}/api/create", json=payload) as response:
                    if response.status_code != 200:
                        yield {"status": "error", "message": f"Ollama HTTP {response.status_code}"}
                        return

                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                            yield data
                        except Exception:
                            yield {"status": line}
            except Exception as e:
                yield {"status": "error", "message": str(e)}
