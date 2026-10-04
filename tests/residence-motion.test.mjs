import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const mathScope={window:{}};
vm.runInNewContext(await readFile(new URL('../residence-motion-math.js',import.meta.url),'utf8'),mathScope);
const {galleryIndex,galleryOffset,resamplePolygon,roomBounds}=mathScope.window.AngoraMotionMath;
test('gallery arrows use pixel distances rather than normalized film progress',()=>{
  assert.equal(galleryOffset(760,1000,1200),260);assert.equal(galleryOffset(1800,1000,1200),1200);assert.equal(galleryOffset(240,1000,1200),0);
});
test('wide gallery recognises its final photograph even when it cannot align to the left edge',()=>{
  assert.equal(galleryIndex(1200,[240,760,1280,1800],1000,1200),3);
  assert.equal(galleryIndex(0,[240,760,1280,1800],1000,1200),0);
  assert.equal(galleryIndex(640,[240,760,1280,1800],1000,1200),2);
  assert.equal(galleryIndex(0,[240],1000,0),0);
});
test('opposite contour winding has the same registered start and continuous perimeter',()=>{
  const a=resamplePolygon([[0,0],[100,0],[100,100],[0,100]],16);
  const b=resamplePolygon([[100,100],[100,0],[0,0],[0,100]],16);
  assert.equal(a.length,16);assert.equal(JSON.stringify(a),JSON.stringify(b));
  assert.equal(Math.max(...a.map((p,i)=>Math.hypot(p[0]-a[(i+1)%16][0],p[1]-a[(i+1)%16][1]))),25);
});
test('plan framing includes the registered cameras and house rooms, excluding unrelated render margins',()=>{
  const box=roomBounds({rooms:[{screen:[[.3,.4],[.6,.4],[.6,.8],[.3,.8]]}],photos:[{x:.65,y:.7}]});
  assert.equal(box.x,.3);assert.equal(box.y,.4);assert.ok(Math.abs(box.width-.35)<1e-9);assert.equal(box.height,.4);
});
const source=await readFile(new URL('../residence-steps.js',import.meta.url),'utf8');
function sceneHarness(){
  const events={};let time=0,finish;const moves=[],scrollCalls=[];
  const element={dataset:{},offsetHeight:900,getBoundingClientRect:()=>({top:0,bottom:900})};
  const scope={window:{addEventListener:(n,fn)=>events[n]=fn,AngoraScroll:{start(){},to(){},cancelTravel(){},hold(top){scrollCalls.push(['hold',top]);},release(){scrollCalls.push(['release']);}}},document:{querySelector:()=>null,body:{classList:{contains:()=>false}}},innerHeight:900,scrollY:0,performance:{now:()=>time},console};
  vm.runInNewContext(source,scope);
  const scene=scope.window.AngoraSteps.register(element,3,(a,b)=>{moves.push([a,b]);return new Promise(r=>finish=r);});
  return {scene,moves,scrollCalls,async wheel(direction,at){time=at;events.wheel({deltaY:120*direction,deltaX:0,preventDefault(){},stopImmediatePropagation(){}});await Promise.resolve();},async finish(){finish();await new Promise(setImmediate);}};
}

test('the document is held before any film work and released only after its final frame',async()=>{
  const s=sceneHarness();await s.wheel(1,0);
  assert.deepEqual(s.scrollCalls,[['hold',0]]);
  await s.wheel(1,30);assert.deepEqual(s.scrollCalls,[['hold',0]]);
  await s.finish();assert.deepEqual(s.scrollCalls,[['hold',0],['release']]);
  await s.wheel(-1,1000);assert.deepEqual(s.scrollCalls.at(-1),['hold',0]);await s.finish();
});
test('three wheel gestures complete three films and reverse through every destination without a permanent lock',async()=>{
  const s=sceneHarness();let now=0;
  for(const direction of [1,1,1,-1,-1,-1]){await s.wheel(direction,now);await s.finish();now+=1000;}
  assert.equal(s.scene.index,0);assert.equal(s.scene.gate.busy,false);assert.equal(s.moves.length,6);
});
test('wheel momentum is discarded, while an explicit second tab selection is completed after the current film',async()=>{
  const s=sceneHarness();await s.wheel(1,0);await s.wheel(1,30);assert.equal(s.moves.length,1);
  const request=s.scene.go(3);await s.finish();assert.equal(s.moves.length,2);await s.finish();await request;assert.equal(s.scene.index,3);
  s.scene.reset(0);assert.equal(s.scene.index,0);assert.equal(s.scene.gate.busy,false);
});
test('a large wheel lands at the next film instead of skipping its viewport',async()=>{
  let listener,top=310,played=0,arrived;
  const element={dataset:{},offsetHeight:900,getBoundingClientRect:()=>({top,bottom:top+900})};
  const scope={window:{addEventListener:(n,fn)=>{if(n==='wheel')listener=fn;},AngoraScroll:{start(){},cancelTravel(){},travel:async target=>{arrived=target;top=0;}}},document:{querySelector:()=>null,body:{classList:{contains:()=>false}}},innerHeight:900,scrollY:1200,performance:{now:()=>0},console};
  vm.runInNewContext(source,scope);scope.window.AngoraSteps.register(element,3,()=>played++);
  listener({deltaY:650,deltaX:0,preventDefault(){},stopImmediatePropagation(){}});await new Promise(setImmediate);
  assert.equal(arrived,1510);assert.equal(played,0);assert.equal(element.dataset.step,0);assert.equal(element.dataset.transitioning,'false');
});
