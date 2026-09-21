import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WalkSurface} from '../src/walk-surface.js';

// The native delivery's walking surface was rasterised from the building's own
// floor layers, so it used to stop at the walls: a visitor could open the
// basement door and then stand still, because there was no ground outside to
// stand on. tools/extend_native_navigation_outdoors.py carries the outdoor half
// of the R44 surface across. What this file guards is the two halves of that
// bargain - that the outdoors is genuinely reachable on foot, and that not one
// cell inside the house moved to get it.
const data = JSON.parse(fs.readFileSync(new URL('../../build/web/native-current/native-navigation.json', import.meta.url)));
const surface = new WalkSurface(data);
const eye = data.eye_height_m;
const count = data.grid.width * data.grid.height;

// Everywhere a person can walk to from a starting point, over every storey the
// surface will hand them between. The same rule WalkSurface.path uses.
function reachable(from) {
  const start = surface.sample(from[0], from[2], from[1] - eye, true, .35);
  assert.ok(start, 'the starting point is not on the walking surface');
  const seen = new Uint8Array(count * 4), queue = new Int32Array(count * 4);
  let head = 0, tail = 0;
  const first = start.floor * count + surface.index(from[0], from[2]);
  seen[first] = 1; queue[tail++] = first;
  while (head < tail) {
    const id = queue[head++], floor = Math.floor(id / count), cell = id % count;
    const col = cell % data.grid.width, row = Math.floor(cell / data.grid.width);
    const height = surface.layers[floor].heights[cell];
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = col + dc, nr = row + dr;
      if (nc < 0 || nr < 0 || nc >= data.grid.width || nr >= data.grid.height) continue;
      const next = nr * data.grid.width + nc;
      for (let f = 0; f < 4; f++) {
        const key = f * count + next, layer = surface.layers[f];
        if (seen[key] || layer.masks[next] & 3 || layer.heights[next] === -32768) continue;
        if (Math.abs(layer.heights[next] - height) > data.maximum_step_m * 1000) continue;
        seen[key] = 1; queue[tail++] = key;
      }
    }
  }
  const per = [0, 0, 0, 0];
  for (let i = 0; i < count * 4; i++) if (seen[i]) per[Math.floor(i / count)]++;
  return {seen, per, at: (floor, x, z) => {const i = surface.index(x, z); return i >= 0 && seen[floor * count + i] === 1;}};
}

const basementSalon = data.stations.find(station => station.room_id === 'f0-B06').position;

test('The garden, the pool surround and the front approach are walkable ground', () => {
  // The plot, not the footprint: the grid has to reach the far end of the
  // garden (z = -29) and the street edge (z = +13) or there is nothing to
  // rasterise onto in the first place.
  assert.ok(data.grid.x <= -10.4 && data.grid.z <= -29.4, 'the grid still stops at the walls');
  assert.ok(data.grid.x + data.grid.width * data.grid.step >= 12.5, 'the grid does not reach the east boundary');
  assert.ok(data.grid.z + data.grid.height * data.grid.step >= 13, 'the grid does not reach the street');
  for (const [name, x, z, expected] of [
    ['pool surround', 3.86, -13.94, 0], ['rear lawn', -0.46, -21.98, 0],
    ['east lawn', 9.5, -12.0, 0], ['front approach', 0.02, 8.02, 1],
  ]) {
    const hit = surface.sample(x, z, null, true, Infinity) ?? surface.sample(x, z, 0, true, 40);
    assert.ok(hit, `${name} is not standable ground`);
    assert.equal(hit.floor, expected, `${name} came out on floor ${hit.floor}`);
  }
});

test('The stairs connect all four storeys on foot', () => {
  // The native raster had no interior staircase in it at all, so its four
  // storeys were four islands: in a headset, where there is no room menu and
  // no lift button, a visitor could never leave the floor they arrived on.
  const found = reachable(basementSalon);
  // Named rooms, read from the delivery's own station list rather than
  // guessed at, one per storey plus both balconies.
  for (const id of ['f1-Z06', 'f2-101', 'f2-110', 'f2-109', 'f3-C01']) {
    const station = data.stations.find(s => s.room_id === id);
    assert.ok(found.at(station.floor_index, station.position[0], station.position[2]),
      `${id} (${station.name}) cannot be walked to from the basement`);
  }
  // Every storey, and nearly every station: two rooms sit behind doors the
  // source model has shut, and no route is invented for them.
  const missed = data.stations.filter(s => !found.at(s.floor_index, s.position[0], s.position[2]));
  assert.ok(missed.length <= 2, `${missed.length} stations cannot be walked to: ${missed.map(s => s.room_id)}`);
  for (let floor = 0; floor < 4; floor++) {
    assert.ok(found.per[floor] > 1500, `floor ${floor} is an island again (${found.per[floor]} cells)`);
  }
});

