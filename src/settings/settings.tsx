/**
 * Settings App UI - Inspired by Wispr Flow
 * ~900px wide window with sidebar navigation
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

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
    modifiers: [],
    key: 'Fn',
    keycode: 63,
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
          background: '#fff',
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
  );
}

// Version Footer Component
function VersionFooter() {
  const [hoveredCloud, setHoveredCloud] = useState(false);
  const [isUpToDate] = useState(true); // TODO: Check for updates

  const handleCheckForUpdates = () => {
    console.log('[Settings] Checking for updates...');
    // TODO: Implement update check
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
        color: '#ccc',
      }}>
        Mic2Text v0.1.0
      </div>
      <div style={{ position: 'relative' }}>
        <div
          onClick={handleCheckForUpdates}
          onMouseEnter={() => setHoveredCloud(true)}
          onMouseLeave={() => setHoveredCloud(false)}
          style={{
            cursor: 'pointer',
            color: '#ccc',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
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
            background: '#1a1a1a',
            color: 'white',
            borderRadius: '6px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 1000,
          }}>
            {isUpToDate ? 'Up to date' : 'Update available'}
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
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#000' }}>
        General
      </h2>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
        Configure basic app settings
      </p>

      {/* Keyboard Shortcuts */}
      <div style={{
        padding: '20px',
        background: '#fafafa',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        marginBottom: '16px',
      }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '4px', color: '#000' }}>
            Keyboard shortcuts
          </div>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
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
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: 'white',
              cursor: 'pointer',
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
        background: '#fafafa',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        marginBottom: '16px',
      }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '4px', color: '#000' }}>
            Microphone
          </div>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
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
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: 'white',
              cursor: 'pointer',
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
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginTop: '32px', marginBottom: '16px', color: '#000' }}>
        App settings
      </h3>

      {/* Show app in dock */}
      <div style={{
        padding: '20px',
        background: '#fafafa',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#000' }}>
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
              background: showInDock ? '#10b981' : '#ccc',
              transition: '0.3s',
              borderRadius: '28px',
            }}>
              <span style={{
                position: 'absolute',
                content: '',
                height: '22px',
                width: '22px',
                left: showInDock ? '24px' : '3px',
                bottom: '3px',
                background: 'white',
                transition: '0.3s',
                borderRadius: '50%',
              }} />
            </span>
          </label>
        </div>
      </div>

      {/* Data Section */}
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginTop: '32px', marginBottom: '16px', color: '#000' }}>
        Data
      </h3>

      {/* Reset app */}
      <div style={{
        padding: '20px',
        background: '#fafafa',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '4px', color: '#000' }}>
              Reset app
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>
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
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: 'white',
              cursor: 'pointer',
              color: '#666',
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
      background: '#1a1a1a',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: 10000,
      opacity: visible ? 1 : 0,
      transition: 'all 0.3s ease-in-out',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      pointerEvents: 'none',
    }}>
      <div style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: '#10b981',
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
          <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0, color: '#000', marginBottom: '4px' }}>
            Recent activity
          </h2>
          <p style={{ fontSize: '14px', color: '#999', margin: 0 }}>
            Last 10 transcriptions
          </p>
        </div>

      {history.length === 0 ? (
        <div style={{
          padding: '64px 32px',
          background: '#f9f9f9',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px', color: '#000' }}>
            No history yet
          </h3>
          <p style={{ fontSize: '14px', color: '#999' }}>
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
                color: '#999',
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
                  borderBottom: index < items.length - 1 ? '1px solid #f0f0f0' : 'none',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  fontSize: '13px',
                  color: '#999',
                  minWidth: '80px',
                  fontFamily: 'monospace',
                }}>
                  {new Date(item.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '15px',
                    color: '#000',
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
                        color: hoveredButton === `copy-${item.id}` ? '#666' : '#999',
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
                        background: '#1a1a1a',
                        color: 'white',
                        borderRadius: '6px',
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
                        color: hoveredButton === `delete-${item.id}` ? '#666' : '#999',
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
                        background: '#1a1a1a',
                        color: 'white',
                        borderRadius: '6px',
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

type SubscriptionStatus =
  | { type: 'none' } // Not logged in
  | { type: 'trial', startDate: number, daysRemaining: number } // 7-day trial
  | { type: 'trial_expired', expiredDate: number } // Trial ended
  | { type: 'active', startDate: number, nextBillingDate: number, plan: string }; // Active subscription

// Account Section
function AccountSection() {
  // Simulated user state - will be replaced with real auth
  // DEMO: Showing active subscription view
  const [user, setUser] = useState<UserAccount | null>({
    id: '1',
    email: 'demo@example.com',
    firstName: 'John',
    lastName: 'Doe',
    provider: 'google',
  });
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    type: 'active',
    startDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // Started 30 days ago
    nextBillingDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // Next billing in 30 days
    plan: 'Pro Plan',
  });

  // Calculate days remaining for trial
  const calculateDaysRemaining = (startDate: number): number => {
    const trialDuration = 7; // 7 days
    const elapsed = Math.floor((Date.now() - startDate) / (1000 * 60 * 60 * 24));
    return Math.max(0, trialDuration - elapsed);
  };

  // Render different views based on user state
  if (!user) {
    return <NotLoggedInView onSignIn={() => {
      console.log('[Account] Sign in clicked - OAuth flow would start here');
      // TODO: Implement OAuth flow
    }} />;
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
      onSignOut={() => setUser(null)}
      onDeleteAccount={() => {
        if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
          console.log('[Account] Delete account clicked');
          setUser(null);
        }
      }}
    />;
  }

  if (subscription.type === 'active') {
    return <ActiveSubscriptionView
      user={user}
      subscription={subscription}
      onSignOut={() => setUser(null)}
      onDeleteAccount={() => {
        if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
          console.log('[Account] Delete account clicked');
          setUser(null);
        }
      }}
    />;
  }

  return null;
}

