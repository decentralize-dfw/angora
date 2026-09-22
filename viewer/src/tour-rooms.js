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
// A box in world metres, as {min,max} triples. Rooms with no registered span
// still light: they fall back to a 2 m square about their anchor rather than
// collapsing to a point.
export function roomBox(room, dimensions, datums) {
  const span = roomSpan(room, dimensions);
  const x = span.x || 2, z = span.z || 2;
  const site = SITE.test(room.id);
  const base = site ? room.position[1] - SITE_BELOW : datums[room.floor_index];
  const next = datums[room.floor_index + 1];
  const top = site ? base + SITE_HEIGHT : base + (next ? next - base - SLAB : ROOM_HEIGHT);
  return {min: [room.position[0] - x / 2, base, room.position[2] - z / 2],
          max: [room.position[0] + x / 2, top, room.position[2] + z / 2]};
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
