/**
 * Electron main process entry point
 * Initializes app, creates window, sets up IPC and shortcuts
 */

// Suppress ONNX Runtime warnings
process.env.ORT_LOGGING_LEVEL = 'error';

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import {
  setupIPCHandlers,
  cleanupIPC,
  setOverlayWindow,
  getSavedPillConfig,
  getSavedHotkeyConfig,
} from './ipc-handlers';
import { registerShortcuts, unregisterShortcuts } from './shortcuts';
import { ensurePermissions } from './permissions';
import { IPC_CHANNELS } from '../types/ipc-contracts';
import { appStore } from './AppStore';

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;

// TESTING: Show dock icon for development
// TODO: Re-enable dock hiding for production
// if (process.platform === 'darwin') {
//   app.dock.hide();
// }

/**
 * Create overlay window (Recording Pill)
 * Appears at bottom-center when Command+B is pressed
 */
function createOverlayWindow(): void {
  const preloadPath = path.join(__dirname, 'preload.js');

  // Get primary display size
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x: workX, y: workY, width: workWidth, height: workHeight } = primaryDisplay.workArea;

  const windowWidth = 320;
  const windowHeight = 180;
  const xPos = workX + Math.floor((workWidth - windowWidth) / 2);
  const yPos = workY + workHeight - windowHeight; // Align bottom of window to bottom of work area

  overlayWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: xPos,
    y: yPos,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    roundedCorners: false,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
  });

  if (process.platform === 'darwin') {
    overlayWindow.setAlwaysOnTop(true, 'screen-saver');
    overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }

  // Load renderer
  if (process.env.NODE_ENV === 'development') {
    overlayWindow.loadURL('http://localhost:5173/ui/index.html');
  } else {
    overlayWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  overlayWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] Overlay window loaded successfully');

    // Send saved pill config to overlay window
    const savedConfig = getSavedPillConfig();
    if (savedConfig && overlayWindow) {
      console.log('[Main] Sending saved config to overlay window:', savedConfig);
      overlayWindow.webContents.send(IPC_CHANNELS.PILL_CONFIG_UPDATE, { config: savedConfig });
    }
  });

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

/**
 * Create Settings window (hidden by default)
 */
function createSettingsWindow(): void {
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hidden', // macOS: hide title bar but keep traffic lights
    trafficLightPosition: { x: 16, y: 16 }, // Position traffic lights in our custom title bar
    transparent: false,
    show: true, // TESTING: Show on startup
    skipTaskbar: false, // TESTING: Show in taskbar
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
  });

  // TESTING: Allow quit on close for development
  // mainWindow.on('close', (event) => {
  //   event.preventDefault();
  //   mainWindow?.hide();
  // });

  // Load settings UI
  if (process.env.NODE_ENV === 'development') {
    console.log('[Main] Loading settings from:', 'http://localhost:5173/settings/index.html');
    mainWindow.loadURL('http://localhost:5173/settings/index.html');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/settings/index.html'));
  }

  // Log any load failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Main] Settings window failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] Settings window loaded successfully');

    // Send saved pill config to settings window
    const savedConfig = getSavedPillConfig();
    if (savedConfig && mainWindow) {
      console.log('[Main] Sending saved config to settings window:', savedConfig);
      mainWindow.webContents.send(IPC_CHANNELS.PILL_CONFIG_UPDATE, { config: savedConfig });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Initialize app
 */
async function initialize(): Promise<void> {
  // Check permissions
  const hasPermissions = await ensurePermissions();
  if (!hasPermissions) {
    console.warn('Missing required permissions. App may not function correctly.');
  }

  // Create overlay window (Recording Pill)
  createOverlayWindow();

  // Create settings window (hidden)
  createSettingsWindow();

  if (!overlayWindow) {
    console.error('Failed to create overlay window');
    app.quit();
    return;
  }

  // Setup IPC handlers
  setupIPCHandlers(overlayWindow);

  // Set overlay window reference for IPC forwarding
  setOverlayWindow(overlayWindow);

  // Initialize AppStore and validate license
  appStore.setWindow(overlayWindow);
  console.log('[Main] Validating license on startup...');
  await appStore.validateLicense();
  console.log('[Main] License validation complete. Valid:', appStore.getLicenseValid());

  // Get saved hotkey config
  const savedHotkey = getSavedHotkeyConfig();

  // Register global shortcuts (pass overlay window and hotkey config)
  const shortcutSuccess = await registerShortcuts(overlayWindow, savedHotkey);
  if (!shortcutSuccess) {
    console.error('Failed to register shortcuts');
  }
}

/**
 * Show/hide overlay window
 */
export function showOverlay(): void {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.show();
  }
}

export function hideOverlay(): void {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.hide();
  }
}

/**
 * Show settings window
 */
export function showSettings(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  }
}

/**
 * App lifecycle events
 */
app.whenReady().then(initialize);

app.on('window-all-closed', () => {
  // On macOS, keep app running even when windows are closed
  // unless user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // Don't recreate windows on activate (app runs in background)
  console.log('App activated');
});

app.on('will-quit', () => {
  // Cleanup
  unregisterShortcuts();
  cleanupIPC();
});

/**
 * Handle second instance (prevent multiple instances)
 */
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}
