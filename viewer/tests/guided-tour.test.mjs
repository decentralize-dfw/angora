import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TOUR_CUES, TOUR_DURATION, TOUR_TRIM_S, TOUR_AUDIO, resolveCues, cueKey} from '../src/tour-script.js';
import {cueAt} from '../src/guided-tour.js';
import {roomBox, roomSpan, unionBox, clampToFloor} from '../src/tour-rooms.js';
import {projectBox} from '../src/tour-spotlight.js';
import * as THREE from 'three';

// The narrated tour is a promise made twice over: the subtitle on screen is
// the sentence being spoken, and every room a sentence names is a room the
// register actually holds. Both are checkable without a browser, so they are
// checked here rather than trusted.
const rooms = JSON.parse(fs.readFileSync(new URL('../../build/web/native-current/native-rooms.json', import.meta.url)));
const audio = new URL('../../audio/' + TOUR_AUDIO, import.meta.url);
const steps = resolveCues();

test('the cues run forward and end inside the recording', () => {
  let previous = -1;
  for (const cue of TOUR_CUES) {
    assert.ok(cue.at > previous, `cue at ${cue.at} does not follow ${previous}`);
    previous = cue.at;
  }
  assert.ok(previous < TOUR_DURATION, 'the last cue starts after the recording ends');
  // The closing sentence is about eight seconds long; a tour whose last cue
  // lands in the final moments would show the price over a black screen.
  assert.ok(TOUR_DURATION - previous > 5, 'the closing cue has no time to be heard');
});

test('every cue carries both subtitles', () => {
  for (const cue of TOUR_CUES) {
    for (const lang of ['tr', 'en']) {
      assert.equal(typeof cue[lang], 'string', `cue at ${cue.at} has no ${lang} subtitle`);
      assert.ok(cue[lang].trim().length > 2, `cue at ${cue.at} has an empty ${lang} subtitle`);
    }
  }
});

test('every room a sentence names is one the register holds', () => {
  const known = new Set(rooms.rooms.map(room => room.id));
  for (const step of steps) for (const id of step.rooms)
    assert.ok(known.has(id), `${id} is lit at ${step.at} s but is not in native-rooms.json`);
});

test('a lit room is always on the storey the cue is showing', () => {
  for (const step of steps) {
    if (!/^f[0-3]$/.test(step.view)) continue;
    for (const id of step.rooms) {
      const room = rooms.rooms.find(entry => entry.id === id);
      assert.equal('f' + room.floor_index, step.view,
        `${id} is lit while ${step.view} is on screen, but it stands on f${room.floor_index}`);
    }
  }
});

test('the storey changes are announced before the rooms on them are lit', () => {
  let view = null;
  for (const step of steps) {
    if (step.view !== view) {
      view = step.view;
      assert.equal(step.rooms.length, 0,
        `the cue at ${step.at} s changes to ${view} and lights a room in the same breath`);
    }
  }
});

test('inherited state only reframes where a cue asks it to', () => {
  // Two consecutive sentences about the same thing must not restart a flight;
  // that is what makes a run of three sentences about one room hold still.
  const keys = steps.map(cueKey);
  const changes = keys.filter((key, i) => key !== keys[i - 1]).length;
  assert.ok(changes < steps.length, 'every cue reframes; nothing is being carried forward');
  assert.ok(changes > 20, 'the tour barely moves');
  // Carried forward, not cleared: a subtitle-only cue keeps the last bearing.
  const after = steps[steps.findIndex(s => s.at === 25.03)];
  assert.equal(after.radius, 1000, 'the 1 km radius did not survive into the next sentence');
});

test('cueAt finds the sentence being spoken', () => {
  assert.equal(cueAt(steps, 0), -1, 'the lead-in silence has no subtitle');
  assert.equal(steps[cueAt(steps, 0.8)].at, 0.71);
  assert.equal(steps[cueAt(steps, 24.9)].at, 24.03);
  assert.equal(steps[cueAt(steps, 25.03)].at, 25.03, 'a cue must own its own instant');
  assert.equal(cueAt(steps, TOUR_DURATION), steps.length - 1, 'the last sentence holds to the end');
});

test('the voiceover is the delivered recording with its slate trimmed', () => {
  assert.ok(fs.existsSync(audio), 'audio/' + TOUR_AUDIO + ' is missing');
  const bytes = fs.readFileSync(audio);
  // Constant 128 kbps, 44,1 kHz mono: every frame is 1152 samples, so the
  // duration the cues are written against is a byte count, not a guess.
  assert.deepEqual([...bytes.subarray(0, 2)], [0xff, 0xfb], 'the file does not start on an MPEG frame');
  const frames = bytes.length / 418;
  assert.ok(Math.abs(frames - Math.round(frames)) < 0.02, 'the file is not a whole number of frames');
  const seconds = Math.round(frames) * 1152 / 44100;
  assert.ok(Math.abs(seconds - TOUR_DURATION) < 0.05,
    `the recording is ${seconds.toFixed(2)} s but the cues are written for ${TOUR_DURATION} s`);
  assert.ok(TOUR_TRIM_S > 6.9 && TOUR_TRIM_S < 7.1, 'the recorded trim no longer matches the slate');
});

