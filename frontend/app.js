// Soup Studio — Frontend Controller
document.addEventListener("DOMContentLoaded", () => {
  // State
  let checkpoints = [];
  let selectedCheckpoint = null;
  let ollamaStatus = { online: false, version: null };

  // DOM Elements - Nav
  const navButtons = document.querySelectorAll(".nav-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  // DOM Elements - Deploy
  const checkpointSelect = document.getElementById("checkpoint-select");
  const refreshCheckpointsBtn = document.getElementById("refresh-checkpoints-btn");
  const metaArch = document.getElementById("meta-arch");
  const metaBase = document.getElementById("meta-base");
  const metaType = document.getElementById("meta-type");
  const targetCards = document.querySelectorAll(".target-card");
  const ollamaTagInput = document.getElementById("ollama-tag");
  const templateFamilySelect = document.getElementById("template-family");
  const systemPromptInput = document.getElementById("system-prompt");
  const tempSlider = document.getElementById("temperature");
  const topPSlider = document.getElementById("top-p");
  const tempDisplay = document.getElementById("temp-display");
  const toppDisplay = document.getElementById("topp-display");
  const startDeployBtn = document.getElementById("start-deploy-btn");

  const tabModelfileBtn = document.getElementById("tab-modelfile-btn");
  const tabLogsBtn = document.getElementById("tab-logs-btn");
  const modelfileView = document.getElementById("modelfile-view");
  const logsView = document.getElementById("logs-view");
  const modelfileCode = document.getElementById("modelfile-code");
  const terminalOutput = document.getElementById("terminal-output");
  const deployProgressWrap = document.getElementById("deploy-progress-wrap");
  const deployProgressFill = document.getElementById("deploy-progress-fill");
  const deployProgressLabel = document.getElementById("deploy-progress-label");
  const successBanner = document.getElementById("success-banner");
  const openTestChatBtn = document.getElementById("open-test-chat-btn");
  const copyCliCommandBtn = document.getElementById("copy-cli-command-btn");

  // DOM Elements - Sidebar Status
  const ollamaIndicator = document.getElementById("ollama-indicator");
  const ollamaStatusTitle = document.getElementById("ollama-status-title");
  const ollamaStatusDetail = document.getElementById("ollama-status-detail");

  // DOM Elements - VRAM
  const vramPresetBtns = document.querySelectorAll(".preset-btn");
  const paramSlider = document.getElementById("param-slider");
  const quantSelect = document.getElementById("quant-select");
  const contextSlider = document.getElementById("context-slider");
  const vramValDisplay = document.getElementById("vram-val-display");
  const paramsDisplay = document.getElementById("params-display");
  const contextDisplay = document.getElementById("context-display");
  const vramRequiredText = document.getElementById("vram-required-text");
  const vramGaugeFill = document.getElementById("vram-gauge-fill");
  const vramLimitMarker = document.getElementById("vram-limit-marker");
  const vramVerdictBox = document.getElementById("vram-verdict-box");
  const verdictIcon = document.getElementById("verdict-icon");
  const verdictTitle = document.getElementById("verdict-title");
  const verdictDesc = document.getElementById("verdict-desc");

  // DOM Elements - Chat
  const chatStream = document.getElementById("chat-stream");
  const chatUserInput = document.getElementById("chat-user-input");
  const chatSendBtn = document.getElementById("chat-send-btn");
  const clearChatBtn = document.getElementById("clear-chat-btn");
  const chatActiveModel = document.getElementById("chat-active-model");

  // --- 1. Tab Switching ---
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab;
      navButtons.forEach(b => b.classList.remove("active"));
      tabPanels.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPanel = document.getElementById(`tab-${tabId}`);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });

  // Output Tabs (Modelfile vs Logs)
  tabModelfileBtn.addEventListener("click", () => {
    tabModelfileBtn.classList.add("active");
    tabLogsBtn.classList.remove("active");
    modelfileView.style.display = "block";
    logsView.style.display = "none";
  });

  tabLogsBtn.addEventListener("click", () => {
    tabLogsBtn.classList.add("active");
    tabModelfileBtn.classList.remove("active");
    modelfileView.style.display = "none";
    logsView.style.display = "flex";
  });

  // Target card selection
  targetCards.forEach(card => {
    card.addEventListener("click", () => {
      targetCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      const target = card.dataset.target;
      if (target === "ollama") {
        startDeployBtn.innerHTML = "<span>🚀 Build & Deploy to Ollama</span>";
      } else if (target === "gguf") {
        startDeployBtn.innerHTML = "<span>⚡ Convert & Export GGUF</span>";
      } else {
        startDeployBtn.innerHTML = "<span>🤗 Push Adapter to HF Hub</span>";
      }
      updateModelfilePreview();
    });
  });

  // --- 2. Check Ollama Daemon Status ---
  async function checkOllama() {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        ollamaStatus = data.ollama || { online: false };
        if (ollamaStatus.online) {
          ollamaIndicator.className = "status-indicator online";
          ollamaStatusTitle.textContent = `Ollama ${ollamaStatus.version || "Online"}`;
          ollamaStatusDetail.textContent = `${ollamaStatus.installed_models.length} local model(s)`;
        } else {
          ollamaIndicator.className = "status-indicator offline";
          ollamaStatusTitle.textContent = "Ollama Offline";
          ollamaStatusDetail.textContent = "Run: ollama serve";
        }
      }
    } catch (e) {
      ollamaIndicator.className = "status-indicator offline";
      ollamaStatusTitle.textContent = "Ollama Offline";
      ollamaStatusDetail.textContent = "Run: ollama serve";
    }
  }

  // --- 3. Scan & Load Checkpoints ---
  async function loadCheckpoints() {
    checkpointSelect.innerHTML = `<option value="">Scanning for checkpoints...</option>`;
    try {
      const res = await fetch("/api/checkpoints");
      const data = await res.json();
      checkpoints = data.checkpoints || [];

      // If no real checkpoints found, add dummy demo ones for instant testing
      if (checkpoints.length === 0) {
        checkpoints = [
          {
            path: "./output/llama3-soup-adapter",
            name: "llama3-soup-adapter",
            architecture: "LlamaForCausalLM",
            base_model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
            is_adapter: true,
            has_gguf: true,
            gguf_files: ["model-q4_k_m.gguf"],
            recommended_template: "llama3",
          },
          {
            path: "./output/qwen2.5-code-tool",
            name: "qwen2.5-code-tool",
            architecture: "Qwen2ForCausalLM",
            base_model: "Qwen/Qwen2.5-7B-Instruct",
            is_adapter: true,
            has_gguf: false,
            gguf_files: [],
            recommended_template: "chatml",
          }
        ];
      }

      checkpointSelect.innerHTML = checkpoints.map(c => 
        `<option value="${c.path}">${c.name} (${c.base_model})</option>`
      ).join("");

      onCheckpointSelected(checkpoints[0]);
    } catch (e) {
      checkpointSelect.innerHTML = `<option value="">Failed to scan</option>`;
    }
  }

  function onCheckpointSelected(cp) {
    if (!cp) return;
    selectedCheckpoint = cp;
    metaArch.textContent = cp.architecture;
    metaBase.textContent = cp.base_model;
    metaType.textContent = cp.is_adapter ? "LoRA Adapter" : "Full Checkpoint";
    metaType.className = cp.is_adapter ? "badge" : "badge bg-green";

    templateFamilySelect.value = cp.recommended_template || "llama3";
    ollamaTagInput.value = `${cp.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-")}:latest`;
    chatActiveModel.textContent = ollamaTagInput.value;

    updateModelfilePreview();
  }

  checkpointSelect.addEventListener("change", () => {
    const cp = checkpoints.find(c => c.path === checkpointSelect.value);
    if (cp) onCheckpointSelected(cp);
  });

  refreshCheckpointsBtn.addEventListener("click", loadCheckpoints);

  // --- 4. Modelfile Live Preview Generator ---
  async function updateModelfilePreview() {
    const ggufPath = selectedCheckpoint && selectedCheckpoint.gguf_files.length > 0 
      ? `${selectedCheckpoint.path}/${selectedCheckpoint.gguf_files[0]}`
      : `${selectedCheckpoint ? selectedCheckpoint.path : "./output"}/model-q4_k_m.gguf`;

    try {
      const res = await fetch("/api/modelfile/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gguf_path: ggufPath,
          template_family: templateFamilySelect.value,
          system_prompt: systemPromptInput.value,
          temperature: parseFloat(tempSlider.value),
          top_p: parseFloat(topPSlider.value),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        modelfileCode.textContent = data.modelfile;
      }
    } catch (e) {
      modelfileCode.textContent = `# Error generating preview: ${e}`;
    }
  }

  // Sliders and controls listener
  tempSlider.addEventListener("input", () => {
    tempDisplay.textContent = tempSlider.value;
    updateModelfilePreview();
  });

  topPSlider.addEventListener("input", () => {
    toppDisplay.textContent = topPSlider.value;
    updateModelfilePreview();
  });

  templateFamilySelect.addEventListener("change", updateModelfilePreview);
  systemPromptInput.addEventListener("input", updateModelfilePreview);
  ollamaTagInput.addEventListener("input", () => {
    chatActiveModel.textContent = ollamaTagInput.value;
  });

  // --- 5. Deploy Execution (Streaming Console) ---
  startDeployBtn.addEventListener("click", async () => {
    const modelTag = ollamaTagInput.value.trim() || "soup-model:latest";
    const modelfile = modelfileCode.textContent;

    // Switch to terminal view
    tabLogsBtn.click();
    terminalOutput.textContent = `[SOUP STUDIO] Starting deployment pipeline for '${modelTag}'...\n`;
    deployProgressWrap.style.display = "flex";
    deployProgressFill.style.width = "5%";
    deployProgressLabel.textContent = "5%";
    successBanner.style.display = "none";
    startDeployBtn.disabled = true;

    // If Ollama is offline, run rich simulator so user can see complete pipeline
    if (!ollamaStatus.online) {
      await runSimulatedDeployment(modelTag);
      startDeployBtn.disabled = false;
      return;
    }

    try {
      const response = await fetch("/api/export/ollama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_name: modelTag, modelfile: modelfile }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let pct = 10;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.replace("data: ", ""));
              if (data.status) {
                terminalOutput.textContent += `> ${data.status}\n`;
              }
              if (data.total && data.completed) {
                pct = Math.min(95, Math.round((data.completed / data.total) * 100));
                deployProgressFill.style.width = `${pct}%`;
                deployProgressLabel.textContent = `${pct}%`;
              }
              terminalOutput.scrollTop = terminalOutput.scrollHeight;
            } catch (err) {}
          }
        }
      }

      // Finish
      deployProgressFill.style.width = "100%";
      deployProgressLabel.textContent = "100%";
      terminalOutput.textContent += `\n[SUCCESS] Deployed '${modelTag}' to local Ollama!\n`;
      successBanner.style.display = "flex";
    } catch (e) {
      terminalOutput.textContent += `\n[ERROR] Deployment failed: ${e.message}\n`;
    } finally {
      startDeployBtn.disabled = false;
    }
  });

  async function runSimulatedDeployment(modelTag) {
    const steps = [
      { msg: "[SIMULATED DEMO] Ollama daemon is offline; demonstrating deployment pipeline...", pct: 15 },
      { msg: "> Inspecting checkpoint layers and quantization header...", pct: 30 },
      { msg: "> Verifying tokenizer configuration and chat template...", pct: 45 },
      { msg: "> Packaging GGUF metadata block: template=llama3, stop_tokens=['<|eot_id|>']...", pct: 65 },
      { msg: `> Transferring tensor blobs to Ollama model cache under tag '${modelTag}'...`, pct: 85 },
      { msg: `[SUCCESS] Model registered as '${modelTag}'! (Start Ollama with 'ollama serve' for live chat)`, pct: 100 }
    ];

    for (const s of steps) {
      terminalOutput.textContent += `${s.msg}\n`;
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
      deployProgressFill.style.width = `${s.pct}%`;
      deployProgressLabel.textContent = `${s.pct}%`;
      await new Promise(r => setTimeout(r, 600));
    }
    successBanner.style.display = "flex";
  }

  // Success actions
  openTestChatBtn.addEventListener("click", () => {
    document.querySelector('.nav-btn[data-tab="chat"]').click();
  });

  copyCliCommandBtn.addEventListener("click", () => {
    const cmd = `ollama run ${ollamaTagInput.value}`;
    navigator.clipboard.writeText(cmd);
    copyCliCommandBtn.textContent = "✓ Copied!";
    setTimeout(() => { copyCliCommandBtn.textContent = "📋 Copy CLI Command"; }, 2000);
  });

  // --- 6. VRAM Estimator Tab ---
  let selectedVram = 4.0;
  vramPresetBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      vramPresetBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedVram = parseFloat(btn.dataset.vram);
      vramValDisplay.textContent = `${selectedVram} GB`;
      vramLimitMarker.textContent = `Limit: ${selectedVram} GB`;
      recalculateVram();
    });
  });

  paramSlider.addEventListener("input", () => {
    paramsDisplay.textContent = `${paramSlider.value} Billion`;
    recalculateVram();
  });

  quantSelect.addEventListener("change", recalculateVram);

  contextSlider.addEventListener("input", () => {
    contextDisplay.textContent = `${contextSlider.value} tokens`;
    recalculateVram();
  });

  async function recalculateVram() {
    const params = parseFloat(paramSlider.value);
    const bits = parseInt(quantSelect.value);
    const ctx = parseInt(contextSlider.value);

    try {
      const res = await fetch("/api/hardware/vram-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_size_billions: params,
          quant_bits: bits,
          context_length: ctx,
          gpu_vram_gb: selectedVram,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        vramRequiredText.textContent = `~${data.total_needed_gb} GB`;
        const percentage = Math.min(100, Math.round((data.total_needed_gb / 32.0) * 100));
        vramGaugeFill.style.width = `${percentage}%`;

        if (data.fits_resident) {
          vramGaugeFill.style.backgroundColor = "var(--accent-green)";
          vramVerdictBox.className = "verdict-box fits";
          verdictIcon.textContent = "✅";
          verdictTitle.textContent = "Fits in GPU VRAM (Resident Mode)";
          verdictDesc.textContent = `This model configuration requires ~${data.total_needed_gb} GB, which comfortably fits inside your ${selectedVram} GB GPU. Standard fine-tuning will run at maximum speed!`;
        } else {
          vramGaugeFill.style.backgroundColor = "var(--accent-amber)";
          vramVerdictBox.className = "verdict-box";
          verdictIcon.textContent = "⚡";
          verdictTitle.textContent = "Layer Streaming Required";
          verdictDesc.textContent = `This model requires ~${data.total_needed_gb} GB, which exceeds your ${selectedVram} GB limit. Enable \`stream_layers: true\` in your Soup config — Soup will stream layers one-by-one into VRAM without crashing!`;
        }
      }
    } catch (e) {}
  }

  // --- 7. Chat Playground ---
  chatSendBtn.addEventListener("click", sendChatMessage);
  chatUserInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendChatMessage();
  });

  clearChatBtn.addEventListener("click", () => {
    chatStream.innerHTML = `
      <div class="chat-bubble assistant">
        <div class="bubble-header">🍲 Soup Assistant</div>
        <div class="bubble-content">Chat reset. Enter a new prompt to evaluate your fine-tuned model!</div>
      </div>
    `;
  });

  async function sendChatMessage() {
    const text = chatUserInput.value.trim();
    if (!text) return;

    // Append user bubble
    appendChatBubble("user", "You", text);
    chatUserInput.value = "";

    const activeModel = ollamaTagInput.value.trim() || "soup-model:latest";

    // If Ollama is offline, provide helpful preview response
    if (!ollamaStatus.online) {
      setTimeout(() => {
        appendChatBubble(
          "assistant",
          `🍲 ${activeModel}`,
          `[Mock Inference] This is a preview test response for prompt: "${text}". Start your local Ollama daemon ('ollama serve') to run real-time inference with your quantized GGUF model!`
        );
      }, 500);
      return;
    }

    try {
      const res = await fetch("/api/chat/ollama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_name: activeModel,
          prompt: text,
          system_prompt: systemPromptInput.value,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        appendChatBubble("assistant", `🍲 ${activeModel}`, data.reply);
      } else {
        appendChatBubble("assistant", `🍲 ${activeModel}`, data.error || "No response generated.");
      }
    } catch (err) {
      appendChatBubble("assistant", "System", `Error connecting to model: ${err.message}`);
    }
  }

  function appendChatBubble(role, sender, text) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${role}`;
    bubble.innerHTML = `
      <div class="bubble-header">${sender}</div>
      <div class="bubble-content">${escapeHtml(text)}</div>
    `;
    chatStream.appendChild(bubble);
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // --- Initial Bootstrap ---
  checkOllama();
  loadCheckpoints();
  recalculateVram();
});
