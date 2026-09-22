import assert from 'node:assert/strict';
import {test} from 'node:test';
import {CAMERAS, VIEWPORTS, cameraById, search, QA_HOUR, QA_SEASON, QA_STYLE} from '../src/qa-cameras.js';
import {readShareState} from '../src/share-state.js';

test('Twelve QA cameras, C01..C12, each unique and complete', () => {
  assert.equal(CAMERAS.length, 12);
  assert.deepEqual(CAMERAS.map(c => c.id), Array.from({length: 12}, (_, i) => 'C' + String(i + 1).padStart(2, '0')));
  for (const camera of CAMERAS) {
    assert.ok(camera.label, camera.id + ' has a label');
    assert.ok(camera.orbit || camera.walk, camera.id + ' has a pose');
    if (camera.orbit) {
      const {target, polar, azimuth, span, zoom, fov} = camera.orbit;
      assert.equal(target.length, 3);
      for (const value of [...target, polar, azimuth, span, zoom, fov]) assert.ok(Number.isFinite(value));
      assert.ok(span > 0 && polar >= 0 && polar < Math.PI);
    }
    if (camera.walk) {
      assert.match(camera.walk.room, /^f[0-3]-/);
      assert.ok(Number.isFinite(camera.walk.yaw) && Number.isFinite(camera.walk.pitch));
    }
  }
});

test('Every camera serialises to a link share-state.js itself accepts', () => {
  for (const camera of CAMERAS) {
    const url = search(camera, 'desktop');
    const state = readShareState(url);
    // The view survives the round trip exactly - an invalid view would be
    // silently dropped by the reader and the camera would open elsewhere.
    assert.equal(state.view, camera.view, camera.id + ' view rejected by share-state');
    assert.equal(state.hour, QA_HOUR);
    assert.equal(state.season, QA_SEASON);
    assert.equal(state.style, QA_STYLE);
    const params = new URLSearchParams(url);
    assert.equal(params.get('camera'), camera.id);
    assert.equal(params.get('stats'), '1');
  }
});

test('Walk cameras stand on their own floor', () => {
  for (const camera of CAMERAS.filter(c => c.walk)) {
    assert.equal(camera.view, camera.walk.room.slice(0, 2),
      camera.id + ' must open the floor its station lives on, or the interior stays hidden');
  }
});

test('Viewports match the plan: desktop 1600x900, mobile 393x852', () => {
  assert.deepEqual(VIEWPORTS.desktop, {width: 1600, height: 900});
  assert.deepEqual(VIEWPORTS.mobile, {width: 393, height: 852});
});

test('cameraById finds each camera and rejects strangers', () => {
  assert.equal(cameraById('C07').label, 'floor-f2');
  assert.equal(cameraById('C99'), null);
});
