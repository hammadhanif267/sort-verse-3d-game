import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync('capacitor.config.json', 'utf8'));
const appId = String(config.appId || '');
if (!/^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*){2,}$/.test(appId)) {
  throw new Error(`Invalid Capacitor appId: ${appId}`);
}
if (process.argv[2] === 'release' && /(?:yourname|example|placeholder)/i.test(appId)) {
  throw new Error('Release blocked: confirm permanent package ID in capacitor.config.json, and update codemagic.yaml iOS bundle_identifier if using iOS.');
}
console.log(`Capacitor app ID validated: ${appId}`);
