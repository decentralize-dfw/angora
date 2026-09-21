// Steps down to the garden's lower terraces.
//
// After the plot's grass was rasterised, two strips of it stayed unreachable:
// the lower terraces along the east and west boundaries, which sit half a
// metre to nearly a metre below the ground beside them behind a retaining
// edge. The walking surface refuses a 0.9 m drop in one 12 cm cell and is
// right to - that is what stops a visitor strolling up a retaining wall - so
// the ground was there to see and not to reach.
//
// THIS TOOL INVENTS GEOMETRY. The source model has no steps down to those
// terraces; the owner asked for them anyway, and that is a decision about the
// house, not a reading of it. So it is kept to the smallest possible lie and
// signed in the delivery: one flight per pocket, at the single place where the
// two levels come closest in height, 1.2 m wide, at a garden stair's pitch,
// and nowhere else. The retaining edge stays a wall along its whole length
// except at that one flight. Every flight is listed in the file it writes to,
// under terrace_steps, and in build/terrace-steps-native.json.
//
// Run after tools/raster_plot_terrain.mjs; it reads the surface as delivered,
// floods it on foot, and only bridges what the flood could not reach.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAV = path.join(ROOT, 'build/web/native-current/native-navigation.json');
const REPORT = path.join(ROOT, 'build/terrace-steps-native.json');
const UNSUPPORTED = -32768;
const START = 'f0-B06';              // the basement salon: where a walk begins
const MIN_POCKET_M2 = 3;             // smaller than this is a ledge, not a terrace
const REACH_M = 3.0;                 // how far a flight may look for its top
const FLIGHT_WIDTH_M = 1.2;
const FLIGHT_PITCH = 1.6;            // metres of going per metre of rise
const MAX_PASSES = 6;                // bridging one pocket can expose another

const nav = JSON.parse(fs.readFileSync(NAV, 'utf8'));
const grid = nav.grid, count = grid.width * grid.height, step = grid.step;
const eye = nav.eye_height_m, maxStep = nav.maximum_step_m * 1000;
const layers = nav.layers.map(layer => {
  const heights = new Int16Array(count).fill(UNSUPPORTED), masks = new Uint8Array(count).fill(1);
  for (const [row, runs] of layer.rows.entries())
    for (const [start, length, height, mask] of runs)
      for (let col = start; col < start + length; col++) {
        heights[row * grid.width + col] = height; masks[row * grid.width + col] = mask;
      }
  return {heights, masks};
});
const index = (x, z) => {
  const col = Math.floor((x - grid.x) / step), row = Math.floor((z - grid.z) / step);
  return col < 0 || row < 0 || col >= grid.width || row >= grid.height ? -1 : row * grid.width + col;
};
const worldX = col => grid.x + (col + 0.5) * step;
const worldZ = row => grid.z + (row + 0.5) * step;
const standable = (floor, cell) => layers[floor].heights[cell] !== UNSUPPORTED && !(layers[floor].masks[cell] & 3);
// The house's own footprint: steps are a garden thing.
const outdoors = (x, z) => x < -6.6 || x > 7.6 || z < -8.6 || z > 5.6;

function flood() {
  const from = nav.stations.find(s => s.room_id === START).position;
  let start = null;
  for (let floor = 0; floor < 4; floor++) {
    const cell = index(from[0], from[2]);
    if (cell < 0 || !standable(floor, cell)) continue;
    const difference = Math.abs(layers[floor].heights[cell] / 1000 - (from[1] - eye));
    if (difference < 0.35 && (!start || difference < start.difference)) start = {floor, cell, difference};
  }
  if (!start) throw Error('The starting station is not on the surface');
  const seen = new Uint8Array(count * 4), queue = new Int32Array(count * 4);
  let head = 0, tail = 0;
  seen[start.floor * count + start.cell] = 1; queue[tail++] = start.floor * count + start.cell;
  while (head < tail) {
    const id = queue[head++], floor = Math.floor(id / count), cell = id % count;
    const col = cell % grid.width, row = Math.floor(cell / grid.width);
    const height = layers[floor].heights[cell];
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = col + dc, nr = row + dr;
      if (nc < 0 || nr < 0 || nc >= grid.width || nr >= grid.height) continue;
      const next = nr * grid.width + nc;
      for (let f = 0; f < 4; f++) {
        const key = f * count + next;
        if (seen[key] || !standable(f, next)) continue;
        if (Math.abs(layers[f].heights[next] - height) > maxStep) continue;
        seen[key] = 1; queue[tail++] = key;
      }
    }
  }
  return seen;
}

