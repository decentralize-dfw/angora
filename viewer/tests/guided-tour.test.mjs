import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TOUR_CUES, TOUR_DURATION, TOUR_AUDIO, resolveCues, cueKey} from '../src/tour-script.js';
import {PHOTO_POINTS} from '../src/photo-points.js';
import {cueAt} from '../src/guided-tour.js';
import {roomBox, roomSpan, spaceOf, spaceRect, dimensionRect, unionBox, clampToFloor} from '../src/tour-rooms.js';
import {projectBox, mergeEntries, advanceEntries, boxKey} from '../src/tour-spotlight.js';
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
  // The last sentence still has to be heard where it is shown.
  assert.ok(TOUR_DURATION - previous > 2, 'the closing cue has no time to be heard');
  // Every step knows how long it holds, which is what spreads a sentence's
  // rooms across it.
  for (const step of steps) assert.ok(step.span > 0, `the step at ${step.at} s holds for no time`);
});

test('every cue carries both subtitles', () => {
  // A cue may have no words of its own - the lift rides down three storeys
  // inside one sentence - but every resolved step must still show what is
  // being spoken, so the subtitle is carried rather than blanked.
  for (const cue of TOUR_CUES) for (const lang of ['tr', 'en']) {
    if (cue[lang] === undefined) continue;
    assert.equal(typeof cue[lang], 'string', `cue at ${cue.at} has a ${lang} subtitle that is not text`);
    assert.ok(cue[lang].trim().length > 2, `cue at ${cue.at} has an empty ${lang} subtitle`);
  }
  for (const step of steps) for (const lang of ['tr', 'en'])
    assert.ok(step[lang]?.trim().length > 2, `the step at ${step.at} s shows no ${lang} subtitle`);
});

const MARKS = new Set(['mark:plot-ring', 'mark:lift-0', 'mark:lift-1', 'mark:lift-2']);
test('every room a sentence names is one the register holds', () => {
  const known = new Set(rooms.rooms.map(room => room.id));
  for (const step of steps) for (const id of step.rooms) {
    if (id.startsWith('mark:')) {
      // The tour's own marks - the plot minus the house, the lift shaft - are
      // built in main.js from the plot rectangle, the building box and the
      // delivered cabin. They are named apart so neither set can be mistaken
      // for the other, and an unknown one must not fail silently.
      assert.ok(MARKS.has(id), `${id} is lit at ${step.at} s and is not a mark the viewer can build`);
      continue;
    }
    assert.ok(known.has(id), `${id} is lit at ${step.at} s but is not in native-rooms.json`);
  }
});

test('a lit room is always on the storey the cue is showing', () => {
  for (const step of steps) {
    if (!/^f[0-3]$/.test(step.view)) continue;
    for (const id of step.rooms) {
      if (id.startsWith('mark:')) continue;
      const room = rooms.rooms.find(entry => entry.id === id);
      assert.equal('f' + room.floor_index, step.view,
        `${id} is lit while ${step.view} is on screen, but it stands on f${room.floor_index}`);
    }
  }
});

test('the lift is marked as the tour climbs past it, and nowhere it has no landing', () => {
  const lit = steps.filter(step => step.rooms.some(id => id.startsWith('mark:lift-')));
  assert.ok(lit.length >= 2, 'the lift is never marked');
  for (const step of lit) {
    const floor = step.rooms.find(id => id.startsWith('mark:lift-')).slice(-1);
    assert.equal('f' + floor, step.view, `the lift mark at ${step.at} s is on the wrong storey`);
    assert.notEqual(step.view, 'f3', 'the roof storey has no landing and must not be marked');
  }
  // It is shown inside the sentence that names it, not in a silence of its
  // own: the whole run is over in a few seconds.
  const run = lit[lit.length - 1].at - lit[0].at;
  assert.ok(run > 0 && run < 6, `the lift takes ${run.toFixed(1)} s to ride down; it should be quick`);
  assert.ok(steps.every(step => !step.hold), 'the tour still stops the recording somewhere');
});

test('the plot is shown in plan, with everything that is not the house lit', () => {
  const plan = steps.filter(step => step.rooms.includes('mark:plot-ring'));
  assert.ok(plan.length >= 1, 'the plot is never shown as a whole');
  for (const step of plan) {
    assert.ok(step.polar !== null && step.polar < 0.35, 'the plot is not looked at from above');
    assert.equal(step.frame, 'plot', 'the plan does not frame the plot');
  }
});

