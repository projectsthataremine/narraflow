/**
 * Mel Spectrogram Feature Extraction
 * Uses melspectrogram.onnx for preprocessing audio for Whisper
 */

import * as ort from 'onnxruntime-node';
import * as path from 'path';

export interface MelConfig {
  modelPath?: string;
  sampleRate: number;
}

export class MelSpectrogram {
  private config: MelConfig;
  private session: ort.InferenceSession | null = null;

  constructor(config: Partial<MelConfig> = {}) {
    this.config = {
      modelPath: config.modelPath ?? path.join(process.cwd(), 'resources/models/melspectrogram.onnx'),
      sampleRate: config.sampleRate ?? 16000,
    };
  }

  /**
   * Initialize mel spectrogram model
   */
  async initialize(): Promise<void> {
    try {
      console.log('[MelSpectrogram] Loading model from:', this.config.modelPath);
      this.session = await ort.InferenceSession.create(this.config.modelPath!);

      console.log('[MelSpectrogram] Model loaded successfully');
      console.log('[MelSpectrogram] Input names:', this.session.inputNames);
      console.log('[MelSpectrogram] Output names:', this.session.outputNames);
    } catch (error) {
      console.error('[MelSpectrogram] Failed to load model:', error);
      throw error;
    }
  }

  /**
   * Convert raw audio to mel spectrogram features
   * @param audio Raw PCM audio (Float32Array, 16kHz)
   * @returns Mel spectrogram features
   */
  async compute(audio: Float32Array): Promise<ort.Tensor> {
    if (!this.session) {
      throw new Error('[MelSpectrogram] Model not initialized');
    }

    try {
      // Create input tensor
      // The melspectrogram model expects audio as [1, N] where N is number of samples
      const inputTensor = new ort.Tensor('float32', audio, [1, audio.length]);

      // Run inference
      const feeds = {
        [this.session.inputNames[0]]: inputTensor,
      };

      const results = await this.session.run(feeds);

      // Get mel spectrogram output
      const outputName = this.session.outputNames[0];
      const melFeatures = results[outputName];

      console.log('[MelSpectrogram] Computed features with shape:', melFeatures.dims);
      return melFeatures;
    } catch (error) {
      console.error('[MelSpectrogram] Error computing features:', error);
      throw error;
    }
  }

  /**
   * Check if model is loaded
   */
  isReady(): boolean {
    return this.session !== null;
  }

  /**
   * Release model resources
   */
  dispose(): void {
    this.session = null;
  }
}
