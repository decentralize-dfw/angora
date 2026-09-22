import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {CameraFlight} from '../src/camera-flight.js';
import {createInterfaceSound} from '../src/interface-sound.js';

test('Camera crosses the angle seam by the shortest arc',()=>{
  const previous=globalThis.matchMedia;globalThis.matchMedia=()=>({matches:false});
  try {
    const camera=new THREE.PerspectiveCamera(30,1,.1,1000),controls={target:new THREE.Vector3(),update(){}};
    camera.position.setFromSpherical(new THREE.Spherical(30,1,Math.PI-.02));
    const flight=new CameraFlight(camera,controls,()=>{},()=>{});
    flight.go({target:new THREE.Vector3(),polar:1,span:20,azimuth:-Math.PI+.02});
    assert.ok(Math.abs(flight.active.to.azimuth-flight.active.from.azimuth-.04)<1e-9);
    flight.update(flight.active.endTime);assert.equal(flight.active,null);assert.equal(controls.enabled,true);
  } finally {globalThis.matchMedia=previous;}
});
class Button extends EventTarget {attrs={};setAttribute(k,v){this.attrs[k]=v;}}

test('A delayed native GPU frame does not skip the camera flight',()=>{
  const previous=globalThis.matchMedia;globalThis.matchMedia=()=>({matches:false});
  try {
    const camera=new THREE.PerspectiveCamera(30,1,.1,1000),controls={target:new THREE.Vector3(),update(){}};
    camera.position.set(20,30,20);
    const flight=new CameraFlight(camera,controls,()=>{},()=>{});flight.limitFrameStep=true;
    const destination={target:new THREE.Vector3(1,2,3),polar:.001,span:15};
    flight.go(destination);let time=flight.active.start+7000;
    flight.update(time);assert.ok(flight.active);assert.equal(controls.enabled,false);
    for(let i=0;i<100&&flight.active;i++){time+=16;flight.update(time);}
    assert.equal(flight.active,null);assert.equal(controls.enabled,true);
    assert.ok(controls.target.distanceTo(destination.target)<1e-8);
    flight.go(destination,true);assert.equal(flight.active,null);
  } finally {globalThis.matchMedia=previous;}
});
test('Audio remains opt-in and denied storage does not block the control',()=>{
  const button=new Button(),root=new EventTarget();
  const sound=createInterfaceSound({button,root,Context:class{},storage:{getItem(){throw Error('denied');},setItem(){throw Error('denied');}}});
  assert.equal(sound.enabled,false);assert.equal(button.attrs['aria-pressed'],'false');
  button.dispatchEvent(new Event('click'));assert.equal(sound.enabled,true);
  button.dispatchEvent(new Event('click'));assert.equal(sound.enabled,false);
});
test('Unavailable audio is disabled without breaking the viewer',()=>{
  const button=new Button();createInterfaceSound({button,root:new EventTarget(),storage:null,Context:null});
  assert.equal(button.disabled,true);
});

// The neighbourhood labels every plot with its number, which is useful when
// you are reading the street - and during the narrated tour it is two
// numbering systems in one picture, competing with the camera marks that
// match the photo cards. The tour owns the numbering while it runs.
test('the neighbours give up their numbers to the tour', () => {
  const site = readFileSync(new URL('../src/site-context.js', import.meta.url), 'utf8');
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(site, /update\(view,camera,target,transitioning,walking,numbering\)/,
    'site-context takes no numbering flag');
  assert.match(site, /&&!numbering;/, 'the numbering flag does not put the labels away');
  assert.match(main, /siteContext\?\.update\(.*Boolean\(guidedTour\?\.active\)\)/,
    'main never tells the site context that the tour is numbering');
});
