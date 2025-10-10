/**
 * Renderer app entry point
 * Main React application for the UI overlay
 */

import React, { useState, useEffect, useRef } from 'react';
import { RecordingPill } from './recording-pill';
import { ErrorPopup } from './error-popup';
import type { UIState, PillConfig } from '../types/ipc-contracts';
import { IPC_CHANNELS } from '../types/ipc-contracts';
import { WebAudioCapture } from './audio-capture';
import { config } from 'process';

// Electron IPC renderer (will be available via preload)
declare global {
  interface Window {
    electron: {
      on: (channel: string, callback: (data: any) => void) => void;
      send: (channel: string, data: any) => void;
    };
  }
}

export const App: React.FC = () => {
  const [uiState, setUiState] = useState<UIState>({
    mode: 'hidden',
  });

  // Default pill config (matches main process defaults)
  const [pillConfig, setPillConfig] = useState<PillConfig>({
    numBars: 10,
    barWidth: 4,
    barGap: 6,
    maxHeight: 60,
    borderRadius: 12,
    glowIntensity: 0.6,
    color1: '#3b82f6',
    color2: '#8b5cf6',
    useGradient: true,
  });

  const audioCaptureRef = useRef<WebAudioCapture | null>(null);
  const isRecordingRef = useRef(false);

  // Track audio amplitude for visualization (single state, no separate smoothing)
  const [audioAmplitude, setAudioAmplitude] = useState(0);
  const amplitudeDecayInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio capture with AnalyserNode
  useEffect(() => {
    audioCaptureRef.current = new WebAudioCapture({
      sampleRate: 16000,
      onAmplitude: (amplitude: number) => {
        // AnalyserNode already provides smoothed amplitude (hardware-accelerated)
        setAudioAmplitude(amplitude);

        // DISABLED: Audio pipeline for transcription (focusing on visualization only)
        // if (window.electron && isRecordingRef.current) {
        //   const chunkArray = Array.from(chunk);
        //   window.electron.send(IPC_CHANNELS.AUDIO_DATA, { chunk: chunkArray });
        // }
      },
      onError: (error: Error) => {
        console.error('[WebAudioCapture] Error:', error);
      },
    });

    return () => {
      // Cleanup on unmount (properly release microphone)
      if (audioCaptureRef.current?.isActive()) {
        audioCaptureRef.current.stop().catch((error) => {
          console.error('[App] Error during cleanup:', error);
        });
      }

      // Clear decay interval
      if (amplitudeDecayInterval.current) {
        clearInterval(amplitudeDecayInterval.current);
      }
    };
  }, []);

  // Handle UI state changes - start/stop recording based on mode
  useEffect(() => {
    const audioCapture = audioCaptureRef.current;
    if (!audioCapture) return;

    const shouldRecord =
      uiState.mode === 'loading' || uiState.mode === 'silent' || uiState.mode === 'talking';

    if (shouldRecord && !isRecordingRef.current) {
      // Start recording
      console.log('[App] Starting audio capture');
      audioCapture.start().then((success) => {
        if (success) {
          isRecordingRef.current = true;
          console.log('[App] Audio capture started successfully');
        } else {
          console.error('[App] Failed to start audio capture');
        }
      });
    } else if (!shouldRecord && isRecordingRef.current) {
      // Stop recording (async to properly release microphone)
      console.log('[App] Stopping audio capture');
      audioCapture
        .stop()
        .then(() => {
          console.log('[App] Audio capture stopped successfully');
        })
        .catch((error) => {
          console.error('[App] Error stopping audio capture:', error);
        });
      isRecordingRef.current = false;

      // Start smooth amplitude decay to zero
      if (amplitudeDecayInterval.current) {
        clearInterval(amplitudeDecayInterval.current);
      }

      amplitudeDecayInterval.current = setInterval(() => {
        setAudioAmplitude((prev) => {
          const decayed = prev * 0.85; // Decay by 15% each frame
          if (decayed < 0.01) {
            // Clear interval when amplitude is nearly zero
            if (amplitudeDecayInterval.current) {
              clearInterval(amplitudeDecayInterval.current);
              amplitudeDecayInterval.current = null;
            }
            return 0;
          }
          return decayed;
        });
      }, 50); // 20fps decay
    }
  }, [uiState.mode]);

  useEffect(() => {
    // Subscribe to UI state updates from main process
    if (window.electron) {
      window.electron.on(IPC_CHANNELS.UI_STATE_UPDATE, (event: any) => {
        setUiState(event.state);
      });

      window.electron.on(IPC_CHANNELS.VAD_UPDATE, (event: any) => {
        // Update VAD probability in current state
        setUiState((prev) => ({
          ...prev,
          vadProbability: event.probability,
        }));
      });

      window.electron.on(IPC_CHANNELS.ERROR_NOTIFICATION, (event: any) => {
        setUiState((prev) => ({
          ...prev,
          mode: 'hidden',
          message: event.message,
        }));
      });

      window.electron.on(IPC_CHANNELS.PILL_CONFIG_UPDATE, (event: any) => {
        console.log('[Overlay] Received pill config update:', event.config);
        setPillConfig(event.config);
      });
    }
  }, []);

  // Debug: log when pillConfig changes
  useEffect(() => {
    if (pillConfig) {
      console.log('[Overlay] Pill config updated:', pillConfig);
    }
  }, [pillConfig]);

  const handleErrorDismiss = () => {
    setUiState((prev) => ({
      ...prev,
      message: undefined,
    }));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      {/* Pill positioned at bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: '50%',
          left: '50%',
          transform: 'translate(-50%, 50%)',
          pointerEvents: 'auto',
        }}
      >
        <RecordingPill
          isRecording={uiState.mode !== 'hidden'}
          config={pillConfig}
          audioAmplitude={audioAmplitude}
        />
      </div>

      <ErrorPopup message={uiState.message} onDismiss={handleErrorDismiss} />
    </div>
  );
};