// Google Icon Component
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
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
          background: '#fafafa',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            marginBottom: '24px',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#000' }}>
            Get started with Mic2Text
          </h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px', lineHeight: '1.6' }}>
            Sign in with your Google account to start your 7-day free trial.<br/>
            No credit card required.
          </p>

          {/* Google Sign In Button */}
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
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s',
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
            Continue with Google
          </button>

          {/* Pricing */}
          <div style={{
            marginTop: '32px',
            paddingTop: '32px',
            borderTop: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px' }}>
              After trial
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#000' }}>
              $3<span style={{ fontSize: '16px', fontWeight: '400', color: '#666' }}>/month</span>
            </div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
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
      background: '#fafafa',
      borderRadius: '12px',
      border: '1px solid #e0e0e0',
      marginBottom: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        {/* Profile Picture */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: user.profilePicUrl ? `url(${user.profilePicUrl})` : '#007aff',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '20px',
          fontWeight: '600',
        }}>
          {!user.profilePicUrl && `${user.firstName[0]}${user.lastName[0]}`}
        </div>

        {/* User Info */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>
            {user.firstName} {user.lastName}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
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
            borderRadius: '8px',
            border: '1px solid #ddd',
            background: 'white',
            cursor: 'pointer',
            color: '#666',
          }}
        >
          Sign out
        </button>
        <button
          onClick={onDeleteAccount}
          style={{
            flex: 1,
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '8px',
            border: '1px solid #fee',
            background: '#fff5f5',
            cursor: 'pointer',
            color: '#dc2626',
          }}
        >
          Delete account
        </button>
      </div>
    </div>
  );
}

// Trial Active View
interface TrialActiveViewProps {
  user: UserAccount;
  daysRemaining: number;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

function TrialActiveView({ user, daysRemaining, onSignOut, onDeleteAccount }: TrialActiveViewProps) {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#000' }}>
        Account
      </h2>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
        {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in your trial
      </p>

      {/* Profile Section - Full Width */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '32px',
        paddingBottom: '24px',
        borderBottom: '1px solid #e0e0e0',
      }}>
        {/* Profile Picture */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: user.profilePicUrl ? `url(${user.profilePicUrl})` : '#007aff',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '20px',
          fontWeight: '600',
          flexShrink: 0,
        }}>
          {!user.profilePicUrl && `${user.firstName[0]}${user.lastName[0]}`}
        </div>

        {/* User Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>
            {user.firstName} {user.lastName}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {user.email}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={onSignOut}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: 'white',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            Sign out
          </button>
          <button
            onClick={onDeleteAccount}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '8px',
              border: '1px solid #fee',
              background: '#fff5f5',
              cursor: 'pointer',
              color: '#dc2626',
            }}
          >
            Delete account
          </button>
        </div>
      </div>

      {/* Trial Info */}
      <div style={{
        padding: '20px',
        background: '#fafafa',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        marginBottom: '16px',
      }}>
        <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '12px', color: '#000' }}>
          Trial Status
        </div>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
          You're currently on a <strong>7-day free trial</strong>. No payment method required.
          After your trial ends, subscribe for $3/month to continue using Mic2Text.
        </div>
      </div>

      {/* Subscribe Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => {
            console.log('[Account] Subscribe clicked');
            // TODO: Implement Stripe checkout
          }}
          style={{
            padding: '10px 20px',
            background: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Subscribe now
        </button>
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
        {/* Blocking Message */}
        <div style={{
          padding: '48px 32px',
          background: '#fafafa',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏰</div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: '#000' }}>
            Your trial has expired
          </h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px', lineHeight: '1.6' }}>
            Subscribe now to continue using Mic2Text.<br/>
            Your data is safe and will be restored when you subscribe.
          </p>

          {/* Subscribe Button */}
          <button
            onClick={onSubscribe}
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            }}
          >
            Subscribe for $3/month
          </button>

          {/* Cancel Info */}
          <div style={{ fontSize: '12px', color: '#999', marginTop: '20px' }}>
            Cancel anytime, no questions asked
          </div>
        </div>
      </div>
    </div>
  );
}

