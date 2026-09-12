// R41 | Give the attic partitions something behind their plaster.
//
// The review's two attic-wall complaints turn out to be one fault. "Bu çatı
// duvarları neden transparent?" and "neden havada uçuyorlar?" and "bu duvarlar
// ne abi bu burada neden kesiliyor, kesikli yere kadar uzat o duvarı" are all
// the same thing seen from different angles: up here the wall *lining*
// (`KAT 3$DUVAR KAPLAMA`) rises the full height to the roof, and the wall it
// is supposed to be lining (`KAT 3$DUVAR`) stops dead at 9.07 m - below the
// attic floor at 9.47. The partitions are plaster skins with nothing between
// them. Where both skins survived you see a wall of no thickness; where only
// one did you see through it; and either way it has no foot on the floor.
//
// So the core is put back. The attic's wall geometry is rasterised in plan at
// 5 cm; every cell that carries wall above the floor gets a solid from the
// floor up to the top of the wall standing in that cell, and the cells are
// merged into runs along x first so the fill is a few hundred boxes rather
// than a few thousand. Nothing is added where the existing core already
// reaches: this fills the gap, it does not double the wall.
//
// The fill sits between the two plaster skins and is invisible wherever they
// are complete, which is the point - it is there to stop the light and the
// view, not to be seen. It is finished in plaster for the places where a skin
// is missing.
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
const CORE = 'F3 | KAT 3$DUVAR';
const DATUM = 9.4705;
const FLOOR = DATUM + 0.005;     // the fill starts just over the finished floor
const CELL = 0.05;
const MIN_FILL = 0.20;           // a shortfall under this is not worth filling
const PLASTER = 'interior';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(FILE);
const root = doc.getRoot();

function worldTriangles(node) {
  const wm = node.getWorldMatrix();
  const out = [];
  for (const prim of node.getMesh().listPrimitives()) {
    const pos = prim.getAttribute('POSITION').getArray();
    const indices = prim.getIndices()?.getArray();
    const count = indices ? indices.length : pos.length / 3;
    const point = (i) => {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      return [wm[0] * x + wm[4] * y + wm[8] * z + wm[12],
              wm[1] * x + wm[5] * y + wm[9] * z + wm[13],
              wm[2] * x + wm[6] * y + wm[10] * z + wm[14]];
    };
    for (let t = 0; t < count; t += 3) {
      const ids = indices ? [indices[t], indices[t + 1], indices[t + 2]] : [t, t + 1, t + 2];
      out.push(ids.map(point));
    }
  }
  return out;
}

const all = [], core = [];
for (const node of root.listNodes()) {
  if (!node.getMesh()) continue;
  if (node.getName() === NODE) { const mesh = node.getMesh(); node.dispose(); mesh.dispose(); continue; }
  if (!WALL.test(node.getName())) continue;
  const triangles = worldTriangles(node);
  all.push(...triangles);
  if (node.getName() === CORE) core.push(...triangles);
}
if (!all.length) throw new Error('no attic wall geometry found');

let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
for (const tri of all) for (const [x, , z] of tri) {
  x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
}
x0 -= CELL; z0 -= CELL; x1 += CELL; z1 += CELL;
const nx = Math.ceil((x1 - x0) / CELL), nz = Math.ceil((z1 - z0) / CELL);

// Highest point of a set of wall triangles over each plan cell. Rasterising
// each triangle's plan projection rather than only its vertices, so a tall
// thin face does not fall between two cells.
function tops(triangles) {
  const grid = new Float32Array(nx * nz).fill(-Infinity);
  for (const tri of triangles) {
    const [a, b, c] = tri;
    const lo = [Math.min(a[0], b[0], c[0]), Math.min(a[2], b[2], c[2])];
    const hi = [Math.max(a[0], b[0], c[0]), Math.max(a[2], b[2], c[2])];
    const top = Math.max(a[1], b[1], c[1]);
    const i0 = Math.max(0, Math.floor((lo[0] - x0) / CELL)), i1 = Math.min(nx - 1, Math.floor((hi[0] - x0) / CELL));
    const j0 = Math.max(0, Math.floor((lo[1] - z0) / CELL)), j1 = Math.min(nz - 1, Math.floor((hi[1] - z0) / CELL));
    const det = (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      if (Math.abs(det) > 1e-12) {
        const px = x0 + (i + 0.5) * CELL, pz = z0 + (j + 0.5) * CELL;
        const u = ((b[0] - a[0]) * (pz - a[2]) - (b[2] - a[2]) * (px - a[0])) / det;
        const v = ((c[0] - b[0]) * (pz - b[2]) - (c[2] - b[2]) * (px - b[0])) / det;
        // a near-vertical face projects to a sliver; accept the whole bbox for
        // those rather than lose them to the barycentric test
        const slim = (hi[0] - lo[0]) < CELL || (hi[1] - lo[1]) < CELL;
        if (!slim && (u < -0.02 || v < -0.02 || 1 - u - v < -0.02)) continue;
      }
      const k = j * nx + i;
      if (top > grid[k]) grid[k] = top;
    }
  }
  return grid;
}

const wallTop = tops(all), coreTop = tops(core);
// what has to be filled, and how high
const fill = new Float32Array(nx * nz).fill(-Infinity);
let cells = 0;
for (let k = 0; k < fill.length; k++) {
  if (!Number.isFinite(wallTop[k]) || wallTop[k] <= FLOOR + MIN_FILL) continue;
  const existing = Number.isFinite(coreTop[k]) ? coreTop[k] : -Infinity;
  if (existing >= wallTop[k] - 0.02) continue;        // the core already reaches
  fill[k] = wallTop[k]; cells++;
}
console.log(`${cells} plan cells (${(cells * CELL * CELL).toFixed(2)} m2) of attic partition have ` +
  'lining above the wall behind it');

// merge each row of equal-height cells into one box
const boxes = [];
for (let j = 0; j < nz; j++) {
  let i = 0;
  while (i < nx) {
    if (!Number.isFinite(fill[j * nx + i])) { i++; continue; }
    const height = fill[j * nx + i];
    let end = i + 1;
    while (end < nx && Math.abs(fill[j * nx + end] - height) < 0.03) end++;
    boxes.push({ i, end, j, height });
    i = end;
  }
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
  const az = z0 + box.j * CELL, bz = z0 + (box.j + 1) * CELL;
  const y0 = FLOOR, y1 = box.height;
  const p = (x, y, z) => [x, y, z];
  quad(p(ax, y0, bz), p(bx, y0, bz), p(bx, y1, bz), p(ax, y1, bz));
  quad(p(bx, y0, az), p(ax, y0, az), p(ax, y1, az), p(bx, y1, az));
  quad(p(bx, y0, bz), p(bx, y0, az), p(bx, y1, az), p(bx, y1, bz));
  quad(p(ax, y0, az), p(ax, y0, bz), p(ax, y1, bz), p(ax, y1, az));
  quad(p(ax, y1, bz), p(bx, y1, bz), p(bx, y1, az), p(ax, y1, az));
}

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
    note: 'R41 partition core, generated to back the attic lining' }));
console.log(`${boxes.length} runs, ${index.length / 3} triangles of partition core added`);

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
writeFileSync(ROOT + '/build/attic-partition-core-r41.json', JSON.stringify({
  generated_for: 'R41', cell_m: CELL, floor_y: FLOOR,
  cells, plan_area_m2: +(cells * CELL * CELL).toFixed(3),
  runs: boxes.length, triangles: index.length / 3,
}, null, 2));
console.log('level-3.glb re-encoded:', asset.bytes, 'bytes');
