/**
 * General Settings Section
 * Includes keyboard shortcuts, microphone selection, dock visibility, and app reset
 */

import React, { useState, useEffect } from 'react';
import { Flex, Text, Box, Select, Switch, Button } from '@radix-ui/themes';
import { HotkeyConfig, HOTKEY_OPTIONS } from './types';
import { IPC_CHANNELS } from '../../../types/ipc-contracts';

interface GeneralSectionProps {
  aiEnabled: boolean;
  setAiEnabled: (enabled: boolean) => void;
  hotkeyConfig: HotkeyConfig;
  setHotkeyConfig: (config: HotkeyConfig) => void;
}

export function GeneralSection({ aiEnabled, setAiEnabled, hotkeyConfig, setHotkeyConfig }: GeneralSectionProps) {
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
