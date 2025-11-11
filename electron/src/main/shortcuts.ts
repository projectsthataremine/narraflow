/**
 * Global hotkey registration
 * Manages configurable hotkey for recording control
 */

import { BrowserWindow, app } from 'electron';
import { startRecordingDirect, stopRecordingDirect } from './ipc-handlers';
import { uIOhook, UiohookKey } from 'uiohook-napi';
import type { HotkeyConfig } from './settings-manager';
import { getFnKeyBridge } from './fn-key-bridge';

let isRecording = false;
let overlayWindow: BrowserWindow | null = null;
let currentHotkey: HotkeyConfig | null = null;
let modifiersPressed: Set<number> = new Set();
let mainKeyPressed = false;
let usingFnKeyListener = false;

/**
 * Register global shortcuts with configurable hotkey detection
 */
export async function registerShortcuts(window: BrowserWindow, hotkeyConfig: HotkeyConfig): Promise<boolean> {
  overlayWindow = window;
  currentHotkey = hotkeyConfig;

  // Check if hotkey is Fn key (special handling for macOS)
  if (hotkeyConfig.key === 'Fn' || hotkeyConfig.key === 'Globe') {
    return await registerFnKeyListener(hotkeyConfig);
  }

  // Use uiohook for other keys
  return registerUiohookListener(hotkeyConfig);
}

/**
 * Register Fn key listener using Swift helper bridge
 */
async function registerFnKeyListener(hotkeyConfig: HotkeyConfig): Promise<boolean> {
  try {
    console.log('[Shortcuts] Registering Fn key listener...');
    console.log('[Shortcuts] Hotkey:', formatHotkeyDisplay(hotkeyConfig));

    const fnBridge = getFnKeyBridge();

    // Listen for Fn key events
    fnBridge.on('fn-key', (pressed: boolean) => {
      if (pressed && !isRecording) {
        console.log('[Shortcuts] Fn key pressed - starting recording');
        handleKeyPress();
      } else if (!pressed && isRecording) {
        console.log('[Shortcuts] Fn key released - stopping recording');
        handleKeyRelease();
      }
    });

    // Handle errors
    fnBridge.on('error', (error: Error) => {
      console.error('[Shortcuts] Fn key bridge error:', error);
    });

    // Start the bridge
    const success = await fnBridge.start();

    if (success) {
      usingFnKeyListener = true;
      console.log('[Shortcuts] Fn key listener registered successfully');
      return true;
    } else {
      console.error('[Shortcuts] Failed to start Fn key listener, falling back to CapsLock');
      // Fallback to CapsLock
      const fallbackConfig: HotkeyConfig = {
        modifiers: [],
        key: 'CapsLock',
        keycode: UiohookKey.CapsLock
      };
      return registerUiohookListener(fallbackConfig);
    }
  } catch (error) {
    console.error('[Shortcuts] Error registering Fn key listener:', error);
    // Fallback to CapsLock
    const fallbackConfig: HotkeyConfig = {
      modifiers: [],
      key: 'CapsLock',
      keycode: UiohookKey.CapsLock
    };
    return registerUiohookListener(fallbackConfig);
  }
}

/**
 * Register uiohook keyboard listener for non-Fn keys
 */
function registerUiohookListener(hotkeyConfig: HotkeyConfig): boolean {
  try {
    console.log('[Shortcuts] Registering uiohook keyboard listener...');
    console.log('[Shortcuts] Hotkey:', formatHotkeyDisplay(hotkeyConfig));

    // Get modifier keycodes
    const modifierKeycodes = hotkeyConfig.modifiers.map((mod) => getKeycode(mod));
    const allRequiredKeys = [...modifierKeycodes];

    // Listen for key down events
    uIOhook.on('keydown', (event) => {
      // Track all required keys
      if (allRequiredKeys.includes(event.keycode)) {
        modifiersPressed.add(event.keycode);

        // Check if all required keys are now pressed
        const allKeysPressed = allRequiredKeys.every((kc) => modifiersPressed.has(kc));

        if (allKeysPressed && !isRecording) {
          console.log('[Shortcuts] Hotkey combo pressed - starting recording');
          handleKeyPress();
        }
      }
    });

    // Listen for key up events
    uIOhook.on('keyup', (event) => {
      // Track key releases
      if (allRequiredKeys.includes(event.keycode)) {
        modifiersPressed.delete(event.keycode);

        // Stop recording when ANY required key is released
        if (isRecording) {
          console.log('[Shortcuts] Hotkey combo released - stopping recording');
          handleKeyRelease();
        }
      }
    });

    // Start listening for keyboard events
    uIOhook.start();
    usingFnKeyListener = false;
    console.log('[Shortcuts] Keyboard hook registered for:', formatHotkeyDisplay(hotkeyConfig));

    return true;
  } catch (error) {
    console.error('Failed to register keyboard hook:', error);
    return false;
  }
}

/**
 * Get UiohookKey keycode from key name
 */
function getKeycode(keyName: string): number {
  return (UiohookKey as any)[keyName] ?? 0;
}

/**
 * Format hotkey for display
 */
function formatHotkeyDisplay(config: HotkeyConfig): string {
  const parts = [...config.modifiers, config.key];
  return parts.join('+');
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
    if (usingFnKeyListener) {
      const fnBridge = getFnKeyBridge();
      fnBridge.stop();
      fnBridge.removeAllListeners();
    } else {
      uIOhook.stop();
    }
  } catch (error) {
    console.error('Error stopping keyboard hook:', error);
  }
  overlayWindow = null;
  isRecording = false;
  currentHotkey = null;
  modifiersPressed.clear();
  mainKeyPressed = false;
  usingFnKeyListener = false;
}
