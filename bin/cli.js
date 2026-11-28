#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');

const PORT = process.env.PORT || 8899;
const ROOT_DIR = path.resolve(__dirname, '..');
const RUN_SCRIPT = path.join(ROOT_DIR, 'run_studio.py');

console.log('\x1b[38;2;255;107;53m');
console.log('  🥣  SOUP STUDIO');
console.log('  ──────────────────────────────────────────');
console.log('  Visual Model Exporter, Recipe Hub & VRAM Estimator');
console.log('\x1b[0m');

// Detect available Python command
function findPython() {
  const candidates = process.platform === 'win32'
    ? ['python', 'py', 'python3']
    : ['python3', 'python'];

  for (const cmd of candidates) {
    try {
      execSync(`${cmd} --version`, { stdio: 'ignore' });
      return cmd;
    } catch (_) {}
  }
  return null;
}

const pythonCmd = findPython();
if (!pythonCmd) {
  console.error('\x1b[31m[Error] Python 3.10+ was not found on your PATH.\x1b[0m');
  console.error('Please install Python from https://python.org and try again.');
  process.exit(1);
}

console.log(`\x1b[90m→ Using Python: ${pythonCmd}\x1b[0m`);
console.log(`\x1b[90m→ Launching Soup Studio backend on http://localhost:${PORT} ...\x1b[0m\n`);

// Open browser helper
function openBrowser(url) {
  const startCmd = process.platform === 'darwin'
    ? 'open'
    : process.platform === 'win32'
      ? 'start'
      : 'xdg-open';
  try {
    execSync(`${startCmd} ${url}`, { stdio: 'ignore' });
  } catch (_) {}
}

// Poll server until ready, then open browser
let opened = false;
function waitForServer() {
  const req = http.get(`http://localhost:${PORT}/api/health`, (res) => {
    if (res.statusCode === 200 && !opened) {
      opened = true;
      console.log(`\n\x1b[32m✔ Soup Studio is running live at http://localhost:${PORT}\x1b[0m`);
      console.log('\x1b[90m→ Press Ctrl+C to stop the studio server.\x1b[0m\n');
      openBrowser(`http://localhost:${PORT}`);
    }
  });

  req.on('error', () => {
    if (!opened) setTimeout(waitForServer, 400);
  });
}

// Spawn Python server
const child = spawn(pythonCmd, [RUN_SCRIPT], {
  cwd: ROOT_DIR,
  stdio: 'inherit',
  env: { ...process.env, PORT: String(PORT) },
});

waitForServer();

// Clean exit on termination
function cleanup() {
  if (child && !child.killed) {
    child.kill('SIGINT');
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

child.on('close', (code) => {
  process.exit(code || 0);
});
