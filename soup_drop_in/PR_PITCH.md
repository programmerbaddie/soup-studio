# Pull Request Proposal for MakazhanAlpamys/Soup

## Title
`feat(ui): add visual Model Export & local Ollama deployment hub to Web UI`

## Motivation & Problem
While Soup supports exporting models via the CLI (`soup export --model ./output --format gguf`), users operating through the Web UI (`soup ui`) currently have **no graphical way to export, quantize, or deploy their fine-tuned models**. 

Once training finishes in `soup ui`, the workflow is interrupted: users must switch back to terminal, write a custom Ollama `Modelfile` manually (often getting chat templates or stop tokens wrong), and run multi-step CLI commands.

## What this PR introduces
1. **New "Export & Deploy" Tab in Web UI (`#page-export`)**:
   - Checkpoint auto-discovery across `./output` and `./runs`.
   - Automatic model architecture and chat template detection (Llama 3, ChatML/Qwen, Mistral).
   - One-click deployment to running local Ollama instance with live progress streaming.
   - Interactive live Modelfile generator with customizable system prompt, temperature, and stop tokens.
2. **Interactive VRAM / Hardware Estimator**:
   - Visual gauge that shows users whether a target model fits directly in their GPU VRAM or requires Soup's signature `stream_layers: true` feature.
3. **Seamless Web Chat Integration**:
   - Direct test playground tab to evaluate the fine-tuned model immediately after deployment.

## How to test
```bash
# 1. Start soup UI
soup ui

# 2. Navigate to the new 'Export & Deploy' tab in the left sidebar
# 3. Select your checkpoint, configure template, and click 'Deploy to Ollama'
```

## Checklist
- [x] Lazy imports used for non-essential libraries.
- [x] Tested on Python 3.11, 3.12, 3.13.
- [x] Ruff lint passes with 0 warnings.
- [x] Backward compatible with existing Web UI endpoints.
