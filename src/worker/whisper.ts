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

      // Use Function() workaround for ESM compatibility
      const TransformersApi = Function('return import("@xenova/transformers")')();
      const { pipeline } = await TransformersApi;

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
      const result = await this.pipeline(audio, {
        language: 'english',
      });

      return result.text.trim();
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
