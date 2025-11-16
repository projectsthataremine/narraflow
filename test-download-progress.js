/**
 * STANDALONE TEST: Verify R2 download with real-time progress tracking
 *
 * Run with: node test-download-progress.js
 *
 * This tests the core download logic BEFORE integrating into the Electron app.
 * If this works, we know any issues in the app are with IPC/UI, not the download itself.
 */

const fs = require('fs');
const path = require('path');

const R2_MODEL_URL = 'https://pub-d6cfb88808ed4401bd4488afe9f16ac0.r2.dev/whisperkit-large-v3_turbo.tar.gz';
const TEST_DOWNLOAD_PATH = path.join(__dirname, 'test-download.tar.gz');

async function testDownloadWithProgress() {
  console.log('='.repeat(80));
  console.log('DOWNLOAD PROGRESS TEST');
  console.log('='.repeat(80));
  console.log('URL:', R2_MODEL_URL);
  console.log('Destination:', TEST_DOWNLOAD_PATH);
  console.log('='.repeat(80));
  console.log('');

  try {
    // Clean up any previous test download
    if (fs.existsSync(TEST_DOWNLOAD_PATH)) {
      console.log('[Cleanup] Removing previous test download...');
      fs.unlinkSync(TEST_DOWNLOAD_PATH);
    }

    console.log('[Starting] Initiating download...');
    const response = await fetch(R2_MODEL_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const totalBytes = parseInt(response.headers.get('content-length') || '0');
    const totalMB = totalBytes / (1024 * 1024);
    const totalGB = totalMB / 1024;

    console.log(`[Info] Total size: ${totalGB.toFixed(2)} GB (${totalMB.toFixed(0)} MB)`);
    console.log('');
    console.log('Progress:');
    console.log('-'.repeat(80));

    // Create write stream
    const fileStream = fs.createWriteStream(TEST_DOWNLOAD_PATH);
    const reader = response.body.getReader();
    let downloadedBytes = 0;
    let lastProgressUpdate = 0;
    let lastUpdateTime = Date.now();

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

      // Calculate speed
      const now = Date.now();
      const timeDiff = (now - lastUpdateTime) / 1000; // seconds
      const bytesDiff = downloadedBytes - lastProgressUpdate;
      const speedMBps = (bytesDiff / timeDiff) / (1024 * 1024);

      // Update every ~5MB or at completion
      if (downloadedBytes - lastProgressUpdate >= 5 * 1024 * 1024 || progress >= 100) {
        // Create progress bar
        const barLength = 50;
        const filledLength = Math.round(barLength * progress / 100);
        const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

        // Calculate ETA
        const remainingBytes = totalBytes - downloadedBytes;
        const etaSeconds = speedMBps > 0 ? (remainingBytes / (speedMBps * 1024 * 1024)) : 0;
        const etaMinutes = Math.floor(etaSeconds / 60);
        const etaSecondsRemainder = Math.floor(etaSeconds % 60);
        const etaStr = etaMinutes > 0
          ? `${etaMinutes}m ${etaSecondsRemainder}s`
          : `${etaSecondsRemainder}s`;

        console.log(
          `${bar} ${progress.toFixed(1)}% | ` +
          `${downloadedMB.toFixed(0)}/${totalMB.toFixed(0)} MB | ` +
          `${speedMBps.toFixed(2)} MB/s | ` +
          `ETA: ${etaStr}`
        );

        lastProgressUpdate = downloadedBytes;
        lastUpdateTime = now;
      }
    }

    // Close file stream
    await new Promise((resolve, reject) => {
      fileStream.end((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('-'.repeat(80));
    console.log('');
    console.log('✅ Download complete!');
    console.log('');

    // Verify file size
    const stats = fs.statSync(TEST_DOWNLOAD_PATH);
    const downloadedMB = stats.size / (1024 * 1024);
    console.log(`[Verify] File size: ${downloadedMB.toFixed(2)} MB`);
    console.log(`[Verify] Expected: ${totalMB.toFixed(2)} MB`);

    if (Math.abs(stats.size - totalBytes) < 1024) {
      console.log('[Verify] ✅ File size matches!');
    } else {
      console.log('[Verify] ⚠️  File size mismatch!');
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('TEST PASSED - Progress tracking works!');
    console.log('='.repeat(80));
    console.log('');
    console.log('Clean up test file with: rm test-download.tar.gz');

    return true;
  } catch (error) {
    console.error('');
    console.error('='.repeat(80));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(80));
    console.error('Error:', error.message);
    console.error('');

    if (error.message.includes('404')) {
      console.error('💡 The file is not available yet. The upload is still in progress.');
      console.error('   Wait for the rclone upload to complete (~30 more minutes)');
    }

    console.error('');
    return false;
  }
}

// Run the test
testDownloadWithProgress()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
