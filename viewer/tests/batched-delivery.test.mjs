import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {createNativeDelivery} from '../src/native-delivery.js';

test('All batched parts load once; floor and neighborhood changes only change visibility',async()=>{
 const names=['architecture','interior','garden','context-ground','context-buildings','context-plants'];
 const calls=[],groups=new Map(),scene=new THREE.Scene();
 const delivery=createNativeDelivery({manifest:{batched:true,parts:names.map(name=>({name,file:name+'.glb'})),interior_streams:[]},root:'https://example.test/models/',scene,groups,prepare(){},load:async url=>{
  calls.push(url);const model=new THREE.Group();model.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial()));return {scene:model,parser:{associations:new Map(),json:{}}};
 }});
 await delivery.activate('f3');assert.equal(calls.length,6);
 for(const view of ['f0','f1','f2','f3','neighborhood','f0'])await delivery.activate(view);
 assert.equal(calls.length,6);assert.equal(delivery.loaded.size,6);assert.equal(groups.get('interior').visible,true);
 await delivery.activate('neighborhood');assert.equal(groups.get('interior').visible,false);
 delivery.dispose();assert.equal(scene.children.length,0);
});

test('Both complete model profiles use Draco, profile-bounded WebP atlases and at most 40 geometry draws',async()=>{
 for(const profile of ['desktop','mobile']){
  const base=new URL('../../build/web/batched/'+profile+'/',import.meta.url);
  const manifest=JSON.parse(await fs.readFile(new URL('manifest.json',base)));
  let draws=0,ao=0,bytes=0;
  bytes+=(manifest.electric_light??[]).reduce((n,m)=>n+m.bytes,0);
  bytes+=(manifest.room_probes??[]).reduce((n,m)=>n+m.bytes,0);
  bytes+=(manifest.ground_light?.bytes??0)+(manifest.floor_light?.bytes??0);
  for(const part of manifest.parts){
   const b=await fs.readFile(new URL(part.file,base));bytes+=b.length;
   assert.equal(part.gpu_sha256,createHash('sha256').update(b).digest('hex'),'Model cache version must match its delivered bytes');
   assert.equal(b.readUInt32LE(0),0x46546c67);
   const json=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString().trim());
   for(const mesh of json.meshes)for(const p of mesh.primitives){draws++;assert.ok(p.extensions.KHR_draco_mesh_compression);}
   const binStart=20+b.readUInt32LE(12)+8;
   for(const img of json.images){
    assert.equal(img.mimeType,'image/webp');assert.equal(img.uri,undefined);
    const view=json.bufferViews[img.bufferView],data=b.subarray(binStart+(view.byteOffset??0),binStart+(view.byteOffset??0)+view.byteLength);
    const type=data.toString('ascii',12,16);let width,height;
    if(type==='VP8X'){width=1+data.readUIntLE(24,3);height=1+data.readUIntLE(27,3);}
    else if(type==='VP8 '){width=data.readUInt16LE(26)&16383;height=data.readUInt16LE(28)&16383;}
    else if(type==='VP8L'){const bits=data.readUInt32LE(21);width=(bits&16383)+1;height=((bits>>>14)&16383)+1;}
    assert.ok(width>0&&width<=(profile==='desktop'?1024:512)&&height>0&&height<=(profile==='desktop'?1024:512),`${type}: ${width}x${height}`);
   }
   for(const m of json.materials){assert.ok(m.extras.angoraBatch);if(m.occlusionTexture)ao++;}
  }
  assert.ok(draws<=40,`${profile}: ${draws} geometry calls leave ten for sections/annotations`);
  // Selective desktop detail and offline lighting have explicit profile
  // budgets; include every reflection and light bake, not just the GLBs.
  assert.ok(bytes<(profile==='desktop'?24:17)*1024*1024,`${profile}: ${bytes} bytes`);assert.ok(ao>=5);
 }
});
