// Source-level startup guard. Runs without React/Next installed so a release
// cannot accidentally reintroduce a render-time temporal-dead-zone crash.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canEnterDifficulty, getMission } from "../src/lib/levelMissions.js";
import { SPECIAL_MISSIONS } from "../src/lib/playerExperience.js";

const page = readFileSync(new URL("../src/app/gameplay/page.js", import.meta.url), "utf8");
const section = page.split("function GameplayContent() {")[1]?.split("function GameplaySession(")[0] || "";
assert.ok(section.length > 0, "GameplayContent must exist");
for (const name of ["difficultyParam", "difficulty", "specialId", "readUnlocked", "unlocked"]) {
  assert.ok(section.includes(`const ${name} =`), `Missing ${name} initializer`);
}
const difficultyParamAt = section.indexOf("const difficultyParam =");
const difficultyAt = section.indexOf("const difficulty =");
const specialAt = section.indexOf("const specialId =");
const readUnlockedAt = section.indexOf("const readUnlocked =");
const unlockedAt = section.indexOf("const unlocked =");
assert.ok(difficultyParamAt < difficultyAt && difficultyAt < specialAt && specialAt < readUnlockedAt && readUnlockedAt < unlockedAt,
  "Resolve difficulty before special checks and external-store hooks");
assert.match(section, /m\.difficulty === difficulty && m\.level === level/, "Special mission must compare against normalized difficulty");
assert.match(section, /canOpenLevel\(level, difficulty\)/, "Unlock validation must use initialized difficulty");

for (const tier of ["normal", "hard", "expert"]) {
  for (let level = 1; level <= 12; level++) assert.equal(getMission(tier, level).id, level);
}
assert.ok(canEnterDifficulty("normal", {}));
assert.ok(!canEnterDifficulty("hard", { normal: 3 }));
assert.ok(canEnterDifficulty("hard", { normal: 4 }));
assert.ok(!canEnterDifficulty("expert", { hard: 5 }));
assert.ok(canEnterDifficulty("expert", { hard: 6 }));
for (const mission of SPECIAL_MISSIONS) {
  assert.ok(["normal", "hard", "expert"].includes(mission.difficulty));
  assert.ok(getMission(mission.difficulty, mission.level).id === mission.level);
}
console.log("PASS: gameplay route initialization, difficulty unlocks, 36 missions, and special-mission URLs");
