const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

let aiProcess = null;
let starting = false;

let killTimeout = null;

// Get current status of AI
router.get('/status', (req, res) => {
  res.json({ isRunning: !!aiProcess });
});

// Start the AI Engine
router.post('/start', (req, res) => {
  if (killTimeout) {
    clearTimeout(killTimeout);
    killTimeout = null;
    return res.status(200).json({ message: 'AI Engine resumed', isRunning: true });
  }

  if (aiProcess || starting) {
    return res.status(200).json({ message: 'AI Engine is already running or starting', isRunning: true });
  }

  starting = true;

  const aiDir = path.join(__dirname, '..', '..', 'ai_module');
  
  // Use python for Windows, with UTF-8 encoding so emojis in logs don't crash the script
  aiProcess = spawn('python', ['main_ai.py'], { 
    cwd: aiDir,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  });

  aiProcess.stdout.on('data', (data) => {
    console.log(`[AI] ${data.toString().trim()}`);
  });

  aiProcess.stderr.on('data', (data) => {
    console.error(`[AI ERROR] ${data.toString().trim()}`);
  });

  aiProcess.on('close', (code) => {
    console.log(`[AI] Process exited with code ${code}`);
    aiProcess = null;
  });

  starting = false;
  res.json({ message: 'AI Engine started successfully', isRunning: true });
});

// Stop the AI Engine
router.post('/stop', (req, res) => {
  if (!aiProcess && !killTimeout) {
    return res.status(400).json({ message: 'AI Engine is not running' });
  }

  if (killTimeout) {
    clearTimeout(killTimeout);
  }

  // Delay the actual kill to handle React double-mount or fast navigation
  killTimeout = setTimeout(() => {
    const { exec } = require('child_process');
    if (aiProcess) {
      // Force kill the specific python process and any children
      exec(`taskkill /pid ${aiProcess.pid} /T /F`, (err) => {
        // Fallback: forcefully kill all python.exe instances if the camera is still locked
        exec(`taskkill /F /IM python.exe`, () => {
          if (aiProcess) {
            try { aiProcess.kill('SIGKILL'); } catch (e) {}
          }
          aiProcess = null;
        });
      });
    }
    killTimeout = null;
  }, 1000); // Reduced delay to 1s so it turns off faster

  res.json({ message: 'AI Engine stop scheduled', isRunning: false });
});

module.exports = router;
