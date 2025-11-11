"use strict";
/**
 * Clipboard manager
 * Handles copying text to system clipboard using Electron API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClipboardManager = void 0;
const electron_1 = require("electron");
class ClipboardManager {
    /**
     * Copy text to clipboard
     */
    static copyText(text) {
        try {
            electron_1.clipboard.writeText(text);
            return true;
        }
        catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }
    /**
     * Read current clipboard text
     */
    static readText() {
        try {
            return electron_1.clipboard.readText();
        }
        catch (error) {
            console.error('Failed to read from clipboard:', error);
            return '';
        }
    }
    /**
     * Clear clipboard
     */
    static clear() {
        try {
            electron_1.clipboard.clear();
        }
        catch (error) {
            console.error('Failed to clear clipboard:', error);
        }
    }
    /**
     * Check if clipboard contains text
     */
    static hasText() {
        try {
            const formats = electron_1.clipboard.availableFormats();
            return formats.includes('text/plain');
        }
        catch (error) {
            console.error('Failed to check clipboard formats:', error);
            return false;
        }
    }
    /**
     * Copy with verification
     * Returns true only if copy succeeded and text can be read back
     */
    static async copyWithVerification(text) {
        try {
            electron_1.clipboard.writeText(text);
            // Wait a bit for clipboard to flush
            await new Promise((resolve) => setTimeout(resolve, 50));
            const readBack = electron_1.clipboard.readText();
            return readBack === text;
        }
        catch (error) {
            console.error('Failed to copy with verification:', error);
            return false;
        }
    }
}
exports.ClipboardManager = ClipboardManager;
