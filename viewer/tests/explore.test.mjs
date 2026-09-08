import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {solarPosition,clockLabel} from '../src/daylight.js';
import {labelFontSize} from '../src/annotations.js';
import {isGlazing} from '../src/lighting.js';
import {WalkSurface} from '../src/walk-surface.js';
import {CameraFlight} from '../src/camera-flight.js';

test('Solar study follows the sun and transparent window panes do not cast opaque shadows',()=>{
 const equinox=solarPosition(12,{latitude:0,longitude:45,day:80});assert.ok(equinox.altitude>87);
 const morning=solarPosition(8),evening=solarPosition(18);assert.ok(morning.direction[0]>0);assert.ok(evening.direction[0]<0);
 for(const h of [6,9,12,15,18,21])assert.ok(Math.abs(new THREE.Vector3(...solarPosition(h).direction).length()-1)<1e-10);
 assert.equal(clockLabel(12.5),'12:30');assert.equal(isGlazing(new THREE.MeshPhysicalMaterial({transmission:1})),true);
 assert.equal(isGlazing(new THREE.MeshStandardMaterial({name:'Painted window frame'})),false);
 assert.ok(labelFontSize(80)>labelFontSize(15));assert.ok(labelFontSize(.1)>=12);
});

test('Plan camera follows a continuous arc, keeps zoom and finishes at the requested inclination',()=>{
 const camera=new THREE.PerspectiveCamera(16,390/844,.2,50000);camera.position.set(60,100,60);camera.zoom=1.8;
 const target=new THREE.Vector3(0,3.0996,0);const controls={target:target.clone(),enabled:true,update(){}};
 const flight=new CameraFlight(camera,controls,()=>{},()=>{});
 const old=global.matchMedia;global.matchMedia=()=>({matches:false});
 try{
  flight.go({target,polar:.12,span:36,zoom:1.8});const start=flight.active.start;
  flight.update(start+625);assert.ok(camera.position.y>3);assert.ok(flight.active);assert.equal(controls.enabled,false);
  flight.update(start+1250);assert.equal(flight.active,null);assert.equal(controls.enabled,true);assert.equal(camera.zoom,1.8);
  assert.ok(Math.abs(new THREE.Spherical().setFromVector3(camera.position.clone().sub(target)).phi-.12)<1e-8);
 }finally{global.matchMedia=old;}
});

test('A room tour route uses only source-supported cells and preserves closed-door barriers',()=>{
 const data=JSON.parse(fs.readFileSync(new URL('../public/models/full/navigation.json',import.meta.url)));
 const surface=new WalkSurface(data),from=data.stations.find(s=>s.room_id==='f1-Z02');
 let checked=0;
 for(const destination of data.stations.filter(s=>s.floor_index===1)){
  const route=surface.path(from.position,destination.position,true);if(!route)continue;
  let previous=from.position;
  for(const point of route){assert.ok(surface.sample(point[0],point[2],previous[1]-data.eye_height_m,true,.241));previous=point;}
  assert.deepEqual(route.at(-1),destination.position);checked++;
 }
 assert.ok(checked>=2,'At least adjacent open-plan viewpoints connect without crossing walls');
});
