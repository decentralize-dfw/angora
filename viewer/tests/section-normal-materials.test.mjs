import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSectionNormalMaterials} from '../src/section-normal-materials.js';

test('AO clips architecture while preserving uncut garden/context depth and restores originals',()=>{
 const scene=new THREE.Scene(),plane=new THREE.Plane(new THREE.Vector3(0,-1,0),1.6);
 const wall=new THREE.MeshStandardMaterial({clippingPlanes:[plane]}),garden=new THREE.MeshStandardMaterial();
 const a=new THREE.Mesh(new THREE.BoxGeometry(),wall),b=new THREE.Mesh(new THREE.BoxGeometry(),garden);
 const c=new THREE.Mesh(new THREE.BoxGeometry(),[wall,garden]);scene.add(a,b,c);
 const pass=createSectionNormalMaterials(new THREE.MeshNormalMaterial());let cached;
 pass.render(scene,()=>{cached=a.material;assert.equal(a.material.clippingPlanes[0].constant,1.604);assert.equal(b.material.clippingPlanes.length,0);assert.equal(c.material[0],a.material);assert.equal(c.material[1],b.material);});
 assert.equal(a.material,wall);assert.equal(b.material,garden);assert.equal(c.material[0],wall);
 plane.constant=4.7;
 assert.throws(()=>pass.render(scene,()=>{assert.equal(a.material,cached);assert.equal(a.material.clippingPlanes[0].constant,4.704);throw Error('render interrupted');}),/render interrupted/);
 assert.equal(a.material,wall);assert.equal(b.material,garden);assert.equal(plane.constant,4.7);pass.dispose();
});
