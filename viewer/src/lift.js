import * as THREE from 'three';
import {floorDatums} from './section.js';

// The delivery carries the lift as data the viewer used to throw away: a 46 s
// three-stop clip on the node `R39 lift cabin travel` in level-0.glb, and one
// hinged landing door per served floor (17 leaf nodes each), delivered fully
// open on all three floors at once. Playback is deliberately not a free
// running loop: measured against the section cut, a travelling cabin is fully
// erased once it climbs 1.595 m above the viewed datum, the Villa view hides
// it behind the opaque envelope, and a permanent animation would force a
// permanent redraw of the whole 40 MB scene. So outside the interior walk the
// cabin simply parks at the selected floor with that floor's door open and
// the other two shut - inside the frame the view change already invalidated -
// and inside the walk one control calls it or sends it away, playing the
// native 0.31 m/s travel for real in the one place it can be watched.
export const CABIN_NODE = 'R39_lift_cabin_travel';
export const SERVED_FLOORS = [0, 1, 2];
export const LEAF_NODE = /^Lift_(door_stile|door_rail|door_pull|floral_textured_glass|floral_lead_stem|glass_rose_lead|stained-glass_leaf)\d*$/;
export const HINGE_X = -1.53, HINGE_Z = -1.33;
export const CLOSED_ROTATION_Y = Math.PI / 2; // delivered pose 0 = fully open
export const DOOR_SWING_S = 1.0;
export const FLOOR_SEND_LABEL = ['Bodrum katına gönder', 'Giriş katına gönder', '1. kata gönder'];
const CLIP_WRAP = t => ((t % 46) + 46) % 46;

// The park schedule is read out of the clip rather than hardcoded: a stop is a
// pair of consecutive keys with equal height, parked at the window's midpoint,
// and the height names its floor by the nearest datum - the delivered stops
// land on the datums to float32 (worst 1.2e-7 m). Throws rather than guesses
// when a future export changes the shape of the travel.
export function readStops(clip) {
  const track = clip.tracks.find(t => t.name === CABIN_NODE + '.position');
  if (!track) throw Error('Lift clip has no cabin position track');
  const stops = new Map();
  for (let i = 0; i + 1 < track.times.length; i++) {
    const a = track.values[i * 3 + 1], b = track.values[i * 3 + 4];
    if (a !== b) continue;
    const floor = floorDatums.findIndex(d => Math.abs(d - a) < 1e-3);
    if (floor < 0) throw Error(`Lift stop at ${a} m matches no floor datum`);
    if (!stops.has(floor)) stops.set(floor, (track.times[i] + track.times[i + 1]) / 2);
  }
  if (stops.size < 2) throw Error('Lift clip has fewer than two stops');
  return stops;
}

// Single-direction routing with no intermediate dwell, verified against the
// clip: forward for the next floor in the 0-1-2-0 cycle, reverse otherwise -
// the reverse leg is what lets a basement-to-attic trip skip the middle stop.
export function route(stops, from, to) {
  const dir = to === (from + 1) % 3 ? 1 : -1;
  const a = stops.get(from), b = stops.get(to);
  return {a, b, dir, dur: ((dir > 0 ? b - a : a - b) + 46) % 46};
}

