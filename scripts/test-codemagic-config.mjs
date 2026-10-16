import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve('.');
const run = (script, cwd, env = {}) => spawnSync(process.execPath, [path.join(root, 'scripts', script)], {
  cwd,
  env: { ...process.env, ...env },
  encoding: 'utf8',
});
assert.equal(run('codemagic-check.mjs', root).status, 0);
assert.notEqual(run('codemagic-check.mjs', root, {}).stderr.includes('Missing'), true);
const rejected = spawnSync(process.execPath, [path.join(root, 'scripts/codemagic-check.mjs'), 'release'], { cwd: root, encoding: 'utf8' });
assert.notEqual(rejected.status, 0, 'placeholder appId must block release');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sortverse-cm-test-'));
try {
  fs.mkdirSync(path.join(temp, 'android/app'), { recursive: true });
  fs.writeFileSync(path.join(temp, 'android/app/build.gradle'), 'android { defaultConfig { versionCode 1 } }');
  assert.equal(run('codemagic-android-version.mjs', temp, { BUILD_NUMBER: '48' }).status, 0);
  assert.match(fs.readFileSync(path.join(temp, 'android/app/build.gradle'), 'utf8'), /versionCode 48/);
  assert.notEqual(run('codemagic-android-version.mjs', temp, { BUILD_NUMBER: '0' }).status, 0);

  fs.mkdirSync(path.join(temp, 'ios/App/App.xcodeproj'), { recursive: true });
  const pbx = path.join(temp, 'ios/App/App.xcodeproj/project.pbxproj');
  fs.writeFileSync(pbx, 'CURRENT_PROJECT_VERSION = 1;\nCURRENT_PROJECT_VERSION = 1;');
  assert.equal(run('codemagic-ios-version.mjs', temp, { BUILD_NUMBER: '48' }).status, 0);
  assert.equal((fs.readFileSync(pbx, 'utf8').match(/CURRENT_PROJECT_VERSION = 48/g) || []).length, 2);

  const secret = path.join(temp, 'upload-key.jks');
  fs.writeFileSync(secret, 'dummy-not-a-real-keystore');
  const signing = run('codemagic-android-signing.mjs', temp, {
    CM_KEYSTORE_PATH: secret,
    CM_KEYSTORE_PASSWORD: 'test:secret=foo!bar',
    CM_KEY_ALIAS: 'sortverse',
    CM_KEY_PASSWORD: 'test\\password',
  });
  assert.equal(signing.status, 0, signing.stderr);
  assert.ok(!signing.stdout.includes('test:secret'));
  assert.match(fs.readFileSync(path.join(temp, 'android/keystore.properties'), 'utf8'), /storePassword=test\\:secret\\=foo\\!bar/);
  assert.notEqual(run('codemagic-android-signing.mjs', temp, {}).status, 0);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
console.log('PASS: Codemagic release guard, Android/iOS versioning and private signing configuration');
