"""FastAPI Application Server for Soup Studio & Model Exporter."""

import asyncio
import json
import os
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from export_service import ExportService

app = FastAPI(
    title="Soup Studio — Visual Model Exporter & Deployment Hub",
    version="1.0.0",
    description="Bridge Soup fine-tuned models to Ollama and GGUF with one click.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service = ExportService()
STATIC_DIR = Path(__file__).parent.parent / "frontend"


class GenerateModelfileRequest(BaseModel):
    gguf_path: str
    template_family: str = Field(default="llama3")
    system_prompt: str = Field(default="You are a helpful AI assistant fine-tuned with Soup.")
    temperature: float = Field(default=0.7)
    top_p: float = Field(default=0.9)


class DeployOllamaRequest(BaseModel):
    model_name: str
    modelfile: str


class VramEstimateRequest(BaseModel):
    model_size_billions: float = 8.0
    quant_bits: int = 4
    context_length: int = 4096
    gpu_vram_gb: float = 4.0


class TestChatRequest(BaseModel):
    model_name: str
    prompt: str
    system_prompt: Optional[str] = "You are a helpful assistant fine-tuned with Soup."


@app.get("/api/status")
async def get_status():
    ollama_info = await service.check_ollama_status()
    return {
        "status": "ready",
        "service": "Soup Studio",
        "ollama": ollama_info,
    }


@app.get("/api/checkpoints")
async def get_checkpoints():
    checkpoints = service.scan_checkpoints()
    return {"checkpoints": checkpoints}


@app.post("/api/modelfile/generate")
async def generate_modelfile(req: GenerateModelfileRequest):
    modelfile = service.generate_modelfile(
        gguf_or_base=req.gguf_path,
        template_family=req.template_family,
        system_prompt=req.system_prompt,
        temperature=req.temperature,
        top_p=req.top_p,
    )
    return {"modelfile": modelfile}


@app.post("/api/export/ollama")
async def deploy_to_ollama(req: DeployOllamaRequest):
    """Stream deployment progress to Ollama."""
    async def event_generator():
        yield f"data: {json.dumps({'status': 'Connecting to Ollama daemon...'})}\n\n"
        await asyncio.sleep(0.3)
        async for chunk in service.deploy_to_ollama(req.model_name, req.modelfile):
            yield f"data: {json.dumps(chunk)}\n\n"
        yield f"data: {json.dumps({'status': 'complete', 'message': f'Model {req.model_name} ready to run!'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/api/hardware/vram-check")
async def check_vram_fit(req: VramEstimateRequest):
    """Calculate whether a model fits directly in GPU VRAM or requires Soup's layer streaming."""
    # Base weight memory in GB: (params_in_billions * bits / 8) * 1.15 (overhead)
    weights_gb = (req.model_size_billions * req.quant_bits / 8.0) * 1.15
    # KV cache approx in GB
    kv_cache_gb = (2 * 32 * 4096 * (req.context_length / 4096.0) * 2) / (1024 ** 2) * 0.5
    # Activation / overhead
    overhead_gb = 0.5
    total_needed_gb = round(weights_gb + kv_cache_gb + overhead_gb, 2)

    fits_resident = total_needed_gb <= (req.gpu_vram_gb * 0.95)
    layer_streaming_needed = not fits_resident

    recommendation = "Fits directly in GPU VRAM!" if fits_resident else "Enable `stream_layers: true` in Soup config to train without Out-of-Memory!"

    return {
        "weights_gb": round(weights_gb, 2),
        "total_needed_gb": total_needed_gb,
        "gpu_vram_gb": req.gpu_vram_gb,
        "fits_resident": fits_resident,
        "layer_streaming_needed": layer_streaming_needed,
        "recommendation": recommendation,
    }


@app.post("/api/chat/ollama")
async def chat_with_ollama(req: TestChatRequest):
    """Direct inference with the deployed Ollama model to test it instantly."""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(
                f"{service.ollama_url}/api/generate",
                json={
                    "model": req.model_name,
                    "prompt": req.prompt,
                    "system": req.system_prompt,
                    "stream": False,
                },
            )
            if res.status_code == 200:
                data = res.json()
                return {"reply": data.get("response", ""), "done": True}
            else:
                return {"error": f"Ollama HTTP {res.status_code}: {res.text}"}
    except Exception as e:
        return {"error": f"Chat request failed: {str(e)}"}


# Mount static files for web dashboard
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

    @app.get("/", response_class=HTMLResponse)
    async def read_index():
        index_file = STATIC_DIR / "index.html"
        if index_file.exists():
            return HTMLResponse(content=index_file.read_text(encoding="utf-8"))
        return HTMLResponse("<h1>Soup Studio Frontend Loading...</h1>")
