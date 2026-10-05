import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { FLOWS, LAYERS, clampTime, sceneAt, counterpart } from '../casestudy2-data.js';
const root=new URL('../',import.meta.url);
test('active review recommendations resolve to actual, device-matched library scenes',()=>{
 const refs=new Set();
 for(const flow of Object.values(FLOWS).filter(f=>f.project==='active')){
  for(const scene of flow.scenes){
   const r=scene.review;assert.ok(r&&r.observation&&r.action&&r.avoid);
   assert.ok(['Koru','İncelt','Yeniden ele al'].includes(r.verdict));
   assert.equal(r.scores.length,3);assert.ok(r.scores.every(n=>Number.isFinite(n)&&n>=0&&n<=10));
   assert.equal(r.score,+(r.scores.reduce((a,b)=>a+b,0)/3).toFixed(1));
   assert.ok(r.references.length>=1&&r.references.length<=2);
   for(const ref of r.references){
    const target=FLOWS[ref.flow];assert.ok(target,ref.flow);assert.notEqual(target.project,'active');
    assert.equal(target.device,flow.device);
    const referenceScene=target.scenes.find(s=>s.key===ref.key);
    assert.ok(referenceScene,`${scene.key} → ${ref.flow}:${ref.key}`);
    assert.ok(ref.reason.length>40);refs.add(`${ref.flow}:${ref.key}`);
    if(ref.focus){
     assert.ok(ref.focus.sourceStart>=referenceScene.sourceStart&&ref.focus.sourceEnd<=referenceScene.sourceEnd);
     assert.ok(ref.focus.sourceEnd-ref.focus.sourceStart>=1&&ref.focus.note.length>20);
     assert.ok(existsSync(new URL(`assets/casestudy2/focus/${ref.flow}-${ref.key}.jpg`,root)));
    }
   }
  }
 }
 assert.ok(refs.size>=35,'a broad, restrained selection across the four library flows');
 assert.equal(Object.values(FLOWS).filter(f=>f.project!=='active').reduce((n,f)=>n+f.scenes.length,0),92);
});
test('mobile review uses the recorded mobile exit instead of the desktop framing description',()=>{
 const exit=FLOWS['active-mobile'].scenes.find(s=>s.key==='hero-exit');
 assert.match(exit.review.references.find(r=>r.flow==='era-mobile').reason,/Mobil mimari/);
});
test('downloadable inventory matches the player data',()=>{
 const inventory=JSON.parse(readFileSync(new URL('assets/casestudy2/inventory.json',root)));
 assert.deepEqual(inventory.flows,FLOWS);assert.equal(inventory.recordedOn,'2026-10-05');
});
for (const flow of Object.values(FLOWS)) {
 test(`${flow.id}: complete, continuous, source-aligned scene inventory`, () => {
  let end=0;const keys=new Set();
  flow.scenes.forEach((s,i)=>{
   assert.equal(s.id,i+1);assert.ok(!keys.has(s.key));keys.add(s.key);
   assert.ok(Math.abs(s.start-end)<.001);assert.ok(s.end>s.start);
   assert.ok(Math.abs(s.start+flow.offset-s.sourceStart)<.001);
   assert.ok(Math.abs(s.end+flow.offset-s.sourceEnd)<.001);
   assert.ok(s.end<=flow.duration+.001);assert.ok(s.summary&&s.lesson);
   for(const l of s.layers){assert.ok(LAYERS[l.type]);assert.ok(l.range[0]>=0&&l.range[1]<=1&&l.range[0]<=l.range[1]);if(l.box){assert.ok(l.box.length===4);assert.ok(l.box.every(n=>n>=0&&n<=100));}}
   assert.equal(sceneAt(flow,s.start).id,s.id);
   assert.equal(sceneAt(flow,s.end-1/flow.fps).id,s.id);
   assert.equal(clampTime(-999,s),s.start);
   assert.equal(clampTime(999,s),s.end-1/flow.fps);
   const match=counterpart(flow,s);if(match)assert.equal(match.key,s.key);
   end=s.end;
  });
  assert.ok(Math.abs(end-flow.duration)<.001);
 });
 test(`${flow.id}: playable media and matching provenance`,()=>{
  const file=new URL(flow.video,root),provenance=JSON.parse(readFileSync(new URL(flow.video.replace('.mp4','-provenance.json'),root)));
  assert.ok(existsSync(file));assert.ok(statSync(file).size<100*1024*1024);
  assert.ok(Math.abs(+provenance.processed.format.duration-flow.duration)<.02);
  assert.equal(provenance.sourceOffset,flow.offset);
  assert.equal(provenance.processed.streams[0].r_frame_rate,'60/1');
  for(const s of flow.scenes)for(let i=0;i<3;i++)assert.ok(existsSync(new URL(`assets/casestudy2/${flow.project}/stills/${flow.device}-${s.id}-${i}.jpg`,root)));
 });
}