// Outdoor ground the flood could not reach, in connected groups.
function pockets(seen) {
  const stranded = new Map();                       // plan cell -> best floor
  for (let row = 0; row < grid.height; row++) for (let col = 0; col < grid.width; col++) {
    const cell = row * grid.width + col;
    if (!outdoors(worldX(col), worldZ(row))) continue;
    for (let floor = 0; floor < 4; floor++) {
      if (!standable(floor, cell) || seen[floor * count + cell]) continue;
      stranded.set(cell, floor);
      break;
    }
  }
  const groups = [], visited = new Set();
  for (const cell of stranded.keys()) {
    if (visited.has(cell)) continue;
    const stack = [cell], group = [];
    visited.add(cell);
    while (stack.length) {
      const here = stack.pop();
      group.push(here);
      const col = here % grid.width, row = Math.floor(here / grid.width);
      for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
        const nc = col + dc, nr = row + dr;
        if (nc < 0 || nr < 0 || nc >= grid.width || nr >= grid.height) continue;
        const next = nr * grid.width + nc;
        if (stranded.has(next) && !visited.has(next)) {visited.add(next); stack.push(next);}
      }
    }
    groups.push(group.map(cell => ({cell, floor: stranded.get(cell)})));
  }
  return groups.sort((a, b) => b.length - a.length);
}

const reach = Math.round(REACH_M / step);
const flights = [];
// Bridging one pocket can expose the next one behind it, so this runs until
// nothing of any size is left stranded or nothing more can be done.
let seen = flood();
// A pocket that could not be bridged once will not bridge on the next pass
// either, so it is remembered and left alone rather than reported five times.
const givenUp = new Set();
for (let pass = 1; pass <= MAX_PASSES; pass++) {
const groups = pockets(seen).filter(group => {
  if (group.length * step * step < MIN_POCKET_M2) return false;
  // Garden level only: a stranded scrap of balcony is not a terrace.
  const onGround = group.filter(c => c.floor <= 1).length;
  return onGround > group.length / 2 && !givenUp.has(Math.min(...group.map(c => c.cell)));
});
if (!groups.length) break;
let laidThisPass = 0;
for (const group of groups) {
  const key = Math.min(...group.map(c => c.cell));
  // Where the two levels come closest: the one place a flight is shortest.
  let best = null;
  for (const {cell, floor} of group) {
    // Garden and ground level only. A stranded scrap of balcony is not a
    // terrace, and a flight laid up there would be inventing a building.
    if (floor > 1) continue;
    const col = cell % grid.width, row = Math.floor(cell / grid.width);
    for (let dc = -reach; dc <= reach; dc++) for (let dr = -reach; dr <= reach; dr++) {
      const nc = col + dc, nr = row + dr;
      if (nc < 0 || nr < 0 || nc >= grid.width || nr >= grid.height) continue;
      if (!outdoors(worldX(nc), worldZ(nr))) continue;
      const next = nr * grid.width + nc;
      for (let f = 0; f < 2; f++) {
        if (!standable(f, next) || !seen[f * count + next]) continue;
        const rise = Math.abs(layers[f].heights[next] - layers[floor].heights[cell]) / 1000;
        const run = Math.hypot(dc, dr) * step;
        if (run < step) continue;
        const score = rise + run * 0.05;
        if (!best || score < best.score) best = {score, rise, from: {cell: next, floor: f}, to: {cell, floor}};
      }
    }
  }
  if (!best) {
    givenUp.add(key);
    flights.push({placed: false, pocket_m2: +(group.length * step * step).toFixed(1),
      reason: 'no reachable ground within ' + REACH_M + ' m'});
    continue;
  }

  const topX = worldX(best.from.cell % grid.width), topZ = worldZ(Math.floor(best.from.cell / grid.width));
  const topH = layers[best.from.floor].heights[best.from.cell] / 1000;
  const footX = worldX(best.to.cell % grid.width), footZ = worldZ(Math.floor(best.to.cell / grid.width));
  const footH = layers[best.to.floor].heights[best.to.cell] / 1000;
  const spanX = footX - topX, spanZ = footZ - topZ;
  const plan = Math.hypot(spanX, spanZ) || step;
  // Long enough to read as a flight rather than a cliff with a foothold.
  const length = Math.max(plan, Math.abs(footH - topH) * FLIGHT_PITCH);
  const dirX = spanX / plan, dirZ = spanZ / plan;
  const sideX = -dirZ, sideZ = dirX;
  const floor = best.to.floor;
  let laid = 0;
  const steps = Math.ceil(length / (step * 0.5));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const height = topH + (footH - topH) * t;
    for (let w = -FLIGHT_WIDTH_M / 2; w <= FLIGHT_WIDTH_M / 2 + 1e-9; w += step * 0.5) {
      const x = topX + dirX * length * t + sideX * w;
      const z = topZ + dirZ * length * t + sideZ * w;
      const cell = index(x, z);
      if (cell < 0 || !outdoors(x, z)) continue;
      if (layers[floor].heights[cell] !== UNSUPPORTED) continue;       // never over real ground
      layers[floor].heights[cell] = Math.round(height * 1000);
      layers[floor].masks[cell] = 0;
      laid++;
    }
  }
  if (!laid) {givenUp.add(key); flights.push({placed: false, pocket_m2: +(group.length * step * step).toFixed(1),
    reason: 'every cell a flight would use already carries ground'}); continue;}
  laidThisPass += laid;
  flights.push({placed: true, pass, pocket_cells: group.length, pocket_m2: +(group.length * step * step).toFixed(1),
    rise_m: +(topH - footH).toFixed(2), length_m: +length.toFixed(2), cells_laid: laid, floor,
    top: [+topX.toFixed(2), +topH.toFixed(2), +topZ.toFixed(2)],
    foot: [+footX.toFixed(2), +footH.toFixed(2), +footZ.toFixed(2)]});
}

  if (!laidThisPass) break;
  seen = flood();
}

