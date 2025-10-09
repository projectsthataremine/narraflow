import { describe, it, expect } from 'vitest';
import type {
  StopRecordingRequest,
  StopRecordingResponse,
  AudioSession,
} from '@/types/ipc-contracts';

describe('StopRecording IPC Contract', () => {
  it('should have correct request structure', () => {
    const request: StopRecordingRequest = {
      type: 'StopRecording',
    };

    expect(request.type).toBe('StopRecording');
  });

  it('should have correct response structure for success', () => {
    const audioSession: AudioSession = {
      startTime: Date.now() - 5000,
      endTime: Date.now(),
      rmsPeak: -20,
      audioBuffer: new Float32Array(80000),
      duration: 5,
    };

    const response: StopRecordingResponse = {
      ok: true,
      audioSession,
    };

    expect(response.ok).toBe(true);
    expect(response.audioSession).toBeDefined();
    expect(response.audioSession?.duration).toBe(5);
  });

  it('should have correct response structure for failure', () => {
    const response: StopRecordingResponse = {
      ok: false,
    };

    expect(response.ok).toBe(false);
    expect(response.audioSession).toBeUndefined();
  });

  it('should validate AudioSession structure', () => {
    const session: AudioSession = {
      startTime: 1000,
      endTime: 6000,
      rmsPeak: -15,
      audioBuffer: new Float32Array(80000),
      duration: 5,
    };

    expect(session.startTime).toBeLessThan(session.endTime);
    expect(session.audioBuffer).toBeInstanceOf(Float32Array);
    expect(session.duration).toBeGreaterThan(0);
  });
});
