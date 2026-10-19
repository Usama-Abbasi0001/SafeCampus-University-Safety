const express = require('express');
const router = express.Router();
const { spawn, exec } = require('child_process');
const path = require('path');

let aiProcess = null;
let starting = false;

// Helper to check if AI server port 5001 is responding
async function checkAiHealth() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 600);
    const resp = await fetch('http://127.0.0.1:5001/health', { signal: controller.signal });
    clearTimeout(timeout);
    if (resp.ok) {
      const data = await resp.json();
      return { isRunning: true, isReady: true, cameraOpen: data.camera_open };
    }
  } catch (e) {}
  return { isRunning: !!aiProcess, isReady: false, cameraOpen: false };
}

// Get current status of AI
router.get('/status', async (req, res) => {
  const status = await checkAiHealth();
  res.json(status);
});

// Start the AI Engine
router.post('/start', async (req, res) => {
  const currentStatus = await checkAiHealth();
  if (currentStatus.isReady) {
    return res.json({ message: 'AI Engine is already active', isRunning: true, isReady: true });
  }

  if (starting || aiProcess) {
    return res.json({ message: 'AI Engine is booting up...', isRunning: true, isReady: false });
  }

  starting = true;

  const aiDir = path.join(__dirname, '..', '..', 'ai_module');
  const pythonExecutable = path.join(aiDir, 'venv', 'Scripts', 'python.exe');

  aiProcess = spawn(pythonExecutable, ['main_ai.py'], {
    cwd: aiDir,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8', TF_ENABLE_ONEDNN_OPTS: '0', TF_CPP_MIN_LOG_LEVEL: '3' }
  });

  aiProcess.stdout.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg) console.log(`[AI] ${msg}`);
  });

  aiProcess.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    const isNormalLog = msg.includes('HTTP/1.') || 
                        msg.includes('GET /health') || 
                        msg.includes('GET /video_feed') || 
                        msg.includes('127.0.0.1') || 
                        msg.includes('deprecated') || 
                        msg.includes('INFO:') || 
                        msg.includes('Running on') || 
                        msg.includes('development server') || 
                        msg.includes('feedback_manager');
    if (msg && !isNormalLog) {
      console.error(`[AI ERROR] ${msg}`);
    }
  });

  aiProcess.on('close', (code) => {
    console.log(`[AI] Process exited with code ${code}`);
    aiProcess = null;
    starting = false;
  });

  // Give 1.5s for initial socket bind
  setTimeout(async () => {
    starting = false;
  }, 1500);

  res.json({ message: 'AI Engine started successfully', isRunning: true, isReady: false });
});

// Stop the AI Engine
router.post('/stop', (req, res) => {
  if (aiProcess) {
    const pid = aiProcess.pid;
    exec(`taskkill /pid ${pid} /T /F`, () => {
      aiProcess = null;
      starting = false;
    });
  } else {
    exec(`taskkill /F /IM python.exe`, () => {
      aiProcess = null;
      starting = false;
    });
  }

  res.json({ message: 'AI Engine stopped', isRunning: false, isReady: false });
});

module.exports = router;