// Did it work? Flood again and say so plainly.
seen = flood();
let standableCells = 0, reached = 0;
for (let row = 0; row < grid.height; row++) for (let col = 0; col < grid.width; col++) {
  if (!outdoors(worldX(col), worldZ(row))) continue;
  const cell = row * grid.width + col;
  let ground = false, ok = false;
  for (let floor = 0; floor < 4; floor++) {
    if (!standable(floor, cell)) continue;
    ground = true;
    if (seen[floor * count + cell]) ok = true;
  }
  if (ground) {standableCells++; if (ok) reached++;}
}

function encode(layer) {
  const rows = [];
  for (let row = 0; row < grid.height; row++) {
    const runs = [];
    let run = null;
    for (let col = 0; col < grid.width; col++) {
      const cell = row * grid.width + col;
      if (layer.heights[cell] === UNSUPPORTED && layer.masks[cell] === 1) {run = null; continue;}
      const height = layer.heights[cell], mask = layer.masks[cell];
      if (run && run[2] === height && run[3] === mask && run[0] + run[1] === col) run[1]++;
      else {run = [col, 1, height, mask]; runs.push(run);}
    }
    rows.push(runs);
  }
  return rows;
}
for (const [floor, layer] of nav.layers.entries()) {
  layer.rows = encode(layers[floor]);
  layer.supported_cells = [...layers[floor].heights].filter(h => h !== UNSUPPORTED).length;
  layer.walkable_furnished_cells = layers[floor].heights.reduce((total, height, cell) =>
    total + (height !== UNSUPPORTED && !(layers[floor].masks[cell] & 3) ? 1 : 0), 0);
}
nav.terrace_steps = {
  invented: true,
  note: 'The source model has no steps down to the garden\'s lower terraces. These flights were added at the owner\'s request; they are not a reading of the model.',
  flights: flights.filter(f => f.placed).map(f => ({top: f.top, foot: f.foot, rise_m: f.rise_m, length_m: f.length_m})),
};
fs.writeFileSync(NAV, JSON.stringify(nav));
const report = {flights, outdoor_standable_m2: +(standableCells * step * step).toFixed(0),
  outdoor_reachable_m2: +(reached * step * step).toFixed(0),
  outdoor_reachable_percent: +(100 * reached / standableCells).toFixed(1)};
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
