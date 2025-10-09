/**
 * Baseline ASR using Transformers.js
 *
 * Purpose: Prove that speech-to-text works end-to-end.
 * This is our "known-good" reference implementation.
 *
 * Why Transformers.js?
 * - Works in Node.js (no Python needed)
 * - Uses standard Whisper models
 * - Simple API: audio in, text out
 * - Good quality baseline for comparison
 */

import { pipeline, AutomaticSpeechRecognitionPipeline } from '@xenova/transformers';

export interface BaselineConfig {
  model?: string;
  language?: string;
  task?: 'transcribe' | 'translate';
}

export class BaselineASR {
  private config: BaselineConfig;
  private transcriber: AutomaticSpeechRecognitionPipeline | null = null;

  constructor(config: Partial<BaselineConfig> = {}) {
    this.config = {
      model: config.model ?? 'Xenova/whisper-tiny.en',  // Fast English-only model
      language: config.language ?? 'en',
      task: config.task ?? 'transcribe',
    };
  }

  /**
   * Initialize the ASR pipeline
   * Downloads model on first run (cached after that)
   */
  async initialize(): Promise<void> {
    console.log('[Baseline ASR] Loading model:', this.config.model);
    console.log('[Baseline ASR] This may take a minute on first run (downloading model)...');

    try {
      this.transcriber = await pipeline(
        'automatic-speech-recognition',
        this.config.model
      );

      console.log('[Baseline ASR] Model loaded successfully');
    } catch (error) {
      console.error('[Baseline ASR] Failed to load model:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio to text
   *
   * @param audio Float32Array of PCM audio (16kHz mono, range [-1, 1])
   * @returns Transcribed text
   *
   * Educational note:
   * - This handles ALL preprocessing internally (FFT, mel features, etc.)
   * - It's a "black box" but proves the concept works
   * - Our custom pipeline (M2) will do these steps explicitly
   */
  async transcribe(audio: Float32Array): Promise<string> {
    if (!this.transcriber) {
      throw new Error('[Baseline ASR] Model not initialized. Call initialize() first.');
    }

    const startTime = Date.now();

    try {
      // Transformers.js expects raw audio as Float32Array
      const result = await this.transcriber(audio, {
        language: this.config.language,
        task: this.config.task,
      });

      const elapsed = Date.now() - startTime;

      // Handle both single result and array of results
      const text = Array.isArray(result) ? result[0].text : result.text;
      console.log(`[Baseline ASR] Transcribed in ${elapsed}ms:`, text);

      return text.trim();
    } catch (error) {
      console.error('[Baseline ASR] Transcription failed:', error);
      return '';
    }
  }

  /**
   * Check if model is loaded
   */
  isReady(): boolean {
    return this.transcriber !== null;
  }

  /**
   * Release resources
   */
  dispose(): void {
    this.transcriber = null;
  }
}

/**
 * Singleton instance for easy access
 */
let baselineInstance: BaselineASR | null = null;

export function getBaselineASR(config?: Partial<BaselineConfig>): BaselineASR {
  if (!baselineInstance) {
    baselineInstance = new BaselineASR(config);
  }
  return baselineInstance;
}

/**
 * Quick test function
 * Usage: node -e "require('./dist/asr/baseline').testBaseline()"
 */
export async function testBaseline() {
  const asr = getBaselineASR();
  await asr.initialize();

  // Generate 1 second of 440Hz test tone (middle A)
  const sampleRate = 16000;
  const duration = 1;
  const frequency = 440;
  const audio = new Float32Array(sampleRate * duration);

  for (let i = 0; i < audio.length; i++) {
    audio[i] = Math.sin(2 * Math.PI * frequency * (i / sampleRate)) * 0.3;
  }

  console.log('Testing with synthetic audio...');
  const text = await asr.transcribe(audio);
  console.log('Result:', text || '(no transcription)');
}
