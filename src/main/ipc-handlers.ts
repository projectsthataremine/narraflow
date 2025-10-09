/**
 * IPC handlers for main process
 * Handles communication between renderer and main process
 */

import { ipcMain, BrowserWindow } from 'electron';
import { Worker } from 'worker_threads';
import path from 'path';
import type {
  StartRecordingRequest,
  StartRecordingResponse,
  StopRecordingRequest,
  StopRecordingResponse,
  PasteTextRequest,
  PasteTextResponse,
  UIState,
} from '../types/ipc-contracts';
import { IPC_CHANNELS } from '../types/ipc-contracts';
import { AudioSessionManager } from '../audio/session';
import { PasteSimulator } from '../paste/paste';

let audioSessionManager: AudioSessionManager | null = null;
let transcriptionWorker: Worker | null = null;
let currentMainWindow: BrowserWindow | null = null;
let monitorTrackingInterval: NodeJS.Timeout | null = null;

/**
 * Initialize IPC handlers
 */
export function setupIPCHandlers(mainWindow: BrowserWindow): void {
  currentMainWindow = mainWindow;
  audioSessionManager = new AudioSessionManager();

  // Initialize worker thread
  const workerPath = path.join(__dirname, '../../worker/worker/worker.js');
  console.log('[Main] Initializing worker at:', workerPath);

  transcriptionWorker = new Worker(workerPath);

  transcriptionWorker.on('message', (message) => {
    console.log('[Main] Worker message received:', message.type);
    if (message.type === 'TranscribeResponse') {
      // Handle transcription result
      handleTranscriptionResult(mainWindow, message);
    } else if (message.type === 'TranscribeError') {
      // Send error to renderer
      sendErrorNotification(mainWindow, 'Error, please try again');
    } else if (message.type === 'WorkerReady') {
      console.log('[Main] Worker ready');
    }
  });

  transcriptionWorker.on('error', (error) => {
    console.error('[Main] Worker error:', error);
  });

  transcriptionWorker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[Main] Worker stopped with exit code ${code}`);
    }
  });

  // Handle StartRecording
  ipcMain.handle(IPC_CHANNELS.START_RECORDING, async (event, request: StartRecordingRequest) => {
    const response: StartRecordingResponse = {
      ok: false,
    };

    try {
      if (!audioSessionManager) {
        response.error = 'Audio session manager not initialized';
        return response;
      }

      const success = audioSessionManager.startSession();
      if (!success) {
        response.error = 'Failed to start recording';
        return response;
      }

      response.ok = true;

      // Update UI state to loading
      sendUIStateUpdate(mainWindow, { mode: 'loading' });

      // Transition to silent after initialization
      setTimeout(() => {
        sendUIStateUpdate(mainWindow, { mode: 'silent', vadProbability: 0.2 });
      }, 100);

      return response;
    } catch (error) {
      response.error = error instanceof Error ? error.message : 'Unknown error';
      return response;
    }
  });

  // Handle audio data chunks from renderer
  ipcMain.on(IPC_CHANNELS.AUDIO_DATA, (event, data: { chunk: number[] }) => {
    if (!audioSessionManager) {
      console.warn('[Main] Received audio chunk but no session manager');
      return;
    }

    // Convert from array to Float32Array
    const chunk = new Float32Array(data.chunk);
    audioSessionManager.addAudioChunk(chunk);
  });

  // Handle StopRecording
  ipcMain.handle(IPC_CHANNELS.STOP_RECORDING, async (event, request: StopRecordingRequest) => {
    const response: StopRecordingResponse = {
      ok: false,
    };

    try {
      if (!audioSessionManager) {
        return response;
      }

      const session = audioSessionManager.stopSession();
      if (!session) {
        return response;
      }

      response.ok = true;
      response.audioSession = session;

      // Update UI to processing
      sendUIStateUpdate(mainWindow, { mode: 'processing' });

      // Send audio to worker for transcription
      if (transcriptionWorker) {
        transcriptionWorker.postMessage({
          type: 'Transcribe',
          audio: session.audioBuffer,
        });
      }

      return response;
    } catch (error) {
      console.error('Error stopping recording:', error);
      return response;
    }
  });

  // Handle PasteText
  ipcMain.handle(IPC_CHANNELS.PASTE_TEXT, async (event, request: PasteTextRequest) => {
    const response: PasteTextResponse = {
      success: false,
    };

    try {
      const success = await PasteSimulator.pasteText(request.text);
      response.success = success;

      // Update UI to hidden
      sendUIStateUpdate(mainWindow, { mode: 'hidden' });

      return response;
    } catch (error) {
      console.error('Error pasting text:', error);
      return response;
    }
  });
}

/**
 * Handle transcription result from worker
 */
async function handleTranscriptionResult(mainWindow: BrowserWindow, result: any): Promise<void> {
  const finalText = result.cleaned ?? result.raw;

  if (finalText.trim().length === 0) {
    // Empty transcription, just hide UI
    sendUIStateUpdate(mainWindow, { mode: 'hidden' });
    return;
  }

  console.log('[Main] Pasting text:', finalText);

  // Paste the text directly
  const success = await PasteSimulator.pasteText(finalText);

  if (success) {
    console.log('[Main] Paste successful');
  } else {
    console.error('[Main] Paste failed');
  }

  // Hide window after paste
  sendUIStateUpdate(mainWindow, { mode: 'hidden' });
}

/**
 * Position window on screen with mouse cursor
 */
function positionWindowAtCursor(mainWindow: BrowserWindow): void {
  const { screen } = require('electron');
  const cursorPoint = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursorPoint);

  // Center horizontally on the display, position near bottom
  const windowBounds = mainWindow.getBounds();
  const x = display.bounds.x + (display.bounds.width - windowBounds.width) / 2;
  const y = display.bounds.y + display.bounds.height - windowBounds.height - 100; // 100px from bottom

  console.log(`Positioning window at (${x}, ${y}) on display ${display.id}`);
  mainWindow.setPosition(Math.floor(x), Math.floor(y));
}

/**
 * Start tracking mouse position to move window across monitors
 */
function startMonitorTracking(mainWindow: BrowserWindow): void {
  if (monitorTrackingInterval) {
    return; // Already tracking
  }

  console.log('[Main] Starting monitor tracking');
  monitorTrackingInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.isVisible()) {
      stopMonitorTracking();
      return;
    }

    positionWindowAtCursor(mainWindow);
  }, 300); // Check every 300ms
}

/**
 * Stop tracking mouse position
 */
function stopMonitorTracking(): void {
  if (monitorTrackingInterval) {
    console.log('[Main] Stopping monitor tracking');
    clearInterval(monitorTrackingInterval);
    monitorTrackingInterval = null;
  }
}

/**
 * Send UI state update to renderer
 */
export function sendUIStateUpdate(mainWindow: BrowserWindow, state: UIState): void {
  console.log('Sending UI state update:', state.mode);

  // Show/hide window based on mode
  if (state.mode !== 'hidden') {
    console.log('Showing window');

    // Position window at cursor
    positionWindowAtCursor(mainWindow);
    mainWindow.show();

    // Start tracking mouse for multi-monitor support
    startMonitorTracking(mainWindow);
  } else {
    console.log('Hiding window');
    stopMonitorTracking();
    mainWindow.hide();
  }

  // Send state to renderer
  mainWindow.webContents.send(IPC_CHANNELS.UI_STATE_UPDATE, { state });
}

/**
 * Send error notification to renderer
 */
export function sendErrorNotification(mainWindow: BrowserWindow, message: string): void {
  mainWindow.webContents.send(IPC_CHANNELS.ERROR_NOTIFICATION, { message });
  sendUIStateUpdate(mainWindow, { mode: 'hidden' });
}

/**
 * Send VAD update to renderer
 */
export function sendVADUpdate(mainWindow: BrowserWindow, probability: number): void {
  mainWindow.webContents.send(IPC_CHANNELS.VAD_UPDATE, { probability });
}

/**
 * Cleanup IPC resources
 */
export function cleanupIPC(): void {
  stopMonitorTracking();
  if (transcriptionWorker) {
    transcriptionWorker.terminate();
    transcriptionWorker = null;
  }
  audioSessionManager = null;
  currentMainWindow = null;
}

/**
 * Direct call to start recording (for shortcuts)
 */
export async function startRecordingDirect(): Promise<boolean> {
  if (!audioSessionManager || !currentMainWindow) {
    console.error('Audio session manager not initialized');
    return false;
  }

  const success = audioSessionManager.startSession();
  if (!success) {
    console.error('Failed to start recording');
    return false;
  }

  // Update UI state to loading
  sendUIStateUpdate(currentMainWindow, { mode: 'loading' });

  // Transition to silent after initialization
  setTimeout(() => {
    if (currentMainWindow) {
      sendUIStateUpdate(currentMainWindow, { mode: 'silent', vadProbability: 0.2 });
    }
  }, 100);

  return true;
}

/**
 * Direct call to stop recording (for shortcuts)
 */
export async function stopRecordingDirect(): Promise<boolean> {
  if (!audioSessionManager || !currentMainWindow) {
    return false;
  }

  const session = audioSessionManager.stopSession();
  if (!session) {
    return false;
  }

  // Update UI to processing
  sendUIStateUpdate(currentMainWindow, { mode: 'processing' });

  // Send audio to worker for transcription
  if (transcriptionWorker) {
    transcriptionWorker.postMessage({
      type: 'Transcribe',
      audio: session.audioBuffer,
    });
  }

  return true;
}
