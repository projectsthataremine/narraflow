/**
 * WhisperKit local server management
 * Manages WhisperKit CLI server lifecycle for local transcription
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { app, BrowserWindow } from 'electron';
import fs from 'fs';

const WHISPERKIT_PORT = 50060;
const WHISPERKIT_HOST = 'localhost';
const HEALTH_CHECK_TIMEOUT = 600000; // 10 minutes (to allow for model download)
const HEALTH_CHECK_INTERVAL = 1000; // Check every 1 second
const WHISPERKIT_MODEL = 'large-v3_turbo'; // Fast, high-quality model (note: underscore, not hyphen!)

let whisperKitProcess: ChildProcess | null = null;
let isServerReady = false;
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 3;

// Progress tracking
let settingsWindow: BrowserWindow | null = null;
let progressMonitorInterval: NodeJS.Timeout | null = null;
const EXPECTED_MODEL_SIZE_MB = 3000; // ~3GB expected total download size
const PROGRESS_CHECK_INTERVAL = 2000; // Check every 2 seconds

export function setSettingsWindowForProgress(window: BrowserWindow | null): void {
  settingsWindow = window;
}

/**
 * Send download progress to settings window
 */
function sendDownloadProgress(progress: number, downloaded: number, total: number): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('whisperkit-download-progress', {
      progress,
      downloaded,
      total,
      isDownloading: progress < 100,
    });
  }
}

/**
 * Get WhisperKit CLI path (bundled with app)
 * In dev: electron/resources/whisperkit-cli
 * In production: NarraFlow.app/Contents/Resources/whisperkit-cli
 */
function getWhisperKitPath(): string {
  const isDev = process.env.NODE_ENV === 'development' || process.env.APP_ENV === 'dev';

  if (isDev) {
    // Development: use binary in resources folder
    const devPath = path.join(app.getAppPath(), 'resources', 'whisperkit-cli');
    console.log('[WhisperKit] Using dev binary at:', devPath);
    return devPath;
  } else {
    // Production: use bundled binary in app resources
    const prodPath = path.join(process.resourcesPath, 'whisperkit-cli');
    console.log('[WhisperKit] Using production binary at:', prodPath);
    return prodPath;
  }
}

/**
 * Get model download path (in user data directory)
 * Models are large (~3GB), so we store them in user data
 */
function getModelPath(): string {
  const modelsDir = path.join(app.getPath('userData'), 'whisperkit-models');

  // Create directory if it doesn't exist
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  return modelsDir;
}

/**
 * Check if WhisperKit server is responding
 */
