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

// Get Groq API key from environment
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Initialize worker
async function initializeWorker() {
  try {
    console.log('[Worker] Initializing Groq transcription worker...');

    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }

    console.log('[Worker] Groq API key found, worker ready');

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

      if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not set');
      }

      // Run transcription pipeline with Groq
      const result = await transcribe(message.audio, {
        groqApiKey: GROQ_API_KEY,
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
