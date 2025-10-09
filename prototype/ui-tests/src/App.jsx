import React, { useState, useEffect } from 'react';
import AudioDataProvider from './AudioDataProvider';
import ThickBarsVisualization from './visualizations/ThickBarsVisualization';
import ConfigPanel from './ConfigPanel';
import SettingsApp from './SettingsApp';
import { api } from './api';

const DEFAULT_CONFIG = {
  numBars: 10,
  barWidth: 8,
  barGap: 4,
  maxHeight: 60,
  borderRadius: 4,
  glowIntensity: 20,
  colorMode: 'gradient', // 'solid' or 'gradient'
  color1: '#a855f7',
  color2: '#60a5fa',
};

function App() {
  const [activeTab, setActiveTab] = useState('visualizations'); // 'visualizations' or 'settings'
  const [visualizations, setVisualizations] = useState([]);
  const [presets, setPresets] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Load presets on mount and create visualizations for each
  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const data = await api.getPresets();
      setPresets(data);

      // Create a visualization for each preset
      if (data.length > 0) {
        const presetVisualizations = data.map((preset, index) => ({
          id: index + 1,
          config: preset.config,
          presetId: preset.id,
          presetName: preset.name,
        }));
        setVisualizations(presetVisualizations);
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const handleAddVisualization = () => {
    const newId = Math.max(0, ...visualizations.map(v => v.id)) + 1;
    setVisualizations([...visualizations, {
      id: newId,
      config: DEFAULT_CONFIG,
      presetId: null,
      presetName: '',
    }]);
  };

  const handleRemoveVisualization = (id) => {
    setVisualizations(visualizations.filter(v => v.id !== id));
  };

  const handleConfigChange = (id, newConfig) => {
    setVisualizations(visualizations.map(v => {
      if (v.id !== id) return v;

      // If editing a saved preset, auto-save changes
      if (v.presetId && v.presetName) {
        api.savePreset(v.presetName, newConfig).catch(console.error);
        return { ...v, config: newConfig };
      }

      // Otherwise, just update config
      return { ...v, config: newConfig };
    }));
  };

  const handleSavePreset = async (id) => {
    const viz = visualizations.find(v => v.id === id);
    if (!viz || !viz.presetName.trim()) return;

    try {
      const savedPreset = await api.savePreset(viz.presetName, viz.config);
      await loadPresets();

      // Update the visualization with the saved preset ID
      setVisualizations(visualizations.map(v =>
        v.id === id ? { ...v, presetId: savedPreset.id, presetName: savedPreset.name } : v
      ));

      alert(`${viz.presetId ? 'Updated' : 'Saved'} preset: ${viz.presetName}`);
    } catch (error) {
      alert('Failed to save preset');
    }
  };

  const handleLoadPreset = async (vizId, presetId) => {
    if (!presetId) {
      // Clear preset - set to custom
      setVisualizations(visualizations.map(v =>
        v.id === vizId ? { ...v, presetId: null, presetName: '' } : v
      ));
      return;
    }

    try {
      const preset = await api.getPreset(presetId);
      setVisualizations(visualizations.map(v =>
        v.id === vizId ? { ...v, config: preset.config, presetId, presetName: preset.name } : v
      ));
    } catch (error) {
      alert('Failed to load preset');
    }
  };

  const handlePresetNameChange = (vizId, name) => {
    setVisualizations(visualizations.map(v =>
      v.id === vizId ? { ...v, presetName: name } : v
    ));
  };

  return (
    <div style={{ width: '100%', padding: '20px', minHeight: '100vh', background: '#2a2a2a' }}>
      {/* Tab Switcher */}
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('visualizations')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'visualizations' ? '#8b5cf6' : '#444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
            }}
          >
            Visualizations
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'settings' ? '#8b5cf6' : '#444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
            }}
          >
            Settings App
          </button>
        </div>
        {activeTab === 'visualizations' && (
          <button
            onClick={handleAddVisualization}
            style={{
              padding: '10px 20px',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
            }}
          >
            ➕ Add Visualization
          </button>
        )}
      </div>

      {/* Conditional Content */}
      {activeTab === 'settings' ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
          <SettingsApp />
        </div>
      ) : (
        /* Grid of visualizations (2 per row) */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}>
          {visualizations.map((viz) => (
          <div key={viz.id} style={{
            border: '2px solid #000',
            borderRadius: '12px',
            padding: '20px',
            background: '#1a1a1a',
          }}>
            {/* Header with preset selector, name input, save, and buttons */}
            <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={viz.presetId || ''}
                onChange={(e) => handleLoadPreset(viz.id, e.target.value)}
                style={{
                  padding: '8px',
                  background: '#0a0a0a',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  minWidth: '150px',
                }}
              >
                <option value="">Custom / New</option>
                {presets.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Preset name..."
                value={viz.presetName}
                onChange={(e) => handlePresetNameChange(viz.id, e.target.value)}
                style={{
                  padding: '8px',
                  background: '#0a0a0a',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  flex: 1,
                  minWidth: '120px',
                }}
              />

              <button
                onClick={() => handleSavePreset(viz.id)}
                disabled={!viz.presetName.trim()}
                style={{
                  padding: '8px 16px',
                  background: viz.presetName.trim() ? '#8b5cf6' : '#444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: viz.presetName.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                💾
              </button>

              <button
                onClick={() => setEditingId(editingId === viz.id ? null : viz.id)}
                style={{
                  padding: '8px 12px',
                  background: editingId === viz.id ? '#8b5cf6' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ⚙️
              </button>

              {visualizations.length > 1 && (
                <button
                  onClick={() => handleRemoveVisualization(viz.id)}
                  style={{
                    padding: '8px 12px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Config panel (collapsible) */}
            {editingId === viz.id && (
              <ConfigPanel
                config={viz.config}
                onChange={(newConfig) => handleConfigChange(viz.id, newConfig)}
              />
            )}

            {/* Visualization */}
            <AudioDataProvider>
              <ThickBarsVisualization config={viz.config} />
            </AudioDataProvider>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}

export default App;
