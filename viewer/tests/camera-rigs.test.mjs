import assert from 'node:assert/strict';
import {test} from 'node:test';
import {VIEW_CAMERA, LEGACY_FOV, rigFovFor} from '../src/camera-rigs.js';

test('Each view names its lens; storeys share the floor rig', () => {
  assert.equal(rigFovFor('region'), VIEW_CAMERA.region.fov);
  assert.equal(rigFovFor('neighborhood'), VIEW_CAMERA.neighborhood.fov);
  for (const floor of ['f0', 'f1', 'f2', 'f3']) assert.equal(rigFovFor(floor), VIEW_CAMERA.floor.fov);
});

test('Unknown views and a disabled rig both fall back to the legacy 16', () => {
  assert.equal(rigFovFor('plan'), LEGACY_FOV);
  assert.equal(rigFovFor('anything-else'), LEGACY_FOV);
  assert.equal(rigFovFor('neighborhood', {enabled: false}), LEGACY_FOV);
});

test('Every rig widens the telephoto without reaching walk territory', () => {
  for (const [view, rig] of Object.entries(VIEW_CAMERA)) {
    assert.ok(rig.fov > LEGACY_FOV, view + ' must widen past 16');
    assert.ok(rig.fov < 45, view + ' is an exterior rig, not a walking lens');
  }
});
