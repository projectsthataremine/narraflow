/**
 * Preload script
 * Exposes safe IPC methods to renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';

console.log('[Preload] Script starting...');

// IPC channel constants (inlined to avoid import issues in preload context)
const IPC_CHANNELS = {
  START_RECORDING: 'ipc:start-recording',
  STOP_RECORDING: 'ipc:stop-recording',
  AUDIO_DATA: 'ipc:audio-data',
  PASTE_TEXT: 'ipc:paste-text',
  VAD_UPDATE: 'ipc:vad-update',
  ERROR_NOTIFICATION: 'ipc:error-notification',
  UI_STATE_UPDATE: 'ipc:ui-state-update',
  PILL_CONFIG_UPDATE: 'ipc:pill-config-update',
  TRANSCRIBE: 'worker:transcribe',
  REWRITE_TEXT: 'worker:rewrite-text',
} as const;

// Expose electron API to renderer
contextBridge.exposeInMainWorld('electron', {
  // Send messages to main process
  send: (channel: string, data: any) => {
    const validChannels = Object.values(IPC_CHANNELS);
    if (validChannels.includes(channel as any)) {
      ipcRenderer.send(channel, data);
    }
  },

  // Receive messages from main process
  on: (channel: string, callback: (data: any) => void) => {
    const validChannels = Object.values(IPC_CHANNELS);
    if (validChannels.includes(channel as any)) {
      ipcRenderer.on(channel, (_event, data) => callback(data));
    }
  },

  // Invoke (request-response)
  invoke: async (channel: string, data: any) => {
    const validChannels = Object.values(IPC_CHANNELS);
    if (validChannels.includes(channel as any)) {
      return await ipcRenderer.invoke(channel, data);
    }
  },
});

console.log('[Preload] window.electron exposed successfully');
