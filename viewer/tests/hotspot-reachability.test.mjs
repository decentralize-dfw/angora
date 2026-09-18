import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WalkSurface} from '../src/walk-surface.js';
import {reachableStations} from '../src/hotspots.js';

// The recording's 02:23 complaint, as a test on the REAL navigation data:
// standing in the Salon, "Garaj" and "Tesisat odası" looked like doors in
// the living-room wall. The admission rule must keep wall-blocked rooms in
// the menu and only mark targets whose walk matches their sightline.
const data = JSON.parse(readFileSync(new URL('../../build/web/full/navigation.json', import.meta.url), 'utf8'));
const surface = new WalkSurface(data);

test('From the Salon, wall-blocked service rooms earn no floating marker', () => {
  const salon = data.stations.find((s) => /salon/i.test(s.name));
  assert.ok(salon, 'the Salon has a station');
  const position = {x: salon.position[0], y: salon.position[1], z: salon.position[2]};
  const admitted = reachableStations(surface, position, salon.floor_index, salon.room_id, true);
  const names = admitted.map((a) => a.station.name);
  assert.ok(admitted.length >= 1, `something nearby is admitted (${names.join(', ')})`);
  for (const bad of [/garaj/i, /tesisat/i])
    assert.ok(!names.some((n) => bad.test(n)), `${bad} stays in the room menu, got: ${names.join(', ')}`);
  // every admitted marker anchors on the actual route, near the visitor
  for (const a of admitted) {
    const d = Math.hypot(a.anchor[0] - position.x, a.anchor[2] - position.z);
    assert.ok(d <= 6.5, `${a.station.name} anchors ${d.toFixed(1)} m away, on the route`);
  }
});

test('Admission is by walk length, not straight line, on every floor', () => {
  for (const station of data.stations) {
    const position = {x: station.position[0], y: station.position[1], z: station.position[2]};
    for (const a of reachableStations(surface, position, station.floor_index, station.room_id, true)) {
      const path = surface.path(station.position, a.station.position, true);
      assert.ok(path, `${station.name} -> ${a.station.name} walkable`);
      let length = 0;
      for (let i = 1; i < path.length; i++) length += Math.hypot(path[i][0] - path[i - 1][0], path[i][2] - path[i - 1][2]);
      const straight = Math.hypot(a.station.position[0] - position.x, a.station.position[2] - position.z);
      assert.ok(length <= Math.max(6, straight * 1.7) + 1e-6, `${station.name} -> ${a.station.name} ratio holds`);
    }
  }
});
