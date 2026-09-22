import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {upgradeAtlasToArrays} from '../src/atlas-array.js';
import {prepareBatchedMaterial} from '../src/batched-material.js';

// Task 3.3 (runtime half). The array branch replaces the clamped
// textureLod atlas walk with a layer lookup on CONTINUOUS UVs; without the
// upgrade - or where it cannot run - the v6 atlas path stands untouched.

function atlasMaterial() {
  const material = new THREE.MeshStandardMaterial();
  material.userData.angoraBatch = {grid: 4, pad: 0.0039, inner: 0.2422, materials: Array(16).fill('x')};
  return material;
}

function fragmentFor(material) {
  prepareBatchedMaterial(material);
  const shader = {uniforms: {}, vertexShader: '#include <begin_vertex>',
    fragmentShader: ['#include <map_fragment>', '#include <normal_fragment_maps>',
      '#include <roughnessmap_fragment>', '#include <metalnessmap_fragment>'].join('\n')};
  material.onBeforeCompile(shader, null);
  return shader;
}

test('with arrays bound, the atlased slots sample layers on continuous UVs', () => {
  const material = atlasMaterial();
  material.map = new THREE.Texture();
  const array = new THREE.DataArrayTexture(new Uint8Array(4), 1, 1, 1);
  material.userData.atlasArrays = {map: array, normalMap: array};
  const shader = fragmentFor(material);
  assert.match(shader.fragmentShader, /uniform highp sampler2DArray atlasArray_map;/);
  assert.match(shader.fragmentShader, /texture\( atlasArray_map, vec3\( vMapUv, floor\(batchId\+0\.5\) \) \)/);
  assert.equal(shader.uniforms.atlasArray_map.value, array);
  // slots without an array keep the v6 atlas walk
  assert.match(shader.fragmentShader, /atlasSample\( roughnessMap/);
  assert.match(material.customProgramCacheKey(), /\|array:map\.normalMap/);
});

test('without the upgrade the v6 path is byte-identical in spirit: no array symbols', () => {
  const shader = fragmentFor(atlasMaterial());
  assert.ok(!shader.fragmentShader.includes('sampler2DArray'));
  assert.match(shader.fragmentShader, /atlasSample\( map/);
});

test('upgradeAtlasToArrays skips grid-1 heroes, texture-less slots and already-upgraded materials', () => {
  const hero = new THREE.MeshStandardMaterial();
  hero.userData.angoraBatch = {grid: 1, pad: 0, inner: 1, materials: ['Clay tile']};
  const bare = atlasMaterial();   // no textures bound at all
  const done = atlasMaterial();
  done.userData.atlasArrays = {map: new THREE.DataArrayTexture(new Uint8Array(4), 1, 1, 1)};
  const group = new THREE.Group();
  for (const m of [hero, bare, done]) group.add(new THREE.Mesh(new THREE.BoxGeometry(), m));
  assert.equal(upgradeAtlasToArrays(new Map([['a', group]])), 0);
});
