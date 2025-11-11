#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const GITHUB_TOKEN = process.env.GH_TOKEN;
const REPO_OWNER = 'projectsthataremine';
const REPO_NAME = 'narraflow';

// Read version from package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const VERSION = packageJson.version;
const TAG_NAME = `v${VERSION}`;

const DIST_DIR = path.join(__dirname, '../dist');

// ARM64 (Mac Silicon) files only
const FILES_TO_UPLOAD = [
  `NarraFlow-${VERSION}-arm64-mac.zip`,
  `NarraFlow-${VERSION}-arm64-mac.zip.blockmap`,
  `NarraFlow-${VERSION}-arm64.dmg`,
  `NarraFlow-${VERSION}-arm64.dmg.blockmap`,
];

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch (e) {
            resolve({});
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      if (typeof data === 'string') {
        req.write(data);
      } else {
        // Stream the file
        data.on('error', reject);
        data.pipe(req);
      }
    } else {
      req.end();
    }
  });
}

async function createDraftRelease() {
  console.log(`📝 Creating DRAFT release ${TAG_NAME}...`);

  const releaseData = JSON.stringify({
    tag_name: TAG_NAME,
    name: TAG_NAME,
    body: `Release ${TAG_NAME}`,
    draft: true,  // Keep as draft until all files uploaded
    prerelease: false,
  });

  const options = {
    hostname: 'api.github.com',
    path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases`,
    method: 'POST',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'User-Agent': 'NarraFlow-Publisher',
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(releaseData),
    },
  };

  return makeRequest(options, releaseData);
}

async function publishRelease(releaseId) {
  console.log(`\n🚀 Publishing release...`);

  const updateData = JSON.stringify({
    draft: false,  // Make it public
  });

  const options = {
    hostname: 'api.github.com',
    path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases/${releaseId}`,
    method: 'PATCH',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'User-Agent': 'NarraFlow-Publisher',
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(updateData),
    },
  };

  return makeRequest(options, updateData);
}

async function uploadAsset(releaseId, filename) {
  const filePath = path.join(DIST_DIR, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filename}`);
  }

  const fileSize = fs.statSync(filePath).size;
  const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

  console.log(`📤 Uploading ${filename} (${fileSizeMB} MB)...`);

  const fileStream = fs.createReadStream(filePath);

  const options = {
    hostname: 'uploads.github.com',
    path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases/${releaseId}/assets?name=${encodeURIComponent(filename)}`,
    method: 'POST',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'User-Agent': 'NarraFlow-Publisher',
      'Content-Type': 'application/octet-stream',
      'Content-Length': fileSize,
    },
  };

  await makeRequest(options, fileStream);
  console.log(`✅ Uploaded ${filename}`);
}

async function main() {
  if (!GITHUB_TOKEN) {
    console.error('❌ GH_TOKEN not found in environment. Make sure .env file exists with GH_TOKEN set.');
    process.exit(1);
  }

  console.log(`\n📦 Publishing NarraFlow ${VERSION} to GitHub`);
  console.log(`📍 Repo: ${REPO_OWNER}/${REPO_NAME}`);
  console.log(`🔑 Token: ${GITHUB_TOKEN.substring(0, 10)}...${GITHUB_TOKEN.substring(GITHUB_TOKEN.length - 4)}\n`);

  let release;

  try {
    // Step 1: Create draft release
    release = await createDraftRelease();
    console.log(`✅ Created draft release (ID: ${release.id})\n`);

    // Step 2: Upload all assets
    for (const filename of FILES_TO_UPLOAD) {
      await uploadAsset(release.id, filename);
    }

    // Step 3: Publish the release (make it public)
    const publishedRelease = await publishRelease(release.id);

    console.log(`\n✅ Successfully published ${TAG_NAME}!`);
    console.log(`🔗 ${publishedRelease.html_url}\n`);

  } catch (error) {
    console.error('\n❌ Publishing failed:', error.message);

    if (release) {
      console.log(`\n⚠️  Draft release was created but not published (ID: ${release.id})`);
      console.log(`   You can manually delete it or finish uploading at:`);
      console.log(`   https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`);
    }

    process.exit(1);
  }
}

main();
