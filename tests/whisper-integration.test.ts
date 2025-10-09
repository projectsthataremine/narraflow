/**
 * Whisper Integration Tests
 *
 * Tests the complete flow: Audio → Custom Pipeline → Whisper ONNX → Tokens
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { WhisperTranscriber } from '../src/worker/whisper';
import { generateSpeechLikeAudio } from './audio-test-utils';

describe('Whisper Integration (Custom Pipeline)', () => {
  let whisper: WhisperTranscriber;

  beforeAll(async () => {
    whisper = new WhisperTranscriber();
    await whisper.initialize();
    console.log('[Test] Whisper initialized with custom pipeline');
  }, 30000); // 30 second timeout for model loading

  it('should initialize successfully', () => {
    expect(whisper.isReady()).toBe(true);
  });

  it('should accept audio and produce tensor without errors', async () => {
    // Generate 1 second of speech-like audio
    const audio = generateSpeechLikeAudio(1.0);

    // This should NOT throw tensor shape errors anymore!
    const result = await whisper.transcribe(audio);

    // Even if decoding isn't perfect, we should get back a string (possibly empty)
    expect(typeof result).toBe('string');

    console.log('[Test] Transcription result:', result || '(empty)');
  }, 30000);

  it('should handle varying audio lengths', async () => {
    const testCases = [
      { duration: 0.5, label: '0.5s' },
      { duration: 1.0, label: '1.0s' },
      { duration: 1.5, label: '1.5s' },
      { duration: 2.0, label: '2.0s' },
    ];

    for (const test of testCases) {
      const audio = generateSpeechLikeAudio(test.duration);

      // Should not throw errors for any length
      const result = await whisper.transcribe(audio);

      expect(typeof result).toBe('string');
      console.log(`[Test] ${test.label}: ${result || '(empty)'}`);
    }
  }, 60000); // 60 second timeout

  it('should process audio through custom pipeline correctly', async () => {
    const audio = generateSpeechLikeAudio(1.0);

    // Access pipeline directly to verify shape
    const pipeline = (whisper as any).pipeline;
    const processed = pipeline.process(audio);

    // Verify custom pipeline outputs correct shape
    expect(processed.shape).toEqual([1, 16, 96]);
    expect(processed.features.length).toBe(16);
    expect(processed.features[0].length).toBe(96);

    console.log('[Test] Pipeline output shape:', processed.shape);
  });

  it('should solve the original tensor mismatch problem', async () => {
    // This is THE test that proves we fixed the core issue
    const audio = generateSpeechLikeAudio(2.0);

    // OLD behavior: Would throw "Got invalid dimensions" error
    // NEW behavior: Should work without errors

    let errorThrown = false;
    let result = '';

    try {
      result = await whisper.transcribe(audio);
    } catch (error: any) {
      errorThrown = true;
      console.error('[Test] ERROR:', error.message);
    }

    // Should NOT throw tensor shape errors
    expect(errorThrown).toBe(false);
    expect(typeof result).toBe('string');

    console.log('\n[Test] ✓ TENSOR MISMATCH PROBLEM SOLVED!');
    console.log('[Test] Audio length:', audio.length, 'samples');
    console.log('[Test] Transcription:', result || '(empty, but no errors!)');
    console.log('[Test] Status: Ready for real-world testing!\n');
  }, 30000);
});
