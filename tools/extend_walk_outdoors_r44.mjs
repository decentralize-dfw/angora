// R44 | The walk goes outside: balconies, the gardens, the approach.
//
// "balkonlara ve bahçelere çıkabilmeliyiz, şuanda çıkılmıyor."
//
// The delivered grid stops at the walls - x -6.6..8.16, z -9.4..6.08 - so the
// pool terrace, the lawns, the side stair, the front approach and all three
// balconies were never surfaces at all. The grid is re-hung on the same 12 cm
// step, 192 x 335 cells over the plot, and every interior cell keeps its
// delivered runs bit for bit at an offset; nothing indoors is recomputed.
//
// Outdoor support comes from the delivered GLBs themselves: near-horizontal
// triangles of the garden, the levels and the envelope, excluding roofs,
// glass, water, planting and furniture. A surface joins the storey whose
// datum it lies nearest, which is how the side stair hands the walk from the
// entrance level down to the garden the way the indoor stairs already do.
// A cell must also agree with five of its eight neighbours to within a step,
// which is what keeps a parapet's top - level, dry, and one cell wide - from
// becoming a catwalk.
//
// Obstacles are the same fabric seen the other way: standing triangles that
// cross the body's band over a supported cell block it, grown one cell for
// shoulders. Curtains stay passable as they always were; hedges, railings,
// walls and closed leaves block, and the leaves the R44 door pass opens stop
// existing, so no special case is needed for them here.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const STEP = 0.12;
const DATUMS = [0, 3.0996, 6.3714, 9.4705];
const PLANTING = /spruce|needle|foliage|hedge|leaves|leaf|shrub|tree|branch|trunk|planting|thuja|conifer|cedar/i;
const NO_SUPPORT_MAT = /glass|water|mirror|roof|clay tile|gravel|Pool /i;
const NO_SUPPORT_NODE = /ÇATII|ÇATI ALIN|roof|Balustrade|railing|fence|Fence|parapet|canopy|awning/i;
// Blinds over the walk doorways are raised by tools/open_blinds_r44.mjs, and
// blinds elsewhere hang over glass that blocks by itself - so the AİM sheets
// never need to be obstacles, and treating them as one had walled off every
// open garden door behind its own raised blind.
const PASSABLE = /curtain|drape|sheer|SHUTTER AİM|garden grass|grass blade|grass tuft/i;
const SUPPORT_NY = 0.7;
const OBSTACLE_NY = 0.55;
const NEIGHBOUR_AGREEMENT = 5;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

// Re-runnable: the extension always starts from the delivered interior grid,
// which the first run archives before it writes over the shipped file.
const PRISTINE = ROOT + '/build/navigation-pre-r44.json';
let nav = JSON.parse(readFileSync(FULL + '/navigation.json', 'utf8'));
if (nav.outdoors_r44) nav = JSON.parse(readFileSync(PRISTINE, 'utf8'));
else writeFileSync(PRISTINE, JSON.stringify(nav));
const old = nav.grid;
// the new frame keeps the old cells on exact cell boundaries
const COLS_LEFT = 32, ROWS_UP = 167;
const grid = {
  x: +(old.x - COLS_LEFT * STEP).toFixed(4), z: +(old.z - ROWS_UP * STEP).toFixed(4),
  step: STEP, width: 192, height: 360,
};
if (Math.abs(grid.x - -10.44) > 1e-6 || Math.abs(grid.z - -29.44) > 1e-6) throw new Error('grid frame moved');
// the native grid already ran 180 rows to carry the street approach; losing
// a single delivered row here would un-walk ground that shipped walkable
if (ROWS_UP + old.height > grid.height || COLS_LEFT + old.width > grid.width)
  throw new Error('the new frame does not contain the delivered grid');
const count = grid.width * grid.height;
const layers = DATUMS.map(() => ({ heights: new Int32Array(count).fill(-32768), masks: new Uint8Array(count).fill(1), fresh: new Uint8Array(count) }));
nav.layers.forEach((layer, f) => {
  layer.rows.forEach((runs, row) => runs.forEach(([start, length, height, mask]) => {
    for (let col = start; col < start + length; col++) {
      const k = (row + ROWS_UP) * grid.width + (col + COLS_LEFT);
      layers[f].heights[k] = height; layers[f].masks[k] = mask;
    }
  }));
});
const inOldGrid = (i, j) => i >= COLS_LEFT && i < COLS_LEFT + old.width && j >= ROWS_UP && j < ROWS_UP + old.height;

