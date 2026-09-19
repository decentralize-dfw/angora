import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {frameInsets} from '../src/frame-insets.js';

test('Plan fit clears the desktop dock and compact mobile header without moving the orbit target',()=>{
 for(const [width,height,dockTop,topBottom] of [[1280,800,666,0],[320,568,452,98]]){
  const inset=frameInsets(width,height,{dockTop,topBottom}),span=20/inset.verticalFraction;
  const camera=new THREE.OrthographicCamera(-span*width/height/2,span*width/height/2,span/2,-span/2,.1,100);
  camera.position.z=30;camera.setViewOffset(width,height,0,inset.offsetY,width,height);camera.updateMatrixWorld();
  const y=v=>(1-new THREE.Vector3(0,v,0).project(camera).y)*height/2;
  assert.ok(y(10)>=topBottom+11.99,'top geometry obscured');
  assert.ok(y(-10)<=dockTop-11.99,'bottom geometry obscured');
 }
});