async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`http://${WHISPERKIT_HOST}:${WHISPERKIT_PORT}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for server to be ready
 */
async function waitForServerReady(): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < HEALTH_CHECK_TIMEOUT) {
    if (await checkHealth()) {
      console.log('[WhisperKit] Server is ready');
      isServerReady = true;
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, HEALTH_CHECK_INTERVAL));
  }

  console.error('[WhisperKit] Server failed to start within timeout');
  return false;
}

/**
 * Start WhisperKit server
 */
export async function startWhisperKitServer(): Promise<boolean> {
  if (whisperKitProcess) {
    console.log('[WhisperKit] Server already running');
    return isServerReady;
  }

  try {
    console.log('[WhisperKit] Starting server...');

    const whisperKitPath = getWhisperKitPath();
    const modelPath = getModelPath();

    // Check if model already exists
    const modelExists = fs.existsSync(path.join(modelPath, `openai_whisper-${WHISPERKIT_MODEL}`));

    console.log(`[WhisperKit] Model storage: ${modelPath}`);
    console.log(`[WhisperKit] Model: ${WHISPERKIT_MODEL}`);

    if (modelExists) {
      console.log('[WhisperKit] ✅ Model already downloaded, starting server...');
    } else {
      console.log('[WhisperKit] ⏳ Model needs to be downloaded (~3GB, 5-10 minutes)');
      console.log('[WhisperKit] Download will start automatically...');
    }

    // Spawn WhisperKit server with model download
    whisperKitProcess = spawn(whisperKitPath, [
      'serve',
      '--host',
      WHISPERKIT_HOST,
      '--port',
      WHISPERKIT_PORT.toString(),
      '--model',
      WHISPERKIT_MODEL,
      '--download-model-path',
      modelPath,
      '--verbose', // Enable verbose logging to see download progress
    ]);

    // Handle stdout (includes download progress)
    whisperKitProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        // Parse download progress
        // Look for patterns like: "Downloading... 45%" or "Progress: 1.3GB / 3GB"
        const percentMatch = output.match(/(\d+)%/);
        const sizeMatch = output.match(/(\d+\.?\d*)\s*(MB|GB).*?\/.*?(\d+\.?\d*)\s*(MB|GB)/i);

        if (percentMatch || sizeMatch) {
          let progress = 0;
          let downloaded = 0;
          let total = 3000; // Default 3GB in MB

          if (percentMatch) {
            progress = parseInt(percentMatch[1]);
          }

          if (sizeMatch) {
            const dlValue = parseFloat(sizeMatch[1]);
            const dlUnit = sizeMatch[2].toUpperCase();
            const totalValue = parseFloat(sizeMatch[3]);
            const totalUnit = sizeMatch[4].toUpperCase();

            downloaded = dlUnit === 'GB' ? dlValue * 1024 : dlValue;
            total = totalUnit === 'GB' ? totalValue * 1024 : totalValue;

            if (!percentMatch) {
              progress = Math.round((downloaded / total) * 100);
            }
          }

          sendDownloadProgress(progress, downloaded, total);
          console.log(`[WhisperKit Download] ${progress}% (${(downloaded / 1024).toFixed(2)} GB / ${(total / 1024).toFixed(2)} GB)`);
        } else if (output.includes('Model loaded') || output.includes('Server running')) {
          // Download complete, server ready
          sendDownloadProgress(100, 3000, 3000);
          console.log('[WhisperKit] ✅', output);
        } else if (output.includes('Downloading') || output.includes('Progress')) {
          console.log('[WhisperKit Download]', output);
        } else {
          console.log('[WhisperKit]', output);
        }
      }
    });

    // Handle stderr
    whisperKitProcess.stderr?.on('data', (data) => {
      const error = data.toString().trim();
      if (error) {
        console.error('[WhisperKit Error]', error);
      }
    });

    // Handle process exit
    whisperKitProcess.on('exit', (code, signal) => {
      console.log(`[WhisperKit] Server exited with code ${code}, signal ${signal}`);
      whisperKitProcess = null;
      isServerReady = false;

      // Auto-restart if unexpected exit and haven't exceeded max attempts
      if (code !== 0 && restartAttempts < MAX_RESTART_ATTEMPTS) {
        restartAttempts++;
        console.log(
          `[WhisperKit] Attempting restart (${restartAttempts}/${MAX_RESTART_ATTEMPTS})...`
        );
        setTimeout(() => {
          startWhisperKitServer();
        }, 2000);
      } else if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
        console.error('[WhisperKit] Max restart attempts reached. Giving up.');
      }
    });

    // Handle process errors
    whisperKitProcess.on('error', (error) => {
      console.error('[WhisperKit] Failed to start server:', error);
      whisperKitProcess = null;
      isServerReady = false;
    });

    // Wait for server to be ready
    const ready = await waitForServerReady();

    if (ready) {
      restartAttempts = 0; // Reset restart counter on successful start
      console.log('[WhisperKit] Server started successfully');
      return true;
    } else {
      // Server didn't respond, kill the process
      if (whisperKitProcess) {
        whisperKitProcess.kill();
        whisperKitProcess = null;
      }
      return false;
    }
  } catch (error) {
    console.error('[WhisperKit] Error starting server:', error);
    whisperKitProcess = null;
    isServerReady = false;
    return false;
  }
}

/**
 * Stop WhisperKit server
 */
export function stopWhisperKitServer(): void {
  if (!whisperKitProcess) {
    return;
  }

  console.log('[WhisperKit] Stopping server...');

  try {
    whisperKitProcess.kill('SIGTERM');

    // Force kill after 5 seconds if not stopped
    setTimeout(() => {
      if (whisperKitProcess && !whisperKitProcess.killed) {
        console.log('[WhisperKit] Force killing server...');
        whisperKitProcess.kill('SIGKILL');
      }
    }, 5000);
  } catch (error) {
    console.error('[WhisperKit] Error stopping server:', error);
  }

  whisperKitProcess = null;
  isServerReady = false;
}

/**
 * Check if server is ready
 */
export function isWhisperKitReady(): boolean {
  return isServerReady;
}

/**
 * Get WhisperKit server URL
 */
export function getWhisperKitURL(): string {
  return `http://${WHISPERKIT_HOST}:${WHISPERKIT_PORT}`;
}
