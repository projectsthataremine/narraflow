/**
 * IPC handlers for main process
 * Handles communication between renderer and main process
 */

import { ipcMain, BrowserWindow, shell } from 'electron';
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
  PillConfig,
  HistoryItem,
} from '../types/ipc-contracts';
import { IPC_CHANNELS } from '../types/ipc-contracts';
import { AudioSessionManager } from '../audio/session';
import { PasteSimulator } from '../paste/paste';
import { SettingsManager } from './settings-manager';
import { registerShortcuts, unregisterShortcuts } from './shortcuts';

let audioSessionManager: AudioSessionManager | null = null;
let transcriptionWorker: Worker | null = null;
let currentMainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let monitorTrackingInterval: NodeJS.Timeout | null = null;
let settingsManager: SettingsManager | null = null;

// Constants for window positioning
const GLOW_SPACE = 40; // 20px top + 20px bottom for glow effect
const BOTTOM_PADDING = 20; // Additional spacing from screen bottom

/**
 * Set overlay window reference
 */
export function setOverlayWindow(window: BrowserWindow): void {
  overlayWindow = window;
}

/**
 * Set settings window reference
 */
export function setSettingsWindow(window: BrowserWindow): void {
  settingsWindow = window;
  console.log('[IPC] Settings window reference set');
}

/**
 * Initialize IPC handlers
 */
