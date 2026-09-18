import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fillSpaceSpans} from '../src/annotations.js';

const rooms = JSON.parse(fs.readFileSync(new URL('../../build/web/full/rooms.json', import.meta.url)));

const axesFromDelivery = () => {
  const chosen = new Map();
  for (const dim of rooms.dimensions) {
    if (!dim.dimension_label_allowed && dim.basis !== 'model_measured') continue;
    const axis = Math.abs(dim.b[0] - dim.a[0]) >= Math.abs(dim.b[2] - dim.a[2]) ? 'x' : 'z';
    chosen.set(`${dim.room_id}|${axis}`, {dim, measured: !dim.dimension_label_allowed});
  }
  return chosen;
};

test('Every enclosed room ends up with a breadth AND a depth', () => {
  const chosen = axesFromDelivery();
  const before = rooms.rooms.filter(room => !room.label_only &&
    (!chosen.has(`${room.id}|x`) || !chosen.has(`${room.id}|z`)));
  assert.ok(before.length > 0, 'the delivery is expected to be short of at least one span');

  fillSpaceSpans(rooms, chosen);

  const after = rooms.rooms.filter(room => !room.label_only &&
    (!chosen.has(`${room.id}|x`) || !chosen.has(`${room.id}|z`)));
  const solo = new Map((rooms.spaces ?? []).map(s => [s.space_id, s]))
  for (const room of after) {
    const space = solo.get(room.space_id);
    assert.ok(!space?.boundary_xz?.length || space.members?.length !== 1,
      `${room.id} has its own polygon and should have been completed`);
  }
  assert.ok(after.length < before.length, 'the polygon fallback must complete at least one room');
});

test('An open balcony stays name-only, and a shared space is never split', () => {
  const chosen = new Map();
  const added = fillSpaceSpans({
    rooms: [
      {id: 'b', name: 'Balkon', label_only: true, space_id: 's1', floor_index: 1, position: [0, 3, 0]},
      {id: 'shared', name: 'Salon', space_id: 's2', floor_index: 0, position: [0, 0, 0]},
      {id: 'solo', name: 'Garaj', space_id: 's1', floor_index: 1, position: [0, 3, 0]},
    ],
    spaces: [
      {space_id: 's1', members: ['solo'], boundary_xz: [[0, 0], [4.2, 0], [4.2, 5.9], [0, 5.9]]},
      {space_id: 's2', members: ['shared', 'other'], boundary_xz: [[0, 0], [9, 0], [9, 6], [0, 6]]},
    ],
  }, chosen);
  assert.equal(added, 2);
  assert.ok(chosen.has('solo|x') && chosen.has('solo|z'));
  assert.ok(!chosen.has('b|x') && !chosen.has('shared|x'));
  assert.ok(Math.abs(chosen.get('solo|x').dim.metres - 4.2) < 1e-9);
  assert.ok(Math.abs(chosen.get('solo|z').dim.metres - 5.9) < 1e-9);
  assert.equal(chosen.get('solo|x').measured, true);
});
