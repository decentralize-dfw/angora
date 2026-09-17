import * as THREE from 'three';
import {floorDatums} from './section.js';

export const CABIN_NODE = 'R39_lift_cabin_travel';
export const SERVED_FLOORS = [0, 1, 2];
export const LEAF_NODE = /^Lift_(door_stile|door_rail|door_pull|floral_textured_glass|floral_lead_stem|glass_rose_lead|stained-glass_leaf)\d*$/;
export const HINGE_X = -1.53, HINGE_Z = -1.33;
export const CLOSED_ROTATION_Y = Math.PI / 2;
export const OUTWARD_OPEN_ROTATION_Y = Math.PI / 2;
export const DOOR_SWING_S = 1.0;
export const FLOOR_SEND_LABEL = ['Bodrum katına gönder', 'Giriş katına gönder', '1. kata gönder'];
const CLIP_WRAP = t => ((t % 46) + 46) % 46;

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

export function route(stops, from, to) {
  const dir = to === (from + 1) % 3 ? 1 : -1;
  const a = stops.get(from), b = stops.get(to);
  return {a, b, dir, dur: ((dir > 0 ? b - a : a - b) + 46) % 46};
}

export function createLift({groups, clips, clipPlane, fullHeight, shadowsDirty, onSettled}) {
  const clip = clips.find(c => c.tracks?.some(t => t.name.startsWith(CABIN_NODE + '.')));
  const root = groups.get('villa') ?? groups.get('level-0');
  if (!clip || !root) return null;
  const stops = readStops(clip);
  const mixer = new THREE.AnimationMixer(root);
  const action = mixer.clipAction(clip);
  action.play(); action.paused = true;
  const scrub = t => {action.time = CLIP_WRAP(t); mixer.update(0);};

  const leavesByFloor = new Map(SERVED_FLOORS.map(f => [f, []]));
  const box = new THREE.Box3();
  root.updateMatrixWorld(true);
  root.traverse(object => {
    if (!LEAF_NODE.test(object.name) && !object.userData?.lift_leaf_closed_pose) return;
    const y = box.setFromObject(object).min.y;
    let floor = SERVED_FLOORS[0];
    for (const f of SERVED_FLOORS) if (Math.abs(y - floorDatums[f]) < Math.abs(y - floorDatums[floor])) floor = f;
    leavesByFloor.get(floor).push(object);
  });
  const pivots = new Map();
  for (const f of SERVED_FLOORS) {
    const leaves = leavesByFloor.get(f);
    if (!leaves.length) continue;
    const pivot = new THREE.Group();
    pivot.name = 'Lift landing door pivot | F' + f;
    pivot.userData.closedPose=leaves.some(leaf=>leaf.userData?.lift_leaf_closed_pose);
    pivot.position.set(HINGE_X, floorDatums[f], HINGE_Z);
    root.add(pivot);
    for (const leaf of leaves) pivot.attach(leaf);
    pivots.set(f, pivot);
  }
  const setDoor = (f, open) => {
    const pivot = pivots.get(f); if (!pivot) return;
    pivot.rotation.y = pivot.userData.closedPose
      ? OUTWARD_OPEN_ROTATION_Y * open
      : CLOSED_ROTATION_Y * (1 - open);
  };
  const doorOpen = f => {
    const pivot = pivots.get(f); if (!pivot) return 0;
    return pivot.userData.closedPose
      ? pivot.rotation.y / OUTWARD_OPEN_ROTATION_Y
      : 1 - pivot.rotation.y / CLOSED_ROTATION_Y;
  };

  let floor = 0, trip = null, walkActive = false, walkFloor = null;
  scrub(stops.get(0));
  for (const f of SERVED_FLOORS) setDoor(f, 0);

  const served = f => Math.min(f ?? 0, SERVED_FLOORS.at(-1));

  return {
    get travelling() {return Boolean(trip);},
    get floor() {return floor;},
    get walkFloor() {return walkFloor;},
    park(view) {
      const f = view === 'f3' ? 2 : /^f[0-2]$/.test(view) ? Number(view[1]) : null;
      if (f === null || (f === floor && !trip)) return;
      trip = null; floor = f;
      scrub(stops.get(f));
      for (const g of SERVED_FLOORS) setDoor(g, 0);
      shadowsDirty();
    },
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
      for (const g of SERVED_FLOORS) setDoor(g, 0);
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