// ------------------------------------------------------------ the delivery
function* worldTriangles(node) {
  const m = node.getWorldMatrix();
  for (const prim of node.getMesh().listPrimitives()) {
    const matName = prim.getMaterial()?.getName() ?? '';
    const pos = prim.getAttribute('POSITION').getArray();
    const idx = prim.getIndices()?.getArray();
    const total = idx ? idx.length : pos.length / 3;
    const point = (i) => [m[0] * pos[i * 3] + m[4] * pos[i * 3 + 1] + m[8] * pos[i * 3 + 2] + m[12],
                          m[1] * pos[i * 3] + m[5] * pos[i * 3 + 1] + m[9] * pos[i * 3 + 2] + m[13],
                          m[2] * pos[i * 3] + m[6] * pos[i * 3 + 1] + m[10] * pos[i * 3 + 2] + m[14]];
    for (let t = 0; t < total; t += 3) {
      const ids = idx ? [idx[t], idx[t + 1], idx[t + 2]] : [t, t + 1, t + 2];
      yield { tri: ids.map(point), matName };
    }
  }
}
const cellsOf = (tri) => {
  const lo = [Math.min(tri[0][0], tri[1][0], tri[2][0]), Math.min(tri[0][2], tri[1][2], tri[2][2])];
  const hi = [Math.max(tri[0][0], tri[1][0], tri[2][0]), Math.max(tri[0][2], tri[1][2], tri[2][2])];
  return {
    i0: Math.max(0, Math.floor((lo[0] - grid.x) / STEP)), i1: Math.min(grid.width - 1, Math.floor((hi[0] - grid.x) / STEP)),
    j0: Math.max(0, Math.floor((lo[1] - grid.z) / STEP)), j1: Math.min(grid.height - 1, Math.floor((hi[1] - grid.z) / STEP)),
  };
};
const heightAt = (tri, det, x, z) => {
  const [a, b, c] = tri;
  const u = ((b[0] - a[0]) * (z - a[2]) - (b[2] - a[2]) * (x - a[0])) / det;
  const v = ((c[0] - b[0]) * (z - b[2]) - (c[2] - b[2]) * (x - b[0])) / det;
  if (u < -0.05 || v < -0.05 || 1 - u - v < -0.05) return null;
  return v * a[1] + (1 - u - v) * b[1] + u * c[1];
};

const supports = DATUMS.map(() => new Float32Array(count).fill(-Infinity));
const obstacles = [];   // {i0,i1,j0,j1, tri, det?, yLo, yHi, name}
const ASSETS = ['garden', 'level-0', 'level-1', 'level-2', 'level-3', 'envelope', 'context'];
const PLOT_SOIL = /^R32 \| Continuous local soil volume/;
for (const id of ASSETS) {
  const doc = await io.read(`${FULL}/${id}.glb`);
  for (const node of doc.getRoot().listNodes()) {
    if (!node.getMesh()) continue;
    // of the context only the plot's own soil carries the lawns; the
    // neighbourhood is not walked and must not become surface or obstacle
    if (id === 'context') {
      let inPlot = false;
      for (let p = node; p; p = p.getParentNode?.()) if (PLOT_SOIL.test((p.getName?.() ?? '').replace(/_/g, ' '))) { inPlot = true; break; }
      if (!inPlot && !PLOT_SOIL.test(node.getName().replace(/_/g, ' '))) continue;
    }
    const name = node.getName().replace(/_/g, ' ');
    const extras = node.getExtras() || {};
    const planting = PLANTING.test(name);
    const furniture = extras.category === 'furniture';
    const passable = PASSABLE.test(name);
    for (const { tri, matName } of worldTriangles(node)) {
      const e1 = tri[1].map((v, k) => v - tri[0][k]);
      const e2 = tri[2].map((v, k) => v - tri[0][k]);
      const nv = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      const len = Math.hypot(...nv) || 1;
      const ny = Math.abs(nv[1] / len);
      const det = (tri[1][0] - tri[0][0]) * (tri[2][2] - tri[0][2]) - (tri[1][2] - tri[0][2]) * (tri[2][0] - tri[0][0]);
      const yLo = Math.min(tri[0][1], tri[1][1], tri[2][1]);
      const yHi = Math.max(tri[0][1], tri[1][1], tri[2][1]);
      // support
      if (ny >= SUPPORT_NY && !planting && !furniture && !passable &&
          !NO_SUPPORT_MAT.test(matName) && !NO_SUPPORT_NODE.test(name) && Math.abs(det) > 1e-12) {
        const { i0, i1, j0, j1 } = cellsOf(tri);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
          const x = grid.x + (i + 0.5) * STEP, z = grid.z + (j + 0.5) * STEP;
          const y = heightAt(tri, det, x, z);
          if (y === null) continue;
          let f = 0;
          for (let g = 1; g < DATUMS.length; g++) if (Math.abs(y - DATUMS[g]) < Math.abs(y - DATUMS[f])) f = g;
          // the rear garden steps down to -4 m; the basement layer owns it
          if (y < DATUMS[f] - (f === 0 ? 4.2 : 1.6) || y > DATUMS[f] + 2.3) continue;
          const k = j * grid.width + i;
          if (y > supports[f][k]) supports[f][k] = y;
        }
      }
      // obstacle
      if (ny < OBSTACLE_NY && !passable) {
        const { i0, i1, j0, j1 } = cellsOf(tri);
        if (i1 >= i0 && j1 >= j0) obstacles.push({ i0, i1, j0, j1, yLo, yHi, furniture, name });
      }
    }
  }
  console.log(id, 'scanned');
}

