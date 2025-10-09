import React, { useState } from 'react';
import { Settings, Mic, User, Sun, Moon, Shuffle } from 'lucide-react';

/**
 * Settings App UI - Inspired by Wispr Flow
 * ~900px wide window with sidebar navigation
 */
function SettingsApp() {
  const [activeSection, setActiveSection] = useState('general');
  const [aiEnabled, setAiEnabled] = useState(true);

  return (
    <div style={{
      width: '900px',
      height: '600px',
      background: '#fff',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* macOS Window Chrome */}
      <div style={{
        height: '52px',
        background: '#fafafa',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#ff5f57',
            cursor: 'pointer',
          }} />
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#febc2e',
            cursor: 'pointer',
          }} />
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#28c840',
            cursor: 'pointer',
          }} />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: '240px',
          background: '#fafafa',
          borderRight: '1px solid #e0e0e0',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {/* App Title */}
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '24px',
            color: '#000',
          }}>
            Mic2Text
          </div>

          {/* Navigation */}
          <NavItem
            icon={<Settings size={18} />}
            label="General"
            active={activeSection === 'general'}
            onClick={() => setActiveSection('general')}
          />
          <NavItem
            icon={<Mic size={18} />}
            label="Recording Pill"
            active={activeSection === 'recording'}
            onClick={() => setActiveSection('recording')}
          />
          <NavItem
            icon={<User size={18} />}
            label="Account"
            active={activeSection === 'account'}
            onClick={() => setActiveSection('account')}
          />
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          padding: '40px',
          overflowY: 'auto',
          background: '#fff',
        }}>
          {activeSection === 'general' && (
            <GeneralSection aiEnabled={aiEnabled} setAiEnabled={setAiEnabled} />
          )}
          {activeSection === 'recording' && <RecordingPillSection />}
          {activeSection === 'account' && <AccountSection />}
        </div>
      </div>
    </div>
  );
}

// Navigation Item Component
function NavItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 12px',
        borderRadius: '8px',
        background: active ? '#e8e8e8' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '14px',
        fontWeight: active ? '500' : '400',
        color: '#000',
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = '#f0f0f0';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

// General Section
function GeneralSection({ aiEnabled, setAiEnabled }) {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#000' }}>
        General
      </h2>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
        Configure basic app settings
      </p>

      {/* AI Cleanup Toggle */}
      <div style={{
        padding: '20px',
        background: '#fafafa',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '4px', color: '#000' }}>
              AI Text Cleanup
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              Automatically improve grammar and formatting
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '28px' }}>
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(e) => setAiEnabled(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: aiEnabled ? '#007aff' : '#ccc',
              transition: '0.3s',
              borderRadius: '28px',
            }}>
              <span style={{
                position: 'absolute',
                content: '',
                height: '22px',
                width: '22px',
                left: aiEnabled ? '24px' : '3px',
                bottom: '3px',
                background: 'white',
                transition: '0.3s',
                borderRadius: '50%',
              }} />
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

