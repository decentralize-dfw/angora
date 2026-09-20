import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Texture,MeshStandardMaterial,ShaderLib} from 'three';
import {createElectricLighting} from '../src/electric-light.js';
import {prepareBatchedMaterial} from '../src/batched-material.js';

test('Fixture bounce uses the existing light UV, remains separate from sunlight and switches off',()=>{
 const material=new MeshStandardMaterial({emissiveMap:new Texture()});
 material.userData.angoraBatch={materials:['ceiling'],light:Math.PI,grid:1,pad:4/512,inner:504/512};
 const texture=new Texture(),electric=createElectricLighting([{materials:['ceiling'],texture,intensity:8}]);
 assert.equal(texture.flipY,false,'External bake must follow the glTF light UV orientation');
 electric.apply(material);prepareBatchedMaterial(material);
 const shader={uniforms:{},vertexShader:ShaderLib.standard.vertexShader,fragmentShader:ShaderLib.standard.fragmentShader};
 material.onBeforeCompile(shader,{});
 assert.ok(shader.fragmentShader.includes('texture2D(electricBake,vLightMapUv)'));
 assert.ok(shader.fragmentShader.includes('vec3 roomProbe='));
 assert.ok(shader.fragmentShader.includes('512.0, 2.0'));
 assert.ok(!shader.fragmentShader.includes('textureSize(tex,0)'));
 assert.equal(shader.uniforms.electricEnabled.value,1);electric.setEnabled(false);assert.equal(shader.uniforms.electricEnabled.value,0);
 assert.equal(material.lightMapIntensity,Math.PI);
});

test('Room reflection captures are resident, versioned and profile bounded',async()=>{
 for(const profile of ['desktop','mobile']){
  const root=new URL('../../build/web/batched/'+profile+'/',import.meta.url),m=JSON.parse(await fs.readFile(new URL('manifest.json',root)));
  assert.deepEqual(m.room_probes.map(p=>p.floor),[0,1,2,3]);let total=0;
  for(const d of m.room_probes){
   const b=await fs.readFile(new URL(d.file,root));total+=b.length;
   assert.equal(d.sha256,createHash('sha256').update(b).digest('hex'));
   assert.ok(b.subarray(0,100).toString().includes('RADIANCE'));
   assert.equal(d.width,profile==='desktop'?512:256);
  }
  assert.ok(total<(profile==='desktop'?1700000:450000));
 }
});

test('Both profiles include content-hashed fixture bakes, within bounded transfer sizes',async()=>{
 for(const profile of ['desktop','mobile']){
  const root=new URL('../../build/web/batched/'+profile+'/',import.meta.url),m=JSON.parse(await fs.readFile(new URL('manifest.json',root)));
  assert.equal(m.electric_light.length,3);
  let bytes=0;
  for(const d of m.electric_light){
   const b=await fs.readFile(new URL(d.file,root));bytes+=b.length;
   assert.equal(d.sha256,createHash('sha256').update(b).digest('hex'));assert.equal(b.length,d.bytes);
   assert.equal(d.size,profile==='desktop'?1024:512);assert.ok(d.intensity>0);
  }
  assert.ok(bytes<(profile==='desktop'?300000:100000));
 }
});