// -------------------------------------------------- new outdoor cells only
let added = 0;
for (let f = 0; f < 4; f++) {
  const L = layers[f], S = supports[f];
  for (let j = 0; j < grid.height; j++) for (let i = 0; i < grid.width; i++) {
    const k = j * grid.width + i;
    if (L.heights[k] !== -32768) continue;                    // the delivered grid wins
    if (!Number.isFinite(S[k]) || S[k] === -Infinity) continue;
    // five of eight neighbours within a step keeps parapets out
    let agree = 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii >= grid.width || jj >= grid.height) continue;
      const kk = jj * grid.width + ii;
      const near = Number.isFinite(S[kk]) && S[kk] !== -Infinity && Math.abs(S[kk] - S[k]) <= 0.24;
      const old = L.heights[kk] !== -32768 && Math.abs(L.heights[kk] / 1000 - S[k]) <= 0.30;
      if (near || old) agree++;
    }
    if (agree < NEIGHBOUR_AGREEMENT) continue;
    L.heights[k] = Math.round(S[k] * 1000);
    L.masks[k] = 0; L.fresh[k] = 1; added++;
  }
}
console.log('outdoor cells added:', added);

// ----------------------------------------------------------- block the new
for (const ob of obstacles) {
  for (let j = ob.j0; j <= ob.j1; j++) for (let i = ob.i0; i <= ob.i1; i++) {
    const k = j * grid.width + i;
    for (let f = 0; f < 4; f++) {
      const L = layers[f];
      if (!L.fresh[k]) continue;
      const h = L.heights[k] / 1000;
      if (ob.yLo < h + 1.65 && ob.yHi > h + 0.25) L.masks[k] |= ob.furniture ? 2 : 1;
    }
  }
}
// PROBE=f,x0,z0,x1,z1 explains a rectangle: heights, masks, and who blocks
if (process.env.PROBE) {
  const [pf, px0, pz0, px1, pz1] = process.env.PROBE.split(',').map(Number);
  const i0 = Math.floor((px0 - grid.x) / STEP), i1 = Math.floor((px1 - grid.x) / STEP);
  const j0 = Math.floor((pz0 - grid.z) / STEP), j1 = Math.floor((pz1 - grid.z) / STEP);
  for (let j = j0; j <= j1; j++) {
    let line = '';
    for (let i = i0; i <= i1; i++) {
      const k = j * grid.width + i, L = layers[pf];
      line += L.heights[k] === -32768 ? ' .... ' : `${(L.heights[k]/1000).toFixed(1)}${L.masks[k]&1?'#':L.masks[k]&2?'f':' '}${L.fresh[k]?'+':' '} `;
    }
    console.log('z=' + (grid.z + (j + 0.5) * STEP).toFixed(2), line);
  }
  const who = new Map();
  for (const ob of obstacles) {
    for (let j = Math.max(j0, ob.j0); j <= Math.min(j1, ob.j1); j++)
      for (let i = Math.max(i0, ob.i0); i <= Math.min(i1, ob.i1); i++) {
        const k = j * grid.width + i, L = layers[pf];
        if (L.heights[k] === -32768) continue;
        const h = L.heights[k] / 1000;
        if (ob.yLo < h + 1.65 && ob.yHi > h + 0.25) who.set(ob.name, (who.get(ob.name) ?? 0) + 1);
      }
  }
  for (const [name, n] of [...who.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14))
    console.log('  blocks', n, name.slice(0, 70));
}

