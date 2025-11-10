'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/**
 * RecordingVisual - Animated thick bars visualization
 * Based on the prototype from ui-tests/ThickBarsVisualization
 *
 * Shows thick gradient bars that animate to simulate recording with fake audio data
 */
export default function RecordingVisual() {
  const NUM_BARS = 7;
  const BAR_WIDTH = 75;
  const BAR_GAP = 16;
  const MAX_HEIGHT = 120;
  const BORDER_RADIUS = 8;
  const GLOW_INTENSITY = 0;
  const COLOR = '#2563eb'; // Blue-600 (matching site buttons)

  const [amplitude, setAmplitude] = useState(0);
  const [barAmplitudes, setBarAmplitudes] = useState<number[]>(Array(NUM_BARS).fill(0.05));
  const barCharacteristics = useRef<{ speed: number; phaseOffset: number }[]>([]);

  // Fake audio simulation refs
  const phaseRef = useRef('silence' as 'silence' | 'ramping' | 'speaking' | 'fading');
  const phaseTimeRef = useRef(0);
  const targetAmplitudeRef = useRef(0);
  const smoothedAmplitudeRef = useRef(0);

  // Initialize bar characteristics once
  useEffect(() => {
    if (barCharacteristics.current.length === 0) {
      barCharacteristics.current = Array.from({ length: NUM_BARS }, () => ({
        speed: 2.0 + Math.random() * 3.0,
        phaseOffset: Math.random() * Math.PI * 2,
      }));
    }
  }, []);

  // Fake audio simulation (from AudioDataProvider)
  useEffect(() => {
    const UPDATE_INTERVAL = 32; // ~32ms update rate

    const interval = setInterval(() => {
      phaseTimeRef.current += UPDATE_INTERVAL;
      let newAmplitude = 0;

      switch (phaseRef.current) {
        case 'silence':
          // Low background noise
          newAmplitude = 0.01 + Math.random() * 0.02;

          // Randomly start speaking (~90% chance per second)
          if (Math.random() < 0.9 * (UPDATE_INTERVAL / 1000)) {
            phaseRef.current = 'ramping';
            phaseTimeRef.current = 0;
            targetAmplitudeRef.current = 0.5 + Math.random() * 0.45; // Target 50-95%
          }
          break;

        case 'ramping':
          // Gradually ramp up over ~100-200ms
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

          // Speak for 1-2.5 seconds
          const speakDuration = 1000 + Math.random() * 1500;
          if (phaseTimeRef.current >= speakDuration) {
            phaseRef.current = 'fading';
            phaseTimeRef.current = 0;
          }
          break;

        case 'fading':
          // Gradually fade out over ~100-200ms
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
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Animation loop for bar effects
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      const time = Date.now() / 1000;

      // Smooth the amplitude changes
      const attackSpeed = 0.3;
      const releaseSpeed = 0.035;

      if (amplitude > smoothedAmplitudeRef.current) {
        smoothedAmplitudeRef.current += (amplitude - smoothedAmplitudeRef.current) * attackSpeed;
      } else {
        smoothedAmplitudeRef.current += (amplitude - smoothedAmplitudeRef.current) * releaseSpeed;
      }

      const audioAmplitude = smoothedAmplitudeRef.current;

      // Spike wave parameters
      const spikeSpeed = 1.0;
      const spikeIntensity = 0.3;
      const spikePosition = (time * spikeSpeed) % 1;

      // Oscillation parameters
      const oscAmount = 0.08;
      const oscSpeed = 2.5;

      // Calculate amplitude for each bar
      const newBarAmplitudes = Array.from({ length: NUM_BARS }, (_, i) => {
        const char = barCharacteristics.current[i];
        if (!char) return 0.05;

        const barPosition = i / (NUM_BARS - 1);

        // Independent oscillation
        const oscillationAmount = Math.sin(time * char.speed * oscSpeed + char.phaseOffset) * oscAmount;
        const scaledOscillation = oscillationAmount * Math.max(0.05, audioAmplitude);

        // Spike wave effect
        const distance = Math.abs(barPosition - spikePosition);
        const sharpness = NUM_BARS * 2;
        const spikeEffect = Math.max(0, 1 - distance * sharpness) * spikeIntensity * audioAmplitude;

        // Combine effects
        return Math.max(0.05, Math.min(1.5,
          audioAmplitude + scaledOscillation + spikeEffect
        ));
      });

      setBarAmplitudes(newBarAmplitudes);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [amplitude]);

  const bars = Array.from({ length: NUM_BARS }, (_, i) => i);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: `${MAX_HEIGHT * 2 + 40}px`,
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: `${BAR_GAP}px`,
          alignItems: 'center',
          height: '100%',
        }}
      >
        {bars.map((index) => (
          <motion.div
            key={index}
            initial={{ scaleY: 0.05 }}
            animate={{ scaleY: barAmplitudes[index] || 0.05 }}
            transition={{ duration: 0.05, ease: 'easeOut' }}
            style={{
              width: `${BAR_WIDTH}px`,
              height: `${MAX_HEIGHT * 2}px`,
              background: COLOR,
              borderRadius: `${BORDER_RADIUS}px`,
              boxShadow: GLOW_INTENSITY === 0 ? 'none' : `0 0 ${GLOW_INTENSITY}px ${COLOR}aa`,
              transformOrigin: 'center',
            }}
          />
        ))}
      </div>
    </div>
  );
}
