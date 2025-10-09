/**
 * Global hotkey registration
 * Manages Command+B press/release for recording control
 */

import { globalShortcut, BrowserWindow } from 'electron';
import { startRecordingDirect, stopRecordingDirect } from './ipc-handlers';

let isRecording = false;
let mainWindow: BrowserWindow | null = null;

/**
 * Register global shortcuts
 */
export function registerShortcuts(window: BrowserWindow): boolean {
  mainWindow = window;

  // Register Command+B
  const success = globalShortcut.register('CommandOrControl+B', () => {
    handleHotkeyPress();
  });

  if (!success) {
    console.error('Failed to register global shortcut');
    return false;
  }

  console.log('Global shortcut registered: CommandOrControl+B');
  return true;
}

/**
 * Handle hotkey press/release
 * Note: Electron's globalShortcut doesn't support press/release detection
 * MVP: Toggle recording on each press
 */
function handleHotkeyPress(): void {
  if (!mainWindow) {
    return;
  }

  console.log('Hotkey pressed, isRecording:', isRecording);

  if (!isRecording) {
    // Start recording
    startRecording();
  } else {
    // Stop recording
    stopRecording();
  }
}

/**
 * Start recording
 */
async function startRecording(): Promise<void> {
  if (isRecording) {
    return;
  }

  console.log('Starting recording...');
  isRecording = true;

  // Directly call the recording handler
  try {
    const success = await startRecordingDirect();
    if (!success) {
      console.error('Failed to start recording');
      isRecording = false;
      return;
    }
    console.log('Recording started successfully');
  } catch (error) {
    console.error('Error starting recording:', error);
    isRecording = false;
    return;
  }

  // MVP: Auto-stop after 5 seconds (simulates release)
  // In production, would use native key event monitoring for true press/release
  setTimeout(() => {
    if (isRecording) {
      stopRecording();
    }
  }, 5000);
}

/**
 * Stop recording
 */
async function stopRecording(): Promise<void> {
  if (!isRecording) {
    return;
  }

  console.log('Stopping recording...');
  isRecording = false;

  // Directly call the recording handler
  try {
    const success = await stopRecordingDirect();
    if (!success) {
      console.error('Failed to stop recording');
      return;
    }
    console.log('Recording stopped successfully');
  } catch (error) {
    console.error('Error stopping recording:', error);
  }
}

/**
 * Unregister all shortcuts
 */
export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll();
  mainWindow = null;
  isRecording = false;
}

/**
 * Check if shortcut is registered
 */
export function isShortcutRegistered(): boolean {
  return globalShortcut.isRegistered('CommandOrControl+B');
}
