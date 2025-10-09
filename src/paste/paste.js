"use strict";
/**
 * Paste simulation module
 * MVP: Clipboard-only implementation (no actual paste simulation)
 * Production: Would use robotjs or AppleScript for true paste
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasteSimulator = void 0;
const clipboard_1 = require("./clipboard");
const defaultOptions = {
    verifyClipboard: true,
    delayMs: 50,
};
class PasteSimulator {
    /**
     * Paste text into focused field
     * MVP: Clipboard-only - user must manually paste with Cmd+V
     * Returns false (clipboard-only mode)
     */
    static async pasteText(text, options = {}) {
        const opts = { ...defaultOptions, ...options };
        // Copy to clipboard
        let copySuccess;
        if (opts.verifyClipboard) {
            copySuccess = await clipboard_1.ClipboardManager.copyWithVerification(text);
        }
        else {
            copySuccess = clipboard_1.ClipboardManager.copyText(text);
        }
        if (!copySuccess) {
            console.error('Failed to copy text to clipboard');
            return false;
        }
        // MVP: Always return false (clipboard-only mode)
        // User can manually paste with Cmd+V
        console.log('Text copied to clipboard. Press Cmd+V to paste.');
        return false;
    }
    /**
     * Check if currently focused element can accept text input
     * MVP: Always returns true (assumes focused field is editable)
     * Production: Use Accessibility API to check focused element
     */
    static async isTextFieldFocused() {
        // MVP: Simplified check - always returns true
        // In production, this would use macOS Accessibility API to check:
        // - If focused element has AXRole of text field, text area, etc.
        // - If element is editable
        // For MVP, we assume paste is always possible
        // This matches the "clipboard fallback" behavior in the spec
        return true;
    }
    /**
     * Copy text only without paste attempt
     */
    static async copyOnly(text, options = {}) {
        const opts = { ...defaultOptions, ...options };
        if (opts.verifyClipboard) {
            return await clipboard_1.ClipboardManager.copyWithVerification(text);
        }
        else {
            return clipboard_1.ClipboardManager.copyText(text);
        }
    }
    /**
     * Test keyboard access (for permissions check)
     * MVP: Always returns true (no actual keyboard simulation)
     */
    static async testKeyboardAccess() {
        // MVP: No actual keyboard test needed for clipboard-only mode
        return true;
    }
}
exports.PasteSimulator = PasteSimulator;
