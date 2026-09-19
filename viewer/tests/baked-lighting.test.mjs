import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {prepareBakedLighting} from '../src/baked-lighting.js';

test('Interior plaster uses neutral diffuse probe while retaining baked bounce, IBL intensity and specular',()=>{
 const material=new THREE.MeshStandardMaterial({lightMap:new THREE.Texture()});let previousCalls=0;
 material.name='ceiling';
 material.onBeforeCompile=()=>{previousCalls++;};
 prepareBakedLighting(material);const key=material.customProgramCacheKey();prepareBakedLighting(material);
 assert.equal(material.customProgramCacheKey(),key);
 const shader={fragmentShader:'#include <lights_fragment_maps>'};material.onBeforeCompile(shader,{});
 assert.equal(previousCalls,1);assert.ok(shader.fragmentShader.includes('irradiance += lightMapIrradiance'));
 assert.ok(shader.fragmentShader.includes('vec3 interiorProbe = getIBLIrradiance'));
 assert.ok(shader.fragmentShader.includes('dot(interiorProbe, vec3(0.2126, 0.7152, 0.0722))'));
 assert.ok(shader.fragmentShader.includes('radiance += getIBLRadiance'));
 const unbaked=new THREE.MeshStandardMaterial(),compile=unbaked.onBeforeCompile;prepareBakedLighting(unbaked);assert.equal(unbaked.onBeforeCompile,compile);
 const exterior=new THREE.MeshStandardMaterial({lightMap:new THREE.Texture()});exterior.name='STRUCCO';prepareBakedLighting(exterior);assert.equal(exterior.userData.bakedDiffusePrepared,undefined);
});
