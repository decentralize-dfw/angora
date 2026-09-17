import test from 'node:test';
import assert from 'node:assert/strict';
import {WalkSurface} from '../src/walk-surface.js';
import {createWalkLocator} from '../src/walk-locator.js';

function fixture({stair=false}={}) {
  const width=10,height=5,rows=[];
  for(let z=0;z<height;z++){
    const runs=[];
    for(let x=0;x<width;x++){
      const wall=x===5&&z!==2;
      const high=stair&&x===8&&z===4;
      runs.push([x,1,high?600:0,wall?1:0]);
    }
    rows.push(runs);
  }
  const empty=Array.from({length:height},()=>[]);
  return new WalkSurface({
    coordinate_system:'glTF_Y_up',eye_height_m:1.6,maximum_step_m:.7,
    grid:{x:0,z:0,step:1,width,height},
    layers:[{rows},{rows:empty},{rows:empty},{rows:empty}],
    stations:[
      {room_id:'west',name:'Salon',floor_index:0,position:[1.5,1.6,2.5]},
      {room_id:'east',name:'Mutfak',floor_index:0,position:[8.5,1.6,2.5]},
    ],
  });
}

test('Zones follow walls, not straight-line distance', () => {
  const surface=fixture();
  const locator=createWalkLocator(surface,{minX:-100,maxX:100,minZ:-100,maxZ:100});
  assert.equal(locator.locate(1.5,2.5,0).station.room_id,'west');
  assert.equal(locator.locate(8.5,2.5,0).station.room_id,'east');
  assert.equal(locator.locate(6.5,0.5,0).station.room_id,'east');
  assert.equal(locator.locate(4.5,4.5,0).station.room_id,'west');
  assert.ok(locator.locate(5.5,2.5,0).station);
});

test('Stairs and outdoor ground name themselves instead of borrowing a room', () => {
  const surface=fixture({stair:true});
  const locator=createWalkLocator(surface,{minX:0,maxX:7,minZ:0,maxZ:5});
  const stair=locator.locate(8.5,4.5,0);
  assert.equal(stair.outdoor,true,'past the footprint reads as outdoor');
  const indoors=locator.locate(6.5,4.4,0);
  assert.equal(indoors.outdoor,false);
  const surface2=fixture({stair:true});
  const locator2=createWalkLocator(surface2,{minX:0,maxX:10,minZ:0,maxZ:5});
  assert.equal(locator2.locate(8.5,4.5,0).stairs,true);
  assert.equal(locator2.locate(5.5,0.5,0),null);
});
