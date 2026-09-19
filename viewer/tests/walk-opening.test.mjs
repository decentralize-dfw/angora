import test from 'node:test';
import assert from 'node:assert/strict';
import {WalkSurface} from '../src/walk-surface.js';

test('Central entry faces the open corridor instead of the nearby wall',()=>{
  const rows=Array.from({length:12},(_,row)=>row>=4&&row<=7?[[1,10,0,0]]:[]);
  const surface=new WalkSurface({coordinate_system:'glTF_Y_up',eye_height_m:1.68,maximum_step_m:.25,
    grid:{x:0,z:0,step:.25,width:12,height:12},layers:[{rows},...Array.from({length:3},()=>({rows:[]}))]});
  const yaw=surface.openingYaw([.625,1.68,1.375],0);
  assert.ok(-Math.sin(yaw)>.9,'must face the long open side to the right');
  assert.ok(Math.abs(Math.cos(yaw))<.4,'must not face the close north wall');
  assert.equal(surface.openingYaw([100,1.68,100],.7),.7,'invalid start retains authored direction');
});
