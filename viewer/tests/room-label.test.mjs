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

test('The bedroom pairing is corroborated by the substrate areas derived from the R39 solids',()=>{
  // The earlier check paired the first-floor bedrooms by span product
  // (2,95 x 4,10 = 12,10 "= Oda 2"), which understates an L-shaped room and
  // paired them backwards. The R39-derived substrate areas identify both to
  // under 0,8%: f2-106 13,510 vs the schedule's 13,41 and f2-107 12,040 vs
  // 12,05 - so the larger figure belongs to f2-106.
  const substrate=id=>byId.get(id).area_to_substrate_m2;
  assert.ok(Math.abs(substrate('f2-106')-ROOM_AREAS['f2-106'])<0.15,`${substrate('f2-106')} vs ${ROOM_AREAS['f2-106']}`);
  assert.ok(Math.abs(substrate('f2-107')-ROOM_AREAS['f2-107'])<0.15,`${substrate('f2-107')} vs ${ROOM_AREAS['f2-107']}`);
  assert.ok(ROOM_AREAS['f2-106']>ROOM_AREAS['f2-107']);
  // The attic slice overstates rooms under a sloped roof, so the f3 pair keeps
  // its span-based ordering check only.
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
      // R40: the enclosed B03 banyo carries its own derived area; the
      // schedule's 1,73 m² Tuvalet is the plan's small wc west of it
      // (1,25 × 1,38 chain), left unmapped on purpose in room-areas.js.
      assert.equal(room.id,'f0-B10');
      assert.match(text,/^\d+,\d{2} m²$/,`${room.name}: ${text}`);areas++;
    } else if(text){
      // Falls back to this room's own verified project dimension, never
      // another room's and never a model-measured span.
      const source=room.dimensions.map(d=>dimensionById.get(d))
        .find(e=>e.basis==='dwg_verified'&&e.dimension_label_allowed);
      assert.equal(text,source.display);
      assert.equal(source.room_id,room.id);
      assert.ok(source.source_dimension_handle,'a span must trace to the drawing');
      spans++;
    } else blank++;
  }
  assert.equal(areas,Object.keys(ROOM_AREAS).length+1); // +1: f0-B10's own derived figure
  assert.ok(areas>=17,'most rooms should now carry a real area');
  assert.equal(areas+spans+blank,rooms.rooms.length);
});

test('Every derived area names its method, and the schedule still outranks it on the tag',()=>{
  // R39 derived a polygon and area for the 15 rooms that were their own
  // enclosed space; R40's B03 enclosure makes it 16. The labels inside shared
  // volumes carry the shared space's figure as a note instead of pretending
  // to their own.
  const derived=rooms.rooms.filter(room=>Number.isFinite(room.area_m2));
  assert.equal(derived.length,16);
  const spaceById=new Map(rooms.spaces.map(space=>[space.space_id,space]));
  for(const room of derived){
    assert.ok(room.area_method_label,room.id+' derived area must name its method');
    assert.deepEqual(spaceById.get(room.space_id).members,[room.id],room.id+' must be alone in its space');
    // the owner's schedule covers all of these but f0-B10, whose schedule
    // entry turned out to be the plan's other, unlabelled wc (room-areas.js);
    // everywhere else the derived figure is provenance and the tag never
    // silently switches source
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
  // The range topped out at 19 px and covered what it labelled.
  assert.ok(labelFontSize(1e6)<=14);
});
