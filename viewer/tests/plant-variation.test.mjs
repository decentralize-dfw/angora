import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {segmentConnectedComponents, applyPlantVariation} from '../src/plant-variation.js';

// Task 2.3 (runtime half) - each plant is a connected component of the
// merged buffer; one seed per plant, shared across every vertex of it.

function twoPlants() {
  const geometry = new THREE.BufferGeometry();
  // two disjoint triangles = two components
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0, 1, 0, 0, 0, 1, 0,
    10, 0, 0, 11, 0, 0, 10, 1, 0,
  ], 3));
  geometry.setIndex([0, 1, 2, 3, 4, 5]);
  return geometry;
}

test('disjoint plants get distinct seeds, vertices of one plant share theirs', () => {
  const {seeds, components} = segmentConnectedComponents(twoPlants());
  assert.equal(components, 2);
  assert.equal(seeds[0], seeds[1]);
  assert.equal(seeds[1], seeds[2]);
  assert.equal(seeds[3], seeds[4]);
  assert.notEqual(seeds[0], seeds[3]);
});

test('applyPlantVariation writes the attribute once and drifts hue in the shader', () => {
  const mesh = new THREE.Mesh(twoPlants(), new THREE.MeshStandardMaterial({name: 'foliage'}));
  const components = applyPlantVariation(mesh);
  assert.equal(components, 2);
  assert.ok(mesh.geometry.attributes._plantSeed);
  assert.equal(applyPlantVariation(mesh), 0, 'second run is a no-op');
  const shader = {uniforms: {}, vertexShader: '#include <begin_vertex>', fragmentShader: '#include <color_fragment>'};
  mesh.material.onBeforeCompile(shader, null);
  assert.match(shader.fragmentShader, /plantDrift/);
  assert.match(shader.vertexShader, /_plantSeed/);
  assert.match(mesh.material.customProgramCacheKey(), /plant-variation-v1/);
});

test('a single connected blob is left untouched - nothing to vary against', () => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
  geometry.setIndex([0, 1, 2]);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  assert.equal(applyPlantVariation(mesh), 0);
  assert.ok(!geometry.attributes._plantSeed);
});
