import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const levelCode=readFileSync(new URL('../src/lib/levelMissions.js',import.meta.url),'utf8');
const {getMission}=await import(`data:text/javascript,${encodeURIComponent(levelCode)}`);
const text=readFileSync(new URL('../src/components/game/GameplayScene.jsx',import.meta.url),'utf8');
// Only the pure board generator is extracted, not React or JSX; keeps this runnable without npm.
const source=text.slice(text.indexOf('const CAPACITY = 4;'),text.indexOf('/**\n * Animates a number')).replace('export function difficultyParams','function difficultyParams');
const generatePuzzle=new Function('getMission',`${source}\nreturn generatePuzzle;`)(getMission);
const {isSorted,legalMoves,applySortMove} = await import(`data:text/javascript,${encodeURIComponent(readFileSync(new URL('../src/lib/sortMoves.js',import.meta.url),'utf8'))}`);
let boards=0, noProof=[];
for(const difficulty of ['normal','hard','expert']) for(let level=1;level<=12;level++){
  const board=generatePuzzle({difficulty,level});
  assert.equal(board.tubes.length,8,`${difficulty}-${level} tube count`);
  const pieces=board.tubes.flatMap(x=>x.objects);
  assert.equal(pieces.length,getMission(difficulty,level).colorCount*4,`${difficulty}-${level} piece count`);
  const colors={};for(const piece of pieces) colors[piece.color]=(colors[piece.color]||0)+1;
  assert.ok(Object.values(colors).every(x=>x===4),`${difficulty}-${level} no missing pieces`);
  assert.ok(board.par>0,`${difficulty}-${level} par`);
  assert.ok(legalMoves(board.tubes).length,`${difficulty}-${level} legal opening move`);
  assert.ok(!isSorted(board.tubes),`${difficulty}-${level} not solved at start`);
  const features=getMission(difficulty,level).features;
  if(features.includes('frozen')) assert.ok(pieces.some(x=>x.frozen),`${difficulty}-${level} must contain ice`);
  if(features.includes('chains')) assert.ok(pieces.some(x=>x.chainLayers),`${difficulty}-${level} must contain chains`);
  if(features.includes('bombs')) assert.ok(pieces.some(x=>x.bombTurns!=null),`${difficulty}-${level} must contain bombs`);
  if(features.includes('mystery')) assert.ok(pieces.some(x=>x.mystery),`${difficulty}-${level} must contain mystery`);
  if(features.includes('rainbow')) assert.ok(pieces.some(x=>x.rainbow),`${difficulty}-${level} must contain rainbow`);
  if(features.includes('key')) assert.ok(board.tubes.some(x=>x.sealed),`${difficulty}-${level} must contain gate`);
  if(!board.solverVerified)noProof.push(`${difficulty}-${level}`);
  boards++;
  console.log(`${difficulty}-${level} par=${board.par} solver=${board.solverVerified}`);
}
console.log(`PASS: ${boards} generated boards have correct colors and legal opening moves. Unproven plain solver boards: ${noProof.join(',')||'none'}`);
