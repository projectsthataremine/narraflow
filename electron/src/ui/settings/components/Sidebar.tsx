/**
 * Sidebar Component
 * Navigation sidebar with logo and menu items
 */

import React, { useState, useEffect } from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { SettingsIcon, MicIcon, HistoryIcon, UserIcon, MessageIcon, NarraFlowLogo } from './Icons';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function NavItem({ icon, label, active, onClick, disabled }: NavItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => !disabled && setHovered(false)}
      style={{
        padding: '8px 12px',
        borderRadius: 'var(--radius-3)',
        background: active ? '#0f0f0f' : hovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: active ? '500' : '400',
        color: disabled ? 'var(--gray-6)' : active ? 'var(--accent-9)' : 'var(--gray-11)',
        transition: 'all 0.15s ease',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', color: disabled ? 'var(--gray-6)' : active ? 'var(--accent-9)' : 'var(--gray-10)' }}>{icon}</span>
      <span>{label}</span>
    </Box>
  );
}

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  accessStatus: any;
}

export function Sidebar({ activeSection, setActiveSection, accessStatus }: SidebarProps) {
  const hasAccess = accessStatus?.hasValidAccess ?? true;

  // Real download progress from WhisperKit server
  const [downloadProgress, setDownloadProgress] = useState<{
    progress: number;
    downloaded: number;
    total: number;
    isDownloading: boolean;
  }>({ progress: 0, downloaded: 0, total: 3000, isDownloading: false });

  useEffect(() => {
    // Listen for real download progress from main process
    if (window.electron?.on) {
      window.electron.on('whisperkit-download-progress', (data: any) => {
        console.log('[Sidebar] WhisperKit download progress:', data);
        setDownloadProgress({
          progress: data.progress,
          downloaded: data.downloaded,
          total: data.total,
          isDownloading: data.isDownloading,
        });
      });
    }
  }, []);

  return (
    <Box style={{
      width: '240px',
      background: '#000000',
      padding: '10px 16px 24px 16px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      boxSizing: 'border-box',
      justifyContent: 'space-between',
      overflow: 'hidden',
    }}>
      {/* Top Section: Logo + Navigation */}
      <Box>
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
          {hasAccess && (
            <>
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
            </>
          )}
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
      </Box>

      {/* Beautiful Download Progress - Always at bottom */}
      {downloadProgress.isDownloading && (
        <Box
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.08) 0%, rgba(88, 86, 214, 0.08) 100%)',
            border: '1px solid rgba(0, 122, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            animation: 'slideUp 0.5s ease-out',
          }}
        >
          <Flex direction="column" gap="3">
            {/* Header */}
            <Flex justify="between" align="center">
              <Text size="2" weight="medium" style={{ color: '#fff', letterSpacing: '-0.01em' }}>
                Downloading model
              </Text>
              <Text
                size="2"
                weight="bold"
                style={{
                  color: '#007AFF',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                }}
              >
                {Math.round(downloadProgress.progress)}%
              </Text>
            </Flex>

            {/* Progress Bar Container */}
            <Box
              style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Animated Background Gradient */}
              <Box
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(90deg, rgba(0, 122, 255, 0.2) 0%, rgba(88, 86, 214, 0.2) 100%)',
                  animation: 'shimmer 2s infinite',
                  borderRadius: '6px',
                }}
              />

              {/* Progress Fill */}
              <Box
                style={{
                  width: `${downloadProgress.progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #007AFF 0%, #5856D6 100%)',
                  transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  boxShadow: '0 0 10px rgba(0, 122, 255, 0.5)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                {/* Shine Effect */}
                <Box
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                    animation: 'shine 1.5s infinite',
                  }}
                />
              </Box>
            </Box>

            {/* Size Info */}
            <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center' }}>
              {(downloadProgress.downloaded / 1024).toFixed(1)} GB / {(downloadProgress.total / 1024).toFixed(1)} GB
            </Text>
          </Flex>
        </Box>
      )}

      {/* Add CSS animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </Box>
  );
}