// Active Subscription View
interface ActiveSubscriptionViewProps {
  user: UserAccount;
  subscription: Extract<SubscriptionStatus, { type: 'active' }>;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

function ActiveSubscriptionView({ user, subscription, onSignOut, onDeleteAccount }: ActiveSubscriptionViewProps) {
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#000' }}>
        Account
      </h2>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
        Active subscription
      </p>

      {/* Profile Section - Full Width */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '32px',
        paddingBottom: '24px',
        borderBottom: '1px solid #e0e0e0',
      }}>
        {/* Profile Picture */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: user.profilePicUrl ? `url(${user.profilePicUrl})` : '#007aff',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '20px',
          fontWeight: '600',
          flexShrink: 0,
        }}>
          {!user.profilePicUrl && `${user.firstName[0]}${user.lastName[0]}`}
        </div>

        {/* User Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>
            {user.firstName} {user.lastName}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {user.email}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={onSignOut}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: 'white',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            Sign out
          </button>
          <button
            onClick={onDeleteAccount}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '8px',
              border: '1px solid #fee',
              background: '#fff5f5',
              cursor: 'pointer',
              color: '#dc2626',
            }}
          >
            Delete account
          </button>
        </div>
      </div>

      {/* Plans & Billing Section */}
      <div style={{
        padding: '20px',
        background: '#fafafa',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>
              {subscription.plan}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              $3/month • Billed monthly
            </div>
          </div>
          <div style={{
            padding: '4px 12px',
            background: '#d1fae5',
            color: '#065f46',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
          }}>
            Active
          </div>
        </div>

        <div style={{
          paddingTop: '16px',
          borderTop: '1px solid #e0e0e0',
          fontSize: '13px',
          color: '#666',
        }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Started:</strong> {formatDate(subscription.startDate)}
          </div>
          <div>
            <strong>Next billing date:</strong> {formatDate(subscription.nextBillingDate)}
          </div>
        </div>
      </div>

      {/* Manage Subscription Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => {
            console.log('[Account] Manage subscription clicked');
            // TODO: Open Stripe customer portal
          }}
          style={{
            padding: '10px 20px',
            background: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Manage subscription
        </button>
      </div>
    </div>
  );
}

// Feedback Section
function FeedbackSection() {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [feedbackType, setFeedbackType] = useState('general');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!feedback.trim()) {
      return;
    }

    console.log('[Feedback] Submitting feedback:', { feedback, email, feedbackType });
    // TODO: Send feedback to backend

    setSubmitted(true);
    setTimeout(() => {
      setFeedback('');
      setEmail('');
      setFeedbackType('general');
      setSubmitted(false);
    }, 2000);
  };

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#000' }}>
        Share Feedback
      </h2>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
        Help us improve Mic2Text by sharing your thoughts
      </p>

      {/* Feedback Form */}
      <div style={{
        padding: '24px',
        background: '#fafafa',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        marginBottom: '16px',
      }}>
        {/* Feedback Type Dropdown */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#000' }}>
            Type of feedback
          </label>
          <select
            value={feedbackType}
            onChange={(e) => setFeedbackType(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: 'white',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <option value="general">General Feedback</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="improvement">Improvement Suggestion</option>
          </select>
        </div>

        {/* Email Field (Optional) */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#000' }}>
            Email (optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: 'white',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Feedback Text Area */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#000' }}>
            Your feedback
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us what you think, report bugs, or suggest features..."
            style={{
              width: '100%',
              minHeight: '150px',
              padding: '12px',
              fontSize: '14px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: 'white',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleSubmit}
            disabled={!feedback.trim() || submitted}
            style={{
              padding: '10px 24px',
              background: submitted ? '#10b981' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: feedback.trim() && !submitted ? 'pointer' : 'not-allowed',
              opacity: !feedback.trim() ? 0.5 : 1,
            }}
          >
            {submitted ? '✓ Sent!' : 'Send feedback'}
          </button>
        </div>
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
