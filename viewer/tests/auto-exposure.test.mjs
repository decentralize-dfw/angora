import test from 'node:test';
import assert from 'node:assert/strict';
import {meteredEv, correctionEv, REFERENCE_EV} from '../src/auto-exposure.js';
import {resolveFeatures} from '../src/features.js';

const grid = ev => {const px = new Uint8Array(32 * 18 * 4); px.fill(Math.round((ev + 10) / 16 * 255)); return px;};

test('auto exposure meters a uniform frame at its own EV', () => {
  assert.ok(Math.abs(meteredEv(grid(-3)) - -3) < .07);
  assert.ok(Math.abs(meteredEv(grid(2)) - 2) < .07);
});

test('auto exposure leaves the approved frames near alone and stays within its limits', () => {
  assert.equal(correctionEv(REFERENCE_EV), 0);
  for (const ev of [-2.74, -2.60, -2.37, -1.99, -1.97]) assert.ok(Math.abs(correctionEv(ev)) < .25, `measured approved frame ${ev}`);
  assert.equal(correctionEv(REFERENCE_EV - 6), .5);
  assert.equal(correctionEv(REFERENCE_EV + 6), -1);
  const room = correctionEv(REFERENCE_EV - .8);
  assert.ok(room > 0 && room < .8, 'a dark room is lifted only partly - it still reads darker');
});

test('auto exposure does not lift a dark frame that also holds sun or sky', () => {
  assert.equal(correctionEv(-3.4, {bright: .3}), 0, 'under the eaves looking out: garden must not burn out');
  assert.ok(correctionEv(-3.4, {bright: .1}) < correctionEv(-3.4, {bright: 0}));
});

test('auto exposure never brightens the night', () => {
  assert.equal(correctionEv(REFERENCE_EV - 4, {daylight: 0}), 0);
  assert.ok(correctionEv(REFERENCE_EV + 4, {daylight: 0}) < 0, 'it may still stop down a glare');
});

test('eye adaptation is on by default, Neutral curve waits for the owner A/B', () => {
  const f = resolveFeatures('');
  assert.equal(f.autoExposure, true);
  assert.equal(f.neutralTone, false);
  assert.equal(resolveFeatures('?features=neutralTone:1').neutralTone, true);
});
