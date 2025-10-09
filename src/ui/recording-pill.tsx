/**
 * Recording Pill with Bar Visualization
 * Shows animated bars that respond to audio (static for now)
 */

import React, { useState } from 'react';
import type { PillConfig } from '../types/ipc-contracts';

interface RecordingPillProps {
  isRecording?: boolean;
  config?: PillConfig;
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
}) => {

  // Simulated amplitude (static for now - will connect to real audio later)
  const [amplitude] = useState(0.7);

  // Generate bar heights with random variation
  const displayData = Array.from({ length: config.numBars }, () => {
    const variation = (Math.random() - 0.5) * 0.2;
    return Math.max(0.3, Math.min(1.0, amplitude + variation));
  });

  if (!isRecording) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: `${config.barGap}px`,
        alignItems: 'center',
        height: `${config.maxHeight * 2}px`,
      }}
    >
      {displayData.map((barAmplitude, index) => {
        const height = barAmplitude * config.maxHeight;
        return (
          <div
            key={index}
            style={{
              width: `${config.barWidth}px`,
              height: `${height * 2}px`,
              background: config.useGradient
                ? `linear-gradient(to bottom, ${config.color1}, ${config.color2}, ${config.color1})`
                : config.color1,
              borderRadius: `${config.borderRadius}px`,
              boxShadow:
                config.glowIntensity > 0
                  ? `0 0 ${config.glowIntensity}px ${config.color1}aa`
                  : 'none',
              transition: 'height 0.1s ease-out',
            }}
          />
        );
      })}
    </div>
  );
};
