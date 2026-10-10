import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const code=readFileSync(new URL('../src/lib/sortMoves.js',import.meta.url),'utf8');
const { applySortMove, legalMoves, findBestHint, isSorted }=await import(`data:text/javascript,${encodeURIComponent(code)}`);
const piece=(c,id,extra={})=>({id,color:c,...extra});
const tubes=[
  {id:0,objects:[piece('blue','a'),piece('red','b')]},
  {id:1,objects:[piece('red','c'),piece('red','d')]},
  {id:2,objects:[piece('blue','e',{frozen:true})]},
  {id:3,objects:[piece('red','f',{bombTurns:1})]},
];
const before=JSON.stringify(tubes);
assert.equal(applySortMove(tubes,0,0),null);
assert.equal(applySortMove(tubes,2,1),null);
const moved=applySortMove(tubes,0,1,{tripleBurst:true,targetColor:'red'});
assert.equal(JSON.stringify(tubes),before); // immutable
assert.equal(moved.triple,true);
assert.equal(moved.bombPenaltySeconds,10);
assert.equal(moved.tubes[3].objects[0].bombTurns,null);
assert.ok(!moved.tubes[2].objects[0].frozen || moved.meltedIceIds.length===0);
assert.ok(legalMoves(tubes).length>0);
const hint=findBestHint(tubes);
assert.ok(hint && typeof hint.from==='number');
assert.equal(isSorted([{objects:[piece('red','1'),piece('red','2'),piece('red','3'),piece('red','4')]},{objects:[]}]),true);
const locked = [
  {id:0,objects:[piece('red','a'),piece('red','b')]},
  {id:1,objects:[piece('red','c')]},
  {id:2,sealed:true,objects:[]},
  {id:3,objects:[piece('blue','d')]},
];
assert.ok(!legalMoves(locked).some((move)=>move.to===2), 'cannot use sealed tube');
assert.equal(applySortMove(locked,1,2,{targetColor:'red'}),null);
const opened = applySortMove(locked,1,0,{targetColor:'red'});
assert.equal(opened.gateUnlocked,true);
assert.equal(opened.tubes[2].sealed,false);
const rainbow = [{id:0,objects:[piece('red','ra',{rainbow:true})]},{id:1,objects:[]}];
assert.equal(applySortMove(rainbow,0,1).rainbowCollected,true);
assert.ok(rainbow[0].objects[0].rainbow,'rainbow transfer is immutable');
console.log('PASS: legal moves, immutable obstacles, bomb penalty, triple, hint, sealed gate, rainbow, completion');
