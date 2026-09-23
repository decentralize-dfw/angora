import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {reviveBatchedGrade} from '../src/exterior-grade.js';

// FAZ 6 İŞ A - kabul 6.1: the revival reaches at least EIGHT of the
// delivery's reachable grid=1 single-member batches, counted, not claimed.

// FAZ-6-DUZ-RENK.md BÖLÜM 1: the five idle grid=1 surfaces join the four
// live ones; water is poolWaterV2's and INTERIOR is İŞ D's, not this table's.
const REACHABLE = ['Clay tile', 'STRUCCO', 'stone_tile', 'ceiling.004',
  'neighbor_wall', 'Retaining wall rough limestone.001', 'metal', 'wood_dark.002'];

function batchedScene(names) {
  const group = new THREE.Group();
  for (const name of names) {
    const material = new THREE.MeshStandardMaterial({name: 'batched-' + name});
    material.userData.angoraBatch = {grid: 1, pad: 4 / 512, inner: 504 / 512, materials: [name]};
    group.add(new THREE.Mesh(new THREE.BoxGeometry(), material));
  }
  return group;
}

const fakeSets = () => Object.fromEntries(['clayTileMap','clayTileNormal','clayTileOrm','grassMap','grassNormal','grassOrm','asphaltMap','asphaltNormal','asphaltOrm','travertineMap','travertineNormal','travertineOrm','stuccoMap','stuccoMapSoft','stuccoNormal','stuccoOrm','limestoneMap','limestoneNormal','limestoneOrm','timberMap','timberNormal','timberOrm','metalNormal','metalOrm']
  .map(name => [name, Object.assign(new THREE.Texture(), {repeat: new THREE.Vector2(1, 1)})]));

test('İŞ A: applied count reaches 8 over the reachable single-member batches', () => {
  const group = batchedScene(REACHABLE);
  const applied = reviveBatchedGrade(new Map([['a', group]]), fakeSets());
  assert.ok(applied >= 8, `applied ${applied} < 8`);
});

test('the iron row keeps its colour and gains a response, placeholder map NULLED', () => {
  const group = batchedScene(['metal']);
  const material = group.children[0].material;
  let disposed = false;
  material.map = Object.assign(new THREE.Texture(), {dispose: () => {disposed = true;}});
  assert.equal(reviveBatchedGrade(new Map([['a', group]]), fakeSets()), 1);
  assert.equal('#' + material.color.getHexString(), '#212326', 'colour still the delivery\'s');
  assert.equal(material.map, null, 'placeholder map nulled');
  assert.equal(disposed, true);
  // The cell measured a single RGB value - range 0. Scalars alone left it
  // reading as a decal, so it takes the brushed sheet: relief plus a
  // roughness that drifts. The factors go to 1 because glTF multiplies
  // them into the sampled value.
  assert.ok(material.roughnessMap, 'brushed response bound');
  assert.equal(material.roughnessMap, material.metalnessMap, 'one sheet, G and B');
  assert.equal(material.roughness, 1);
  assert.equal(material.metalness, 1);
  assert.ok(material.userData.exteriorGradeDetail.includes('roughnessMap'));
  assert.equal(reviveBatchedGrade(new Map([['a', group]]), fakeSets()), 0, 'second run no-op');
});

test('neighbour timber gets a real grain, not just a roughness number', () => {
  const group = batchedScene(['wood_dark.002']);
  const material = group.children[0].material;
  assert.equal(reviveBatchedGrade(new Map([['a', group]]), fakeSets()), 1);
  assert.ok(material.map, 'directional grain sheet');
  assert.ok(material.normalMap, 'relief');
  assert.ok(material.roughnessMap, 'response');
});

test('interior timber and water stay untouched here - İŞ D and poolWaterV2 own them', () => {
  const group = batchedScene(['WOOD-FL', 'wood_floor.001', 'water', 'INTERIOR']);
  assert.equal(reviveBatchedGrade(new Map([['a', group]]), fakeSets()), 0);
});
