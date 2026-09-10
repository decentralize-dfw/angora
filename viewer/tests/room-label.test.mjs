import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {areaLabel,labelFontSize} from '../src/annotations.js';

const rooms=JSON.parse(readFileSync(new URL('../public/models/full/rooms.json',import.meta.url),'utf8'));

test('A room tag never claims a measurement the source does not carry',()=>{
  // rooms.json says it outright: the individual partitions are unverified and
  // no component-to-room area assignment is made. Not one room has an area, so
  // every tag used to read "Alan doğrulanıyor" - a status, not a measurement.
  assert.equal(rooms.rooms.filter(room=>Number.isFinite(room.area_m2)).length,0);
  assert.match(rooms.area_notes.rooms,/unverified/);

  for(const room of rooms.rooms){
    const text=areaLabel(room,rooms);
    assert.doesNotMatch(text,/doğrulan/,`${room.name} still shows a status`);
    // Either a registered span from the DWG, or nothing at all.
    if(text)assert.match(text,/^\d+,\d{2} m$/,`${room.name}: ${text}`);
  }
  // Most rooms do carry one, so the tags are not simply blank now.
  assert.ok(rooms.rooms.filter(room=>areaLabel(room,rooms)).length>=20);
});

test('Each shown span is the room\'s own registered dimension',()=>{
  const byId=new Map(rooms.dimensions.map(entry=>[entry.id,entry]));
  for(const room of rooms.rooms){
    const text=areaLabel(room,rooms);
    if(!text)  { assert.equal(room.dimensions?.length??0,0,`${room.name} has a dimension but shows nothing`); continue; }
    const source=byId.get(room.dimensions[0]);
    assert.equal(text,source.display);
    assert.equal(source.room_id,room.id,'a tag must not show another room\'s span');
    // The record is traceable back to the drawing, not derived here.
    assert.ok(source.source_dimension_handle);
    assert.ok(Math.abs(source.metres*100-source.source_actual_measurement_cm)<1);
  }
});

test('Area takes over untouched the moment the source carries one',()=>{
  assert.equal(areaLabel({area_m2:24.5,dimensions:['x']},{dimensions:[{id:'x',display:'3,40 m'}]}),'24,5 m²');
  assert.equal(areaLabel({},{}),'');
  assert.equal(areaLabel(null,null),'');
});

test('Tags are sized to be read past, not read first',()=>{
  // The old range topped out at 19 px and covered what it labelled.
  assert.ok(labelFontSize(1e6)<=14);
  assert.ok(labelFontSize(.1)>=12,'still readable when the floor is small on screen');
});
