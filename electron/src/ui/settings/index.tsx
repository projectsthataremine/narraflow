/**
 * Settings App UI - Main Entry Point
 * Retro Desktop OS Theme - ~900px wide window with sidebar navigation
 *
 * This is the refactored main entry point that imports and composes
 * all the individual section components.
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';

// Import components
import { Sidebar } from './components/Sidebar';
import { GeneralSection } from './components/GeneralSection';
import { RecordingPillSection } from './components/RecordingPillSection';
import { HistorySection } from './components/HistorySection';
import { AccountSection } from './components/AccountSection';
import { FeedbackSection } from './components/FeedbackSection';
import { SignInScreen } from './components/SignInScreen';

// Import types and styles
import { PillConfig, HistoryItem, HotkeyConfig } from './components/types';
import { IPC_CHANNELS } from '../../types/ipc-contracts';
import { CSS_VARS } from './components/styles';

// Main Settings App
function SettingsApp() {
  const [activeSection, setActiveSection] = useState('general');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<any>(null);
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
    modifiers: ['Control', 'Alt'],
    key: 'Control',
    keycode: 17,
  });

  // Always use dark theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  // Check authentication on mount and listen for changes
  const checkAuth = async () => {
    try {
      if (window.electron) {
        const authData = await (window.electron as any).getAuthStatus();
        console.log('[Settings] Auth check result:', authData);
        console.log('[Settings] Has user?', !!authData?.user);
        console.log('[Settings] User object:', authData?.user);
        setIsAuthenticated(!!authData?.user);
      }
    } catch (error) {
      console.error('[Settings] Failed to check auth:', error);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    // Listen for auth state changes
    if (window.electron) {
      const handleAuthStateChanged = () => {
        console.log('[Settings] ===== AUTH_STATE_CHANGED EVENT RECEIVED =====');
        checkAuth();
      };

      const handleAccessStatusChanged = (event: any) => {
        console.log('[Settings] ===== ACCESS_STATUS_CHANGED EVENT RECEIVED =====', event);
        setAccessStatus(event);
      };

      (window.electron as any).on('AUTH_STATE_CHANGED', handleAuthStateChanged);
      (window.electron as any).on('ACCESS_STATUS_CHANGED', handleAccessStatusChanged);
      console.log('[Settings] AUTH_STATE_CHANGED listener registered');
      console.log('[Settings] ACCESS_STATUS_CHANGED listener registered');
    }
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

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <Theme appearance="dark" accentColor="blue" grayColor="slate" radius="medium" scaling="100%">
        <style>{CSS_VARS}</style>
        <div style={{
          width: '100vw',
          height: '100vh',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ color: 'var(--gray-11)' }}>Loading...</div>
        </div>
      </Theme>
    );
  }

  // Show sign-in screen if not authenticated
  if (!isAuthenticated) {
    return (
      <Theme appearance="dark" accentColor="blue" grayColor="slate" radius="medium" scaling="100%">
        <style>{CSS_VARS}</style>
        <SignInScreen onSignInSuccess={checkAuth} />
      </Theme>
    );
  }

  // Show normal settings UI if authenticated
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
          <Sidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            accessStatus={accessStatus}
          />

          {/* Content Area */}
          <div style={{
            flex: 1,
            padding: '10px 24px 24px 24px',
            overflowY: 'auto',
            background: '#000000',
          }}>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 32px 32px 32px',
              minHeight: '100%',
            }}>
              {activeSection === 'general' && (
                <GeneralSection
                  aiEnabled={aiEnabled}
                  setAiEnabled={setAiEnabled}
                  hotkeyConfig={hotkeyConfig}
                  setHotkeyConfig={setHotkeyConfig}
                  accessStatus={accessStatus}
                />
              )}
              {activeSection === 'recording' && (
                <RecordingPillSection
                  pillConfig={pillConfig}
                  setPillConfig={setPillConfig}
                  accessStatus={accessStatus}
                />
              )}
              {activeSection === 'history' && (
                <HistorySection
                  history={history}
                  setHistory={setHistory}
                  accessStatus={accessStatus}
                />
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

// Mount the app
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<SettingsApp />);
}
