import test from 'node:test';
import assert from 'node:assert/strict';
import {WalkSurface} from '../src/walk-surface.js';
import {createWalkLocator} from '../src/walk-locator.js';

// A synthetic two-room floor: 10 x 5 cells of walkable ground split by a
// full-height wall at column 5, pierced by one doorway at row 2. Station A
// stands in the west room, station B in the east room. The point of the
// fixture: a cell just east of the wall is EUCLIDEAN-closer to A, but its
// only walk there goes through the doorway - so it must belong to B.
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
  // just past the wall, top corner: closer to A as the crow flies, but the
  // walk goes around through the doorway - it is B's room
  assert.equal(locator.locate(6.5,0.5,0).station.room_id,'east');
  assert.equal(locator.locate(4.5,4.5,0).station.room_id,'west');
  // the doorway cell itself belongs to somebody, never to nobody
  assert.ok(locator.locate(5.5,2.5,0).station);
});

test('Stairs and outdoor ground name themselves instead of borrowing a room', () => {
  const surface=fixture({stair:true});
  const locator=createWalkLocator(surface,{minX:0,maxX:7,minZ:0,maxZ:5});
  const stair=locator.locate(8.5,4.5,0);
  assert.equal(stair.outdoor,true,'past the footprint reads as outdoor');
  const indoors=locator.locate(6.5,4.4,0);
  assert.equal(indoors.outdoor,false);
  // 0.6 m above the storey datum, inside the footprint, reads as stairs
  const surface2=fixture({stair:true});
  const locator2=createWalkLocator(surface2,{minX:0,maxX:10,minZ:0,maxZ:5});
  assert.equal(locator2.locate(8.5,4.5,0).stairs,true);
  // a wall cell has no ground: locate refuses rather than guessing
  assert.equal(locator2.locate(5.5,0.5,0),null);
});
