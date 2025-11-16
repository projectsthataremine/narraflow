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
import { ModelDownloadScreen } from './components/ModelDownloadScreen';
import { PermissionsScreen } from './components/PermissionsScreen';

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

  // Setup flow state
  const [setupState, setSetupState] = useState<'checking' | 'permissions' | 'downloading' | 'complete'>('checking');
  const [downloadProgress, setDownloadProgress] = useState({
    progress: 0,
    downloaded: 0,
    total: 0,
    isDownloading: false,
  });
  const [downloadingModel, setDownloadingModel] = useState<'large-v3_turbo' | 'small' | null>(null);
  const [installingModel, setInstallingModel] = useState<'large-v3_turbo' | 'small' | null>(null);

  // SINGLE SOURCE OF TRUTH: Model download status for all models
  const [modelStatus, setModelStatus] = useState<Record<string, boolean>>({
    'small': false,
    'large-v3_turbo': false,
  });
  const [permissions, setPermissions] = useState([
    {
      id: 'microphone',
      name: 'Microphone Access',
      description: 'Required to record and transcribe your voice',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>,
      granted: false,
      required: true,
    },
  ]);

  // Always use dark theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  // Check setup requirements (model, permissions) on mount
  useEffect(() => {
    const checkSetupRequirements = async () => {
      if (!window.electron || !isAuthenticated) return;

      try {
        // Check all models - SINGLE SOURCE OF TRUTH
        const smallCheck = await (window.electron as any).invoke(IPC_CHANNELS.CHECK_WHISPERKIT_MODEL, { model: 'small' });
        const largeCheck = await (window.electron as any).invoke(IPC_CHANNELS.CHECK_WHISPERKIT_MODEL, { model: 'large-v3_turbo' });

        setModelStatus({
          'small': smallCheck.exists,
          'large-v3_turbo': largeCheck.exists,
        });
        console.log('[Setup] Model status:', { small: smallCheck.exists, large: largeCheck.exists });

        const anyModelExists = smallCheck.exists || largeCheck.exists;

        // Check microphone permission
        const micPermission = await (window.electron as any).invoke(IPC_CHANNELS.CHECK_MICROPHONE_PERMISSION);
        setPermissions(prev => prev.map(p =>
          p.id === 'microphone' ? { ...p, granted: micPermission.granted } : p
        ));
        console.log('[Setup] Mic permission granted:', micPermission.granted);

        // Determine setup state
        if (!micPermission.granted) {
          setSetupState('permissions');
        } else if (!anyModelExists) {
          setSetupState('downloading');
        } else {
          setSetupState('complete');
        }
      } catch (error) {
        console.error('[Setup] Failed to check setup requirements:', error);
        setSetupState('complete'); // Fallback to complete to avoid blocking
      }
    };

    if (isAuthenticated) {
      checkSetupRequirements();
    }
  }, [isAuthenticated]);

  // Listen for WhisperKit download progress - SINGLE SOURCE OF TRUTH for model status
  useEffect(() => {
    if (window.electron?.on) {
      window.electron.on('whisperkit-download-progress', async (data: any) => {
        console.log('[Setup] WhisperKit download progress:', data);
        setDownloadProgress({
          progress: data.progress,
          downloaded: data.downloaded,
          total: data.total,
          isDownloading: data.isDownloading,
        });

        // If download completes, transition to installing state
        if (data.progress >= 100 && !data.isDownloading) {
          // Transition from downloading to installing - use model from event data
          const modelToInstall = data.model || downloadingModel;
          if (modelToInstall) {
            setInstallingModel(modelToInstall as 'large-v3_turbo' | 'small');
            setDownloadingModel(null);
          }

          // Re-check all models to get fresh status
          try {
            const smallCheck = await (window.electron as any).invoke(IPC_CHANNELS.CHECK_WHISPERKIT_MODEL, { model: 'small' });
            const largeCheck = await (window.electron as any).invoke(IPC_CHANNELS.CHECK_WHISPERKIT_MODEL, { model: 'large-v3_turbo' });

            setModelStatus({
              'small': smallCheck.exists,
              'large-v3_turbo': largeCheck.exists,
            });

            // Clear installing state now that model is confirmed to exist
            if (modelToInstall && (
              (modelToInstall === 'small' && smallCheck.exists) ||
              (modelToInstall === 'large-v3_turbo' && largeCheck.exists)
            )) {
              setInstallingModel(null);
            }

            setSetupState('complete');
          } catch (error) {
            console.error('[Setup] Failed to update model status:', error);
          }
        }
      });
    }
  }, [downloadingModel]);

  // Listen for WhisperKit model change (installation complete)
  useEffect(() => {
    if (window.electron?.on) {
      const handleModelChanged = (data: any) => {
        // Clear installing state - model is now fully ready
        setInstallingModel(null);
      };

      (window.electron as any).on('WHISPERKIT_MODEL_CHANGED', handleModelChanged);

      // Cleanup function to remove listener
      return () => {
        if (window.electron?.removeListener) {
          (window.electron as any).removeListener('WHISPERKIT_MODEL_CHANGED', handleModelChanged);
        }
      };
    }
  }, []); // Empty dependency array - only register once

  // Permission handlers
  const handleRequestPermissions = async () => {
    if (!window.electron) return;

    try {
      // Request microphone permission
      const micResult = await (window.electron as any).invoke(IPC_CHANNELS.REQUEST_MICROPHONE_PERMISSION);
      setPermissions(prev => prev.map(p =>
        p.id === 'microphone' ? { ...p, granted: micResult.granted } : p
      ));

      // Check if all required permissions are granted
      const allGranted = permissions.every(p => p.granted || !p.required);
      if (allGranted) {
        // Move to next setup step
        const anyModelExists = modelStatus['small'] || modelStatus['large-v3_turbo'];
        if (!anyModelExists) {
          setSetupState('downloading');
        } else {
          setSetupState('complete');
        }
      }
    } catch (error) {
      console.error('[Setup] Failed to request permissions:', error);
    }
  };

  const handlePermissionsContinue = () => {
    // Check if model needs to be downloaded
    const anyModelExists = modelStatus['small'] || modelStatus['large-v3_turbo'];
    if (!anyModelExists) {
      setSetupState('downloading');
    } else {
      setSetupState('complete');
    }
  };

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

  // Show permissions screen if permissions not granted
  if (isAuthenticated && setupState === 'permissions') {
    return (
      <Theme appearance="dark" accentColor="blue" grayColor="slate" radius="medium" scaling="100%">
        <style>{CSS_VARS}</style>
        <PermissionsScreen
          permissions={permissions}
          onRequestPermissions={handleRequestPermissions}
          onContinue={handlePermissionsContinue}
        />
      </Theme>
    );
  }

  // Show model download screen if model doesn't exist or is downloading
  const anyModelExists = modelStatus['small'] || modelStatus['large-v3_turbo'];
  if (isAuthenticated && (setupState === 'downloading' || (setupState === 'checking' && !anyModelExists))) {
    return (
      <Theme appearance="dark" accentColor="blue" grayColor="slate" radius="medium" scaling="100%">
        <style>{CSS_VARS}</style>
        <ModelDownloadScreen
          progress={downloadProgress.progress}
          downloaded={downloadProgress.downloaded}
          total={downloadProgress.total}
          isDownloading={downloadProgress.isDownloading || !anyModelExists}
        />
      </Theme>
    );
  }

  // Show normal settings UI if authenticated and setup complete
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
            padding: '10px 24px 24px 0px',
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
                  downloadingModel={downloadingModel}
                  setDownloadingModel={setDownloadingModel}
                  installingModel={installingModel}
                  setInstallingModel={setInstallingModel}
                  modelStatus={modelStatus}
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
