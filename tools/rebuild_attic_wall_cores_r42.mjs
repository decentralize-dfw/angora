// R42 | Put the attic partition core back where the wall is, and only there.
//
// R41 established the fault correctly - up here the wall lining rises to the
// roof while the wall behind it stops at 9.07 m, below the 9.47 m attic floor,
// so the partitions are plaster skins with nothing between them - and then
// filled them wrongly. It took the highest point of any wall triangle over
// each plan cell and ran a solid from the floor to it. A wall is not solid
// from the floor to its top: it has doors in it and windows in it, and over
// those cells the highest triangle is the head of the opening's own wall. So
// the fill closed all three attic doorways and stood in front of two of the
// three attic windows. The review saw both: "kapıda neden duvar var" and
// "üst kat pencereleri neden kapattın".
//
// The measurement that was missing is where the wall has material, not how
// high it reaches. Each wall triangle is sampled at 25 mm and the samples are
// binned by plan cell; sorting a cell's heights and cutting wherever they jump
// more than 100 mm recovers the wall's vertical intervals. Probed on the
// delivery, that returns [9.07,9.65] + [11.15,12.23] at the west window - the
// glass sits at 9.75..11.05, exactly in the gap - and [9.07,9.47] +
// [11.57,12.35] at door D11, whose head is 9.4705 + 2.0999 = 11.5704. The
// core is built from those intervals, so every opening stays an opening.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const FILE = FULL + '/level-3.glb';
const NODE = 'F3 | Attic partition core';
const WALL = /^F3 \| KAT 3\$DUVAR( KAPLAMA)?$/;
const DATUM = 9.4705;
const FLOOR = DATUM + 0.005;     // the fill starts just over the finished floor
const CELL = 0.05;
const SAMPLE = 0.025;            // spacing along a triangle edge
const GAP = 0.10;                // a jump wider than this is an opening
const MIN_FILL = 0.12;           // a stub shorter than this is not worth a box
const PLASTER = 'interior';

// Re-running this re-quantises the storey, so the wall it reads back is the
// wall it wrote, to within Draco's 14-bit position grid. The core therefore
// drifts by a few dozen boxes between runs and settles; what does not drift is
// the guard below, which is the thing that matters.
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(FILE);
const root = doc.getRoot();

function worldTriangles(node) {
  const m = node.getWorldMatrix();
  const out = [];
  for (const prim of node.getMesh().listPrimitives()) {
    const pos = prim.getAttribute('POSITION').getArray();
    const indices = prim.getIndices()?.getArray();
    const count = indices ? indices.length : pos.length / 3;
    const point = (i) => {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      return [m[0] * x + m[4] * y + m[8] * z + m[12],
              m[1] * x + m[5] * y + m[9] * z + m[13],
              m[2] * x + m[6] * y + m[10] * z + m[14]];
    };
    for (let t = 0; t < count; t += 3) {
      const ids = indices ? [indices[t], indices[t + 1], indices[t + 2]] : [t, t + 1, t + 2];
      out.push(ids.map(point));
    }
  }
  return out;
}

const walls = [];
for (const node of root.listNodes()) {
  if (!node.getMesh()) continue;
  if (node.getName() === NODE) { const mesh = node.getMesh(); node.dispose(); mesh.dispose(); continue; }
  if (WALL.test(node.getName())) walls.push(...worldTriangles(node));
}
if (!walls.length) throw new Error('no attic wall geometry found');

let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
for (const tri of walls) for (const [x, , z] of tri) {
  x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
}
x0 -= CELL; z0 -= CELL; x1 += CELL; z1 += CELL;
const nx = Math.ceil((x1 - x0) / CELL), nz = Math.ceil((z1 - z0) / CELL);
console.log(`${walls.length} attic wall triangles over ${nx}x${nz} cells of ${CELL * 1000} mm`);

// Sample every triangle over its own surface rather than rasterising its plan
// projection: a wall face is vertical, so it has no plan area to rasterise,
// and it is exactly the faces with no plan area that say where the wall is.
const heights = new Map();
for (const [a, b, c] of walls) {
  const edge = Math.max(
    Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]),
    Math.hypot(c[0] - b[0], c[1] - b[1], c[2] - b[2]),
    Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]));
  const n = Math.max(1, Math.ceil(edge / SAMPLE));
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n - i; j++) {
    const u = i / n, v = j / n, w = 1 - u - v;
    const y = u * a[1] + v * b[1] + w * c[1];
    if (y <= FLOOR) continue;
    const x = u * a[0] + v * b[0] + w * c[0], z = u * a[2] + v * b[2] + w * c[2];
    const key = Math.min(nz - 1, Math.max(0, Math.floor((z - z0) / CELL))) * nx
      + Math.min(nx - 1, Math.max(0, Math.floor((x - x0) / CELL)));
    let list = heights.get(key); if (!list) heights.set(key, list = []);
    list.push(y);
  }
}
console.log(`${heights.size} plan cells carry attic wall above the floor`);

