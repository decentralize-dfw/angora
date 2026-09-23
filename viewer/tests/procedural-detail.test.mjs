import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {detailFor, detailTableFor, detailFragment, DETAIL_TABLE} from '../src/procedural-detail.js';
import {prepareBatchedMaterial} from '../src/batched-material.js';

// FAZ 6 İŞ B. Kabul 6.2: >=20 exterior and >=6 interior cells non-zero,
// counted against the DELIVERY'S OWN member names, not the table's hopes.
// Kabul 6.3: with the flag off the emitted GLSL and the cache key carry
// zero trace. BÖLÜM 2.4: one octave means the second octave's CODE is
// absent, not weighted away; exactly ONE new varying (world position).

// Member names lifted from the shipped manifests (batch inventory).
const EXTERIOR_MEMBERS = ['Clay tile', 'STRUCCO', 'stone_tile', 'ceiling.004',
  'neighbor_wall', 'Retaining wall rough limestone.001', 'metal', 'metal (5)', 'chrome (5)',
  'foliage', 'foliage_light', 'roof.004', 'Neighbor 20 green tiles', 'roof-7',
  'white_trim (5)', 'R31 | R39 boundary limestone top', 'R31 | R39 surrounding retaining stone',
  'pool_tile', 'STONE-TILE', 'Garden | Dark stained canopy timber', 'canopy.001',
  'R31 | R39 continuous grass ground', 'R31 | R37 fine asphalt aggregate',
  'gravel', 'Entrance coursed limestone.001', 'wood_dark.002'];
const INTERIOR_MEMBERS = ['INTERIOR', 'WOOD-FL', 'wood_floor.001', 'bath_tile',
  'Basement | Ochre wall tile 0', 'Basement | Ochre wall tile 3', 'terra_floor'];

test('kabul 6.2: >=20 exterior and >=6 interior cells are non-zero, counted', () => {
  const nonZero = names => names.filter(n => {const v = detailFor(n); return v.x || v.y;});
  const exterior = nonZero(EXTERIOR_MEMBERS), interior = nonZero(INTERIOR_MEMBERS);
  assert.ok(exterior.length >= 20, `exterior ${exterior.length} < 20: ${exterior.join(', ')}`);
  assert.ok(interior.length >= 6, `interior ${interior.length} < 6: ${interior.join(', ')}`);
});

test('glazing and water stay at vec4(0) - separate shader paths', () => {
  for (const name of ['Context glazing', 'water', 'glass', 'FINISH | Silver mirror',
    'R31 | R33 shower frosted glass']) {
    const v = detailFor(name);
    assert.deepEqual([v.x, v.y, v.z, v.w], [0, 0, 0, 0], name);
  }
});

test('interior amplitudes sit at half the exterior read (BÖLÜM 4.2)', () => {
  const stucco = detailFor('STRUCCO'), interior = detailFor('INTERIOR');
  assert.ok(interior.x <= stucco.x / 2 + 1e-9);
  assert.ok(interior.y <= stucco.y / 2 + 1e-9);
});

function shaderFor(names, opts) {
  const material = new THREE.MeshStandardMaterial();
  material.userData.angoraBatch = {grid: names.length > 1 ? 4 : 1, pad: 0.0039, inner: 0.2422, materials: names};
  prepareBatchedMaterial(material, opts);
  const shader = {uniforms: {}, vertexShader: '#include <begin_vertex>',
    fragmentShader: ['#include <map_fragment>', '#include <normal_fragment_maps>',
      '#include <roughnessmap_fragment>', '#include <metalnessmap_fragment>',
      '#include <color_fragment>', '#include <opaque_fragment>'].join('\n')};
  material.onBeforeCompile(shader, null);
  return {material, shader};
}

test('flag off = zero trace: no symbol, no uniform, cache key without the suffix', () => {
  const {material, shader} = shaderFor(['STRUCCO'], {});
  assert.ok(!shader.fragmentShader.includes('uDetail'));
  assert.ok(!shader.fragmentShader.includes('angoraDetailDrift'));
  assert.ok(!shader.vertexShader.includes('vDetailWorld'));
  assert.equal(shader.uniforms.uDetail, undefined);
  assert.ok(!material.customProgramCacheKey().includes('pdetail'));
});

test('flag on injects one varying, a per-cell uniform, drift after map and roughness', () => {
  const names = ['STRUCCO', 'metal', 'glass', 'Clay tile'];
  const {material, shader} = shaderFor(names, {proceduralDetail: true, detailOctaves: 2});
  assert.equal(shader.uniforms.uDetail.value.length, names.length);
  const varyings = (shader.vertexShader.match(/varying vec3 vDetailWorld/g) ?? []).length;
  assert.equal(varyings, 1, 'exactly one new vec3 varying');
  const frag = shader.fragmentShader;
  assert.ok(frag.indexOf('angoraDrift=angoraDetailDrift') > frag.indexOf('USE_MAP') - 1);
  assert.ok(frag.includes('roughnessFactor=clamp(roughnessFactor+angoraDrift.y'));
  assert.match(material.customProgramCacheKey(), /\|pdetail-v1:2/);
  // the glass cell is zero in the uniform, so the shader's d.z==0 early-out holds
  const glass = shader.uniforms.uDetail.value[2];
  assert.deepEqual([glass.x, glass.y, glass.z, glass.w], [0, 0, 0, 0]);
});

test('single octave removes the second noise CALL from the code, not just its weight', () => {
  const two = detailFragment({octaves: 2, count: 4});
  const one = detailFragment({octaves: 1, count: 4});
  assert.equal((two.match(/angoraNoise\(/g) ?? []).length - (one.match(/angoraNoise\(/g) ?? []).length, 1);
  assert.ok(!one.includes('*3.7'), 'octave-2 lattice absent in the one-octave form');
});

test('an all-zero batch (pure glazing) never injects at all', () => {
  const {material, shader} = shaderFor(['glass'], {proceduralDetail: true});
  assert.ok(!shader.fragmentShader.includes('uDetail'));
  assert.ok(!material.customProgramCacheKey().includes('pdetail'));
});
