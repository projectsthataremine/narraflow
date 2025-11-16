/**
 * WhisperKit local server management
 * Manages WhisperKit CLI server lifecycle for local transcription
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { app, BrowserWindow } from 'electron';
import fs from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { createWriteStream } from 'fs';
import { exec } from 'child_process';

const execAsync = promisify(exec);
const pipelineAsync = promisify(pipeline);

const WHISPERKIT_PORT = 50060;
const WHISPERKIT_HOST = 'localhost';
const HEALTH_CHECK_TIMEOUT = 600000; // 10 minutes (to allow for model download)
const HEALTH_CHECK_INTERVAL = 1000; // Check every 1 second

// Model configuration - can be changed at runtime
let WHISPERKIT_MODEL = 'small'; // Default to small model

// Model URLs mapped by model name
const MODEL_URLS: Record<string, string> = {
  'large-v3_turbo': 'https://pub-d6cfb88808ed4401bd4488afe9f16ac0.r2.dev/whisperkit-large-v3_turbo.tar.gz',
  'small': 'https://pub-d6cfb88808ed4401bd4488afe9f16ac0.r2.dev/whisperkit-small.tar.gz',
};

// Get R2 URL for current model
function getModelURL(): string {
  return MODEL_URLS[WHISPERKIT_MODEL] || MODEL_URLS['large-v3_turbo'];
}

let whisperKitProcess: ChildProcess | null = null;
let isServerReady = false;
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 3;
let intentionalShutdown = false; // Track if shutdown was intentional (e.g., user deleted model)

// Progress tracking - settings window reference for sending progress updates
let settingsWindow: BrowserWindow | null = null;

/**
 * Get directory size in MB - used for checking if model is complete
 */
function getDirectorySizeMB(dirPath: string): number {
  try {
    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    let totalSize = 0;
    const files = fs.readdirSync(dirPath, { recursive: true });

    for (const file of files) {
      const filePath = path.join(dirPath, file as string);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      } catch (err) {
        continue;
      }
    }

    const sizeMB = totalSize / (1024 * 1024);
    return sizeMB;
  } catch (error) {
    console.error(`[WhisperKit] Error getting directory size:`, error);
    return 0;
  }
}

export function setSettingsWindowForProgress(window: BrowserWindow | null): void {
  settingsWindow = window;
  console.log(`[WhisperKit Progress] Settings window reference ${window ? 'SET' : 'CLEARED'}`);
  if (window) {
    console.log(`[WhisperKit Progress] Settings window ID: ${window.id}, Destroyed: ${window.isDestroyed()}`);
  }
}

/**
 * Send download progress to settings window
 */
function sendDownloadProgress(progress: number, downloaded: number, total: number, isDownloading?: boolean, model?: string): void {
  const downloading = isDownloading !== undefined ? isDownloading : progress < 100;
  const modelName = model || WHISPERKIT_MODEL;
  console.log(`[WhisperKit Progress] Sending progress: ${progress.toFixed(1)}%, Downloaded: ${downloaded.toFixed(0)} MB, Total: ${total} MB, isDownloading: ${downloading}, model: ${modelName}`);
  console.log(`[WhisperKit Progress] Settings window available: ${!!settingsWindow}, Destroyed: ${settingsWindow?.isDestroyed()}`);

  if (settingsWindow && !settingsWindow.isDestroyed()) {
    console.log('[WhisperKit Progress] Sending IPC event to settings window');
    settingsWindow.webContents.send('whisperkit-download-progress', {
      progress,
      downloaded,
      total,
      isDownloading: downloading,
      model: modelName,
    });
  } else {
    console.error('[WhisperKit Progress] Cannot send progress - settings window not available');
  }
}

/**
 * Download WhisperKit model from Cloudflare R2 with real-time progress tracking
 * Much simpler than the previous multi-part GitHub approach!
 */