// A cell's samples, sorted, break into the runs of wall the openings leave.
const spans = new Map();
let filled = 0;
for (const [key, list] of heights) {
  list.sort((p, q) => p - q);
  const runs = [];
  for (const y of list) {
    if (runs.length && y - runs.at(-1)[1] <= GAP) runs.at(-1)[1] = y;
    else runs.push([y, y]);
  }
  const keep = runs.map(([lo, hi]) => [Math.max(lo, FLOOR), hi]).filter(([lo, hi]) => hi - lo >= MIN_FILL);
  if (!keep.length) continue;
  spans.set(key, keep);
  for (const [lo, hi] of keep) filled += (hi - lo) * CELL * CELL;
}
console.log(`${spans.size} cells to fill, ${filled.toFixed(2)} m3 of core`);

// Merge along x wherever the neighbouring cell asks for the same intervals.
const same = (a, b) => a && b && a.length === b.length
  && a.every(([lo, hi], k) => Math.abs(lo - b[k][0]) < 0.03 && Math.abs(hi - b[k][1]) < 0.03);
const rows = [];
for (let j = 0; j < nz; j++) {
  let i = 0;
  while (i < nx) {
    const run = spans.get(j * nx + i);
    if (!run) { i++; continue; }
    let end = i + 1;
    while (end < nx && same(run, spans.get(j * nx + end))) end++;
    for (const [lo, hi] of run) rows.push({ i, end, j, lo, hi });
    i = end;
  }
}
// and again across z. A partition running in z is one cell wide, so every one
// of its rows is a separate run; merged both ways the core is a few hundred
// boxes rather than a few thousand, which is the difference between 8k
// triangles and 38k for geometry nobody is meant to see.
rows.sort((a, b) => a.i - b.i || a.end - b.end || a.lo - b.lo || a.j - b.j);
const boxes = [];
for (const row of rows) {
  const last = boxes.at(-1);
  if (last && last.i === row.i && last.end === row.end && last.jEnd === row.j
      && Math.abs(last.lo - row.lo) < 0.03 && Math.abs(last.hi - row.hi) < 0.03) {
    last.jEnd = row.j + 1; continue;
  }
  boxes.push({ i: row.i, end: row.end, j: row.j, jEnd: row.j + 1, lo: row.lo, hi: row.hi });
}

const position = [], normal = [], index = [];
const quad = (a, b, c, d) => {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const len = Math.hypot(...n) || 1; n = n.map((k) => k / len);
  const base = position.length / 3;
  for (const p of [a, b, c, d]) { position.push(...p); normal.push(...n); }
  index.push(base, base + 1, base + 2, base, base + 2, base + 3);
};
for (const box of boxes) {
  const ax = x0 + box.i * CELL, bx = x0 + box.end * CELL;
  const az = z0 + box.j * CELL, bz = z0 + box.jEnd * CELL;
  const y0 = box.lo, y1 = box.hi;
  quad([ax, y0, bz], [bx, y0, bz], [bx, y1, bz], [ax, y1, bz]);
  quad([bx, y0, az], [ax, y0, az], [ax, y1, az], [bx, y1, az]);
  quad([bx, y0, bz], [bx, y0, az], [bx, y1, az], [bx, y1, bz]);
  quad([ax, y0, az], [ax, y0, bz], [ax, y1, bz], [ax, y1, az]);
  quad([ax, y1, bz], [bx, y1, bz], [bx, y1, az], [ax, y1, az]);
  quad([ax, y0, az], [bx, y0, az], [bx, y0, bz], [ax, y0, bz]);
}
console.log(`${boxes.length} boxes, ${index.length / 3} triangles of partition core`);

// ---------------------------------------------------------------- the guard
// R41's core closed all three attic doorways and two of the three windows and
// nothing said so until the review did. So the tool proves its own work before
// it writes: a ray through every scheduled opening and every pane, against the
// core it has just built. If one is blocked, nothing is written.
function rayHits(origin, direction, triangles, limit) {
  for (const [a, b, c] of triangles) {
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const p = [direction[1] * e2[2] - direction[2] * e2[1],
               direction[2] * e2[0] - direction[0] * e2[2],
               direction[0] * e2[1] - direction[1] * e2[0]];
    const det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
    if (Math.abs(det) < 1e-12) continue;
    const inv = 1 / det, s = [origin[0] - a[0], origin[1] - a[1], origin[2] - a[2]];
    const u = (s[0] * p[0] + s[1] * p[1] + s[2] * p[2]) * inv;
    if (u < 0 || u > 1) continue;
    const q = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]];
    const v = (direction[0] * q[0] + direction[1] * q[1] + direction[2] * q[2]) * inv;
    if (v < 0 || u + v > 1) continue;
    const t = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) * inv;
    if (t > 0 && t < limit) return true;
  }
  return false;
}
const core = [];
for (let t = 0; t < index.length; t += 3)
  core.push([0, 1, 2].map((k) => position.slice(index[t + k] * 3, index[t + k] * 3 + 3)));

