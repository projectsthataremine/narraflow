/**
 * WhisperKit local transcription via local server
 * Handles audio transcription using WhisperKit local server (OpenAI-compatible API)
 */

import { Buffer } from 'buffer';

export interface WhisperKitConfig {
  serverUrl: string;
  model?: string;
  language?: string;
  maxRetries: number;
  retryDelayMs: number;
}

const defaultConfig: Partial<WhisperKitConfig> = {
  serverUrl: 'http://localhost:50060',
  language: 'en',
  maxRetries: 2,
  retryDelayMs: 1000,
};

/**
 * Convert Float32Array audio to WAV buffer
 * WhisperKit expects WAV format (PCM 16-bit, 16kHz, mono)
 */
function float32ToWav(float32Array: Float32Array, sampleRate: number = 16000): Buffer {
  const buffer = Buffer.alloc(44 + float32Array.length * 2);

  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + float32Array.length * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM format
  buffer.writeUInt16LE(1, 20); // Linear PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // Byte rate
  buffer.writeUInt16LE(2, 32); // Block align
  buffer.writeUInt16LE(16, 34); // Bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(float32Array.length * 2, 40);

  // Convert float32 [-1, 1] to int16 [-32768, 32767]
  for (let i = 0; i < float32Array.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    buffer.writeInt16LE(int16, 44 + i * 2);
  }

  return buffer;
}

/**
 * Retry helper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 2,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`[WhisperKit] Attempt ${attempt}/${maxAttempts} failed:`, error);

      if (attempt < maxAttempts) {
        const delay = baseDelayMs * attempt;
        console.log(`[WhisperKit] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

export class WhisperKitTranscriber {
  private config: WhisperKitConfig;

  constructor(config: Partial<WhisperKitConfig> = {}) {
    this.config = { ...defaultConfig, ...config } as WhisperKitConfig;
  }

  /**
   * Transcribe audio to text using WhisperKit local server
   */
  async transcribe(audio: Float32Array): Promise<string> {
    const startTime = Date.now();

    try {
      console.log(`[WhisperKit] Starting local transcription (${audio.length} samples)`);

      // Convert Float32Array to WAV buffer
      const wavBuffer = float32ToWav(audio);
      console.log(`[WhisperKit] Converted to WAV (${wavBuffer.length} bytes)`);

      // Create FormData with the audio file (OpenAI API format)
      const formData = new FormData();
      const audioFile = new File([new Uint8Array(wavBuffer)], 'audio.wav', {
        type: 'audio/wav',
      });
      formData.append('file', audioFile);
      formData.append('response_format', 'json');

      if (this.config.model) {
        formData.append('model', this.config.model);
      }

      if (this.config.language) {
        formData.append('language', this.config.language);
      }

      const transcriptionUrl = `${this.config.serverUrl}/v1/audio/transcriptions`;

      // Call WhisperKit server with retry logic
      const result = await withRetry(
        async () => {
          const response = await fetch(transcriptionUrl, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`WhisperKit server error (${response.status}): ${errorText}`);
          }

          return await response.json();
        },
        this.config.maxRetries,
        this.config.retryDelayMs
      );

      const duration = Date.now() - startTime;

      // Extract text from response (OpenAI format)
      const text = (result as any).text || '';

      console.log(`[WhisperKit] Local transcription completed in ${duration}ms`);
      console.log(`[WhisperKit] Text: "${text}"`);

      return text.trim();
    } catch (error) {
      console.error('[WhisperKit] Local transcription failed after all retries:', error);
      throw new Error(
        `WhisperKit transcription error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if the transcriber is ready
   */
  isReady(): boolean {
    return !!this.config;
  }
}

// Singleton instance
let instance: WhisperKitTranscriber | null = null;

export function getWhisperKitInstance(): WhisperKitTranscriber {
  if (!instance) {
    instance = new WhisperKitTranscriber();
  }
  return instance;
}
