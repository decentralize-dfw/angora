import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {areaLabel,labelFontSize,spanLabel} from '../src/annotations.js';
import {ROOM_AREAS} from '../src/room-areas.js';

const rooms=JSON.parse(readFileSync(new URL('../public/models/full/rooms.json',import.meta.url),'utf8'));
const byId=new Map(rooms.rooms.map(room=>[room.id,room]));
const dimensionById=new Map(rooms.dimensions.map(entry=>[entry.id,entry]));

test('Every scheduled area lands on a real room, and none is claimed twice',()=>{
  for(const id of Object.keys(ROOM_AREAS)){
    assert.ok(byId.has(id),`${id} is not a room in the source`);
    assert.ok(ROOM_AREAS[id]>0&&ROOM_AREAS[id]<200,`${id}: ${ROOM_AREAS[id]} m² is not plausible`);
  }
  assert.equal(new Set(Object.keys(ROOM_AREAS)).size,Object.keys(ROOM_AREAS).length);
});

test('The bedroom pairing is corroborated by the substrate areas derived from the R39 solids',()=>{
  const substrate=id=>byId.get(id).area_to_substrate_m2;
  assert.ok(Math.abs(substrate('f2-106')-ROOM_AREAS['f2-106'])<0.15,`${substrate('f2-106')} vs ${ROOM_AREAS['f2-106']}`);
  assert.ok(Math.abs(substrate('f2-107')-ROOM_AREAS['f2-107'])<0.15,`${substrate('f2-107')} vs ${ROOM_AREAS['f2-107']}`);
  assert.ok(ROOM_AREAS['f2-106']>ROOM_AREAS['f2-107']);
  const spans=id=>byId.get(id).dimensions.map(d=>dimensionById.get(d)).filter(e=>e.basis==='dwg_verified').map(e=>e.metres);
  assert.ok(Math.max(...spans('f3-C04'))>=Math.max(...spans('f3-C02')));
  assert.ok(ROOM_AREAS['f3-C04']>ROOM_AREAS['f3-C02']);
});

test('A tag shows the scheduled area, otherwise a registered span, otherwise nothing',()=>{
  let areas=0,spans=0,blank=0;
  for(const room of rooms.rooms){
    const text=areaLabel(room,rooms);
    assert.doesNotMatch(text,/doğrulan/,`${room.name} still shows a status`);
    if(ROOM_AREAS[room.id]){
      assert.match(text,/^\d+,\d{2} m²$/,`${room.name}: ${text}`);areas++;
    } else if(Number.isFinite(room.area_m2)){
      assert.equal(room.id,'f0-B10');
      assert.match(text,/^\d+,\d{2} m²$/,`${room.name}: ${text}`);areas++;
    } else if(text){
      const source=room.dimensions.map(d=>dimensionById.get(d))
        .find(e=>e.basis==='dwg_verified'&&e.dimension_label_allowed);
      assert.equal(text,spanLabel(source.metres));
      assert.match(text,/^\d+,\d m$/,text);
      assert.equal(source.room_id,room.id);
      assert.ok(source.source_dimension_handle,'a span must trace to the drawing');
      spans++;
    } else blank++;
  }
  assert.equal(areas,Object.keys(ROOM_AREAS).length);
  assert.ok(areas>=17,'most rooms should now carry a real area');
  assert.equal(areas+spans+blank,rooms.rooms.length);
});

test('Every derived area names its method, and the schedule still outranks it on the tag',()=>{
  const derived=rooms.rooms.filter(room=>Number.isFinite(room.area_m2));
  assert.equal(derived.length,15);
  const spaceById=new Map(rooms.spaces.map(space=>[space.space_id,space]));
  for(const room of derived){
    assert.ok(room.area_method_label,room.id+' derived area must name its method');
    assert.deepEqual(spaceById.get(room.space_id).members,[room.id],room.id+' must be alone in its space');
    if(room.id==='f0-B10')continue;
    assert.ok(ROOM_AREAS[room.id],room.id+' derived area without a schedule entry would surface unreviewed');
    assert.ok(Math.abs(room.area_to_substrate_m2-ROOM_AREAS[room.id])/ROOM_AREAS[room.id]<0.12,
      `${room.id}: derived ${room.area_to_substrate_m2} vs schedule ${ROOM_AREAS[room.id]}`);
  }
  for(const room of rooms.rooms.filter(r=>r.shared_space_note))
    assert.ok(!Number.isFinite(room.area_m2),room.id+' shared rooms carry no own area');
  assert.match(rooms.area_notes.rooms,/20 kapali hacim/);
  assert.equal(areaLabel({id:'nope'},{}),'');
  assert.equal(areaLabel(null,null),'');
});

test('Tags are sized to be read past, not read first',()=>{
  assert.ok(labelFontSize(1e6)<=14);
});
