import assert from 'node:assert/strict';
import {test} from 'node:test';
import {MeshStandardMaterial, ShaderLib} from 'three';
import {prepareBatchedMaterial} from '../src/batched-material.js';

// Bölüm 0.7.5 rule 4: an onBeforeCompile replace() that stops matching
// fails SILENTLY - the claim "the shader was changed" is unproven without
// reading the source back. These tests run the real onBeforeCompile against
// three's own physical shader and read the result.
function compiled(options) {
  const material = new MeshStandardMaterial();
  material.userData.angoraBatch = {grid: 1, pad: 4 / 512, inner: 504 / 512, materials: ['grass']};
  prepareBatchedMaterial(material, options);
  const shader = {uniforms: {}, vertexShader: ShaderLib.physical.vertexShader,
    fragmentShader: ShaderLib.physical.fragmentShader};
  material.onBeforeCompile(shader, {});
  return shader;
}

test('Task 1.6: exterior surfaces compile the fixture loops out entirely', () => {
  const shader = compiled({exterior: true});
  // The include must be EXPANDED (a leftover include would be re-expanded by
  // three with the live light counts, undoing the strip)...
  assert.ok(!shader.fragmentShader.includes('#include <lights_fragment_begin>'),
    'lights_fragment_begin still an include - strip never ran');
  // ...and every spot/point count literal replaced by zero.
  assert.ok(!shader.fragmentShader.includes('NUM_SPOT_LIGHTS'), 'spot loops survived');
  assert.ok(!shader.fragmentShader.includes('NUM_POINT_LIGHTS'), 'point loops survived');
});

test('Interior surfaces keep their fixture loops', () => {
  // No strip: the include stays for three to expand with the LIVE light
  // counts (the template itself carries the include, not the literals).
  const shader = compiled({exterior: false});
  assert.ok(shader.fragmentShader.includes('#include <lights_fragment_begin>'));
});

// Task 1.3: a slot bound to a tileable detail map escapes the atlas path -
// hardware mips and anisotropy - while its siblings stay on atlasSample.
test('Detail-bound slots bypass atlasSample, the rest keep it', () => {
  const material = new MeshStandardMaterial();
  material.userData.angoraBatch = {grid: 1, pad: 4 / 512, inner: 504 / 512, materials: ['Clay tile']};
  material.userData.exteriorGradeDetail = ['map', 'normalMap'];
  prepareBatchedMaterial(material, {exterior: true});
  const shader = {uniforms: {}, vertexShader: ShaderLib.physical.vertexShader,
    fragmentShader: ShaderLib.physical.fragmentShader};
  material.onBeforeCompile(shader, {});
  assert.ok(shader.fragmentShader.includes('texture2D( map, vMapUv )'), 'map stayed on the atlas path');
  assert.ok(!shader.fragmentShader.includes('atlasSample( map,'), 'map still atlas-sampled');
  assert.ok(shader.fragmentShader.includes('atlasSample( roughnessMap,'), 'roughness lost its atlas path');
  // The program key must tell the two variants apart or three reuses the
  // pre-revival program and the bypass silently never compiles.
  const before = material.customProgramCacheKey();
  material.userData.exteriorGradeDetail = [];
  assert.notEqual(material.customProgramCacheKey(), before);
});

test('Atlas sampling is injected for the batched quartet', () => {
  const shader = compiled({exterior: true});
  assert.ok(shader.fragmentShader.includes('atlasSample('), 'atlasSample missing');
  assert.ok(shader.vertexShader.includes('attribute float _batchid'), '_batchid attribute missing');
});
