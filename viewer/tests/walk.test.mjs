import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {WalkSurface} from '../src/walk-surface.js';

const data=JSON.parse(fs.readFileSync(new URL('../../build/web/full/navigation.json',import.meta.url)));
const surface=new WalkSurface(data);

test('Every room opens at a supported position clear of walls, furniture and low ceilings',()=>{
  const digest=path=>createHash('sha256').update(fs.readFileSync(new URL('../../'+path,import.meta.url))).digest('hex');
  const manifest=JSON.parse(fs.readFileSync(new URL('../../build/web/full/manifest.json',import.meta.url)));
  assert.equal(data.source_furniture_sha256,digest('build/blender/layers/30-furniture-placeholders.blend'),'stale furniture collision grid');
  assert.equal(data.source_architecture_sha256,digest('build/blender/layers/10-architecture.blend'),'stale architectural walking surface');
  assert.equal(data.source_fittings_sha256,digest('build/blender/layers/20-fixed-fittings.blend'),'stale fitted-cabinet collision grid');
  assert.equal(manifest.navigation.sha256,digest('build/web/full/navigation.json'),'navigation manifest checksum');
  assert.equal(data.stations.length,27);
  for(const station of data.stations) {
    const [x,y,z]=station.position,sample=surface.sample(x,z,y-data.eye_height_m,true);
    assert.ok(sample,station.room_id+' has no safe starting surface');
    assert.ok(Math.abs(sample.height+data.eye_height_m-y)<.002,station.room_id+' eye height');
    assert.ok(station.anchor_distance_m<.8,station.room_id+' room anchor');
  }
});
test('Movement cannot tunnel through model boundaries, furniture or the first-floor gallery',()=>{
  assert.equal(surface.sample(1,-.4,6.3714),null,'the open gallery must never become a floor');
  assert.equal(surface.sample(2,-.4,6.3714),null);
  assert.equal(surface.sample(100,100,6.3714),null);
  for(const station of data.stations) {
    for(const [dx,dz] of [[15,0],[-15,0],[0,15],[0,-15],[10,10]]) {
      const position=new THREE.Vector3(...station.position);
      surface.move(position,dx,dz,true);
      assert.ok(surface.sample(position.x,position.z,position.y-data.eye_height_m,true),station.room_id+' crossed a collision');
      assert.ok(position.distanceTo(new THREE.Vector3(...station.position))<Math.hypot(dx,dz),station.room_id+' escaped the building');
    }
  }
});
test('Real intermediate stair elevations remain available, and hidden furniture only removes its own collision mask',()=>{
  let stairs=0,furniture=0;
  surface.layers.forEach((layer,floor)=>{
    for(let index=0;index<layer.heights.length;index++) {
      const mm=layer.heights[index],mask=layer.masks[index];
      if(mm===-32768)continue;
      const x=data.grid.x+(index%data.grid.width+.5)*data.grid.step;
      const z=data.grid.z+(Math.floor(index/data.grid.width)+.5)*data.grid.step;
      if(floor<3 && mm/1000>[0,3.0996,6.3714][floor]+.3 && mm/1000<[3.0996,6.3714,9.4705][floor]-.2 && mask===0)stairs++;
      if(mask===2 && surface.sample(x,z,mm/1000,false) && !surface.sample(x,z,mm/1000,true))furniture++;
    }
  });
  assert.ok(stairs>10,'stairs were flattened or removed');assert.ok(furniture>100,'furniture collision is not independently switchable');
});
