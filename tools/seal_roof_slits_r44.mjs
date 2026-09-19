// R44 | The hairline slits between roof planes stop reading as black dashes.
//
// Where the rear dormer's planes meet the main roof, the recovered CAD skins
// pass within millimetres of each other without touching, and from above the
// gap shows the attic dark as a row of black dashes on the ridge - the mark
// the review draws an arrow at. The slits are found, not guessed: a 6 cm
// ray grid over the roof records the first surface from above, and a cell
// whose top falls more than 60 cm below its neighbours' inside the roof band
// is a through-gap. Each gets a small cap at the neighbours' level in the
// roof's own clay material, so the seam reads as tile shadow, not as a hole.
// Nothing is moved; caps only.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const FILE = FULL + '/villa.glb';
const NODE = 'R44 roof slit caps';
const CELL = 0.06;
const DROP = 0.6;               // a top this far under its neighbours is a gap
const BAND_MIN = 10.2;          // only the roof, never terraces or balconies
const AREA = { x: [-7.2, 5.2], z: [-8.6, 4.6] };

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(FILE);
const root = doc.getRoot();
for (const node of root.listNodes()) {
  if (node.getName() !== NODE) continue;
  const mesh = node.getMesh(); node.dispose(); mesh?.dispose();   // idempotent
}

const nx = Math.ceil((AREA.x[1] - AREA.x[0]) / CELL), nz = Math.ceil((AREA.z[1] - AREA.z[0]) / CELL);
const top = new Float32Array(nx * nz).fill(-Infinity);
for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const m = node.getWorldMatrix();
  for (const prim of mesh.listPrimitives()) {
    const P = prim.getAttribute('POSITION').getArray();
    const I = prim.getIndices()?.getArray();
    const count = I ? I.length : P.length / 3;
    const point = (i) => [m[0] * P[i * 3] + m[4] * P[i * 3 + 1] + m[8] * P[i * 3 + 2] + m[12],
                          m[1] * P[i * 3] + m[5] * P[i * 3 + 1] + m[9] * P[i * 3 + 2] + m[13],
                          m[2] * P[i * 3] + m[6] * P[i * 3 + 1] + m[10] * P[i * 3 + 2] + m[14]];
    for (let t = 0; t < count; t += 3) {
      const ids = I ? [I[t], I[t + 1], I[t + 2]] : [t, t + 1, t + 2];
      const [a, b, c] = ids.map(point);
      const det = (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
      if (Math.abs(det) < 1e-12) continue;
      const lo = [Math.min(a[0], b[0], c[0]), Math.min(a[2], b[2], c[2])];
      const hi = [Math.max(a[0], b[0], c[0]), Math.max(a[2], b[2], c[2])];
      if (hi[0] < AREA.x[0] || lo[0] > AREA.x[1] || hi[1] < AREA.z[0] || lo[1] > AREA.z[1]) continue;
      const i0 = Math.max(0, Math.floor((lo[0] - AREA.x[0]) / CELL)), i1 = Math.min(nx - 1, Math.floor((hi[0] - AREA.x[0]) / CELL));
      const j0 = Math.max(0, Math.floor((lo[1] - AREA.z[0]) / CELL)), j1 = Math.min(nz - 1, Math.floor((hi[1] - AREA.z[0]) / CELL));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const px = AREA.x[0] + (i + 0.5) * CELL, pz = AREA.z[0] + (j + 0.5) * CELL;
        const u = ((b[0] - a[0]) * (pz - a[2]) - (b[2] - a[2]) * (px - a[0])) / det;
        const v = ((c[0] - b[0]) * (pz - b[2]) - (c[2] - b[2]) * (px - b[0])) / det;
        if (u < -0.02 || v < -0.02 || 1 - u - v < -0.02) continue;
        const y = v * a[1] + (1 - u - v) * b[1] + u * c[1];
        const k = j * nx + i;
        if (y > top[k]) top[k] = y;
      }
    }
  }
}
const at = (i, j) => (i < 0 || j < 0 || i >= nx || j >= nz) ? -Infinity : top[j * nx + i];
// Only true INTERIOR seams are capped: all four neighbours must stand high,
// which keeps the silhouette of ridges and gable edges untouched (a proud,
// dilated first attempt drew a sawtooth over the gable line). The cap tucks
// 6 mm over the LOWER flanking plane, inside the valley, so the slot shows
// clay instead of the attic dark and nothing changes the roofline.
const caps = [];
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
  const k = j * nx + i;
  let ringHi = -Infinity, ringLo = Infinity, around = 0;
  for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const n = at(i + di, j + dj);
    if (!Number.isFinite(n) || n < BAND_MIN) continue;
    around++; ringHi = Math.max(ringHi, n); ringLo = Math.min(ringLo, n);
  }
  if (around < 4) continue;
  const y = top[k];
  if (Number.isFinite(y) && y >= ringHi - DROP) continue;
  caps.push({ i, j, y: ringLo + 0.006 });
}
console.log(`${caps.length} slit cells over the roof`);
if (caps.length) {
  const material = root.listMaterials().find((m) => /^roof$/.test(m.getName()))
    ?? root.listMaterials().find((m) => /^Clay tile 3$/.test(m.getName()));
  if (!material) throw new Error('villa carries no clay/roof material for the caps');
  const position = [], normal = [], uv = [], index = [];
  for (const cap of caps) {
    const ax = AREA.x[0] + cap.i * CELL, bx = ax + CELL;
    const az = AREA.z[0] + cap.j * CELL, bz = az + CELL;
    const base = position.length / 3;
    for (const p of [[ax, cap.y, az], [ax, cap.y, bz], [bx, cap.y, bz], [bx, cap.y, az]]) {
      position.push(...p); normal.push(0, 1, 0); uv.push(p[0] * 2, p[2] * 2);
    }
    index.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const buffer = root.listBuffers()[0];
  const prim = doc.createPrimitive().setMaterial(material)
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(position)).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(normal)).setBuffer(buffer))
    .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(uv)).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(index)).setBuffer(buffer));
  root.listScenes()[0].addChild(doc.createNode(NODE)
    .setMesh(doc.createMesh(NODE).addPrimitive(prim))
    .setExtras({ category: 'fixed', note: 'R44: clay caps under the hairline gaps between roof planes' }));
}
await doc.transform(prune());
for (const ext of root.listExtensionsUsed())
  if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
