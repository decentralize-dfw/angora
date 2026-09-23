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

const fakeSets = () => Object.fromEntries(['clayTileMap', 'clayTileNormal', 'grassMap',
  'asphaltMap', 'travertineMap', 'travertineNormal', 'stuccoNormal',
  'stuccoMap', 'stuccoMapSoft']
  .map(name => [name, Object.assign(new THREE.Texture(), {repeat: new THREE.Vector2(1, 1)})]));

test('İŞ A: applied count reaches 8 over the reachable single-member batches', () => {
  const group = batchedScene(REACHABLE);
  const applied = reviveBatchedGrade(new Map([['a', group]]), fakeSets());
  assert.ok(applied >= 8, `applied ${applied} < 8`);
});

test('the scalar iron row grades in place, NULLS the placeholder map, no detail slot', () => {
  const group = batchedScene(['metal']);
  const material = group.children[0].material;
  let disposed = false;
  material.map = Object.assign(new THREE.Texture(), {dispose: () => {disposed = true;}});
  assert.equal(reviveBatchedGrade(new Map([['a', group]]), fakeSets()), 1);
  assert.equal(material.userData.exteriorGradeDetail, undefined);
  assert.equal('#' + material.color.getHexString(), '#212326');
  assert.equal(material.roughness, 0.58);
  assert.equal(material.metalness, 0.22);
  assert.equal(material.map, null, 'BÖLÜM 1: placeholder map nulled');
  assert.equal(disposed, true);
  assert.equal(reviveBatchedGrade(new Map([['a', group]]), fakeSets()), 0, 'second run no-op');
});

test('neighbour timber gets its sheen broken, nothing else', () => {
  const group = batchedScene(['wood_dark.002']);
  const material = group.children[0].material;
  assert.equal(reviveBatchedGrade(new Map([['a', group]]), fakeSets()), 1);
  assert.equal(material.roughness, 0.82);
  assert.equal(material.normalMap, null);
});

test('interior timber and water stay untouched here - İŞ D and poolWaterV2 own them', () => {
  const group = batchedScene(['WOOD-FL', 'wood_floor.001', 'water', 'INTERIOR']);
  assert.equal(reviveBatchedGrade(new Map([['a', group]]), fakeSets()), 0);
});
