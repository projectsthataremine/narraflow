/**
 * Model Download Screen
 * Beautiful full-screen setup UI for downloading transcription models
 * Shows during initial setup when WhisperKit or other models need to be downloaded
 */

import React, { useState, useEffect } from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { NarraFlowLogo } from './Icons';

interface ModelDownloadScreenProps {
  progress: number;
  downloaded: number;
  total: number;
  isDownloading: boolean;
}

export function ModelDownloadScreen({ progress, downloaded, total, isDownloading }: ModelDownloadScreenProps) {
  const [dots, setDots] = useState('');

  // Animated dots for "Setting up" text
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

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
          animation: 'pulse 4s ease-in-out infinite',
        }}
      />

      <Flex
        direction="column"
        align="center"
        gap="6"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '500px',
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
            Setting up NarraFlow{dots}
          </Text>
          <Text
            size="3"
            style={{
              color: 'rgba(255, 255, 255, 0.5)',
              textAlign: 'center',
              lineHeight: '1.6',
              maxWidth: '400px',
            }}
          >
            Downloading transcription model
          </Text>
        </Flex>

        {/* Progress Section */}
        <Box style={{ width: '100%', marginTop: '24px' }}>
          {/* Percentage Display */}
          <Flex justify="center" mb="4">
            {progress > 0 ? (
              <Text
                size="8"
                weight="bold"
                style={{
                  color: '#007AFF',
                  fontFamily: 'monospace',
                  fontSize: '56px',
                  letterSpacing: '-0.03em',
                  textShadow: '0 0 40px rgba(0, 122, 255, 0.3)',
                }}
              >
                {Math.round(progress)}%
              </Text>
            ) : (
              <Text
                size="6"
                weight="medium"
                style={{
                  color: 'rgba(0, 122, 255, 0.8)',
                  letterSpacing: '-0.01em',
                }}
              >
                Preparing download{dots}
              </Text>
            )}
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
                width: `${progress}%`,
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

          {/* Download size info */}
          <Flex justify="center" mt="4">
            <Text
              size="2"
              style={{
                color: 'rgba(255, 255, 255, 0.3)',
                fontFamily: 'monospace',
                letterSpacing: '0.02em',
              }}
            >
              {(downloaded / 1024).toFixed(1)} GB / {(total / 1024).toFixed(1)} GB
            </Text>
          </Flex>
        </Box>

        {/* Helpful message */}
        <Box
          mt="6"
          py="3"
          px="6"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#007AFF',
                boxShadow: '0 0 10px rgba(0, 122, 255, 0.6)',
                animation: 'pulse 2s ease-in-out infinite',
                flexShrink: 0,
                marginTop: '7px',
              }}
            />
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '13px',
                lineHeight: '1',
              }}
            >
              This only happens once • Can take up to 10 minutes
            </span>
          </div>
        </Box>
      </Flex>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.05);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
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
