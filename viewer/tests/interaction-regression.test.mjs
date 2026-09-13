import test from 'node:test';
import assert from 'node:assert/strict';
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
