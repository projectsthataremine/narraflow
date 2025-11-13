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
  private state: ort.Tensor | null = null;
  private sr: ort.Tensor | null = null;

  constructor(config: Partial<VADConfig> = {}) {
    this.config = {
      speechThreshold: config.speechThreshold ?? 0.5, // Default Silero VAD threshold
      silenceThreshold: config.silenceThreshold ?? 0.3, // Default
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

      // Initialize state tensor for LSTM
      // state has shape [2, 1, 128] - combines h and c from older versions
      this.state = new ort.Tensor('float32', new Float32Array(2 * 1 * 128).fill(0), [2, 1, 128]);

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
    if (this.state) {
      this.state = new ort.Tensor('float32', new Float32Array(2 * 1 * 128).fill(0), [2, 1, 128]);
    }
  }

  /**
   * Apply automatic gain control (AGC) to normalize audio levels
   * This ensures consistent VAD detection regardless of recording volume
   */
  private applyAGC(audioFrame: Float32Array, targetRMS: number = 0.3): Float32Array {
    // Calculate current RMS (root mean square) level
    let sumSquares = 0;
    for (let i = 0; i < audioFrame.length; i++) {
      sumSquares += audioFrame[i] * audioFrame[i];
    }
    const currentRMS = Math.sqrt(sumSquares / audioFrame.length);

    // Avoid division by zero
    if (currentRMS < 0.001) {
      console.log('[VAD AGC] Audio too quiet, skipping AGC');
      return audioFrame; // Too quiet, return as-is
    }

    // Calculate gain to reach target RMS
    const gain = targetRMS / currentRMS;

    // Limit gain to prevent excessive amplification (max 20x or 26dB)
    const limitedGain = Math.min(gain, 20.0);

    console.log(`[VAD AGC] Current RMS: ${currentRMS.toFixed(4)}, Target: ${targetRMS}, Gain: ${gain.toFixed(2)}x, Limited: ${limitedGain.toFixed(2)}x`);

    // Apply gain with soft clipping
    const result = new Float32Array(audioFrame.length);
    for (let i = 0; i < audioFrame.length; i++) {
      let sample = audioFrame[i] * limitedGain;
      // Soft clip to prevent distortion
      sample = Math.max(-1.0, Math.min(1.0, sample));
      result[i] = sample;
    }

    return result;
  }

  /**
   * Analyze audio frame and return speech probability [0,1]
   * Uses Silero VAD ONNX model
   */
  async analyze(audioFrame: Float32Array): Promise<number> {
    if (!this.session || !this.state || !this.sr) {
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

      // Run inference with new model format
      const feeds = {
        input: inputTensor,
        state: this.state,
        sr: this.sr,
      };

      const results = await this.session.run(feeds);

      // Get probability output
      const output = results.output;
      const probability = output.data[0] as number;

      // Update state tensor for next iteration (model returns 'stateN')
      if (results.stateN) {
        this.state = results.stateN;
      }

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

    // Skip AGC - test with raw audio
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
  async findSpeechSegments(audioBuffer: Float32Array, paddingMs: number = 500, minSpeechMs: number = 50): Promise<[number, number][]> {
    const frameSize = this.getFrameSize();
    const probabilities = await this.processBuffer(audioBuffer);
    const segments: [number, number][] = [];

    // Convert padding from ms to samples
    const paddingSamples = Math.floor((paddingMs / 1000) * this.config.sampleRate);
    const minSpeechSamples = Math.floor((minSpeechMs / 1000) * this.config.sampleRate);

    let speechStart = -1;

    for (let i = 0; i < probabilities.length; i++) {
      const isSpeech = this.isSpeech(probabilities[i]);

      if (isSpeech && speechStart === -1) {
        // Speech segment starts - add padding before
        speechStart = Math.max(0, i * frameSize - paddingSamples);
      } else if (!isSpeech && speechStart !== -1) {
        // Speech segment ends - add padding after
        const speechEnd = Math.min(audioBuffer.length, i * frameSize + paddingSamples);

        // Only add if segment is long enough
        if (speechEnd - speechStart >= minSpeechSamples) {
          segments.push([speechStart, speechEnd]);
        }
        speechStart = -1;
      }
    }

    // Close last segment if still open
    if (speechStart !== -1) {
      const speechEnd = Math.min(audioBuffer.length, audioBuffer.length);
      if (speechEnd - speechStart >= minSpeechSamples) {
        segments.push([speechStart, speechEnd]);
      }
    }

    // Merge overlapping or nearby segments (within 200ms)
    const mergedSegments: [number, number][] = [];
    for (const segment of segments) {
      if (mergedSegments.length === 0) {
        mergedSegments.push(segment);
      } else {
        const lastSegment = mergedSegments[mergedSegments.length - 1];
        const gap = segment[0] - lastSegment[1];
        const maxGap = Math.floor((200 / 1000) * this.config.sampleRate); // 200ms

        if (gap <= maxGap) {
          // Merge with previous segment
          lastSegment[1] = segment[1];
        } else {
          mergedSegments.push(segment);
        }
      }
    }

    return mergedSegments;
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
    this.state = null;
    this.sr = null;
  }
}
