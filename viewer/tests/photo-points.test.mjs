import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PHOTO_POINTS, photoCaption} from '../src/photo-points.js';

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
  const files = (await fs.readdir(gallery)).filter(name => /^angora_\d+\.(jpg|png)$/.test(name));
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
  // 20 and 24-27 carry no mark on the key drawing and are placed from the
  // photographs themselves; the rest are transcribed. If that ratio moves, the
  // comment at the head of photo-points.js is out of date.
  const approximate = PHOTO_POINTS.filter(point => [20, 24, 25, 26, 27].includes(point.id));
  assert.equal(approximate.length, 5);
  assert.ok(PHOTO_POINTS.length - approximate.length >= 45);
});
