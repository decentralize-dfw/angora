import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';
const scope={window:{}};
vm.runInNewContext(await readFile(new URL('../residence-film-runtime.js',import.meta.url),'utf8'),scope);
const {position,stagedPosition,floorPosition}=scope.window.AngoraFilmRuntime;
const manifest=JSON.parse(await readFile(new URL('../assets/residence/films/manifest.json',import.meta.url)));
test('three supplied films retain their order with longer movement and reading intervals',()=>{
 assert.equal(manifest.clips.length,3);assert.equal(manifest.scrollScreensPerClip,5);
 assert.deepEqual(manifest.clips.map(c=>c.id),['approach','orbit','garden-return']);
 assert.equal(manifest.clips[2].reversed,true);
 const pixels=6*900;
 for(let i=0;i<3;i++){
  const start=position(i*1800/pixels,manifest.clips),mid=position((i*1800+900)/pixels,manifest.clips);
  assert.equal(start.index,i);assert.equal(start.frame,0);assert.equal(mid.index,i);assert.equal(mid.frame,60);
 }
 assert.equal(position(1,manifest.clips).frame,120);
});
test('each camera pauses at its midpoint and destination, then reverses through the same scenes',()=>{
 for(let i=0;i<3;i++){
  for(const local of [.32,.36,.44,.479]){const s=stagedPosition((i+local)/3,manifest.clips);assert.equal(s.frame,60);assert.equal(s.hold,true);}
  for(const local of [.81,.9,.98]){const s=stagedPosition((i+local)/3,manifest.clips);assert.equal(s.frame,120);assert.equal(s.hold,true);}
  const forward=[0,.15,.4,.6,.85].map(p=>stagedPosition((i+p)/3,manifest.clips).frame);
  const backward=[.85,.6,.4,.15,0].map(p=>stagedPosition((i+p)/3,manifest.clips).frame);
  assert.deepEqual(forward,backward.reverse());
 }
});
const native=JSON.parse(await readFile(new URL('../assets/residence/chapters/native-manifest.json',import.meta.url)));
test('native floors hold on each floor and interpolate the actual recording in either direction',()=>{
 for(const key of ['isometric','plans']){
  const track=native[key];
  for(let i=0;i<3;i++){
   const reading=[.01,.2,.44].map(p=>floorPosition((i+p)/3,track));
   assert.ok(reading.every(s=>s.floor===i&&!s.moving&&s.frame===Math.round(track.stops[i]*24)));
   const a=floorPosition((i+.5)/3,track),b=floorPosition((i+.85)/3,track);
   assert.equal(a.moving,true);assert.ok(b.frame>a.frame);
  }
  assert.equal(floorPosition(1,track).floor,3);assert.equal(floorPosition(1,track).frame,Math.round(track.stops[3]*24));
 }
});
test('both native sequences contain every independently decoded frame and four matched plans',async()=>{
 for(const key of ['isometric','plans'])for(let i=0;i<native[key].frames;i++)await access(new URL(`../assets/residence/chapters/${native[key].id}/frame-${String(i).padStart(4,'0')}.webp`,import.meta.url));
 const poses=JSON.parse(await readFile(new URL('../assets/residence/chapters/poses.json',import.meta.url)));
 assert.equal(poses.floors.length,4);
 for(let floor=0;floor<4;floor++){
  await access(new URL(`../assets/residence/chapters/iso-${floor}.webp`,import.meta.url));await access(new URL(`../assets/residence/chapters/plan-${floor}.webp`,import.meta.url));
  assert.ok(poses.floors[floor].photos.length>=7);
  for(const p of poses.floors[floor].photos)assert.ok(p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1);
 }
});
test('backward scroll seeks the earlier film and retains both end boundaries',()=>{
 const values=[1,.82,.66,.5,.32,.15,0,-1,2].map(p=>position(p,manifest.clips));
 assert.deepEqual(values.map(s=>s.index),[2,2,1,1,0,0,0,0,2]);
 assert.equal(values[6].frame,0);assert.equal(values[7].frame,0);assert.equal(values[8].frame,120);
});
test('all published camera frames and original video files exist',async()=>{
 for(const clip of manifest.clips){
  await access(new URL(`../assets/residence/films/${clip.id}/source.mp4`,import.meta.url));
  for(let i=0;i<clip.frames;i++)await access(new URL(`../assets/residence/films/${clip.id}/frame-${String(i).padStart(4,'0')}.webp`,import.meta.url));
 }
 await access(new URL('../assets/residence/films/opening/source.mp4',import.meta.url));
});