test('the opening moves: the map turns, and each sentence brings its own set', () => {
  const region = steps.filter(step => step.view === 'region');
  assert.ok(region.every(step => step.spin || step.spot === 'centre'), 'the map stands still somewhere in the opening');
  const shown = region.map(step => step.group);
  for (const g of shown) assert.ok(g === null || (Number.isInteger(g) && g >= 0 && g < 6), `${g} is not an amenity family`);
  assert.ok(new Set(shown.filter(g => g !== null)).size >= 4, 'the opening leans on one family');
});

// A cue turns either by orbiting freely or by sweeping a bounded arc; the
// rule is about the turn, not about which mechanism makes it.
const turns = step => Boolean(step.rotate || step.sweep);
test('the turn follows one rule, and it is not a habit', () => {
  // "dönüyor, duruyor, sonra dönmeye devam ediyor. bunlar olmasın." The camera
  // orbits only where there is nothing to point at and a long time to fill,
  // and never while something is lit or the tour is inside the house.
  for (const step of steps) {
    if (!turns(step)) continue;
    assert.ok(!/^f[0-3]$/.test(step.view), `the camera turns inside the house, at ${step.at} s`);
    assert.equal(step.rooms.length, 0, `the camera turns while something is lit, at ${step.at} s`);
  }
  // Two turns, each a long one - not a dozen short ones.
  const blocks = [];
  for (const step of steps) {
    if (!turns(step)) {blocks.push(null); continue;}
    const open = blocks[blocks.length - 1];
    if (open) open.push(step.at); else blocks.push([step.at]);
  }
  const runs = blocks.filter(Boolean);
  assert.equal(runs.length, 2, `${runs.length} separate turns; the rule says two`);
  for (const run of runs) assert.ok(run[run.length - 1] - run[0] > 30, 'a turn too short to read as one move');
});

test('a cue that only changes the pictures does not restart the camera', () => {
  // The side gallery and the listing link are applied before the camera is
  // touched, so they must not be in the key a reframe is decided by; when they
  // were, each one rewound the orbit and read as a glitch.
  const a = steps.find(step => step.at === 343.7), b = steps.find(step => step.at === 359.8);
  assert.notDeepEqual(a.photos, b.photos, 'these two cues no longer differ in their pictures');
  assert.equal(cueKey(a), cueKey(b), 'a change of pictures still reframes');
  const price = steps.find(step => step.at === 364.8);
  assert.ok(price.link && !a.link, 'the listing test is watching the wrong cue');
  assert.equal(cueKey(a), cueKey(price), 'raising the listing link still reframes');
});

test('the closing turns, and offers the listing', () => {
  const last = steps[steps.length - 1];
  assert.ok(turns(last), 'the closing shot stands still');
  assert.ok(last.link, 'the closing never offers the listing');
  // One cue raises it, and it stays up to the end rather than blinking off.
  const first = steps.findIndex(step => step.link);
  assert.ok(first > 0, 'the listing is offered before the price is named');
  assert.ok(steps.slice(first).every(step => step.link), 'the listing link comes and goes');
});

test('inherited state only reframes where a cue asks it to', () => {
  // Two consecutive sentences about the same thing must not restart a flight;
  // that is what makes a run of three sentences about one room hold still.
  const keys = steps.map(cueKey);
  const changes = keys.filter((key, i) => key !== keys[i - 1]).length;
  assert.ok(changes < steps.length, 'every cue reframes; nothing is being carried forward');
  assert.ok(changes > 20, 'the tour barely moves');
  // Carried forward, not cleared: a cue with no words of its own keeps the
  // sentence being spoken, and a subtitle-only cue keeps the last framing.
  const wordless = steps[steps.findIndex(step => step.at === 14.4)];
  assert.equal(wordless.radius, 1000, 'the radius cue did not take');
  assert.ok(wordless.tr.startsWith('Başkentin kalbi'), 'a wordless cue blanked the subtitle');
});

