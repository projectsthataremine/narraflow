import { describe, it, expect } from 'vitest';
import type { StartRecordingRequest, StartRecordingResponse } from '@/types/ipc-contracts';

describe('StartRecording IPC Contract', () => {
  it('should have correct request structure', () => {
    const request: StartRecordingRequest = {
      type: 'StartRecording',
    };

    expect(request.type).toBe('StartRecording');
  });

  it('should have correct response structure for success', () => {
    const response: StartRecordingResponse = {
      ok: true,
    };

    expect(response.ok).toBe(true);
    expect(response.error).toBeUndefined();
  });

  it('should have correct response structure for failure', () => {
    const response: StartRecordingResponse = {
      ok: false,
      error: 'Microphone unavailable',
    };

    expect(response.ok).toBe(false);
    expect(response.error).toBe('Microphone unavailable');
  });

  it('should validate response has ok field', () => {
    const response = { ok: true } as StartRecordingResponse;
    expect('ok' in response).toBe(true);
    expect(typeof response.ok).toBe('boolean');
  });
});
