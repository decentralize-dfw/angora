// R43 | The attic hall's ceiling runs flat, the way the rooms do.
//
// "kapıdan sonra biraz yükselip düz şekilde gidiyor... yani öyle aşağı inip
// düzleşmiyor, ordan dümdüz gidiyor, alçalma yok. burası ana yatay giden
// çatıya eklenen yatay bir alan."
//
// The hall has no ceiling of its own. The DWG carries one - `KAT
// 3$ÜSTKATTAVAN` spans the whole attic, x -6.03..4.09 by z -8.05..3.99 - and
// the delivery builds a quarter of it (`Source high hall white ceiling`, over
// x -1.10..4.10 by z -4.00..-0.50). Everywhere else you are looking straight
// at the underside of the roof, so the ceiling comes to a point over the hall
// and falls away on both sides. That is the shape the review draws a cross
// through.
//
// So a flat soffit is laid over the hall at FLAT, and the roof slope is left
// to show wherever it drops below that - which is what the photographs show:
// a flat white field over the middle of the room, the slope kept at the eaves
// where the window and the low wall are. The panel is the lowest surface in
// the middle, so it is what you see; nothing is removed, and the roof outside
// is untouched.
//
// FLAT is the one judgement here and it is a number, not a shape: raise it and
// the flat field narrows toward the ridge, lower it and the field widens and
// the room loses height. It is set from the ridge down, not from the floor up,
// so it cannot rise through the roof.
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
const NODE = 'F3 | R43 attic hall flat ceiling';
const FLOOR = 3;
const DATUM = 9.4705;
const CELL = 0.05;
// How far below the hall's own ridge the flat soffit sits. 0.20 m puts it just
// under the highest point the roof reaches over this room, which is what "biraz
// yükselip düz gidiyor" asks for: it rises to the top and stays there.
const BELOW_RIDGE = Number(process.env.BELOW_RIDGE ?? 0.20);
const CLEAR = 0.02;                 // the panel hangs this far under the roof it meets
const SPACES = (process.env.SPACES || 'f3-S1').split(',');

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

function worldTriangles(node) {
  const m = node.getWorldMatrix();
  const out = [];
  for (const prim of node.getMesh().listPrimitives()) {
    const pos = prim.getAttribute('POSITION').getArray();
    const idx = prim.getIndices()?.getArray();
    const count = idx ? idx.length : pos.length / 3;
    const point = (i) => {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      return [m[0] * x + m[4] * y + m[8] * z + m[12],
              m[1] * x + m[5] * y + m[9] * z + m[13],
              m[2] * x + m[6] * y + m[10] * z + m[14]];
    };
    for (let t = 0; t < count; t += 3) {
      const ids = idx ? [idx[t], idx[t + 1], idx[t + 2]] : [t, t + 1, t + 2];
      out.push(ids.map(point));
    }
  }
  return out;
}

// ------------------------------------------------------------- the hall, in plan
const spaces = JSON.parse(readFileSync(FULL + '/room-spaces.json', 'utf8')).spaces
  .filter((s) => s.floor_index === FLOOR && SPACES.includes(s.space_id));
if (!spaces.length) throw new Error(`no ${SPACES.join(', ')} on floor ${FLOOR}`);
const inHall = (x, z) => spaces.some((s) => {
  const hit = (ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, zi] = ring[i], [xj, zj] = ring[j];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
  };
  return hit(s.boundary_xz) && !(s.holes_xz || []).some(hit);
});
let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
for (const s of spaces) for (const [x, z] of s.boundary_xz) {
  x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
}
const nx = Math.ceil((x1 - x0) / CELL) + 1, nz = Math.ceil((z1 - z0) / CELL) + 1;
console.log(`hall ${SPACES.join(', ')}: x ${x0.toFixed(2)}..${x1.toFixed(2)}  z ${z0.toFixed(2)}..${z1.toFixed(2)}`);

// --------------------------------------------------- what is over it already
// the lowest thing above head height, which is the ceiling you stand under
const OVERHEAD = DATUM + 1.8;
const SOFFIT = /ÇATII|ÇATI ALIN|ek dalgalar|high hall white ceiling|Corrected continuous inner roof lining|KAT 3\$DUVAR/;
const doc = await io.read(FILE);
const root = doc.getRoot();
const under = new Float32Array(nx * nz).fill(Infinity);
for (const node of root.listNodes()) {
  if (!node.getMesh() || !SOFFIT.test(node.getName())) continue;
  for (const [a, b, c] of worldTriangles(node)) {
    if (Math.min(a[1], b[1], c[1]) < OVERHEAD) continue;
    const det = (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
    if (Math.abs(det) < 1e-12) continue;
    const lo = [Math.min(a[0], b[0], c[0]), Math.min(a[2], b[2], c[2])];
    const hi = [Math.max(a[0], b[0], c[0]), Math.max(a[2], b[2], c[2])];
    const i0 = Math.max(0, Math.floor((lo[0] - x0) / CELL)), i1 = Math.min(nx - 1, Math.floor((hi[0] - x0) / CELL));
    const j0 = Math.max(0, Math.floor((lo[1] - z0) / CELL)), j1 = Math.min(nz - 1, Math.floor((hi[1] - z0) / CELL));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const px = x0 + (i + 0.5) * CELL, pz = z0 + (j + 0.5) * CELL;
      const u = ((b[0] - a[0]) * (pz - a[2]) - (b[2] - a[2]) * (px - a[0])) / det;
      const v = ((c[0] - b[0]) * (pz - b[2]) - (c[2] - b[2]) * (px - b[0])) / det;
      if (u < -0.02 || v < -0.02 || 1 - u - v < -0.02) continue;
      const y = v * a[1] + (1 - u - v) * b[1] + u * c[1];
      const k = j * nx + i; if (y < under[k]) under[k] = y;
    }
  }
}
let ridge = -Infinity;
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
  const px = x0 + (i + 0.5) * CELL, pz = z0 + (j + 0.5) * CELL;
  if (inHall(px, pz) && Number.isFinite(under[j * nx + i])) ridge = Math.max(ridge, under[j * nx + i]);
}
if (!Number.isFinite(ridge)) throw new Error('nothing overhead in the hall to measure a ridge from');
const FLAT = ridge - BELOW_RIDGE;
console.log(`the hall's ridge is ${ridge.toFixed(3)} (${(ridge - DATUM).toFixed(2)} m over the floor); ` +
  `the flat soffit goes at ${FLAT.toFixed(3)} (${(FLAT - DATUM).toFixed(2)} m)`);

