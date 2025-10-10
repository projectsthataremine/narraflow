/**
 * Recording Pill with Bar Visualization
 * GPU-accelerated visualization using CSS transforms and custom properties
 */

import React, { useEffect, useRef } from 'react';
import type { PillConfig } from '../types/ipc-contracts';

interface RecordingPillProps {
  isRecording?: boolean;
  config?: PillConfig;
  audioAmplitude?: number; // 0-1 range from real audio
}

const DEFAULT_CONFIG: PillConfig = {
  numBars: 10,
  barWidth: 8,
  barGap: 4,
  maxHeight: 60,
  borderRadius: 4,
  glowIntensity: 20,
  color1: '#a855f7',
  color2: '#60a5fa',
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

  // Generate unique characteristics for each bar (stable across re-renders)
  const barCharacteristics = useRef<Array<{
    speed: number;      // How fast it oscillates
    phaseOffset: number; // Starting point in wave cycle
  }>>([]);

  // Initialize bar characteristics once
  useEffect(() => {
    if (barCharacteristics.current.length === 0) {
      barCharacteristics.current = Array.from({ length: config.numBars }, () => ({
        speed: 2.0 + Math.random() * 3.0,         // Random speed 2-5x
        phaseOffset: Math.random() * Math.PI * 2, // Random starting phase
      }));
    }
  }, [config.numBars]);

  // GPU-accelerated animation loop using CSS custom properties
  useEffect(() => {
    if (!isRecording || !containerRef.current) {
      return;
    }

    const animate = () => {
      const time = Date.now() / 1000;

      // Update each bar's CSS custom property (triggers GPU-accelerated transform)
      barRefs.current.forEach((bar, i) => {
        if (!bar) return;

        const char = barCharacteristics.current[i];
        if (!char) return;

        const barPosition = i / config.numBars; // 0 to 1 across bars

        // EFFECT 1: Fast traveling spike (one bar at a time, ~1 second cycle)
        const spikePhase = (time * 1.0) % 1; // Complete cycle every 1 second
        const distanceFromSpike = Math.abs(barPosition - spikePhase);
        const spike = Math.max(0, 1 - distanceFromSpike * 15) * 0.3; // Sharp peak

        // EFFECT 2: Snake/tube wave (slower, organic bulge traveling through)
        const snakePhase = (time * 0.6) % 1; // Complete cycle every ~1.6 seconds
        const distanceFromSnake = Math.abs(barPosition - snakePhase);
        const snake = Math.exp(-distanceFromSnake * distanceFromSnake * 20) * 0.25; // Gaussian bulge

        // EFFECT 3: Independent random oscillation per bar
        const indie1 = Math.sin(time * char.speed + char.phaseOffset) * 0.12;
        const indie2 = Math.sin(time * char.speed * 0.4 + char.phaseOffset * 1.8) * 0.08;

        // Combine: Boosted audio amplitude + all three effects
        const boostedAudio = audioAmplitude * 2.5; // Increase sensitivity
        const amplitude = Math.max(0.2, Math.min(1.0,
          boostedAudio + spike + snake + indie1 + indie2
        ));

        // Set CSS custom property (no React re-render!)
        bar.style.setProperty('--amplitude', amplitude.toString());
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isRecording, audioAmplitude, config.numBars]);

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
            height: `${config.maxHeight * 2}px`, // Base height
            background: config.useGradient
              ? `linear-gradient(to bottom, ${config.color1}, ${config.color2}, ${config.color1})`
              : config.color1,
            borderRadius: `${config.borderRadius}px`,
            boxShadow:
              config.glowIntensity > 0
                ? `0 0 ${config.glowIntensity}px ${config.color1}aa`
                : 'none',
            // GPU-accelerated transform using CSS custom property
            transform: 'scaleY(var(--amplitude, 0.2))',
            transformOrigin: 'center',
            transition: 'transform 0.1s ease-out',
            // Initialize custom property
            ['--amplitude' as string]: '0.2',
          }}
        />
      ))}
    </div>
  );
};
