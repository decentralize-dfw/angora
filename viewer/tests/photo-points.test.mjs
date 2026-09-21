import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PHOTO_POINTS, FLOOR_DATUMS, photoCaption} from '../src/photo-points.js';

// The pins are read off the owner's key drawing (photogallery/FOTOLAR-KONUM.jpg)
// and registered onto the model through each storey plan's room labels. What
// can go wrong silently is a transcription slip: a point on the wrong floor, a
// file that is not in the folder, or a direction that is not a direction. All
// three are checked here against the delivery's own data.
const gallery = new URL('../../photogallery/', import.meta.url);
const navigation = JSON.parse(await fs.readFile(new URL('../../build/web/native-current/native-navigation.json', import.meta.url)));
const rooms = JSON.parse(await fs.readFile(new URL('../../build/web/native-current/native-rooms.json', import.meta.url)));

const walkable = new Map(navigation.layers.map(layer => {
  const cells = new Set();
  layer.rows.forEach((row, r) => {for (const [start, run] of row.map(s => [s[0], s[1]])) for (let c = start; c < start + run; c++) cells.add(`${c},${r}`);});
  return [layer.floor_index, cells];
}));
const cellOf = (x, z) => `${Math.round((x - navigation.grid.x) / navigation.grid.step)},${Math.round((z - navigation.grid.z) / navigation.grid.step)}`;

test('Every pinned photograph is a file in the gallery, and every file is pinned', async () => {
  const files = (await fs.readdir(gallery)).filter(name => /^angora_\d+\.(jpe?g|png)$/.test(name));
  const pinned = PHOTO_POINTS.map(point => point.file);
  assert.equal(new Set(pinned).size, pinned.length, 'A photograph may carry only one pin');
  for (const file of pinned) assert.ok(files.includes(file), `Missing photograph ${file}`);
  for (const file of files) assert.ok(pinned.includes(file), `Unpinned photograph ${file}`);
});

test('Ids are unique, floors are real and every look direction is a unit vector', () => {
  const ids = PHOTO_POINTS.map(point => point.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const point of PHOTO_POINTS) {
    assert.ok(point.floor >= 0 && point.floor <= 3, `${point.id} is not on a storey`);
    assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
    assert.ok(Math.abs(Math.hypot(point.dx, point.dz) - 1) < 0.02, `${point.id} has no look direction`);
    // The frame is named in both languages; a pin with no caption is a pin
    // whose room was never decided.
    for (const lang of ['tr', 'en']) assert.ok(photoCaption(point, lang).length > 2, `${point.id} has no ${lang} caption`);
    assert.ok(point.y > 0.5, `${point.id} sits at or below its floor`);
  }
});

test('Interior pins stand on the walkable surface of the storey they are filed under', () => {
  const indoors = PHOTO_POINTS.filter(point => !point.outdoor);
  assert.ok(indoors.length >= 40, 'Most of the set is interior');
  for (const point of indoors) {
    assert.ok(walkable.get(point.floor).has(cellOf(point.x, point.z)),
      `Photograph ${point.id} is not inside floor ${point.floor}`);
    // Eye height above that storey's datum, not a metre adrift of it.
    const datum = rooms.floor_datums_m[point.floor];
    assert.ok(point.y - datum > 1 && point.y - datum < 2, `Photograph ${point.id} is not at eye height on its floor`);
  }
});

test('Every storey carries pins, and the drawing-marked ones outnumber the placed ones', () => {
  for (let floor = 0; floor < 4; floor++) {
    assert.ok(PHOTO_POINTS.some(point => point.floor === floor), `Floor ${floor} has no photographs`);
  }
  // 20 and 24-28 carry no mark on the key drawing and are placed from the
  // photographs themselves; the rest are transcribed. If that ratio moves, the
  // comment at the head of photo-points.js is out of date.
  const approximate = PHOTO_POINTS.filter(point => [20, 24, 25, 26, 27, 28].includes(point.id));
  assert.equal(approximate.length, 6);
  assert.ok(PHOTO_POINTS.length - approximate.length >= 45);
});

// A frame taken from outside is drawn on several storeys and redrawn at each
// one's level, so what it stores is not one height but a height over ground.
// If the datums here drift from the delivery's, every following mark floats.
test('The storey datums match the delivery, and every mark stands on one', () => {
  assert.deepEqual(FLOOR_DATUMS, rooms.floor_datums_m);
  for (const point of PHOTO_POINTS) {
    assert.equal(point.floorY, FLOOR_DATUMS[point.floor], `${point.id} is filed under a datum that is not its floor's`);
    const height = point.y - point.floorY;
    assert.ok(height > 1 && height < 2, `${point.id} is not at eye height over the ground it was taken from`);
  }
});

test('A frame marked on several storeys follows them, and only an outdoor one is', () => {
  const following = PHOTO_POINTS.filter(point => point.follow);
  assert.ok(following.length >= 3, 'The garden and facade frames follow the open floor');
  for (const point of PHOTO_POINTS) {
    const floors = point.floors ?? [point.floor];
    assert.ok(floors.includes(point.floor), `${point.id} is not drawn on its own storey`);
    assert.ok(floors.every(floor => floor >= 0 && floor <= 3), `${point.id} is drawn on a storey that is not there`);
    assert.equal(new Set(floors).size, floors.length, `${point.id} is drawn twice on one storey`);
    // Following means being redrawn at another storey's level, which is only
    // honest for a viewpoint outside the house; an interior frame belongs to
    // the room it was taken in and to no other.
    if (floors.length > 1 || point.follow) assert.ok(point.outdoor && point.follow,
      `${point.id} is marked off its own storey without standing outside it`);
  }
  // 25 and 27 are at ground level looking across the pool: they belong to the
  // basement's own garden and are not repeated up the building.
  for (const id of [25, 27]) assert.deepEqual(PHOTO_POINTS.find(p => p.id === id).floors ?? [0], [0]);
});

// A garden viewpoint is twenty metres outside the storey the drawing frames,
// so the mark has to be brought back to the edge rather than dropped. What
// must survive that is the bearing: the held mark still says which way the
// photograph was taken from.
test('A mark the frame cannot contain holds the edge on its own bearing', async () => {
  const {holdToFrame, HOLD} = await import('../src/photo-gallery.js');
  const w = 1440, h = 900, inside = holdToFrame(700, 400, w, h);
  assert.deepEqual([inside.x, inside.y, inside.held], [700, 400, false]);
  // The safe frame is the interface's own room, read from the module rather
  // than restated here, so moving an inset moves the test with it.
  const left = HOLD.side, right = w - HOLD.side, top = HOLD.top, bottom = h - HOLD.bottom;
  const cx = (left + right) / 2, cy = (top + bottom) / 2;
  for (const [x, y] of [[3200, -400], [-900, 500], [720, 2400], [1600, 880]]) {
    const held = holdToFrame(x, y, w, h);
    assert.equal(held.held, true);
    assert.ok(held.x >= left - 1e-6 && held.x <= right + 1e-6 && held.y >= top - 1e-6 && held.y <= bottom + 1e-6,
      `held mark left the safe frame at ${held.x},${held.y}`);
    assert.ok(Math.abs(Math.atan2(held.y - cy, held.x - cx) - Math.atan2(y - cy, x - cx)) < 1e-9,
      'a held mark changed the direction it went out on');
  }
  // A frame with no inside cannot hold anything, and must not invent a place.
  assert.deepEqual(holdToFrame(10, 10, 50, 50), {x: 10, y: 10, held: false});
});
