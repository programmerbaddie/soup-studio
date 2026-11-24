<p align="center">
  <h1 align="center">🍲 Soup Studio</h1>
  <p align="center">
    <strong>Visual Model Exporter, Local Deployment Hub & VRAM Estimator for <a href="https://github.com/MakazhanAlpamys/Soup">Soup</a></strong>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-blue" alt="Python Version">
  <img src="https://img.shields.io/badge/Ollama-Local%20Deployment-purple" alt="Ollama">
  <img src="https://img.shields.io/badge/License-Apache%202.0-green" alt="License">
  <img src="https://img.shields.io/badge/Soup%20Compatible-v0.78%2B-orange" alt="Compatibility">
</p>

---

## 💡 What is Soup Studio?

**Soup Studio** bridges the gap between training and deploying fine-tuned LLMs. While [Soup (`MakazhanAlpamys/Soup`)](https://github.com/MakazhanAlpamys/Soup) gives you painless one-command fine-tuning, **Soup Studio** gives your team a modern web interface to:

1. **🚀 1-Click Ollama Deployment:** Turn trained adapters into quantized GGUF models and register them directly with your running local Ollama service.
2. **📝 Auto-Generated Modelfiles:** No more manual configuration. Templates (Llama 3.1, ChatML/Qwen, Mistral) and stop tokens are auto-detected from tokenizer configs.
3. **⚡ Interactive VRAM & Layer Streaming Estimator:** Visual gauge showing whether your model will fit resident in GPU VRAM or requires Soup's signature `stream_layers: true` to train on 4GB laptop GPUs.
4. **💬 In-Browser Test Playground:** Evaluate your deployed model right from the web dashboard before rolling it out to your team.

---

## 📸 Overview Architecture

```
+-------------------------------------------------------------+
|                         Soup Studio                         |
|                                                             |
|   +--------------------+     +--------------------------+   |
|   |   Trained Model    | --> | Auto Modelfile Generator |   |
|   |  (./output/llama3) |     | (ChatML, Llama 3, Stops) |   |
|   +--------------------+     +--------------------------+   |
|             |                             |                 |
|             v                             v                 |
|   +--------------------+     +--------------------------+   |
|   |  VRAM Simulator    |     |  Ollama Daemon (11434)   |   |
|   | (4GB - 24GB Gauge) |     |  Streamed Registration   |   |
|   +--------------------+     +--------------------------+   |
|                                           |                 |
|                                           v                 |
|                              +--------------------------+   |
|                              |   Web Test Playground    |   |
|                              +--------------------------+   |
+-------------------------------------------------------------+
```

---

## ⚡ Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/<your-username>/soup-studio.git
cd soup-studio
pip install -r backend/requirements.txt
```

### 2. Launch Soup Studio

```bash
python run_studio.py
```
> The dashboard will automatically open in your browser at `http://127.0.0.1:8899`.

---

## 📁 Repository Structure

```
soup-studio/
├── backend/
│   ├── export_service.py     # Checkpoint inspector, Ollama bridge, Modelfile generator
│   ├── requirements.txt      # FastAPI, httpx, uvicorn
│   └── server.py             # FastAPI backend server with SSE streaming
├── frontend/
│   ├── app.js                # Frontend controller, VRAM calculator & chat handler
│   ├── index.html            # Web dashboard (Dark-mode, responsive)
│   └── style.css             # Developer-tool styling
├── output/
│   └── llama3-soup-demo/     # Demo checkpoint for immediate out-of-the-box testing
├── soup_drop_in/             # Ready snippets to contribute directly to Soup upstream!
│   ├── export_api_snippet.py # FastAPI route snippet for src/soup_cli/ui/app.py
│   └── PR_PITCH.md           # Ready Pull Request pitch for MakazhanAlpamys/Soup
├── run_studio.py             # One-command quick launcher
└── README.md                 # Documentation
```

---

## 🤝 Contributing Directly to Soup (`MakazhanAlpamys/Soup`)

This project was built to be contributed upstream to the main Soup repository.

Check out [`soup_drop_in/PR_PITCH.md`](soup_drop_in/PR_PITCH.md) for the exact description and instructions on how to submit this feature to Soup's maintainers!

### Pitching to the Soup Team
Join the official **[Soup Discord](https://discord.gg/dgd2pJcjwP)** or open an issue on **[GitHub](https://github.com/MakazhanAlpamys/Soup)**:
> *"Hi @MakazhanAlpamys! I noticed Soup's Web UI currently lacks an Export & Local Deployment tab. I built Soup Studio (`soup export --to ollama` + Web UI Export Hub with live Modelfile generator). Would love to contribute this to `src/soup_cli/ui`!"*

---

## 📜 License
Apache-2.0 License. Compatible with the official Soup repository.
