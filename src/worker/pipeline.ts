/**
 * Transcription pipeline orchestrator
 * Coordinates: Audio input → VAD → Transcribe → Cleanup → Result
 */

import type { TranscriptionResult } from '../types/ipc-contracts';
import { VAD } from './vad';
import { getWhisperInstance } from './whisper';
import { cleanupText } from '../rewrite/llama';

export interface PipelineConfig {
  trimSilence: boolean;
  enableCleanup: boolean;
  cleanupTimeoutMs: number;
}

const defaultConfig: PipelineConfig = {
  trimSilence: false, // TEMPORARILY DISABLED - VAD model has input mismatch
  enableCleanup: true,
  cleanupTimeoutMs: 300,
};

// Singleton VAD instance
let vadInstance: VAD | null = null;

async function getVADInstance(): Promise<VAD> {
  if (!vadInstance) {
    vadInstance = new VAD();
    await vadInstance.initialize();
  }
  return vadInstance;
}

/**
 * Main transcription pipeline
 * Processes audio through all stages and returns final result
 */
export async function transcribe(
  audio: Float32Array,
  config: Partial<PipelineConfig> = {}
): Promise<TranscriptionResult> {
  const cfg = { ...defaultConfig, ...config };
  const startTime = Date.now();

  // Stage 1: VAD - extract speech segments
  let processedAudio = audio;
  if (cfg.trimSilence) {
    const vad = await getVADInstance();
    const speechSegments = await vad.findSpeechSegments(audio);

    // Check if no speech found
    if (speechSegments.length === 0) {
      return {
        raw: '',
        fallbackUsed: false,
        processingTime: Date.now() - startTime,
      };
    }

    // Concatenate all speech segments (removes all silence)
    const totalSpeechLength = speechSegments.reduce((sum, [start, end]) => sum + (end - start), 0);
    processedAudio = new Float32Array(totalSpeechLength);

    let offset = 0;
    for (const [start, end] of speechSegments) {
      const segment = audio.slice(start, end);
      processedAudio.set(segment, offset);
      offset += segment.length;
    }

    // Check if too little speech (less than 0.5 seconds)
    const minSamples = 0.5 * 16000;
    if (processedAudio.length < minSamples) {
      return {
        raw: '',
        fallbackUsed: false,
        processingTime: Date.now() - startTime,
      };
    }
  }

  // Stage 2: Transcribe with Whisper
  const whisper = getWhisperInstance();
  const rawTranscription = await whisper.transcribe(processedAudio);

  // Stage 3: Cleanup text (optional)
  let cleaned: string | undefined;
  let fallbackUsed = false;

  if (cfg.enableCleanup && rawTranscription.trim().length > 0) {
    try {
      const cleanupResult = await Promise.race([
        cleanupText(rawTranscription),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), cfg.cleanupTimeoutMs)),
      ]);

      if (cleanupResult) {
        cleaned = cleanupResult.cleaned;
        fallbackUsed = cleanupResult.usedFallback;
      } else {
        // Timeout occurred
        fallbackUsed = true;
      }
    } catch (error) {
      // Cleanup failed, use fallback
      console.warn('Text cleanup failed:', error);
      fallbackUsed = true;
    }
  } else {
    fallbackUsed = true; // No cleanup attempted
  }

  const processingTime = Date.now() - startTime;

  return {
    raw: rawTranscription,
    cleaned,
    fallbackUsed,
    processingTime,
  };
}

/**
 * Process audio and get final text (cleaned or raw)
 */
export async function transcribeToText(
  audio: Float32Array,
  config?: Partial<PipelineConfig>
): Promise<string> {
  const result = await transcribe(audio, config);
  return result.cleaned ?? result.raw;
}

/**
 * Check if audio contains enough speech for transcription
 */
export async function hasEnoughSpeech(audio: Float32Array): Promise<boolean> {
  const vad = await getVADInstance();
  const speechSegments = await vad.findSpeechSegments(audio);

  // Calculate total speech duration
  const totalSpeechSamples = speechSegments.reduce((sum, [start, end]) => sum + (end - start), 0);

  // Need at least 0.5 seconds of speech
  const minSamples = 0.5 * 16000;
  return totalSpeechSamples >= minSamples;
}
