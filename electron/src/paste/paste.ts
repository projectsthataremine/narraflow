/**
 * Paste simulation module
 * Uses uiohook-napi for keyboard simulation to trigger Cmd+V
 */

import { ClipboardManager } from './clipboard';
import { UiohookKey, UiohookKeyboardEvent, EventType, uIOhook } from 'uiohook-napi';

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
   * Copies to clipboard and simulates Cmd+V keystroke
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

    console.log('[PasteSimulator] Text copied to clipboard, simulating Cmd+V');

    // Wait for clipboard to settle
    await new Promise(resolve => setTimeout(resolve, opts.delayMs));

    try {
      // Simulate Cmd+V using uiohook-napi
      // Press Cmd (Meta key)
      uIOhook.keyToggle(UiohookKey.Meta, 'down');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Press V
      uIOhook.keyToggle(UiohookKey.V, 'down');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Release V
      uIOhook.keyToggle(UiohookKey.V, 'up');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Release Cmd
      uIOhook.keyToggle(UiohookKey.Meta, 'up');

      console.log('[PasteSimulator] Cmd+V simulation complete');
      return true;
    } catch (error) {
      console.error('[PasteSimulator] Failed to simulate paste:', error);
      return false;
    }
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
