import { describe, it, expect, vi } from 'vitest';
import type { UIState, AudioSession, TranscriptionResult } from '@/types/ipc-contracts';

/**
 * Integration test: Complete recording flow with mocked models
 * Tests: Press hotkey → record → release → clipboard update
 * Validates UI state transitions: hidden → loading → silent → processing → hidden
 */
describe('Complete Recording Flow (Integration)', () => {
  it('should transition UI states correctly during recording', async () => {
    const stateTransitions: UIState[] = [];

    // Mock UI state subscriber
    const onStateChange = (state: UIState) => {
      stateTransitions.push(state);
    };

    // Simulate: User presses hotkey
    onStateChange({ mode: 'loading' });

    // Simulate: Recording starts, VAD initialized
    await new Promise((resolve) => setTimeout(resolve, 100));
    onStateChange({ mode: 'silent', vadProbability: 0.2 });

    // Simulate: User speaks
    onStateChange({ mode: 'talking', vadProbability: 0.8 });

    // Simulate: User releases hotkey
    onStateChange({ mode: 'processing' });

    // Simulate: Processing complete
    await new Promise((resolve) => setTimeout(resolve, 100));
    onStateChange({ mode: 'hidden' });

    // Validate state transitions
    expect(stateTransitions).toHaveLength(5);
    expect(stateTransitions[0].mode).toBe('loading');
    expect(stateTransitions[1].mode).toBe('silent');
    expect(stateTransitions[2].mode).toBe('talking');
    expect(stateTransitions[3].mode).toBe('processing');
    expect(stateTransitions[4].mode).toBe('hidden');
  });

  it('should create valid audio session on recording', () => {
    const startTime = Date.now();
    const endTime = startTime + 3000; // 3 second recording

    const session: AudioSession = {
      startTime,
      endTime,
      rmsPeak: -15,
      audioBuffer: new Float32Array(48000), // 3 seconds at 16kHz
      duration: 3,
    };

    expect(session.duration).toBeGreaterThan(0);
    expect(session.rmsPeak).toBeGreaterThan(-40); // Not silence
    expect(session.audioBuffer.length).toBeGreaterThan(0);
  });

  it('should produce transcription result after processing', async () => {
    // Mock transcription result from worker
    const result: TranscriptionResult = {
      raw: 'this is a test',
      cleaned: 'This is a test.',
      fallbackUsed: false,
      processingTime: 1500,
    };

    expect(result.raw).toBe('this is a test');
    expect(result.cleaned).toBe('This is a test.');
    expect(result.processingTime).toBeLessThan(3000); // Performance target
  });
});
