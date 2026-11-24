"""Quick launcher for Soup Studio."""

import os
import sys
import webbrowser
from pathlib import Path
import uvicorn

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

def main():
    port = 8899
    host = "127.0.0.1"
    url = f"http://{host}:{port}"

    print("=" * 65)
    print("🍲  Soup Studio — Visual Model Exporter & Deployment Hub")
    print(f"📡  Server starting on: {url}")
    print("✨  Opening browser automatically...")
    print("=" * 65)

    # Open browser after a slight delay
    import threading
    import time
    def open_browser():
        time.sleep(1.2)
        webbrowser.open(url)

    threading.Thread(target=open_browser, daemon=True).start()

    from server import app
    uvicorn.run(app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    main()
