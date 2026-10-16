import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const file = fileURLToPath(new URL("../src/app/favicon.ico", import.meta.url));
const data = readFileSync(file);
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

assert.equal(data.readUInt16LE(0), 0, "Invalid ICO header");
assert.equal(data.readUInt16LE(2), 1, "Not an ICO file");
const count = data.readUInt16LE(4);
assert.ok(count >= 4, "Expected multiple favicon sizes");
const sizes = [];
for (let i = 0; i < count; i++) {
  const index = 6 + i * 16;
  assert.ok(index + 16 <= data.length, "Truncated ICO directory");
  const length = data.readUInt32LE(index + 8);
  const offset = data.readUInt32LE(index + 12);
  assert.ok(offset + length <= data.length, "Truncated ICO image");
  const embedded = data.subarray(offset, offset + length);
  assert.ok(embedded.subarray(0, 8).equals(pngSignature), `ICO image ${i} must contain PNG`);
  const width = embedded.readUInt32BE(16);
  const height = embedded.readUInt32BE(20);
  const bitDepth = embedded[24];
  const colorType = embedded[25];
  assert.equal(bitDepth, 8, `ICO image ${width}x${height} must be 8-bit`);
  assert.equal(colorType, 6, `ICO image ${width}x${height} must be RGBA (PNG color type 6)`);
  assert.equal(width, height, "Icon must be square");
  sizes.push(width);
}
console.log(`PASS: favicon.ico has ${count} valid 8-bit RGBA PNG images: ${sizes.join(", ")}`);