test('cueAt finds the sentence being spoken', () => {
  // This recording opens on its first word, so there is no lead-in to sit in.
  assert.equal(steps[cueAt(steps, 0)].at, 0);
  assert.equal(steps[cueAt(steps, 0.8)].at, 0);
  assert.equal(steps[cueAt(steps, 19.5)].at, 14.4);
  assert.equal(steps[cueAt(steps, 19.6)].at, 19.6, 'a cue must own its own instant');
  assert.equal(cueAt(steps, TOUR_DURATION), steps.length - 1, 'the last sentence holds to the end');
});

test('the voiceover on disk is the recording the cues are written for', () => {
  assert.ok(fs.existsSync(audio), 'audio/' + TOUR_AUDIO + ' is missing');
  const bytes = fs.readFileSync(audio);
  // Constant 192 kbps, 48 kHz, joint stereo: every frame is 576 bytes and
  // 1152 samples, so the duration the cues are written against is a byte
  // count rather than a guess. The tags are stripped, so the file opens on a
  // frame header.
  assert.deepEqual([...bytes.subarray(0, 2)], [0xff, 0xfb], 'the file does not start on an MPEG frame');
  assert.equal(bytes.length % 576, 0, 'the file is not a whole number of 576-byte frames');
  const seconds = (bytes.length / 576) * 1152 / 48000;
  assert.ok(Math.abs(seconds - TOUR_DURATION) < 0.05,
    `the recording is ${seconds.toFixed(2)} s but the cues are written for ${TOUR_DURATION} s`);
});

test('a room box is the rectangle the register measured', () => {
  const all = rooms.rooms;
  // The salon: its two dimensions stand on wall faces, and the box is those
  // faces. The label anchor plus the two lengths is NOT this rectangle - in an
  // open plan the length belongs to the whole space.
  const salon = all.find(room => room.id === 'f1-Z06');
  const measured = dimensionRect(salon, rooms.dimensions);
  const box = roomBox(salon, rooms.dimensions, rooms.floor_datums_m, rooms.spaces);
  assert.equal(box.from, 'dimensions');
  // Held inside its enclosure, which trims it by a millimetre where the
  // boundary polygon rounds the same wall face differently.
  for (const [got, want] of [[box.min[0], measured.minX], [box.max[0], measured.maxX],
                             [box.min[2], measured.minZ], [box.max[2], measured.maxZ]])
    assert.ok(Math.abs(got - want) < 0.01, `${got} is not the measured ${want}`);
  assert.equal(box.min[1], rooms.floor_datums_m[1], 'the box does not stand on its storey');
  assert.ok(box.max[1] < rooms.floor_datums_m[2], 'the box reaches through the floor above');

  // Every measured room sits inside the enclosure the register draws for it,
  // and inside the storey. Nothing may cross a wall.
  const storey = {minX: -7.15, maxX: 8.84, minZ: -10.4, maxZ: 8.6};
  for (const room of all) {
    const own = roomBox(room, rooms.dimensions, rooms.floor_datums_m, rooms.spaces);
    if (own.from === 'anchor' || room.id.includes('-site-')) continue;
    assert.ok(own.min[0] >= storey.minX - .1 && own.max[0] <= storey.maxX + .1, `${room.id} runs past the wall in x`);
    assert.ok(own.min[2] >= storey.minZ - .1 && own.max[2] <= storey.maxZ + .1, `${room.id} runs past the wall in z`);
    const space = spaceOf(room, rooms.spaces);
    if (!space) continue;
    const rect = spaceRect(space);
    assert.ok(own.min[0] >= rect.minX - 1e-6 && own.max[0] <= rect.maxX + 1e-6, `${room.id} runs outside its enclosure`);
    assert.ok(own.min[2] >= rect.minZ - 1e-6 && own.max[2] <= rect.maxZ + 1e-6, `${room.id} runs outside its enclosure`);
  }
  const pool = roomBox(all.find(room => room.id === 'f0-site-pool'), rooms.dimensions, rooms.floor_datums_m, rooms.spaces);
  assert.ok(pool.max[1] - pool.min[1] < 2, 'the pool is being lit as though it were a storey');
});

