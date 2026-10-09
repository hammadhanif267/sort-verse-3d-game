// Deterministic visual scatter: pure and stable through React Compiler renders.
// Not used for game mechanics or for cryptographic values.
export function scatter(index, channel) {
  let value = Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(channel + 1, 0x85ebca6b);
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
}
