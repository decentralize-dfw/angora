import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {areaLabel,labelFontSize} from '../src/annotations.js';
import {ROOM_AREAS} from '../src/room-areas.js';

const rooms=JSON.parse(readFileSync(new URL('../public/models/full/rooms.json',import.meta.url),'utf8'));
const byId=new Map(rooms.rooms.map(room=>[room.id,room]));
const dimensionById=new Map(rooms.dimensions.map(entry=>[entry.id,entry]));

test('Every scheduled area lands on a real room, and none is claimed twice',()=>{
  for(const id of Object.keys(ROOM_AREAS)){
    assert.ok(byId.has(id),`${id} is not a room in the source`);
    assert.ok(ROOM_AREAS[id]>0&&ROOM_AREAS[id]<200,`${id}: ${ROOM_AREAS[id]} m² is not plausible`);
  }
  // Keyed by id rather than name, so the two rooms both called "Yatak odası"
  // cannot collapse onto one figure.
  assert.equal(new Set(Object.keys(ROOM_AREAS)).size,Object.keys(ROOM_AREAS).length);
});

test('The bedroom pairing is corroborated by the rooms\' own registered spans',()=>{
  // f2-106 measures 2,95 x 4,10 = 12,10 m², which is the schedule's smaller
  // bedroom to within 5 cm², so the larger figure belongs to f2-107 and not the
  // other way round. Same shape of check on the second floor.
  const spans=id=>byId.get(id).dimensions.map(d=>dimensionById.get(d).metres);
  const [a,b]=spans('f2-106');
  assert.ok(Math.abs(a*b-ROOM_AREAS['f2-106'])<0.1,`${a}x${b} should match ${ROOM_AREAS['f2-106']}`);
  assert.ok(ROOM_AREAS['f2-107']>ROOM_AREAS['f2-106']);
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
    } else if(text){
      // Falls back to this room's own dimension, never another room's.
      const source=dimensionById.get(room.dimensions[0]);
      assert.equal(text,source.display);
      assert.equal(source.room_id,room.id);
      assert.ok(source.source_dimension_handle,'a span must trace to the drawing');
      spans++;
    } else blank++;
  }
  assert.equal(areas,Object.keys(ROOM_AREAS).length);
  assert.ok(areas>=17,'most rooms should now carry a real area');
  assert.equal(areas+spans+blank,rooms.rooms.length);
});

test('Nothing invents a measurement the sources do not carry',()=>{
  // The model itself still assigns no room area; every m² shown comes from the
  // schedule, and a room in neither source shows nothing at all.
  assert.equal(rooms.rooms.filter(room=>Number.isFinite(room.area_m2)).length,0);
  assert.match(rooms.area_notes.rooms,/unverified/);
  assert.equal(areaLabel({id:'nope'},{}),'');
  assert.equal(areaLabel(null,null),'');
});

test('Tags are sized to be read past, not read first',()=>{
  // The range topped out at 19 px and covered what it labelled.
  assert.ok(labelFontSize(1e6)<=14);
});