async function downloadModelFromR2(): Promise<boolean> {
  const modelPath = getModelPath();
  const tarballPath = path.join(modelPath, `whisperkit-${WHISPERKIT_MODEL}.tar.gz`);
  // Extract to the Hugging Face cache directory where WhisperKit expects models
  const extractPath = path.join(modelPath, 'models/argmaxinc/whisperkit-coreml/.cache/huggingface/download');

  try {
    const modelURL = getModelURL();
    console.log('[WhisperKit] Downloading model from Cloudflare R2...');
    console.log('[WhisperKit] Model:', WHISPERKIT_MODEL);
    console.log('[WhisperKit] URL:', modelURL);
    console.log('[WhisperKit] Destination:', tarballPath);

    // Create models directory if it doesn't exist
    if (!fs.existsSync(modelPath)) {
      fs.mkdirSync(modelPath, { recursive: true });
    }

    // Clean up any partial downloads
    if (fs.existsSync(tarballPath)) {
      console.log('[WhisperKit] Removing partial tarball download...');
      fs.unlinkSync(tarballPath);
    }

    // Clean up any partial extractions (< 2GB indicates incomplete for large models)
    const partialModelPath = path.join(extractPath, `openai_whisper-${WHISPERKIT_MODEL}`);
    if (fs.existsSync(partialModelPath)) {
      const stats = fs.statSync(partialModelPath);
      if (stats.isDirectory()) {
        // Check directory size
        let totalSize = 0;
        const files = fs.readdirSync(partialModelPath, { recursive: true });
        for (const file of files) {
          const filePath = path.join(partialModelPath, file as string);
          try {
            const fileStats = fs.statSync(filePath);
            if (fileStats.isFile()) {
              totalSize += fileStats.size;
            }
          } catch (err) {
            continue;
          }
        }

        const sizeMB = totalSize / (1024 * 1024);
        // Only remove if very small (< 100MB) indicating it's incomplete
        if (sizeMB < 100) {
          console.log(`[WhisperKit] Removing partial model extraction (${sizeMB.toFixed(0)} MB)...`);
          fs.rmSync(partialModelPath, { recursive: true, force: true });
        }
      }
    }

    // Download with real-time progress tracking
    const response = await fetch(modelURL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const totalBytes = parseInt(response.headers.get('content-length') || '0');
    const totalMB = totalBytes / (1024 * 1024);

    console.log(`[WhisperKit] Download size: ${totalMB.toFixed(2)} MB`);

    // Create write stream
    const fileStream = createWriteStream(tarballPath);
    const reader = response.body.getReader();
    let downloadedBytes = 0;
    let lastProgressUpdate = 0;

    // Read stream with progress updates
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Write chunk to file
      fileStream.write(value);
      downloadedBytes += value.length;

      // Calculate progress
      const progress = (downloadedBytes / totalBytes) * 100;
      const downloadedMB = downloadedBytes / (1024 * 1024);

      // Send progress update every ~10MB to avoid flooding IPC
      if (downloadedBytes - lastProgressUpdate >= 10 * 1024 * 1024 || progress >= 100) {
        sendDownloadProgress(progress, downloadedMB, totalMB);
        console.log(`[WhisperKit] Download progress: ${progress.toFixed(1)}% (${downloadedMB.toFixed(0)} MB / ${totalMB.toFixed(0)} MB)`);
        lastProgressUpdate = downloadedBytes;
      }
    }

    // Close file stream
    await new Promise((resolve, reject) => {
      fileStream.end((err: Error | null | undefined) => {
        if (err) reject(err);
        else resolve(null);
      });
    });

    console.log('[WhisperKit] Download complete, extracting...');
    sendDownloadProgress(100, totalMB, totalMB);

    // Extract tar.gz
    if (!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath, { recursive: true });
    }

    console.log('[WhisperKit] Extracting to:', extractPath);
    await execAsync(`tar -xzf "${tarballPath}" -C "${extractPath}"`);

    // Delete tarball after extraction
    fs.unlinkSync(tarballPath);

    console.log('[WhisperKit] ✅ Model downloaded and extracted successfully');

    // Send final progress event with isDownloading=false to signal completion
    sendDownloadProgress(100, totalMB, totalMB, false);

    return true;
  } catch (error) {
    console.error('[WhisperKit] Failed to download model from R2:', error);

    // Clean up partial files on error
    if (fs.existsSync(tarballPath)) {
      console.log('[WhisperKit] Cleaning up partial download...');
      try {
        fs.unlinkSync(tarballPath);
      } catch (cleanupError) {
        console.error('[WhisperKit] Failed to clean up tarball:', cleanupError);
      }
    }

    return false;
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

  // Reset intentional shutdown flag when starting server
  intentionalShutdown = false;

  try {
    console.log('[WhisperKit] Starting server...');

    const whisperKitPath = getWhisperKitPath();
    const modelPath = getModelPath();

    // WhisperKit downloads to nested Hugging Face cache path
    const actualModelDir = path.join(
      modelPath,
      'models/argmaxinc/whisperkit-coreml/.cache/huggingface/download',
      `openai_whisper-${WHISPERKIT_MODEL}`
    );

    // Check if model already exists
    const modelExists = fs.existsSync(actualModelDir);

    console.log(`[WhisperKit] Model storage: ${modelPath}`);
    console.log(`[WhisperKit] Model: ${WHISPERKIT_MODEL}`);
    console.log(`[WhisperKit] Actual model path: ${actualModelDir}`);

    if (!modelExists) {
      console.log(`[WhisperKit] ⏳ Model needs to be downloaded (${WHISPERKIT_MODEL})`);
      console.log('[WhisperKit] Downloading from Cloudflare R2...');

      // Download model from Cloudflare R2 (self-hosted)
      const downloaded = await downloadModelFromR2();

      if (!downloaded) {
        console.error('[WhisperKit] Failed to download model');
        return false;
      }
    } else {
      console.log('[WhisperKit] ✅ Model already downloaded');
    }

    // Spawn WhisperKit server (model is already downloaded)
    console.log('[WhisperKit] Starting WhisperKit server...');
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
    ], {
      // Explicitly set stdio to disable buffering
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    });

    // Set encoding to get strings instead of buffers
    if (whisperKitProcess.stdout) {
      whisperKitProcess.stdout.setEncoding('utf8');
    }
    if (whisperKitProcess.stderr) {
      whisperKitProcess.stderr.setEncoding('utf8');
    }

    // Handle stdout (includes download progress)
    whisperKitProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        // Log EVERYTHING from stdout for debugging
        console.log('[WhisperKit STDOUT]', output);

        // Parse download progress
        // Look for patterns like: "Downloading... 45%" or "Progress: 1.3GB / 3GB"
        const percentMatch = output.match(/(\d+)%/);
        const sizeMatch = output.match(/(\d+\.?\d*)\s*(MB|GB).*?\/.*?(\d+\.?\d*)\s*(MB|GB)/i);

        if (percentMatch || sizeMatch) {
          let progress = 0;
          let downloaded = 0;
          let total = 0;

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

          // Only send progress if we have valid size info
          if (total > 0) {
            sendDownloadProgress(progress, downloaded, total);
            console.log(`[WhisperKit Download] ${progress}% (${(downloaded / 1024).toFixed(2)} GB / ${(total / 1024).toFixed(2)} GB)`);
          }
        }
      }
    });

    // Handle stderr
    whisperKitProcess.stderr?.on('data', (data) => {
      const error = data.toString().trim();
      if (error) {
        // Log EVERYTHING from stderr for debugging
        console.error('[WhisperKit STDERR]', error);
      }
    });

    // Handle process exit
    whisperKitProcess.on('exit', (code, signal) => {
      console.log(`[WhisperKit] Server exited with code ${code}, signal ${signal}`);
      whisperKitProcess = null;
      isServerReady = false;

      // Skip auto-restart if this was an intentional shutdown (e.g., user deleted model)
      if (intentionalShutdown) {
        console.log('[WhisperKit] Intentional shutdown, skipping auto-restart');
        intentionalShutdown = false; // Reset flag
        return;
      }

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
 * Stop WhisperKit server - EVENT-BASED, waits for process to actually exit
 */
export function stopWhisperKitServer(): Promise<void> {
  return new Promise((resolve) => {
    if (!whisperKitProcess) {
      resolve();
      return;
    }

    console.log('[WhisperKit] Stopping server...');
    intentionalShutdown = true; // Mark this as an intentional shutdown to prevent auto-restart

    const processToKill = whisperKitProcess;
    let forceKillTimeout: NodeJS.Timeout | undefined;

    // Listen for the exit event - this is the event-based approach
    const onExit = () => {
      console.log('[WhisperKit] Server process exited');
      if (forceKillTimeout) clearTimeout(forceKillTimeout);
      whisperKitProcess = null;
      isServerReady = false;
      resolve();
    };

    processToKill.once('exit', onExit);

    try {
      // Send graceful shutdown signal
      processToKill.kill('SIGTERM');

      // Force kill after 5 seconds if not stopped gracefully
      forceKillTimeout = setTimeout(() => {
        if (processToKill && !processToKill.killed) {
          console.log('[WhisperKit] Force killing server after timeout...');
          processToKill.kill('SIGKILL');
          // The 'exit' event will still fire and resolve the promise
        }
      }, 5000);
    } catch (error) {
      console.error('[WhisperKit] Error stopping server:', error);
      if (forceKillTimeout) clearTimeout(forceKillTimeout);
      whisperKitProcess = null;
      isServerReady = false;
      resolve();
    }
  });
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

/**
 * Check if WhisperKit model exists on disk (and is complete)
 * @param model - Model name to check (defaults to current WHISPERKIT_MODEL)
 */
export function checkWhisperKitModelExists(model?: string): boolean {
  try {
    const modelToCheck = model || WHISPERKIT_MODEL;
    const modelPath = getModelPath();
    const actualModelDir = path.join(
      modelPath,
      'models/argmaxinc/whisperkit-coreml/.cache/huggingface/download',
      `openai_whisper-${modelToCheck}`
    );

    if (!fs.existsSync(actualModelDir)) {
      return false;
    }

    // Check that model is actually complete
    // Small model: at least 400MB, Large model: at least 2GB
    const sizeMB = getDirectorySizeMB(actualModelDir);
    const minSize = modelToCheck === 'small' ? 400 : 2000;
    const isComplete = sizeMB > minSize;

    console.log(`[WhisperKit] Model check for ${modelToCheck}: ${sizeMB.toFixed(0)} MB downloaded, complete: ${isComplete}`);
    return isComplete;
  } catch (error) {
    console.error('[WhisperKit] Failed to check if model exists:', error);
    return false;
  }
}

/**
 * Delete WhisperKit model from disk
 * Used for testing download functionality
 */
export function deleteWhisperKitModel(): boolean {
  try {
    const modelPath = getModelPath();
    // WhisperKit stores models in nested Hugging Face cache
    const actualModelDir = path.join(
      modelPath,
      'models/argmaxinc/whisperkit-coreml/.cache/huggingface/download',
      `openai_whisper-${WHISPERKIT_MODEL}`
    );

    if (fs.existsSync(actualModelDir)) {
      console.log('[WhisperKit] Deleting model directory:', actualModelDir);
      fs.rmSync(actualModelDir, { recursive: true, force: true });
      console.log('[WhisperKit] Model deleted successfully');
      return true;
    } else {
      console.log('[WhisperKit] Model directory does not exist:', actualModelDir);
      return false;
    }
  } catch (error) {
    console.error('[WhisperKit] Failed to delete model:', error);
    return false;
  }
}

/**
 * Set the initial model from settings (called on app startup)
 */
export function setInitialModel(model: string): void {
  console.log(`[WhisperKit] Setting initial model to: ${model}`);
  WHISPERKIT_MODEL = model;
}

/**
 * Switch to a different WhisperKit model
 * Downloads the model if needed and restarts the server
 */
export async function switchModel(newModel: string): Promise<void> {
  console.log(`[WhisperKit] Switching model from ${WHISPERKIT_MODEL} to ${newModel}`);

  // Update the model variable
  const oldModel = WHISPERKIT_MODEL;
  WHISPERKIT_MODEL = newModel;

  try {
    // Check if new model exists
    const modelPath = getModelPath();
    const newModelDir = path.join(
      modelPath,
      'models/argmaxinc/whisperkit-coreml/.cache/huggingface/download',
      `openai_whisper-${newModel}`
    );

    const modelExists = fs.existsSync(newModelDir);

    if (!modelExists) {
      console.log(`[WhisperKit] Model ${newModel} not found, downloading...`);
      // Download the new model in background
      await downloadModelFromR2();
    } else {
      console.log(`[WhisperKit] Model ${newModel} already exists`);
    }

    // Restart the server with the new model
    console.log('[WhisperKit] Restarting server with new model...');
    await stopWhisperKitServer(); // Wait for old server to fully exit
    console.log('[WhisperKit] Old server stopped, starting new server...');
    await startWhisperKitServer();
    console.log(`[WhisperKit] Successfully switched to ${newModel}`);
  } catch (error) {
    console.error(`[WhisperKit] Failed to switch model:`, error);
    // Revert to old model on error
    WHISPERKIT_MODEL = oldModel;
    throw error;
  }
}
