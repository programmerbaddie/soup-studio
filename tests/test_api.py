"""Automated End-to-End API Test Suite for Soup Studio."""

import json
import urllib.request

BASE_URL = "http://127.0.0.1:8899"

def test_endpoint(name, url, method="GET", payload=None):
    headers = {"Content-Type": "application/json"}
    data = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.getcode()
            body = resp.read().decode("utf-8")
            print(f"[PASS] {name}: HTTP {status}")
            return status, body
    except Exception as e:
        print(f"[FAIL] {name}: {e}")
        return None, str(e)

print("--- Running Soup Studio Test Suite ---")
test_endpoint("GET Home HTML", f"{BASE_URL}/")
test_endpoint("GET Static CSS", f"{BASE_URL}/static/style.css")
test_endpoint("GET Static JS", f"{BASE_URL}/static/app.js")
test_endpoint("GET Status API", f"{BASE_URL}/api/status")
test_endpoint("GET Checkpoints API", f"{BASE_URL}/api/checkpoints")
test_endpoint(
    "POST Modelfile Generator",
    f"{BASE_URL}/api/modelfile/generate",
    method="POST",
    payload={
        "gguf_path": "./output/model.gguf",
        "template_family": "llama3",
        "system_prompt": "Test system prompt",
        "temperature": 0.7,
        "top_p": 0.9,
    },
)
test_endpoint(
    "POST VRAM Hardware Check",
    f"{BASE_URL}/api/hardware/vram-check",
    method="POST",
    payload={
        "model_size_billions": 8.0,
        "quant_bits": 4,
        "context_length": 4096,
        "gpu_vram_gb": 4.0,
    },
)
test_endpoint(
    "POST Chat (Offline graceful handling)",
    f"{BASE_URL}/api/chat/ollama",
    method="POST",
    payload={
        "model_name": "test-model",
        "prompt": "Hello",
        "system_prompt": "You are a test assistant",
    },
)
print("--- All Tests Completed ---")
