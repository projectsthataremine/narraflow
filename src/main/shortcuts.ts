/**
 * Global hotkey registration
 * Manages Command+B for recording control
 */

import { BrowserWindow } from 'electron';
import { startRecordingDirect, stopRecordingDirect } from './ipc-handlers';
import { uIOhook, UiohookKey } from 'uiohook-napi';

let isRecording = false;
let overlayWindow: BrowserWindow | null = null;
let commandPressed = false;
let bPressed = false;

/**
 * Register global shortcuts with Command+B detection
 */
export function registerShortcuts(window: BrowserWindow): boolean {
  overlayWindow = window;

  try {
    console.log('[Shortcuts] Registering uiohook keyboard listener...');
    console.log('[Shortcuts] Press Command+B to toggle recording');

    // Listen for key down events
    uIOhook.on('keydown', (event) => {
      // Command key (Meta is Command on macOS)
      if (event.keycode === UiohookKey.Meta || event.keycode === UiohookKey.MetaLeft || event.keycode === UiohookKey.MetaRight) {
        commandPressed = true;
      }

      // B key
      if (event.keycode === UiohookKey.B) {
        bPressed = true;
      }

      // Check if Command+B is pressed
      if (commandPressed && bPressed && !isRecording) {
        console.log('[Shortcuts] Command+B pressed - starting recording');
        handleKeyPress();
      }
    });

    // Listen for key up events
    uIOhook.on('keyup', (event) => {
      // Command key released
      if (event.keycode === UiohookKey.Meta || event.keycode === UiohookKey.MetaLeft || event.keycode === UiohookKey.MetaRight) {
        commandPressed = false;
      }

      // B key released
      if (event.keycode === UiohookKey.B) {
        bPressed = false;
        // Stop recording when B is released
        if (isRecording) {
          console.log('[Shortcuts] B key released - stopping recording');
          handleKeyRelease();
        }
      }
    });

    // Start listening for keyboard events
    uIOhook.start();
    console.log('Keyboard hook registered for Command+B');
    return true;
  } catch (error) {
    console.error('Failed to register keyboard hook:', error);
    return false;
  }
}

/**
 * Handle key press (Command+B pressed)
 */
function handleKeyPress(): void {
  if (!overlayWindow || isRecording) {
    return;
  }

  console.log('Command+B pressed - starting recording');
  startRecording();
}

/**
 * Handle key release (B released)
 */
function handleKeyRelease(): void {
  if (!isRecording) {
    return;
  }

  console.log('B released - stopping recording');
  stopRecording();
}

/**
 * Start recording
 */
async function startRecording(): Promise<void> {
  if (isRecording) {
    return;
  }

  isRecording = true;

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
  }
}

/**
 * Stop recording
 */
async function stopRecording(): Promise<void> {
  if (!isRecording) {
    return;
  }

  isRecording = false;

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
  try {
    uIOhook.stop();
  } catch (error) {
    console.error('Error stopping keyboard hook:', error);
  }
  overlayWindow = null;
  isRecording = false;
  commandPressed = false;
  bPressed = false;
}
