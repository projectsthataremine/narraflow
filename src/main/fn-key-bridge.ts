import { spawn, ChildProcess } from 'child_process';
import { app } from 'electron';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface KeyEvent {
  type: 'KeyEvent';
  keyCode: number;
  pressed: boolean;
  timestamp: number;
}

export interface IPCResponse {
  type: string;
  success: boolean;
  error?: string;
}

export class FnKeyBridge extends EventEmitter {
  private helperProcess: ChildProcess | null = null;
  private isMonitoring = false;
  private helperPath: string;

  constructor() {
    super();

    // Determine helper app path
    if (app.isPackaged) {
      // Production: helper is bundled in Resources
      this.helperPath = path.join(
        process.resourcesPath,
        'fn-key-helper',
        'NarraFlowFnHelper.app',
        'Contents',
        'MacOS',
        'NarraFlowFnHelper'
      );
    } else {
      // Development: use built helper
      this.helperPath = path.join(
        __dirname,
        '..',
        '..',
        'fn-key-helper',
        'build',
        'NarraFlowFnHelper.app',
        'Contents',
        'MacOS',
        'NarraFlowFnHelper'
      );
    }
  }

  async start(): Promise<boolean> {
    if (this.helperProcess) {
      console.warn('[FnKeyBridge] Helper already running');
      return true;
    }

    try {
      console.log('[FnKeyBridge] Starting helper:', this.helperPath);

      // Spawn the Swift helper process
      this.helperProcess = spawn(this.helperPath, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Handle stdout (IPC messages)
      this.helperProcess.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            this.handleIPCMessage(line.trim());
          }
        }
      });

      // Handle stderr (logs)
      this.helperProcess.stderr?.on('data', (data) => {
        console.log('[FnKeyHelper]', data.toString().trim());
      });

      // Handle process exit
      this.helperProcess.on('exit', (code) => {
        console.log(`[FnKeyBridge] Helper exited with code ${code}`);
        this.helperProcess = null;
        this.isMonitoring = false;
        this.emit('helper-exit', code);
      });

      // Handle process errors
      this.helperProcess.on('error', (error) => {
        console.error('[FnKeyBridge] Helper error:', error);
        this.emit('error', error);
      });

      // Wait for ready message
      await this.waitForReady();

      // Start monitoring
      await this.sendCommand({ type: 'StartMonitoring' });
      this.isMonitoring = true;

      console.log('[FnKeyBridge] Helper started and monitoring');
      return true;
    } catch (error) {
      console.error('[FnKeyBridge] Failed to start helper:', error);
      this.stop();
      return false;
    }
  }

  stop(): void {
    if (!this.helperProcess) {
      return;
    }

    console.log('[FnKeyBridge] Stopping helper');

    try {
      // Try graceful shutdown
      this.sendCommand({ type: 'StopMonitoring' }).catch(() => {
        // Ignore errors during shutdown
      });

      // Give it a moment, then force kill
      setTimeout(() => {
        if (this.helperProcess) {
          this.helperProcess.kill();
          this.helperProcess = null;
        }
      }, 500);
    } catch (error) {
      console.error('[FnKeyBridge] Error stopping helper:', error);
      this.helperProcess?.kill();
      this.helperProcess = null;
    }

    this.isMonitoring = false;
  }

  getIsMonitoring(): boolean {
    return this.isMonitoring;
  }

  private async sendCommand(command: any): Promise<void> {
    if (!this.helperProcess || !this.helperProcess.stdin) {
      throw new Error('Helper process not running');
    }

    const json = JSON.stringify(command);
    this.helperProcess.stdin.write(json + '\n');
  }

  private handleIPCMessage(message: string): void {
    try {
      const data = JSON.parse(message);
      console.log('[FnKeyBridge] Received IPC message:', data);

      if (data.type === 'KeyEvent') {
        // Fn key event received
        const event = data as KeyEvent;
        console.log('[FnKeyBridge] 🔑 Fn key event:', event.pressed ? 'PRESSED' : 'RELEASED');
        this.emit('fn-key', event.pressed);
      } else if (data.type === 'ReadyResponse') {
        console.log('[FnKeyBridge] Helper is ready');
        this.emit('ready');
      } else if (data.type?.endsWith('Response')) {
        // Handle response messages
        const response = data as IPCResponse;
        console.log('[FnKeyBridge] Response:', response);
        if (!response.success && response.error) {
          console.error('[FnKeyBridge] Command error:', response.error);
        }
      }
    } catch (error) {
      console.error('[FnKeyBridge] Failed to parse IPC message:', message, error);
    }
  }

  private waitForReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Helper ready timeout'));
      }, 5000);

      this.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }
}

// Singleton instance
let fnKeyBridge: FnKeyBridge | null = null;

export function getFnKeyBridge(): FnKeyBridge {
  if (!fnKeyBridge) {
    fnKeyBridge = new FnKeyBridge();
  }
  return fnKeyBridge;
}

export function cleanupFnKeyBridge(): void {
  if (fnKeyBridge) {
    fnKeyBridge.stop();
    fnKeyBridge = null;
  }
}
