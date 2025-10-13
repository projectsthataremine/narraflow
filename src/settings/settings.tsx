/**
 * Settings App UI - Retro Desktop OS Theme
 * ~900px wide window with sidebar navigation
 */

import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { MONTHLY_PRICE } from '../main/constants';

// CSS Variables (dark theme with black background)
const CSS_VARS = `
:root {
  --desktop-bg: #0d0d0d;
  --desktop-accent: #a3be8c;
  --desktop-secondary: #ebcb8b;
  --desktop-text: #eceff4;
  --desktop-window-bg: #1a1a1a;
  --desktop-window-border: #333;
  --desktop-taskbar-bg: #0a0a0a;
  --desktop-sidebar-bg: #000000;
  --font-mono: 'SF Mono', 'Monaco', 'Consolas', monospace;
}

/* Custom slider styles */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: #555;
  height: 4px;
  border-radius: 2px;
  outline: none;
}

input[type="range"]::-webkit-slider-track {
  background: #555;
  height: 4px;
  border-radius: 2px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--desktop-accent);
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-thumb:hover {
  background: #b4d49c;
}

input[type="range"]::-moz-range-track {
  background: #555;
  height: 4px;
  border-radius: 2px;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--desktop-accent);
  border: none;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb:hover {
  background: #b4d49c;
}

/* Checkbox accent color */
input[type="checkbox"]:checked {
  accent-color: var(--desktop-accent);
}

/* Color picker styles */
input[type="color"] {
  -webkit-appearance: none;
  appearance: none;
  border: 1px solid var(--desktop-window-border);
  border-radius: 0;
  padding: 0;
  cursor: pointer;
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: 0;
}

input[type="color"]::-moz-color-swatch {
  border: none;
  border-radius: 0;
}

/* Custom scrollbar styles - matching marketing site */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: var(--desktop-bg);
}

::-webkit-scrollbar-thumb {
  background: var(--desktop-accent);
  border: none;
}

::-webkit-scrollbar-thumb:hover {
  background: #b4d49c;
}

::-webkit-scrollbar-corner {
  background: var(--desktop-bg);
}
`;

// Icon components (inline SVG - no external dependencies needed)
const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
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

const HistoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v5h5" />
    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
    <path d="M12 7v5l4 2" />
  </svg>
);

const MessageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const CheckmarkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CloudIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// Types
import type { PillConfig, HistoryItem } from '../types/ipc-contracts';
import { IPC_CHANNELS } from '../types/ipc-contracts';

// Hotkey config type (matching settings-manager.ts)
interface HotkeyConfig {
  modifiers: string[];
  key: string;
  keycode: number;
}

// Electron IPC renderer (will be available via preload)
declare global {
  interface Window {
    electron?: {
      on: (channel: string, callback: (data: any) => void) => void;
      send: (channel: string, data: any) => void;
    };
  }
}

// Available hotkey options
const HOTKEY_OPTIONS = [
  { label: 'Fn (Globe)', key: 'Fn', keycode: 63, modifiers: [] },
  { label: 'Shift + Option', key: 'Shift', keycode: 42, modifiers: ['Shift', 'Alt'] },
  { label: 'Shift + Control', key: 'Shift', keycode: 42, modifiers: ['Shift', 'Ctrl'] },
  { label: 'Control + Option', key: 'Ctrl', keycode: 29, modifiers: ['Ctrl', 'Alt'] },
];

// Main App
function SettingsApp() {
  const [activeSection, setActiveSection] = useState('general');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
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
  const [hotkeyConfig, setHotkeyConfig] = useState<HotkeyConfig>({
    modifiers: ['Shift', 'Alt'],
    key: 'Shift',
    keycode: 42,
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

  // Load history on mount and listen for updates
  useEffect(() => {
    const loadHistory = async () => {
      if (window.electron) {
        try {
          // Load initial history using invoke (not send)
          const result = await (window.electron as any).invoke(IPC_CHANNELS.HISTORY_GET);
          console.log('[Settings] Initial history loaded:', result);
          setHistory(result || []);
        } catch (error) {
          console.error('[Settings] Failed to load history:', error);
        }

        // Listen for history updates
        window.electron.on(IPC_CHANNELS.HISTORY_UPDATE, (event: any) => {
          console.log('[Settings] History updated:', event.history);
          setHistory(event.history);
        });
      }
    };

    loadHistory();
  }, []);

  return (
    <>
      <style>{CSS_VARS}</style>
      <div style={{
        width: '100%',
        height: '100vh',
        background: 'var(--desktop-bg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-mono)',
        color: 'var(--desktop-text)',
      }}>
        {/* Custom Title Bar - Draggable */}
        <div style={{
          height: '52px',
          background: 'var(--desktop-sidebar-bg)',
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
            background: 'var(--desktop-sidebar-bg)',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* App Title */}
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '24px',
              color: 'var(--desktop-accent)',
            }}>
              NarraFlow
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                icon={<HistoryIcon />}
                label="History"
                active={activeSection === 'history'}
                onClick={() => setActiveSection('history')}
              />
              <NavItem
                icon={<UserIcon />}
                label="Account"
                active={activeSection === 'account'}
                onClick={() => setActiveSection('account')}
              />
              <NavItem
                icon={<MessageIcon />}
                label="Share Feedback"
                active={activeSection === 'feedback'}
                onClick={() => setActiveSection('feedback')}
              />
            </div>

            {/* Version Footer */}
            <VersionFooter />
          </div>

          {/* Content Area */}
          <div style={{
            flex: 1,
            padding: '40px',
            overflowY: 'auto',
            background: 'var(--desktop-bg)',
          }}>
            {activeSection === 'general' && (
              <GeneralSection
                aiEnabled={aiEnabled}
                setAiEnabled={setAiEnabled}
                hotkeyConfig={hotkeyConfig}
                setHotkeyConfig={setHotkeyConfig}
              />
            )}
            {activeSection === 'recording' && (
              <RecordingPillSection pillConfig={pillConfig} setPillConfig={setPillConfig} />
            )}
            {activeSection === 'history' && (
              <HistorySection history={history} setHistory={setHistory} />
            )}
            {activeSection === 'account' && <AccountSection />}
            {activeSection === 'feedback' && <FeedbackSection />}
          </div>
        </div>
      </div>
    </>
  );
}

// Version Footer Component
function VersionFooter() {
  const [hoveredCloud, setHoveredCloud] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  useEffect(() => {
    if (window.electron) {
      // Listen for update notifications
      (window.electron as any).onUpdateAvailable((info: any) => {
        console.log('[Settings] Update available:', info);
        setUpdateAvailable(true);
      });

      (window.electron as any).onUpdateDownloaded((info: any) => {
        console.log('[Settings] Update downloaded:', info);
        setUpdateDownloaded(true);
      });
    }
  }, []);

  const handleCloudClick = async () => {
    if (!updateAvailable) {
      console.log('[Settings] Already up to date');
      return;
    }

    if (updateDownloaded) {
      // Install update and restart
      console.log('[Settings] Installing update and restarting...');
      if (window.electron) {
        await (window.electron as any).installUpdate();
      }
    } else {
      // Download update
      console.log('[Settings] Downloading update...');
      if (window.electron) {
        await (window.electron as any).downloadUpdate();
      }
    }
  };

  const getTooltipText = () => {
    if (updateDownloaded) {
      return 'Click to install update and restart';
    }
    if (updateAvailable) {
      return 'New version available - click to download';
    }
    return 'Up to date';
  };

  return (
    <div style={{
      marginTop: 'auto',
      paddingTop: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{
        fontSize: '13px',
        color: 'var(--desktop-text)',
        opacity: 0.5,
      }}>
        NarraFlow v0.1.0
      </div>
      <div style={{ position: 'relative' }}>
        <div
          onClick={handleCloudClick}
          onMouseEnter={() => setHoveredCloud(true)}
          onMouseLeave={() => setHoveredCloud(false)}
          style={{
            cursor: updateAvailable ? 'pointer' : 'default',
            color: updateAvailable ? '#ef4444' : 'var(--desktop-text)',
            opacity: updateAvailable ? 1 : 0.5,
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            transition: 'color 0.3s',
          }}
        >
          <CloudIcon />
        </div>
        {hoveredCloud && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: '8px',
            padding: '6px 10px',
            background: 'var(--desktop-taskbar-bg)',
            color: 'var(--desktop-text)',
            border: '1px solid var(--desktop-window-border)',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 1000,
          }}>
            {getTooltipText()}
          </div>
        )}
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
        border: active ? '1px solid var(--desktop-accent)' : '1px solid transparent',
        background: active ? 'var(--desktop-window-bg)' : hovered ? 'var(--desktop-window-bg)' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '14px',
        fontWeight: active ? '500' : '400',
        color: active ? 'var(--desktop-accent)' : 'var(--desktop-text)',
        transition: 'all 0.2s',
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
  hotkeyConfig: HotkeyConfig;
  setHotkeyConfig: (config: HotkeyConfig) => void;
}