// one cell of shoulder room around every fresh static block
for (let f = 0; f < 4; f++) {
  const L = layers[f];
  const grown = Uint8Array.from(L.masks);
  for (let j = 0; j < grid.height; j++) for (let i = 0; i < grid.width; i++) {
    const k = j * grid.width + i;
    if (!L.fresh[k] || (L.masks[k] & 1)) continue;
    outer: for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii >= grid.width || jj >= grid.height) continue;
      const kk = jj * grid.width + ii;
      if ((L.masks[kk] & 1) && (L.fresh[kk] || L.heights[kk] === -32768 ||
           Math.abs(L.heights[kk] - L.heights[k]) < 500)) { grown[k] |= 1; break outer; }
    }
  }
  L.masks = grown;
  let walkable = 0;
  for (let k = 0; k < count; k++) if (L.fresh[k] && !L.masks[k]) walkable++;
  console.log(`layer ${f}: fresh walkable ${walkable}`);
}

// -------------------------------------------------------------- thresholds
// Doorways the R44 door pass opens: support decked across the sill and the
// cells cleared, exactly the way walk-passages-r41 did it indoors.
const PASSAGES = JSON.parse(readFileSync(ROOT + '/build/door-open-r44.json', 'utf8').toString() || '{}');
for (const passage of PASSAGES.passages ?? []) {
  const { floor: f, x: [px0, px1], z: [pz0, pz1], deck } = passage;
  const L = layers[f];
  const i0 = Math.floor((px0 - grid.x) / STEP), i1 = Math.floor((px1 - grid.x) / STEP);
  const j0 = Math.floor((pz0 - grid.z) / STEP), j1 = Math.floor((pz1 - grid.z) / STEP);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const k = j * grid.width + i;
    if (L.heights[k] === -32768) L.heights[k] = Math.round(deck * 1000);
    L.masks[k] = 0;
  }
}
console.log('passages cleared:', (PASSAGES.passages ?? []).length);

// --------------------------------------------------------------- stations
const rooms = JSON.parse(readFileSync(FULL + '/rooms.json', 'utf8'));
// what the garden salon can reach decides which balconies earn a station:
// f1-Z10 is a canopy and f2-109 has no doorway in the source model - a
// station there would teleport the visitor onto a ledge with no way back
function reachFrom(fromF, fromX, fromZ) {
  const seen = new Uint8Array(count * 4);
  const queue = new Int32Array(count * 4);
  let head = 0, tail = 0;
  const si = Math.floor((fromX - grid.x) / STEP), sj = Math.floor((fromZ - grid.z) / STEP);
  const sk = sj * grid.width + si;
  if (layers[fromF].heights[sk] === -32768 || layers[fromF].masks[sk] & 1) return null;
  const first = fromF * count + sk;
  queue[tail++] = first; seen[first] = 1;
  while (head < tail) {
    const id = queue[head++];
    const f = Math.floor(id / count), cell = id % count;
    const i = cell % grid.width, j = (cell - i) / grid.width;
    const h = layers[f].heights[cell];
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii >= grid.width || jj >= grid.height) continue;
      const kk = jj * grid.width + ii;
      for (let g = 0; g < 4; g++) {
        const key = g * count + kk, L = layers[g];
        if (seen[key] || (L.masks[kk] & 1) || L.heights[kk] === -32768 || Math.abs(L.heights[kk] - h) > 240) continue;
        seen[key] = 1; queue[tail++] = key;
      }
    }
  }
  return seen;
}
const salonStation = nav.stations.find((s) => s.room_id === 'f0-B06');
const fromSalon = reachFrom(0, salonStation.position[0], salonStation.position[2]);
const sample = (f, x, z) => {
  const i = Math.floor((x - grid.x) / STEP), j = Math.floor((z - grid.z) / STEP);
  if (i < 0 || j < 0 || i >= grid.width || j >= grid.height) return null;
  const k = j * grid.width + i;
  const L = layers[f];
  return L.heights[k] === -32768 || L.masks[k] ? null : L.heights[k] / 1000;
};
const stations = nav.stations.filter((s) => !['f1-Z10', 'f2-110', 'f2-109'].includes(s.room_id));
for (const roomId of ['f1-Z10', 'f2-110', 'f2-109']) {
  const room = rooms.rooms.find((r) => r.id === roomId);
  if (!room) throw new Error(roomId + ' missing from rooms.json');
  const f = room.floor_index;
  let best = null;
  for (let dj = -12; dj <= 12; dj++) for (let di = -12; di <= 12; di++) {
    const x = room.position[0] + di * STEP, z = room.position[2] + dj * STEP;
    const h = sample(f, x, z);
    if (h === null) continue;
    const d = Math.hypot(di * STEP, dj * STEP);
    if (!best || d < best.d) best = { x, z, h, d };
  }
  if (!best) { console.log('NO SURFACE for balcony station', roomId); continue; }
  const bi = Math.floor((best.x - grid.x) / STEP), bj = Math.floor((best.z - grid.z) / STEP);
  if (!fromSalon || fromSalon[f * count + bj * grid.width + bi] !== 1) {
    console.log('balcony', roomId, 'is not reachable on foot; no station added');
    continue;
  }
  // face out from the wall: away from the room label toward open air
  const yaw = Math.atan2(-(best.x - room.position[0]) || 0.01, (best.z - room.position[2]) || 0.01);
  stations.push({ room_id: roomId, name: room.name, floor_index: f,
    view_yaw_rad: +yaw.toFixed(4), view_pitch_rad: -0.06,
    position: [+best.x.toFixed(4), +(best.h + nav.eye_height_m).toFixed(4), +best.z.toFixed(4)],
    anchor_distance_m: +best.d.toFixed(3), outdoors_r44: true });
  console.log('station', roomId, 'at', best.x.toFixed(2), best.z.toFixed(2), 'h', best.h.toFixed(2));
}

