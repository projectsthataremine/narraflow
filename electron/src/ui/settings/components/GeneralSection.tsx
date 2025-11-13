/**
 * General Settings Section
 * Includes keyboard shortcuts, microphone selection, dock visibility, and app reset
 */

import React, { useState, useEffect } from 'react';
import { Flex, Text, Box, Select, Switch, Button } from '@radix-ui/themes';
import { HotkeyConfig, HOTKEY_OPTIONS } from './types';
import { IPC_CHANNELS } from '../../../types/ipc-contracts';
import packageJson from '../../../../package.json';

interface GeneralSectionProps {
  aiEnabled: boolean;
  setAiEnabled: (enabled: boolean) => void;
  hotkeyConfig: HotkeyConfig;
  setHotkeyConfig: (config: HotkeyConfig) => void;
}

export function GeneralSection({ aiEnabled, setAiEnabled, hotkeyConfig, setHotkeyConfig }: GeneralSectionProps) {
  const [showInDock, setShowInDock] = useState(false);
  const [enableLlamaFormatting, setEnableLlamaFormatting] = useState(false);
  const [selectedMicrophone, setSelectedMicrophone] = useState('default');
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateCheckCooldown, setUpdateCheckCooldown] = useState(false);

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

      {/* Enhanced Formatting (Llama) */}
      <Flex justify="between" align="center" mb="5">
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
        />
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

      {/* Version & Updates Section */}
      <Box
        mt="6"
        pt="6"
        style={{
          borderTop: '1px solid var(--gray-a6)',
        }}
      >
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
    </div>
  );
}
