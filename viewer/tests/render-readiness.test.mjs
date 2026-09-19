import test from 'node:test';
import assert from 'node:assert/strict';
import {waitForGPU} from '../src/render-readiness.js';
function gpu(){
 const queue=[],disposed=[];let status=0,time=0;
 const gl={SYNC_GPU_COMMANDS_COMPLETE:1,ALREADY_SIGNALED:2,CONDITION_SATISFIED:3,WAIT_FAILED:4,isContextLost:()=>false,fenceSync:()=>7,flush(){},clientWaitSync:()=>status,deleteSync:f=>disposed.push(f)};
 return {renderer:{getContext:()=>gl},queue,disposed,options:{schedule:f=>queue.push(f),now:()=>time,timeoutMs:100},step(value,ms=0){status=value;time=ms;queue.shift()();}};
}
test('GPU upload readiness stays pending until the warm-up draw completes',async()=>{
 const g=gpu();let done=false;const result=waitForGPU(g.renderer,g.options).then(()=>{done=true;});
 g.step(0);await Promise.resolve();assert.equal(done,false);assert.equal(g.queue.length,1);
 g.step(3);await result;assert.equal(done,true);assert.deepEqual(g.disposed,[7]);assert.equal(g.queue.length,0);
});
test('Interrupted and timed-out preparation release their fence',async()=>{
 for(const [status,time] of [[4,0],[0,101]]){
  const g=gpu(),result=waitForGPU(g.renderer,g.options);g.step(status,time);
  await assert.rejects(result,/interrupted/);assert.deepEqual(g.disposed,[7]);
 }
});
