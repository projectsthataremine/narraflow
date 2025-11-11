/**
 * History Section
 * Displays and manages transcription history
 */

import React, { useState } from 'react';
import { Flex, Text, Box, Tooltip, IconButton } from '@radix-ui/themes';
import { HistoryItem, ToastState } from './types';
import { CopyIcon, TrashIcon, CheckmarkIcon } from './Icons';
import { IPC_CHANNELS } from '../../../types/ipc-contracts';

interface HistorySectionProps {
  history: HistoryItem[];
  setHistory: (history: HistoryItem[]) => void;
}

// Toast Notification Component
interface ToastProps {
  message: string;
  visible: boolean;
}

function Toast({ message, visible }: ToastProps) {
  return (
    <div style={{
      position: 'fixed',
      bottom: visible ? '24px' : '-100px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      padding: '12px 20px',
      border: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: 10000,
      opacity: visible ? 1 : 0,
      transition: 'all 0.3s ease-in-out',
      pointerEvents: 'none',
      fontFamily: 'var(--font-system)',
    }}>
      <div style={{
        width: '18px',
        height: '18px',
        background: 'var(--accent-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <CheckmarkIcon />
      </div>
      <span>{message}</span>
    </div>
  );
}

export function HistorySection({ history, setHistory }: HistorySectionProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '' });

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, 2000);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Transcript copied');
    } catch (error) {
      console.error('[History] Failed to copy:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.electron) {
      try {
        // Immediately remove from UI for instant feedback
        setHistory(history.filter(item => item.id !== id));

        // Delete from backend using invoke instead of send
        const success = await (window.electron as any).invoke(IPC_CHANNELS.HISTORY_DELETE, { id });

        if (success) {
          showToast('Transcript deleted');
        } else {
          console.error('[History] Failed to delete item');
          // Reload history if delete failed
          const updatedHistory = await (window.electron as any).invoke(IPC_CHANNELS.HISTORY_GET);
          setHistory(updatedHistory || []);
        }
      } catch (error) {
        console.error('[History] Delete error:', error);
        // Reload history on error
        const updatedHistory = await (window.electron as any).invoke(IPC_CHANNELS.HISTORY_GET);
        setHistory(updatedHistory || []);
      }
    }
  };

  const handleClear = async () => {
    if (window.electron && confirm('Clear all history? This cannot be undone.')) {
      try {
        await (window.electron as any).invoke(IPC_CHANNELS.HISTORY_CLEAR);
        showToast('History cleared');
      } catch (error) {
        console.error('[History] Clear error:', error);
      }
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  // Group history items by date sections
  const groupHistoryByDate = (items: HistoryItem[]) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000; // 24 hours in ms

    const groups: { [key: string]: HistoryItem[] } = {};

    items.forEach(item => {
      const itemDate = new Date(item.timestamp);
      const itemDayStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).getTime();

      let groupKey: string;
      if (itemDayStart === todayStart) {
        groupKey = 'TODAY';
      } else if (itemDayStart === yesterdayStart) {
        groupKey = 'YESTERDAY';
      } else {
        // Format as "Month Day, Year" (e.g., "October 10, 2025")
        groupKey = itemDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  };

  const groupedHistory = groupHistoryByDate(history);

  return (
    <>
      <Toast message={toast.message} visible={toast.visible} />
      <div>
      {history.length === 0 ? (
        <Box style={{
          padding: '64px 32px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <Text size="4" weight="medium" mb="2">
            No history yet
          </Text>
          <Text size="3" color="gray">
            Your transcriptions will appear here
          </Text>
        </Box>
      ) : (
        <div>
          {Object.entries(groupedHistory).map(([dateLabel, items], groupIndex) => (
            <div key={dateLabel} style={{ marginBottom: groupIndex < Object.keys(groupedHistory).length - 1 ? '32px' : '0' }}>
              <Text size="1" weight="bold" mb="3" style={{
                color: 'var(--accent-9)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {dateLabel}
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {items.map((item, index) => (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  padding: '20px 0',
                  borderBottom: index < items.length - 1 ? '1px solid var(--border-light)' : 'none',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  opacity: 0.7,
                  minWidth: '80px',
                  fontFamily: 'var(--font-system)',
                }}>
                  {new Date(item.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '15px',
                    color: 'var(--text-primary)',
                    lineHeight: '1.5',
                    wordBreak: 'break-word',
                  }}>
                    {item.text}
                  </div>
                </div>
                <Flex
                  gap="3"
                  style={{
                    flexShrink: 0,
                    opacity: hoveredItem === item.id ? 1 : 0,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <Tooltip content="Copy transcript">
                    <IconButton
                      onClick={() => handleCopy(item.text)}
                      size="2"
                      variant="ghost"
                    >
                      <CopyIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip content="Delete transcript">
                    <IconButton
                      onClick={() => handleDelete(item.id)}
                      size="2"
                      variant="ghost"
                      color="red"
                    >
                      <TrashIcon />
                    </IconButton>
                  </Tooltip>
                </Flex>
              </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