function GeneralSection({ aiEnabled, setAiEnabled, hotkeyConfig, setHotkeyConfig }: GeneralSectionProps) {
  const [showInDock, setShowInDock] = useState(false);
  const [selectedMicrophone, setSelectedMicrophone] = useState('default');
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);

  // Find the matching option from HOTKEY_OPTIONS based on current config
  const currentOption = HOTKEY_OPTIONS.find(
    opt => JSON.stringify(opt.modifiers) === JSON.stringify(hotkeyConfig.modifiers) &&
           opt.key === hotkeyConfig.key
  );
  const currentHotkeyLabel = currentOption ? currentOption.label : 'Shift + Option';

  // Load available microphones on mount
  useEffect(() => {
    const getMicrophones = async () => {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });

        // Get list of devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setAvailableMicrophones(audioInputs);

        // Set default if not already set
        if (audioInputs.length > 0 && selectedMicrophone === 'default') {
          setSelectedMicrophone(audioInputs[0].deviceId);
        }
      } catch (error) {
        console.error('[Settings] Failed to get microphones:', error);
      }
    };

    getMicrophones();
  }, []);

  // Load dock visibility on mount
  useEffect(() => {
    const getDockVisibility = async () => {
      if (window.electron) {
        try {
          const visible = await (window.electron as any).invoke(IPC_CHANNELS.GET_DOCK_VISIBILITY);
          setShowInDock(visible);
        } catch (error) {
          console.error('[Settings] Failed to get dock visibility:', error);
        }
      }
    };

    getDockVisibility();
  }, []);

  // Handle dock visibility changes
  const handleDockVisibilityChange = async (visible: boolean) => {
    console.log('[Settings] handleDockVisibilityChange called with:', visible);
    console.log('[Settings] window.electron available:', !!window.electron);
    setShowInDock(visible);
    if (window.electron) {
      try {
        console.log('[Settings] Invoking SET_DOCK_VISIBILITY...');
        const result = await (window.electron as any).invoke(IPC_CHANNELS.SET_DOCK_VISIBILITY, { visible });
        console.log('[Settings] SET_DOCK_VISIBILITY result:', result);
      } catch (error) {
        console.error('[Settings] Failed to set dock visibility:', error);
      }
    } else {
      console.error('[Settings] window.electron not available!');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: 'var(--desktop-text)' }}>
        General
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--desktop-text)', opacity: 0.7, marginBottom: '32px' }}>
        Configure basic app settings
      </p>

      {/* Keyboard Shortcuts */}
      <div style={{
        padding: '20px',
        background: 'var(--desktop-window-bg)',
        border: '1px solid var(--desktop-window-border)',
        marginBottom: '16px',
      }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '4px', color: 'var(--desktop-text)' }}>
            Keyboard shortcuts
          </div>
          <div style={{ fontSize: '13px', color: 'var(--desktop-text)', opacity: 0.7, marginBottom: '12px' }}>
            Hold and speak
          </div>
          <select
            value={currentHotkeyLabel}
            onChange={(e) => {
              const option = HOTKEY_OPTIONS.find(opt => opt.label === e.target.value);
              if (option) {
                setHotkeyConfig({
                  modifiers: option.modifiers || [],
                  key: option.key,
                  keycode: option.keycode,
                });
                // Send to main process
                if (window.electron) {
                  window.electron.send('HOTKEY_CONFIG_UPDATE', {
                    config: {
                      modifiers: option.modifiers || [],
                      key: option.key,
                      keycode: option.keycode,
                    },
                  });
                }
              }
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: '1px solid var(--desktop-window-border)',
              background: 'var(--desktop-window-bg)',
              color: 'var(--desktop-text)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {HOTKEY_OPTIONS.map((option) => (
              <option key={option.label} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Microphone */}
      <div style={{
        padding: '20px',
        background: 'var(--desktop-window-bg)',
        border: '1px solid var(--desktop-window-border)',
        marginBottom: '16px',
      }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '4px', color: 'var(--desktop-text)' }}>
            Microphone
          </div>
          <div style={{ fontSize: '13px', color: 'var(--desktop-text)', opacity: 0.7, marginBottom: '12px' }}>
            Select audio input device
          </div>
          <select
            value={selectedMicrophone}
            onChange={(e) => {
              setSelectedMicrophone(e.target.value);
              // TODO: Save to settings and update audio capture
              console.log('[Settings] Microphone changed to:', e.target.value);
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: '1px solid var(--desktop-window-border)',
              background: 'var(--desktop-window-bg)',
              color: 'var(--desktop-text)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {availableMicrophones.length === 0 ? (
              <option value="default">Loading microphones...</option>
            ) : (
              availableMicrophones.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${index + 1}`}
                  {index === 0 ? ' (recommended)' : ''}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* App Settings Section */}
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginTop: '32px', marginBottom: '16px', color: 'var(--desktop-text)' }}>
        App settings
      </h3>

      {/* Show app in dock */}
      <div style={{
        padding: '20px',
        background: 'var(--desktop-window-bg)',
        border: '1px solid var(--desktop-window-border)',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--desktop-text)' }}>
              Show app in dock
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '28px' }}>
            <input
              type="checkbox"
              checked={showInDock}
              onChange={(e) => handleDockVisibilityChange(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: showInDock ? 'var(--desktop-accent)' : '#555',
              transition: '0.3s',
              border: '1px solid var(--desktop-window-border)',
            }}>
              <span style={{
                position: 'absolute',
                content: '',
                height: '22px',
                width: '22px',
                left: showInDock ? '24px' : '3px',
                bottom: '2px',
                background: 'var(--desktop-text)',
                transition: '0.3s',
              }} />
            </span>
          </label>
        </div>
      </div>

      {/* Data Section */}
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginTop: '32px', marginBottom: '16px', color: 'var(--desktop-text)' }}>
        Data
      </h3>

      {/* Reset app */}
      <div style={{
        padding: '20px',
        background: 'var(--desktop-window-bg)',
        border: '1px solid var(--desktop-window-border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '4px', color: 'var(--desktop-text)' }}>
              Reset app
            </div>
            <div style={{ fontSize: '13px', color: 'var(--desktop-text)', opacity: 0.7 }}>
              Reset only if advised by support
            </div>
          </div>
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to reset the app? This will clear all settings and history.')) {
                if (window.electron) {
                  try {
                    console.log('[Settings] Invoking RESET_APP...');
                    await (window.electron as any).invoke(IPC_CHANNELS.RESET_APP);
                  } catch (error) {
                    console.error('[Settings] Failed to reset app:', error);
                  }
                }
              }
            }}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              border: '1px solid var(--desktop-window-border)',
              background: 'var(--desktop-window-bg)',
              cursor: 'pointer',
              color: 'var(--desktop-text)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Reset & restart
          </button>
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
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: 'var(--desktop-text)' }}>
        Recording Pill
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--desktop-text)', opacity: 0.7, marginBottom: '32px' }}>
        Customize the visual indicator that appears while recording
      </p>

      {/* Settings Controls */}
      <div style={{
        padding: '20px',
        background: 'var(--desktop-window-bg)',
        border: '1px solid var(--desktop-window-border)',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '500', margin: 0, color: 'var(--desktop-text)' }}>Settings</h3>
          <button
            onClick={handleRandomize}
            style={{
              padding: '8px',
              background: 'var(--desktop-accent)',
              color: 'var(--desktop-bg)',
              border: '1px solid var(--desktop-window-border)',
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
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--desktop-text)', opacity: 0.7, marginBottom: '8px' }}>
              <span>Number of Bars</span>
              <span style={{ fontWeight: '500', color: 'var(--desktop-text)', opacity: 1 }}>{pillConfig.numBars}</span>
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
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--desktop-text)', opacity: 0.7, marginBottom: '8px' }}>
              <span>Bar Width</span>
              <span style={{ fontWeight: '500', color: 'var(--desktop-text)', opacity: 1 }}>{pillConfig.barWidth}px</span>
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
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--desktop-text)', opacity: 0.7, marginBottom: '8px' }}>
              <span>Bar Gap</span>
              <span style={{ fontWeight: '500', color: 'var(--desktop-text)', opacity: 1 }}>{pillConfig.barGap}px</span>
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
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--desktop-text)', opacity: 0.7, marginBottom: '8px' }}>
              <span>Max Height</span>
              <span style={{ fontWeight: '500', color: 'var(--desktop-text)', opacity: 1 }}>{pillConfig.maxHeight}px</span>
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
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--desktop-text)', opacity: 0.7, marginBottom: '8px' }}>
              <span>Border Radius</span>
              <span style={{ fontWeight: '500', color: 'var(--desktop-text)', opacity: 1 }}>{Math.round((pillConfig.borderRadius / 10) * 100)}%</span>
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
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--desktop-text)', opacity: 0.7, marginBottom: '8px' }}>
              <span>Glow Intensity</span>
              <span style={{ fontWeight: '500', color: 'var(--desktop-text)', opacity: 1 }}>{pillConfig.glowIntensity}</span>
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
            color: 'var(--desktop-text)',
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
                width: '32px',
                height: '32px',
                border: '1px solid var(--desktop-window-border)',
                cursor: 'pointer',
              }}
            />
            {pillConfig.useGradient && (
              <input
                type="color"
                value={pillConfig.color2}
                onChange={(e) => setPillConfig({ ...pillConfig, color2: e.target.value })}
                style={{
                  width: '32px',
                  height: '32px',
                  border: '1px solid var(--desktop-window-border)',
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
              background: previewDarkMode ? 'var(--desktop-text)' : 'var(--desktop-taskbar-bg)',
              color: previewDarkMode ? 'var(--desktop-bg)' : 'var(--desktop-text)',
              border: '1px solid var(--desktop-window-border)',
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
          background: previewDarkMode ? 'var(--desktop-taskbar-bg)' : '#f5f5f5',
          border: '1px solid var(--desktop-window-border)',
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

// Toast Notification Component
interface ToastProps {
  message: string;
  visible: boolean;
}

function Toast({ message, visible }: ToastProps) {
  return (
    <div style={{
      position: 'fixed',
      bottom: visible ? '24px' : '-100px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--desktop-taskbar-bg)',
      color: 'var(--desktop-text)',
      padding: '12px 20px',
      border: '1px solid var(--desktop-window-border)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: 10000,
      opacity: visible ? 1 : 0,
      transition: 'all 0.3s ease-in-out',
      pointerEvents: 'none',
      fontFamily: 'var(--font-mono)',
    }}>
      <div style={{
        width: '18px',
        height: '18px',
        background: 'var(--desktop-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <CheckmarkIcon />
      </div>
      <span>{message}</span>
    </div>
  );
}

// Toast state type
type ToastState = {
  visible: boolean;
  message: string;
};

// History Section
interface HistorySectionProps {
  history: HistoryItem[];
  setHistory: (history: HistoryItem[]) => void;
}

function HistorySection({ history, setHistory }: HistorySectionProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '' });

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, 2000);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Transcript copied');
    } catch (error) {
      console.error('[History] Failed to copy:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.electron) {
      try {
        // Immediately remove from UI for instant feedback
        setHistory(history.filter(item => item.id !== id));

        // Delete from backend using invoke instead of send
        const success = await (window.electron as any).invoke(IPC_CHANNELS.HISTORY_DELETE, { id });

        if (success) {
          showToast('Transcript deleted');
        } else {
          console.error('[History] Failed to delete item');
          // Reload history if delete failed
          const updatedHistory = await (window.electron as any).invoke(IPC_CHANNELS.HISTORY_GET);
          setHistory(updatedHistory || []);
        }
      } catch (error) {
        console.error('[History] Delete error:', error);
        // Reload history on error
        const updatedHistory = await (window.electron as any).invoke(IPC_CHANNELS.HISTORY_GET);
        setHistory(updatedHistory || []);
      }
    }
  };

  const handleClear = async () => {
    if (window.electron && confirm('Clear all history? This cannot be undone.')) {
      try {
        await (window.electron as any).invoke(IPC_CHANNELS.HISTORY_CLEAR);
        showToast('History cleared');
      } catch (error) {
        console.error('[History] Clear error:', error);
      }
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  // Group history items by date sections
  const groupHistoryByDate = (items: HistoryItem[]) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000; // 24 hours in ms

    const groups: { [key: string]: HistoryItem[] } = {};

    items.forEach(item => {
      const itemDate = new Date(item.timestamp);
      const itemDayStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).getTime();

      let groupKey: string;
      if (itemDayStart === todayStart) {
        groupKey = 'TODAY';
      } else if (itemDayStart === yesterdayStart) {
        groupKey = 'YESTERDAY';
      } else {
        // Format as "Month Day, Year" (e.g., "October 10, 2025")
        groupKey = itemDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  };

  const groupedHistory = groupHistoryByDate(history);

  return (
    <>
      <Toast message={toast.message} visible={toast.visible} />
      <div>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0, color: 'var(--desktop-text)', marginBottom: '4px' }}>
            Recent activity
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--desktop-text)', opacity: 0.7, margin: 0 }}>
            Last 10 transcriptions
          </p>
        </div>

      {history.length === 0 ? (
        <div style={{
          padding: '64px 32px',
          background: 'var(--desktop-window-bg)',
          border: '1px solid var(--desktop-window-border)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px', color: 'var(--desktop-text)' }}>
            No history yet
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--desktop-text)', opacity: 0.7 }}>
            Your transcriptions will appear here
          </p>
        </div>
      ) : (
        <div>
          {Object.entries(groupedHistory).map(([dateLabel, items], groupIndex) => (
            <div key={dateLabel} style={{ marginBottom: groupIndex < Object.keys(groupedHistory).length - 1 ? '32px' : '0' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--desktop-accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '16px',
              }}>
                {dateLabel}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {items.map((item, index) => (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  padding: '20px 0',
                  borderBottom: index < items.length - 1 ? '1px solid var(--desktop-window-border)' : 'none',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  fontSize: '13px',
                  color: 'var(--desktop-text)',
                  opacity: 0.7,
                  minWidth: '80px',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {new Date(item.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '15px',
                    color: 'var(--desktop-text)',
                    lineHeight: '1.5',
                    wordBreak: 'break-word',
                  }}>
                    {item.text}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexShrink: 0,
                  opacity: hoveredItem === item.id ? 1 : 0,
                  transition: 'opacity 0.2s',
                }}>
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => handleCopy(item.text)}
                      onMouseEnter={() => setHoveredButton(`copy-${item.id}`)}
                      onMouseLeave={() => setHoveredButton(null)}
                      style={{
                        padding: '6px',
                        background: 'transparent',
                        color: hoveredButton === `copy-${item.id}` ? 'var(--desktop-accent)' : 'var(--desktop-text)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s',
                      }}
                    >
                      <CopyIcon />
                    </button>
                    {hoveredButton === `copy-${item.id}` && (
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '8px',
                        padding: '6px 10px',
                        background: 'var(--desktop-taskbar-bg)',
                        color: 'var(--desktop-text)',
                        border: '1px solid var(--desktop-window-border)',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 1000,
                      }}>
                        Copy transcript
                      </div>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => handleDelete(item.id)}
                      onMouseEnter={() => setHoveredButton(`delete-${item.id}`)}
                      onMouseLeave={() => setHoveredButton(null)}
                      style={{
                        padding: '6px',
                        background: 'transparent',
                        color: hoveredButton === `delete-${item.id}` ? '#ef4444' : 'var(--desktop-text)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s',
                      }}
                    >
                      <TrashIcon />
                    </button>
                    {hoveredButton === `delete-${item.id}` && (
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '8px',
                        padding: '6px 10px',
                        background: 'var(--desktop-taskbar-bg)',
                        color: 'var(--desktop-text)',
                        border: '1px solid var(--desktop-window-border)',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 1000,
                      }}>
                        Delete
                      </div>
                    )}
                  </div>
                </div>
              </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}

// Account Management Types
interface UserAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicUrl?: string;
  provider: 'google' | 'github' | 'email';
}

interface License {
  id: string;
  key: string;
  status: 'pending' | 'active' | 'canceled';
  metadata?: {
    machine_id?: string;
    machine_name?: string;
    machine_os?: string;
    activated_at?: string;
    [key: string]: any;
  };
  expires_at: string | null;
  renews_at: string | null;
  stripe_customer_id: string | null;
  created_at: string;
}

type SubscriptionStatus =
  | { type: 'none' } // Not logged in
  | { type: 'trial', startDate: number, daysRemaining: number } // 7-day trial
  | { type: 'trial_expired', expiredDate: number } // Trial ended
  | { type: 'active', startDate: number, nextBillingDate: number, plan: string }; // Active subscription

// Account Section
function AccountSection() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({ type: 'none' });
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingLicense, setActivatingLicense] = useState<string | null>(null);
  const [revokingLicense, setRevokingLicense] = useState<string | null>(null);
  const [cancelingLicense, setCancelingLicense] = useState<string | null>(null);
  const [currentMachineId, setCurrentMachineId] = useState<string | null>(null);

  // Get current machine ID on mount
  useEffect(() => {
    const getMachineId = async () => {
      try {
        if (window.electron) {
          const result = await (window.electron as any).invoke('GET_MACHINE_ID');
          console.log('[Account] Got machine ID:', result.machineId);
          setCurrentMachineId(result.machineId);
        }
      } catch (error) {
        console.error('[Account] Failed to get machine ID:', error);
      }
    };
    getMachineId();
  }, []);

  // Check auth and load user data on mount
  useEffect(() => {
    checkAuth();

    // Listen for auth state changes (e.g., after OAuth completes)
    if (window.electron) {
      (window.electron as any).on('AUTH_STATE_CHANGED', () => {
        console.log('[Account] Auth state changed, refreshing...');
        checkAuth();
      });
    }
  }, []);

  const checkAuth = async () => {
    try {
      console.log('[Account] Checking auth status...');
      if (window.electron) {
        // Get auth status from main process
        const authData = await (window.electron as any).invoke('GET_AUTH_STATUS');
        console.log('[Account] Auth data received:', authData);

        if (authData && authData.user) {
          console.log('[Account] User found:', authData.user.email);
          // Parse user name (assuming Google OAuth provides full_name)
          const nameParts = authData.user.user_metadata?.full_name?.split(' ') || ['User', ''];

          setUser({
            id: authData.user.id,
            email: authData.user.email || '',
            firstName: nameParts[0] || 'User',
            lastName: nameParts.slice(1).join(' ') || '',
            profilePicUrl: authData.user.user_metadata?.avatar_url,
            provider: 'google',
          });

          // Fetch licenses
          await fetchLicenses(authData.user.id);
        } else {
          console.log('[Account] No user found, setting user to null');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('[Account] Failed to check auth:', error);
    } finally {
      console.log('[Account] Setting loading to false');
      setLoading(false);
    }
  };

  const fetchLicenses = async (userId: string) => {
    try {
      if (window.electron) {
        const licensesData = await (window.electron as any).invoke('GET_LICENSES', { userId });
        setLicenses(licensesData || []);

        // Determine subscription status based on licenses
        if (licensesData && licensesData.length > 0) {
          const license = licensesData[0];
          if (license.status === 'active' && license.renews_at) {
            setSubscription({
              type: 'active',
              startDate: new Date(license.created_at).getTime(),
              nextBillingDate: new Date(license.renews_at).getTime(),
              plan: 'Pro Plan',
            });
          } else if (license.status === 'pending' && license.expires_at) {
            // Trial status - calculate days remaining
            const expiresAt = new Date(license.expires_at).getTime();
            const now = Date.now();
            const daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));

            if (daysRemaining > 0) {
              setSubscription({
                type: 'trial',
                startDate: new Date(license.created_at).getTime(),
                daysRemaining,
              });
            } else {
              setSubscription({
                type: 'trial_expired',
                expiredDate: expiresAt,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('[Account] Failed to fetch licenses:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      if (window.electron) {
        console.log('[Account] Starting Google OAuth flow...');
        await (window.electron as any).invoke('START_OAUTH', { provider: 'google' });
        // After OAuth completes, checkAuth will be called again
        await checkAuth();
      }
    } catch (error) {
      console.error('[Account] OAuth failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      if (window.electron) {
        await (window.electron as any).invoke('SIGN_OUT');
        setUser(null);
        setSubscription({ type: 'none' });
        setLicenses([]);
      }
    } catch (error) {
      console.error('[Account] Sign out failed:', error);
    }
  };

  const handleUseLicense = async (licenseKey: string) => {
    try {
      setActivatingLicense(licenseKey);

      if (window.electron) {
        console.log('[Account] Activating license:', licenseKey);
        const result = await (window.electron as any).invoke('ACTIVATE_LICENSE', { licenseKey });
        console.log('[Account] Activation result:', result);

        // Reload licenses to show updated status
        if (user) {
          await fetchLicenses(user.id);
        }

        alert('License activated successfully!');
      }
    } catch (error) {
      console.error('[Account] License activation failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to activate license: ${errorMessage}\n\nPlease check the console for more details.`);
    } finally {
      setActivatingLicense(null);
    }
  };

  const handleRevokeLicense = async (licenseKey: string) => {
    if (!confirm('Are you sure you want to revoke this license from this machine? You can activate it on another machine afterwards.')) {
      return;
    }

    try {
      setRevokingLicense(licenseKey);

      if (window.electron) {
        console.log('[Account] Revoking license:', licenseKey);
        const result = await (window.electron as any).invoke('REVOKE_LICENSE', { licenseKey });
        console.log('[Account] Revocation result:', result);

        // Reload licenses to show updated status
        if (user) {
          await fetchLicenses(user.id);
        }

        alert('License revoked successfully! You can now use it on another machine.');
      }
    } catch (error) {
      console.error('[Account] License revocation failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to revoke license: ${errorMessage}\n\nPlease check the console for more details.`);
    } finally {
      setRevokingLicense(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      return;
    }

    try {
      if (window.electron) {
        await (window.electron as any).invoke('DELETE_ACCOUNT');
        setUser(null);
        setSubscription({ type: 'none' });
        setLicenses([]);
      }
    } catch (error) {
      console.error('[Account] Delete account failed:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  const handleRenameMachine = async (licenseId: string, newName: string) => {
    try {
      if (window.electron) {
        console.log('[Account] Renaming machine for license:', licenseId, 'to:', newName);
        await (window.electron as any).invoke('RENAME_MACHINE', { licenseId, newName });

        // Update local state
        setLicenses(licenses.map(license =>
          license.id === licenseId
            ? { ...license, metadata: { ...license.metadata, machine_name: newName } }
            : license
        ));
      }
    } catch (error) {
      console.error('[Account] Machine rename failed:', error);
      alert('Failed to rename machine. Please try again.');
    }
  };

  const handleCancelLicense = async (licenseKey: string) => {
    try {
      setCancelingLicense(licenseKey);

      console.log('[Account] Opening marketing site account page for license:', licenseKey);

      // Determine marketing site URL based on environment
      const marketingSiteUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://narraflow.com';
      const accountUrl = `${marketingSiteUrl}?openAccount=true`;

      // Open marketing site with account dialog open
      if (window.electron) {
        await (window.electron as any).invoke('OPEN_EXTERNAL_URL', { url: accountUrl });
      } else {
        window.open(accountUrl, '_blank');
      }
    } catch (error) {
      console.error('[Account] Failed to open account page:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to open account page: ${errorMessage}`);
    } finally {
      setCancelingLicense(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
      }}>
        <div style={{ fontSize: '14px', color: 'var(--desktop-text)', opacity: 0.7 }}>Loading...</div>
      </div>
    );
  }

  // Render different views based on user state
  if (!user) {
    return <NotLoggedInView onSignIn={handleSignIn} />;
  }

  if (subscription.type === 'trial_expired') {
    return <TrialExpiredView user={user} onSubscribe={() => {
      console.log('[Account] Subscribe clicked');
      // TODO: Implement Stripe checkout
    }} />;
  }

  if (subscription.type === 'trial') {
    return <TrialActiveView
      user={user}
      daysRemaining={subscription.daysRemaining}
      licenses={licenses}
      onUseLicense={handleUseLicense}
      onRevokeLicense={handleRevokeLicense}
      onCancelLicense={handleCancelLicense}
      onRenameMachine={handleRenameMachine}
      activatingLicense={activatingLicense}
      revokingLicense={revokingLicense}
      cancelingLicense={cancelingLicense}
      currentMachineId={currentMachineId}
      onSignOut={handleSignOut}
      onDeleteAccount={handleDeleteAccount}
    />;
  }

  if (subscription.type === 'active') {
    return <ActiveSubscriptionView
      user={user}
      subscription={subscription}
      licenses={licenses}
      onUseLicense={handleUseLicense}
      onRevokeLicense={handleRevokeLicense}
      onCancelLicense={handleCancelLicense}
      onRenameMachine={handleRenameMachine}
      activatingLicense={activatingLicense}
      revokingLicense={revokingLicense}
      cancelingLicense={cancelingLicense}
      currentMachineId={currentMachineId}
      onSignOut={handleSignOut}
      onDeleteAccount={handleDeleteAccount}
    />;
  }

  // Default case: user logged in but no subscription yet (show trial view with 0 days)
  console.log('[Account] Rendering default view for user with no subscription');
  return <TrialActiveView
    user={user}
    daysRemaining={0}
    licenses={licenses}
    onUseLicense={handleUseLicense}
    onRevokeLicense={handleRevokeLicense}
    onCancelLicense={handleCancelLicense}
    onRenameMachine={handleRenameMachine}
    activatingLicense={activatingLicense}
    revokingLicense={revokingLicense}
    cancelingLicense={cancelingLicense}
    currentMachineId={currentMachineId}
    onSignOut={handleSignOut}
    onDeleteAccount={handleDeleteAccount}
  />;
}

// License Item Component with inline edit
interface LicenseItemProps {
  license: License;
  onUseLicense: (licenseKey: string) => void;
  onRevokeLicense: (licenseKey: string) => void;
  onCancelLicense?: (licenseKey: string) => void;
  onRenameMachine: (licenseId: string, newName: string) => void;
  activatingLicense: string | null;
  revokingLicense: string | null;
  cancelingLicense?: string | null;
  currentMachineId: string | null;
}

function LicenseItem({ license, onUseLicense, onRevokeLicense, onCancelLicense, onRenameMachine, activatingLicense, revokingLicense, cancelingLicense, currentMachineId }: LicenseItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(license.metadata?.machine_name || '');
  const [isHovered, setIsHovered] = useState(false);

  // Check if this license is active on this machine
  const isActiveOnThisMachine = !!(
    currentMachineId &&
    license.metadata?.machine_id &&
    license.metadata.machine_id === currentMachineId
  );

  console.log('[LicenseItem] Comparison:', {
    licenseKey: license.key,
    licenseMachineId: license.metadata?.machine_id,
    currentMachineId,
    isActiveOnThisMachine
  });

  const handleSave = () => {
    if (editedName.trim() && editedName !== license.metadata?.machine_name) {
      onRenameMachine(license.id, editedName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(license.metadata?.machine_name || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '16px',
        background: 'var(--desktop-window-bg)',
        border: '1px solid var(--desktop-window-border)',
        marginBottom: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--desktop-text)', opacity: 0.7, marginBottom: '8px' }}>
            {license.key}
          </div>
          {license.metadata?.machine_name ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '28px' }}>
              {isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    autoFocus
                    style={{
                      fontSize: '14px',
                      padding: '4px 8px',
                      border: '1px solid var(--desktop-accent)',
                      background: 'var(--desktop-bg)',
                      color: 'var(--desktop-text)',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '14px', color: 'var(--desktop-text)' }}>
                    {license.metadata.machine_name}
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: '4px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--desktop-text)',
                      opacity: isHovered ? 0.7 : 0,
                      visibility: isHovered ? 'visible' : 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'opacity 0.2s, visibility 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                  >
                    <EditIcon />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: 'var(--desktop-text)', opacity: 0.7 }}>
              Not activated on any machine
            </div>
          )}
        </div>
        <div style={{
          padding: '4px 12px',
          background: license.status === 'active' ? 'var(--desktop-accent)' : 'var(--desktop-secondary)',
          color: 'var(--desktop-bg)',
          fontSize: '12px',
          fontWeight: '500',
        }}>
          {license.status === 'pending' ? 'Trial' : 'Active'}
        </div>
      </div>

      {/* Billing info */}
      {license.renews_at && (
        <div style={{ fontSize: '13px', color: 'var(--desktop-text)', opacity: 0.7, marginTop: '12px' }}>
          Next billing: {new Date(license.renews_at).toLocaleDateString()} • ${MONTHLY_PRICE}/month
        </div>
      )}

      {/* Show "Use on this machine" if not activated on any machine */}
      {!license.metadata?.machine_id && (
        <button
          onClick={() => onUseLicense(license.key)}
          disabled={activatingLicense === license.key}
          style={{
            padding: '8px 16px',
            background: activatingLicense === license.key ? '#555' : 'var(--desktop-accent)',
            color: 'var(--desktop-bg)',
            border: '1px solid var(--desktop-window-border)',
            fontSize: '13px',
            fontWeight: '500',
            cursor: activatingLicense === license.key ? 'not-allowed' : 'pointer',
            marginTop: '8px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {activatingLicense === license.key ? 'Activating...' : 'Use on this machine'}
        </button>
      )}
      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
        {/* Show "Revoke from this machine" if activated on THIS machine */}
        {isActiveOnThisMachine && (
          <button
            onClick={() => onRevokeLicense(license.key)}
            disabled={revokingLicense === license.key}
            style={{
              padding: '8px 16px',
              background: revokingLicense === license.key ? '#555' : '#bf616a',
              color: '#fff',
              border: '1px solid var(--desktop-window-border)',
              fontSize: '13px',
              fontWeight: '500',
              cursor: revokingLicense === license.key ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {revokingLicense === license.key ? 'Revoking...' : 'Revoke from this machine'}
          </button>
        )}

        {/* Cancel subscription button */}
        {onCancelLicense && license.stripe_customer_id && (
          <button
            onClick={() => onCancelLicense(license.key)}
            disabled={cancelingLicense === license.key}
            style={{
              padding: '8px 16px',
              background: cancelingLicense === license.key ? '#555' : 'var(--desktop-window-bg)',
              color: 'var(--desktop-text)',
              border: '1px solid var(--desktop-window-border)',
              fontSize: '13px',
              fontWeight: '500',
              cursor: cancelingLicense === license.key ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {cancelingLicense === license.key
              ? (license.status === 'canceled' ? 'Processing...' : 'Canceling...')
              : (license.status === 'canceled' ? 'Undo cancel' : 'Cancel subscription')}
          </button>
        )}
      </div>
    </div>
  );
}

// Google Icon Component - matching marketing site style
const GoogleIcon = () => (
  <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

// Not Logged In View
interface NotLoggedInViewProps {
  onSignIn: () => void;
}

function NotLoggedInView({ onSignIn }: NotLoggedInViewProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
      }}>
        <div style={{
          padding: '48px 32px',
          background: 'var(--desktop-window-bg)',
          border: '1px solid var(--desktop-window-border)',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            border: '2px solid var(--desktop-accent)',
            background: 'var(--desktop-bg)',
            marginBottom: '24px',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--desktop-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--desktop-text)' }}>
            Get started with NarraFlow
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--desktop-text)', opacity: 0.7, marginBottom: '32px', lineHeight: '1.6' }}>
            Sign in with your Google account to start your 7-day free trial.<br/>
            No credit card required.
          </p>

          {/* Google Sign In Button - matching marketing site */}
          <button
            onClick={onSignIn}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 24px',
              background: 'white',
              color: '#000',
              border: '1px solid #ddd',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s',
              fontFamily: 'Roboto, sans-serif',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = '#bbb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
              e.currentTarget.style.borderColor = '#ddd';
            }}
          >
            <GoogleIcon />
            Sign in with Google
          </button>

          {/* Pricing */}
          <div style={{
            marginTop: '32px',
            paddingTop: '32px',
            borderTop: '1px solid var(--desktop-window-border)',
          }}>
            <div style={{ fontSize: '13px', color: 'var(--desktop-text)', opacity: 0.7, marginBottom: '8px' }}>
              After trial
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--desktop-accent)' }}>
              ${MONTHLY_PRICE}<span style={{ fontSize: '16px', fontWeight: '400', color: 'var(--desktop-text)', opacity: 0.7 }}>/month</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--desktop-text)', opacity: 0.7, marginTop: '8px' }}>
              Cancel anytime
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Card Component (Reusable)
interface ProfileCardProps {
  user: UserAccount;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

function ProfileCard({ user, onSignOut, onDeleteAccount }: ProfileCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div style={{
      padding: '24px',
      background: 'var(--desktop-window-bg)',
      border: '1px solid var(--desktop-window-border)',
      marginBottom: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        {/* Profile Picture */}
        <div style={{
          width: '56px',
          height: '56px',
          border: '2px solid var(--desktop-accent)',
          background: user.profilePicUrl ? `url(${user.profilePicUrl})` : 'var(--desktop-accent)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--desktop-bg)',
          fontSize: '20px',
          fontWeight: '600',
        }}>
          {!user.profilePicUrl && `${user.firstName[0]}${user.lastName[0]}`}
        </div>

        {/* User Info */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--desktop-text)', marginBottom: '4px' }}>
            {user.firstName} {user.lastName}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--desktop-text)', opacity: 0.7 }}>
            {user.email}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onSignOut}
          style={{
            flex: 1,
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid var(--desktop-window-border)',
            background: 'var(--desktop-bg)',
            cursor: 'pointer',
            color: 'var(--desktop-text)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

// Trial Active View
interface TrialActiveViewProps {
  user: UserAccount;
  daysRemaining: number;
  licenses: License[];
  onUseLicense: (licenseKey: string) => void;
  onRevokeLicense: (licenseKey: string) => void;
  onCancelLicense: (licenseKey: string) => void;
  onRenameMachine: (licenseId: string, newName: string) => void;
  activatingLicense: string | null;
  revokingLicense: string | null;
  cancelingLicense: string | null;
  currentMachineId: string | null;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

function TrialActiveView({ user, daysRemaining, licenses, onUseLicense, onRevokeLicense, onCancelLicense, onRenameMachine, activatingLicense, revokingLicense, cancelingLicense, currentMachineId, onSignOut, onDeleteAccount }: TrialActiveViewProps) {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: 'var(--desktop-text)' }}>
        Account
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--desktop-text)', opacity: 0.7, marginBottom: '32px' }}>
        Manage your subscription and licenses
      </p>

      {/* Profile Card */}
      <ProfileCard user={user} onSignOut={onSignOut} onDeleteAccount={onDeleteAccount} />

      {/* Trial Status */}
      <div style={{
        padding: '24px',
        background: 'var(--desktop-window-bg)',
        border: '1px solid var(--desktop-accent)',
        marginBottom: '24px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--desktop-text)' }}>
          Free Trial
        </h3>
        <div style={{ fontSize: '14px', color: 'var(--desktop-text)', opacity: 0.9 }}>
          {daysRemaining} days remaining
        </div>
        <div style={{ fontSize: '13px', color: 'var(--desktop-text)', opacity: 0.7, marginTop: '8px' }}>
          After your trial ends, it's ${MONTHLY_PRICE}/month
        </div>
      </div>

      {/* Licenses */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--desktop-text)' }}>
          Your Licenses
        </h3>
        {licenses.map(license => (
          <LicenseItem
            key={license.id}
            license={license}
            onUseLicense={onUseLicense}
            onRevokeLicense={onRevokeLicense}
            onCancelLicense={onCancelLicense}
            onRenameMachine={onRenameMachine}
            activatingLicense={activatingLicense}
            revokingLicense={revokingLicense}
            cancelingLicense={cancelingLicense}
            currentMachineId={currentMachineId}
          />
        ))}
      </div>
    </div>
  );
}

// Active Subscription View
interface ActiveSubscriptionViewProps {
  user: UserAccount;
  subscription: { type: 'active', startDate: number, nextBillingDate: number, plan: string };
  licenses: License[];
  onUseLicense: (licenseKey: string) => void;
  onRevokeLicense: (licenseKey: string) => void;
  onCancelLicense: (licenseKey: string) => void;
  onRenameMachine: (licenseId: string, newName: string) => void;
  activatingLicense: string | null;
  revokingLicense: string | null;
  cancelingLicense: string | null;
  currentMachineId: string | null;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

function ActiveSubscriptionView({ user, subscription, licenses, onUseLicense, onRevokeLicense, onCancelLicense, onRenameMachine, activatingLicense, revokingLicense, cancelingLicense, currentMachineId, onSignOut, onDeleteAccount }: ActiveSubscriptionViewProps) {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: 'var(--desktop-text)' }}>
        Account
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--desktop-text)', opacity: 0.7, marginBottom: '32px' }}>
        Manage your subscription and licenses
      </p>

      {/* Profile Card */}
      <ProfileCard user={user} onSignOut={onSignOut} onDeleteAccount={onDeleteAccount} />

      {/* Licenses */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--desktop-text)' }}>
          Your Licenses
        </h3>
        {licenses.map(license => (
          <LicenseItem
            key={license.id}
            license={license}
            onUseLicense={onUseLicense}
            onRevokeLicense={onRevokeLicense}
            onCancelLicense={onCancelLicense}
            onRenameMachine={onRenameMachine}
            activatingLicense={activatingLicense}
            revokingLicense={revokingLicense}
            cancelingLicense={cancelingLicense}
            currentMachineId={currentMachineId}
          />
        ))}
      </div>
    </div>
  );
}

// Trial Expired View
interface TrialExpiredViewProps {
  user: UserAccount;
  onSubscribe: () => void;
}

function TrialExpiredView({ user, onSubscribe }: TrialExpiredViewProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
      }}>
        <div style={{
          padding: '48px 32px',
          background: 'var(--desktop-window-bg)',
          border: '1px solid var(--desktop-window-border)',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--desktop-text)' }}>
            Trial Expired
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--desktop-text)', opacity: 0.7, marginBottom: '32px', lineHeight: '1.6' }}>
            Your 7-day trial has ended. Subscribe to continue using NarraFlow.
          </p>

          <button
            onClick={onSubscribe}
            style={{
              padding: '12px 32px',
              fontSize: '15px',
              fontWeight: '600',
              border: '1px solid var(--desktop-window-border)',
              background: 'var(--desktop-accent)',
              cursor: 'pointer',
              color: 'var(--desktop-bg)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Subscribe for ${MONTHLY_PRICE}/month
          </button>
        </div>
      </div>
    </div>
  );
}

