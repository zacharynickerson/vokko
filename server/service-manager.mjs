import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { exec } from 'child_process';
import path from 'path';

let pythonProcess = null;

export function startServices() {
  return new Promise((resolve, reject) => {
    console.log('Starting services...');
    const pythonScript = path.join(__dirname, '..', 'livekitt', 'venv', 'main.py');

    console.log('Starting Python process...');
    console.log('Python script path:', pythonScript);

    // Start with port 8081 and increment if needed
    let port = 8081;
    const maxAttempts = 10;

    function attemptStart(attempt = 0) {
      if (attempt >= maxAttempts) {
        reject(new Error('Failed to start Python script after multiple attempts'));
        return;
      }

      pythonProcess = exec(`python3 "${pythonScript}" dev --port ${port}`);

      pythonProcess.stdout.on('data', (data) => {
        console.log(`Python output: ${data}`);
        if (data.includes('Worker is ready')) {
          console.log(`Python worker is ready on port ${port}`);
          resolve();
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`Python error: ${data}`);
        if (data.includes('address already in use')) {
          console.log(`Port ${port} is in use, trying next port...`);
          port++;
          attemptStart(attempt + 1);
        }
      });
    }

    attemptStart();

    // Timeout as a fallback
    setTimeout(() => {
      console.log('Timeout: Resolving startServices promise');
      resolve();
    }, 30000);
  });
}

export function stopServices() {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
}