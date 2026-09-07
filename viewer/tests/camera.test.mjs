import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { configureCameraControls } from '../src/camera.js';

class Surface extends EventTarget {
  style={};clientWidth=390;clientHeight=844;
  getRootNode(){return this;} setPointerCapture(){} releasePointerCapture(){}
  getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight};}
}
function fixture(){
  const surface=new Surface(),camera=new THREE.OrthographicCamera(-15,15,30,-30,.1,2500);
  camera.position.set(22,40,22);
  const c=new OrbitControls(camera,surface);configureCameraControls(c,THREE);
  c.target.set(0,4,0);c.minPolarAngle=c.maxPolarAngle=.53;c.update();
  return {c,camera,surface};
}
function settle(c){for(let i=0;i<220;i++)c.update();}
function pointer(surface,type,id,x,y){
  const event=new Event(type);Object.assign(event,{pointerId:id,pointerType:'touch',pageX:x,pageY:y,clientX:x,clientY:y});
  surface.dispatchEvent(event);
}
test('One-finger orbit locks elevation; two-finger pinch/pan also retains it',()=>{
  const {c,camera,surface}=fixture();const y=camera.position.y;
  const before=camera.position.clone();
  pointer(surface,'pointerdown',1,100,350);pointer(surface,'pointermove',1,210,420);pointer(surface,'pointerup',1,210,420);settle(c);
  assert.ok(camera.position.distanceTo(before)>1,'rotation must move camera');
  assert.ok(Math.abs(camera.position.y-y)<1e-8,'one-finger elevation drift');
  const beforePan=c.target.clone(),zoom=camera.zoom;
  pointer(surface,'pointerdown',1,100,350);pointer(surface,'pointerdown',2,200,450);
  pointer(surface,'pointermove',1,70,370);pointer(surface,'pointermove',2,260,530);
  pointer(surface,'pointerup',1,70,370);pointer(surface,'pointerup',2,260,530);settle(c);
  assert.ok(Math.abs(camera.position.y-y)<1e-8,'pinch/pan elevation drift');
  assert.ok(c.target.distanceTo(beforePan)>0.1,'two-finger pan has effect');
  assert.notEqual(camera.zoom,zoom,'pinch changes zoom');c.dispose();
});
test('Explicit single-finger pan stays on the horizontal plane',()=>{
  const {c,camera,surface}=fixture();c.touches.ONE=THREE.TOUCH.PAN;
  const y=camera.position.y,targetY=c.target.y;
  pointer(surface,'pointerdown',1,100,350);pointer(surface,'pointermove',1,160,400);pointer(surface,'pointerup',1,160,400);settle(c);
  assert.ok(c.target.length()>4.01);assert.ok(Math.abs(camera.position.y-y)<1e-8);
  assert.ok(Math.abs(c.target.y-targetY)<1e-8);c.dispose();
});
