/**
 * Recording Pill with Bar Visualization
 * Ported from working prototype - oscillation + spike effects
 */

import React, { useEffect, useRef, useState } from 'react';
import type { PillConfig } from '../types/ipc-contracts';

interface RecordingPillProps {
  isRecording?: boolean;
  config?: PillConfig;
  audioAmplitude?: number; // 0-1 range from real audio
}

// Default config matching working prototype preset
const DEFAULT_CONFIG: PillConfig = {
  numBars: 11,
  barWidth: 6,
  barGap: 2,
  maxHeight: 15,
  borderRadius: 6,
  glowIntensity: 0,
  color1: '#10b981',
  color2: '#14b8a6',
  useGradient: true,
};

export const RecordingPill: React.FC<RecordingPillProps> = ({
  isRecording = true,
  config = DEFAULT_CONFIG,
  audioAmplitude = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const realAmplitudeRef = useRef(0);
  const smoothedAmplitudeRef = useRef(0);

  // Store config values in ref so animation loop can read them without restarting
  const configRef = useRef({
    attackSpeed: 0.18,
    releaseSpeed: 0.04,
    oscillationAmount: 0.09,
    oscillationSpeed: 4.6,
    spikeSpeed: 1.1,
    spikeIntensity: 0.4,
  });

  // Generate unique characteristics for each bar (stable across re-renders)
  const barCharacteristics = useRef<Array<{
    speed: number;
    phaseOffset: number;
  }>>([]);

  // Initialize bar characteristics once (reinitialize when numBars changes)
  useEffect(() => {
    if (barCharacteristics.current.length !== config.numBars) {
      barCharacteristics.current = Array.from({ length: config.numBars }, () => ({
        speed: 2.0 + Math.random() * 3.0,
        phaseOffset: Math.random() * Math.PI * 2,
      }));
    }
  }, [config.numBars]);

  // Update realAmplitudeRef when audioAmplitude prop changes
  useEffect(() => {
    realAmplitudeRef.current = audioAmplitude;
  }, [audioAmplitude]);

  // GPU-accelerated animation loop (exact port from prototype)
  useEffect(() => {
    if (!isRecording || !containerRef.current) {
      return;
    }

    let frameCount = 0;

    const animate = () => {
      const time = Date.now() / 1000;
      const rawAmplitude = realAmplitudeRef.current;

      // Read config from ref
      const attackSpeed = configRef.current.attackSpeed;
      const releaseSpeed = configRef.current.releaseSpeed;
      const oscAmount = configRef.current.oscillationAmount;
      const oscSpeed = configRef.current.oscillationSpeed;
      const spikeSpeed = configRef.current.spikeSpeed;
      const spikeIntensity = configRef.current.spikeIntensity;

      // Attack/release envelope (same as prototype)
      if (rawAmplitude > smoothedAmplitudeRef.current) {
        smoothedAmplitudeRef.current += (rawAmplitude - smoothedAmplitudeRef.current) * attackSpeed;
      } else {
        smoothedAmplitudeRef.current += (rawAmplitude - smoothedAmplitudeRef.current) * releaseSpeed;
      }

      const audioAmplitude = smoothedAmplitudeRef.current;
      frameCount++;

      // PHASE 2: Fast spike wave (travels left to right)
      const spikePosition = (time * spikeSpeed) % 1;

      // PHASE 1: Independent bar oscillation (amplitude-sensitive)
      barRefs.current.forEach((bar, i) => {
        if (!bar) return;

        const char = barCharacteristics.current[i];
        if (!char) return;

        // Calculate bar position (0-1 across all bars)
        // Use NUM_BARS to ensure even distribution, avoiding edge case with last bar
        const barPosition = config.numBars > 1 ? i / (config.numBars - 1) : 0;

        // Independent oscillation - scaled by audio amplitude
        const oscillationAmount = Math.sin(time * char.speed * oscSpeed + char.phaseOffset) * oscAmount;
        const scaledOscillation = oscillationAmount * Math.max(0.05, audioAmplitude);

        // Spike wave - affects only the bar at spikePosition
        const distance = Math.abs(barPosition - spikePosition);
        const sharpness = config.numBars * 2;
        const spikeEffect = Math.max(0, 1 - distance * sharpness) * spikeIntensity * audioAmplitude;

        // Combine: base audio amplitude + scaled oscillation + spike
        const finalAmplitude = Math.max(0.05, Math.min(1.5,
          audioAmplitude + scaledOscillation + spikeEffect
        ));

        bar.style.setProperty('--amplitude', finalAmplitude.toString());
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isRecording, config.numBars]);

  if (!isRecording) {
    return null;
  }

  // Generate bars array
  const bars = Array.from({ length: config.numBars }, (_, i) => i);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        gap: `${config.barGap}px`,
        alignItems: 'center',
        height: `${config.maxHeight * 2}px`,
      }}
    >
      {bars.map((index) => (
        <div
          key={index}
          ref={(el) => (barRefs.current[index] = el)}
          style={{
            width: `${config.barWidth}px`,
            height: `${config.maxHeight * 2}px`,
            background: config.useGradient
              ? `linear-gradient(to bottom, ${config.color1}, ${config.color2}, ${config.color1})`
              : config.color1,
            borderRadius: `${config.borderRadius}px`,
            boxShadow:
              config.glowIntensity > 0
                ? `0 0 ${config.glowIntensity}px ${config.color1}aa`
                : 'none',
            transform: 'scaleY(var(--amplitude, 0.2))',
            transformOrigin: 'center',
            transition: 'transform 0.1s ease-out',
            ['--amplitude' as string]: '0.2',
          }}
        />
      ))}
    </div>
  );
};
