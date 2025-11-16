/**
 * Permissions Screen
 * Beautiful full-screen setup UI for requesting necessary permissions
 * Handles microphone, accessibility, and other system permissions
 */

import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, Button } from '@radix-ui/themes';
import { NarraFlowLogo, MicIcon } from './Icons';

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  granted: boolean;
  required: boolean;
}

interface PermissionsScreenProps {
  permissions: Permission[];
  onRequestPermissions: () => Promise<void>;
  onContinue: () => void;
}

export function PermissionsScreen({ permissions, onRequestPermissions, onContinue }: PermissionsScreenProps) {
  const [requesting, setRequesting] = useState(false);
  const [dots, setDots] = useState('');

  // Animated dots for loading state
  useEffect(() => {
    if (requesting) {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [requesting]);

  const handleRequestPermissions = async () => {
    setRequesting(true);
    try {
      await onRequestPermissions();
    } finally {
      setRequesting(false);
    }
  };

  const allGranted = permissions.every(p => p.granted || !p.required);
  const requiredPermissions = permissions.filter(p => p.required);
  const grantedCount = requiredPermissions.filter(p => p.granted).length;

  return (
    <Box
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle background gradient glow */}
      <Box
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Flex
        direction="column"
        align="center"
        gap="6"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '600px',
          width: '100%',
          padding: '0 32px',
        }}
      >
        {/* Logo */}
        <Box style={{ marginBottom: '12px', opacity: 0.9 }}>
          <NarraFlowLogo />
        </Box>

        {/* Main heading */}
        <Flex direction="column" align="center" gap="2">
          <Text
            size="7"
            weight="bold"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(255, 255, 255, 0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
              textAlign: 'center',
            }}
          >
            {requesting ? `Requesting permissions${dots}` : 'Grant Permissions'}
          </Text>
          <Text
            size="3"
            style={{
              color: 'rgba(255, 255, 255, 0.5)',
              textAlign: 'center',
              lineHeight: '1.6',
              maxWidth: '450px',
            }}
          >
            NarraFlow needs access to your system to provide the best transcription experience
          </Text>
        </Flex>

        {/* Permissions List */}
        <Box style={{ width: '100%', marginTop: '24px' }}>
          <Flex direction="column" gap="3">
            {permissions.map((permission) => (
              <Box
                key={permission.id}
                p="4"
                style={{
                  background: permission.granted
                    ? 'rgba(52, 199, 89, 0.08)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: permission.granted
                    ? '1px solid rgba(52, 199, 89, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                }}
              >
                <Flex gap="4" align="start">
                  {/* Icon */}
                  <Box
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: permission.granted
                        ? 'rgba(52, 199, 89, 0.15)'
                        : 'rgba(0, 122, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: permission.granted ? '#34C759' : '#007AFF',
                    }}
                  >
                    {permission.granted ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      permission.icon
                    )}
                  </Box>

                  {/* Content */}
                  <Flex direction="column" gap="1" style={{ flex: 1 }}>
                    <Flex justify="between" align="center">
                      <Text size="3" weight="medium" style={{ color: '#fff' }}>
                        {permission.name}
                      </Text>
                      {permission.required && !permission.granted && (
                        <Text
                          size="1"
                          style={{
                            color: '#007AFF',
                            background: 'rgba(0, 122, 255, 0.1)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '500',
                          }}
                        >
                          Required
                        </Text>
                      )}
                      {permission.granted && (
                        <Text
                          size="1"
                          style={{
                            color: '#34C759',
                            background: 'rgba(52, 199, 89, 0.1)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '500',
                          }}
                        >
                          Granted
                        </Text>
                      )}
                    </Flex>
                    <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: '1.5' }}>
                      {permission.description}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            ))}
          </Flex>
        </Box>

        {/* Progress indicator if partially granted */}
        {!allGranted && grantedCount > 0 && (
          <Box style={{ width: '100%' }}>
            <Flex align="center" gap="3">
              <Box
                style={{
                  flex: 1,
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <Box
                  style={{
                    width: `${(grantedCount / requiredPermissions.length) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #007AFF 0%, #34C759 100%)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
              <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'monospace' }}>
                {grantedCount}/{requiredPermissions.length}
              </Text>
            </Flex>
          </Box>
        )}

        {/* Action Buttons */}
        <Flex gap="3" style={{ width: '100%', marginTop: '24px' }}>
          {!allGranted ? (
            <Button
              size="3"
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                color: '#fff',
                cursor: requesting ? 'not-allowed' : 'pointer',
                opacity: requesting ? 0.6 : 1,
                border: 'none',
                fontSize: '15px',
                fontWeight: '600',
                padding: '16px',
                borderRadius: '10px',
                boxShadow: '0 4px 16px rgba(0, 122, 255, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onClick={handleRequestPermissions}
              disabled={requesting}
            >
              {requesting ? 'Opening System Settings...' : 'Grant Permissions'}
            </Button>
          ) : (
            <Button
              size="3"
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
                color: '#fff',
                cursor: 'pointer',
                border: 'none',
                fontSize: '15px',
                fontWeight: '600',
                padding: '16px',
                borderRadius: '10px',
                boxShadow: '0 4px 16px rgba(52, 199, 89, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onClick={onContinue}
            >
              Continue to NarraFlow
            </Button>
          )}
        </Flex>

        {/* Helpful note */}
        {!allGranted && (
          <Box
            mt="2"
            p="4"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              width: '100%',
            }}
          >
            <Text
              size="2"
              style={{
                color: 'rgba(255, 255, 255, 0.4)',
                lineHeight: '1.6',
                textAlign: 'center',
              }}
            >
              💡 You'll be redirected to System Settings. Grant the permissions, then return here.
            </Text>
          </Box>
        )}
      </Flex>
    </Box>
  );
}
