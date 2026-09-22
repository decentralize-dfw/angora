// The volume the narrated tour lights when a sentence names a room.
//
// There is no room solid in the delivery to take a box from - rooms.json says
// outright that its partitions are unverified - so the box is built from what
// IS registered: the room's label anchor and its two measured spans, the same
// pair annotations.js already draws. Where several labels share one open
// space the register gives them the SPACE's span, so lighting the salon also
// lights the hall it opens into. That is the source being honest about an
// open plan, not a fault in the box.
const SITE = /-site-/;
// A storey's clear height, less the slab, where the register has the datum
// above; the roof storey has none and takes the house's own room height.
const ROOM_HEIGHT = 2.75, SLAB = 0.3;
// The pool and the garden are ground, not rooms: their anchors sit at the
// water and the lawn, and a storey-high box over them would light the sky.
const SITE_BELOW = 0.35, SITE_HEIGHT = 1.6;

export function roomSpan(room, dimensions) {
  const span = {x: 0, z: 0};
  for (const id of room.dimensions ?? []) {
    const dim = dimensions.find(entry => entry.id === id);
    if (!dim) continue;
    const axis = Math.abs(dim.b[0] - dim.a[0]) >= Math.abs(dim.b[2] - dim.a[2]) ? 'x' : 'z';
    span[axis] = Math.max(span[axis], dim.metres);
  }
  return span;
}
// The rectangle the register MEASURED, rather than one built around a label.
// Each room carries an x and a z dimension whose endpoints are the wall faces
// the span was taken between, so the two together are a rectangle standing on
// real faces - which a label anchor plus two lengths is not. In an open plan
// the label's length belongs to the whole space, so about its own anchor it
// overran the wall on one side; these endpoints do not move.
export function dimensionRect(room, dimensions) {
  const rect = {};
  for (const id of room.dimensions ?? []) {
    const dim = dimensions.find(entry => entry.id === id);
    if (!dim) continue;
    if (Math.abs(dim.b[0] - dim.a[0]) >= Math.abs(dim.b[2] - dim.a[2])) {
      rect.minX = Math.min(dim.a[0], dim.b[0]); rect.maxX = Math.max(dim.a[0], dim.b[0]);
    } else {
      rect.minZ = Math.min(dim.a[2], dim.b[2]); rect.maxZ = Math.max(dim.a[2], dim.b[2]);
    }
  }
  return rect.minX !== undefined && rect.minZ !== undefined ? rect : null;
}
// The enclosure a room stands in, as the register draws it: rooms.json carries
// a boundary polygon per SPACE - the walls, with the openings in them - and
// names which rooms share it. It is the fallback for a room the dimension
// register does not cover, and the bound a measured rectangle is held inside.
export function spaceOf(room, spaces) {
  return spaces?.find(space => space.members?.includes(room.id) && space.boundary_xz?.length) ?? null;
}
export function spaceRect(space) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of space.boundary_xz) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  }
  return {minX, maxX, minZ, maxZ};
}
const clip = (rect, bound) => !bound ? rect : {
  minX: Math.max(rect.minX, bound.minX), maxX: Math.min(rect.maxX, bound.maxX),
  minZ: Math.max(rect.minZ, bound.minZ), maxZ: Math.min(rect.maxZ, bound.maxZ)};

// A box in world metres, as {min,max} triples, plus how it was arrived at.
// Rooms the register draws no boundary and takes no dimension for - the
// balconies aside, which it dimensions - fall back to the anchor and its two
// measured spans.
export function roomBox(room, dimensions, datums, spaces) {
  const site = SITE.test(room.id);
  const base = site ? room.position[1] - SITE_BELOW : datums[room.floor_index];
  const next = datums[room.floor_index + 1];
  const top = site ? base + SITE_HEIGHT : base + (next ? next - base - SLAB : ROOM_HEIGHT);
  const space = site ? null : spaceOf(room, spaces);
  const bound = space ? spaceRect(space) : null;
  const measured = site ? null : dimensionRect(room, dimensions);
  const rect = measured ? clip(measured, bound) : bound;
  if (rect && rect.maxX > rect.minX && rect.maxZ > rect.minZ)
    return {min: [rect.minX, base, rect.minZ], max: [rect.maxX, top, rect.maxZ],
            space: space?.space_id ?? null, from: measured ? 'dimensions' : 'space'};
  const span = roomSpan(room, dimensions);
  const x = span.x || 2, z = span.z || 2;
  return {min: [room.position[0] - x / 2, base, room.position[2] - z / 2],
          max: [room.position[0] + x / 2, top, room.position[2] + z / 2], space: null, from: 'anchor'};
}
export function unionBox(boxes) {
  if (!boxes.length) return null;
  const min = [...boxes[0].min], max = [...boxes[0].max];
  for (const box of boxes) for (let i = 0; i < 3; i++) {
    min[i] = Math.min(min[i], box.min[i]); max[i] = Math.max(max[i], box.max[i]);
  }
  return {min, max};
}
// Clamped to the storey it stands on, so a shared open-plan span cannot run
// out past the walls that hold it. Ground-level site boxes keep their own
// extent - the garden is meant to reach beyond the house.
export function clampToFloor(box, floorBox, margin = 0.35) {
  if (!floorBox) return box;
  const min = [...box.min], max = [...box.max];
  for (const i of [0, 2]) {
    min[i] = Math.min(Math.max(min[i], floorBox.min[i] - margin), floorBox.max[i] + margin);
    max[i] = Math.max(Math.min(max[i], floorBox.max[i] + margin), floorBox.min[i] - margin);
  }
  return {min, max};
}
