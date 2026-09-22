import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PHOTO_POINTS, FLOOR_DATUMS, photoCaption} from '../src/photo-points.js';
import {roomBox} from '../src/tour-rooms.js';

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

// "oda 1 oda 2 gibi yapabilirsin. karışmasın!" - two cards side by side both
// reading "1. kat · Yatak odası" tell a buyer nothing about which bedroom is
// which. The register does have twins - 106 and 107 on the first floor, C02
// and C04 in the attic - and the room menu already tells them apart by code,
// so the captions carry the same code.
//
// Which twin a frame belongs to is not guessed and not read off the caption:
// a camera photographs what it points at, so the point's own look direction
// is cast into the twins' measured boxes and the first one the ray enters is
// the room. Standing in a doorway is why point-in-room is not enough - 13 is
// taken from the landing side of 107's door.
test('a photograph of a twin room says which twin, and says the register\'s own code', () => {
  const datums = rooms.floor_datums_m;
  const box = room => roomBox(room, rooms.dimensions, datums, rooms.spaces);
  // Slab intersection on the ground plane: the distance at which the ray
  // (x,z) + t·(dx,dz) enters the box, or null if it never does.
  const entry = (point, b) => {
    let near = -Infinity, far = Infinity;
    for (const [origin, d, lo, hi] of [[point.x, point.dx, b.min[0], b.max[0]],
                                       [point.z, point.dz, b.min[2], b.max[2]]]) {
      if (Math.abs(d) < 1e-9) {if (origin < lo || origin > hi) return null; continue;}
      let a = (lo - origin) / d, c = (hi - origin) / d;
      if (a > c) [a, c] = [c, a];
      near = Math.max(near, a); far = Math.min(far, c);
    }
    return far < Math.max(near, 0) ? null : Math.max(near, 0);
  };
  // A name borne by two rooms of one storey is a name that needs a code.
  const twins = new Map();
  for (const room of rooms.rooms) {
    const key = `${room.floor_index}|${room.name}`;
    twins.set(key, (twins.get(key) ?? []).concat(room));
  }
  let checked = 0;
  for (const point of PHOTO_POINTS) {
    const leaf = point.tr.split(' · ').pop().replace(/ \([^)]*\)$/, '');
    const family = twins.get(`${point.floor}|${leaf}`);
    if (!family || family.length < 2) {
      assert.ok(!/ \([0-9A-Z]+\)$/.test(point.tr),
        `photograph ${point.id} carries a room code for ${leaf}, which is not a twin on floor ${point.floor}`);
      continue;
    }
    const aimed = family.map(room => ({room, t: entry(point, box(room))}))
      .filter(hit => hit.t !== null).sort((a, b) => a.t - b.t)[0];
    assert.ok(aimed, `photograph ${point.id} is captioned ${leaf} but points at neither ${family.map(r => r.code).join(' nor ')}`);
    assert.match(point.tr, new RegExp(`\\(${aimed.room.code}\\)$`),
      `photograph ${point.id} looks into ${aimed.room.id} but its caption does not say so`);
    assert.match(point.en, new RegExp(`\\(${aimed.room.code}\\)$`),
      `photograph ${point.id}'s English caption does not carry ${aimed.room.code}`);
    checked++;
  }
  assert.ok(checked >= 6, `only ${checked} twin-room photographs were checked`);
});
