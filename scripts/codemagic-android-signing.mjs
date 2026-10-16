import fs from 'node:fs';
import path from 'node:path';

const keys = {
  storeFile: process.env.CM_KEYSTORE_PATH,
  storePassword: process.env.CM_KEYSTORE_PASSWORD,
  keyAlias: process.env.CM_KEY_ALIAS,
  keyPassword: process.env.CM_KEY_PASSWORD,
};
for (const [name, value] of Object.entries(keys)) {
  if (!value || /[\r\n]/.test(value)) throw new Error(`Missing or invalid Codemagic signing value: ${name}`);
}
if (!fs.existsSync(keys.storeFile)) throw new Error('Codemagic Android keystore file not found');
const escapeProp = (value) => value.replace(/\\/g, '\\\\').replace(/([:=#!])/g, '\\$1').replace(/^ /, '\\ ');
const destination = path.join('android', 'keystore.properties');
fs.writeFileSync(destination, Object.entries(keys).map(([k, v]) => `${k}=${escapeProp(v)}`).join('\n') + '\n', {mode: 0o600, flag: 'w'});
fs.chmodSync(destination, 0o600);
console.log('Private Android signing file prepared (contents withheld, gitignored).');
