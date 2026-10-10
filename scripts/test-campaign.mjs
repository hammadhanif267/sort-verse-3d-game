import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../src/lib/levelMissions.js', import.meta.url), 'utf8');
const { getMission, canEnterDifficulty, getStarRating } = await import(`data:text/javascript,${encodeURIComponent(source)}`);
for (const tier of ['normal', 'hard', 'expert']) for (let i=1; i<=12; i++) {
  const mission = getMission(tier,i);
  assert.ok(mission.title && mission.objective);
  assert.ok(mission.colorCount <= 5 && mission.emptyTubes >= 1);
  if (mission.timeSeconds != null) assert.ok(mission.timeSeconds >= 175);
}
assert.equal(getMission('normal',1).timeSeconds,null);
assert.deepEqual(getMission('expert',6).features.includes('doubleChain'),true);
assert.ok(canEnterDifficulty('hard',{normal:4}));
assert.ok(!canEnterDifficulty('hard',{normal:3}));
assert.ok(canEnterDifficulty('expert',{hard:6}));
assert.equal(getStarRating(20,18),3);
assert.equal(getStarRating(45,18),1);
console.log('PASS: 36 named missions, sensible timers, early unlocks, balanced rating thresholds');