// Feedback Section
function FeedbackSection() {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState('');
  const [macOSVersion, setMacOSVersion] = useState('');
  const [appVersion, setAppVersion] = useState('');
  const [contactType, setContactType] = useState('');
  const [consentToShare, setConsentToShare] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTooltipEnter = (tooltip: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.right + 8,
      y: rect.top + rect.height / 2
    });
    setHoveredTooltip(tooltip);
  };

  const handleTooltipLeave = () => {
    setHoveredTooltip(null);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        invalidFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      alert(`The following files are too large (max 100MB):\n${invalidFiles.join('\n')}`);
    }

    if (validFiles.length > 0) {
      setAttachments([...attachments, ...validFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    setIsLoading(true);

    try {
      // Build metadata object with dynamic fields based on contact type
      const metadata: any = {};

      if (contactType === 'bug') {
        if (macOSVersion) metadata.macos_version = macOSVersion;
        if (appVersion) metadata.app_version = appVersion;
      }

      // Add consent flag for testimonials
      if (contactType === 'testimonial') {
        metadata.consent_to_share = consentToShare;
      }

      // Add attachment names if present
      if (attachments.length > 0) {
        metadata.attachments = attachments.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        }));
      }

      // Submit to API (using full Supabase URL from Electron)
      const response = await fetch('https://buqkvxtxjwyohzsogfbz.supabase.co/functions/v1/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: contactType,
          message: message.trim(),
          metadata
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setIsSent(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get dynamic labels based on contact type
  const getMessageLabel = () => {
    switch (contactType) {
      case 'bug':
        return 'What happened?';
      case 'feature':
        return 'What feature would you like?';
      case 'feedback':
        return 'Your feedback';
      case 'help':
        return 'What do you need help with?';
      case 'testimonial':
        return 'Share your experience';
      default:
        return 'Your message';
    }
  };

  const getMessagePlaceholder = () => {
    switch (contactType) {
      case 'bug':
        return 'Describe what steps led up to the issue...';
      case 'feature':
        return 'Describe the feature you\'d like to see...';
      case 'feedback':
        return 'Share your thoughts with us...';
      case 'help':
        return 'Describe what you need help with...';
      case 'testimonial':
        return 'Tell us how NarraFlow has helped you...';
      default:
        return 'Type your message here...';
    }
  };

  const showVersionFields = contactType === 'bug';
  const maxMessageLength = 500;

  // Show success message if sent
  if (isSent) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: 'var(--desktop-text)' }}>
            Message sent!
          </h2>
          <p style={{ fontSize: '14px', opacity: 0.8, maxWidth: '500px', color: 'var(--desktop-text)', marginBottom: '16px' }}>
            Your message was sent. We'll try to respond within 48 hours.
          </p>
          <p style={{ fontSize: '12px', opacity: 0.6, paddingTop: '16px', color: 'var(--desktop-text)' }}>
            You can close this window now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: 'var(--desktop-text)' }}>
        Share Feedback
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--desktop-text)', opacity: 0.7, marginBottom: '32px' }}>
        Help us improve NarraFlow
      </p>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        fontSize: '14px',
        paddingRight: '8px',
      }}>
        {/* Contact Type */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', opacity: 0.7, color: 'var(--desktop-text)' }}>
            Type of contact
          </label>
          <select
            value={contactType}
            onChange={(e) => setContactType(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              background: 'var(--desktop-window-bg)',
              border: '1px solid var(--desktop-window-border)',
              color: 'var(--desktop-text)',
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            <option value="">Select type...</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="feedback">General Feedback</option>
            <option value="testimonial">Testimonial / Success Story</option>
            <option value="help">Help/Support</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Consent checkbox - only show for testimonials */}
        {contactType === 'testimonial' && (
          <div style={{
            padding: '16px',
            background: 'rgba(163, 190, 140, 0.1)',
            border: '1px solid rgba(163, 190, 140, 0.3)',
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              cursor: 'pointer',
              fontSize: '13px',
              color: 'var(--desktop-text)',
            }}>
              <input
                type="checkbox"
                checked={consentToShare}
                onChange={(e) => setConsentToShare(e.target.checked)}
                style={{
                  marginTop: '2px',
                  cursor: 'pointer',
                  width: '16px',
                  height: '16px',
                  flexShrink: 0,
                }}
              />
              <span style={{ lineHeight: '1.5' }}>
                I give permission for NarraFlow to use my testimonial in marketing materials (website, social media, etc.) and to contact me for additional details or photos if needed.
              </span>
            </label>
          </div>
        )}

        {/* macOS Version - only show for bug reports */}
        {showVersionFields && (
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', opacity: 0.7, color: 'var(--desktop-text)' }}>
              macOS version
              <div
                style={{ position: 'relative' }}
                onMouseEnter={(e) => handleTooltipEnter('macos', e)}
                onMouseLeave={handleTooltipLeave}
              >
                <span style={{
                  cursor: 'help',
                  fontSize: '12px',
                  border: '1px solid currentColor',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>?</span>
              </div>
            </label>
            <select
              value={macOSVersion}
              onChange={(e) => setMacOSVersion(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                background: 'var(--desktop-window-bg)',
                border: '1px solid var(--desktop-window-border)',
                color: 'var(--desktop-text)',
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <option value="">Select version...</option>
              <option value="15.0">macOS Sequoia 15.0</option>
              <option value="14.0">macOS Sonoma 14.0</option>
              <option value="13.0">macOS Ventura 13.0</option>
              <option value="12.0">macOS Monterey 12.0</option>
              <option value="11.0">macOS Big Sur 11.0</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        {/* App Version - only show for bug reports */}
        {showVersionFields && (
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', opacity: 0.7, color: 'var(--desktop-text)' }}>
              app version
              <div
                style={{ position: 'relative' }}
                onMouseEnter={(e) => handleTooltipEnter('app', e)}
                onMouseLeave={handleTooltipLeave}
              >
                <span style={{
                  cursor: 'help',
                  fontSize: '12px',
                  border: '1px solid currentColor',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>?</span>
              </div>
            </label>
            <select
              value={appVersion}
              onChange={(e) => setAppVersion(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                background: 'var(--desktop-window-bg)',
                border: '1px solid var(--desktop-window-border)',
                color: 'var(--desktop-text)',
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <option value="">Select version...</option>
              <option value="0.1.0">v0.1.0</option>
              <option value="0.0.9">v0.0.9</option>
              <option value="0.0.8">v0.0.8</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        {/* Message field - only show when contact type is selected */}
        {contactType && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', opacity: 0.7, color: 'var(--desktop-text)' }}>
              {getMessageLabel()}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={getMessagePlaceholder()}
              maxLength={maxMessageLength}
              style={{
                width: '100%',
                height: '128px',
                padding: '12px',
                background: 'var(--desktop-window-bg)',
                border: '1px solid var(--desktop-window-border)',
                color: 'var(--desktop-text)',
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '12px', opacity: 0.5, marginTop: '4px', color: 'var(--desktop-text)' }}>
              {message.length} / {maxMessageLength} characters
            </div>
          </div>
        )}

        {/* Attachments - only show when contact type is selected */}
        {contactType && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', opacity: 0.7, color: 'var(--desktop-text)' }}>
              Attachments
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleClick}
              style={{
                width: '100%',
                minHeight: '96px',
                padding: '16px',
                border: `2px dashed ${isDragging ? 'var(--desktop-accent)' : 'var(--desktop-window-border)'}`,
                background: isDragging ? 'rgba(163, 190, 140, 0.1)' : 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '12px', color: 'var(--desktop-text)' }}>
                Drag and drop images here or click to browse
              </p>
            </div>

            {/* Attachment badges */}
            {attachments.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 8px',
                      background: 'rgba(163, 190, 140, 0.1)',
                      border: '1px solid rgba(163, 190, 140, 0.3)',
                      fontSize: '12px',
                      color: 'var(--desktop-text)',
                    }}
                  >
                    <span style={{ opacity: 0.8 }}>{file.name}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--desktop-text)',
                        opacity: 0.5,
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '14px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.5';
                        e.currentTarget.style.color = 'var(--desktop-text)';
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Send button */}
      <div style={{ paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          style={{
            padding: '10px 24px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: message.trim() && !isLoading ? 'var(--desktop-accent)' : 'var(--desktop-window-border)',
            color: message.trim() && !isLoading ? 'var(--desktop-window-bg)' : 'var(--desktop-text)',
            border: 'none',
            opacity: message.trim() && !isLoading ? 1 : 0.5,
            cursor: message.trim() && !isLoading ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.2s',
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
          }}
        >
          {isLoading && (
            <svg style={{ animation: 'spin 1s linear infinite', height: '16px', width: '16px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* Tooltips */}
      {hoveredTooltip === 'macos' && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateY(-50%)',
            zIndex: 10000,
            background: 'var(--desktop-taskbar-bg)',
            border: '1px solid var(--desktop-window-border)',
            padding: '12px',
            fontSize: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--desktop-text)',
            maxWidth: '300px',
          }}
        >
          <div style={{ fontWeight: '700', marginBottom: '4px', opacity: 0.9 }}>How to get your version:</div>
          <div style={{ opacity: 0.8 }}>Apple icon (top left screen) → About This Mac</div>
          <div style={{ opacity: 0.8 }}>→ you should see the macOS version</div>
        </div>
      )}

      {hoveredTooltip === 'app' && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateY(-50%)',
            zIndex: 10000,
            background: 'var(--desktop-taskbar-bg)',
            border: '1px solid var(--desktop-window-border)',
            padding: '12px',
            fontSize: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--desktop-text)',
            maxWidth: '300px',
          }}
        >
          <div style={{ fontWeight: '700', marginBottom: '4px', opacity: 0.9 }}>How to get your app version:</div>
          <div style={{ opacity: 0.8 }}>Open app (click icon in dock or Cmd+Space → type NarraFlow)</div>
          <div style={{ opacity: 0.8 }}>→ version shown at bottom left of settings window</div>
        </div>
      )}

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Mount the app
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<SettingsApp />);
}
