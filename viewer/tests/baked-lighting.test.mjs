import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import fs from 'node:fs';
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

// The closing lights the villa's windows from outside, and it can only do
// that if the delivered pane is actually recognised as glazing. It is not
// see-through by three's reckoning: alphaMode BLEND, no baseColorFactor, no
// KHR_materials_transmission, so opacity reads 1 and the alpha is in the
// texture. Asking isSeeThrough collected nothing and the glow lit an empty
// set, so the predicate is checked against the shipped asset.
test('the delivered glazing is recognised by the test the glow uses', async () => {
  const {isGlazing, isSeeThrough} = await import('../src/lighting.js');
  const glb = fs.readFileSync(new URL('../../build/web/batched/desktop/architecture.glb', import.meta.url));
  let offset = 12, gltf = null;
  while (offset < glb.length) {
    const length = glb.readUInt32LE(offset), kind = glb.readUInt32LE(offset + 4);
    if (kind === 0x4E4F534A) {gltf = JSON.parse(glb.slice(offset + 8, offset + 8 + length).toString('utf8')); break;}
    offset += 8 + length;
  }
  assert.ok(gltf, 'architecture.glb carries no JSON chunk');
  const panes = gltf.materials.filter(m => /glass/i.test(m.name));
  assert.ok(panes.length, 'the delivery has no glass material to light');
  for (const pane of panes) {
    // As three.js would build it from this glTF.
    const material = {name: pane.name, transmission: pane.extensions?.KHR_materials_transmission?.transmissionFactor ?? 0,
      transparent: pane.alphaMode === 'BLEND', opacity: pane.pbrMetallicRoughness?.baseColorFactor?.[3] ?? 1};
    assert.equal(isGlazing(material), true, `${pane.name} is not recognised as glazing`);
  }
  // And the reason the first attempt failed is recorded, so it cannot be
  // quietly swapped back to the stricter test.
  const source = fs.readFileSync(new URL('../src/lighting.js', import.meta.url), 'utf8');
  assert.match(source, /name==='architecture'&&isGlazing\(material\)\)glazing\.add/,
    'the glow collects its windows with something other than isGlazing');
  assert.equal(isSeeThrough({transmission: 0, transparent: true, opacity: 1}), false,
    'isSeeThrough changed meaning; re-check what the glow collects');
});
