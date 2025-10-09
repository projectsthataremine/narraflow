/**
 * Permission checking utilities
 * Checks Microphone and Accessibility permissions on macOS
 */

import { systemPreferences, dialog, shell } from 'electron';

export interface PermissionStatus {
  microphone: boolean;
  accessibility: boolean;
}

/**
 * Check all required permissions
 */
export async function checkPermissions(): Promise<PermissionStatus> {
  const microphone = await checkMicrophonePermission();
  const accessibility = checkAccessibilityPermission();

  return {
    microphone,
    accessibility,
  };
}

/**
 * Check microphone permission
 */
export async function checkMicrophonePermission(): Promise<boolean> {
  const status = systemPreferences.getMediaAccessStatus('microphone');

  if (status === 'granted') {
    return true;
  }

  if (status === 'not-determined') {
    // Request permission
    const granted = await systemPreferences.askForMediaAccess('microphone');
    return granted;
  }

  return false;
}

/**
 * Check accessibility permission
 * Required for global shortcuts and paste simulation
 */
export function checkAccessibilityPermission(): boolean {
  return systemPreferences.isTrustedAccessibilityClient(false);
}

/**
 * Request accessibility permission
 * Shows system dialog to grant permission
 */
export function requestAccessibilityPermission(): void {
  const isTrusted = systemPreferences.isTrustedAccessibilityClient(true);

  if (!isTrusted) {
    // Show instructions to user
    showAccessibilityInstructions();
  }
}

/**
 * Show instructions for granting accessibility permission
 */
function showAccessibilityInstructions(): void {
  const result = dialog.showMessageBoxSync({
    type: 'info',
    title: 'Accessibility Permission Required',
    message: 'Mic2Text needs Accessibility permission to work',
    detail:
      'This permission is required for:\n' +
      '• Global hotkey (Command+B)\n' +
      '• Automatic paste into focused field\n\n' +
      'Click "Open System Settings" to grant permission.',
    buttons: ['Open System Settings', 'Cancel'],
    defaultId: 0,
  });

  if (result === 0) {
    // Open System Settings
    shell.openExternal(
      'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility'
    );
  }
}

/**
 * Show permission status dialog
 */
export async function showPermissionStatus(): Promise<void> {
  const status = await checkPermissions();

  let message = 'Permission Status:\n\n';
  message += `Microphone: ${status.microphone ? '✓ Granted' : '✗ Not granted'}\n`;
  message += `Accessibility: ${status.accessibility ? '✓ Granted' : '✗ Not granted'}`;

  dialog.showMessageBoxSync({
    type: 'info',
    title: 'Permissions',
    message,
    buttons: ['OK'],
  });
}

/**
 * Ensure all permissions are granted
 * Shows dialogs if permissions are missing
 */
export async function ensurePermissions(): Promise<boolean> {
  const status = await checkPermissions();

  if (!status.microphone) {
    dialog.showMessageBoxSync({
      type: 'error',
      title: 'Microphone Permission Required',
      message: 'Mic2Text needs microphone access to record audio.',
      buttons: ['OK'],
    });
    return false;
  }

  if (!status.accessibility) {
    requestAccessibilityPermission();
    return false;
  }

  return true;
}
