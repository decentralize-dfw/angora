// R42 | Hatch the rest of the basement cut.
//
// R39 authored one soil section face - 197.89 m2, the earth the 1.60 m plane
// passes through - and that face is right. What it does not cover is a 49 m2
// hole in the middle of the plan, and that hole is what the review is pointing
// at: a flat dark grey field over the entrance half of the house.
//
// It is dark because there is nothing there. Probed at six points inside it,
// level-0 returns no geometry at all, the plot soil returns no geometry at all,
// and the first thing any ray meets is the ground floor slab soffit at 2.70 m.
// The CAD excavated the whole footprint and then built a basement under only
// half of it, so under the entrance wing the model holds neither earth nor
// floor between the cut and the slab. The plane cuts through that void and the
// view falls through to the far side of the excavation, whose back faces read
// as the near-black mass in the screenshot.
//
// Physically that volume is fill carrying the entrance slab, so in plan it is
// earth and it takes the earth's poché. This finds every cell the cut leaves
// empty - by rasterising, at 25 mm, the topmost surface at or below 1.60 m
// across everything the f0 view clips - and closes them with one more face at
// the cut height, in the authored soil hatch material, so the whole plot reads
// as a single ruled field.
//
// The authored face is not touched. This is a second node beside it.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const CAPS = FULL + '/section-caps.glb';
const HATCH = 'R32 | soil section hatch';
const NODE = 'R42 F0 basement fill cut face';
const CUT = 1.6;                 // SOIL_CUT_HEIGHT in viewer/src/section.js
const CELL = 0.025;
// The f0 view cuts the building and the garden with the section plane and the
// plot's own soil with the earth plane; the neighbourhood terrain is never cut,
// so anything outside the plot's soil footprint is still covered by it.
const CLIPPED = ['level-0', 'level-1', 'level-2', 'level-3', 'envelope', 'garden'];
const PLOT_SOIL = /^R32 \| Continuous local soil volume/;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

// ---------------------------------------------------------------- plot extent
const contextDoc = await io.read(`${FULL}/context.glb`);
const soilNodes = contextDoc.getRoot().listNodes()
  .filter((n) => n.getMesh() && PLOT_SOIL.test(n.getName()));
if (!soilNodes.length) throw new Error('no plot soil volume in context.glb');

function* worldTriangles(node) {
  const m = node.getWorldMatrix();
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
      yield [point(ids[0]), point(ids[1]), point(ids[2])];
    }
  }
}

let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
for (const node of soilNodes) for (const tri of worldTriangles(node)) for (const [x, , z] of tri) {
  x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
}
// hold the edge in by a cell so the plot boundary itself is not read as a hole
x0 += CELL; x1 -= CELL; z0 += CELL; z1 -= CELL;
const nx = Math.ceil((x1 - x0) / CELL), nz = Math.ceil((z1 - z0) / CELL);
console.log(`plot soil footprint x[${x0.toFixed(2)},${x1.toFixed(2)}] z[${z0.toFixed(2)},${z1.toFixed(2)}] ` +
  `-> ${nx}x${nz} cells at ${CELL * 1000} mm`);

// -------------------------------------------------- what survives below the cut
const covered = new Uint8Array(nx * nz);
function rasterise(node) {
  for (const [a, b, c] of worldTriangles(node)) {
    if (Math.min(a[1], b[1], c[1]) > CUT) continue;
    const det = (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
    if (Math.abs(det) < 1e-12) continue;          // a vertical face covers no plan area
    const i0 = Math.max(0, Math.floor((Math.min(a[0], b[0], c[0]) - x0) / CELL));
    const i1 = Math.min(nx - 1, Math.floor((Math.max(a[0], b[0], c[0]) - x0) / CELL));
    const j0 = Math.max(0, Math.floor((Math.min(a[2], b[2], c[2]) - z0) / CELL));
    const j1 = Math.min(nz - 1, Math.floor((Math.max(a[2], b[2], c[2]) - z0) / CELL));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      if (covered[j * nx + i]) continue;
      const px = x0 + (i + 0.5) * CELL, pz = z0 + (j + 0.5) * CELL;
      // u weights c, v weights a and the remainder weights b
      const u = ((b[0] - a[0]) * (pz - a[2]) - (b[2] - a[2]) * (px - a[0])) / det;
      const v = ((c[0] - b[0]) * (pz - b[2]) - (c[2] - b[2]) * (px - b[0])) / det;
      if (u < -1e-6 || v < -1e-6 || 1 - u - v < -1e-6) continue;
      if (v * a[1] + (1 - u - v) * b[1] + u * c[1] <= CUT) covered[j * nx + i] = 1;
    }
  }
}
for (const id of CLIPPED) {
  const doc = await io.read(`${FULL}/${id}.glb`);
  for (const node of doc.getRoot().listNodes()) if (node.getMesh()) rasterise(node);
  console.log(`  ${id} rasterised`);
}
for (const node of soilNodes) rasterise(node);
console.log('  plot soil rasterised');

