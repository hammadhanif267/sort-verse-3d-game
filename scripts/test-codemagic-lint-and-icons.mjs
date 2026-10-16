import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const game = fs.readFileSync(path.join(root, 'src/components/game/GameplayScene.jsx'), 'utf8');
const splash = fs.readFileSync(path.join(root, 'src/components/SplashLoader.jsx'), 'utf8');
const yaml = fs.readFileSync(path.join(root, 'codemagic.yaml'), 'utf8');
const rewardEffect = game.slice(game.indexOf('    let claimedSpecialReward = false;'), game.indexOf('    playKidVoice(awardedCoins'));
assert.ok(rewardEffect.includes('window.setTimeout(() => {'), 'reward state should update asynchronously');
assert.ok(!rewardEffect.includes('setSpecialWon(true);\n      }'), 'the former synchronous effect update must be removed');
assert.ok(!/\n\s*setActualReward\(/.test(rewardEffect.split('window.setTimeout(() => {')[0]), 'no direct reward setState in effect');
assert.ok(!splash.includes('// eslint-disable-next-line react-hooks/exhaustive-deps'), 'unused lint exception removed');
const iconCatalog = path.join(root, 'native-assets/ios/AppIcon.appiconset/Contents.json');
assert.ok(fs.existsSync(iconCatalog),
  'Missing iOS icon assets in the checkout. Commit native-assets/ios/AppIcon.appiconset/ to GitHub (git add -f native-assets/ios/AppIcon.appiconset).');
const config = JSON.parse(fs.readFileSync(iconCatalog, 'utf8'));
assert.ok(config.images.length >= 15);
assert.ok(config.images.some(({ idiom, size }) => idiom === 'ios-marketing' && size === '1024x1024'));
for (const item of config.images) assert.ok(fs.existsSync(path.join(root, 'native-assets/ios/AppIcon.appiconset', item.filename)));
for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
  for (const file of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
    assert.ok(fs.existsSync(path.join(root, `native-assets/android/res/mipmap-${density}`, file)));
  }
}
assert.equal((yaml.match(/node scripts\/configure-ios-icons\.mjs/g) || []).length, 2,
  'both iOS workflows should apply the supplied app icon');
for (const file of ['src/app/favicon.ico', 'src/app/icon.png', 'src/app/apple-icon.png','public/icons/icon-512.png','store-assets/icon-512.png']) {
  assert.ok(fs.existsSync(path.join(root, file)));
}
// Simulate the generated Capacitor iOS project, verify the generated asset
// catalog is installed correctly, and that rerunning does not corrupt it.
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sv-app-icons-'));
try {
  const dest = path.join(temp, 'ios/App/App/Assets.xcassets');
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(path.join(root, 'native-assets/ios'), path.join(temp, 'native-assets/ios'), { recursive: true });
  const script = path.join(root, 'scripts/configure-ios-icons.mjs');
  for (let i = 0; i < 2; i++) {
    const result = spawnSync(process.execPath, [script], { cwd: temp, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
  const installed = JSON.parse(fs.readFileSync(path.join(dest, 'AppIcon.appiconset/Contents.json'), 'utf8'));
  assert.equal(installed.images.length, config.images.length);
} finally { fs.rmSync(temp, { recursive:true, force:true }); }
console.log('PASS: lint regression, Android/iOS launcher assets, and idempotent iOS icon install');
