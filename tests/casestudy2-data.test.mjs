import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { FLOWS, LAYERS, clampTime, sceneAt, counterpart } from '../casestudy2-data.js';
import { SCENE_GRADES } from '../casestudy2-grades.js';
const root=new URL('../',import.meta.url);
test('active review recommendations resolve to actual, device-matched library scenes',()=>{
 const refs=new Set();
 for(const flow of Object.values(FLOWS).filter(f=>f.project==='active')){
  for(const scene of flow.scenes){
   const r=scene.review;assert.ok(r&&r.observation&&r.action&&r.avoid);
   assert.ok(['Koru','İncelt','Yeniden ele al'].includes(r.verdict));
   assert.equal(r.scores.length,4);assert.ok(r.scores.every(n=>n===null||(Number.isFinite(n)&&n>=0&&n<=10&&n*2===Math.floor(n*2))));
   assert.equal(r.score,Math.min(...r.scores.filter(n=>n!==null)));
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

test('every cut has its own explicit reasons, source evidence and future acceptance target',()=>{
 for(const flow of Object.values(FLOWS).filter(f=>f.project==='active')){
  assert.deepEqual(Object.keys(SCENE_GRADES[flow.id]).sort(),flow.scenes.map(s=>s.key).sort());
  const observations=new Set();
  for(const scene of flow.scenes){
   const r=scene.review;
   assert.equal(r.method,'2 / individual source review');
   assert.equal(r.reasons.length,4);assert.ok(r.reasons.every(t=>t.length>30));
   assert.ok(!observations.has(r.observation));observations.add(r.observation);
   assert.ok(r.acceptance.length>50);assert.equal(r.action,r.acceptance);
   assert.ok(r.evidence.length>=2);
   for(const e of r.evidence){
    assert.ok(e.sourceTime>=scene.sourceStart&&e.sourceTime<scene.sourceEnd,`${flow.id}/${scene.key}: ${e.sourceTime}`);
    assert.ok(Math.abs(e.sourceTime*60-Math.round(e.sourceTime*60))<.0001,'actual source-frame grid');
    assert.ok(e.note.length>12);
   }
   if(r.repeatOf)assert.ok(flow.scenes.some(s=>s.key===r.repeatOf));
  }
 }
 const source=readFileSync(new URL('casestudy2-active-data.js',root),'utf8');
 assert.doesNotMatch(source,/scores:\s*\[/,'shared recipes must not assign numeric grades');
 assert.equal(FLOWS['active-mobile'].scenes.find(s=>s.key==='camera-point').review.scores[1],null);
});

test('gallery cuts include the actual opening and closing movement',()=>{
 const scenes=FLOWS['active-desktop'].scenes;
 const open=scenes.find(s=>s.key==='gallery-lightbox-open'),close=scenes.find(s=>s.key==='gallery-lightbox-close');
 assert.equal(open.sourceStart,90.2);assert.equal(close.sourceStart,92.1);
 assert.equal(scenes.find(s=>s.key==='gallery-1-2').sourceStart,84.55);
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