test('rooms of one open plan are told apart, and a hall is not a whole floor', () => {
  // f1-S1 is the salon, the dining area and the hallway as one enclosure. Its
  // rectangle is the whole front of the house, so lighting the hallway with it
  // lit the entire floor - which is what the owner saw. The measured
  // rectangles are three different rooms.
  const box = id => roomBox(rooms.rooms.find(room => room.id === id), rooms.dimensions, rooms.floor_datums_m, rooms.spaces);
  const hall = box('f1-Z02'), salon = box('f1-Z06'), dining = box('f1-Z05');
  for (const pair of [[hall, salon], [hall, dining], [salon, dining]])
    assert.notDeepEqual(pair[0].min, pair[1].min, 'two rooms of one enclosure share a rectangle');
  const area = b => (b.max[0] - b.min[0]) * (b.max[2] - b.min[2]);
  const whole = spaceRect(spaceOf(rooms.rooms.find(room => room.id === 'f1-Z02'), rooms.spaces));
  const wholeArea = (whole.maxX - whole.minX) * (whole.maxZ - whole.minZ);
  assert.ok(area(hall) < wholeArea * 0.35, `the hallway still lights ${(100 * area(hall) / wholeArea).toFixed(0)} % of its floor`);
  assert.ok(area(salon) < wholeArea * 0.55, 'the salon still lights most of its floor');
});

test('a union covers every room the sentence names', () => {
  const ids = ['f2-102', 'f2-103', 'f2-104'];
  const boxes = ids.map(id => roomBox(rooms.rooms.find(room => room.id === id), rooms.dimensions, rooms.floor_datums_m, rooms.spaces));
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
  assert.ok(lit.has('f0-site-pool'), 'the pool is never lit');
  // The garden is shown as the plot minus the house rather than as its one
  // registered Bahce label, because the sentence says the garden WRAPS the
  // villa and that label is only the lawn behind it.
  assert.ok(lit.has('mark:plot-ring'), 'the garden is never shown');
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

test('the side gallery shows the owner\'s own frames of what is being named', () => {
  const known = new Map(PHOTO_POINTS.map(point => [point.id, point]));
  let shown = 0;
  for (const step of steps) {
    assert.ok(step.photos.length <= 3,
      `${step.photos.length} frames at ${step.at} s; beyond three it is a contact sheet`);
    for (const id of step.photos) {
      const point = known.get(id);
      assert.ok(point, `photograph ${id} is shown at ${step.at} s and is not in the register`);
      // A frame taken inside the house must belong to the storey on screen;
      // an outdoor frame, or one that follows the visitor up the building,
      // may appear anywhere.
      if (/^f[0-3]$/.test(step.view) && !point.outdoor && !point.follow)
        assert.equal('f' + point.floor, step.view,
          `photograph ${id} (${point.tr}) is shown while ${step.view} is open`);
      shown++;
    }
  }
  assert.ok(shown > 60, `only ${shown} frames across the whole tour`);
  // Every storey of the house gets some, so no floor is described blind.
  for (const view of ['f0', 'f1', 'f2', 'f3'])
    assert.ok(steps.some(step => step.view === view && step.photos.length), `${view} is described with no photographs`);
});

test('a sentence that names several rooms lights them one after another', () => {
  // "odalar dendiği zaman ışıklar tak tak yanıp sönmelidir, aynı anda üçünü
  // de açma" - the reveal is spread across the sentence, so a cue naming
  // three rooms has to hold long enough for three beats.
  const many = steps.filter(step => step.rooms.filter(id => !id.startsWith('mark:')).length > 1);
  assert.ok(many.length >= 5, 'no sentence names more than one room');
  for (const step of many)
    assert.ok(step.span >= 1.6 * step.rooms.length / 2,
      `${step.rooms.length} rooms in ${step.span.toFixed(1)} s at ${step.at} s is too fast to read`);
});

test('the two balconies are told apart', () => {
  // The master's balcony hangs over the pool; the corner balcony the coffee
  // sentence names is the OTHER one, on the street side. They must not be
  // shown from the same bearing or they read as one balcony seen twice.
  const master = steps.find(step => step.rooms.includes('f2-110'));
  const corner = steps.find(step => step.rooms.includes('f2-109'));
  assert.ok(master && corner, 'one of the balconies is never shown');
  assert.notEqual(master.rooms[0], corner.rooms[0]);
  const apart = Math.abs(Math.atan2(Math.sin(master.azimuth - corner.azimuth), Math.cos(master.azimuth - corner.azimuth)));
  assert.ok(apart > 2, `the balconies are looked at from ${apart.toFixed(2)} rad apart; they will read as one`);
});

test('a room comes up and goes down rather than being switched', () => {
  // "ışıkların yanıp sönmesi şak diye değil daha fade in fade out smooth
  // olmalıdır." Half a second up, half a second down, per room.
  const box = n => new THREE.Box3(new THREE.Vector3(n, 0, n), new THREE.Vector3(n + 1, 2, n + 1));
  let entries = mergeEntries([], [box(0)]);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].t, 0, 'a new room starts lit');
  entries = advanceEntries(entries, 0.1, 0.5);
  assert.ok(entries[0].t > 0.15 && entries[0].t < 0.25, `a fifth of the way up, not ${entries[0].t}`);
  for (let i = 0; i < 10; i++) entries = advanceEntries(entries, 0.1, 0.5);
  assert.equal(entries[0].t, 1, 'it never reaches full');

  // The next room in the sentence ARRIVES; the first does not restart.
  entries = mergeEntries(entries, [box(0), box(5)]);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].t, 1, 'the room already up was restarted');
  assert.equal(entries[1].t, 0, 'the room arriving is already up');

  // Dropping one aims it at zero and keeps it until it gets there.
  entries = advanceEntries(mergeEntries(entries, [box(5)]), 0.1, 0.5);
  const leaving = entries.find(entry => entry.key === boxKey(box(0)));
  assert.ok(leaving, 'the room that left vanished instead of fading');
  assert.ok(leaving.t < 1 && leaving.to === 0, 'it is not on its way down');
  for (let i = 0; i < 10; i++) entries = advanceEntries(entries, 0.1, 0.5);
  assert.ok(!entries.some(entry => entry.key === boxKey(box(0))), 'it never finished going down');
  assert.equal(entries.length, 1);
});

