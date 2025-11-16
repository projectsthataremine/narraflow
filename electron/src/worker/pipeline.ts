/**
 * Transcription pipeline orchestrator
 * Coordinates: Audio input → VAD → Transcription (SpeechAnalyzer/WhisperKit/Groq) → Result
 * Supports local (SpeechAnalyzer on macOS 26+, WhisperKit on older Macs) and cloud (Groq) transcription
 * Note: Llama formatting happens server-side in the edge function if enabled (Groq only)
 */

import type { TranscriptionResult } from '../types/ipc-contracts';
import { VAD } from './vad';
import { getGroqWhisperInstance } from './groq-whisper';
import { getWhisperKitInstance } from './whisperkit-transcriber';
import { getSpeechAnalyzerInstance } from './speechanalyzer-transcriber';

export interface PipelineConfig {
  trimSilence: boolean;
  enableCleanup: boolean;
  cleanupTimeoutMs: number;
  supabaseUrl: string;
  accessToken: string;
  useSpeechAnalyzer?: boolean; // Use Apple SpeechAnalyzer (macOS 26+ only)
  useWhisperKit?: boolean; // Use local WhisperKit instead of Groq
}

const defaultConfig: Partial<PipelineConfig> = {
  trimSilence: false, // TEMPORARILY DISABLED - VAD model has input mismatch
  enableCleanup: false, // Default OFF - user can enable in settings
  cleanupTimeoutMs: 5000, // Increased for API calls
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
  const cfg = { ...defaultConfig, ...config } as PipelineConfig;
  const startTime = Date.now();

  // Only validate Supabase/auth if using cloud transcription
  const usingLocalTranscription = cfg.useSpeechAnalyzer || cfg.useWhisperKit;
  if (!usingLocalTranscription && (!cfg.supabaseUrl || !cfg.accessToken)) {
    throw new Error('[Pipeline] Supabase URL and access token are required for cloud transcription');
  }

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

  // Stage 2: Transcribe with priority: SpeechAnalyzer > WhisperKit > Groq
  let rawTranscription: string;
  let cleaned: string | undefined;
  let fallbackUsed = false;

  if (cfg.useSpeechAnalyzer) {
    // Use Apple SpeechAnalyzer (macOS 26+ only) - fastest option
    console.log('[Pipeline] Using SpeechAnalyzer for local transcription (macOS 26+)');
    const speechAnalyzer = getSpeechAnalyzerInstance();
    rawTranscription = await speechAnalyzer.transcribe(processedAudio);

    // TODO: Add local Llama formatting support later
    // For now, SpeechAnalyzer provides raw transcription only
    cleaned = undefined;
    fallbackUsed = true; // No cleanup available yet for local
  } else if (cfg.useWhisperKit) {
    // Use local WhisperKit server - works on all Macs
    console.log('[Pipeline] Using WhisperKit for local transcription');
    const whisperKit = getWhisperKitInstance();
    rawTranscription = await whisperKit.transcribe(processedAudio);

    // TODO: Add local Llama formatting support later
    // For now, WhisperKit provides raw transcription only
    cleaned = undefined;
    fallbackUsed = true; // No cleanup available yet for local
  } else {
    // Use Groq cloud via edge function (includes optional Llama formatting)
    console.log('[Pipeline] Using Groq cloud for transcription');
    const groqWhisper = getGroqWhisperInstance(cfg.supabaseUrl);
    rawTranscription = await groqWhisper.transcribe(processedAudio, cfg.accessToken, cfg.enableCleanup);

    // The edge function handles Llama formatting if enableCleanup is true
    // So rawTranscription already contains the formatted text if requested
    fallbackUsed = !cfg.enableCleanup;

    if (cfg.enableCleanup && rawTranscription.trim().length > 0) {
      cleaned = rawTranscription; // Edge function already formatted it
    }
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
