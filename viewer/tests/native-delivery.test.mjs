import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createNativeDelivery} from '../src/native-delivery.js';

test('A failed native preparation releases the decoded asset and preserves resident textures',async()=>{
 const scene=new THREE.Scene(),groups=new Map(),images=[],geometries=[];
 const records=['architecture','garden'].map(name=>({name,file:name+'.gltf'}));
 const delivery=createNativeDelivery({manifest:{parts:records,interior_streams:[]},root:new URL('https://example.test/'),scene,groups,
  prepare(_mesh,{name}){if(name==='garden')throw Error('preparation failed');},
  load:async()=>{const image={closed:0,close(){this.closed++;}},texture=new THREE.Texture(image),material=new THREE.MeshStandardMaterial({map:texture}),geometry=new THREE.PlaneGeometry(),model=new THREE.Group();
   images.push(image);geometries.push(geometry);geometry.userData.disposed=false;geometry.addEventListener('dispose',()=>{geometry.userData.disposed=true;});model.add(new THREE.Mesh(geometry,material));
   return {scene:model,parser:{associations:new Map(),json:{}}};}
 });
 await assert.rejects(delivery.activate('f0'),/preparation failed/);
 assert.deepEqual([...delivery.loaded.keys()],['architecture']);
 assert.equal(images[0].closed,0);assert.equal(images[1].closed,1);assert.equal(geometries[1].userData.disposed,true);
 delivery.dispose();assert.equal(images[0].closed,1);
});

test('Native floor streaming releases old floors and context while retaining shared image storage',async()=>{
 const scene=new THREE.Scene(),groups=new Map(),released=[],requested=[],images=[];
 const names=['architecture','garden','plot-grass','villa-context-white','context-ground','context-buildings','context-plants','interior-common',...Array.from({length:4},(_,i)=>'interior-f'+i)];
 const records=names.map(name=>({name,file:name+'.gltf',gpu_sha256:'1234567890abcdef'}));
 const delivery=createNativeDelivery({manifest:{parts:records,interior_streams:[]},root:new URL('https://example.test/model/'),scene,groups,prepare(){},releaseMaterial:m=>released.push(m),load:async url=>{
  requested.push(url);const root=new THREE.Group(),material=new THREE.MeshStandardMaterial();
  const image={closes:0,close(){this.closes++;}};images.push(image);
  const texture=new THREE.Texture(image);
  material.map=texture;root.add(new THREE.Mesh(new THREE.PlaneGeometry(),material));
  return {scene:root,parser:{associations:new Map([[texture,{textures:0}]]),json:{textures:[{source:0}],images:[{uri:'shared/texture.png'}]}}};
 }});
 await delivery.activate('f3');const architecture=groups.get('architecture'),source=architecture.children[0].material.map.source;
 assert.deepEqual([...delivery.loaded.keys()].sort(),['architecture','garden','context-plants','interior-common','interior-f3','plot-grass','villa-context-white'].sort());
 for(const floor of ['f0','f1','f2','f3']){await delivery.activate(floor);assert.equal(groups.get('architecture'),architecture);assert.equal(groups.get('interior-'+floor).children[0].material.map.source,source);assert.equal([...delivery.loaded.keys()].filter(k=>/^interior-f/.test(k)).length,1);}
 await delivery.activate('neighborhood');assert.equal([...delivery.loaded.keys()].filter(k=>k.startsWith('interior')).length,0);assert.equal(groups.has('villa-context-white'),false);
 assert.ok(released.length>=6);assert.ok(requested.every(url=>url.includes('?v=1234567890ab')));
 assert.equal(images[0].closes,0,'resident canonical bitmap stays open');
 assert.ok(images.slice(1).every(image=>image.closes===1),'duplicate decoded bitmaps close exactly once');
 delivery.dispose();
 assert.ok(images.every(image=>image.closes===1),'final release closes the canonical bitmap too');
});

test('Source deduplication preserves a bitmap still used by another texture format',async()=>{
 const scene=new THREE.Scene(),groups=new Map(),images=[];
 const records=['architecture','garden','context-ground','context-buildings','context-plants'].map(name=>({name,file:name+'.gltf'}));
 const delivery=createNativeDelivery({manifest:{parts:records,interior_streams:[]},root:new URL('https://example.test/'),scene,groups,prepare(){},load:async()=>{
  const image={closes:0,close(){this.closes++;}};images.push(image);
  const map=new THREE.Texture(image),normalMap=new THREE.Texture(image);normalMap.format=THREE.RGFormat;
  // Only the first file has the RGBA sampler. The second file adds a sampler
  // that must retain its bitmap even though its RGBA Source is replaced.
  const material=new THREE.MeshStandardMaterial({map,...(images.length===2?{normalMap}:{})});
  const model=new THREE.Group();model.add(new THREE.Mesh(new THREE.PlaneGeometry(),material));
  return {scene:model,parser:{associations:new Map([[map,{textures:0}],[normalMap,{textures:0}]]),json:{textures:[{source:0}],images:[{uri:'shared.png'}]}}};
 }});
 await delivery.activate('neighborhood');
 assert.equal(images[0].closes,0);assert.equal(images[1].closes,0);
 assert.ok(images.slice(2).every(image=>image.closes===1));
 delivery.dispose();assert.ok(images.every(image=>image.closes===1));
});
