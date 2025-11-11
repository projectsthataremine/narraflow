/**
 * Pill UI component
 * Displays recording state at bottom-center of screen
 * States: loading, silent, talking, processing
 */

import React from 'react';
import type { UIMode } from '../types/ipc-contracts';

interface PillProps {
  mode: UIMode;
  vadProbability?: number;
}

export const Pill: React.FC<PillProps> = ({ mode, vadProbability = 0 }) => {
  if (mode === 'hidden') {
    return null;
  }

  const getLabel = (): string => {
    switch (mode) {
      case 'loading':
        return 'Loading';
      case 'silent':
        return 'Silence';
      case 'talking':
        return 'Talking';
      case 'processing':
        return 'Processing';
      default:
        return '';
    }
  };

  const renderDots = () => {
    const dotCount = 10;
    const dots = [];

    for (let i = 0; i < dotCount; i++) {
      let dotStyle: React.CSSProperties = {
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        backgroundColor: '#fff',
        margin: '0 2px',
      };

      // Different dot animations based on mode
      if (mode === 'loading') {
        dotStyle.animation = `dotPulse 1.4s ease-in-out ${i * 0.1}s infinite`;
      } else if (mode === 'talking') {
        // Talking: make some dots more prominent based on VAD
        const intensity = i < dotCount * vadProbability ? 1 : 0.5;
        dotStyle.opacity = intensity;
        dotStyle.animation = `dotPulse 0.6s ease-in-out ${i * 0.05}s infinite`;
      } else if (mode === 'processing') {
        // Processing: show pattern with some gray dots
        dotStyle.backgroundColor = i % 3 === 0 ? '#666' : '#fff';
      } else if (mode === 'silent') {
        // Silent: static dots, some dimmed
        dotStyle.opacity = i % 2 === 0 ? 1 : 0.5;
      }

      dots.push(<div key={i} style={dotStyle} />);
    }

    return dots;
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#1a1a1a',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        zIndex: 10000,
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', gap: '0px' }}>{renderDots()}</div>
      <div style={{ fontSize: '12px', fontWeight: '500' }}>{getLabel()}</div>
    </div>
  );
};

// CSS animations (would normally be in a separate CSS file)
export const pillStyles = `
@keyframes dotPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}
`;
