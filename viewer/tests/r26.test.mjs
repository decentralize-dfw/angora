import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WalkSurface} from '../src/walk-surface.js';
const read=name=>JSON.parse(fs.readFileSync(new URL('../public/models/full/'+name,import.meta.url)));
test('Every adjacent pair of floors retains at least one fully walkable furnished route',()=>{
  const data=read('navigation.json'),surface=new WalkSurface(data);
  for(let f=0;f<3;f++)assert.ok(data.stations.filter(s=>s.floor_index===f).some(a=>
    data.stations.filter(s=>s.floor_index===f+1).some(b=>surface.path(a.position,b.position,true))),`No route between ${f} and ${f+1}`);
});
test('Model-only areas are labelled and unapproved individual room partitions stay unpublished',()=>{
  const data=read('rooms.json');assert.equal(data.floor_areas.length,4);
  for(const a of data.floor_areas){assert.ok(a.area_m2>30);assert.equal(a.legal_net_area,false);assert.equal(a.survey_verified,false);}
  for(const a of data.site_areas){assert.equal(a.estimated,true);assert.equal(a.survey_verified,false);}
  assert.equal(data.rooms.some(r=>Number.isFinite(r.area_m2)),false);
});
