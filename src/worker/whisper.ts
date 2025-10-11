/**
 * Whisper transcription module
 * Uses @xenova/transformers pipeline for speech-to-text
 */

export interface WhisperConfig {
  language: string;
  task: 'transcribe' | 'translate';
}

export class WhisperTranscriber {
  private config: WhisperConfig;
  private pipeline: any = null;

  constructor(config: Partial<WhisperConfig> = {}) {
    this.config = {
      language: config.language ?? 'en',
      task: config.task ?? 'transcribe',
    };
  }

  /**
   * Initialize Whisper pipeline
   */
  async initialize(): Promise<void> {
    try {
      console.log('[Whisper] Loading pipeline...');

      // Suppress ONNX Runtime warnings
      process.env.ORT_LOGGING_LEVEL = 'error';

      // Use Function() workaround for ESM compatibility
      const TransformersApi = Function('return import("@xenova/transformers")')();
      const { pipeline, env } = await TransformersApi;

      // Set transformers logging to error only
      env.logLevel = 'error';

      // Create automatic speech recognition pipeline
      this.pipeline = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny.en',
        {
          quantized: false, // Use full precision for better quality
        }
      );

      console.log('[Whisper] Pipeline loaded successfully');
    } catch (error) {
      console.error('[Whisper] Failed to load pipeline:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio to text
   */
  async transcribe(audio: Float32Array): Promise<string> {
    if (!this.pipeline) {
      throw new Error('[Whisper] Pipeline not initialized');
    }

    try {
      // Use minimal parameters - avoid 'task' parameter which causes VAD to reject audio
      // Language can help with accuracy but is optional
      // chunk_length_s: Forces processing in smaller chunks for more literal transcription
      const result = await this.pipeline(audio, {
        language: 'english',
        chunk_length_s: 30,  // Process in 30-second chunks (more literal)
        return_timestamps: false,  // We don't need timestamps, just text
      });

      let text = result.text;

      // Clean up common Whisper artifacts
      // 1. Trim whitespace
      text = text.trim();

      // 2. Remove leading punctuation and whitespace (period, comma, etc.) that the model sometimes adds
      // This regex matches one or more of: punctuation or whitespace at the start
      text = text.replace(/^[.,!?;:\s]+/g, '');

      // 3. Handle edge case where there's "word. text" at start - remove the orphaned period
      text = text.replace(/^\w+\.\s+/, '');

      console.log('[Whisper] Raw result:', result.text);
      console.log('[Whisper] Cleaned result:', text);

      return text;
    } catch (error) {
      console.error('[Whisper] Transcription error:', error);
      return '';
    }
  }

  /**
   * Check if pipeline is loaded and ready
   */
  isReady(): boolean {
    return this.pipeline !== null;
  }

  /**
   * Release pipeline resources
   */
  dispose(): void {
    this.pipeline = null;
  }
}

// Singleton instance
let instance: WhisperTranscriber | null = null;

export function getWhisperInstance(): WhisperTranscriber {
  if (!instance) {
    instance = new WhisperTranscriber();
  }
  return instance;
}
