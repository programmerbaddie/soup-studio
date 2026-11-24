"""Drop-in routes for src/soup_cli/ui/app.py in the Soup repository."""

from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

export_router = APIRouter(prefix="/api/export", tags=["export"])

class GenerateModelfileRequest(BaseModel):
    gguf_path: str
    template_family: str = Field(default="llama3")
    system_prompt: str = Field(default="You are a helpful AI assistant.")
    temperature: float = Field(default=0.7)
    top_p: float = Field(default=0.9)

@export_router.get("/checkpoints")
async def list_checkpoints():
    """Discover fine-tuned models in output/ directory."""
    from pathlib import Path
    import json
    
    results = []
    output_dir = Path("./output")
    if output_dir.exists():
        for item in output_dir.iterdir():
            if item.is_dir() and ((item / "adapter_config.json").exists() or (item / "config.json").exists()):
                results.append({
                    "path": str(item),
                    "name": item.name,
                    "is_adapter": (item / "adapter_config.json").exists(),
                    "gguf_files": [f.name for f in item.glob("*.gguf")]
                })
    return {"checkpoints": results}

@export_router.post("/modelfile")
async def generate_modelfile(req: GenerateModelfileRequest):
    """Generate standard Ollama Modelfile content."""
    lines = [
        f'FROM "{req.gguf_path}"',
        f'SYSTEM """{req.system_prompt}"""',
        f'PARAMETER temperature {req.temperature}',
        f'PARAMETER top_p {req.top_p}',
    ]
    if req.template_family == "llama3":
        lines.append('PARAMETER stop "<|eot_id|>"')
    elif req.template_family == "chatml":
        lines.append('PARAMETER stop "<|im_end|>"')
        
    return {"modelfile": "\n".join(lines) + "\n"}
