/**
 * Paste simulation module
 * MVP: Clipboard-only implementation (no actual paste simulation)
 * Production: Would use robotjs or AppleScript for true paste
 */

import { ClipboardManager } from './clipboard';

export interface PasteOptions {
  verifyClipboard: boolean;
  delayMs: number;
}

const defaultOptions: PasteOptions = {
  verifyClipboard: true,
  delayMs: 50,
};

export class PasteSimulator {
  /**
   * Paste text into focused field
   * MVP: Clipboard-only - user must manually paste with Cmd+V
   * Returns false (clipboard-only mode)
   */
  static async pasteText(text: string, options: Partial<PasteOptions> = {}): Promise<boolean> {
    const opts = { ...defaultOptions, ...options };

    // Copy to clipboard
    let copySuccess: boolean;
    if (opts.verifyClipboard) {
      copySuccess = await ClipboardManager.copyWithVerification(text);
    } else {
      copySuccess = ClipboardManager.copyText(text);
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
  private static async isTextFieldFocused(): Promise<boolean> {
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
  static async copyOnly(text: string, options: Partial<PasteOptions> = {}): Promise<boolean> {
    const opts = { ...defaultOptions, ...options };

    if (opts.verifyClipboard) {
      return await ClipboardManager.copyWithVerification(text);
    } else {
      return ClipboardManager.copyText(text);
    }
  }

  /**
   * Test keyboard access (for permissions check)
   * MVP: Always returns true (no actual keyboard simulation)
   */
  static async testKeyboardAccess(): Promise<boolean> {
    // MVP: No actual keyboard test needed for clipboard-only mode
    return true;
  }
}
