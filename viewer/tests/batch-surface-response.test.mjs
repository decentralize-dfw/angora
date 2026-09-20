import test from 'node:test';
import assert from 'node:assert/strict';
import {MeshStandardMaterial,Texture,ShaderLib} from 'three';
import {restoreBatchSurface} from '../src/batch-surface-response.js';
import {prepareBatchedMaterial} from '../src/batched-material.js';
import {opticalResponse} from '../../tools/batch-delivery/surface-response.mjs';

test('Source IOR and specular factors retain dielectric Fresnel reflectance',()=>{
 const glass=opticalResponse({extensions:{KHR_materials_ior:{ior:1.45},KHR_materials_specular:{specularFactor:.6}}});
 assert.ok(Math.abs(glass.f0[0]-((1.45-1)/(1.45+1))**2*.6)<1e-10);
 assert.equal(glass.coat,0);
});

test('Merged coated and uncoated surfaces preserve maps and receive distinct responses',()=>{
 const map=new Texture(),aoMap=new Texture(),original=new MeshStandardMaterial({map,aoMap});
 original.userData.angoraBatch={grid:2,pad:4/512,inner:248/512,materials:['wood','metal']};
 const response={wood:{f0:[.043,.043,.043],coat:.0625,coatRoughness:.21},metal:{f0:[.04,.04,.04],coat:0,coatRoughness:0}};
 const material=restoreBatchSurface(original,response);prepareBatchedMaterial(material);
 assert.equal(material.isMeshPhysicalMaterial,true);assert.equal(material.map,map);assert.equal(material.aoMap,aoMap);
 assert.equal(material.transmission,0);
 const shader={uniforms:{},vertexShader:ShaderLib.physical.vertexShader,fragmentShader:ShaderLib.physical.fragmentShader};
 material.onBeforeCompile(shader,{});
 assert.equal(shader.uniforms.surfaceOptics.value[0].w,.0625);
 assert.equal(shader.uniforms.surfaceOptics.value[1].w,0);
 assert.ok(shader.vertexShader.includes('attribute float _batchid'));
 assert.ok(shader.fragmentShader.includes('material.clearcoat=opticalResponse.a'));
 assert.ok(shader.fragmentShader.includes('diffuseColor.rgb,metalnessFactor'));
 assert.ok(shader.fragmentShader.includes('atlasSample( map,'));
});

test('Uncoated source finishes do not enable a physical coating shader',()=>{
 const original=new MeshStandardMaterial();original.userData.angoraBatch={materials:['plaster']};
 const material=restoreBatchSurface(original,{plaster:{f0:[.024,.024,.024],coat:0,coatRoughness:0}});
 assert.equal(material,original);assert.equal(material.isMeshPhysicalMaterial,undefined);
});