// --------------------------------------------------------------- the panel
const field = new Uint8Array(nx * nz);
let cells = 0;
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
  const px = x0 + (i + 0.5) * CELL, pz = z0 + (j + 0.5) * CELL;
  if (!inHall(px, pz)) continue;
  const y = under[j * nx + i];
  if (!Number.isFinite(y) || y < FLAT + CLEAR) continue;   // the slope is already lower here
  field[j * nx + i] = 1; cells++;
}
if (!cells) throw new Error('the roof never rises past the flat level; nothing to flatten');
console.log(`${(cells * CELL * CELL).toFixed(1)} m² of hall gets the flat soffit, ` +
  `${(spaces.reduce((a, s) => a + (s.area_m2 ?? 0), 0)).toFixed(1)} m² of hall in all`);

const rows = [];
for (let j = 0; j < nz; j++) {
  let i = 0;
  while (i < nx) {
    if (!field[j * nx + i]) { i++; continue; }
    let end = i + 1; while (end < nx && field[j * nx + end]) end++;
    rows.push({ i, end, j }); i = end;
  }
}
rows.sort((a, b) => a.i - b.i || a.end - b.end || a.j - b.j);
const boxes = [];
for (const row of rows) {
  const last = boxes.at(-1);
  if (last && last.i === row.i && last.end === row.end && last.jEnd === row.j) { last.jEnd = row.j + 1; continue; }
  boxes.push({ i: row.i, end: row.end, j: row.j, jEnd: row.j + 1 });
}
const position = [], normal = [], uv = [], index = [];
for (const box of boxes) {
  const ax = x0 + box.i * CELL, bx = x0 + box.end * CELL;
  const az = z0 + box.j * CELL, bz = z0 + box.jEnd * CELL;
  const base = position.length / 3;
  for (const p of [[ax, FLAT, az], [bx, FLAT, az], [bx, FLAT, bz], [ax, FLAT, bz]]) {
    position.push(...p); normal.push(0, -1, 0); uv.push(p[0], p[2]);   // faces the room
  }
  index.push(base, base + 1, base + 2, base, base + 2, base + 3);
}
console.log(`${boxes.length} panels, ${index.length / 3} triangles`);

for (const node of root.listNodes()) {
  if (node.getName() !== NODE) continue;
  const mesh = node.getMesh(); node.dispose(); mesh?.dispose();     // idempotent
}
const white = root.listMaterials().find((m) => m.getName().replace(/\.\d{3}$/, '') === 'ceiling');
if (!white) throw new Error('level-3 carries no ceiling material');
const buffer = root.listBuffers()[0] ?? doc.createBuffer();
const prim = doc.createPrimitive()
  .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(position)).setBuffer(buffer))
  .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(normal)).setBuffer(buffer))
  .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(uv)).setBuffer(buffer))
  .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(index)).setBuffer(buffer))
  .setMaterial(white);
root.listScenes()[0].addChild(doc.createNode(NODE)
  .setMesh(doc.createMesh(NODE).addPrimitive(prim))
  .setExtras({ category: 'ceiling', floor_index: FLOOR, note: 'R43 flat hall soffit' }));

await doc.transform(prune());
for (const ext of root.listExtensionsUsed())
  if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
const plain = `${FULL}/level-3.plain.glb`;
writeFileSync(plain, await io.writeBinary(doc));
execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, FILE,
  '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
unlinkSync(plain);

const raw = readFileSync(FILE);
let triangles = 0;
for (const n of (await io.read(FILE)).getRoot().listNodes()) {
  const m = n.getMesh(); if (!m) continue;
  for (const p of m.listPrimitives())
    triangles += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
}
for (const path of [FULL + '/manifest.json', ROOT + '/viewer/public/models/full/manifest.json']) {
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  const asset = manifest.assets.find((a) => a.id === 'level-3');
  asset.bytes = raw.length;
  asset.sha256 = createHash('sha256').update(raw).digest('hex');
  asset.triangles = triangles;
  writeFileSync(path, JSON.stringify(manifest, null, 2));
}
writeFileSync(ROOT + '/viewer/public/models/full/level-3.glb', raw);
writeFileSync(ROOT + '/build/attic-hall-ceiling-r43.json', JSON.stringify({
  generated_for: 'R43', spaces: SPACES, cell_m: CELL,
  ridge_y: +ridge.toFixed(4), flat_y: +FLAT.toFixed(4),
  flat_over_floor_m: +(FLAT - DATUM).toFixed(3), below_ridge_m: BELOW_RIDGE,
  flat_area_m2: +(cells * CELL * CELL).toFixed(2), panels: boxes.length, triangles: index.length / 3,
  asset_bytes: raw.length, asset_triangles: triangles,
}, null, 2));
console.log(`level-3.glb: ${triangles} triangles, ${raw.length} bytes`);
