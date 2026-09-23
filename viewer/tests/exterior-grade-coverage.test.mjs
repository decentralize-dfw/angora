import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {reviveBatchedGrade} from '../src/exterior-grade.js';

// FAZ 6 İŞ A - kabul 6.1: the revival reaches at least EIGHT of the
// delivery's reachable grid=1 single-member batches, counted, not claimed.

const REACHABLE = ['Clay tile', 'STRUCCO', 'stone_tile', 'ceiling.004',
  'INTERIOR', 'neighbor_wall', 'Retaining wall rough limestone.001', 'metal'];

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
  'asphaltMap', 'travertineMap', 'travertineNormal', 'stuccoNormal']
  .map(name => [name, Object.assign(new THREE.Texture(), {repeat: new THREE.Vector2(1, 1)})]));

test('İŞ A: applied count reaches 8 over the reachable single-member batches', () => {
  const group = batchedScene(REACHABLE);
  const applied = reviveBatchedGrade(new Map([['a', group]]), fakeSets());
  assert.ok(applied >= 8, `applied ${applied} < 8`);
});

test('the scalar iron row grades in place without inventing a detail slot', () => {
  const group = batchedScene(['metal']);
  const material = group.children[0].material;
  assert.equal(reviveBatchedGrade(new Map([['a', group]]), fakeSets()), 1);
  assert.equal(material.userData.exteriorGradeDetail, undefined);
  assert.equal('#' + material.color.getHexString(), '#212326');
  assert.equal(material.roughness, 0.58);
  assert.equal(material.metalness, 0.22);
  assert.equal(reviveBatchedGrade(new Map([['a', group]]), fakeSets()), 0, 'second run no-op');
});

test('timber stays untouched - no wood sheet ships, stucco on wood would lie', () => {
  const group = batchedScene(['WOOD-FL', 'wood_dark.002', 'wood_floor.001']);
  assert.equal(reviveBatchedGrade(new Map([['a', group]]), fakeSets()), 0);
});