// ------------------------------------------------------------ connectivity
const reachable = fromSalon;
const connectivityNote = [];
const checks = [
  ['pool terrace', 0, 5.0, -13.0], ['rear lawn', 0, 0.0, -20.0],
  ['front approach', 1, 2.0, 6.0], ['west side stair', 1, -6.3, 1.0],
];
for (const roomId of ['f1-Z10', 'f2-110', 'f2-109']) {
  const st = stations.find((s) => s.room_id === roomId);
  if (st) checks.push(['balcony ' + roomId, st.floor_index, st.position[0], st.position[2]]);
  else connectivityNote.push(roomId + ': no walkable doorway in the source model; label only');
}
const connectivity = {};
for (const [label, f, x, z] of checks) {
  const i = Math.floor((x - grid.x) / STEP), j = Math.floor((z - grid.z) / STEP);
  const k = j * grid.width + i;
  const supported = layers[f].heights[k] !== -32768 && !(layers[f].masks[k] & 1);
  const linked = reachable && supported && reachable[f * count + k] === 1;
  connectivity[label] = { supported, reachable_from_garden_salon: Boolean(linked) };
  console.log(label, supported ? 'supported' : 'NO SURFACE', linked ? 'REACHABLE' : 'not linked');
}

// ------------------------------------------------------------------ write
for (let f = 0; f < 4; f++) {
  const L = layers[f];
  const rows = [];
  let supportedCells = 0, walkableCells = 0;
  for (let j = 0; j < grid.height; j++) {
    const runs = []; let i = 0;
    while (i < grid.width) {
      const k = j * grid.width + i;
      if (L.heights[k] === -32768) { i++; continue; }
      const h = L.heights[k], m = L.masks[k];
      let end = i + 1;
      while (end < grid.width) {
        const kk = j * grid.width + end;
        if (L.heights[kk] !== h || L.masks[kk] !== m) break;
        end++;
      }
      runs.push([i, end - i, h, m]);
      supportedCells += end - i;
      if (!m) walkableCells += end - i;
      i = end;
    }
    rows.push(runs);
  }
  nav.layers[f] = { floor_index: f, rows, supported_cells: supportedCells, walkable_furnished_cells: walkableCells };
  console.log('layer', f, 'cells', supportedCells, 'walkable', walkableCells);
}
nav.grid = { x: grid.x, z: grid.z, step: STEP, width: grid.width, height: grid.height };
nav.stations = stations;
nav.outdoors_r44 = { added_cells: added, connectivity, not_walkable: connectivityNote };
const body = JSON.stringify(nav);
writeFileSync(FULL + '/navigation.json', body);
for (const path of [FULL + '/manifest.json', ROOT + '/viewer/public/models/full/manifest.json']) {
  if (!existsSync(path)) continue;
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  manifest.navigation = { file: 'navigation.json', bytes: body.length,
    sha256: createHash('sha256').update(body).digest('hex') };
  writeFileSync(path, JSON.stringify(manifest, null, 2));
}
const mirror = ROOT + '/viewer/public/models/full/navigation.json';
if (existsSync(mirror)) writeFileSync(mirror, body);
writeFileSync(ROOT + '/build/walk-outdoors-r44.json', JSON.stringify({
  generated_for: 'R44', grid: nav.grid, added_cells: added,
  balcony_stations: stations.filter((s) => ['f1-Z10', 'f2-110', 'f2-109'].includes(s.room_id)),
  connectivity, not_walkable: connectivityNote,
}, null, 2));
console.log('navigation.json', body.length, 'bytes');
