import fs from 'node:fs';
import path from 'node:path';

// Called after `npx cap add ios` and `npx cap sync ios` on Codemagic.
// The native project is CI-generated and is not checked into the repository.
const root = process.cwd();
const source = path.join(root, 'native-assets/ios/AppIcon.appiconset');
const assets = path.join(root, 'ios/App/App/Assets.xcassets');
if (!fs.existsSync(assets)) {
  console.error('Capacitor iOS asset catalog missing. Run npx cap add ios first.');
  process.exit(1);
}
if (!fs.existsSync(path.join(source, 'Contents.json'))) {
  console.error('Source app icons missing in native-assets/ios.');
  process.exit(1);
}
fs.cpSync(source, path.join(assets, 'AppIcon.appiconset'), { recursive: true, force: true });
console.log('SortVerse iOS launcher icons installed from your supplied artwork.');
