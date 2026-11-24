<p align="center">
  <h1 align="center">🍲 Soup Studio</h1>
  <p align="center">
    <strong>Visual Model Exporter, Recipe Hub & VRAM Estimator for <a href="https://github.com/MakazhanAlpamys/Soup">Soup</a></strong>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-blue" alt="Python Version">
  <img src="https://github.com/programmerbaddie/soup-studio/actions/workflows/ci.yml/badge.svg" alt="CI Status">
  <img src="https://img.shields.io/badge/Ollama-Local%20Deployment-purple" alt="Ollama">
  <img src="https://img.shields.io/badge/Theme-OLED%20Midnight%20Obsidian-orange" alt="Theme">
  <img src="https://img.shields.io/badge/License-Apache%202.0-green" alt="License">
  <img src="https://img.shields.io/badge/Soup%20Compatible-v0.78%2B-orange" alt="Compatibility">
</p>

---

## 💡 What is Soup Studio?

**Soup Studio** is a visual workbench built for [Soup (`MakazhanAlpamys/Soup`)](https://github.com/MakazhanAlpamys/Soup). It brings a developer-friendly, dark-mode web experience to the entire post-training workflow:

1. **🛠️ Visual Config Studio (`soup.yaml` Builder):** Configure training models, LoRA rank, quantization, and layer streaming visually with real-time schema validation and 1-click download.
2. **🚀 1-Click Local Ollama Deployment:** Converts trained adapters into quantized GGUF models and registers them directly with your running local Ollama service.
3. **📖 Soup Recipe Explorer:** Browse pre-configured training recipes (Chat, DeepSeek-style Reasoning, Qwen Coder, Tool-use) and copy single-command setups.
4. **⚡ Interactive VRAM & Layer Streaming Estimator:** Visual gauge showing whether your model fits resident in GPU VRAM or requires Soup's signature `stream_layers: true` to run on 4GB laptop GPUs.
5. **💬 In-Browser Test Playground:** Direct model inference testing inside the dashboard before team rollout.

---

## 🎨 Design & Palette
Designed with an **OLED Midnight Obsidian** color palette, warm Soup ember accents (`#ff6b35`), glowing status indicators, and responsive glassmorphism cards.

---

## ⚡ Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/programmerbaddie/soup-studio.git
cd soup-studio
pip install -r backend/requirements.txt
```

### 2. Launch Soup Studio

```bash
python run_studio.py
```
> The dashboard will automatically launch at `http://127.0.0.1:8899`.

---

## 📁 Repository Layout

```
soup-studio/
├── backend/
│   ├── export_service.py     # Checkpoint inspector, Ollama bridge, Modelfile generator
│   ├── requirements.txt      # FastAPI, httpx, uvicorn
│   └── server.py             # FastAPI backend server with SSE streaming
├── frontend/
│   ├── app.js                # Frontend controller, Recipe Explorer & VRAM calculator
│   ├── index.html            # Web dashboard (Dark-mode, responsive)
│   └── style.css             # OLED Midnight Obsidian styling
├── output/
│   └── llama3-soup-demo/     # Demo checkpoint for immediate testing
├── soup_drop_in/             # Drop-in snippets to contribute directly to Soup upstream
│   ├── export_api_snippet.py # FastAPI route snippet for src/soup_cli/ui/app.py
│   └── PR_PITCH.md           # Pull Request proposal for MakazhanAlpamys/Soup
├── run_studio.py             # One-command quick launcher
└── README.md                 # Documentation
```

---

## 🤝 Contributing Directly to Soup (`MakazhanAlpamys/Soup`)

Check out [`soup_drop_in/PR_PITCH.md`](soup_drop_in/PR_PITCH.md) for instructions on how to submit this feature directly to Soup's official repository!

---

## 📜 License
Apache-2.0 License. Compatible with the official Soup repository.
