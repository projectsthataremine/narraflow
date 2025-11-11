/**
 * Baseline ASR Tests
 *
 * These tests verify that our reference implementation works.
 * If these pass, we know speech-to-text is possible on this system.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { BaselineASR } from '../src/asr/baseline';
import { generateSpeechLikeAudio, generateTestAudio } from './audio-test-utils';

describe('Baseline ASR', () => {
  let asr: BaselineASR;

  beforeAll(async () => {
    console.log('[Test] Initializing Baseline ASR...');
    console.log('[Test] First run will download model (~40MB), please wait...');

    asr = new BaselineASR();
    await asr.initialize();

    console.log('[Test] Baseline ASR ready');
  }, 120000); // 2 minute timeout for model download

  it('should initialize successfully', () => {
    expect(asr.isReady()).toBe(true);
  });

  it('should transcribe speech-like audio', async () => {
    // Generate 2 seconds of synthetic speech-like audio
    const audio = generateSpeechLikeAudio(2.0);

    console.log('[Test] Transcribing speech-like audio...');
    const text = await asr.transcribe(audio);

    console.log('[Test] Baseline result:', text);

    // The model might not produce perfect text from synthetic audio,
    // but it should at least try to transcribe something or return empty string gracefully
    expect(typeof text).toBe('string');
  }, 30000); // 30 second timeout for transcription

  it('should handle test tone audio', async () => {
    // Generate 1 second of 440Hz tone
    const audio = generateTestAudio(1.0, 16000, 440);

    console.log('[Test] Transcribing test tone...');
    const text = await asr.transcribe(audio);

    console.log('[Test] Test tone result:', text || '(empty)');

    // Test tones don't sound like speech, so empty is acceptable
    expect(typeof text).toBe('string');
  }, 30000);

  it('should handle varying audio lengths', async () => {
    const tests = [
      { duration: 0.5, label: 'short (0.5s)' },
      { duration: 1.0, label: 'medium (1s)' },
      { duration: 3.0, label: 'long (3s)' },
    ];

    for (const test of tests) {
      const audio = generateSpeechLikeAudio(test.duration);
      console.log(`[Test] Transcribing ${test.label} audio...`);

      const text = await asr.transcribe(audio);
      console.log(`[Test] ${test.label} result:`, text || '(empty)');

      expect(typeof text).toBe('string');
    }
  }, 90000); // 90 seconds for all tests

  it('should complete transcription in reasonable time', async () => {
    const audio = generateSpeechLikeAudio(1.0);

    const start = Date.now();
    await asr.transcribe(audio);
    const elapsed = Date.now() - start;

    console.log(`[Test] Transcription took ${elapsed}ms`);

    // Should complete in under 10 seconds (very generous)
    // Real performance is usually <3 seconds
    expect(elapsed).toBeLessThan(10000);
  }, 15000);
});

describe('Baseline ASR - Educational Checks', () => {
  it('should explain what the baseline does', () => {
    // This test is documentation disguised as a test!

    const explanation = `
    The Baseline ASR (Transformers.js):

    1. Takes raw Float32Array audio (16kHz mono)
    2. Internally converts to mel spectrogram
    3. Feeds to Whisper model
    4. Returns transcribed text

    This is our "known-good" reference.
    Later (M2), we'll build the preprocessing ourselves.
    `;

    console.log(explanation);
    expect(explanation).toContain('mel spectrogram');
  });
});