// A triangle edge can pass between two cell centres, so a single stray cell is
// the rasteriser's, not the model's. An opening drops those and keeps every
// region that is genuinely two cells across.
const at = (g, i, j) => (i < 0 || j < 0 || i >= nx || j >= nz) ? 1 : g[j * nx + i];
const empty = new Uint8Array(nx * nz);
for (let k = 0; k < empty.length; k++) empty[k] = covered[k] ? 0 : 1;
const eroded = new Uint8Array(nx * nz);
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++)
  eroded[j * nx + i] = (at(empty, i, j) && at(empty, i - 1, j) && at(empty, i + 1, j)
    && at(empty, i, j - 1) && at(empty, i, j + 1)) ? 1 : 0;
const hole = new Uint8Array(nx * nz);
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
  if (!empty[j * nx + i]) continue;
  if (eroded[j * nx + i] || at(eroded, i - 1, j) || at(eroded, i + 1, j)
      || at(eroded, i, j - 1) || at(eroded, i, j + 1)) hole[j * nx + i] = 1;
}
let cells = 0; for (const v of hole) cells += v;
if (!cells) throw new Error('the basement cut leaves nothing uncovered; nothing to close');
console.log(`${cells} cells (${(cells * CELL * CELL).toFixed(2)} m2) of the cut fall through to nothing`);

// ------------------------------------------------------------------- the face
const runs = [];
for (let j = 0; j < nz; j++) {
  let i = 0;
  while (i < nx) {
    if (!hole[j * nx + i]) { i++; continue; }
    let end = i + 1;
    while (end < nx && hole[j * nx + end]) end++;
    runs.push([i, end, j]); i = end;
  }
}
const position = [], normal = [], index = [];
for (const [i, end, j] of runs) {
  const ax = x0 + i * CELL, bx = x0 + end * CELL;
  const az = z0 + j * CELL, bz = z0 + (j + 1) * CELL;
  const base = position.length / 3;
  // wound so the face looks up; the hatch shader is double sided in any case
  for (const p of [[ax, CUT, az], [ax, CUT, bz], [bx, CUT, bz], [bx, CUT, az]]) {
    position.push(...p); normal.push(0, 1, 0);
  }
  index.push(base, base + 1, base + 2, base, base + 2, base + 3);
}
console.log(`${runs.length} runs, ${index.length / 3} triangles`);

// ---------------------------------------------------------- into section-caps
const doc = await io.read(CAPS);
const root = doc.getRoot();
for (const node of root.listNodes()) {
  if (node.getName() !== NODE) continue;
  const mesh = node.getMesh(); node.dispose(); mesh?.dispose();   // idempotent
}
const material = root.listMaterials().find((m) => m.getName() === HATCH);
if (!material) throw new Error(`section-caps.glb carries no ${HATCH} material`);
const buffer = root.listBuffers()[0] ?? doc.createBuffer();
const prim = doc.createPrimitive()
  .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(position)).setBuffer(buffer))
  .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(normal)).setBuffer(buffer))
  .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(index)).setBuffer(buffer))
  .setMaterial(material);
root.listScenes()[0].addChild(doc.createNode(NODE)
  .setMesh(doc.createMesh(NODE).addPrimitive(prim))
  .setExtras({ category: 'section_cap', cut_height_m: CUT, cell_m: CELL,
    note: 'R42 fill poché: the plan area the basement cut leaves empty' }));

await doc.transform(prune());
writeFileSync(CAPS, await io.writeBinary(doc));

const manifest = JSON.parse(readFileSync(FULL + '/manifest.json', 'utf8'));
const raw = readFileSync(CAPS);
let triangles = 0, nodes = 0;
for (const node of (await io.read(CAPS)).getRoot().listNodes()) {
  const mesh = node.getMesh(); if (!mesh) continue;
  nodes++;
  for (const p of mesh.listPrimitives()) triangles += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
}
manifest.section_cap_asset = { ...manifest.section_cap_asset, bytes: raw.length,
  sha256: createHash('sha256').update(raw).digest('hex'),
  exported_mesh_nodes: nodes, shared_meshes: nodes, triangles };
writeFileSync(FULL + '/manifest.json', JSON.stringify(manifest, null, 2));
writeFileSync(ROOT + '/build/basement-cut-closure-r42.json', JSON.stringify({
  generated_for: 'R42', cut_height_m: CUT, cell_m: CELL,
  plot_footprint: { x: [+x0.toFixed(3), +x1.toFixed(3)], z: [+z0.toFixed(3), +z1.toFixed(3)] },
  empty_cells: cells, closed_area_m2: +(cells * CELL * CELL).toFixed(3),
  runs: runs.length, triangles: index.length / 3,
  cap_asset_bytes: raw.length, cap_asset_triangles: triangles,
}, null, 2));
console.log(`section-caps.glb: ${nodes} faces, ${triangles} triangles, ${raw.length} bytes`);
