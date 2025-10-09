/**
 * Renderer app entry point
 * Main React application for the UI overlay
 */

import React, { useState, useEffect, useRef } from 'react';
import { Pill, pillStyles } from './pill';
import { ErrorPopup } from './error-popup';
import type { UIState } from '../types/ipc-contracts';
import { IPC_CHANNELS } from '../types/ipc-contracts';
import { WebAudioCapture } from './audio-capture';

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

  const [gradientRotation, setGradientRotation] = useState(0);
  const audioCaptureRef = useRef<WebAudioCapture | null>(null);
  const isRecordingRef = useRef(false);

  // Initialize audio capture
  useEffect(() => {
    audioCaptureRef.current = new WebAudioCapture({
      sampleRate: 16000,
      onAudioData: (chunk: Float32Array) => {
        // Send audio chunk to main process
        if (window.electron && isRecordingRef.current) {
          // Convert Float32Array to regular array for IPC
          const chunkArray = Array.from(chunk);
          window.electron.send(IPC_CHANNELS.AUDIO_DATA, { chunk: chunkArray });
        }
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
    };
  }, []);

  // Handle UI state changes - start/stop recording based on mode
  useEffect(() => {
    const audioCapture = audioCaptureRef.current;
    if (!audioCapture) return;

    const shouldRecord = uiState.mode === 'loading' || uiState.mode === 'silent' || uiState.mode === 'talking';

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
      audioCapture.stop().then(() => {
        console.log('[App] Audio capture stopped successfully');
      }).catch((error) => {
        console.error('[App] Error stopping audio capture:', error);
      });
      isRecordingRef.current = false;
    }
  }, [uiState.mode]);

  // Animate gradient rotation for Siri effect
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientRotation((prev) => (prev + 1) % 360);
    }, 30); // Update every 30ms for smooth animation
    return () => clearInterval(interval);
  }, []);

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
    }
  }, []);

  const handleErrorDismiss = () => {
    setUiState((prev) => ({
      ...prev,
      message: undefined,
    }));
  };

  return (
    <>
      <style>{pillStyles}</style>
      <style>{borderStyles}</style>
      {/* Always show border for testing */}
      <div className="has-glow">
        <div className="glow">
          <div className="glow-bg"></div>
        </div>
      </div>
      <Pill mode={uiState.mode} vadProbability={uiState.vadProbability} />
      <ErrorPopup message={uiState.message} onDismiss={handleErrorDismiss} />
    </>
  );
};

// Siri-style animated border - iOS 18 conic gradient effect
const borderStyles = `
  @property --gradient-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }

  .has-glow {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 4px;
    pointer-events: none;
    z-index: 99999;
  }

  .has-glow::before,
  .has-glow::after {
    content: '';
    position: absolute;
    inset: -0.5rem 0 0 0;
    background: conic-gradient(
      from var(--gradient-angle),
      #FF0080,
      #7928CA,
      #0070F3,
      #00DFD8,
      #79FFE1,
      #FFAA00,
      #FF4D4D,
      #FF0080,
      #7928CA,
      #0070F3,
      #00DFD8,
      #79FFE1,
      #FFAA00,
      #FF4D4D,
      #FF0080
    );
    animation: rotation 3s linear infinite;
  }

  .has-glow::after {
    filter: blur(20px);
  }

  .glow {
    display: none;
  }

  .glow-bg {
    display: none;
  }

  @keyframes rotation {
    0% {
      --gradient-angle: 0deg;
    }
    100% {
      --gradient-angle: 360deg;
    }
  }
`;