const plain = `${FULL}/villa.plain.glb`;
writeFileSync(plain, await io.writeBinary(doc));
execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, FILE,
  '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
unlinkSync(plain);
const raw = readFileSync(FILE);
let triangles = 0, nodes = 0;
{
  const meshes = new Set();
  const finalDoc = await io.read(FILE);
  for (const n of finalDoc.getRoot().listNodes()) if (n.getMesh()) { nodes++; meshes.add(n.getMesh()); }
  for (const m of meshes) for (const p of m.listPrimitives())
    triangles += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
}
for (const path of [FULL + '/manifest.json', ROOT + '/viewer/public/models/full/manifest.json']) {
  if (!existsSync(path)) continue;
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  const asset = manifest.assets.find((a) => a.id === 'villa');
  asset.bytes = raw.length;
  asset.sha256 = createHash('sha256').update(raw).digest('hex');
  asset.triangles = triangles;
  asset.exported_mesh_nodes = nodes;
  writeFileSync(path, JSON.stringify(manifest, null, 2));
}
const mirror = ROOT + '/viewer/public/models/full/villa.glb';
if (existsSync(mirror)) writeFileSync(mirror, raw);
writeFileSync(ROOT + '/build/roof-slit-caps-r44.json', JSON.stringify({
  generated_for: 'R44', cell_m: CELL, drop_m: DROP, band_min_m: BAND_MIN,
  slit_cells: caps.length, asset_bytes: raw.length, asset_triangles: triangles,
}, null, 2));
console.log(`villa.glb: ${nodes} nodes, ${triangles} triangles, ${raw.length} bytes`);
