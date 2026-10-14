import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const receipt = readFileSync(new URL("../src/app/ranking/page.js", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/gameplay/page.js", import.meta.url), "utf8");
const board = readFileSync(new URL("../src/components/game/GameplayScene.jsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

for (const key of ["Overall performance receipt", "receiptDetails(selectedPerformance)", "Save Receipt", "Share Receipt", "selectedPerformance.isOverall", "overflow-y-auto", "Receipt actions"]) {
  assert.ok(receipt.includes(key), `Receipt UI lost ${key}`);
}
assert.match(receipt, /\{!selectedPerformance && <BottomNav active="ranking" \/>\}/, "Ranking nav must not obscure open receipts");
assert.match(receipt, /role="dialog" aria-modal="true"/, "Receipt needs a dialog container");
assert.match(receipt, /flex h-full max-h-full min-h-0/, "Receipt should fit short phone screens");
assert.match(receipt, /min-h-0 flex-1 overflow-y-auto/, "Receipt details must scroll independently");
assert.match(page, /\{!levelCompleted && \(\s*<>\s*<h2 className="sv-mission-instruction[^]*?\{mission.title\}<\/h2>[\s\S]*?<p className="sv-mission-instruction[^]*?\{mission.objective\}/, "Title and objective must both hide on completion");
assert.ok(board.includes('data-sortverse-level-complete="true"'), "Victory overlay needs a completion marker");
assert.ok(css.includes(':has([data-sortverse-level-complete]) .sv-mission-instruction'), "Completion marker needs CSS fallback");
assert.ok(board.includes('onCompletionChange?.(false)'), "Restart must restore instructions");
assert.match(board, /<span>\{mechanicFlash \|\| primaryCoachText\}<\/span>/, "Mechanic alerts should share the existing lower feedback row");
assert.doesNotMatch(board, /absolute top-\[13%\]/, "Mechanic alerts must not cover the mission objective");
assert.match(board, /data-sortverse-level-complete="true"[^>]*overflow-y-auto/, "Victory results must scroll on short phones");
assert.match(board, /relative my-auto w-full max-w-sm shrink-0/, "Victory card must remain accessible inside its scroll container");
assert.ok(board.includes('setMechanicFlash(null);'), "Play Again should clear stale mechanic alerts");

console.log("PASS: receipts, victory header/scrolling, and non-overlapping mechanic alerts");
