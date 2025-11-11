/**
 * Renderer app entry point
 * Main React application for the UI overlay
 */

import React, { useState, useEffect, useRef } from 'react';
import { RecordingPill } from './recording-pill';
import { ErrorPopup } from './error-popup';
import type { UIState, PillConfig } from '../types/ipc-contracts';
import { IPC_CHANNELS } from '../types/ipc-contracts';
import { AudioVisualizer } from './audio-visualizer';
import { AudioRecorder } from './audio-recorder';

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
    numBars: 11,
    barWidth: 3,
    barGap: 2,
    maxHeight: 11,
    borderRadius: 40,
    glowIntensity: 0,
    color1: '#0090ff',
    color2: '#0090ff',
    useGradient: false,
  });

  // Separate modules for visualization and recording
  const visualizerRef = useRef<AudioVisualizer | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const isRecordingRef = useRef(false);
  const sharedStreamRef = useRef<MediaStream | null>(null);

  // Track audio amplitude for pill visualization
  const [audioAmplitude, setAudioAmplitude] = useState(0);
  const amplitudeDecayInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize both audio modules
  useEffect(() => {
    // Initialize visualizer for pill animation
    visualizerRef.current = new AudioVisualizer({
      sampleRate: 16000,
      onAmplitude: (amplitude: number, rms?: number) => {
        setAudioAmplitude(amplitude);
      },
      onError: (error: Error) => {
        console.error('[AudioVisualizer] Error:', error);
      },
    });

    // Initialize recorder for transcription
    recorderRef.current = new AudioRecorder({
      sampleRate: 16000,
      onError: (error: Error) => {
        console.error('[AudioRecorder] Error:', error);
      },
    });

    return () => {
      // Cleanup on unmount
      if (visualizerRef.current?.isRunning()) {
        visualizerRef.current.stop().catch((error) => {
          console.error('[App] Error stopping visualizer:', error);
        });
      }

      if (recorderRef.current?.isActive()) {
        recorderRef.current.stop().catch((error) => {
          console.error('[App] Error stopping recorder:', error);
        });
      }

      // Clear decay interval
      if (amplitudeDecayInterval.current) {
        clearInterval(amplitudeDecayInterval.current);
      }

      // Stop shared stream
      if (sharedStreamRef.current) {
        sharedStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle UI state changes - start/stop both visualization and recording
  useEffect(() => {
    const visualizer = visualizerRef.current;
    const recorder = recorderRef.current;
    if (!visualizer || !recorder) return;

    const shouldRecord =
      uiState.mode === 'loading' || uiState.mode === 'silent' || uiState.mode === 'talking';

    if (shouldRecord && !isRecordingRef.current) {
      // Start both visualizer and recorder with shared stream
      console.log('[App] Starting audio modules');

      // Request microphone once
      navigator.mediaDevices
        .getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        })
        .then((stream) => {
          sharedStreamRef.current = stream;

          // Start visualizer with shared stream
          return visualizer.start(stream).then((vizSuccess) => {
            if (!vizSuccess) {
              throw new Error('Failed to start visualizer');
            }

            // Start recorder with same stream
            return recorder.start(stream).then((recSuccess) => {
              if (!recSuccess) {
                throw new Error('Failed to start recorder');
              }

              isRecordingRef.current = true;
              console.log('[App] Both audio modules started successfully');
            });
          });
        })
        .catch((error) => {
          console.error('[App] Failed to start audio modules:', error);
        });
    } else if (!shouldRecord && isRecordingRef.current) {
      // Stop both modules
      console.log('[App] Stopping audio modules');

      // Get audio data BEFORE stopping recorder
      const audioData = recorder.getAudioData();
      console.log(`[App] Collected ${audioData.length} audio samples for transcription`);

      // Send to main process for transcription
      if (window.electron && audioData.length > 0) {
        const audioArray = Array.from(audioData);
        window.electron.send(IPC_CHANNELS.AUDIO_DATA, { audio: audioArray });
        console.log('[App] Sent audio data to main process');
      }

      // Stop recorder (don't close stream yet)
      recorder
        .stop(false)
        .then(() => {
          console.log('[App] Recorder stopped');
          // Then stop visualizer (closes stream)
          return visualizer.stop(true);
        })
        .then(() => {
          console.log('[App] Visualizer stopped');
          sharedStreamRef.current = null;
        })
        .catch((error) => {
          console.error('[App] Error stopping audio modules:', error);
        });

      isRecordingRef.current = false;

      // Start amplitude decay animation
      if (amplitudeDecayInterval.current) {
        clearInterval(amplitudeDecayInterval.current);
      }

      amplitudeDecayInterval.current = setInterval(() => {
        setAudioAmplitude((prev) => {
          const decayed = prev * 0.85;
          if (decayed < 0.01) {
            if (amplitudeDecayInterval.current) {
              clearInterval(amplitudeDecayInterval.current);
              amplitudeDecayInterval.current = null;
            }
            return 0;
          }
          return decayed;
        });
      }, 50);
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
          bottom: 'calc(50% - 60px)',
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

      {/* Debug RMS display - commented out but kept for future use */}
      {/* {debugRMS > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#00ff00',
            padding: '10px 15px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '14px',
            pointerEvents: 'none',
          }}
        >
          RMS: {debugRMS.toFixed(4)}
        </div>
      )} */}
    </div>
  );
};
