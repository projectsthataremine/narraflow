/**
 * Simplified WhisperKit model download from Cloudflare R2
 * This is a DRAFT version to replace the multi-part GitHub download
 *
 * TODO: Update R2_MODEL_URL with the actual r2.dev public URL once bucket is made public
 */

import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createWriteStream } from 'fs';

const execAsync = promisify(exec);

// R2 public development URL - file will be accessible once upload completes
const R2_MODEL_URL = 'https://pub-d6cfb88808ed4401bd4488afe9f16ac0.r2.dev/whisperkit-large-v3_turbo.tar.gz';

/**
 * Download WhisperKit model from Cloudflare R2 with progress tracking
 * Much simpler than GitHub multi-part approach!
 */
export async function downloadModelFromR2(
  sendProgress: (progress: number, downloaded: number, total: number) => void
): Promise<boolean> {
  const modelPath = path.join(app.getPath('userData'), 'whisperkit-models');
  const tarballPath = path.join(modelPath, 'whisperkit-large-v3_turbo.tar.gz');
  const extractPath = path.join(modelPath, 'models/argmaxinc/whisperkit-coreml');

  try {
    console.log('[WhisperKit] Downloading model from R2...');
    console.log('[WhisperKit] URL:', R2_MODEL_URL);
    console.log('[WhisperKit] Destination:', tarballPath);

    // Create models directory if it doesn't exist
    if (!fs.existsSync(modelPath)) {
      fs.mkdirSync(modelPath, { recursive: true });
    }

    // Clean up any partial downloads
    if (fs.existsSync(tarballPath)) {
      console.log('[WhisperKit] Removing partial tarball download...');
      fs.unlinkSync(tarballPath);
    }

    // Clean up any partial extractions (< 2GB indicates incomplete)
    const partialModelPath = path.join(extractPath, 'openai_whisper-large-v3_turbo');
    if (fs.existsSync(partialModelPath)) {
      const stats = fs.statSync(partialModelPath);
      if (stats.isDirectory()) {
        // Check directory size
        let totalSize = 0;
        const files = fs.readdirSync(partialModelPath, { recursive: true });
        for (const file of files) {
          const filePath = path.join(partialModelPath, file as string);
          try {
            const fileStats = fs.statSync(filePath);
            if (fileStats.isFile()) {
              totalSize += fileStats.size;
            }
          } catch (err) {
            continue;
          }
        }

        const sizeMB = totalSize / (1024 * 1024);
        if (sizeMB < 2000) {
          console.log('[WhisperKit] Removing partial model extraction (${sizeMB.toFixed(0)} MB)...');
          fs.rmSync(partialModelPath, { recursive: true, force: true });
        }
      }
    }

    // Download with progress tracking
    const response = await fetch(R2_MODEL_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const totalBytes = parseInt(response.headers.get('content-length') || '0');
    const totalMB = totalBytes / (1024 * 1024);

    console.log(`[WhisperKit] Download size: ${totalMB.toFixed(2)} MB`);

    // Create write stream
    const fileStream = createWriteStream(tarballPath);
    const reader = response.body.getReader();
    let downloadedBytes = 0;
    let lastProgressUpdate = 0;

    // Read stream with progress updates
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Write chunk to file
      fileStream.write(value);
      downloadedBytes += value.length;

      // Calculate progress
      const progress = (downloadedBytes / totalBytes) * 100;
      const downloadedMB = downloadedBytes / (1024 * 1024);

      // Send progress update every ~10MB to avoid flooding IPC
      if (downloadedBytes - lastProgressUpdate >= 10 * 1024 * 1024 || progress >= 100) {
        sendProgress(progress, downloadedMB, totalMB);
        console.log(`[WhisperKit] Download progress: ${progress.toFixed(1)}% (${downloadedMB.toFixed(0)} MB / ${totalMB.toFixed(0)} MB)`);
        lastProgressUpdate = downloadedBytes;
      }
    }

    // Close file stream
    await new Promise((resolve, reject) => {
      fileStream.end((err: Error | null | undefined) => {
        if (err) reject(err);
        else resolve(null);
      });
    });

    console.log('[WhisperKit] Download complete, extracting...');
    sendProgress(100, totalMB, totalMB);

    // Extract tar.gz
    if (!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath, { recursive: true });
    }

    console.log('[WhisperKit] Extracting to:', extractPath);
    await execAsync(`tar -xzf "${tarballPath}" -C "${extractPath}"`);

    // Delete tarball after extraction
    fs.unlinkSync(tarballPath);

    console.log('[WhisperKit] ✅ Model downloaded and extracted successfully');
    return true;
  } catch (error) {
    console.error('[WhisperKit] Failed to download model from R2:', error);

    // Clean up partial files on error
    if (fs.existsSync(tarballPath)) {
      console.log('[WhisperKit] Cleaning up partial download...');
      try {
        fs.unlinkSync(tarballPath);
      } catch (cleanupError) {
        console.error('[WhisperKit] Failed to clean up tarball:', cleanupError);
      }
    }

    return false;
  }
}
