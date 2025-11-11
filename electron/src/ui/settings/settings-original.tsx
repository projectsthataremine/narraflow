/**
 * Settings App UI - Retro Desktop OS Theme
 * ~900px wide window with sidebar navigation
 */

import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { MONTHLY_PRICE } from '../main/constants';
import '@radix-ui/themes/styles.css';
import { Theme, Select, Switch, Button, Flex, Box, Text, Tooltip, IconButton, Badge, Code } from '@radix-ui/themes';
import * as RadixToast from '@radix-ui/react-toast';
import { Copy, Plus, RefreshCw, Key, Link, Unlink } from 'lucide-react';

// CSS Variables (Dark Mode Only)
const CSS_VARS = `
:root[data-theme="dark"],
:root {
  --bg-primary: #18191b;
  --bg-secondary: #111113;
  --bg-tertiary: #212225;
  --sidebar-bg: #111113;
  --accent-primary: #0090ff;
  --accent-hover: #3b9eff;
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --text-tertiary: #636366;
  --border-light: #282828;
  --border-medium: #48484a;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.5);
  --font-system: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: var(--font-system);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}


/* Custom slider styles */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: var(--border-light);
  height: 4px;
  border-radius: 2px;
  outline: none;
}

input[type="range"]::-webkit-slider-track {
  background: var(--border-light);
  height: 4px;
  border-radius: 2px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--accent-primary);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  background: var(--accent-hover);
  box-shadow: var(--shadow-md);
}

input[type="range"]::-moz-range-track {
  background: var(--border-light);
  height: 4px;
  border-radius: 2px;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--accent-primary);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

input[type="range"]::-moz-range-thumb:hover {
  background: var(--accent-hover);
  box-shadow: var(--shadow-md);
}

/* Checkbox accent color */
input[type="checkbox"]:checked {
  accent-color: var(--accent-primary);
}

/* Color picker styles */
input[type="color"] {
  -webkit-appearance: none;
  appearance: none;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

input[type="color"]:hover {
  border-color: var(--border-medium);
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

input[type="color"]::-moz-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

/* Custom scrollbar styles - macOS native style */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

/* Light mode scrollbar */
:root[data-theme="light"] ::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

:root[data-theme="light"] ::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
  background-clip: padding-box;
}

/* Dark mode scrollbar */
:root[data-theme="dark"] ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

:root[data-theme="dark"] ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
  background-clip: padding-box;
}

::-webkit-scrollbar-corner {
  background: transparent;
}

/* Radix UI Toast styles */
[data-radix-toast-viewport] {
  position: fixed;
  bottom: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 10px;
  max-width: 100vw;
  margin: 0;
  list-style: none;
  z-index: 2147483647;
  outline: none;
}

[data-radix-toast-root] {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 15px;
  display: grid;
  grid-template-areas: "title action" "description action";
  grid-template-columns: auto max-content;
  column-gap: 15px;
  align-items: center;
}

[data-radix-toast-root][data-state="open"] {
  animation: slideIn 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

[data-radix-toast-root][data-state="closed"] {
  animation: hide 100ms ease-in;
}

@keyframes slideIn {
  from {
    transform: translateX(calc(100% + 24px));
  }
  to {
    transform: translateX(0);
  }
}

@keyframes hide {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
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

// NarraFlow Logo for title bar
const NarraFlowLogo = () => (
  <svg width="140" height="32" viewBox="0 0 140 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0" y1="0" x2="140" y2="0">
        <stop offset="0%" stopColor="#0090ff"/>
        <stop offset="100%" stopColor="#0070dd"/>
      </linearGradient>
    </defs>
    {/* Vertical bars */}
    <rect x="0" y="13" width="3" height="6" rx="1.5" fill="url(#logoGradient)"/>
    <rect x="5" y="10" width="3" height="12" rx="1.5" fill="url(#logoGradient)"/>
    <rect x="10" y="7" width="3" height="18" rx="1.5" fill="url(#logoGradient)"/>
    <rect x="15" y="4" width="3" height="24" rx="1.5" fill="url(#logoGradient)"/>
    <rect x="20" y="7" width="3" height="18" rx="1.5" fill="url(#logoGradient)"/>
    <rect x="25" y="10" width="3" height="12" rx="1.5" fill="url(#logoGradient)"/>
    <rect x="30" y="13" width="3" height="6" rx="1.5" fill="url(#logoGradient)"/>
    {/* Text: NarraFlow */}
    <text x="40" y="24" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif" fontSize="20" fontWeight="700" fill="#ffffff">NarraFlow</text>
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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const CheckmarkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const BarChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const LayersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease',
    }}
  >
    <polyline points="6 9 12 15 18 9" />
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
    numBars: 11,
    barWidth: 3,
    barGap: 2,
    maxHeight: 11,
    borderRadius: 40,
    glowIntensity: 0,
    color1: '#0090ff',
    color2: '#0090ff',
    useGradient: false,
    hasBackground: false,
    backgroundShape: 'pill',
    backgroundColor: '#18191b',
    backgroundPaddingX: 12,
    backgroundPaddingY: 12,
    borderWidth: 0,
    borderColor: '#0090ff',
  });
  const [hotkeyConfig, setHotkeyConfig] = useState<HotkeyConfig>({
    modifiers: ['Shift', 'Alt'],
    key: 'Shift',
    keycode: 42,
  });

  // Always use dark theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

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
    <Theme appearance="dark" accentColor="blue" grayColor="slate" radius="medium" scaling="100%">
      <style>{CSS_VARS}</style>
      <div style={{
        width: '100%',
        height: '100vh',
        background: '#000000',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-system)',
        color: 'var(--text-primary)',
      }}>
        {/* Custom Title Bar - Draggable */}
        <div style={{
          height: '52px',
          background: '#000000',
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
          <Box style={{
            width: '240px',
            background: '#000000',
            padding: '32px 16px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* App Logo */}
            <div style={{ marginBottom: '24px' }}>
              <NarraFlowLogo />
            </div>

            {/* Navigation */}
            <Flex direction="column" gap="1">
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
            </Flex>

            {/* Version Footer */}
            <VersionFooter />
          </Box>

          {/* Content Area */}
          <div style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
            background: '#000000',
          }}>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              minHeight: '100%',
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
      </div>
    </Theme>
  );
}

// Version Footer Component
function VersionFooter() {
  return (
    <div style={{
      marginTop: 'auto',
      paddingTop: '16px',
    }}>
      <div style={{
        fontSize: '13px',
        color: 'var(--text-primary)',
        opacity: 0.5,
      }}>
        v0.1.0
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
    <Box
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px 12px',
        borderRadius: 'var(--radius-3)',
        background: active ? '#0f0f0f' : hovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: active ? '500' : '400',
        color: active ? 'var(--accent-9)' : 'var(--gray-11)',
        transition: 'all 0.15s ease',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', color: active ? 'var(--accent-9)' : 'var(--gray-10)' }}>{icon}</span>
      <span>{label}</span>
    </Box>
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
      {/* Keyboard Shortcuts */}
      <Flex justify="between" align="center" mb="5">
        <Text size="3" weight="medium">
          Keyboard shortcuts
        </Text>
        <Box style={{ width: '200px' }}>
          <Select.Root
            value={currentHotkeyLabel}
            onValueChange={(value) => {
              const option = HOTKEY_OPTIONS.find(opt => opt.label === value);
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
          >
            <Select.Trigger style={{ width: '100%' }} />
            <Select.Content>
              {HOTKEY_OPTIONS.map((option) => (
                <Select.Item key={option.label} value={option.label}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Box>
      </Flex>

      {/* Microphone */}
      <Flex justify="between" align="center" mb="5">
        <Text size="3" weight="medium">
          Microphone
        </Text>
        <Box style={{ width: '200px' }}>
          <Select.Root
            value={selectedMicrophone}
            onValueChange={(value) => {
              setSelectedMicrophone(value);
              // TODO: Save to settings and update audio capture
              console.log('[Settings] Microphone changed to:', value);
            }}
          >
            <Select.Trigger style={{ width: '100%' }} />
            <Select.Content>
              {availableMicrophones.length === 0 ? (
                <Select.Item value="default">Loading microphones...</Select.Item>
              ) : (
                availableMicrophones.map((device, index) => (
                  <Select.Item key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${index + 1}`}
                    {index === 0 ? ' (recommended)' : ''}
                  </Select.Item>
                ))
              )}
            </Select.Content>
          </Select.Root>
        </Box>
      </Flex>

      {/* Show app in dock */}
      <Flex justify="between" align="center" mb="5">
        <Text size="3" weight="medium">
          Show app in dock
        </Text>
        <Switch
          checked={showInDock}
          onCheckedChange={handleDockVisibilityChange}
        />
      </Flex>

      {/* Reset app */}
      <Flex justify="between" align="center" mb="5">
        <Text size="3" weight="medium">
          Reset app
        </Text>
        <Button
          variant="outline"
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
        >
          Reset & restart
        </Button>
      </Flex>
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
  const [openSection, setOpenSection] = useState<'bars' | 'background' | null>('bars');
  const [paddingLinked, setPaddingLinked] = useState(true);

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
      ...pillConfig,
      numBars: randomInt(5, 15),
      barWidth: randomInt(5, 20),
      barGap: randomInt(2, 10),
      maxHeight: randomInt(15, 70),
      borderRadius: randomInt(0, 10),
      glowIntensity: randomInt(0, 20),
      color1: randomColor[0],
      color2: randomColor[1],
    });
  };

  return (
    <div>
      {/* Header with Randomize button */}
      <Flex justify="between" align="center" mb="5">
        <Text size="5" weight="bold">Customize Recording Pill</Text>
        <Button
          onClick={handleRandomize}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
          }}
        >
          <ShuffleIcon />
          <Text size="2" weight="medium">Randomize</Text>
        </Button>
      </Flex>

      {/* Accordion Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>

        {/* Bar Animation Section */}
        <div style={{
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
        }}>
          {/* Accordion Header */}
          <button
            onClick={() => setOpenSection(openSection === 'bars' ? null : 'bars')}
            style={{
              width: '100%',
              padding: '16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--text-primary)',
            }}
          >
            {/* Icon Badge */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <BarChartIcon />
            </div>

            {/* Title and Subtitle */}
            <div style={{ flex: 1, textAlign: 'left' }}>
              <Text size="3" weight="bold" style={{ display: 'block' }}>Bar Animation</Text>
              <Text size="2" style={{ color: 'var(--text-secondary)', display: 'block' }}>
                Customize bar appearance and behavior
              </Text>
            </div>

            {/* Chevron */}
            <ChevronIcon isOpen={openSection === 'bars'} />
          </button>

          {/* Accordion Content */}
          {openSection === 'bars' && (
            <div style={{
              padding: '0 16px 16px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {/* Number of Bars */}
              <Flex align="center" gap="4" justify="between">
                <Text size="3" style={{ minWidth: '120px' }}>Number of Bars</Text>
                <input
                  type="range"
                  min="5"
                  max="15"
                  value={pillConfig.numBars}
                  onChange={(e) => setPillConfig({ ...pillConfig, numBars: parseInt(e.target.value) })}
                  style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                />
                <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{pillConfig.numBars}</Text>
              </Flex>

              {/* Bar Width */}
              <Flex align="center" gap="4" justify="between">
                <Text size="3" style={{ minWidth: '120px' }}>Bar Width</Text>
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={pillConfig.barWidth}
                  onChange={(e) => setPillConfig({ ...pillConfig, barWidth: parseInt(e.target.value) })}
                  style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                />
                <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{pillConfig.barWidth}px</Text>
              </Flex>

              {/* Bar Gap */}
              <Flex align="center" gap="4" justify="between">
                <Text size="3" style={{ minWidth: '120px' }}>Bar Gap</Text>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={pillConfig.barGap}
                  onChange={(e) => setPillConfig({ ...pillConfig, barGap: parseInt(e.target.value) })}
                  style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                />
                <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{pillConfig.barGap}px</Text>
              </Flex>

              {/* Max Height */}
              <Flex align="center" gap="4" justify="between">
                <Text size="3" style={{ minWidth: '120px' }}>Max Height</Text>
                <input
                  type="range"
                  min="8"
                  max="70"
                  value={pillConfig.maxHeight}
                  onChange={(e) => setPillConfig({ ...pillConfig, maxHeight: parseInt(e.target.value) })}
                  style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                />
                <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{pillConfig.maxHeight}px</Text>
              </Flex>

              {/* Border Radius */}
              <Flex align="center" gap="4" justify="between">
                <Text size="3" style={{ minWidth: '120px' }}>Border Radius</Text>
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
                  style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                />
                <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{Math.round((pillConfig.borderRadius / 10) * 100)}%</Text>
              </Flex>

              {/* Glow Intensity */}
              <Flex align="center" gap="4" justify="between">
                <Text size="3" style={{ minWidth: '120px' }}>Glow Intensity</Text>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={pillConfig.glowIntensity}
                  onChange={(e) => setPillConfig({ ...pillConfig, glowIntensity: parseInt(e.target.value) })}
                  style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                />
                <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{pillConfig.glowIntensity}</Text>
              </Flex>

              {/* Use Gradient with Colors */}
              <Flex justify="between" align="center" mt="2">
                <Flex align="center" gap="2">
                  <Text size="3">Use Gradient</Text>
                  <Switch
                    checked={pillConfig.useGradient}
                    onCheckedChange={(checked) => setPillConfig({ ...pillConfig, useGradient: checked })}
                  />
                </Flex>

                {/* Colors on the right */}
                <Flex gap="3" align="center">
                  <input
                    type="color"
                    value={pillConfig.color1}
                    onChange={(e) => setPillConfig({ ...pillConfig, color1: e.target.value })}
                    style={{
                      width: '20px',
                      height: '20px',
                      border: '1px solid var(--border-light)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  />
                  {pillConfig.useGradient && (
                    <input
                      type="color"
                      value={pillConfig.color2}
                      onChange={(e) => setPillConfig({ ...pillConfig, color2: e.target.value })}
                      style={{
                        width: '20px',
                        height: '20px',
                        border: '1px solid var(--border-light)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                  )}
                </Flex>
              </Flex>
            </div>
          )}
        </div>

        {/* Background Section */}
        <div style={{
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
        }}>
          {/* Accordion Header */}
          <button
            onClick={() => setOpenSection(openSection === 'background' ? null : 'background')}
            style={{
              width: '100%',
              padding: '16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--text-primary)',
            }}
          >
            {/* Icon Badge */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <LayersIcon />
            </div>

            {/* Title and Subtitle */}
            <div style={{ flex: 1, textAlign: 'left' }}>
              <Flex align="center" gap="2">
                <Text size="3" weight="bold">Background</Text>
                <Badge color={pillConfig.hasBackground ? "green" : "gray"} size="1">
                  {pillConfig.hasBackground ? "ON" : "OFF"}
                </Badge>
              </Flex>
              <Text size="2" style={{ color: 'var(--text-secondary)', display: 'block' }}>
                Add background container with borders
              </Text>
            </div>

            {/* Chevron */}
            <ChevronIcon isOpen={openSection === 'background'} />
          </button>

          {/* Accordion Content */}
          {openSection === 'background' && (
            <div style={{
              padding: '0 16px 16px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {/* Enable Background Toggle */}
              <Flex justify="between" align="center">
                <Text size="3">Enable Background</Text>
                <Switch
                  checked={pillConfig.hasBackground}
                  onCheckedChange={(checked) => setPillConfig({ ...pillConfig, hasBackground: checked })}
                />
              </Flex>

              {pillConfig.hasBackground && (
                <>
                  {/* Background Shape Selector */}
                  <div>
                    <Text size="3" style={{ display: 'block', marginBottom: '8px' }}>Shape</Text>
                    <Flex gap="2">
                      <Button
                        variant={pillConfig.backgroundShape === 'pill' ? 'solid' : 'outline'}
                        onClick={() => setPillConfig({ ...pillConfig, backgroundShape: 'pill' })}
                        style={{ flex: 1 }}
                      >
                        Pill
                      </Button>
                      <Button
                        variant={pillConfig.backgroundShape === 'rectangle' ? 'solid' : 'outline'}
                        onClick={() => setPillConfig({ ...pillConfig, backgroundShape: 'rectangle' })}
                        style={{ flex: 1 }}
                      >
                        Rectangle
                      </Button>
                    </Flex>
                  </div>

                  {/* Background Color */}
                  <Flex align="center" gap="3" justify="between">
                    <Text size="3">Background Color</Text>
                    <input
                      type="color"
                      value={pillConfig.backgroundColor}
                      onChange={(e) => setPillConfig({ ...pillConfig, backgroundColor: e.target.value })}
                      style={{
                        width: '24px',
                        height: '24px',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    />
                  </Flex>

                  {/* Background Padding X and Y */}
                  <Flex direction="column" gap="2">
                    {/* Padding X */}
                    <Flex align="center" gap="4" justify="between">
                      <Text size="3" style={{ minWidth: '120px' }}>Padding X</Text>
                      <input
                        type="range"
                        min="4"
                        max="24"
                        value={pillConfig.backgroundPaddingX ?? 12}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value);
                          if (paddingLinked) {
                            setPillConfig({
                              ...pillConfig,
                              backgroundPaddingX: newValue,
                              backgroundPaddingY: newValue
                            });
                          } else {
                            setPillConfig({ ...pillConfig, backgroundPaddingX: newValue });
                          }
                        }}
                        style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                      />
                      <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{pillConfig.backgroundPaddingX ?? 12}px</Text>
                    </Flex>

                    {/* Link Button */}
                    <Flex align="center" pl="2">
                      <IconButton
                        size="1"
                        variant={paddingLinked ? 'solid' : 'soft'}
                        color={paddingLinked ? 'blue' : 'gray'}
                        onClick={() => {
                          if (!paddingLinked) {
                            // When linking, sync Y to match X
                            setPillConfig({
                              ...pillConfig,
                              backgroundPaddingY: pillConfig.backgroundPaddingX ?? 12
                            });
                          }
                          setPaddingLinked(!paddingLinked);
                        }}
                        style={{ cursor: 'pointer' }}
                        title={paddingLinked ? 'Unlink padding values' : 'Link padding values'}
                      >
                        {paddingLinked ? <Link size={14} /> : <Unlink size={14} />}
                      </IconButton>
                    </Flex>

                    {/* Padding Y */}
                    <Flex align="center" gap="4" justify="between">
                      <Text size="3" style={{ minWidth: '120px' }}>Padding Y</Text>
                      <input
                        type="range"
                        min="4"
                        max="24"
                        value={pillConfig.backgroundPaddingY ?? 12}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value);
                          if (paddingLinked) {
                            setPillConfig({
                              ...pillConfig,
                              backgroundPaddingX: newValue,
                              backgroundPaddingY: newValue
                            });
                          } else {
                            setPillConfig({ ...pillConfig, backgroundPaddingY: newValue });
                          }
                        }}
                        style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                      />
                      <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{pillConfig.backgroundPaddingY ?? 12}px</Text>
                    </Flex>
                  </Flex>

                  {/* Border Width */}
                  <Flex align="center" gap="4" justify="between">
                    <Text size="3" style={{ minWidth: '120px' }}>Border Width</Text>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      value={pillConfig.borderWidth}
                      onChange={(e) => setPillConfig({ ...pillConfig, borderWidth: parseInt(e.target.value) })}
                      style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                    />
                    <Text size="3" weight="medium" style={{ minWidth: '40px', textAlign: 'right' }}>{pillConfig.borderWidth}px</Text>
                  </Flex>

                  {/* Border Color (only if borderWidth > 0) */}
                  {pillConfig.borderWidth > 0 && (
                    <Flex align="center" gap="3" justify="between">
                      <Text size="3">Border Color</Text>
                      <input
                        type="color"
                        value={pillConfig.borderColor}
                        onChange={(e) => setPillConfig({ ...pillConfig, borderColor: e.target.value })}
                        style={{
                          width: '24px',
                          height: '24px',
                          border: '1px solid var(--border-light)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      />
                    </Flex>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live Preview */}
      <Box position="relative" mt="4">
        {/* Dark/Light Mode Toggle */}
        <Box style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 10,
        }}>
          <Button
            variant="outline"
            onClick={() => setPreviewDarkMode(!previewDarkMode)}
            style={{
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {previewDarkMode ? <SunIcon /> : <MoonIcon />}
          </Button>
        </Box>

        <Box style={{
          padding: '40px',
          background: previewDarkMode ? 'var(--bg-secondary)' : '#f5f5f5',
          border: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          borderRadius: 'var(--radius-3)',
        }}>
          <PillPreview config={pillConfig} />
        </Box>
      </Box>
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

  const barsContent = (
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

  // If background is enabled, wrap the bars in a container
  if (config.hasBackground) {
    return (
      <div style={{
        background: config.backgroundColor,
        padding: `${config.backgroundPaddingY ?? 12}px ${config.backgroundPaddingX ?? 12}px`,
        borderRadius: config.backgroundShape === 'pill' ? '999px' : '8px',
        border: config.borderWidth > 0
          ? `${config.borderWidth}px solid ${config.borderColor}`
          : 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {barsContent}
      </div>
    );
  }

  // Otherwise, return just the bars
  return barsContent;
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
      background: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      padding: '12px 20px',
      border: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: 10000,
      opacity: visible ? 1 : 0,
      transition: 'all 0.3s ease-in-out',
      pointerEvents: 'none',
      fontFamily: 'var(--font-system)',
    }}>
      <div style={{
        width: '18px',
        height: '18px',
        background: 'var(--accent-primary)',
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
      {history.length === 0 ? (
        <Box style={{
          padding: '64px 32px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <Text size="4" weight="medium" mb="2">
            No history yet
          </Text>
          <Text size="3" color="gray">
            Your transcriptions will appear here
          </Text>
        </Box>
      ) : (
        <div>
          {Object.entries(groupedHistory).map(([dateLabel, items], groupIndex) => (
            <div key={dateLabel} style={{ marginBottom: groupIndex < Object.keys(groupedHistory).length - 1 ? '32px' : '0' }}>
              <Text size="1" weight="bold" mb="3" style={{
                color: 'var(--accent-9)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {dateLabel}
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {items.map((item, index) => (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  padding: '20px 0',
                  borderBottom: index < items.length - 1 ? '1px solid var(--border-light)' : 'none',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  opacity: 0.7,
                  minWidth: '80px',
                  fontFamily: 'var(--font-system)',
                }}>
                  {new Date(item.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '15px',
                    color: 'var(--text-primary)',
                    lineHeight: '1.5',
                    wordBreak: 'break-word',
                  }}>
                    {item.text}
                  </div>
                </div>
                <Flex
                  gap="3"
                  style={{
                    flexShrink: 0,
                    opacity: hoveredItem === item.id ? 1 : 0,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <Tooltip content="Copy transcript">
                    <IconButton
                      onClick={() => handleCopy(item.text)}
                      size="2"
                      variant="ghost"
                    >
                      <CopyIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip content="Delete transcript">
                    <IconButton
                      onClick={() => handleDelete(item.id)}
                      size="2"
                      variant="ghost"
                      color="red"
                    >
                      <TrashIcon />
                    </IconButton>
                  </Tooltip>
                </Flex>
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      const marketingSiteUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://trynarraflow.com';
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

  const handleRefreshLicenses = async () => {
    setIsRefreshing(true);
    if (user) {
      await fetchLicenses(user.id);
    }
    setIsRefreshing(false);
  };

  const handleAddLicense = () => {
    // Open marketing site to purchase
    const marketingSiteUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://trynarraflow.com';
    if (window.electron) {
      (window.electron as any).invoke('OPEN_EXTERNAL_URL', { url: marketingSiteUrl });
    } else {
      window.open(marketingSiteUrl, '_blank');
    }
  };

  const handleManageSubscription = async (stripeCustomerId: string) => {
    try {
      console.log('[Account] Opening customer portal for:', stripeCustomerId);
      if (window.electron) {
        const result = await (window.electron as any).invoke('OPEN_CUSTOMER_PORTAL', { stripeCustomerId });
        console.log('[Account] Customer portal result:', result);
        if (!result.success) {
          console.error('[Account] Customer portal failed:', result.error);
          alert(`Failed: ${result.error}`);
        }
      }
    } catch (error) {
      console.error("[Account] Customer portal error:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to open customer portal'}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '400px' }}>
        <Text size="3" color="gray">Loading...</Text>
      </Flex>
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

  // Determine if trial is expired
  const trialExpired = subscription.type === 'trial_expired';

  // For all logged-in users, show the unified account view
  return <UnifiedAccountView
    user={user}
    allLicenses={licenses}
    onUseLicense={handleUseLicense}
    onRevokeLicense={handleRevokeLicense}
    onManageSubscription={handleManageSubscription}
    onRenameMachine={handleRenameMachine}
    onRefreshLicenses={handleRefreshLicenses}
    onAddLicense={handleAddLicense}
    activatingLicense={activatingLicense}
    revokingLicense={revokingLicense}
    isRefreshing={isRefreshing}
    currentMachineId={currentMachineId}
    onSignOut={handleSignOut}
    onDeleteAccount={handleDeleteAccount}
    trialExpired={trialExpired}
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
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-system)', color: 'var(--text-primary)', opacity: 0.7, marginBottom: '8px' }}>
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
                      border: '1px solid var(--accent-primary)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontFamily: 'var(--font-system)',
                    }}
                  />
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                    {license.metadata.machine_name}
                  </div>
                  <IconButton
                    onClick={() => setIsEditing(true)}
                    size="1"
                    variant="ghost"
                    style={{
                      opacity: isHovered ? 0.7 : 0,
                      visibility: isHovered ? 'visible' : 'hidden',
                      transition: 'opacity 0.2s, visibility 0.2s',
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', opacity: 0.7 }}>
              Not activated on any machine
            </div>
          )}
        </div>
        <div style={{
          padding: '4px 12px',
          background: license.status === 'active' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
          color: 'var(--bg-primary)',
          fontSize: '12px',
          fontWeight: '500',
        }}>
          {license.status === 'pending' ? 'Trial' : 'Active'}
        </div>
      </div>

      {/* Billing info */}
      {license.renews_at && (
        <div style={{ fontSize: '13px', color: 'var(--text-primary)', opacity: 0.7, marginTop: '12px' }}>
          Next billing: {new Date(license.renews_at).toLocaleDateString()} • ${MONTHLY_PRICE}/month
        </div>
      )}

      {/* Show "Use on this machine" if not activated on any machine */}
      {!license.metadata?.machine_id && (
        <Box mt="2">
          <Button
            onClick={() => onUseLicense(license.key)}
            disabled={activatingLicense === license.key}
            size="2"
            variant="solid"
          >
            {activatingLicense === license.key ? 'Activating...' : 'Use on this machine'}
          </Button>
        </Box>
      )}
      {/* Action buttons */}
      <Flex gap="2" mt="3" wrap="wrap">
        {/* Show "Revoke from this machine" if activated on THIS machine */}
        {isActiveOnThisMachine && (
          <Button
            onClick={() => onRevokeLicense(license.key)}
            disabled={revokingLicense === license.key}
            size="2"
            variant="solid"
            color="red"
          >
            {revokingLicense === license.key ? 'Revoking...' : 'Revoke from this machine'}
          </Button>
        )}

        {/* Cancel subscription button */}
        {onCancelLicense && license.stripe_customer_id && (
          <Button
            onClick={() => onCancelLicense(license.key)}
            disabled={cancelingLicense === license.key}
            size="2"
            variant="outline"
          >
            {cancelingLicense === license.key
              ? (license.status === 'canceled' ? 'Processing...' : 'Canceling...')
              : (license.status === 'canceled' ? 'Undo cancel' : 'Cancel subscription')}
          </Button>
        )}
      </Flex>
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
    <Flex align="center" justify="center" style={{ minHeight: '100%' }}>
      <Box style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
        <Box mb="4" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          border: '2px solid var(--accent-9)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Box>
        <Text size="5" weight="bold" mb="2" as="div">
          Get started with NarraFlow
        </Text>
        <Text size="3" color="gray" mb="6" as="div" style={{ lineHeight: '1.6' }}>
          Sign in with your Google account to start your 7-day free trial.<br/>
          No credit card required.
        </Text>

        {/* Google Sign In Button - matching marketing site */}
        <Button
          size="3"
          onClick={onSignIn}
          style={{
            background: 'white',
            color: '#000',
            border: '1px solid #ddd',
            fontFamily: 'Roboto, sans-serif',
            cursor: 'pointer',
          }}
        >
          <GoogleIcon />
          Sign in with Google
        </Button>

          {/* Pricing */}
          <Box style={{
            marginTop: '32px',
            paddingTop: '32px',
            borderTop: '1px solid var(--border-light)',
          }}>
            <Text size="2" color="gray" mb="2">
              After trial
            </Text>
            <Text size="7" weight="bold" style={{ color: 'var(--accent-9)' }}>
              ${MONTHLY_PRICE}<Text as="span" size="4" weight="regular" color="gray">/month</Text>
            </Text>
            <Text size="2" color="gray" mt="2">
              Cancel anytime
            </Text>
          </Box>
      </Box>
    </Flex>
  );
}

// Profile Card Component (Reusable)
interface ProfileCardProps {
  user: UserAccount;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

function ProfileCard({ user, onSignOut, onDeleteAccount }: ProfileCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const avatarUrl = user.profilePicUrl;

  // Fallback avatar
  const fallbackAvatar = (
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--accent-9) 0%, var(--accent-10) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontWeight: '600',
      fontSize: '20px',
    }}>
      {user.email?.[0]?.toUpperCase()}
    </div>
  );

  return (
    <Flex align="center" gap="3" mb="4">
      {/* Profile Picture */}
      {avatarUrl && !imageError ? (
        <>
          <img
            src={avatarUrl}
            alt="Profile"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover',
              display: imageLoaded ? 'block' : 'none',
            }}
          />
          {!imageLoaded && fallbackAvatar}
        </>
      ) : (
        fallbackAvatar
      )}

      {/* User Info */}
      <Flex direction="column">
        <Text size="3" weight="bold">
          {user.email}
        </Text>
        <Text size="1" style={{ opacity: 0.7 }}>
          Created {new Date(user.id).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </Text>
      </Flex>
    </Flex>
  );
}

// Unified Account View (combines Trial and Active subscription views)
interface UnifiedAccountViewProps {
  user: UserAccount;
  allLicenses: License[];
  onUseLicense: (licenseKey: string) => void;
  onRevokeLicense: (licenseKey: string) => void;
  onManageSubscription: (stripeCustomerId: string) => void;
  onRenameMachine: (licenseId: string, newName: string) => void;
  onRefreshLicenses: () => void;
  onAddLicense: () => void;
  activatingLicense: string | null;
  revokingLicense: string | null;
  isRefreshing: boolean;
  currentMachineId: string | null;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  trialExpired: boolean;
}

function UnifiedAccountView({ user, allLicenses, onUseLicense, onRevokeLicense, onManageSubscription, onRenameMachine, onRefreshLicenses, onAddLicense, activatingLicense, revokingLicense, isRefreshing, currentMachineId, onSignOut, onDeleteAccount, trialExpired }: UnifiedAccountViewProps) {
  const [editingLicense, setEditingLicense] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [hoveredLicense, setHoveredLicense] = useState<string | null>(null);

  // Filter licenses for display: Show active, pending, and valid canceled licenses
  const now = new Date();
  const displayLicenses = allLicenses.filter(license => {
    // Exclude revoked and expired licenses
    if (license.status === 'revoked' || license.status === 'expired') {
      return false;
    }

    // Keep active and pending licenses
    if (license.status === 'active' || license.status === 'pending') {
      return true;
    }

    // For canceled licenses, only show if not expired yet
    if (license.status === 'canceled' && license.expires_at) {
      const expiresAt = new Date(license.expires_at);
      return expiresAt > now;
    }

    // Default: don't show
    return false;
  });

  // Check if user has EVER had any license (even if canceled/expired)
  const hasEverHadLicense = allLicenses.length > 0;

  // Check if user has any licenses to display
  const hasLicenses = displayLicenses.length > 0;

  return (
    <div>
      {/* Profile Card */}
      <ProfileCard user={user} onSignOut={onSignOut} onDeleteAccount={onDeleteAccount} />

      {/* Trial Expired Banner - Only show if trial expired AND user has never purchased */}
      {trialExpired && !hasEverHadLicense && (
        <Flex
          p="3"
          mb="4"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
          }}
        >
          <Text size="3" weight="bold" style={{ color: 'var(--red-11)' }}>
            Your trial has ended
          </Text>
        </Flex>
      )}

      {/* Licenses Section Header */}
      <Flex justify="between" align="center" mb="3">
        <Text size="2" weight="bold" style={{ opacity: 0.7 }}>
          LICENSES
        </Text>
        <Flex gap="2">
          <Button
            size="1"
            variant="soft"
            style={{ cursor: 'pointer', padding: '0 8px' }}
            onClick={onAddLicense}
          >
            <Plus size={16} />
          </Button>
          <Button
            size="1"
            variant="soft"
            color="gray"
            style={{ cursor: 'pointer', padding: '0 8px' }}
            onClick={onRefreshLicenses}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </Button>
        </Flex>
      </Flex>

      {/* Licenses List */}
      {hasLicenses ? (
        <Flex direction="column" gap="3">
          {displayLicenses.map((license) => (
            <LicenseCard
              key={license.id}
              license={license}
              currentMachineId={currentMachineId}
              onCopyKey={(key) => {
                navigator.clipboard.writeText(key);
              }}
              onActivate={onUseLicense}
              onRevoke={onRevokeLicense}
              onRenameMachine={onRenameMachine}
              onManageSubscription={onManageSubscription}
              activating={activatingLicense === license.key}
              revoking={revokingLicense === license.key}
              editing={editingLicense === license.id}
              setEditing={setEditingLicense}
              editedName={editedName}
              setEditedName={setEditedName}
              hovered={hoveredLicense === license.id}
              setHovered={setHoveredLicense}
            />
          ))}
        </Flex>
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap="3"
          p="6"
          style={{ background: 'var(--gray-a2)', borderRadius: '8px' }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Key size={24} style={{ opacity: 0.5 }} />
          </div>
          <Text size="2" style={{ opacity: 0.7, textAlign: 'center' }}>
            No licenses yet. Add a license to activate NarraFlow on this device.
          </Text>
          <Button size="2" onClick={onAddLicense}>
            <Plus size={14} />
            Purchase License
          </Button>
        </Flex>
      )}
    </div>
  );
}

// Keep old views as aliases for backwards compatibility
const TrialActiveView = UnifiedAccountView;
const ActiveSubscriptionView = UnifiedAccountView;

// LicenseCard Component (matching Clipp's design)
interface LicenseCardProps {
  license: License;
  currentMachineId: string | null;
  onCopyKey: (key: string) => void;
  onActivate: (key: string) => void;
  onRevoke: (key: string) => void;
  onRenameMachine: (licenseId: string, newName: string) => void;
  onManageSubscription: (stripeCustomerId: string) => void;
  activating: boolean;
  revoking: boolean;
  editing: boolean;
  setEditing: (id: string | null) => void;
  editedName: string;
  setEditedName: (name: string) => void;
  hovered: boolean;
  setHovered: (id: string | null) => void;
}

function LicenseCard({
  license,
  currentMachineId,
  onCopyKey,
  onActivate,
  onRevoke,
  onRenameMachine,
  onManageSubscription,
  activating,
  revoking,
  editing,
  setEditing,
  editedName,
  setEditedName,
  hovered,
  setHovered,
}: LicenseCardProps) {
  const machineId = license.metadata?.machine_id || license.machine_id;
  const machineName = license.metadata?.machine_name || license.machine_name;
  const isActiveOnThisMachine = currentMachineId && machineId && machineId === currentMachineId;

  const handleSave = () => {
    if (editedName.trim() && editedName !== machineName) {
      onRenameMachine(license.id, editedName.trim());
    }
    setEditing(null);
  };

  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--gray-a2)',
        border: '1px solid var(--gray-a6)',
        borderRadius: '8px',
      }}
    >
      {/* License Key Row */}
      <Flex align="center" gap="2" mb="3">
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--accent-a3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Key size={16} style={{ color: 'var(--accent-11)' }} />
        </div>
        <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
          <Text size="1" style={{ opacity: 0.7, marginBottom: '4px' }}>
            License Key
          </Text>
          <Text size="1" style={{ fontFamily: 'monospace', fontSize: '11px', opacity: 0.9 }}>
            {license.key.slice(0, 20)}...
          </Text>
        </Flex>
        <IconButton
          onClick={() => onCopyKey(license.key)}
          size="1"
          variant="soft"
          style={{ cursor: 'pointer' }}
        >
          <Copy size={14} />
        </IconButton>
      </Flex>

      {/* Status Badge */}
      <Flex align="center" gap="2" mb="3">
        <Badge
          color={
            license.status === "active" ? "blue" :
            license.status === "canceled" ? "red" :
            "yellow"
          }
          size="1"
        >
          {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
        </Badge>
        {license.status === "canceled" && license.expires_at && (
          <Text size="1" style={{ opacity: 0.7 }}>
            Expires {new Date(license.expires_at).toLocaleDateString()}
          </Text>
        )}
        {license.status === "active" && license.renews_at && (
          <Text size="1" style={{ opacity: 0.7 }}>
            Renews {new Date(license.renews_at).toLocaleDateString()}
          </Text>
        )}
      </Flex>

      {/* Machine Info */}
      {machineId && (
        <div
          onMouseEnter={() => setHovered(license.id)}
          onMouseLeave={() => setHovered(null)}
          style={{ marginBottom: '12px' }}
        >
          <Text size="1" style={{ opacity: 0.7, marginBottom: '4px', display: 'block' }}>
            Machine Name
          </Text>
          <Flex
            justify="between"
            align="center"
            gap="2"
            style={{
              background: editing ? 'var(--accent-a3)' : 'transparent',
              borderRadius: '6px',
              minHeight: '32px',
              padding: '4px 8px'
            }}
          >
            {editing ? (
              <>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    else if (e.key === "Escape") setEditing(null);
                  }}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '0',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--gray-12)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <Button
                  onClick={handleSave}
                  size="1"
                  variant="ghost"
                  color="blue"
                  style={{ cursor: 'pointer', fontSize: '11px', padding: '4px 8px' }}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <Text size="2" weight="medium">
                  {machineName || "Unknown"}
                </Text>
                {hovered && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(license.id);
                      setEditedName(machineName || "");
                    }}
                    size="1"
                    variant="ghost"
                    color="blue"
                    style={{ cursor: 'pointer', fontSize: '11px', padding: '4px 8px' }}
                  >
                    Edit
                  </Button>
                )}
              </>
            )}
          </Flex>
        </div>
      )}

      {/* Action Buttons */}
      <Flex gap="2" wrap="wrap">
        {/* Show "Use on this machine" for licenses without a machine */}
        {!machineId && (
          <Button
            onClick={() => onActivate(license.key)}
            disabled={activating}
            size="2"
            variant="soft"
            style={{ cursor: activating ? "not-allowed" : "pointer", flex: 1 }}
          >
            {activating ? "Activating..." : "Use on this machine"}
          </Button>
        )}

        {/* Show "Revoke" only for licenses active on this machine */}
        {isActiveOnThisMachine && (
          <Button
            onClick={() => onRevoke(license.key)}
            disabled={revoking}
            color="red"
            size="2"
            variant="soft"
            style={{ cursor: revoking ? "not-allowed" : "pointer", flex: 1 }}
          >
            {revoking ? "Revoking..." : "Revoke"}
          </Button>
        )}

        {/* Show "Reactivate" for canceled licenses, "Manage" for active */}
        {license.stripe_customer_id && (
          <Button
            onClick={() => onManageSubscription(license.stripe_customer_id)}
            size="2"
            variant="soft"
            color={license.status === "canceled" ? "blue" : "gray"}
            style={{ cursor: 'pointer', flex: 1 }}
          >
            {license.status === "canceled" ? "Reactivate" : "Manage"}
          </Button>
        )}
      </Flex>
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
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
            Trial Expired
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
            Your 7-day trial has ended. Subscribe to continue using NarraFlow.
          </p>

          <Button
            onClick={onSubscribe}
            size="3"
            variant="solid"
          >
            Subscribe for ${MONTHLY_PRICE}/month
          </Button>
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
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
            Message sent!
          </h2>
          <p style={{ fontSize: '14px', opacity: 0.8, maxWidth: '500px', color: 'var(--text-primary)', marginBottom: '16px' }}>
            Your message was sent. We'll try to respond within 48 hours.
          </p>
          <p style={{ fontSize: '12px', opacity: 0.6, paddingTop: '16px', color: 'var(--text-primary)' }}>
            You can close this window now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
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
        <Box>
          <Text size="2" color="gray" mb="2" as="div">
            Type of contact
          </Text>
          <Select.Root
            value={contactType}
            onValueChange={(value) => setContactType(value)}
          >
            <Select.Trigger style={{ width: '100%' }} placeholder="Select type..." />
            <Select.Content>
              <Select.Item value="bug">Bug Report</Select.Item>
              <Select.Item value="feature">Feature Request</Select.Item>
              <Select.Item value="feedback">General Feedback</Select.Item>
              <Select.Item value="testimonial">Testimonial / Success Story</Select.Item>
              <Select.Item value="help">Help/Support</Select.Item>
              <Select.Item value="other">Other</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>

        {/* Consent checkbox - only show for testimonials */}
        {contactType === 'testimonial' && (
          <Box style={{
            padding: '16px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius-3)',
          }}>
            <Flex align="start" gap="3">
              <Switch
                checked={consentToShare}
                onCheckedChange={setConsentToShare}
                style={{ marginTop: '2px' }}
              />
              <Text size="2" style={{ lineHeight: '1.5' }}>
                I give permission for NarraFlow to use my testimonial in marketing materials (website, social media, etc.) and to contact me for additional details or photos if needed.
              </Text>
            </Flex>
          </Box>
        )}

        {/* macOS Version - only show for bug reports */}
        {showVersionFields && (
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              macOS version
              <Tooltip content="Find your macOS version: Apple menu → About This Mac">
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
              </Tooltip>
            </label>
            <select
              value={macOSVersion}
              onChange={(e) => setMacOSVersion(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-system)',
                fontSize: '14px',
                cursor: 'pointer',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              app version
              <Tooltip content="Find your app version: Open NarraFlow → version shown at bottom left of settings window">
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
              </Tooltip>
            </label>
            <select
              value={appVersion}
              onChange={(e) => setAppVersion(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-system)',
                fontSize: '14px',
                cursor: 'pointer',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
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
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
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
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-system)',
                fontSize: '14px',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '12px', opacity: 0.5, marginTop: '4px', color: 'var(--text-primary)' }}>
              {message.length} / {maxMessageLength} characters
            </div>
          </div>
        )}

        {/* Attachments - only show when contact type is selected */}
        {contactType && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', opacity: 0.7, color: 'var(--text-primary)' }}>
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
                border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--border-light)'}`,
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
              <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '12px', color: 'var(--text-primary)' }}>
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
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span style={{ opacity: 0.8 }}>{file.name}</span>
                    <IconButton
                      onClick={() => removeAttachment(index)}
                      size="1"
                      variant="ghost"
                      color="red"
                    >
                      ✕
                    </IconButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Send button */}
      <Flex pt="4" justify="end">
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          size="3"
          variant="solid"
        >
          {isLoading && (
            <svg style={{ animation: 'spin 1s linear infinite', height: '16px', width: '16px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </Flex>

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