export function setupIPCHandlers(mainWindow: BrowserWindow): void {
  currentMainWindow = mainWindow;
  overlayWindow = mainWindow; // Default to mainWindow for now
  audioSessionManager = new AudioSessionManager();
  settingsManager = new SettingsManager();

  // Initialize worker thread
  const workerPath = path.join(__dirname, '../../worker/worker/worker.js');
  console.log('[Main] Initializing worker at:', workerPath);

  transcriptionWorker = new Worker(workerPath);

  transcriptionWorker.on('message', (message) => {
    // Disabled audio pipeline logging for now
    // console.log('[Main] Worker message received:', message.type);
    if (message.type === 'TranscribeResponse') {
      // Handle transcription result
      handleTranscriptionResult(mainWindow, message);
    } else if (message.type === 'TranscribeError') {
      // Send error to renderer
      sendErrorNotification(mainWindow, 'Error, please try again');
    } else if (message.type === 'WorkerReady') {
      // console.log('[Main] Worker ready');
    }
  });

  transcriptionWorker.on('error', (error) => {
    // Disabled for now
    // console.error('[Main] Worker error:', error);
  });

  transcriptionWorker.on('exit', (code) => {
    if (code !== 0) {
      // Disabled for now
      // console.error(`[Main] Worker stopped with exit code ${code}`);
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

  // Handle complete audio data from renderer (sent when recording stops)
  ipcMain.on(IPC_CHANNELS.AUDIO_DATA, (event, data: { audio: number[] }) => {
    console.log(`[Main] Received ${data.audio.length} audio samples for transcription`);

    // Update UI to processing
    if (currentMainWindow) {
      sendUIStateUpdate(currentMainWindow, { mode: 'processing' });
    }

    // Convert from array to Float32Array
    const audioBuffer = new Float32Array(data.audio);

    // Send directly to worker for transcription
    if (transcriptionWorker) {
      console.log('[Main] Sending audio to worker for transcription');
      transcriptionWorker.postMessage({
        type: 'Transcribe',
        audio: audioBuffer,
      });
    } else {
      console.error('[Main] No transcription worker available');
      if (currentMainWindow) {
        sendErrorNotification(currentMainWindow, 'Transcription service unavailable');
      }
    }
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

  // Handle Pill Config Update (forward from settings to overlay)
  ipcMain.on(IPC_CHANNELS.PILL_CONFIG_UPDATE, (event, data: { config: PillConfig }) => {
    console.log('[Main] Saving and forwarding pill config to overlay:', data.config);

    // Save config to disk
    if (settingsManager) {
      settingsManager.setPillConfig(data.config);
    }

    // Forward to overlay window
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send(IPC_CHANNELS.PILL_CONFIG_UPDATE, data);
    }
  });

  // Handle Hotkey Config Update
  ipcMain.on(IPC_CHANNELS.HOTKEY_CONFIG_UPDATE, async (event, data: { config: import('./settings-manager').HotkeyConfig }) => {
    console.log('[Main] Updating hotkey config:', data.config);

    // Save config to disk
    if (settingsManager) {
      settingsManager.setHotkeyConfig(data.config);
    }

    // Dynamically update the keyboard hook
    console.log('[Main] Unregistering old shortcuts...');
    unregisterShortcuts();

    if (overlayWindow) {
      console.log('[Main] Registering new shortcuts...');
      const success = await registerShortcuts(overlayWindow, data.config);
      if (success) {
        console.log('[Main] Hotkey updated successfully to:', data.config.key);
      } else {
        console.error('[Main] Failed to register new hotkey');
      }
    }
  });

  // Handle History Get
  ipcMain.handle(IPC_CHANNELS.HISTORY_GET, async () => {
    if (!settingsManager) {
      return [];
    }
    return settingsManager.getHistory();
  });

  // Handle History Add
  ipcMain.handle(IPC_CHANNELS.HISTORY_ADD, async (event, data: { text: string }) => {
    if (!settingsManager) {
      return null;
    }
    const item = settingsManager.addHistoryItem(data.text);

    // Broadcast update to all windows
    broadcastHistoryUpdate();

    return item;
  });

  // Handle History Delete
  ipcMain.handle(IPC_CHANNELS.HISTORY_DELETE, async (event, data: { id: string }) => {
    if (!settingsManager) {
      return false;
    }
    const success = settingsManager.deleteHistoryItem(data.id);

    if (success) {
      // Broadcast update to all windows
      broadcastHistoryUpdate();
    }

    return success;
  });

  // Handle History Clear
  ipcMain.handle(IPC_CHANNELS.HISTORY_CLEAR, async () => {
    if (!settingsManager) {
      return;
    }
    settingsManager.clearHistory();

    // Broadcast update to all windows
    broadcastHistoryUpdate();
  });

  // Handle Dock Visibility
  ipcMain.handle(IPC_CHANNELS.SET_DOCK_VISIBILITY, async (event, data: { visible: boolean }) => {
    const { app } = require('electron');
    console.log('[Main] SET_DOCK_VISIBILITY called with visible:', data.visible);
    console.log('[Main] Platform:', process.platform);
    if (process.platform === 'darwin') {
      try {
        console.log('[Main] Before dock operation, isVisible:', app.dock.isVisible());
        if (data.visible) {
          await app.dock.show();
          console.log('[Main] After dock.show(), isVisible:', app.dock.isVisible());
        } else {
          app.dock.hide();
          console.log('[Main] After dock.hide(), isVisible:', app.dock.isVisible());
        }

        // Save to settings
        if (settingsManager) {
          settingsManager.setShowInDock(data.visible);
        }

        return true;
      } catch (error) {
        console.error('[Main] Failed to set dock visibility:', error);
        return false;
      }
    }
    console.log('[Main] Not on macOS, returning false');
    return false;
  });

  ipcMain.handle(IPC_CHANNELS.GET_DOCK_VISIBILITY, async () => {
    if (process.platform === 'darwin') {
      // Get from settings, default to true
      if (settingsManager) {
        return settingsManager.getShowInDock();
      }
      return true; // Default to visible
    }
    return false;
  });

  // Handle Reset App
  ipcMain.handle(IPC_CHANNELS.RESET_APP, async () => {
    console.log('[Main] RESET_APP called');
    try {
      if (!settingsManager) {
        console.error('[Main] Settings manager not available');
        return false;
      }

      // Reset all settings to defaults
      settingsManager.resetToDefaults();

      // Relaunch the app
      const { app } = require('electron');
      console.log('[Main] Relaunching app...');
      app.relaunch();
      app.quit();

      return true;
    } catch (error) {
      console.error('[Main] Failed to reset app:', error);
      return false;
    }
  });

  // ========================================================================
  // License Management Handlers
  // ========================================================================

  // Handle Add License Key
  ipcMain.handle(IPC_CHANNELS.LICENSE_ADD_KEY, async (event, data: { licenseKey: string }) => {
    console.log('[Main] LICENSE_ADD_KEY called');
    const { appStore } = require('./AppStore');

    try {
      await appStore.addLicenseKey(data.licenseKey);
      return { success: true };
    } catch (error) {
      console.error('[Main] Failed to add license key:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add license key',
      };
    }
  });

  // Handle Validate License
  ipcMain.handle(IPC_CHANNELS.LICENSE_VALIDATE, async () => {
    console.log('[Main] LICENSE_VALIDATE called');
    const { appStore } = require('./AppStore');

    try {
      await appStore.validateLicense();
      return { success: true };
    } catch (error) {
      console.error('[Main] Failed to validate license:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate license',
      };
    }
  });

  // Handle Get License Status
  ipcMain.handle(IPC_CHANNELS.LICENSE_GET_STATUS, async () => {
    console.log('[Main] LICENSE_GET_STATUS called');
    const { appStore } = require('./AppStore');

    return {
      valid: appStore.getLicenseValid(),
    };
  });

  // ========================================================================
  // Auth & Subscription Handlers (Placeholders for future implementation)
  // ========================================================================

  // Handle Google Sign In
  ipcMain.handle(IPC_CHANNELS.AUTH_SIGNIN_GOOGLE, async () => {
    console.log('[Main] AUTH_SIGNIN_GOOGLE called - OAuth flow would start here');
    // TODO: Implement Google OAuth flow
    // 1. Open OAuth popup window
    // 2. Handle OAuth callback
    // 3. Exchange code for tokens
    // 4. Create/update user in backend
    // 5. Return user object
    return {
      success: false,
      error: 'OAuth not implemented yet',
    };
  });

  // Handle Sign Out
  ipcMain.handle(IPC_CHANNELS.AUTH_SIGNOUT, async () => {
    console.log('[Main] AUTH_SIGNOUT called');
    // TODO: Clear auth tokens, clear local user state
    return { success: true };
  });

  // Handle Delete Account
  ipcMain.handle(IPC_CHANNELS.AUTH_DELETE_ACCOUNT, async () => {
    console.log('[Main] AUTH_DELETE_ACCOUNT called');
    // TODO: Call backend API to delete account, clear local state
    return {
      success: false,
      error: 'Account deletion not implemented yet',
    };
  });

  // Handle Get User
  ipcMain.handle(IPC_CHANNELS.AUTH_GET_USER, async () => {
    console.log('[Main] AUTH_GET_USER called');
    // TODO: Return stored user from local state or fetch from backend
    // For now, return null (not logged in)
    return null;
  });

  // Handle Get Subscription Status
  ipcMain.handle(IPC_CHANNELS.SUBSCRIPTION_GET_STATUS, async () => {
    console.log('[Main] SUBSCRIPTION_GET_STATUS called');
    // TODO: Fetch subscription status from backend
    // Return one of: { type: 'none' } | { type: 'trial', ... } | { type: 'trial_expired', ... } | { type: 'active', ... }
    return { type: 'none' };
  });

  // Handle Create Checkout Session
  ipcMain.handle(IPC_CHANNELS.SUBSCRIPTION_CREATE_CHECKOUT, async () => {
    console.log('[Main] SUBSCRIPTION_CREATE_CHECKOUT called');
    // TODO: Create Stripe checkout session, open in browser
    // 1. Call backend API to create checkout session
    // 2. Open checkout URL in browser
    // 3. Listen for success webhook
    return {
      success: false,
      error: 'Stripe checkout not implemented yet',
    };
  });

  // Handle Open Customer Portal
  ipcMain.handle(IPC_CHANNELS.SUBSCRIPTION_OPEN_PORTAL, async () => {
    console.log('[Main] SUBSCRIPTION_OPEN_PORTAL called');
    // TODO: Create Stripe customer portal session, open in browser
    // 1. Call backend API to create portal session
    // 2. Open portal URL in browser
    return {
      success: false,
      error: 'Stripe portal not implemented yet',
    };
  });

  // Handle Open External URL
  ipcMain.handle('OPEN_EXTERNAL_URL', async (event, data: { url: string }) => {
    console.log('[Main] OPEN_EXTERNAL_URL called with:', data.url);
    try {
      await shell.openExternal(data.url);
      return { success: true };
    } catch (error) {
      console.error('[Main] Failed to open external URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open URL',
      };
    }
  });
}

/**
 * Broadcast history update to all windows
 */
function broadcastHistoryUpdate(): void {
  if (!settingsManager) {
    return;
  }

  const history = settingsManager.getHistory();
  console.log('[IPC] Broadcasting history update, items:', history.length);

  // Send to settings window
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    console.log('[IPC] Sending history update to settings window');
    settingsWindow.webContents.send(IPC_CHANNELS.HISTORY_UPDATE, { history });
  } else {
    console.warn('[IPC] Settings window not available for history update');
  }

  // Send to overlay window
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send(IPC_CHANNELS.HISTORY_UPDATE, { history });
  }
}

/**
 * Get saved pill config (for loading on startup)
 */
export function getSavedPillConfig(): PillConfig | null {
  return settingsManager ? settingsManager.getPillConfig() : null;
}

/**
 * Get saved hotkey config (for loading on startup)
 */
export function getSavedHotkeyConfig(): import('./settings-manager').HotkeyConfig {
  if (settingsManager) {
    return settingsManager.getHotkeyConfig();
  }
  // Return default if settings manager not initialized
  const { UiohookKey } = require('uiohook-napi');
  return {
    modifiers: [],
    key: 'CapsLock',
    keycode: UiohookKey.CapsLock,
  };
}

/**
 * Apply saved dock visibility setting on app startup
 */
export function applySavedDockVisibility(): void {
  if (process.platform !== 'darwin') return;

  const { app } = require('electron');
  const showInDock = settingsManager ? settingsManager.getShowInDock() : true;

  console.log('[Main] Applying saved dock visibility:', showInDock);

  if (showInDock) {
    app.dock.show();
  } else {
    app.dock.hide();
  }
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

    // Add to history
    if (settingsManager) {
      settingsManager.addHistoryItem(finalText);
      broadcastHistoryUpdate();
    }
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

  // Use workArea to account for menu bar and dock
  const { x: workX, y: workY, width: workWidth, height: workHeight } = display.workArea;
  const windowBounds = mainWindow.getBounds();
  const x = workX + Math.floor((workWidth - windowBounds.width) / 2);
  const y = workY + workHeight - windowBounds.height;

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

  // Show window if needed (use showInactive to avoid stealing focus)
  if (state.mode !== 'hidden' && !mainWindow.isVisible()) {
    positionWindowAtCursor(mainWindow);
    mainWindow.showInactive(); // Show WITHOUT stealing focus
    startMonitorTracking(mainWindow);
  } else if (state.mode === 'hidden' && mainWindow.isVisible()) {
    mainWindow.hide();
    stopMonitorTracking();
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
