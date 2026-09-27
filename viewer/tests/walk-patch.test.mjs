import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {WalkSurface, patchWalkSurface} from '../src/walk-surface.js';

// 27.09: yan merdivenlere tek eğimli rampa, antre -> garaj kapısı 0,9 m.
const data = () => JSON.parse(readFileSync(new URL('../../build/web/native-current/native-navigation.json', import.meta.url), 'utf8'));
const walkTo = (surface, p, x, z) => {
  for (let i = 0; i < 900; i++) {
    const d = new THREE.Vector3(x - p.x, 0, z - p.z); if (d.length() < .06) return true;
    d.setLength(.03); if (!surface.move(p, d.x, d.z, true)) return false;
  }
  return false;
};

test('iki yan rampadan bahçeden giriş kotuna yürünür', () => {
  const nav = data(), surface = new WalkSurface(nav); patchWalkSurface(surface);
  for (const x of [-8, 9.6]) {
    const p = new THREE.Vector3(x, -.1 + nav.eye_height_m, -6.5);
    assert.ok(walkTo(surface, p, x, 2.2), 'rampa x=' + x);
    assert.ok(Math.abs(p.y - nav.eye_height_m - 2.8) < .05);
  }
});

test('antre kapısından garaja geçilir; yamasız veride geçilmiyordu', () => {
  const nav = data(), st = id => new THREE.Vector3(...nav.stations.find(s => s.room_id === id).position);
  const original = new WalkSurface(nav), p0 = st('f1-Z02');
  walkTo(original, p0, 2.2, -.16);
  assert.equal(walkTo(original, p0, 4.9, -.16), false);
  const patched = new WalkSurface(nav); patchWalkSurface(patched);
  const p = st('f1-Z02');
  assert.ok(walkTo(patched, p, 2.2, -.16) && walkTo(patched, p, 4.9, -.16) && walkTo(patched, p, 5.78, -2.06));
});
