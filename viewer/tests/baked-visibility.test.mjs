import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {MeshStandardMaterial,Texture,ShaderLib,Vector3} from 'three';
import {createGroundLight} from '../src/ground-light.js';
import {prepareBatchedMaterial} from '../src/batched-material.js';
import {shareSearch} from '../src/share-state.js';

test('Explicit mobile profiling survives floor changes and reload URLs',()=>{
 assert.equal(new URLSearchParams(shareSearch({view:'f1',profile:'mobile'})).get('profile'),'mobile');
 assert.equal(new URLSearchParams(shareSearch({view:'f3',profile:'invalid'})).has('profile'),false);
});

test('Baked sun visibility follows the authored sun and composes with the material atlas',()=>{
 const material=new MeshStandardMaterial();material.userData.angoraBatch={grid:1,pad:4/512,inner:504/512,materials:['WOOD-FL']};
 const mask=createGroundLight(new Texture(),{boundsXZ:[-15,-18,15,15],sunDirection:[0,1,0],floorDatums:[0,3.0996,6.3714,9.4705]});
 mask.apply(material);prepareBatchedMaterial(material);
 const shader={uniforms:{},vertexShader:ShaderLib.standard.vertexShader,fragmentShader:ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader,{});
 assert.ok(shader.fragmentShader.includes('atlasSample( map,'));
 assert.ok(shader.fragmentShader.includes('directLight.color *= mix(1.0,groundVisibility.r,groundSunStrength)'));
 assert.ok(shader.vertexShader.includes('abs(groundWorldPosition.y-floorDatum)'));
 assert.ok(shader.fragmentShader.includes('getSpotLightInfo'));
 mask.setSun(new Vector3(0,1,0));assert.equal(shader.uniforms.groundSunStrength.value,1);
 mask.setSun(new Vector3(1,0,0));assert.equal(shader.uniforms.groundSunStrength.value,0);
});

test('Batched ceiling retains indirect-light texture and receives neutral diffuse IBL',()=>{
 const material=new MeshStandardMaterial({emissiveMap:new Texture()});const texture=material.emissiveMap;
 material.userData.angoraBatch={grid:1,pad:4/512,inner:504/512,materials:['ceiling'],light:Math.PI};
 prepareBatchedMaterial(material);const key=material.customProgramCacheKey();prepareBatchedMaterial(material);
 assert.equal(material.customProgramCacheKey(),key);assert.equal(material.lightMap,texture);
 const shader={uniforms:{},vertexShader:ShaderLib.standard.vertexShader,fragmentShader:ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader,{});
 assert.ok(shader.fragmentShader.includes('vec3 roomProbe='));assert.ok(shader.fragmentShader.includes('radiance += getIBLRadiance'));
});

test('Outdoor batches keep sunlight but do not evaluate interior fixture loops',()=>{
 const material=new MeshStandardMaterial();material.userData.angoraBatch={grid:1,pad:4/512,inner:504/512,materials:['neighbor_wall']};
 prepareBatchedMaterial(material,{exterior:true});
 const shader={uniforms:{},vertexShader:ShaderLib.standard.vertexShader,fragmentShader:ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader,{});
 assert.ok(shader.fragmentShader.includes('getDirectionalLightInfo'));
 assert.ok(!shader.fragmentShader.includes('NUM_SPOT_LIGHTS'));
 assert.ok(!shader.fragmentShader.includes('NUM_POINT_LIGHTS'));
});

test('Both profiles share bounded 512px visibility maps with content-hashed URLs',async()=>{
 let previous=null;
 for(const profile of ['desktop','mobile']){
  const root=new URL('../../build/web/batched/'+profile+'/',import.meta.url),manifest=JSON.parse(await fs.readFile(new URL('manifest.json',root)));
  let total=0;
  for(const key of ['ground_light','floor_light']){
   const d=manifest[key],b=await fs.readFile(new URL(d.file,root));assert.equal(d.size,512);assert.equal(d.sha256,createHash('sha256').update(b).digest('hex'));assert.equal(d.bytes,b.length);total+=b.length;
   for(const [part,hash] of Object.entries(d.sourceGeometryHashes))assert.equal(hash,createHash('sha256').update(await fs.readFile(new URL('../desktop/'+part+'.glb',root))).digest('hex'),'Rebake visibility when source geometry changes');
  }
  assert.ok(total<32768);const hashes=[manifest.ground_light.sha256,manifest.floor_light.sha256];if(previous)assert.deepEqual(hashes,previous);previous=hashes;
 }
});
