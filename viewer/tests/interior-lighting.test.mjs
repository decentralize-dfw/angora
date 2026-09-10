import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {InteriorLightController} from '../src/interior-lighting.js';

const fixture=(name,x,floor=1)=>({name,position:[x,3,0],direction:[0,-1,0],color:[1,.9,.8],
  intensity_cd:100,floor_index:floor,intensity_status:'render_assumption_not_measured_electrical_power'});
function setup(fixtures,count=1) {
  const lights=Array.from({length:count},()=>{const light=new THREE.SpotLight(0xffffff,0);light.visible=false;return light;});
  const controller=new InteriorLightController(lights,{fadeMs:300});controller.setFixtures(fixtures,0);
  return {controller,lights};
}

test('A long idle interval is not counted as transition time; light controls settle without camera motion',()=>{
  const {controller:c,lights:[light]}=setup([fixture('A',0)]);
  c.update(0);c.select(1,[0,0,0],60000);
  assert.equal(c.update(60000).active,true);assert.equal(light.intensity,0);
  c.update(60150);assert.equal(light.intensity,50);
  const settled=c.update(60300);assert.equal(settled.active,false);assert.equal(light.intensity,100);
  assert.equal(settled.shadowChanged,false,'Intensity-only changes reuse the existing shadow map');
  c.setEnabled(false,70000);c.update(70150);assert.equal(light.intensity,50);
  assert.equal(c.update(70300).active,false);assert.equal(light.visible,false);
  c.setEnabled(true,80000);c.update(80150);assert.equal(light.intensity,50);
  c.update(80300);assert.equal(light.intensity,100);
});

test('A spotlight changes source coordinates only at zero intensity',()=>{
  const a=fixture('A',0),b=fixture('B',10),{controller:c,lights:[light]}=setup([a,b]);
  c.select(1,a.position,0);c.update(300);
  c.select(1,b.position,1000);
  c.update(1150);assert.equal(light.intensity,50);assert.deepEqual(light.position.toArray(),a.position);
  c.update(1300);assert.equal(light.intensity,0);assert.deepEqual(light.position.toArray(),b.position);
  c.update(1450);assert.equal(light.intensity,50);
  assert.equal(c.update(1600).active,false);assert.equal(light.intensity,100);
  assert.deepEqual(light.target.position.toArray(),[10,2,0]);
});

test('Movement around a proximity boundary does not keep replacing the same fixtures',()=>{
  const a=fixture('A',0),b=fixture('B',10),{controller:c,lights:[light]}=setup([a,b]);
  c.select(1,a.position,0);c.update(300);
  for(let i=0;i<80;i++) {
    const t=1000+i*16;c.select(1,[i%2?4.95:5.05,3,0],t);c.update(t);
    assert.deepEqual(light.position.toArray(),a.position);assert.equal(light.intensity,100);assert.equal(c.active,false);
  }
  c.select(1,[6,3,0],3000);assert.equal(c.active,true);c.update(3600);
  assert.deepEqual(light.position.toArray(),b.position);
});

test('Reversing a transition restores the same source without a jump or duplicate slot',()=>{
  const a=fixture('A',0),b=fixture('B',10),{controller:c,lights:[light]}=setup([a,b]);
  c.select(1,a.position,0);c.update(300);c.select(1,b.position,1000);c.update(1150);
  c.select(1,a.position,1150);c.update(1150);assert.equal(light.intensity,50);
  c.update(1300);assert.equal(light.intensity,100);assert.equal(c.active,false);
  assert.deepEqual(light.position.toArray(),a.position);
});

test('Walking all source stations preserves lamp positions, floor selection and the four-light budget',()=>{
  const navigation=JSON.parse(readFileSync(new URL('../public/models/full/navigation.json',import.meta.url)));
  const source=structuredClone(navigation.lights),{controller:c,lights}=setup(navigation.lights,4);
  let time=0;
  for(const station of navigation.stations) {
    c.select(station.floor_index,station.position,time);
    for(let dt=0;dt<=600;dt+=50) {
      c.update(time+dt);
      const visible=c.slots.filter(slot=>slot.light.visible);
      assert.ok(visible.length<=4);assert.equal(new Set(visible.map(slot=>slot.source)).size,visible.length);
      for(const {source:f,light} of visible) {
        assert.deepEqual(light.position.toArray(),f.position);
        assert.ok(light.intensity>=0&&light.intensity<=f.intensity_cd);
      }
    }
    assert.equal(c.active,false);
    for(const {source:f} of c.slots)if(f)assert.equal(f.floor_index,station.floor_index);
    time+=1000;
  }
  c.select(null,null,time);c.update(time+600);assert.ok(lights.every(light=>!light.visible));
  assert.deepEqual(navigation.lights,source,'The authored light records must not change');
});
