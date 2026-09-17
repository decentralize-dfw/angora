import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {renderPixelRatio,fitDepthRange} from '../src/render-quality.js';
import {fitContextBounds,prepareMaterialResponse,materialFamily,setInteriorMode} from '../src/material-response.js';
import {smoothGroundNormals} from '../src/context-surfaces.js';
import {batchContext} from '../src/context-batch.js';

test('Phone resolution and depth precision remain stable across orbit scales',()=>{
  const phone=renderPixelRatio(390,700,3,true);
  assert.ok(phone<=2,`phone ratio ${phone}`);
  assert.ok(390*700*phone*phone<=1_500_000,'phone must stay inside its budget');
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
  assert.ok(actual.min.equals(expected.min)&&actual.max.equals(expected.max));
  assert.equal(batched.children.length,2);
  const flat=batched.children.flatMap(child=>[...child.geometry.index.array]);
  assert.deepEqual(flat.sort().join(','),'0,0,1,1,2,2','both triangles survive with three vertices each');
  for(const child of batched.children)
    assert.deepEqual([...child.geometry.attributes.uv.array],[0,0,1,0,0,1],'UVs pass through unchanged');
  for(const x of [2.2,-2.2])assert.equal(new THREE.Raycaster(new THREE.Vector3(x,3.2,2),new THREE.Vector3(0,0,-1)).intersectObject(batched,true).length,1);
  const mirrored=batched.children.find(child=>new THREE.Box3().setFromObject(child).min.x<-1);
  assert.deepEqual([...mirrored.geometry.index.array],[0,2,1]);
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
  prepareMaterialResponse(floor);assert.equal(floor.clearcoat,.25);assert.ok(floor.clearcoatRoughness>=.35);
  const lacquered=new THREE.MeshPhysicalMaterial({name:'terra_floor',clearcoat:.8,clearcoatRoughness:.1});
  prepareMaterialResponse(lacquered);assert.ok(lacquered.clearcoat<=.35);assert.ok(lacquered.clearcoatRoughness>=.35);
});

test('Numbered Blender plaster and ceilings retain neutral smooth finishes',()=>{
  for(const [name,family,intensity] of [['interior.002','plaster',0],['ceiling.003','soffit',0]]){
    const normal=new THREE.Texture(),bump=new THREE.Texture();
    const map=new THREE.Texture();
    const material=new THREE.MeshStandardMaterial({name,normalMap:normal,bumpMap:bump,map});
    assert.equal(materialFamily(name),family);
    prepareMaterialResponse(material);
    assert.equal(material.normalMap,null);assert.equal(material.bumpMap,null);
    assert.equal(material.envMapIntensity,intensity);
    if(family==='soffit'){
      assert.equal(material.map,null);
      assert.equal(material.vertexColors,false);
      assert.ok(Math.abs(material.color.r-.94)<1e-8&&Math.abs(material.color.g-.94)<1e-8&&Math.abs(material.color.b-.94)<1e-8);
    }
  }
  const normal=new THREE.Texture();
  const wood=new THREE.MeshStandardMaterial({name:'wood_honey.003',normalMap:normal});
  prepareMaterialResponse(wood);assert.equal(wood.normalMap,normal);
});

test('Clay roof backfaces retain their material with a separate native ceiling',()=>{
  const roof=new THREE.MeshStandardMaterial({name:'roof.003'});
  prepareMaterialResponse(roof);
  const shader={fragmentShader:'#include <roughnessmap_fragment>\n#include <opaque_fragment>'};
  roof.onBeforeCompile(shader,null);
  assert.doesNotMatch(shader.fragmentShader,/!gl_FrontFacing/);
});

test('Exterior tiles seen through windows retain their finish in walk mode',()=>{
  const map=new THREE.Texture(),normalMap=new THREE.Texture(),bumpMap=new THREE.Texture();
  const roof=new THREE.MeshStandardMaterial({name:'roof.003',color:0x9b4e2d,map,normalMap,bumpMap,envMapIntensity:.65});
  prepareMaterialResponse(roof);
  const exterior=roof.color.clone(),preparedNormal=roof.normalMap;
  setInteriorMode(roof,true);
  assert.equal(roof.map,map);assert.equal(roof.normalMap,preparedNormal);assert.equal(roof.bumpMap,bumpMap);
  assert.equal(roof.envMapIntensity,.65);assert.ok(roof.color.equals(exterior));
  setInteriorMode(roof,false);
  assert.ok(roof.color.equals(exterior));assert.equal(roof.map,map);assert.equal(roof.normalMap,preparedNormal);
  assert.equal(roof.bumpMap,bumpMap);assert.equal(roof.envMapIntensity,.65);
});

test('Walk mode also neutralizes the dedicated sloped-ceiling lining',()=>{
  const ceiling=new THREE.MeshStandardMaterial({name:'ceiling.003',color:0x809060,vertexColors:true});
  prepareMaterialResponse(ceiling);setInteriorMode(ceiling,true);
  assert.equal(ceiling.vertexColors,false);assert.equal(ceiling.envMapIntensity,0);
  assert.ok(Math.abs(ceiling.color.r-.94)<1e-8&&Math.abs(ceiling.color.g-.94)<1e-8&&Math.abs(ceiling.color.b-.94)<1e-8);
});
