import React, { useState } from 'react';
import { GRADIENT_PRESETS } from './gradientPresets';

/**
 * ConfigPanel - Live configuration controls for visualization
 */
function ConfigPanel({ config, onChange }) {
  const [collapsed, setCollapsed] = useState(false);

  const handleChange = (key, value) => {
    onChange({ ...config, [key]: value });
  };

  const handleGradientPresetChange = (preset) => {
    onChange({
      ...config,
      color1: preset.color1,
      color2: preset.color2,
      selectedPreset: preset.name, // Track which preset is selected
    });
  };

  const handleRandomize = () => {
    // Random helper
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomBool = () => Math.random() > 0.5;

    // Pick a random gradient preset
    const randomPreset = GRADIENT_PRESETS[randomInt(0, GRADIENT_PRESETS.length - 1)];

    // Generate random config
    const randomConfig = {
      numBars: randomInt(5, 20),
      barWidth: randomInt(4, 16),
      barGap: randomInt(2, 12),
      maxHeight: randomInt(40, 120),
      borderRadius: randomInt(0, 12),
      glowIntensity: randomInt(0, 40),
      colorMode: randomBool() ? 'gradient' : 'solid',
      color1: randomPreset.color1,
      color2: randomPreset.color2,
      selectedPreset: randomPreset.name,
    };

    onChange(randomConfig);
  };

  // Check if current colors match a preset
  const currentPreset = GRADIENT_PRESETS.find(
    preset => preset.color1 === config.color1 && preset.color2 === config.color2
  );
  const isPresetSelected = currentPreset?.name || config.selectedPreset;

  return (
    <div style={{
      background: '#1a1a1a',
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: collapsed ? 0 : '20px',
      }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>⚙️ Configuration</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleRandomize}
            style={{
              padding: '6px 12px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            🎲 Random
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {collapsed ? '▼ Show' : '▲ Hide'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            {/* Number of bars */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
                Number of Bars
              </label>
              <input
                type="number"
                min="3"
                max="30"
                value={config.numBars}
                onChange={(e) => handleChange('numBars', parseInt(e.target.value))}
                style={inputStyle}
              />
            </div>

            {/* Bar width */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
                Bar Width (px)
              </label>
              <input
                type="number"
                min="2"
                max="20"
                value={config.barWidth}
                onChange={(e) => handleChange('barWidth', parseInt(e.target.value))}
                style={inputStyle}
              />
            </div>

            {/* Bar gap */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
                Bar Gap (px)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={config.barGap}
                onChange={(e) => handleChange('barGap', parseInt(e.target.value))}
                style={inputStyle}
              />
            </div>

            {/* Max height */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
                Max Height (px)
              </label>
              <input
                type="number"
                min="20"
                max="200"
                value={config.maxHeight}
                onChange={(e) => handleChange('maxHeight', parseInt(e.target.value))}
                style={inputStyle}
              />
            </div>

            {/* Border radius */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
                Border Radius (px)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={config.borderRadius}
                onChange={(e) => handleChange('borderRadius', parseInt(e.target.value))}
                style={inputStyle}
              />
            </div>

            {/* Glow intensity */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
                Glow Intensity
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={config.glowIntensity}
                onChange={(e) => handleChange('glowIntensity', parseInt(e.target.value))}
                style={{ ...inputStyle, padding: '5px' }}
              />
              <span style={{ fontSize: '11px', color: '#666' }}>{config.glowIntensity}px</span>
            </div>

          </div>

          {/* Color Mode Toggle */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={config.colorMode === 'gradient'}
                onChange={(e) => handleChange('colorMode', e.target.checked ? 'gradient' : 'solid')}
                style={{ cursor: 'pointer' }}
              />
              <span>Use Gradient</span>
            </label>
          </div>

          {/* Gradient Presets (always visible) */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#aaa' }}>
              Gradient Presets
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              marginBottom: '15px',
            }}>
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleGradientPresetChange(preset)}
                  disabled={config.colorMode !== 'gradient'}
                  style={{
                    padding: '4px 8px',
                    background: `linear-gradient(135deg, ${preset.color1}, ${preset.color2})`,
                    border: (config.color1 === preset.color1 && config.color2 === preset.color2)
                      ? '2px solid white'
                      : '1px solid transparent',
                    borderRadius: '4px',
                    cursor: config.colorMode === 'gradient' ? 'pointer' : 'not-allowed',
                    fontSize: '9px',
                    color: 'white',
                    fontWeight: '500',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: config.colorMode === 'gradient' ? 1 : 0.5,
                  }}
                  title={preset.name}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors - Inline with labels (always visible) */}
          <div style={{ marginTop: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {config.colorMode === 'gradient' ? 'Color 1 (Top)' : 'Color'}
                <input
                  type="color"
                  value={config.color1 || '#a855f7'}
                  onChange={(e) => {
                    // Clear preset selection when manually changing colors
                    onChange({ ...config, color1: e.target.value, selectedPreset: null });
                  }}
                  style={{
                    width: '30px',
                    height: '30px',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                />
              </label>

              {/* Color 2 (always visible, disabled when solid) */}
              <label style={{
                fontSize: '12px',
                color: config.colorMode === 'gradient' ? '#aaa' : '#555',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                Color 2 (Bottom)
                <input
                  type="color"
                  value={config.color2 || '#60a5fa'}
                  onChange={(e) => {
                    // Clear preset selection when manually changing colors
                    onChange({ ...config, color2: e.target.value, selectedPreset: null });
                  }}
                  disabled={config.colorMode !== 'gradient'}
                  style={{
                    width: '30px',
                    height: '30px',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    cursor: config.colorMode === 'gradient' ? 'pointer' : 'not-allowed',
                    background: 'transparent',
                    opacity: config.colorMode === 'gradient' ? 1 : 0.5,
                  }}
                />
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '8px',
  background: '#0a0a0a',
  border: '1px solid #444',
  borderRadius: '4px',
  color: 'white',
  fontSize: '14px',
};

export default ConfigPanel;
