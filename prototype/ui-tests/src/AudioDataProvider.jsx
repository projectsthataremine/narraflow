import React, { useState, useEffect, useRef } from 'react';

/**
 * AudioDataProvider - Simulates real-time audio amplitude data
 *
 * Generates fake audio data that mimics human speech patterns:
 * - Gradual ramp up when starting to speak
 * - Natural variation while speaking
 * - Gradual fade out at end of phrase
 * - Periods of silence between phrases
 * - Random variations to simulate natural speech dynamics
 */
function AudioDataProvider({ children }) {
  const [amplitude, setAmplitude] = useState(0);
  const [audioHistory, setAudioHistory] = useState([]);
  const phaseRef = useRef('silence'); // 'silence', 'ramping', 'speaking', 'fading'
  const phaseTimeRef = useRef(0);
  const targetAmplitudeRef = useRef(0);

  useEffect(() => {
    // Update interval matches the audio capture rate (~32ms for 512 samples at 16kHz)
    const UPDATE_INTERVAL = 32;
    const MAX_HISTORY = 50; // Keep last 50 samples (~1.6 seconds)

    const interval = setInterval(() => {
      phaseTimeRef.current += UPDATE_INTERVAL;
      let newAmplitude = 0;

      switch (phaseRef.current) {
        case 'silence':
          // Low background noise
          newAmplitude = 0.01 + Math.random() * 0.02;

          // Randomly start speaking (very high chance - ~90% per second, shorter silence)
          if (Math.random() < 0.9 * (UPDATE_INTERVAL / 1000)) {
            phaseRef.current = 'ramping';
            phaseTimeRef.current = 0;
            targetAmplitudeRef.current = 0.5 + Math.random() * 0.45; // Target 50-95%
            console.log('🎤 Starting to speak, target:', (targetAmplitudeRef.current * 100).toFixed(0) + '%');
          }
          break;

        case 'ramping':
          // Gradually ramp up over ~100-200ms (faster)
          const rampDuration = 100 + Math.random() * 100;
          const rampProgress = Math.min(1, phaseTimeRef.current / rampDuration);
          newAmplitude = targetAmplitudeRef.current * rampProgress + (Math.random() * 0.05);

          if (phaseTimeRef.current >= rampDuration) {
            phaseRef.current = 'speaking';
            phaseTimeRef.current = 0;
          }
          break;

        case 'speaking':
          // Natural variation while speaking (±20%)
          const variation = (Math.random() - 0.5) * 0.4;
          newAmplitude = Math.max(0.4, Math.min(1.0, targetAmplitudeRef.current + variation));

          // Update target slightly for natural movement
          targetAmplitudeRef.current += (Math.random() - 0.5) * 0.08;
          targetAmplitudeRef.current = Math.max(0.5, Math.min(0.95, targetAmplitudeRef.current));

          // Speak for 1-2.5 seconds (longer active periods)
          const speakDuration = 1000 + Math.random() * 1500;
          if (phaseTimeRef.current >= speakDuration) {
            phaseRef.current = 'fading';
            phaseTimeRef.current = 0;
          }
          break;

        case 'fading':
          // Gradually fade out over ~100-200ms (faster)
          const fadeDuration = 100 + Math.random() * 100;
          const fadeProgress = Math.min(1, phaseTimeRef.current / fadeDuration);
          newAmplitude = targetAmplitudeRef.current * (1 - fadeProgress) + (Math.random() * 0.03);

          if (phaseTimeRef.current >= fadeDuration) {
            phaseRef.current = 'silence';
            phaseTimeRef.current = 0;
          }
          break;
      }

      // Cap amplitude at 1.0
      newAmplitude = Math.min(1.0, Math.max(0, newAmplitude));

      setAmplitude(newAmplitude);
      setAudioHistory(prev => {
        const newHistory = [...prev, newAmplitude];
        return newHistory.slice(-MAX_HISTORY);
      });
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Pass amplitude and history to children
  return (
    <>
      {React.Children.map(children, child =>
        React.cloneElement(child, { amplitude, audioHistory })
      )}
    </>
  );
}

export default AudioDataProvider;
