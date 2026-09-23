import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';

// DAİMİ EMİR A6: the regression list's "VR" IS a product feature - the
// WebXR immersive walk (walk.js xrActive path + enableImmersiveWalk +
// main.js sessionstart wiring). These tests drive the XR update path with
// a faked XRSession: left stick moves the head on the walking surface,
// the right stick snap-turns once per push, never continuously.

// walk.js binds window/document listeners in its constructor; node has
// neither, so stub the few entry points before the import.
globalThis.window ??= {addEventListener() {}};
globalThis.document ??= {addEventListener() {}, querySelectorAll: () => [], hidden: false};
const {InteriorWalk} = await import('../src/walk.js');

const data = JSON.parse(fs.readFileSync(new URL('../../build/web/full/navigation.json', import.meta.url)));
const canvas = {addEventListener() {}, setPointerCapture() {}, releasePointerCapture() {}};

const session = sticks => ({inputSources: Object.entries(sticks).map(([handedness, axes]) =>
  ({handedness, gamepad: {axes}}))});

function walkAtFirstStation() {
  const walk = new InteriorWalk(data, canvas, () => {});
  walk.active = true;
  const station = data.stations[0];
  walk.camera.position.set(...station.position);
  walk.floor = station.floor;
  walk.startXR();
  return walk;
}

test('XR left stick walks the head across the surface, held at eye height', () => {
  const walk = walkAtFirstStation();
  const before = walk.camera.getWorldPosition(new THREE.Vector3());
  // dt clamps at 50 ms per tick - walk sixteen frames, 0.8 s of stick time
  for (let tick = 0; tick <= 16; tick++) walk.update(tick * 50, session({left: [0, 0, 0, -1]}));
  const after = walk.camera.getWorldPosition(new THREE.Vector3());
  const moved = Math.hypot(after.x - before.x, after.z - before.z);
  assert.ok(moved > 0.2, `moved ${moved.toFixed(3)} m`);
  assert.ok(Math.abs(after.y - before.y) < 0.6, 'no falling through the floor');
});

test('XR right stick snap-turns exactly once per push', () => {
  const walk = walkAtFirstStation();
  const yawBefore = walk.rig.rotation.y;
  walk.update(0, session({right: [0, 0, 1, 0]}));
  const yawOnce = walk.rig.rotation.y;
  assert.ok(Math.abs(yawOnce - yawBefore) > 0.4, 'one snap turn (30°)');
  walk.update(100, session({right: [0, 0, 1, 0]}));     // still held
  assert.equal(walk.rig.rotation.y, yawOnce, 'held stick spins nobody');
  walk.update(200, session({right: [0, 0, 0, 0]}));     // released
  walk.update(300, session({right: [0, 0, 1, 0]}));
  assert.ok(Math.abs(walk.rig.rotation.y - yawOnce) > 0.4, 'released then pushed = second turn');
});

test('XR storey request fires on a vertical push, once', () => {
  const walk = walkAtFirstStation();
  const requests = [];
  walk.onFloorRequest = d => requests.push(d);
  walk.update(0, session({right: [0, 0, 0, -1]}));
  walk.update(100, session({right: [0, 0, 0, -1]}));
  assert.deepEqual(requests, [1], 'up once while held');
});
