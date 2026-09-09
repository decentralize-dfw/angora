import test from 'node:test';
import assert from 'node:assert/strict';
import {PendingAction} from '../src/pending-action.js';
test('Leaving or replacing a room jump prevents a stale callback from reopening the tour',()=>{
  const queue=[];let room=null;
  const pending=new PendingAction(fn=>{queue.push(fn);return queue.length;},()=>{});
  pending.run(()=>room='old',480);pending.cancel();queue[0]();assert.equal(room,null);
  pending.run(()=>room='second',480);pending.run(()=>room='latest',480);
  queue[1]();assert.equal(room,null);queue[2]();assert.equal(room,'latest');
});
