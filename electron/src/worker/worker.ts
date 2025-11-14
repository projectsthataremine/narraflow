/**
 * Worker thread entry point
 * Handles transcription requests from main process
 */

import { parentPort } from 'worker_threads';
import type { TranscribeRequest, TranscribeResponse } from '../types/ipc-contracts';
import { transcribe } from './pipeline';

if (!parentPort) {
  throw new Error('This file must be run as a Worker thread');
}

// Get Supabase URL from environment
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://buqkvxtxjwyohzsogfbz.supabase.co';

// Initialize worker
async function initializeWorker() {
  try {
    console.log('[Worker] Initializing Groq transcription worker via edge function...');

    if (!SUPABASE_URL) {
      throw new Error('Supabase URL not configured');
    }

    console.log('[Worker] Supabase configured, worker ready');

    // Signal that worker is ready
    parentPort!.postMessage({ type: 'WorkerReady' });
  } catch (error) {
    console.error('[Worker] Failed to initialize worker:', error);
    parentPort!.postMessage({
      type: 'TranscribeError',
      error: error instanceof Error ? error.message : 'Failed to initialize worker',
    });
  }
}

// Listen for messages from main process
parentPort.on('message', async (message: any) => {
  console.log('[Worker] Received message:', message.type);

  if (message.type === 'Transcribe') {
    try {
      console.log('[Worker] Starting transcription...');
      const startTime = Date.now();

      if (!SUPABASE_URL) {
        throw new Error('Supabase URL not configured');
      }

      if (!message.accessToken) {
        throw new Error('Access token required for transcription');
      }

      // Run transcription pipeline via edge function
      const result = await transcribe(message.audio, {
        supabaseUrl: SUPABASE_URL,
        accessToken: message.accessToken,
        enableCleanup: message.enableLlamaFormatting ?? false,
        trimSilence: message.trimSilence ?? false,
      });

      const processingTime = Date.now() - startTime;
      console.log('[Worker] Transcription completed in', processingTime, 'ms');

      const response: TranscribeResponse = {
        raw: result.raw,
        cleaned: result.cleaned,
        fallbackUsed: result.fallbackUsed,
      };

      console.log('[Worker] Sending response:', response);

      // Send result back to main process
      parentPort!.postMessage({
        type: 'TranscribeResponse',
        ...response,
        processingTime,
      });
    } catch (error) {
      console.error('[Worker] Error during transcription:', error);
      // Send error back to main process
      parentPort!.postMessage({
        type: 'TranscribeError',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// Initialize worker
initializeWorker();
