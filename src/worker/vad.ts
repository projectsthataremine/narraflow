/**
 * Voice Activity Detection (VAD) module
 * Uses Silero VAD ONNX model for speech detection
 */

import * as ort from 'onnxruntime-node';
import * as path from 'path';

export interface VADConfig {
  speechThreshold: number; // Probability threshold for speech (default: 0.5)
  silenceThreshold: number; // Probability threshold for silence (default: 0.3)
  frameSizeMs: number; // Frame size in milliseconds (default: 30ms)
  sampleRate: number; // Audio sample rate (default: 16000Hz)
  modelPath?: string; // Path to Silero VAD model
}

export class VAD {
  private config: VADConfig;
  private session: ort.InferenceSession | null = null;
  private h: ort.Tensor | null = null;
  private c: ort.Tensor | null = null;
  private sr: ort.Tensor | null = null;

  constructor(config: Partial<VADConfig> = {}) {
    this.config = {
      speechThreshold: config.speechThreshold ?? 0.5,
      silenceThreshold: config.silenceThreshold ?? 0.3,
      frameSizeMs: config.frameSizeMs ?? 32, // Silero VAD uses 512 samples = 32ms at 16kHz
      sampleRate: config.sampleRate ?? 16000,
      modelPath: config.modelPath ?? path.join(process.cwd(), 'resources/models/silero_vad.onnx'),
    };
  }

  /**
   * Initialize VAD model
   */
  async initialize(): Promise<void> {
    try {
      console.log('[VAD] Loading model from:', this.config.modelPath);
      this.session = await ort.InferenceSession.create(this.config.modelPath!);

      // Initialize state tensors for LSTM
      // h and c are hidden states with shape [2, 1, 64]
      this.h = new ort.Tensor('float32', new Float32Array(2 * 1 * 64).fill(0), [2, 1, 64]);
      this.c = new ort.Tensor('float32', new Float32Array(2 * 1 * 64).fill(0), [2, 1, 64]);

      // Sample rate tensor
      this.sr = new ort.Tensor('int64', BigInt64Array.from([BigInt(this.config.sampleRate)]), [1]);

      console.log('[VAD] Model loaded successfully');
      console.log('[VAD] Input names:', this.session.inputNames);
      console.log('[VAD] Output names:', this.session.outputNames);
    } catch (error) {
      console.error('[VAD] Failed to load model:', error);
      throw error;
    }
  }

  /**
   * Reset VAD state (useful between recordings)
   */
  resetState(): void {
    if (this.h && this.c) {
      this.h = new ort.Tensor('float32', new Float32Array(2 * 1 * 64).fill(0), [2, 1, 64]);
      this.c = new ort.Tensor('float32', new Float32Array(2 * 1 * 64).fill(0), [2, 1, 64]);
    }
  }

  /**
   * Analyze audio frame and return speech probability [0,1]
   * Uses Silero VAD ONNX model
   */
  async analyze(audioFrame: Float32Array): Promise<number> {
    if (!this.session || !this.h || !this.c || !this.sr) {
      console.error('[VAD] Model not initialized');
      return 0;
    }

    try {
      // Silero VAD expects 512 samples (32ms at 16kHz)
      const expectedSize = 512;

      // Pad or trim to expected size
      let processedFrame = audioFrame;
      if (audioFrame.length !== expectedSize) {
        processedFrame = new Float32Array(expectedSize);
        const copyLength = Math.min(audioFrame.length, expectedSize);
        processedFrame.set(audioFrame.slice(0, copyLength));
      }

      // Create input tensor [1, 512]
      const inputTensor = new ort.Tensor('float32', processedFrame, [1, processedFrame.length]);

      // Run inference
      const feeds = {
        input: inputTensor,
        h: this.h,
        c: this.c,
        sr: this.sr,
      };

      const results = await this.session.run(feeds);

      // Get probability output
      const output = results.output;
      const probability = output.data[0] as number;

      // Update state tensors for next iteration
      if (results.hn) this.h = results.hn;
      if (results.cn) this.c = results.cn;

      return probability;
    } catch (error) {
      console.error('[VAD] Error during inference:', error);
      return 0;
    }
  }

  /**
   * Check if probability indicates speech
   */
  isSpeech(probability: number): boolean {
    return probability >= this.config.speechThreshold;
  }

  /**
   * Check if probability indicates silence
   */
  isSilence(probability: number): boolean {
    return probability < this.config.silenceThreshold;
  }

  /**
   * Get frame size in samples
   */
  getFrameSize(): number {
    // Silero VAD uses 512 samples
    return 512;
  }

  /**
   * Process audio buffer in frames and return probability for each frame
   */
  async processBuffer(audioBuffer: Float32Array): Promise<number[]> {
    const frameSize = this.getFrameSize();
    const probabilities: number[] = [];

    for (let i = 0; i < audioBuffer.length; i += frameSize) {
      const frame = audioBuffer.slice(i, Math.min(i + frameSize, audioBuffer.length));
      const prob = await this.analyze(frame);
      probabilities.push(prob);
    }

    return probabilities;
  }

  /**
   * Find speech segments in audio buffer
   * Returns array of [startSample, endSample] pairs
   */
  async findSpeechSegments(audioBuffer: Float32Array): Promise<[number, number][]> {
    const frameSize = this.getFrameSize();
    const probabilities = await this.processBuffer(audioBuffer);
    const segments: [number, number][] = [];

    let speechStart = -1;

    for (let i = 0; i < probabilities.length; i++) {
      const isSpeech = this.isSpeech(probabilities[i]);

      if (isSpeech && speechStart === -1) {
        // Speech segment starts
        speechStart = i * frameSize;
      } else if (!isSpeech && speechStart !== -1) {
        // Speech segment ends
        const speechEnd = i * frameSize;
        segments.push([speechStart, speechEnd]);
        speechStart = -1;
      }
    }

    // Close last segment if still open
    if (speechStart !== -1) {
      segments.push([speechStart, audioBuffer.length]);
    }

    return segments;
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
    this.h = null;
    this.c = null;
    this.sr = null;
  }
}
