/**
 * Settings App UI - Inspired by Wispr Flow
 * ~900px wide window with sidebar navigation
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Icon components (inline SVG - no external dependencies needed)
const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6m5.66-15.66l-4.24 4.24m0 6.12l4.24 4.24M23 12h-6m-6 0H1m17.66 5.66l-4.24-4.24m0-6.12l-4.24-4.24" />
  </svg>
);

const MicIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2m7 12v-3" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const ShuffleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </svg>
);

// Types
import type { PillConfig } from '../types/ipc-contracts';
import { IPC_CHANNELS } from '../types/ipc-contracts';

// Electron IPC renderer (will be available via preload)
declare global {
  interface Window {
    electron?: {
      on: (channel: string, callback: (data: any) => void) => void;
      send: (channel: string, data: any) => void;
    };
  }
}

// Main App
function SettingsApp() {
  const [activeSection, setActiveSection] = useState('general');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [pillConfig, setPillConfig] = useState<PillConfig>({
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

  // Load saved config from main process on mount
  useEffect(() => {
    if (window.electron) {
      window.electron.on(IPC_CHANNELS.PILL_CONFIG_UPDATE, (event: any) => {
        console.log('[Settings] Received saved config from main:', event.config);
        setPillConfig(event.config);
      });
    }
  }, []);

  // Send config updates to overlay via IPC
  useEffect(() => {
    if (window.electron) {
      console.log('[Settings] Sending pill config update:', pillConfig);
      window.electron.send(IPC_CHANNELS.PILL_CONFIG_UPDATE, { config: pillConfig });
    } else {
      console.warn('[Settings] window.electron not available');
    }
  }, [pillConfig]);

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      background: '#fff',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Custom Title Bar - Draggable */}
      <div style={{
        height: '52px',
        background: '#fafafa',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        // @ts-ignore - webkit prefix
        WebkitAppRegion: 'drag',
        WebkitUserSelect: 'none',
      }} />

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
            icon={<SettingsIcon />}
            label="General"
            active={activeSection === 'general'}
            onClick={() => setActiveSection('general')}
          />
          <NavItem
            icon={<MicIcon />}
            label="Recording Pill"
            active={activeSection === 'recording'}
            onClick={() => setActiveSection('recording')}
          />
          <NavItem
            icon={<UserIcon />}
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
          {activeSection === 'recording' && (
            <RecordingPillSection pillConfig={pillConfig} setPillConfig={setPillConfig} />
          )}
          {activeSection === 'account' && <AccountSection />}
        </div>
      </div>
    </div>
  );
}

// Navigation Item Component
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '10px 12px',
        borderRadius: '8px',
        background: active ? '#e8e8e8' : hovered ? '#f0f0f0' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '14px',
        fontWeight: active ? '500' : '400',
        color: '#000',
        transition: 'background 0.2s',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

// General Section
interface GeneralSectionProps {
  aiEnabled: boolean;
  setAiEnabled: (enabled: boolean) => void;
}

function GeneralSection({ aiEnabled, setAiEnabled }: GeneralSectionProps) {
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
interface RecordingPillSectionProps {
  pillConfig: PillConfig;
  setPillConfig: (config: PillConfig) => void;
}

function RecordingPillSection({ pillConfig, setPillConfig }: RecordingPillSectionProps) {
  const [previewDarkMode, setPreviewDarkMode] = useState(true);

  const handleRandomize = () => {
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const colors: [string, string][] = [
      ['#a855f7', '#60a5fa'], // Purple Blue
      ['#ff6b6b', '#feca57'], // Sunset
      ['#0891b2', '#6366f1'], // Ocean
      ['#10b981', '#059669'], // Forest
      ['#f59e0b', '#ef4444'], // Fire
    ];
    const randomColor = colors[randomInt(0, colors.length - 1)];

    setPillConfig({
      numBars: randomInt(5, 15),
      barWidth: randomInt(5, 20),
      barGap: randomInt(2, 10),
      maxHeight: randomInt(15, 70),
      borderRadius: randomInt(0, 10),
      glowIntensity: randomInt(0, 20),
      color1: randomColor[0],
      color2: randomColor[1],
      useGradient: pillConfig.useGradient,
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
            <ShuffleIcon />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Number of Bars */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              <span>Number of Bars</span>
              <span style={{ fontWeight: '500', color: '#000' }}>{pillConfig.numBars}</span>
            </label>
            <input
              type="range"
              min="5"
              max="15"
              value={pillConfig.numBars}
              onChange={(e) => setPillConfig({ ...pillConfig, numBars: parseInt(e.target.value) })}
              style={{
                width: '100%',
                height: '4px',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Bar Width */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              <span>Bar Width</span>
              <span style={{ fontWeight: '500', color: '#000' }}>{pillConfig.barWidth}px</span>
            </label>
            <input
              type="range"
              min="5"
              max="20"
              value={pillConfig.barWidth}
              onChange={(e) => setPillConfig({ ...pillConfig, barWidth: parseInt(e.target.value) })}
              style={{
                width: '100%',
                height: '4px',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Bar Gap */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              <span>Bar Gap</span>
              <span style={{ fontWeight: '500', color: '#000' }}>{pillConfig.barGap}px</span>
            </label>
            <input
              type="range"
              min="2"
              max="10"
              value={pillConfig.barGap}
              onChange={(e) => setPillConfig({ ...pillConfig, barGap: parseInt(e.target.value) })}
              style={{
                width: '100%',
                height: '4px',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Max Height */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              <span>Max Height</span>
              <span style={{ fontWeight: '500', color: '#000' }}>{pillConfig.maxHeight}px</span>
            </label>
            <input
              type="range"
              min="15"
              max="70"
              value={pillConfig.maxHeight}
              onChange={(e) => setPillConfig({ ...pillConfig, maxHeight: parseInt(e.target.value) })}
              style={{
                width: '100%',
                height: '4px',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Border Radius (as percentage) */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              <span>Border Radius</span>
              <span style={{ fontWeight: '500', color: '#000' }}>{Math.round((pillConfig.borderRadius / 10) * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round((pillConfig.borderRadius / 10) * 100)}
              onChange={(e) => {
                const percentage = parseInt(e.target.value);
                const pixels = Math.round((percentage / 100) * 10);
                setPillConfig({ ...pillConfig, borderRadius: pixels });
              }}
              style={{
                width: '100%',
                height: '4px',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Glow Intensity */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              <span>Glow Intensity</span>
              <span style={{ fontWeight: '500', color: '#000' }}>{pillConfig.glowIntensity}</span>
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={pillConfig.glowIntensity}
              onChange={(e) => setPillConfig({ ...pillConfig, glowIntensity: parseInt(e.target.value) })}
              style={{
                width: '100%',
                height: '4px',
                cursor: 'pointer',
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
            {previewDarkMode ? <SunIcon /> : <MoonIcon />}
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
interface PillPreviewProps {
  config: PillConfig;
}

function PillPreview({ config }: PillPreviewProps) {
  const [amplitude] = useState(0.7); // Simulated amplitude

  const displayData = Array.from({ length: config.numBars }, () => {
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

// Mount React app
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<SettingsApp />);
}
