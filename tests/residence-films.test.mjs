import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';
const scope={window:{}};
vm.runInNewContext(await readFile(new URL('../residence-film-runtime.js',import.meta.url),'utf8'),scope);
const {position}=scope.window.AngoraFilmRuntime;
const manifest=JSON.parse(await readFile(new URL('../assets/residence/films/manifest.json',import.meta.url)));
test('three supplied films each consume exactly two viewport scroll distances',()=>{
 assert.equal(manifest.clips.length,3);assert.equal(manifest.scrollScreensPerClip,2);
 assert.deepEqual(manifest.clips.map(c=>c.id),['approach','orbit','garden-return']);
 assert.equal(manifest.clips[2].reversed,true);
 const pixels=6*900;
 for(let i=0;i<3;i++){
  const start=position(i*1800/pixels,manifest.clips),mid=position((i*1800+900)/pixels,manifest.clips);
  assert.equal(start.index,i);assert.equal(start.frame,0);assert.equal(mid.index,i);assert.equal(mid.frame,60);
 }
 assert.equal(position(1,manifest.clips).frame,120);
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
