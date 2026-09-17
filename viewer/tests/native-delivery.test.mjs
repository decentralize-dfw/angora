import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WalkSurface} from '../src/walk-surface.js';
const root=new URL('../../',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root)));
const manifest=read('build/web/full/manifest.json');
test('Native model, navigation and sections come from the same saved scene',{skip:!manifest.native_delivery},()=>{
  for(const p of ['navigation.json','sections.json'])assert.equal(read('build/web/full/'+p).source_native_sha256,manifest.source_native_sha256,p);
  for(const asset of manifest.assets.filter(a=>!a.origin))assert.equal(asset.source_native_sha256,manifest.source_native_sha256,asset.id);
});
test('All current room starts and retained open door passages are navigable',{skip:!manifest.native_delivery},()=>{
  const data=read('build/web/full/navigation.json'),surface=new WalkSurface(data);
  assert.equal(data.stations.length,28);
  assert.ok(!data.stations.some(s=>s.room_id==='f0-B10'),'removed bathroom has no tour station');
  for(const station of data.stations)assert.ok(surface.sample(station.position[0],station.position[2],station.position[1]-data.eye_height_m),station.room_id);
  const doors=read('build/qa/roads-native/door-regression.json').filter(d=>d.id!=='f0-D13');assert.equal(doors.length,12);
  for(const door of doors){
    const samples=door.floor.filter(s=>s.width_fraction===.5);
    for(const sample of samples){const [x,y,z]=sample.support.point;assert.ok(surface.sample(x,-y,z),door.id+' at '+sample.depth);}
    const toPosition=s=>{const [x,y,z]=s.support.point;return [x,z+data.eye_height_m,-y];};
    assert.ok(surface.path(toPosition(samples[0]),toPosition(samples.at(-1))),door.id+' has a connected crossing');
  }
});
test('The street approach has no stale collision cells or unsupported ground',{skip:!manifest.native_delivery},()=>{
  const surface=new WalkSurface(read('build/web/full/navigation.json'));
  for(const route of read('build/qa/roads-native/front-routes-qa.json'))for(const p of route.rows){
    assert.ok(surface.sample(p.xy[0],-p.xy[1],p.floor.point[2]),route.route+' '+p.xy.join(','));
  }
});
