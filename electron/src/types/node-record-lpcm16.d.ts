/**
 * Type declarations for node-record-lpcm16
 */
declare module 'node-record-lpcm16' {
  export interface RecordingOptions {
    sampleRate?: number;
    channels?: number;
    recorder?: string;
    device?: string | null;
  }

  export interface Recording {
    stream(): NodeJS.ReadableStream;
    stop(): void;
  }

  export function record(options: RecordingOptions): Recording;
}
