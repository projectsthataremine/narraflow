// Quick test to see what settings are loaded
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(
  require('os').homedir(),
  'Library/Application Support/Mic2Text/settings.json'
);

console.log('Settings path:', settingsPath);
console.log('Exists:', fs.existsSync(settingsPath));

if (fs.existsSync(settingsPath)) {
  const data = fs.readFileSync(settingsPath, 'utf-8');
  const settings = JSON.parse(data);
  console.log('\nSettings content:');
  console.log(JSON.stringify(settings, null, 2));
  console.log('\nHotkey config:');
  console.log(JSON.stringify(settings.hotkey, null, 2));
  console.log('\nIs Fn key?', settings.hotkey.key === 'Fn');
}
