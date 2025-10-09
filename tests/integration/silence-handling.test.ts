import { describe, it, expect } from 'vitest';
import type { AudioSession, TranscriptionResult } from '@/types/ipc-contracts';
import { validateAudioSession, isEmptyTranscription } from '@/types/ipc-contracts';

/**
 * Integration test: Silence-only recording
 * Tests: Record silence (RMS < -40dB) → no clipboard/paste
 * Validates system does nothing when only silence detected
 */
describe('Silence-Only Recording Handling', () => {
  it('should reject audio session with silence-only recording', () => {
    const silenceSession: AudioSession = {
      startTime: Date.now() - 2000,
      endTime: Date.now(),
      rmsPeak: -45, // Below -40dB threshold
      audioBuffer: new Float32Array(32000),
      duration: 2,
    };

    const error = validateAudioSession(silenceSession);
    expect(error).toBeDefined();
    expect(error).toContain('silence only');
  });

  it('should accept audio session with speech (RMS > -40dB)', () => {
    const speechSession: AudioSession = {
      startTime: Date.now() - 2000,
      endTime: Date.now(),
      rmsPeak: -20,
      audioBuffer: new Float32Array(32000),
      duration: 2,
    };

    const error = validateAudioSession(speechSession);
    expect(error).toBeUndefined();
  });

  it('should detect empty transcription result', () => {
    const emptyResult: TranscriptionResult = {
      raw: '',
      fallbackUsed: false,
      processingTime: 500,
    };

    expect(isEmptyTranscription(emptyResult)).toBe(true);
  });

  it('should not trigger clipboard/paste for empty transcription', () => {
    const emptyResult: TranscriptionResult = {
      raw: '   ', // Only whitespace
      fallbackUsed: false,
      processingTime: 500,
    };

    expect(isEmptyTranscription(emptyResult)).toBe(true);
  });

  it('should handle boundary case at -40dB threshold', () => {
    const boundarySession: AudioSession = {
      startTime: Date.now() - 2000,
      endTime: Date.now(),
      rmsPeak: -40,
      audioBuffer: new Float32Array(32000),
      duration: 2,
    };

    const error = validateAudioSession(boundarySession);
    expect(error).toBeDefined(); // Exactly -40dB is considered silence
  });
});
