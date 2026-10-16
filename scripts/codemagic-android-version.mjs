import fs from 'node:fs';

const n = Number.parseInt(process.env.BUILD_NUMBER || '', 10);
if (!Number.isSafeInteger(n) || n < 1) throw new Error('Codemagic BUILD_NUMBER must be a positive integer');
const file = 'android/app/build.gradle';
const source = fs.readFileSync(file, 'utf8');
if (!/\bversionCode\s+\d+/.test(source)) throw new Error('Cannot find Gradle versionCode; inspect generated Android template');
fs.writeFileSync(file, source.replace(/\bversionCode\s+\d+/, `versionCode ${n}`));
console.log(`Android release versionCode set to ${n}. Check it exceeds any version already uploaded to Play.`);
