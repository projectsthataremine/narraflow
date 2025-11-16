/**
 * General Settings Section
 * Includes keyboard shortcuts, microphone selection, dock visibility, and app reset
 */

import React, { useState, useEffect } from 'react';
import { Flex, Text, Box, Select, Switch, Button } from '@radix-ui/themes';
import { HotkeyConfig, HOTKEY_OPTIONS } from './types';
import { IPC_CHANNELS } from '../../../types/ipc-contracts';
import packageJson from '../../../../package.json';
import { ModelSelector } from './ModelSelector';

interface GeneralSectionProps {
  aiEnabled: boolean;
  setAiEnabled: (enabled: boolean) => void;
  hotkeyConfig: HotkeyConfig;
  setHotkeyConfig: (config: HotkeyConfig) => void;
  accessStatus: any;
  downloadingModel: 'large-v3_turbo' | 'small' | null;
  setDownloadingModel: (model: 'large-v3_turbo' | 'small' | null) => void;
  installingModel: 'large-v3_turbo' | 'small' | null;
  setInstallingModel: (model: 'large-v3_turbo' | 'small' | null) => void;
  modelStatus: Record<string, boolean>; // SINGLE SOURCE OF TRUTH from parent
}

export function GeneralSection({
  aiEnabled,
  setAiEnabled,
  hotkeyConfig,
  setHotkeyConfig,
  accessStatus,
  downloadingModel,
  setDownloadingModel,
  installingModel,
  setInstallingModel,
  modelStatus, // SINGLE SOURCE OF TRUTH from parent
}: GeneralSectionProps) {
  const hasAccess = accessStatus?.hasValidAccess ?? true;
  const [showInDock, setShowInDock] = useState(false);
  const [enableLlamaFormatting, setEnableLlamaFormatting] = useState(false);
  const [selectedMicrophone, setSelectedMicrophone] = useState('default');
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateCheckCooldown, setUpdateCheckCooldown] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'large-v3_turbo' | 'small'>('small');
  // modelStatus is now passed from parent - SINGLE SOURCE OF TRUTH
  const [switchingModel, setSwitchingModel] = useState<string | null>(null);

  // Find the matching option from HOTKEY_OPTIONS based on current config
  const currentOption = HOTKEY_OPTIONS.find(
    opt => JSON.stringify(opt.modifiers) === JSON.stringify(hotkeyConfig.modifiers) &&
           opt.key === hotkeyConfig.key
  );
  const currentHotkeyLabel = currentOption ? currentOption.label : 'Fn (Globe)';

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

  // Load Llama formatting setting on mount
  useEffect(() => {
    const getLlamaFormatting = async () => {
      if (window.electron) {
        try {
          const enabled = await (window.electron as any).invoke(IPC_CHANNELS.GET_LLAMA_FORMATTING);
          setEnableLlamaFormatting(enabled);
        } catch (error) {
          console.error('[Settings] Failed to get Llama formatting setting:', error);
        }
      }
    };

    getLlamaFormatting();
  }, []);

  // Load selected model on mount (modelStatus comes from parent)
  useEffect(() => {
    const loadSelectedModel = async () => {
      if (window.electron) {
        try {
          const model = await (window.electron as any).invoke('GET_WHISPERKIT_MODEL');
          setSelectedModel(model || 'small');
        } catch (error) {
          console.error('[Settings] Failed to load selected model:', error);
        }
      }
    };

    loadSelectedModel();
  }, []);

  // Listen for model changes from backend
  useEffect(() => {
    if (window.electron?.on) {
      const handleModelChanged = (data: any) => {
        setSelectedModel(data.model);
        // Clear switching state
        setSwitchingModel(null);
      };

      window.electron.on('WHISPERKIT_MODEL_CHANGED', handleModelChanged);

      return () => {
        // Cleanup listener if needed
      };
    }
  }, []);

  // REMOVED: Download progress listener - modelStatus is now managed by parent (index.tsx)

  // Update selected model when download completes
  useEffect(() => {
    const getSelectedModel = async () => {
      if (window.electron && downloadingModel === null) {
        try {
          const model = await (window.electron as any).invoke('GET_WHISPERKIT_MODEL');
          setSelectedModel(model || 'small');
          console.log('[Settings] Synced selected model after download:', model);
        } catch (error) {
          console.error('[Settings] Failed to sync selected model:', error);
        }
      }
    };

    getSelectedModel();
  }, [downloadingModel]);


  // Handle model change
  const handleModelChange = async (model: 'large-v3_turbo' | 'small') => {
    console.log('[Settings] handleModelChange called with:', model);
    console.log('[Settings] Current selectedModel:', selectedModel);

    // Prevent switching if already downloading or switching
    if (downloadingModel || switchingModel) {
      console.log('[Settings] Already processing a model change, ignoring');
      return;
    }

    if (window.electron) {
      try {
        // Check if the model exists
        const modelCheck = await (window.electron as any).invoke(IPC_CHANNELS.CHECK_WHISPERKIT_MODEL, { model });
        console.log('[Settings] Model check result:', modelCheck);

        if (modelCheck.exists) {
          // Model exists, switch to it
          console.log('[Settings] Switching to existing model:', model);

          // Optimistic update: immediately select and show as switching
          setSelectedModel(model);
          setSwitchingModel(model);

          // Actually switch the model
          await (window.electron as any).invoke('SET_WHISPERKIT_MODEL', { model });
          console.log('[Settings] Model switch completed');
          // The WHISPERKIT_MODEL_CHANGED event will clear switchingModel
        } else {
          // Model doesn't exist, trigger download by calling SET_WHISPERKIT_MODEL
          console.log('[Settings] Model not found, triggering download for:', model);
          setDownloadingModel(model);
          // Backend switchModel will detect missing model, download it, and switch to it
          await (window.electron as any).invoke('SET_WHISPERKIT_MODEL', { model });
          console.log('[Settings] Download and switch initiated for:', model);
        }
      } catch (error) {
        console.error('[Settings] Failed to change model:', error);
        // Reset on error
        setSwitchingModel(null);
        setDownloadingModel(null);
      }
    }
  };

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

  // Handle Llama formatting changes
  const handleLlamaFormattingChange = async (enabled: boolean) => {
    console.log('[Settings] handleLlamaFormattingChange called with:', enabled);
    setEnableLlamaFormatting(enabled);
    if (window.electron) {
      try {
        console.log('[Settings] Invoking SET_LLAMA_FORMATTING...');
        const result = await (window.electron as any).invoke(IPC_CHANNELS.SET_LLAMA_FORMATTING, { enabled });
        console.log('[Settings] SET_LLAMA_FORMATTING result:', result);
      } catch (error) {
        console.error('[Settings] Failed to set Llama formatting:', error);
      }
    }
  };

  // Load current version and check for updates on mount
  useEffect(() => {
    // Set current version from package.json
    const currentVer = packageJson.version;
    setCurrentVersion(currentVer);

    // Fetch latest version from GitHub and compare
    checkForUpdates(currentVer);
  }, []);

  const checkForUpdates = async (currentVer?: string) => {
    // Prevent rapid successive checks
    if (updateCheckCooldown) {
      return;
    }

    const versionToCompare = currentVer || currentVersion;
    setCheckingUpdate(true);
    setUpdateCheckCooldown(true);

    try {
      const response = await fetch('https://api.github.com/repos/projectsthataremine/narraflow/releases/latest');
      const data = await response.json();
      const latestVer = data.tag_name?.replace('v', '') || '';
      setLatestVersion(latestVer);

      // Compare versions - check if latest is actually newer than current
      if (versionToCompare && latestVer) {
        const current = versionToCompare.split('.').map(Number);
        const latest = latestVer.split('.').map(Number);

        let isNewer = false;
        for (let i = 0; i < Math.max(current.length, latest.length); i++) {
          const currPart = current[i] || 0;
          const latestPart = latest[i] || 0;
          if (latestPart > currPart) {
            isNewer = true;
            break;
          } else if (latestPart < currPart) {
            break;
          }
        }

        setUpdateAvailable(isNewer);
      }
    } catch (error) {
      console.error('[Settings] Failed to check for updates:', error);
    } finally {
      setCheckingUpdate(false);
      // Reset cooldown after 2 seconds
      setTimeout(() => {
        setUpdateCheckCooldown(false);
      }, 2000);
    }
  };

  const handleDownloadUpdate = () => {
    if (window.electron) {
      (window.electron as any).invoke('OPEN_EXTERNAL_URL', { url: 'https://trynarraflow.com/download' });
    } else {
      window.open('https://trynarraflow.com/download', '_blank');
    }
  };

  return (
    <div>
      {/* App Settings Section Header */}
      <Text size="2" weight="bold" style={{ opacity: 0.7, display: 'block', marginBottom: '16px', letterSpacing: '0.05em' }}>
        APP SETTINGS
      </Text>

      {/* Keyboard Shortcuts */}
      <Flex justify="between" align="center" mb="5">
        <Text size="3" weight="medium" style={{ opacity: hasAccess ? 1 : 0.4 }}>
          Keyboard shortcuts
        </Text>
        <Box style={{ width: '200px', opacity: hasAccess ? 1 : 0.4, pointerEvents: hasAccess ? 'auto' : 'none' }}>
          <Select.Root
            value={currentHotkeyLabel}
            disabled={!hasAccess}
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
            <Select.Content position="popper" side="bottom" align="start">
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
        <Text size="3" weight="medium" style={{ opacity: hasAccess ? 1 : 0.4 }}>
          Microphone
        </Text>
        <Box style={{ width: '200px', opacity: hasAccess ? 1 : 0.4, pointerEvents: hasAccess ? 'auto' : 'none' }}>
          <Select.Root
            value={selectedMicrophone}
            disabled={!hasAccess}
            onValueChange={(value) => {
              setSelectedMicrophone(value);
              // TODO: Save to settings and update audio capture
              console.log('[Settings] Microphone changed to:', value);
            }}
          >
            <Select.Trigger style={{ width: '100%' }} />
            <Select.Content position="popper" side="bottom" align="start">
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

      {/* Transcription Section Header */}
      <Text size="2" weight="bold" style={{ opacity: 0.7, display: 'block', marginTop: '32px', marginBottom: '16px', letterSpacing: '0.05em' }}>
        TRANSCRIPTION
      </Text>

      {/* Model Selection - Show all options */}
      <Box mb="5" style={{ opacity: hasAccess ? 1 : 0.4 }}>
        <ModelSelector
          selectedModel={selectedModel}
          downloadingModel={downloadingModel}
          installingModel={installingModel}
          switchingModel={switchingModel}
          onModelChange={(model) => handleModelChange(model as 'large-v3_turbo' | 'small')}
          disabled={!hasAccess}
          modelStatus={modelStatus}
        />
      </Box>

      {/* Enhanced Formatting (Llama) - TEMPORARILY DISABLED - Coming Soon */}
      {/* <Flex justify="between" align="center" mb="5" style={{ opacity: hasAccess ? 1 : 0.4 }}>
        <Box style={{ flex: 1, maxWidth: '70%' }}>
          <Text size="3" weight="medium" style={{ display: 'block', marginBottom: '4px' }}>
            Enhanced formatting
          </Text>
          <Text size="2" style={{ opacity: 0.6, lineHeight: '1.4' }}>
            Uses AI to improve grammar, punctuation, and capitalization. May add ~200ms processing time.
          </Text>
        </Box>
        <Switch
          checked={enableLlamaFormatting}
          onCheckedChange={handleLlamaFormattingChange}
          disabled={!hasAccess}
        />
      </Flex> */}

      {/* About Section */}
      <Box mt="6">
        <Text size="2" weight="bold" style={{ opacity: 0.7, display: 'block', marginBottom: '12px' }}>
          ABOUT
        </Text>

        {/* Version Info */}
        <Flex justify="between" align="center" mb="3">
          <Text size="3" weight="medium">
            Version
          </Text>
          <Text size="3" style={{ fontFamily: 'monospace', opacity: 0.9 }}>
            {currentVersion || 'Loading...'}
          </Text>
        </Flex>

        {/* Update Available */}
        {updateAvailable && latestVersion && (
          <Flex
            direction="column"
            gap="2"
            p="3"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 144, 255, 0.1) 0%, rgba(0, 119, 255, 0.1) 100%)',
              border: '2px solid rgba(0, 144, 255, 0.3)',
              borderRadius: '8px',
              marginTop: '12px',
            }}
          >
            <Flex justify="between" align="center">
              <Box>
                <Text size="3" weight="bold" style={{ color: 'var(--blue-11)', marginBottom: '4px', display: 'block' }}>
                  Update Available
                </Text>
                <Text size="2" style={{ opacity: 0.8 }}>
                  Version {latestVersion} is now available
                </Text>
              </Box>
              <Button
                onClick={handleDownloadUpdate}
                size="2"
                variant="solid"
                style={{ cursor: 'pointer' }}
              >
                Download
              </Button>
            </Flex>
          </Flex>
        )}

        {/* Check for Updates Button */}
        {!updateAvailable && (
          <Flex justify="between" align="center" mt="3">
            <Text size="2" style={{ opacity: 0.7 }}>
              {checkingUpdate ? 'Checking for updates...' : latestVersion ? 'You\'re up to date' : ''}
            </Text>
            <Button
              variant="soft"
              size="2"
              onClick={checkForUpdates}
              disabled={checkingUpdate || updateCheckCooldown}
              style={{ cursor: (checkingUpdate || updateCheckCooldown) ? 'not-allowed' : 'pointer' }}
            >
              Check for updates
            </Button>
          </Flex>
        )}
      </Box>

      {/* Reset App Section */}
      <Box mt="6">
        <Text size="2" weight="bold" style={{ opacity: 0.7, display: 'block', marginBottom: '12px', letterSpacing: '0.05em' }}>
          DEVELOPER SETTINGS
        </Text>
        <Flex justify="between" align="center" mb="2">
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
        <Text size="1" style={{ opacity: 0.5, display: 'block', lineHeight: '1.4' }}>
          Only use if instructed by support
        </Text>
      </Box>
    </div>
  );
}
