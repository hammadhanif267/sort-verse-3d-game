import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const iconDir = path.join(root, 'native-assets/android/res');
assert.ok(fs.existsSync(path.join(iconDir, 'mipmap-anydpi-v26/ic_launcher.xml')));
assert.equal(fs.existsSync(path.join(iconDir, 'values/sortverse_colors.xml')), false,
  'legacy duplicate launcher color should not be included in assets');
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'sortverse-android-icons-'));
try {
  const main = path.join(sandbox, 'android/app/src/main');
  const javaDir = path.join(main, 'java/com/example/test');
  const values = path.join(main, 'res/values');
  fs.mkdirSync(javaDir, { recursive: true });
  fs.mkdirSync(values, { recursive: true });
  fs.mkdirSync(path.join(sandbox, 'native-assets/android'), { recursive: true });
  fs.cpSync(iconDir, path.join(sandbox, 'native-assets/android/res'), { recursive: true });
  fs.writeFileSync(path.join(sandbox, 'android/variables.gradle'),
    'ext { compileSdkVersion = 35; targetSdkVersion = 35 }');
  fs.writeFileSync(path.join(main, 'AndroidManifest.xml'),
    '<manifest><application><activity android:name=".MainActivity" /></application></manifest>');
  fs.writeFileSync(path.join(javaDir, 'MainActivity.java'),
    'package com.example.test;\nimport com.getcapacitor.BridgeActivity;\npublic class MainActivity extends BridgeActivity { }');
  fs.writeFileSync(path.join(sandbox, 'android/app/build.gradle'), 'android { }');
  fs.writeFileSync(path.join(values, 'strings.xml'),
    '<resources><string name="app_name">App</string><string name="title_activity_main">App</string></resources>');
  fs.writeFileSync(path.join(values, 'styles.xml'),
    '<resources><style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen"></style></resources>');
  fs.writeFileSync(path.join(values, 'ic_launcher_background.xml'),
    '<resources><color name="ic_launcher_background">#ffffff</color></resources>');
  // Simulate a developer upgrading a project that contains both resources.
  fs.writeFileSync(path.join(values, 'sortverse_colors.xml'),
    '<resources><color name="ic_launcher_background">#020b15</color></resources>');
  const script = path.join(root, 'scripts/configure-android.mjs');
  for (let run = 0; run < 2; run++) {
    const result = spawnSync(process.execPath, [script], { cwd: sandbox, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(fs.existsSync(path.join(values, 'sortverse_colors.xml')), false);
    const definitions = fs.readdirSync(values)
      .filter((filename) => filename.endsWith('.xml'))
      .flatMap((filename) => fs.readFileSync(path.join(values, filename), 'utf8')
        .match(/<color\b[^>]*\bname\s*=\s*["']ic_launcher_background["'][^>]*>/g) || []);
    assert.equal(definitions.length, 1, 'exactly one launcher background must remain');
    assert.match(fs.readFileSync(path.join(values, 'ic_launcher_background.xml'), 'utf8'),
      /<color name="ic_launcher_background">#020b15<\/color>/);
    assert.ok(fs.existsSync(path.join(main, 'res/mipmap-xxxhdpi/ic_launcher.png')));
  }
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true });
}
console.log('PASS: no duplicate Android launcher colors; configuration repeatable');
