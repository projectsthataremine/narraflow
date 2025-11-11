/**
 * Sidebar Component
 * Navigation sidebar with logo and menu items
 */

import React, { useState } from 'react';
import { Box, Flex } from '@radix-ui/themes';
import { SettingsIcon, MicIcon, HistoryIcon, UserIcon, MessageIcon, NarraFlowLogo } from './Icons';

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

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  return (
    <Box style={{
      width: '240px',
      background: '#000000',
      padding: '10px 16px 24px 16px',
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
  );
}
