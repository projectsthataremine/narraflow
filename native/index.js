/**
 * JavaScript wrapper for Fn key native addon
 * Provides a clean API for detecting Fn key presses on macOS
 */

const path = require('path');

let FnKeyAddon;
let fnKeyInstance;

// Only load on macOS
if (process.platform === 'darwin') {
  try {
    const addonPath = path.join(__dirname, 'build/Release/fn_key_addon.node');
    const NativeAddon = require(addonPath);
    FnKeyAddon = NativeAddon.FnKeyAddon;
  } catch (error) {
    console.warn('[FnKeyListener] Failed to load native addon:', error.message);
    console.warn('[FnKeyListener] Fn key detection will not be available');
  }
}

/**
 * Check if the app has Accessibility permissions
 * @returns {boolean}
 */
function checkAccessibilityPermissions() {
  if (!FnKeyAddon) {
    console.warn('[FnKeyListener] Native addon not available');
    return false;
  }

  try {
    if (!fnKeyInstance) {
      fnKeyInstance = new FnKeyAddon();
    }

    return fnKeyInstance.checkAccessibilityPermissions();
  } catch (error) {
    console.error('[FnKeyListener] Error checking permissions:', error);
    return false;
  }
}

/**
 * Request Accessibility permissions from the user
 */
function requestAccessibilityPermissions() {
  if (!FnKeyAddon) {
    console.warn('[FnKeyListener] Native addon not available');
    return;
  }

  try {
    if (!fnKeyInstance) {
      fnKeyInstance = new FnKeyAddon();
    }

    fnKeyInstance.requestAccessibilityPermissions();
  } catch (error) {
    console.error('[FnKeyListener] Error requesting permissions:', error);
  }
}

/**
 * Open System Settings to Accessibility preferences
 */
function openAccessibilityPreferences() {
  if (!FnKeyAddon) {
    console.warn('[FnKeyListener] Native addon not available');
    return;
  }

  try {
    if (!fnKeyInstance) {
      fnKeyInstance = new FnKeyAddon();
    }

    fnKeyInstance.openAccessibilityPreferences();
  } catch (error) {
    console.error('[FnKeyListener] Error opening preferences:', error);
  }
}

/**
 * Start listening for Fn key events
 * @param {Function} callback - Called with boolean (true=pressed, false=released)
 * @returns {boolean} - True if started successfully
 */
function startListening(callback) {
  if (!FnKeyAddon) {
    console.warn('[FnKeyListener] Native addon not available');
    return false;
  }

  if (typeof callback !== 'function') {
    throw new TypeError('Callback must be a function');
  }

  try {
    if (!fnKeyInstance) {
      fnKeyInstance = new FnKeyAddon();
    }

    return fnKeyInstance.startListening(callback);
  } catch (error) {
    console.error('[FnKeyListener] Failed to start listening:', error);
    return false;
  }
}

/**
 * Stop listening for Fn key events
 */
function stopListening() {
  if (fnKeyInstance) {
    try {
      fnKeyInstance.stopListening();
    } catch (error) {
      console.error('[FnKeyListener] Error stopping listener:', error);
    }
  }
}

/**
 * Check if Fn key is currently pressed
 * @returns {boolean}
 */
function isPressed() {
  if (!fnKeyInstance) {
    return false;
  }

  try {
    return fnKeyInstance.isPressed();
  } catch (error) {
    console.error('[FnKeyListener] Error checking Fn key state:', error);
    return false;
  }
}

/**
 * Check if Fn key detection is available
 * @returns {boolean}
 */
function isAvailable() {
  return !!FnKeyAddon && process.platform === 'darwin';
}

module.exports = {
  checkAccessibilityPermissions,
  requestAccessibilityPermissions,
  openAccessibilityPreferences,
  startListening,
  stopListening,
  isPressed,
  isAvailable
};
