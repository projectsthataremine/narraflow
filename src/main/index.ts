/**
 * Electron main process entry point
 * Initializes app, creates window, sets up IPC and shortcuts
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { setupIPCHandlers, cleanupIPC } from './ipc-handlers';
import { registerShortcuts, unregisterShortcuts } from './shortcuts';
import { ensurePermissions } from './permissions';
import { IPC_CHANNELS } from '../types/ipc-contracts';

let mainWindow: BrowserWindow | null = null;

/**
 * Create main window
 */
function createWindow(): void {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload path:', preloadPath);
  console.log('__dirname:', __dirname);

  // Get primary display size - use workArea to exclude menu bar
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.workArea; // Use workArea to respect menu bar

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    backgroundColor: '#00000000', // Fully transparent
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
  });

  // Show window for testing border
  mainWindow.show();
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Set window to cover the entire screen including menu bar
  // Using setFullScreen or screen-saver level to go over menu bar
  if (process.platform === 'darwin') {
    // On macOS, set the window level to cover everything including menu bar
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
  }

  // Wait for page to finish loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
  });

  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('Preload error:', preloadPath, error);
  });

  // Load renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173/ui/index.html');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

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

  // Create window
  createWindow();

  if (!mainWindow) {
    console.error('Failed to create main window');
    app.quit();
    return;
  }

  // Setup IPC handlers
  setupIPCHandlers(mainWindow);

  // Register global shortcuts
  const shortcutSuccess = registerShortcuts(mainWindow);
  if (!shortcutSuccess) {
    console.error('Failed to register shortcuts');
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
  if (mainWindow === null) {
    createWindow();
  }
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