test('no cue shows the same frame twice', () => {
  // photo-points.js records that 20 repeats 4's frame; the two were shown side
  // by side under the salon sentence and read as a duplicate, because they are.
  const REPEATS = [[4, 20]];
  for (const step of steps) {
    assert.equal(new Set(step.photos).size, step.photos.length, `a frame is repeated at ${step.at} s`);
    for (const [a, b] of REPEATS)
      assert.ok(!(step.photos.includes(a) && step.photos.includes(b)),
        `photographs ${a} and ${b} are the same frame and are shown together at ${step.at} s`);
  }
});

// "en son kapanista ... icıskılar disardan gozuksun": the windows are lit for
// the closing and for nothing else, and the tour is the only thing that ever
// asks for them, so the visitor's own switch comes back untouched.
test('the closing is the only cue that lights the windows', () => {
  const lit = steps.filter(step => step.windows);
  assert.ok(lit.length, 'no cue lights the house at the closing');
  assert.ok(lit.every(step => step.at >= 343.7), 'the windows are lit before the closing');
  assert.ok(lit.every(step => step.hour !== null && step.hour >= 20),
    'the windows are lit in daylight, where they would not be seen');
  assert.ok(lit.every(step => !step.view.startsWith('f')),
    'the windows are lit from inside a storey, where the point is lost');
  // It is part of the flight's identity, so the cue that turns them on
  // reframes rather than merely turning over a subtitle.
  const before = steps[steps.indexOf(lit[0]) - 1];
  assert.notEqual(cueKey(before), cueKey(lit[0]), 'the windows come on without a reframe');
});

