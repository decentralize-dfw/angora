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
  for (const x of [-8, -6.3, 7.9, 9.6]) {
    const p = new THREE.Vector3(x, -.1 + nav.eye_height_m, -6.5);
    assert.ok(walkTo(surface, p, x, 2.2), 'rampa x=' + x);
    const feet = p.y - nav.eye_height_m;
    assert.ok(feet > 2.7 && feet < 3.2, 'üst kot x=' + x + ': ' + feet.toFixed(2));
  }
});

// 28.09: merdiven + çim tek rampa - yan bahçe boyunca enine de kesintisiz.
test('yan bahçe merdivenden çime enine kesintisiz (tek düzlem)', () => {
  const nav = data(), surface = new WalkSurface(nav); patchWalkSurface(surface);
  const at = (x, z) => new THREE.Vector3(x, surface.sample(x, z, 0, true, 99).height + nav.eye_height_m, z);
  for (const z of [-7, -4, -1.5, 1]) {
    assert.ok(walkTo(surface, at(7.7, z), 10.3, z), 'doğu enine z=' + z);
    assert.ok(walkTo(surface, at(-8.8, z), -6.0, z), 'batı enine z=' + z);
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

// 27.09 (2. tur): kapıdan çıkınca sokak merdiveni, doğu rampasından garaj
// önü, doğu merdiveninden bahçe; havuzun üstünde yürünmez.
const route = (start, points) => {
  const nav = data(), surface = new WalkSurface(nav); patchWalkSurface(surface);
  const p = new THREE.Vector3(start[0], start[1] + nav.eye_height_m, start[2]);
  return points.every(([x, z]) => walkTo(surface, p, x, z));
};
test('giriş kapısı -> sokak merdiveni; doğu rampası -> garaj önü; doğu merdiveni -> bahçe', () => {
  const nav = data(), gate = nav.stations.find(s => s.room_id === 'f1-Z01').position;
  assert.ok(route([gate[0], gate[1] - nav.eye_height_m, gate[2]], [[2.2, 4.4], [2.4, 5.0], [4.6, 5.2], [5.0, 8.5]]));
  assert.ok(route([9.6, -.1, -6.5], [[9.6, 1.0], [9.4, 2.2], [8.0, 2.4], [6.0, 2.6]]));
  assert.ok(route([8.0, 3.1, 2.2], [[8.1, -4.5], [8.3, -4.9], [8.3, -7.2], [8.6, -9.0]]));
});
test('havuzun üstünde yürünmez', () => {
  assert.equal(route([3.3, 0, -12.3], [[3.3, -15.9]]), false);
});
