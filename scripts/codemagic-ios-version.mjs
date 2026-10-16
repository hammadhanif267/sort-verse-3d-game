import fs from 'node:fs';

const n = Number.parseInt(process.env.BUILD_NUMBER || '', 10);
if (!Number.isSafeInteger(n) || n < 1) throw new Error('Codemagic BUILD_NUMBER must be a positive integer');
const file = 'ios/App/App.xcodeproj/project.pbxproj';
const source = fs.readFileSync(file, 'utf8');
if (!/CURRENT_PROJECT_VERSION\s*=\s*\d+;/.test(source)) throw new Error('Could not find iOS CURRENT_PROJECT_VERSION in the generated project');
fs.writeFileSync(file, source.replace(/CURRENT_PROJECT_VERSION\s*=\s*\d+;/g, `CURRENT_PROJECT_VERSION = ${n};`));
console.log(`iOS build number set to ${n}. Check it meets App Store Connect versioning requirements.`);