const schedule = JSON.parse(readFileSync(ROOT + '/build/cad/door-schedule-r41.json', 'utf8'));
const blocked = [];
for (const door of schedule.doors.filter((d) => d.level === 3)) {
  const yaw = door.frame_yaw_deg * Math.PI / 180;
  const along = [Math.cos(yaw), 0, Math.sin(yaw)], through = [-Math.sin(yaw), 0, Math.cos(yaw)];
  for (const a of [-0.25, 0, 0.25]) for (const y of [0.4, 1.0, 1.6]) {
    const origin = [door.frame_centre[0] + along[0] * a - through[0] * 0.9, door.floor_y + y,
                    door.frame_centre[1] + along[2] * a - through[2] * 0.9];
    if (rayHits(origin, through, core, 1.8)) blocked.push(`${door.id} at ${a.toFixed(2)}, ${y.toFixed(1)}`);
  }
}
// the attic glazing, clustered into panes
const glass = [];
for (const node of root.listNodes())
  if (node.getMesh() && node.getName() === 'F3 | PENCERE_KAPI$CAM') glass.push(...worldTriangles(node));
const panes = [];
for (const tri of glass) {
  const lo = [0, 1, 2].map((k) => Math.min(...tri.map((p) => p[k])));
  const hi = [0, 1, 2].map((k) => Math.max(...tri.map((p) => p[k])));
  const near = panes.find((p) => lo[0] <= p[1][0] + 0.15 && hi[0] >= p[0][0] - 0.15
    && lo[2] <= p[1][2] + 0.15 && hi[2] >= p[0][2] - 0.15 && lo[1] <= p[1][1] + 0.3 && hi[1] >= p[0][1] - 0.3);
  if (near) for (let k = 0; k < 3; k++) { near[0][k] = Math.min(near[0][k], lo[k]); near[1][k] = Math.max(near[1][k], hi[k]); }
  else panes.push([lo, hi]);
}
let checkedPanes = 0;
for (const [lo, hi] of panes) {
  if (hi[1] - lo[1] < 0.25) continue;                // transoms and slivers
  checkedPanes++;
  const spanX = hi[0] - lo[0], spanZ = hi[2] - lo[2];
  const out = spanX < spanZ ? [1, 0, 0] : [0, 0, 1];
  for (let a = 0.12; a <= 0.88; a += 0.19) for (let b = 0.15; b <= 0.85; b += 0.175) {
    const origin = [lo[0] + (spanX < spanZ ? 0 : spanX * a) - out[0] * 0.9,
                    lo[1] + (hi[1] - lo[1]) * b,
                    lo[2] + (spanX < spanZ ? spanZ * a : 0) - out[2] * 0.9];
    if (rayHits(origin, out, core, 1.8)) blocked.push(`pane at y ${origin[1].toFixed(2)}`);
  }
}
if (blocked.length)
  throw new Error(`the core blocks ${blocked.length} sight lines: ${blocked.slice(0, 6).join('; ')}`);
console.log(`clear: ${schedule.doors.filter((d) => d.level === 3).length} attic doorways, ${checkedPanes} panes`);

const material = root.listMaterials().find((m) => m.getName() === PLASTER);
if (!material) throw new Error('no plaster finish to give the fill');
const buffer = root.listBuffers()[0] ?? doc.createBuffer();
const prim = doc.createPrimitive()
  .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(position)).setBuffer(buffer))
  .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(normal)).setBuffer(buffer))
  .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(index)).setBuffer(buffer))
  .setMaterial(material);
// Marked as a wall so the section pipeline leaves it alone: the atlas already
// carries this wall's cross-section, and cutting the fill as if it were a
// cistern or a wardrobe would lay a second poché inside the first.
root.listScenes()[0].addChild(doc.createNode(NODE)
  .setMesh(doc.createMesh(NODE).addPrimitive(prim))
  .setExtras({ category: 'wall', source_layer: 'KAT 3$DUVAR', floor_index: 3,
    note: 'R42 partition core, built from the wall\'s own vertical intervals' }));

await doc.transform(prune());
for (const ext of root.listExtensionsUsed())
  if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
const plain = FULL + '/level-3.plain.glb';
writeFileSync(plain, await io.writeBinary(doc));
execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, FILE,
  '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
unlinkSync(plain);

const manifest = JSON.parse(readFileSync(FULL + '/manifest.json', 'utf8'));
const asset = manifest.assets.find((a) => a.id === 'level-3');
const raw = readFileSync(FILE);
asset.bytes = raw.length;
asset.sha256 = createHash('sha256').update(raw).digest('hex');
writeFileSync(FULL + '/manifest.json', JSON.stringify(manifest, null, 2));
writeFileSync(ROOT + '/build/attic-partition-core-r42.json', JSON.stringify({
  generated_for: 'R42', cell_m: CELL, sample_m: SAMPLE, opening_gap_m: GAP,
  floor_y: FLOOR, cells: spans.size, volume_m3: +filled.toFixed(3),
  boxes: boxes.length, triangles: index.length / 3,
  verified: { doorways: schedule.doors.filter((d) => d.level === 3).length,
    panes_checked: checkedPanes, rays_blocked: 0 },
}, null, 2));
console.log('level-3.glb re-encoded:', asset.bytes, 'bytes');