test('a room box is the register\'s own span, stood on the register\'s own datum', () => {
  const salon = rooms.rooms.find(room => room.id === 'f1-Z06');
  const span = roomSpan(salon, rooms.dimensions);
  const box = roomBox(salon, rooms.dimensions, rooms.floor_datums_m);
  assert.ok(Math.abs((box.max[0] - box.min[0]) - span.x) < 1e-6, 'the box is not the measured x span');
  assert.ok(Math.abs((box.max[2] - box.min[2]) - span.z) < 1e-6, 'the box is not the measured z span');
  assert.equal(box.min[1], rooms.floor_datums_m[1], 'the box does not stand on its storey');
  assert.ok(box.max[1] < rooms.floor_datums_m[2], 'the box reaches through the floor above');
  // The pool is water, not a room: a storey-high box over it would light sky.
  const pool = roomBox(rooms.rooms.find(room => room.id === 'f0-site-pool'), rooms.dimensions, rooms.floor_datums_m);
  assert.ok(pool.max[1] - pool.min[1] < 2, 'the pool is being lit as though it were a storey');
});

test('a shared open-plan span is held inside the storey that carries it', () => {
  // f3-C05 and f3-C01 share one space, so the register gives both the SPACE's
  // 10 m span - which, about C05's own anchor, runs out past the west wall.
  const c05 = roomBox(rooms.rooms.find(room => room.id === 'f3-C05'), rooms.dimensions, rooms.floor_datums_m);
  assert.ok(c05.min[0] < -8, 'the unclamped box no longer overruns; this test is watching the wrong thing');
  const storey = {min: [-7.15, 0, -10.4], max: [8.84, 0, 8.6]};
  const held = clampToFloor(c05, storey);
  assert.ok(held.min[0] >= storey.min[0] - .4, 'the clamped box still runs past the wall');
  assert.ok(held.max[0] <= storey.max[0] + .4, 'the clamped box still runs past the wall');
  assert.ok(held.max[0] > held.min[0], 'clamping collapsed the box');
});

test('a union covers every room the sentence names', () => {
  const ids = ['f2-102', 'f2-103', 'f2-104'];
  const boxes = ids.map(id => roomBox(rooms.rooms.find(room => room.id === id), rooms.dimensions, rooms.floor_datums_m));
  const union = unionBox(boxes);
  for (const box of boxes) for (const axis of [0, 1, 2]) {
    assert.ok(union.min[axis] <= box.min[axis] && union.max[axis] >= box.max[axis], 'the suite is not fully covered');
  }
  assert.equal(unionBox([]), null);
});

test('no cue asks for the villa scale, which is really the top-floor cut', () => {
  // selectView aliases 'building' to 'f3', so a cue written for it would open
  // the roof storey sawn off at 1,30 m while the words describe tiled roofs.
  // An uncut house is the neighbourhood's section height, framed close.
  for (const step of steps) assert.notEqual(step.view, 'building', `the cue at ${step.at} s opens a cut house`);
  const villa = steps.filter(step => step.frame === 'villa');
  assert.ok(villa.length >= 4, 'the villa is never framed whole');
  for (const step of villa) assert.equal(step.view, 'neighborhood', 'a villa frame over a cut storey');
});

test('the tour visits every storey, the garden and the pool', () => {
  const views = new Set(steps.map(step => step.view));
  for (const view of ['region', 'neighborhood', 'f0', 'f1', 'f2', 'f3'])
    assert.ok(views.has(view), `the tour never shows ${view}`);
  const lit = new Set(steps.flatMap(step => step.rooms));
  for (const id of ['f0-site-garden', 'f0-site-pool'])
    assert.ok(lit.has(id), `${id} is never lit`);
});

test('the hole is cut where the room actually lands on screen', () => {
  const camera = new THREE.PerspectiveCamera(16, 1.6, .1, 500);
  camera.position.set(0, 12, 24); camera.lookAt(0, 2, 0);
  camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  const box = new THREE.Box3(new THREE.Vector3(-4, 0, -4), new THREE.Vector3(4, 3, 4));
  const rect = projectBox(box, camera, 1440, 900);
  assert.ok(rect, 'a box in front of the camera did not project');
  assert.ok(rect.w > 0 && rect.h > 0, 'the projected rectangle is degenerate');
  // Centred on the target, so the hole is centred on screen.
  assert.ok(Math.abs(rect.x + rect.w / 2 - 720) < 40, 'the hole is not over the room');
  // A box behind the camera is dropped rather than folded to the far side of
  // the screen, which would blow the hole out to the whole viewport.
  const behind = new THREE.Box3(new THREE.Vector3(-4, 0, 60), new THREE.Vector3(4, 3, 68));
  assert.equal(projectBox(behind, camera, 1440, 900), null);
});