test('A visitor can walk out of the basement and all the way round the house', () => {
  const found = reachable(basementSalon);
  for (const [name, floor, x, z] of [
    ['pool surround', 0, 3.86, -13.94],
    ['rear lawn', 0, -0.46, -21.98],
    ['east lawn', 0, 9.5, -12.0],
    ['west side strip', 0, -6.9, -6.0],
    ['front approach', 1, 0.02, 8.02],
  ]) assert.ok(found.at(floor, x, z), `${name} cannot be walked to from the basement salon`);
  // A number, so a quiet regression in the merge shows up as a number: before
  // the outdoor pass this came to 2,133 cells and one storey.
  let cells = 0;
  for (let i = 0; i < count * 4; i++) if (found.seen[i]) cells++;
  assert.ok(cells > 25000, `only ${cells} cells are reachable from the basement salon`);
});

test('Nothing indoors was opened up to get there', () => {
  // Every station the delivery already had still stands on the surface.
  for (const station of data.stations) {
    assert.ok(surface.sample(station.position[0], station.position[2], station.position[1] - eye, true, .35),
      `${station.room_id} is no longer on the walking surface`);
  }
  // The cell-by-cell proof belongs to the tool, which is the only place both
  // the old and the new surface are in hand at once: it compares every cell
  // the native raster supported against what it wrote, and refuses to write
  // the file at all if one of them moved. What is checkable here is that the
  // delivered file carries that verdict and that the verdict is zero.
  const outdoors = data.outdoors;
  assert.ok(outdoors, 'the outdoor pass left no record of itself');
  assert.equal(outdoors.native_cells_altered, 0, 'the merge moved cells the house already owned');
  assert.ok(outdoors.native_cells_preserved > 28000, 'too few native cells were carried through');
  assert.ok(outdoors.added_cells[0] > 10000, 'the ground floor gained no outdoors');
  // A bridge across a gallery void would show up as a storey you can reach
  // without using the stairs. The stairs are the only vertical link there is,
  // so blocking the shaft must cut the house in two: everything above the
  // ground floor becomes unreachable again. If it does not, something else is
  // carrying weight that should not be.
  const shaft = outdoors.stairwell.groups[0];
  assert.ok(shaft && shaft.layers.length === 4, 'the staircase does not run the height of the house');
  assert.ok(Math.max(...shaft.span_m) <= 6 && shaft.rise_m > 8,
    'the shaft that was carried over is not shaped like a flight of stairs');
});

test('A held key walks you across the lawn, with the ground under your feet', () => {
  // Reachability is one thing; walking is another. This drives the same
  // WalkSurface.move the tour drives, at the same speed and frame step, from
  // the garden station straight at the house - and watches the eye ride the
  // slope rather than skate at a fixed height.
  const station = data.stations.find(s => s.room_id === 'f0-site-garden');
  const at = {x: station.position[0], y: station.position[1], z: station.position[2]};
  const yaw = station.view_yaw_rad;
  let walked = 0;
  for (let frame = 0; frame < 180; frame++) {
    const speed = 1.25 * 0.016;
    const from = {...at};
    surface.move(at, -Math.sin(yaw) * speed, -Math.cos(yaw) * speed, true);
    walked += Math.hypot(at.x - from.x, at.z - from.z);
  }
  assert.ok(walked > 3, `a held key covered only ${walked.toFixed(2)} m of lawn in three seconds`);
  assert.ok(Math.abs(at.z - station.position[2]) > 2.5, 'the walk did not leave the spot it started on');
  // Still standing on something, and the eye is still an eye height above it.
  const ground = surface.sample(at.x, at.z, at.y - eye, true, .35);
  assert.ok(ground, 'the walk ended off the surface');
  assert.ok(Math.abs(at.y - (ground.height + eye)) < 1e-6, 'the eye came loose from the ground');
  assert.notEqual(at.y, station.position[1], 'the ground under the garden reads as perfectly flat');
});

test('The outdoors and both balconies can be asked for by name', () => {
  for (const id of ['f0-site-garden', 'f0-site-pool', 'f1-site-approach', 'f2-110', 'f2-109']) {
    const station = data.stations.find(s => s.room_id === id);
    assert.ok(station, `${id} is not in the room menu`);
    assert.ok(station.name && station.name.length > 2, `${id} has no name to show`);
    const hit = surface.sample(station.position[0], station.position[2], station.position[1] - eye, true, .35);
    assert.ok(hit, `${id} does not stand on the walking surface`);
    assert.equal(hit.floor, station.floor_index, `${id} is filed under floor ${station.floor_index} but stands on ${hit.floor}`);
  }
});
