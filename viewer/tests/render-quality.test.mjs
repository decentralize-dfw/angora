import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {renderPixelRatio,fitDepthRange} from '../src/render-quality.js';
import {fitContextBounds,prepareMaterialResponse} from '../src/material-response.js';
import {smoothGroundNormals} from '../src/context-surfaces.js';
import {batchContext} from '../src/context-batch.js';

test('Phone resolution and depth precision remain stable across orbit scales',()=>{
  // A phone must not be asked to draw its whole native panel. 390x700 at dpr 3
  // is 2.46 M drawing-buffer pixels, which is what made this scene stutter and
  // run out of memory on a handset. The budget is 1.5 M and never above 2x.
  const phone=renderPixelRatio(390,700,3,true);
  assert.ok(phone<=2,`phone ratio ${phone}`);
  assert.ok(390*700*phone*phone<=1_500_000,'phone must stay inside its budget');
  // A desktop keeps its own, and neither ever drops below native.
  assert.ok(renderPixelRatio(1600,900,2,false)>=1);
  const bounds=new THREE.Box3(new THREE.Vector3(-140,-16,-150),new THREE.Vector3(175,30,170));
  const camera=new THREE.PerspectiveCamera(16,390/700),target=new THREE.Vector3();
  for(const radius of [60,160,1200]){
    camera.position.set(0,radius,0);fitDepthRange(camera,target,bounds);camera.lookAt(target);camera.updateMatrixWorld();
    const a=new THREE.Vector3(0,0,0).project(camera).z,b=new THREE.Vector3(0,.003,0).project(camera).z;
    assert.ok(Math.abs(a-b)*.5*2**24>1,'3 mm finishes must remain separable in 24-bit depth');
  }
});

test('Shared context components batch without changing mirrored geometry or UVs',()=>{
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute([0,0,1,0,0,1,0,0,1],3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,1],2));g.setIndex([0,1,2]);
  const root=new THREE.Group(),mesh=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({name:'roof'}),2);root.add(mesh);root.position.y=3;
  mesh.setMatrixAt(0,new THREE.Matrix4().makeTranslation(2,0,0));
  mesh.setMatrixAt(1,new THREE.Matrix4().compose(new THREE.Vector3(-2,0,0),new THREE.Quaternion(),new THREE.Vector3(-1,1,1)));
  const expected=new THREE.Box3().setFromObject(root),batched=batchContext(root),actual=new THREE.Box3().setFromObject(batched);
  assert.ok(actual.min.equals(expected.min)&&actual.max.equals(expected.max));assert.equal(batched.children.length,1);
  const out=batched.children[0].geometry;assert.deepEqual([...out.index.array],[0,1,2,3,5,4]);
  assert.deepEqual([...out.attributes.uv.array],[0,0,1,0,0,1,0,0,1,0,0,1]);
  for(const x of [2.2,-2.2])assert.equal(new THREE.Raycaster(new THREE.Vector3(x,3.2,2),new THREE.Vector3(0,0,-1)).intersectObject(batched,true).length,1);
});

test('Region framing contains the settlement in portrait and landscape',()=>{
  const box=new THREE.Box3(new THREE.Vector3(-116,-12,-114),new THREE.Vector3(120,28,145));
  for(const aspect of [390/700,1440/900]){
    const view=fitContextBounds(box,aspect),camera=new THREE.PerspectiveCamera(16,aspect,1,5000);
    const radius=view.span/(2*Math.tan(THREE.MathUtils.degToRad(8)));
    camera.position.copy(view.target).add(new THREE.Vector3().setFromSphericalCoords(radius,view.polar,view.azimuth));
    camera.lookAt(view.target);camera.updateMatrixWorld();
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
      const p=new THREE.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<.92);assert.ok(Math.abs(p.y)<.75);
    }
  }
});

test('Ground smoothing preserves positions/UVs and joins duplicated seams',()=>{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,0,0,1,1,.1,0,1,.1,0,0,0,1,1,.3,1],3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,0,1,1,0,1,0,0,1,1,1],2));
  const positions=g.attributes.position.array.slice(),uv=g.attributes.uv.array.slice();smoothGroundNormals(g);
  assert.deepEqual(g.attributes.position.array,positions);assert.deepEqual(g.attributes.uv.array,uv);
  assert.deepEqual([...g.attributes.normal.array.slice(6,9)],[...g.attributes.normal.array.slice(9,12)]);
  const floor=new THREE.MeshPhysicalMaterial({name:'wood_floor',clearcoat:.25,clearcoatRoughness:.21});
  prepareMaterialResponse(floor);assert.ok(floor.clearcoat<=.08);assert.ok(floor.clearcoatRoughness>=.6);
});
