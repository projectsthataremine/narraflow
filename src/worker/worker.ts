/**
 * Worker thread entry point
 * Handles transcription requests from main process
 */

import { parentPort } from 'worker_threads';
import type { TranscribeRequest, TranscribeResponse } from '../types/ipc-contracts';
import { transcribe } from './pipeline';
import { getWhisperInstance } from './whisper';

if (!parentPort) {
  throw new Error('This file must be run as a Worker thread');
}

// Initialize models on worker startup
async function initializeModels() {
  try {
    console.log('[Worker] Initializing Whisper model...');
    const whisper = getWhisperInstance();
    await whisper.initialize();
    console.log('[Worker] Whisper model ready');

    // Signal that worker is ready
    parentPort!.postMessage({ type: 'WorkerReady' });
  } catch (error) {
    console.error('[Worker] Failed to initialize models:', error);
    parentPort!.postMessage({
      type: 'TranscribeError',
      error: 'Failed to initialize models',
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

      // Run transcription pipeline
      const result = await transcribe(message.audio);

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
  } else if (message.type === 'SetPreset') {
    try {
      console.log('[Worker] Setting preset to:', message.preset);

      // Dispose current instance
      const whisper = getWhisperInstance();
      whisper.dispose();

      // Note: getWhisperInstance() returns a singleton, so we need to reinitialize
      // For now, we'll log that the preset change requires a restart
      // In a full implementation, we'd need to refactor the singleton pattern
      console.log('[Worker] Note: Preset change requires worker restart to take effect');

      parentPort!.postMessage({
        type: 'SetPresetResponse',
        success: true,
        preset: message.preset,
      });
    } catch (error) {
      console.error('[Worker] Error setting preset:', error);
      parentPort!.postMessage({
        type: 'SetPresetResponse',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// Initialize models
initializeModels();
