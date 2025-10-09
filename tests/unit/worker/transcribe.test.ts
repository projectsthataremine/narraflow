import { describe, it, expect } from 'vitest';
import type { TranscribeRequest, TranscribeResponse } from '@/types/ipc-contracts';

describe('Transcribe Worker Contract', () => {
  it('should have correct request structure', () => {
    const request: TranscribeRequest = {
      type: 'Transcribe',
      audio: new Float32Array(16000),
    };

    expect(request.type).toBe('Transcribe');
    expect(request.audio).toBeInstanceOf(Float32Array);
  });

  it('should have correct response structure with cleanup', () => {
    const response: TranscribeResponse = {
      raw: 'hello world',
      cleaned: 'Hello world.',
      fallbackUsed: false,
    };

    expect(response.raw).toBe('hello world');
    expect(response.cleaned).toBe('Hello world.');
    expect(response.fallbackUsed).toBe(false);
  });

  it('should have correct response structure without cleanup', () => {
    const response: TranscribeResponse = {
      raw: 'hello world',
      fallbackUsed: true,
    };

    expect(response.raw).toBe('hello world');
    expect(response.cleaned).toBeUndefined();
    expect(response.fallbackUsed).toBe(true);
  });

  it('should validate audio buffer in request', () => {
    const audioBuffer = new Float32Array(16000);
    const request: TranscribeRequest = {
      type: 'Transcribe',
      audio: audioBuffer,
    };

    expect(request.audio.length).toBeGreaterThan(0);
    expect(request.audio).toBeInstanceOf(Float32Array);
  });
});
