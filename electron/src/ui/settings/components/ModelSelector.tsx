/**
 * Model Selector - Shows all model options with detailed information
 * Shows model name, description, tags, and download status
 */

import React from 'react';
import { Flex, Text, Box, Badge, Tooltip } from '@radix-ui/themes';

interface ModelOption {
  id: string;
  name: string;
  description: string;
  size: string;
  tags: string[];
  isLocal: boolean;
}

interface ModelSelectorProps {
  selectedModel: string;
  downloadingModel: string | null;
  installingModel?: string | null;
  switchingModel?: string | null;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
  modelStatus?: Record<string, boolean>; // Track which models are downloaded
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'small',
    name: 'Small',
    description: '2-3x faster • Less accurate',
    size: '460MB',
    tags: ['Local'],
    isLocal: true,
  },
  {
    id: 'large-v3_turbo',
    name: 'Large',
    description: 'Most accurate • Slower',
    size: '2.7GB',
    tags: ['Local'],
    isLocal: true,
  },
  {
    id: 'groq',
    name: 'Remote XLarge',
    description: 'Ultra-fast • Requires internet',
    size: 'API',
    tags: ['Cloud'],
    isLocal: false,
  },
];

export function ModelSelector({
  selectedModel,
  downloadingModel,
  installingModel = null,
  switchingModel = null,
  onModelChange,
  disabled = false,
  modelStatus = {},
}: ModelSelectorProps) {
  return (
    <Box
      style={{
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.02)',
      }}
    >
      {MODEL_OPTIONS.map((model, index) => {
        const isSelected = selectedModel === model.id;
        const isDownloading = downloadingModel === model.id;
        const isInstalling = installingModel === model.id;
        const isSwitching = switchingModel === model.id;
        const isDownloaded = modelStatus[model.id] === true;
        const isDisabled = isDownloading || isInstalling || disabled;

        return (
          <Flex
            key={model.id}
            justify="between"
            align="center"
            onClick={() => !isDisabled && onModelChange(model.id)}
            style={{
              padding: '14px 16px',
              borderBottom:
                index < MODEL_OPTIONS.length - 1
                  ? '1px solid rgba(255, 255, 255, 0.06)'
                  : 'none',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              background: isSelected
                ? 'rgba(0, 122, 255, 0.08)'
                : isInstalling
                ? 'rgba(0, 122, 255, 0.05)'
                : isDownloading
                ? 'rgba(255, 200, 0, 0.05)'
                : 'transparent',
              transition: 'all 0.15s ease',
              opacity: isDisabled ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isDisabled && !isSelected) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected && !isInstalling && !isDownloading) {
                e.currentTarget.style.background = 'transparent';
              } else if (isSelected) {
                e.currentTarget.style.background = 'rgba(0, 122, 255, 0.08)';
              } else if (isInstalling) {
                e.currentTarget.style.background = 'rgba(0, 122, 255, 0.05)';
              } else if (isDownloading) {
                e.currentTarget.style.background = 'rgba(255, 200, 0, 0.05)';
              }
            }}
          >
            {/* Left: Model info */}
            <Flex direction="column" gap="1">
              <Flex align="center" gap="2">
                <Text size="3" weight="medium" style={{ letterSpacing: '-0.01em' }}>
                  {model.name}
                </Text>
                {model.tags.map((tag) => (
                  <Tooltip
                    key={tag}
                    content={
                      tag === 'Local'
                        ? 'Runs locally on your machine. Most private.'
                        : 'Runs on a remote server. Fast but less private than local.'
                    }
                  >
                    <Badge
                      size="1"
                      color={tag === 'Local' ? 'green' : 'blue'}
                      variant="soft"
                      style={{
                        textTransform: 'uppercase',
                        fontSize: '10px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'help',
                      }}
                    >
                      {tag}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                    </Badge>
                  </Tooltip>
                ))}
                {/* Download status badge - only for local models */}
                {model.isLocal && (
                  <Badge
                    size="1"
                    color={isDownloaded ? 'gray' : isInstalling ? 'blue' : isDownloading ? 'yellow' : 'orange'}
                    variant="soft"
                    style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 600 }}
                  >
                    {isDownloaded ? 'Downloaded' : isInstalling ? 'Installing' : isDownloading ? 'Downloading' : 'Not Downloaded'}
                  </Badge>
                )}
              </Flex>
              <Text size="1" style={{ opacity: 0.6, lineHeight: '1.4' }}>
                {model.isLocal ? `${model.description} • ${model.size}` : model.description}
              </Text>
            </Flex>

            {/* Right: Radio button or spinner */}
            <Box style={{ marginLeft: '16px', flexShrink: 0 }}>
              {isDownloading ? (
                // Download spinner (yellow)
                <Box
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255, 200, 0, 0.3)',
                    borderTop: '2px solid #ffc800',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              ) : isInstalling ? (
                // Installing spinner (blue)
                <Box
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(0, 122, 255, 0.3)',
                    borderTop: '2px solid #007AFF',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              ) : isSwitching ? (
                // Switching spinner (blue)
                <Box
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(0, 122, 255, 0.3)',
                    borderTop: '2px solid #007AFF',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              ) : (
                // Radio button
                <Box
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: '2px solid',
                    borderColor: isSelected ? '#007AFF' : 'rgba(255, 255, 255, 0.3)',
                    background: isSelected ? '#007AFF' : 'transparent',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSelected && (
                    <Box
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#fff',
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
          </Flex>
        );
      })}

      {/* Add spinner animation */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Box>
  );
}
