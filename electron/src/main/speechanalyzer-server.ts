/**
 * SpeechAnalyzer local server management
 * Manages SpeechAnalyzer helper app lifecycle for local transcription on macOS 26+
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { app } from 'electron';

const SPEECHANALYZER_PORT = 50061;
const SPEECHANALYZER_HOST = 'localhost';
const HEALTH_CHECK_TIMEOUT = 30000; // 30 seconds (no model download needed)
const HEALTH_CHECK_INTERVAL = 1000; // Check every 1 second

let speechAnalyzerProcess: ChildProcess | null = null;
let isServerReady = false;
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 3;

/**
 * Get SpeechAnalyzer helper path (bundled with app)
 * In dev: electron/speechanalyzer-helper/build
 * In production: NarraFlow.app/Contents/Resources/NarraFlowSpeechAnalyzer.app
 */
function getSpeechAnalyzerPath(): string {
  const isDev = process.env.NODE_ENV === 'development' || process.env.APP_ENV === 'dev';

  if (isDev) {
    // Development: use binary in speechanalyzer-helper/build
    // app.getAppPath() returns the electron directory in dev
    const devPath = path.join(
      app.getAppPath(),
      'speechanalyzer-helper',
      'build',
      'NarraFlowSpeechAnalyzer.app',
      'Contents',
      'MacOS',
      'NarraFlowSpeechAnalyzer'
    );
    console.log('[SpeechAnalyzer] Dev mode - using binary at:', devPath);
    return devPath;
  } else {
    // Production: use bundled binary in app resources (extraResources in electron-builder)
    const prodPath = path.join(
      process.resourcesPath,
      'NarraFlowSpeechAnalyzer.app',
      'Contents',
      'MacOS',
      'NarraFlowSpeechAnalyzer'
    );
    console.log('[SpeechAnalyzer] Production mode - using binary at:', prodPath);
    return prodPath;
  }
}

/**
 * Check if SpeechAnalyzer server is responding
 */
async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`http://${SPEECHANALYZER_HOST}:${SPEECHANALYZER_PORT}/health`, {
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
      console.log('[SpeechAnalyzer] Server is ready');
      isServerReady = true;
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, HEALTH_CHECK_INTERVAL));
  }

  console.error('[SpeechAnalyzer] Server failed to start within timeout');
  return false;
}

/**
 * Start SpeechAnalyzer server
 */
export async function startSpeechAnalyzerServer(): Promise<boolean> {
  if (speechAnalyzerProcess) {
    console.log('[SpeechAnalyzer] Server already running');
    return isServerReady;
  }

  try {
    console.log('[SpeechAnalyzer] Starting server...');

    const speechAnalyzerPath = getSpeechAnalyzerPath();

    console.log(`[SpeechAnalyzer] Port: ${SPEECHANALYZER_PORT}`);
    console.log(`[SpeechAnalyzer] Path: ${speechAnalyzerPath}`);

    // Spawn SpeechAnalyzer server
    console.log('[SpeechAnalyzer] Starting SpeechAnalyzer helper...');
    speechAnalyzerProcess = spawn(speechAnalyzerPath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    });

    // Set encoding to get strings instead of buffers
    if (speechAnalyzerProcess.stdout) {
      speechAnalyzerProcess.stdout.setEncoding('utf8');
    }
    if (speechAnalyzerProcess.stderr) {
      speechAnalyzerProcess.stderr.setEncoding('utf8');
    }

    // Handle stdout
    speechAnalyzerProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log('[SpeechAnalyzer STDOUT]', output);
      }
    });

    // Handle stderr
    speechAnalyzerProcess.stderr?.on('data', (data) => {
      const error = data.toString().trim();
      if (error) {
        console.error('[SpeechAnalyzer STDERR]', error);
      }
    });

    // Handle process exit
    speechAnalyzerProcess.on('exit', (code, signal) => {
      console.log(`[SpeechAnalyzer] Server exited with code ${code}, signal ${signal}`);
      speechAnalyzerProcess = null;
      isServerReady = false;

      // Auto-restart if unexpected exit and haven't exceeded max attempts
      if (code !== 0 && restartAttempts < MAX_RESTART_ATTEMPTS) {
        restartAttempts++;
        console.log(
          `[SpeechAnalyzer] Attempting restart (${restartAttempts}/${MAX_RESTART_ATTEMPTS})...`
        );
        setTimeout(() => {
          startSpeechAnalyzerServer();
        }, 2000);
      } else if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
        console.error('[SpeechAnalyzer] Max restart attempts reached. Giving up.');
      }
    });

    // Handle process errors
    speechAnalyzerProcess.on('error', (error) => {
      console.error('[SpeechAnalyzer] Failed to start server:', error);
      speechAnalyzerProcess = null;
      isServerReady = false;
    });

    // Wait for server to be ready
    const ready = await waitForServerReady();

    if (ready) {
      restartAttempts = 0; // Reset restart counter on successful start
      console.log('[SpeechAnalyzer] Server started successfully');
      return true;
    } else {
      // Server didn't respond, kill the process
      if (speechAnalyzerProcess) {
        speechAnalyzerProcess.kill();
        speechAnalyzerProcess = null;
      }
      return false;
    }
  } catch (error) {
    console.error('[SpeechAnalyzer] Error starting server:', error);
    speechAnalyzerProcess = null;
    isServerReady = false;
    return false;
  }
}

/**
 * Stop SpeechAnalyzer server
 */
export function stopSpeechAnalyzerServer(): void {
  if (!speechAnalyzerProcess) {
    return;
  }

  console.log('[SpeechAnalyzer] Stopping server...');

  try {
    speechAnalyzerProcess.kill('SIGTERM');

    // Force kill after 5 seconds if not stopped
    setTimeout(() => {
      if (speechAnalyzerProcess && !speechAnalyzerProcess.killed) {
        console.log('[SpeechAnalyzer] Force killing server...');
        speechAnalyzerProcess.kill('SIGKILL');
      }
    }, 5000);
  } catch (error) {
    console.error('[SpeechAnalyzer] Error stopping server:', error);
  }

  speechAnalyzerProcess = null;
  isServerReady = false;
}

/**
 * Check if server is ready
 */
export function isSpeechAnalyzerReady(): boolean {
  return isServerReady;
}

/**
 * Get SpeechAnalyzer server URL
 */
export function getSpeechAnalyzerURL(): string {
  return `http://${SPEECHANALYZER_HOST}:${SPEECHANALYZER_PORT}`;
}