export function createLift({groups, clips, clipPlane, fullHeight, shadowsDirty, onSettled}) {
  const clip = clips.find(c => c.tracks?.some(t => t.name.startsWith(CABIN_NODE + '.')));
  const root = groups.get('level-0');
  if (!clip || !root) return null;
  const stops = readStops(clip);
  const mixer = new THREE.AnimationMixer(root);
  const action = mixer.clipAction(clip);
  action.play(); action.paused = true;
  const scrub = t => {action.time = CLIP_WRAP(t); mixer.update(0);};

  // One pivot per served floor, standing on the hinge line the delivered
  // leaves swing about; Object3D.attach keeps every leaf's world pose, so
  // rotation.y = 0 reproduces the delivered open door bit for bit.
  const pivots = new Map();
  for (const f of SERVED_FLOORS) {
    const group = groups.get('level-' + f);
    if (!group) continue;
    const leaves = [];
    group.traverse(object => {if (LEAF_NODE.test(object.name)) leaves.push(object);});
    if (!leaves.length) continue;
    const pivot = new THREE.Group();
    pivot.name = 'Lift landing door pivot | F' + f;
    pivot.position.set(HINGE_X, floorDatums[f], HINGE_Z);
    group.add(pivot);
    for (const leaf of leaves) pivot.attach(leaf);
    pivots.set(f, pivot);
  }
  const setDoor = (f, open) => {const pivot = pivots.get(f); if (pivot) pivot.rotation.y = CLOSED_ROTATION_Y * (1 - open);};
  const doorOpen = f => {const pivot = pivots.get(f); return pivot ? 1 - pivot.rotation.y / CLOSED_ROTATION_Y : 0;};

  // Delivered state is floor 0 with every door open; make it coherent now.
  let floor = 0, trip = null, walkActive = false, walkFloor = null;
  scrub(stops.get(0));
  for (const f of SERVED_FLOORS) setDoor(f, f === 0 ? 1 : 0);

  const served = f => Math.min(f ?? 0, SERVED_FLOORS.at(-1));

  return {
    get travelling() {return Boolean(trip);},
    get floor() {return floor;},
    get walkFloor() {return walkFloor;},
    // Villa, neighbourhood and region leave the cabin where it is; a floor view
    // parks it at that floor (the attic waits at the highest served landing),
    // instantly, inside the frame the view change already redraws.
    park(view) {
      const f = view === 'f3' ? 2 : /^f[0-2]$/.test(view) ? Number(view[1]) : null;
      if (f === null || (f === floor && !trip)) return;
      trip = null; floor = f;
      scrub(stops.get(f));
      for (const g of SERVED_FLOORS) setDoor(g, g === f ? 1 : 0);
      shadowsDirty();
    },
    // The clip may only run when nothing is cut: the walk sets the section
    // plane to fullHeight, and every other state would slice the moving cabin.
    canRun() {return walkActive && clipPlane.constant >= fullHeight - 0.001 && stops.has(this.target());},
    target() {
      const here = served(walkFloor ?? floor);
      return floor === here ? (floor + 1) % 3 : here;
    },
    run(time) {
      if (!this.canRun() || trip) return false;
      const to = this.target();
      if (to === floor) return false;
      trip = {from: floor, to, phase: 'close', t0: time, ...route(stops, floor, to)};
      shadowsDirty();
      return true;
    },
    update(time) {
      if (!trip) return false;
      if (!trip.t0) trip.t0 = time;
      const k = (time - trip.t0) / 1000 / (trip.phase === 'move' ? trip.dur : DOOR_SWING_S);
      if (trip.phase === 'close') {
        setDoor(trip.from, Math.max(0, 1 - k));
        if (k >= 1) {trip.phase = 'move'; trip.t0 = time;}
      } else if (trip.phase === 'move') {
        scrub(trip.a + trip.dir * Math.min(1, k) * trip.dur);
        if (k >= 1) {trip.phase = 'open'; trip.t0 = time; floor = trip.to;}
      } else {
        setDoor(trip.to, Math.min(1, k));
        if (k >= 1) {trip = null; shadowsDirty(); onSettled?.(); return false;}
      }
      return true;
    },
    cancel() {
      if (!trip) return;
      const f = trip.phase === 'open' ? trip.to : trip.from;
      trip = null; floor = f;
      scrub(stops.get(f));
      for (const g of SERVED_FLOORS) setDoor(g, g === f ? 1 : 0);
      shadowsDirty();
    },
    setWalkActive(active) {walkActive = active;},
    setWalkFloor(f) {walkFloor = f;},
    snapshot() {
      return {floor, travelling: Boolean(trip), target: this.target(), clip_time: action.time,
        doors: SERVED_FLOORS.map(f => Number(doorOpen(f).toFixed(3)))};
    },
  };
}
