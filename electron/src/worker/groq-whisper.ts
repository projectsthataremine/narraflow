/**
 * Groq Whisper API integration via Supabase Edge Function
 * Handles audio transcription using Groq's Whisper Large V3 Turbo model
 * Optional Llama 3.1 8B formatting for grammar/punctuation cleanup
 * API keys are securely stored in edge function, not exposed to client
 */

import { Buffer } from 'buffer';

export interface GroqWhisperConfig {
  supabaseUrl: string;
  model: 'whisper-large-v3-turbo' | 'whisper-large-v3';
  language?: string;
  maxRetries: number;
  retryDelayMs: number;
}

const defaultConfig: Partial<GroqWhisperConfig> = {
  model: 'whisper-large-v3-turbo',
  language: 'en',
  maxRetries: 3,
  retryDelayMs: 1000,
};

/**
 * Convert Float32Array audio to WAV buffer
 * Edge function expects WAV format (PCM 16-bit, 16kHz, mono)
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
  maxAttempts: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`[Groq Whisper] Attempt ${attempt}/${maxAttempts} failed:`, error);

      if (attempt < maxAttempts) {
        const delay = baseDelayMs * attempt; // Linear backoff
        console.log(`[Groq Whisper] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

export class GroqWhisperTranscriber {
  private config: GroqWhisperConfig;

  constructor(config: Partial<GroqWhisperConfig>) {
    if (!config.supabaseUrl) {
      throw new Error('[Groq Whisper] Supabase URL is required');
    }

    this.config = { ...defaultConfig, ...config } as GroqWhisperConfig;
  }

  /**
   * Transcribe audio to text using Groq Whisper API via Edge Function
   */
  async transcribe(audio: Float32Array, accessToken: string, enableFormatting: boolean = false): Promise<string> {
    const startTime = Date.now();

    try {
      console.log(`[Groq Whisper] Starting transcription (${audio.length} samples, formatting: ${enableFormatting})`);

      if (!accessToken) {
        throw new Error('Access token required for transcription');
      }

      // Convert Float32Array to WAV buffer
      const wavBuffer = float32ToWav(audio);
      console.log(`[Groq Whisper] Converted to WAV (${wavBuffer.length} bytes)`);


      // Create FormData with the audio file
      const formData = new FormData();
      const audioFile = new File([new Uint8Array(wavBuffer)], 'audio.wav', { type: 'audio/wav' });
      formData.append('file', audioFile);
      formData.append('model', this.config.model);
      formData.append('response_format', 'json');
      formData.append('format', enableFormatting.toString());

      if (this.config.language) {
        formData.append('language', this.config.language);
      }

      // Determine edge function URL based on environment
      const isDev = process.env.NODE_ENV === 'development' || process.env.APP_ENV === 'dev';
      const functionName = isDev ? 'transcribe-dev' : 'transcribe';
      const edgeFunctionUrl = `${this.config.supabaseUrl}/functions/v1/${functionName}`;

      console.log(`[Groq Whisper] Calling edge function: ${functionName}`);

      // Call edge function with retry logic
      const result = await withRetry(
        async () => {
          const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Edge function error (${response.status}): ${errorText}`);
          }

          return await response.json();
        },
        this.config.maxRetries,
        this.config.retryDelayMs
      );

      const duration = Date.now() - startTime;

      // Log full response from edge function
      console.log(`[Groq Whisper] Edge function response:`, result);

      // Extract response fields
      const raw = (result as any).raw || '';
      const formatted = (result as any).formatted || null;
      const text = (result as any).text || '';

      console.log(`[Groq Whisper] Transcription completed in ${duration}ms`);
      console.log(`[Groq Whisper] Formatting was ${enableFormatting ? 'ENABLED' : 'DISABLED'}`);
      console.log(`[Groq Whisper] Raw (Whisper): "${raw}"`);
      if (formatted) {
        console.log(`[Groq Whisper] Formatted (Llama): "${formatted}"`);
      }
      console.log(`[Groq Whisper] Final text to paste: "${text}"`);

      return text.trim();
    } catch (error) {
      console.error('[Groq Whisper] Transcription failed after all retries:', error);
      throw new Error(`Groq Whisper API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
let instance: GroqWhisperTranscriber | null = null;

export function getGroqWhisperInstance(supabaseUrl?: string): GroqWhisperTranscriber {
  if (!instance) {
    if (!supabaseUrl) {
      throw new Error('[Groq Whisper] Supabase URL required for initialization');
    }
    instance = new GroqWhisperTranscriber({ supabaseUrl });
  }
  return instance;
}
