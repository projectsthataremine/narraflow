import React from 'react';

/**
 * ThickBarsVisualization
 *
 * Displays 8-10 thick bars with gradient that mirror amplitude up and down
 * Based on real-time audio amplitude from AudioDataProvider
 *
 * Features:
 * - 10 thick bars (no background/pill shape)
 * - Gradient coloring
 * - Mirrored animation (up and down from center)
 * - Time series: bars represent recent audio history
 */
function ThickBarsVisualization({ amplitude = 0, audioHistory = [], config }) {
  // Use config or defaults
  const NUM_BARS = config?.numBars || 10;
  const BAR_WIDTH = config?.barWidth || 8;
  const BAR_GAP = config?.barGap || 4;
  const MAX_HEIGHT = config?.maxHeight || 60;
  const BORDER_RADIUS = config?.borderRadius || 4;
  const GLOW_INTENSITY = config?.glowIntensity !== undefined ? config.glowIntensity : 20;
  const COLOR1 = config?.color1 || '#a855f7';
  const COLOR2 = config?.color2 || '#60a5fa';
  const COLOR_MODE = config?.colorMode || 'gradient';

  // All bars react to current amplitude with random variation
  const displayData = Array.from({ length: NUM_BARS }, () => {
    // Each bar varies slightly from the current amplitude (±10%)
    const variation = (Math.random() - 0.5) * 0.2;
    return Math.max(0.1, Math.min(1.0, amplitude + variation)); // Never below 10%
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px',
      border: '2px solid #000',
      borderRadius: '12px',
    }}>
      {/* Visualization container */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: `${MAX_HEIGHT * 2 + 20}px`,
        position: 'relative',
      }}>
        {/* Bars */}
        <div style={{
          display: 'flex',
          gap: `${BAR_GAP}px`,
          alignItems: 'center',
          height: '100%',
          position: 'relative',
          zIndex: 1,
        }}>
          {displayData.map((barAmplitude, index) => {
            // Minimum 10% height
            const height = barAmplitude * MAX_HEIGHT;

            return (
              <div
                key={index}
                style={{
                  width: `${BAR_WIDTH}px`,
                  height: `${height * 2}px`, // Total height (mirrored up and down)
                  background: COLOR_MODE === 'gradient'
                    ? `linear-gradient(to bottom, ${COLOR1}, ${COLOR2}, ${COLOR1})`
                    : COLOR1,
                  borderRadius: `${BORDER_RADIUS}px`,
                  transition: 'height 0.05s ease-out',
                  boxShadow: GLOW_INTENSITY === 0
                    ? 'none'
                    : `0 0 ${GLOW_INTENSITY + (barAmplitude * GLOW_INTENSITY * 0.5)}px ${COLOR1}${barAmplitude > 0.3 ? 'cc' : '88'}`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ThickBarsVisualization;
