import { describe, it, expect } from 'vitest';
import type { PasteTextRequest, PasteTextResponse } from '@/types/ipc-contracts';

describe('PasteText IPC Contract', () => {
  it('should have correct request structure', () => {
    const request: PasteTextRequest = {
      type: 'PasteText',
      text: 'Hello world.',
    };

    expect(request.type).toBe('PasteText');
    expect(request.text).toBe('Hello world.');
  });

  it('should have correct response structure for successful paste', () => {
    const response: PasteTextResponse = {
      success: true,
    };

    expect(response.success).toBe(true);
  });

  it('should have correct response structure for clipboard-only', () => {
    const response: PasteTextResponse = {
      success: false,
    };

    expect(response.success).toBe(false);
  });

  it('should validate text is a string', () => {
    const request: PasteTextRequest = {
      type: 'PasteText',
      text: 'Test text with punctuation!',
    };

    expect(typeof request.text).toBe('string');
    expect(request.text.length).toBeGreaterThan(0);
  });
});