// Recording Pill Section
function RecordingPillSection() {
  const [pillConfig, setPillConfig] = useState({
    numBars: 10,
    barWidth: 8,
    barGap: 4,
    maxHeight: 60,
    borderRadius: 4,
    glowIntensity: 20,
    color1: '#a855f7',
    color2: '#60a5fa',
    useGradient: true,
  });
  const [previewDarkMode, setPreviewDarkMode] = useState(true);

  const handleRandomize = () => {
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const colors = [
      ['#a855f7', '#60a5fa'], // Purple Blue
      ['#ff6b6b', '#feca57'], // Sunset
      ['#0891b2', '#6366f1'], // Ocean
      ['#10b981', '#059669'], // Forest
      ['#f59e0b', '#ef4444'], // Fire
    ];
    const randomColor = colors[randomInt(0, colors.length - 1)];

    setPillConfig({
      numBars: randomInt(5, 15),
      barWidth: randomInt(4, 12),
      barGap: randomInt(2, 8),
      maxHeight: randomInt(40, 80),
      borderRadius: randomInt(0, 8),
      glowIntensity: randomInt(10, 30),
      color1: randomColor[0],
      color2: randomColor[1],
    });
  };

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#000' }}>
        Recording Pill
      </h2>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
        Customize the visual indicator that appears while recording
      </p>

      {/* Settings Controls */}
      <div style={{
        padding: '20px',
        background: '#fafafa',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '500', margin: 0, color: '#000' }}>Settings</h3>
          <button
            onClick={handleRandomize}
            style={{
              padding: '8px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shuffle size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Number of Bars */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>
              Number of Bars
            </label>
            <input
              type="number"
              min="3"
              max="20"
              value={pillConfig.numBars}
              onChange={(e) => setPillConfig({ ...pillConfig, numBars: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Bar Width */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>
              Bar Width (px)
            </label>
            <input
              type="number"
              min="2"
              max="20"
              value={pillConfig.barWidth}
              onChange={(e) => setPillConfig({ ...pillConfig, barWidth: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Bar Gap */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>
              Bar Gap (px)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={pillConfig.barGap}
              onChange={(e) => setPillConfig({ ...pillConfig, barGap: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Max Height */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>
              Max Height (px)
            </label>
            <input
              type="number"
              min="20"
              max="120"
              value={pillConfig.maxHeight}
              onChange={(e) => setPillConfig({ ...pillConfig, maxHeight: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Border Radius */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>
              Border Radius (px)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={pillConfig.borderRadius}
              onChange={(e) => setPillConfig({ ...pillConfig, borderRadius: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Glow Intensity */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>
              Glow Intensity (px)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={pillConfig.glowIntensity}
              onChange={(e) => setPillConfig({ ...pillConfig, glowIntensity: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>
        </div>

        {/* Use Gradient Checkbox with Colors on same line */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#000',
          }}>
            <input
              type="checkbox"
              checked={pillConfig.useGradient}
              onChange={(e) => setPillConfig({ ...pillConfig, useGradient: e.target.checked })}
              style={{
                cursor: 'pointer',
                width: '16px',
                height: '16px',
              }}
            />
            <span>Use Gradient</span>
          </label>

          {/* Colors on the right */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="color"
              value={pillConfig.color1}
              onChange={(e) => setPillConfig({ ...pillConfig, color1: e.target.value })}
              style={{
                width: '40px',
                height: '40px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            />
            {pillConfig.useGradient && (
              <input
                type="color"
                value={pillConfig.color2}
                onChange={(e) => setPillConfig({ ...pillConfig, color2: e.target.value })}
                style={{
                  width: '40px',
                  height: '40px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div style={{ position: 'relative' }}>
        {/* Dark/Light Mode Toggle */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 10,
        }}>
          <button
            onClick={() => setPreviewDarkMode(!previewDarkMode)}
            style={{
              padding: '8px',
              background: previewDarkMode ? '#fff' : '#1a1a1a',
              color: previewDarkMode ? '#000' : '#fff',
              border: '1px solid #444',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {previewDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div style={{
          padding: '40px',
          background: previewDarkMode ? '#1a1a1a' : '#f5f5f5',
          borderRadius: '12px',
          border: previewDarkMode ? '1px solid #000' : '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
        }}>
          <PillPreview config={pillConfig} />
        </div>
      </div>
    </div>
  );
}

// Live Pill Preview Component
function PillPreview({ config }) {
  const [amplitude] = useState(0.7); // Simulated amplitude

  const displayData = Array.from({ length: config.numBars }, (_, i) => {
    const variation = (Math.random() - 0.5) * 0.2;
    return Math.max(0.3, Math.min(1.0, amplitude + variation));
  });

  return (
    <div style={{
      display: 'flex',
      gap: `${config.barGap}px`,
      alignItems: 'center',
    }}>
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
              boxShadow: config.glowIntensity > 0
                ? `0 0 ${config.glowIntensity}px ${config.color1}aa`
                : 'none',
              transition: 'height 0.1s ease-out',
            }}
          />
        );
      })}
    </div>
  );
}

// Account Section (Placeholder)
function AccountSection() {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#000' }}>
        Account
      </h2>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
        Manage your subscription and account details
      </p>

      <div style={{
        padding: '32px',
        background: '#fafafa',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>👤</div>
        <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px', color: '#000' }}>
          Account Management
        </h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
          Sign in or create an account to access premium features
        </p>
        <button style={{
          padding: '10px 24px',
          background: '#007aff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          marginRight: '8px',
        }}>
          Sign In
        </button>
        <button style={{
          padding: '10px 24px',
          background: 'transparent',
          color: '#007aff',
          border: '1px solid #007aff',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
        }}>
          Create Account
        </button>
        <p style={{ fontSize: '12px', color: '#999', marginTop: '24px' }}>
          $5/month • Simple voice dictation
        </p>
      </div>
    </div>
  );
}

export default SettingsApp;
