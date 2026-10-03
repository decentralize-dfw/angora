import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../residence-video.js',import.meta.url),'utf8');
function movie(visible=false){
  const classes=new Set(visible?['playing']:[]);let callback;
  return {readyState:4,currentTime:0,duration:5,paused:true,
    classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},
    pause(){this.paused=true;},play(){this.paused=false;return Promise.resolve();},
    requestVideoFrameCallback(fn){callback=fn;return 1;},cancelVideoFrameCallback(){},
    present(){callback();},end(){this.currentTime=5;this.onended();}};
}
function player(){
  const scope={window:{},requestAnimationFrame:()=>1,cancelAnimationFrame(){}};
  vm.runInNewContext(source,scope);return scope.window.AngoraVideo;
}
test('a new movie does not hide the held outgoing frame before its first decoded frame',async()=>{
  const old=movie(true),next=movie(),p=player();let ready=false;
  const done=p.play(next,[old,next],1.65,false,()=>{},()=>ready=true);
  await Promise.resolve();
  assert.equal(old.classList.contains('playing'),true);
  assert.equal(next.classList.contains('playing'),false);assert.equal(ready,false);
  next.present();
  assert.equal(old.classList.contains('playing'),false);
  assert.equal(next.classList.contains('playing'),true);assert.equal(ready,true);
  next.end();await done;
});
test('the destination remains the exact paused movie frame after playback completes',async()=>{
  const next=movie(),p=player();const done=p.play(next,[next],1.4,false);
  next.present();next.end();await done;
  assert.equal(next.currentTime,5);assert.equal(next.paused,true);
  assert.equal(next.classList.contains('playing'),true);
});
