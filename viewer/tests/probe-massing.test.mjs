import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {probeMassingFrom} from '../src/lighting.js';

// Task 3.4f - the PMREM probe's neighbourhood stand-in. It must carry the
// delivered geometry by reference (the probe renders once; copying 2M
// triangles would double geometry memory for nothing), freeze world
// transforms, and leave out everything that would bake wrong: furniture,
// and alpha-carded planting that has no opaque silhouette.

function contextFixture() {
  const root = new THREE.Group();
  const building = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 4), new THREE.MeshStandardMaterial({name: 'B10 render'}));
  building.position.set(10, 4, -3);
  const terrain = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshStandardMaterial({name: 'terrain'}));
  const foliage = new THREE.Mesh(new THREE.PlaneGeometry(2, 3), new THREE.MeshStandardMaterial({name: 'foliage_light', transparent: true}));
  const alphaCard = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({name: 'hedge card', alphaTest: 0.5}));
  const chair = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({name: 'chair'}));
  chair.userData.category = 'furniture';
  root.add(building, terrain, foliage, alphaCard, chair);
  return {root, building, terrain};
}

test('the stand-in keeps buildings and terrain, drops furniture and planting', () => {
  const {root} = contextFixture();
  const group = probeMassingFrom(root);
  assert.equal(group.children.length, 2);
});

test('geometry is shared by reference and world transforms are frozen', () => {
  const {root, building} = contextFixture();
  const group = probeMassingFrom(root);
  const stand = group.children.find(o => o.geometry === building.geometry);
  assert.ok(stand, 'building geometry reused, not copied');
  assert.equal(stand.matrixAutoUpdate, false);
  const p = new THREE.Vector3().setFromMatrixPosition(stand.matrix);
  assert.deepEqual([p.x, p.y, p.z], [10, 4, -3]);
});

test('one unlit material serves the whole mass', () => {
  const {root} = contextFixture();
  const group = probeMassingFrom(root);
  const materials = new Set(group.children.map(o => o.material));
  assert.equal(materials.size, 1);
  assert.ok([...materials][0].isMeshBasicMaterial);
});
