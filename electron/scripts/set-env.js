/**
 * Set environment variable in .env file for builds
 * Usage: node scripts/set-env.js [dev|prod]
 */

const fs = require('fs');
const path = require('path');

const env = process.argv[2];

if (!env || !['dev', 'prod'].includes(env)) {
  console.error('Usage: node scripts/set-env.js [dev|prod]');
  process.exit(1);
}

// Write to src/.env (this is what gets bundled in the packaged app)
const srcEnvPath = path.join(__dirname, '../src/.env');

try {
  // Read existing .env file to preserve Supabase credentials
  let envContent = '';
  if (fs.existsSync(srcEnvPath)) {
    envContent = fs.readFileSync(srcEnvPath, 'utf8');
  }

  // Remove any existing APP_ENV line
  envContent = envContent.split('\n').filter(line => !line.startsWith('APP_ENV=')).join('\n');

  // Add APP_ENV at the top
  envContent = `APP_ENV=${env}\n${envContent}`;

  // Write back to file
  fs.writeFileSync(srcEnvPath, envContent, 'utf8');
  console.log(`✅ Set APP_ENV=${env} in src/.env file`);
} catch (error) {
  console.error('❌ Failed to write src/.env file:', error);
  process.exit(1);
}
