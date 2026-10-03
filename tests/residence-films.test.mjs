import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';
const film=JSON.parse(await readFile(new URL('../assets/residence/films/manifest.json',import.meta.url)));
const native=JSON.parse(await readFile(new URL('../assets/residence/chapters/native-manifest.json',import.meta.url)));
const poses=JSON.parse(await readFile(new URL('../assets/residence/chapters/poses.json',import.meta.url)));
const source=await readFile(new URL('../residence-steps.js',import.meta.url),'utf8');
function setup(){
 const handlers={};let time=0,release;const moves=[];
 const element={dataset:{},offsetHeight:900,getBoundingClientRect:()=>({top:0,bottom:900})};
 const scope={window:{addEventListener:(name,fn)=>handlers[name]=fn,AngoraScroll:{stop(){},start(){},to(){}}},document:{querySelector:()=>null,body:{classList:{contains:()=>false}}},innerHeight:900,scrollY:0,performance:{now:()=>time},console};
 vm.runInNewContext(source,scope);
 const scene=scope.window.AngoraSteps.register(element,3,(from,to)=>{moves.push([from,to]);return new Promise(r=>release=r);});
 const wheel=at=>{time=at;handlers.wheel({deltaY:120,deltaX:0,preventDefault(){},stopImmediatePropagation(){}});};
 return {scene,moves,wheel,finish:async()=>{release();await new Promise(setImmediate);},Gate:scope.window.AngoraSteps.GestureGate};
}
test('one wheel burst starts exactly one film, and never queues another while playing',async()=>{
 const s=setup();s.wheel(0);s.wheel(30);s.wheel(90);s.wheel(900);
 assert.deepEqual(s.moves,[[0,1]]);assert.equal(s.scene.index,0);
 await s.finish();assert.equal(s.scene.index,1);
 s.wheel(980);assert.deepEqual(s.moves,[[0,1]]);
 s.wheel(1400);assert.deepEqual(s.moves,[[0,1],[1,2]]);
});
test('three separate mouse gestures complete exactly three transitions and hold at each destination',async()=>{
 const s=setup();for(let i=0;i<3;i++){s.wheel(i*2000);await s.finish();assert.equal(s.scene.index,i+1);}
 assert.deepEqual(s.moves,[[0,1],[1,2],[2,3]]);
 s.wheel(7000);assert.equal(s.moves.length,3);
});
test('trackpad momentum cannot replay a film immediately after the previous one ends',()=>{
 const {Gate}=setup(),gate=new Gate();assert.equal(gate.accept(0),true);
 assert.equal(gate.accept(800),false);gate.finish();assert.equal(gate.accept(900),false);
 assert.equal(gate.accept(1400),true);
});
test('the supplied camera films retain their order, with one complete movie per gesture',async()=>{
 assert.deepEqual(film.clips.map(c=>c.id),['approach','orbit','garden-return']);
 assert.equal(film.clips[2].reversed,true);assert.equal(film.choreography.transitionSeconds,1.65);
 assert.equal(film.choreography.mouseDeltaChangesPlayback,false);
 for(const clip of film.clips)for(const name of ['source','transition','reverse'])await access(new URL(`../assets/residence/films/${clip.id}/${name}.mp4`,import.meta.url));
});
test('all six native floor movies contain actual 2560 by 1440 H.264 samples',async()=>{
 assert.equal(native.width,2560);assert.equal(native.height,1440);assert.equal(native.fps,30);
 for(let level=1;level<4;level++)for(const suffix of ['','-reverse']){
  const file=await readFile(new URL(`../assets/residence/chapters/level-${level}${suffix}.mp4`,import.meta.url));
  const sample=file.indexOf(Buffer.from('avc1'),128);assert.ok(sample>128);
  assert.equal(file.readUInt16BE(sample+28),2560);assert.equal(file.readUInt16BE(sample+30),1440);
 }
});
test('every floor has its actual room polygons, section boundaries, camera points and view directions',async()=>{
 assert.equal(poses.floors.length,4);
 for(let level=0;level<4;level++){
  const f=poses.floors[level];assert.ok(f.photos.length>=7);assert.ok(f.rooms.length>=5);assert.ok(f.contours.length>0);
  for(const p of f.photos){assert.ok(p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1);assert.equal(p.direction.length,2);}
  for(const r of f.rooms){assert.equal(r.screen.length,r.poly.length);assert.equal(r.label.length,2);}
  for(const kind of ['iso','plan'])await access(new URL(`../assets/residence/chapters/${kind}-${level}.webp`,import.meta.url));
 }
});
