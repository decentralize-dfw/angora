import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {BAKED_AO_TABLE, bakedOcclusionTargets, reviveBakedOcclusion} from '../src/ao-revival.js';

// Task 3.4d - the source KTX2 occlusion bakes rebind onto the batched
// materials' EXISTING aoMap slot: single-member batches only, channel and
// strength carried over, WebP disposed, and no loader means no change.

function batchedModel(name, {aoChannel = 1, members = [name]} = {}) {
  const material = new THREE.MeshStandardMaterial({name: 'batched-' + name});
  material.userData.angoraBatch = {materials: members};
  material.aoMap = new THREE.Texture();
  material.aoMap.channel = aoChannel;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), material);
  const group = new THREE.Group();
  group.add(mesh);
  return {model: group, material};
}

test('targets are the single-member batches the table names, once per material', () => {
  const clay = batchedModel('Clay tile');
  const merged = batchedModel('Clay tile', {members: ['Clay tile', 'stone_tile']});
  const stranger = batchedModel('bath_tile');
  const models = new Map([['a', clay.model], ['b', merged.model], ['c', stranger.model]]);
  const targets = bakedOcclusionTargets(models);
  assert.equal(targets.length, 1);
  assert.equal(targets[0].material, clay.material);
  assert.equal(targets[0].file, BAKED_AO_TABLE['Clay tile']);
});

test('the swap keeps the UV channel and disposes the WebP', async () => {
  const clay = batchedModel('Clay tile', {aoChannel: 1});
  let disposed = false;
  clay.material.aoMap.dispose = () => {disposed = true;};
  const loaded = new THREE.Texture();
  const loader = {loadAsync: async url => {
    assert.match(url, /ktx2\/03c254ed6af70a7f65c19d30\.ktx2$/);
    return loaded;
  }};
  const applied = await reviveBakedOcclusion(new Map([['a', clay.model]]),
    {loader, root: new URL('https://example.test/build/web/native-current/')});
  assert.equal(applied, 1);
  assert.equal(clay.material.aoMap, loaded);
  assert.equal(loaded.channel, 1);
  assert.equal(disposed, true);
});

test('no transcode path on the device means the WebP stands', async () => {
  const clay = batchedModel('Clay tile');
  const before = clay.material.aoMap;
  const applied = await reviveBakedOcclusion(new Map([['a', clay.model]]),
    {loader: null, root: new URL('https://example.test/')});
  assert.equal(applied, 0);
  assert.equal(clay.material.aoMap, before);
});
