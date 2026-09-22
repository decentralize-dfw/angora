import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {applyWaterSurface, waterBoundsFrom, WATER_SHALLOW, WATER_DEEP} from '../src/water-surface.js';

// Task 3.5 - the pool response rides the garden batch by _batchid: one draw,
// no new geometry, and a wave phase that comes in as a shared uniform.

function gardenBatchFixture() {
  const geometry = new THREE.BufferGeometry();
  // two water vertices (id 2) inside a batch of three surfaces
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0, 4, 0, 6, 10, 1, 2, -3, 0, -5,
  ], 3));
  geometry.setAttribute('_batchid', new THREE.Float32BufferAttribute([2, 2, 0, 1], 1));
  const material = new THREE.MeshStandardMaterial({name: 'garden-other-1'});
  material.userData.angoraBatch = {materials: ['grass', 'stone', 'water']};
  return {geometry, material};
}

test('waterBoundsFrom reads only the water vertices', () => {
  const {geometry} = gardenBatchFixture();
  const bounds = waterBoundsFrom(geometry, 2);
  assert.deepEqual([bounds.x, bounds.y, bounds.z, bounds.w], [0, 0, 4, 6]);
  assert.equal(waterBoundsFrom(geometry, 7), null, 'an absent id yields no bounds');
});

test('the injection keys on the water batch id and keeps one draw', () => {
  const {geometry, material} = gardenBatchFixture();
  const phase = {value: 0};
  assert.equal(applyWaterSurface(material, {bounds: waterBoundsFrom(geometry, 2), phase}), true);
  const shader = {uniforms: {}, vertexShader: '#include <begin_vertex>',
    fragmentShader: ['#include <normal_fragment_maps>', '#include <color_fragment>',
      '#include <roughnessmap_fragment>', '#include <metalnessmap_fragment>'].join('\n')};
  material.onBeforeCompile(shader, null);
  assert.match(shader.vertexShader, /_batchid - 2\.0/);
  assert.equal(shader.uniforms.waterPhase, phase, 'phase is the shared uniform, not a copy');
  assert.match(shader.fragmentShader, /waterWaveNormal/);
  assert.match(shader.fragmentShader, /roughnessFactor = 0\.07/);
  assert.match(shader.fragmentShader, /metalnessFactor = 0\.0/);
  // absorption spans the plan's tints
  assert.match(shader.fragmentShader, new RegExp(WATER_SHALLOW[0].toFixed(3)));
  assert.match(shader.fragmentShader, new RegExp(WATER_DEEP[0].toFixed(3)));
});

test('a batch without water, or missing bounds, stays untouched', () => {
  const material = new THREE.MeshStandardMaterial();
  material.userData.angoraBatch = {materials: ['grass']};
  assert.equal(applyWaterSurface(material, {bounds: new THREE.Vector4(), phase: {value: 0}}), false);
  const {material: garden} = gardenBatchFixture();
  assert.equal(applyWaterSurface(garden, {bounds: null, phase: {value: 0}}), false);
});