// The first version of this cue asserted only that the cue ASKED for the
// windows, and shipped a closing that opened on a neighbour's roof with every
// window dark. Both of those are checkable without a renderer, so they are.
test('the closing turns through ground that is actually clear', () => {
  const plan = JSON.parse(fs.readFileSync(new URL('../src/region-plan.json', import.meta.url)));
  const closing = steps.find(step => step.windows);
  const box = ring => {
    const xs = ring.map(p => p[0]), zs = ring.map(p => p[1]);
    return [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  };
  const villa = box(plan.villa);
  const others = plan.buildings.map(box).filter(b =>
    !(b[0] >= villa[0] - 2 && b[1] <= villa[1] + 2 && b[2] >= villa[2] - 2 && b[3] <= villa[3] + 2));
  assert.ok(others.length > 20, `only ${others.length} neighbours to be blocked by`);
  // Both centres the frame could take: the plan's own villa footprint, and the
  // centre the delivered model's box actually resolves to.
  const centres = [[(villa[0] + villa[1]) / 2, (villa[2] + villa[3]) / 2], [0.44, -2.93]];
  const flat = Math.sin(closing.polar);
  const blocked = (theta, radius) => centres.some(c => {
    const eye = [c[0] + radius * flat * Math.sin(theta), c[1] + radius * flat * Math.cos(theta)];
    for (let t = 0.08; t <= 1.0001; t += 0.005) {
      const x = c[0] + t * (eye[0] - c[0]), z = c[1] + t * (eye[1] - c[1]);
      if (others.some(b => x >= b[0] && x <= b[1] && z >= b[2] && z <= b[3])) return true;
    }
    return false;
  });
  // A 50 deg lens puts this frame about 22 m out, and the flight arrives along
  // the radius - so every bearing the turn passes through has to be clear at
  // every distance it is seen from, not only where it comes to rest.
  assert.equal(closing.lens, 50, 'the closing lens changed; re-derive the radii');
  for (let step = 0; step <= 1.0001; step += 1 / 90) {
    const theta = closing.azimuth + closing.sweep * step;
    for (let radius = 16; radius <= 24; radius += 2) {
      assert.ok(!blocked(theta, radius),
        `at ${radius} m the closing looks through a neighbour at ${(theta * 180 / Math.PI).toFixed(0)} deg`);
    }
  }
  // It turns far enough to read as a move, and not so far it comes round to
  // the blocked side.
  assert.ok(closing.sweep > 1.0 && closing.sweep < 2.1,
    `a turn of ${(closing.sweep * 180 / Math.PI).toFixed(0)} deg`);
  // And it leaves the roof room: below 1 the frame is tighter than the box,
  // and at this polar the near face already projects about a fifth larger.
  assert.ok(closing.pad >= 1.15, `pad ${closing.pad} crops the house`);
  // The turn is a sweep, not an orbit: an orbit here goes behind the neighbours.
  assert.ok(!closing.rotate, 'the closing orbits freely again');
});

// The lamps need something to light. An exterior view hides the interior
// group, so the closing has to put it back or the windows stay dark.
test('the closing renders the rooms its lamps are lighting', () => {
  const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const fn = main.match(/function setTourWindows\(on\)\{[\s\S]*?\n\}/);
  assert.ok(fn, 'setTourWindows is gone');
  assert.match(fn[0], /groups\.get\('interior'\)/, 'the interior group is never made visible');
  assert.match(fn[0], /visible=on\|\|\/\^f\[0-3\]\$\/\.test\(selected\)/,
    'leaving the closing does not hand the interior back to the storey rule');
});

test('the closing comes down off the roof and waits for dusk', () => {
  const closing = steps.filter(step => step.at >= 343.7);
  for (const step of closing) {
    assert.ok(step.polar > 1.2, `the closing still looks down from ${step.polar} at ${step.at} s`);
    assert.equal(step.hour, 21, 'the closing is not at dusk');
    assert.equal(step.rooms.length, 0, 'something is still lit over the closing');
    assert.ok(turns(step), 'the closing shot stands still');
  }
  // One unbroken hold, so the orbit is one move from the summary to the end.
  assert.equal(new Set(closing.map(cueKey)).size, 1, 'the closing turn is interrupted');
  // And nothing before it touches the daylight.
  for (const step of steps.filter(step => step.at < 343.7))
    assert.equal(step.hour, null, `the tour changes the light at ${step.at} s`);
});


// OrbitControls in three r180 has getAzimuthalAngle and no setter, and the
// closing's sweep called the setter for one build - a PAGEERROR on every
// frame of it, and a closing that simply stood still.
test('the sweep turns the camera with an API that exists', () => {
  const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const orbit = fs.readFileSync(
    new URL('../node_modules/three/examples/jsm/controls/OrbitControls.js', import.meta.url), 'utf8');
  const fn = main.match(/function advanceTourSweep\(time\)\{[\s\S]*?\n\}/);
  assert.ok(fn, 'advanceTourSweep is gone');
  for (const call of fn[0].matchAll(/controls\.(\w+)\(/g))
    assert.match(orbit, new RegExp(`\\n\\t${call[1]}\\(`),
      `OrbitControls has no ${call[1]}()`);
});
