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
import { getAppEnv, SUPABASE_URL } from './constants';
import { getCurrentSession } from './auth-handler';
import { getAccessManager } from './access-manager';
import { supabase } from './supabase-client';
import { getSystemInfo } from './index';
import { isWhisperKitReady, deleteWhisperKitModel, stopWhisperKitServer, checkWhisperKitModelExists } from './whisperkit-server';
import { isSpeechAnalyzerReady } from './speechanalyzer-server';

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
 * Broadcast access status change to all renderer processes
 */
async function broadcastAccessStatusChanged() {
  const accessManager = getAccessManager();
  const status = await accessManager.getAccessStatus();

  console.log('[IPC] Broadcasting ACCESS_STATUS_CHANGED:', status);

  // Send to overlay window
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('ACCESS_STATUS_CHANGED', status);
  }

  // Send to settings window
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('ACCESS_STATUS_CHANGED', status);
  }
}

/**
 * Export for use in auth-handler
 */
export { broadcastAccessStatusChanged };

/**
 * Handle opening Stripe customer portal
 * Calls the appropriate edge function based on APP_ENV (dev or prod)
 */
async function handleOpenCustomerPortal(stripeCustomerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[Main] Opening customer portal for:', stripeCustomerId);

    // Get current session for authentication
    const session = getCurrentSession();
    if (!session || !session.access_token) {
      console.error('[Main] No active session found');
      return {
        success: false,
        error: 'Not authenticated. Please sign in first.',
      };
    }

    // Determine which edge function to call based on environment
    const env = getAppEnv();
    const functionName = env === 'dev' ? 'create-customer-portal-dev' : 'create-customer-portal';
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/${functionName}`;

    console.log(`[Main] Calling edge function: ${functionName} (env: ${env})`);

    // Call edge function to create customer portal session
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stripe_customer_id: stripeCustomerId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Main] Customer portal creation failed:', response.status, errorText);
      return {
        success: false,
        error: `Failed to create customer portal session: ${errorText}`,
      };
    }

    const result = await response.json() as { url: string };
    console.log('[Main] Customer portal URL received:', result.url);

    // Open portal URL in browser
    await shell.openExternal(result.url);

    return { success: true };
  } catch (error) {
    console.error('[Main] handleOpenCustomerPortal error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

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

  // Load model preference and set it for WhisperKit
  const selectedModel = settingsManager.getWhisperKitModel();
  const { setInitialModel } = require('./whisperkit-server');
  setInitialModel(selectedModel);
  console.log(`[Main] WhisperKit model set to: ${selectedModel}`);

  // Initialize worker thread
  const workerPath = path.join(__dirname, '../../worker/worker/worker.js');
  console.log('[Main] Initializing worker at:', workerPath);

  // Pass environment variables to worker
  transcriptionWorker = new Worker(workerPath, {
    env: {
      ...process.env,
      GROQ_API_KEY: process.env.GROQ_API_KEY
    }
  });

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
      // CHECK ACCESS BEFORE ALLOWING RECORDING
      const accessManager = getAccessManager();
      const accessStatus = await accessManager.getAccessStatus();

      if (!accessStatus.hasValidAccess) {
        response.error = 'Access denied: ' + (accessStatus.reason || 'Trial expired and no valid license');
        console.log('[IPC] Recording blocked:', response.error);
        return response;
      }

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
  ipcMain.on(IPC_CHANNELS.AUDIO_DATA, async (event, data: { audio: number[] }) => {
    console.log(`[Main] Received ${data.audio.length} audio samples for transcription`);

    // Check for empty audio
    if (data.audio.length === 0) {
      console.log('[Main] No audio captured, hiding UI');
      if (currentMainWindow) {
        sendUIStateUpdate(currentMainWindow, { mode: 'hidden' });
      }
      return;
    }

    // Update UI to processing
    if (currentMainWindow) {
      sendUIStateUpdate(currentMainWindow, { mode: 'processing' });
    }

    // Convert from array to Float32Array
    const audioBuffer = new Float32Array(data.audio);

    // Send directly to worker for transcription
    if (transcriptionWorker) {
      console.log('[Main] Sending audio to worker for transcription');
      const enableLlamaFormatting = settingsManager?.getEnableLlamaFormatting() ?? false;
      console.log('[Main] Llama formatting enabled:', enableLlamaFormatting);

      // Determine transcription engine priority:
      // 1. SpeechAnalyzer (macOS 26+ Apple Silicon) - fastest, built-in
      // 2. WhisperKit (local) - fast, works on all Macs
      // 3. Groq (cloud) - fallback
      const systemInfo = getSystemInfo();

      // TEMP: Disable SpeechAnalyzer for testing WhisperKit
      // Check for SpeechAnalyzer first (macOS 26+ only)
      const useSpeechAnalyzer = false; /* !!(
        systemInfo?.canUseSpeechAnalyzer &&
        isSpeechAnalyzerReady()
      ); */

      // Determine provider based on USER SELECTION, not auto-detection
      const selectedModel = settingsManager?.getWhisperKitModel() || 'small';
      const userSelectedGroq = selectedModel === 'groq';

      // Use WhisperKit if user selected small/large (and it's available)
      const useWhisperKit = !useSpeechAnalyzer && !userSelectedGroq && !!(
        systemInfo?.canUseWhisperKit &&
        isWhisperKitReady()
      );

      // Check if we need authentication (only for Groq cloud)
      const needsAuth = !useSpeechAnalyzer && !useWhisperKit;
      let accessToken: string | undefined;

      if (needsAuth) {
        // Get auth session for Groq edge function
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
          console.error('[Main] Not authenticated - cannot use Groq transcription');
          if (currentMainWindow) {
            sendErrorNotification(currentMainWindow, 'Please sign in to use cloud transcription');
            sendUIStateUpdate(currentMainWindow, { mode: 'hidden' });
          }
          return;
        }

        accessToken = session.access_token;
      }

      const chipType = systemInfo?.isAppleSilicon ? 'Apple Silicon' : 'Intel';
      let engineName = 'Groq (cloud)';
      if (useSpeechAnalyzer) {
        engineName = `SpeechAnalyzer (macOS ${systemInfo?.macOSVersion}, ${chipType})`;
      } else if (useWhisperKit) {
        engineName = `WhisperKit (local, ${chipType})`;
      }
      console.log(`[Main] Transcription engine: ${engineName}`);

      transcriptionWorker.postMessage({
        type: 'Transcribe',
        audio: audioBuffer,
        enableLlamaFormatting,
        accessToken, // Pass auth token to worker (undefined for local transcription)
        useSpeechAnalyzer, // Use SpeechAnalyzer if available (macOS 26+)
        useWhisperKit, // Fallback to WhisperKit if SpeechAnalyzer not available
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

      // Note: Audio transcription is handled via AUDIO_DATA IPC channel
      // The renderer will send the complete audio buffer after this

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
    // console.log('[Main] Saving and forwarding pill config to overlay:', data.config);

    // Save config to disk
    if (settingsManager) {
      settingsManager.setPillConfig(data.config);
    }

    // Forward to overlay window
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send(IPC_CHANNELS.PILL_CONFIG_UPDATE, data);
    }
  });

  // Handle Pill Preset Save
  ipcMain.handle('PRESET_SAVE', async (event, data: { name: string; config: PillConfig }) => {
    console.log('[Main] Saving preset:', data.name);
    if (!settingsManager) {
      return null;
    }
    return settingsManager.savePreset(data.name, data.config);
  });

  // Handle Pill Preset Load
  ipcMain.handle('PRESET_LOAD', async (event, data: { id: string }) => {
    console.log('[Main] Loading preset:', data.id);
    if (!settingsManager) {
      return null;
    }
    const config = settingsManager.loadPreset(data.id);

    // Forward to overlay window
    if (config && overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send(IPC_CHANNELS.PILL_CONFIG_UPDATE, { config });
    }

    return config;
  });

  // Handle Pill Preset Delete
  ipcMain.handle('PRESET_DELETE', async (event, data: { id: string }) => {
    console.log('[Main] Deleting preset:', data.id);
    if (!settingsManager) {
      return false;
    }
    return settingsManager.deletePreset(data.id);
  });

  // Handle Pill Preset Get All
  ipcMain.handle('PRESET_GET_ALL', async () => {
    if (!settingsManager) {
      return [];
    }
    return settingsManager.getPresets();
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

  // Handle Llama Formatting Setting
  ipcMain.handle(IPC_CHANNELS.SET_LLAMA_FORMATTING, async (event, data: { enabled: boolean }) => {
    console.log('[Main] SET_LLAMA_FORMATTING called with enabled:', data.enabled);
    if (settingsManager) {
      settingsManager.setEnableLlamaFormatting(data.enabled);
      return true;
    }
    return false;
  });

  ipcMain.handle(IPC_CHANNELS.GET_LLAMA_FORMATTING, async () => {
    if (settingsManager) {
      return settingsManager.getEnableLlamaFormatting();
    }
    return false; // Default to disabled
  });

  // Handle WhisperKit Model Selection
  ipcMain.handle('SET_WHISPERKIT_MODEL', async (event, data: { model: string }) => {
    console.log('[Main] SET_WHISPERKIT_MODEL called with model:', data.model);
    if (settingsManager) {
      settingsManager.setWhisperKitModel(data.model);

      // Only switch WhisperKit server if selecting a local model (small/large)
      // Don't call switchModel for 'groq' since it's cloud-based
      if (data.model !== 'groq') {
        console.log('[Main] Switching WhisperKit to local model:', data.model);
        // Import and call whisperkit-server to handle model switch
        const { switchModel } = await import('./whisperkit-server');
        await switchModel(data.model);
      } else {
        console.log('[Main] User selected Groq cloud - no WhisperKit switch needed');
      }

      // Notify all renderer processes that the model changed
      const { BrowserWindow } = require('electron');
      BrowserWindow.getAllWindows().forEach((win: any) => {
        win.webContents.send('WHISPERKIT_MODEL_CHANGED', { model: data.model });
      });

      return true;
    }
    return false;
  });

  ipcMain.handle('GET_WHISPERKIT_MODEL', async () => {
    if (settingsManager) {
      return settingsManager.getWhisperKitModel();
    }
    return 'small'; // Default to small model
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

  // Handle Delete WhisperKit Model
  ipcMain.handle(IPC_CHANNELS.DELETE_WHISPERKIT_MODEL, async () => {
    console.log('[Main] DELETE_WHISPERKIT_MODEL called');
    try {
      // Stop the server first - EVENT-BASED, waits for actual exit
      console.log('[Main] Stopping WhisperKit server...');
      await stopWhisperKitServer();
      console.log('[Main] Server stopped, proceeding with model deletion');

      // Delete the model
      console.log('[Main] Deleting WhisperKit model...');
      const deleted = deleteWhisperKitModel();

      if (deleted) {
        console.log('[Main] Model deleted successfully. Restart app to re-download.');
        return { success: true, message: 'Model deleted. Restart the app to re-download.' };
      } else {
        console.log('[Main] Model was not found or already deleted.');
        return { success: true, message: 'Model not found (may already be deleted).' };
      }
    } catch (error) {
      console.error('[Main] Failed to delete WhisperKit model:', error);
      return { success: false, error: String(error) };
    }
  });

  // Handle Check WhisperKit Model Exists
  ipcMain.handle(IPC_CHANNELS.CHECK_WHISPERKIT_MODEL, async (_event, args?: { model?: string }) => {
    try {
      const exists = checkWhisperKitModelExists(args?.model);
      return { exists };
    } catch (error) {
      console.error('[Main] Failed to check WhisperKit model:', error);
      return { exists: false };
    }
  });

  // Handle Check Microphone Permission
  ipcMain.handle(IPC_CHANNELS.CHECK_MICROPHONE_PERMISSION, async () => {
    try {
      // On macOS, we can check microphone permission using systemPreferences
      const { systemPreferences } = require('electron');
      if (process.platform === 'darwin') {
        const status = systemPreferences.getMediaAccessStatus('microphone');
        return { granted: status === 'granted' };
      }
      // On other platforms, assume granted (or implement platform-specific checks)
      return { granted: true };
    } catch (error) {
      console.error('[Main] Failed to check microphone permission:', error);
      return { granted: false };
    }
  });

  // Handle Request Microphone Permission
  ipcMain.handle(IPC_CHANNELS.REQUEST_MICROPHONE_PERMISSION, async () => {
    try {
      const { systemPreferences, shell } = require('electron');
      if (process.platform === 'darwin') {
        // On macOS, we can request microphone access
        const status = systemPreferences.getMediaAccessStatus('microphone');

        if (status === 'not-determined') {
          // Request permission - this will trigger the system dialog
          // We need to actually try to access the microphone to trigger the prompt
          // The user will need to grant permission in their first recording attempt
          return { granted: false, message: 'Please grant microphone access when prompted during first use' };
        } else if (status === 'denied') {
          // Open System Preferences to Privacy settings
          shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone');
          return { granted: false, message: 'Please enable microphone access in System Preferences' };
        } else if (status === 'granted') {
          return { granted: true };
        }
      }
      return { granted: true };
    } catch (error) {
      console.error('[Main] Failed to request microphone permission:', error);
      return { granted: false, error: String(error) };
    }
  });

  // Handle Check Accessibility Permission (for Speech Analyzer)
  ipcMain.handle(IPC_CHANNELS.CHECK_ACCESSIBILITY_PERMISSION, async () => {
    try {
      const { systemPreferences } = require('electron');
      if (process.platform === 'darwin') {
        const trusted = systemPreferences.isTrustedAccessibilityClient(false);
        return { granted: trusted };
      }
      return { granted: true };
    } catch (error) {
      console.error('[Main] Failed to check accessibility permission:', error);
      return { granted: false };
    }
  });

  // Handle Request Accessibility Permission
  ipcMain.handle(IPC_CHANNELS.REQUEST_ACCESSIBILITY_PERMISSION, async () => {
    try {
      const { systemPreferences, shell } = require('electron');
      if (process.platform === 'darwin') {
        // Request accessibility permission
        const trusted = systemPreferences.isTrustedAccessibilityClient(true);
        if (!trusted) {
          // Open System Preferences to Accessibility settings
          shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
          return { granted: false, message: 'Please enable accessibility access in System Preferences' };
        }
        return { granted: trusted };
      }
      return { granted: true };
    } catch (error) {
      console.error('[Main] Failed to request accessibility permission:', error);
      return { granted: false, error: String(error) };
    }
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
  ipcMain.handle(IPC_CHANNELS.SUBSCRIPTION_CREATE_CHECKOUT, async (event, data?: { billingInterval?: 'monthly' | 'annual' }) => {
    try {
      console.log('[Main] Creating checkout session, billing interval:', data?.billingInterval || 'monthly');

      // Get current session for authentication
      const session = getCurrentSession();
      if (!session || !session.access_token) {
        console.error('[Main] No active session found');
        return {
          success: false,
          error: 'Not authenticated. Please sign in first.',
        };
      }

      // Determine which edge function to call based on environment
      const env = getAppEnv();
      const functionName = env === 'dev' ? 'create-checkout-session-dev' : 'create-checkout-session';
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/${functionName}`;

      console.log(`[Main] Calling edge function: ${functionName} (env: ${env})`);

      // Call edge function to create checkout session
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billing_interval: data?.billingInterval || 'monthly',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Main] Checkout session creation failed:', response.status, errorText);
        return {
          success: false,
          error: `Failed to create checkout session: ${errorText}`,
        };
      }

      const result = await response.json() as { url: string };
      console.log('[Main] Checkout session URL received:', result.url);

      // Open checkout URL in browser
      await shell.openExternal(result.url);

      return { success: true, url: result.url };
    } catch (error) {
      console.error('[Main] SUBSCRIPTION_CREATE_CHECKOUT error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Handle Open Customer Portal (legacy name - kept for backwards compatibility)
  ipcMain.handle(IPC_CHANNELS.SUBSCRIPTION_OPEN_PORTAL, async (event, data: { stripeCustomerId: string }) => {
    return handleOpenCustomerPortal(data.stripeCustomerId);
  });

  // Handle Open Customer Portal (new name)
  ipcMain.handle('OPEN_CUSTOMER_PORTAL', async (event, data: { stripeCustomerId: string }) => {
    return handleOpenCustomerPortal(data.stripeCustomerId);
  });

  // Handle Get Access Status
  ipcMain.handle('GET_ACCESS_STATUS', async () => {
    console.log('[Main] GET_ACCESS_STATUS called');
    const accessManager = getAccessManager();
    const status = await accessManager.getAccessStatus();
    return status;
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

  // Handle Get App Version
  ipcMain.handle('GET_APP_VERSION', async () => {
    console.log('[Main] GET_APP_VERSION called');
    try {
      const { app } = require('electron');
      return app.getVersion();
    } catch (error) {
      console.error('[Main] Failed to get app version:', error);
      return '0.0.0';
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

  // Note: Audio transcription is handled via AUDIO_DATA IPC channel
  // The renderer will send the complete audio buffer after this

  return true;
}
