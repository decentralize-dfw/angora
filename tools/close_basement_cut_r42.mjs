// R42 | Hatch the whole plot at the basement cut, and hatch it finely.
//
// The first pass closed the 48 m² hole under the entrance wing: six probes
// inside it return no level-0 geometry and no plot soil, and the first thing a
// ray meets is the ground-floor slab soffit at 2.70 m, so the plane cut a void
// and the view fell through to the back of the excavation. That is still done
// here, and the reasoning still holds - the volume is the fill carrying the
// entrance slab, and in plan that is earth.
//
// The review then widened it: "sadece basement bina alanı değil, arsa içindeki,
// bahçe olan ve kesit alanının altında kalan alanlar da taranmalıdır. ve daha
// kibar tara, duvarların taranması gibi." So the field is the plot, not the
// hole, and it is drawn thin.
//
// Two things follow. First, scope: every cell inside the plot's own soil
// footprint whose topmost surface at or below the cut is earth - the soil
// volume, the lawn, the planting rooted in it - or nothing at all. The pool,
// its coping and water, the terrace, the garden stairs, the retaining walls
// and the house itself are constructions standing in that earth and they keep
// their own reading.
//
// Second, height. A flat sheet at 1.60 m over the whole plot would float up to
// 1.7 m above the rear lawn, and the basement view can be tilted. So the field
// is draped: where the earth rises through the cut it sits on the cut, and
// where it falls away it lies 6 mm over the ground it describes. The hatch is
// keyed to world x+z, so draping changes nothing about the ruling.
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
const NODE = 'R42 F0 site section field';
const OLD_NODES = ['R42 F0 basement fill cut face', NODE];
const CUT = 1.6;                 // SOIL_CUT_HEIGHT in viewer/src/section.js
const CELL = 0.20;
const DRAPE = 0.006;             // how far the field sits over the ground it describes
// The f0 view cuts the building and the garden with the section plane and the
// plot's own soil with the earth plane; the neighbourhood terrain is never cut.
const CLIPPED = ['level-0', 'level-1', 'level-2', 'level-3', 'envelope', 'garden'];
const PLOT_SOIL = /^R32 \| Continuous local soil volume/;
// What counts as the ground itself rather than something standing on it.
const EARTH = [/^R32 \| Continuous local soil volume/, /Natural bent garden grass/,
  /Hedge (leaves|foliage)/, /Spruce (needle sprays|foliage)/, /Individual folded leaves/,
  /^Shrub /, /grass/i];

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

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

// ---------------------------------------------------------------- plot extent
const contextDoc = await io.read(`${FULL}/context.glb`);
const soilNodes = contextDoc.getRoot().listNodes()
  .filter((n) => n.getMesh() && PLOT_SOIL.test(n.getName()));
if (!soilNodes.length) throw new Error('no plot soil volume in context.glb');

let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
for (const node of soilNodes) for (const tri of worldTriangles(node)) for (const [x, , z] of tri) {
  x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
}
// hold the edge in by a cell so the plot boundary itself is not read as ground
x0 += CELL; x1 -= CELL; z0 += CELL; z1 -= CELL;
const nx = Math.ceil((x1 - x0) / CELL), nz = Math.ceil((z1 - z0) / CELL);
console.log(`plot x[${x0.toFixed(2)},${x1.toFixed(2)}] z[${z0.toFixed(2)},${z1.toFixed(2)}] -> ${nx}x${nz} cells at ${CELL} m`);

// ------------------------------------ the topmost surface at or below the cut
const top = new Float32Array(nx * nz).fill(-Infinity);
const owner = new Uint8Array(nx * nz);          // 0 nothing, 1 earth, 2 construction
function rasterise(node, earth) {
  const kind = earth ? 1 : 2;
  for (const [a, b, c] of worldTriangles(node)) {
    if (Math.min(a[1], b[1], c[1]) > CUT) continue;
    const det = (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
    if (Math.abs(det) < 1e-12) continue;        // a vertical face covers no plan area
    const i0 = Math.max(0, Math.floor((Math.min(a[0], b[0], c[0]) - x0) / CELL));
    const i1 = Math.min(nx - 1, Math.floor((Math.max(a[0], b[0], c[0]) - x0) / CELL));
    const j0 = Math.max(0, Math.floor((Math.min(a[2], b[2], c[2]) - z0) / CELL));
    const j1 = Math.min(nz - 1, Math.floor((Math.max(a[2], b[2], c[2]) - z0) / CELL));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const px = x0 + (i + 0.5) * CELL, pz = z0 + (j + 0.5) * CELL;
      // u weights c, v weights a and the remainder weights b
      const u = ((b[0] - a[0]) * (pz - a[2]) - (b[2] - a[2]) * (px - a[0])) / det;
      const v = ((c[0] - b[0]) * (pz - b[2]) - (c[2] - b[2]) * (px - b[0])) / det;
      if (u < -1e-6 || v < -1e-6 || 1 - u - v < -1e-6) continue;
      const y = v * a[1] + (1 - u - v) * b[1] + u * c[1];
      if (y > CUT) continue;
      const k = j * nx + i;
      if (y > top[k]) { top[k] = y; owner[k] = kind; }
    }
  }
}
const isEarth = (name) => EARTH.some((re) => re.test(name));
for (const id of CLIPPED) {
  const doc = await io.read(`${FULL}/${id}.glb`);
  for (const node of doc.getRoot().listNodes())
    if (node.getMesh()) rasterise(node, id === 'garden' && isEarth(node.getName()));
  console.log(`  ${id} rasterised`);
}
for (const node of soilNodes) rasterise(node, true);
console.log('  plot soil rasterised');

// ------------------------------------- what the authored cut face already has
const capsDoc = await io.read(CAPS);
const capsRoot = capsDoc.getRoot();
const authored = [];
for (const node of capsRoot.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  if (OLD_NODES.includes(node.getName())) { node.dispose(); mesh.dispose(); continue; }  // idempotent
  if (mesh.listPrimitives().some((p) => p.getMaterial()?.getName() === HATCH))
    authored.push(...worldTriangles(node));
}
const covered = new Uint8Array(nx * nz);
for (const [a, b, c] of authored) {
  const det = (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
  if (Math.abs(det) < 1e-12) continue;
  const i0 = Math.max(0, Math.floor((Math.min(a[0], b[0], c[0]) - x0) / CELL));
  const i1 = Math.min(nx - 1, Math.floor((Math.max(a[0], b[0], c[0]) - x0) / CELL));
  const j0 = Math.max(0, Math.floor((Math.min(a[2], b[2], c[2]) - z0) / CELL));
  const j1 = Math.min(nz - 1, Math.floor((Math.max(a[2], b[2], c[2]) - z0) / CELL));
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const px = x0 + (i + 0.5) * CELL, pz = z0 + (j + 0.5) * CELL;
    const u = ((b[0] - a[0]) * (pz - a[2]) - (b[2] - a[2]) * (px - a[0])) / det;
    const v = ((c[0] - b[0]) * (pz - b[2]) - (c[2] - b[2]) * (px - b[0])) / det;
    if (u < -1e-6 || v < -1e-6 || 1 - u - v < -1e-6) continue;
    covered[j * nx + i] = 1;
  }
}

// ------------------------------------------------------------------ the field
// A cell's height is sampled at its centre, and a lawn is blades: the blade
// that would poke through the sheet is the one beside the sample, not on it.
// Taking the tallest reading in the cell's own neighbourhood puts the field
// over the grass rather than in it.
const ridge = new Float32Array(nx * nz);
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
  let m = -Infinity;
  for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
    const a = i + di, b = j + dj;
    if (a < 0 || b < 0 || a >= nx || b >= nz) continue;
    if (owner[b * nx + a] === 1 && top[b * nx + a] > m) m = top[b * nx + a];
  }
  ridge[j * nx + i] = m;
}
const height = new Float32Array(nx * nz);
const field = new Uint8Array(nx * nz);
let earthCells = 0, voidCells = 0;
for (let k = 0; k < field.length; k++) {
  if (covered[k]) continue;                     // the authored cut face draws here
  if (owner[k] === 2) continue;                 // pool, terrace, steps, walls, the house
  if (owner[k] === 0) { field[k] = 1; height[k] = CUT; voidCells++; continue; }
  field[k] = 1; height[k] = Math.min(CUT, Math.max(top[k], ridge[k]) + DRAPE); earthCells++;
}
const cells = earthCells + voidCells;
if (!cells) throw new Error('nothing left to hatch at the basement cut');
console.log(`${cells} cells (${(cells * CELL * CELL).toFixed(1)} m²): ` +
  `${(earthCells * CELL * CELL).toFixed(1)} m² of plot ground draped, ` +
  `${(voidCells * CELL * CELL).toFixed(1)} m² of void closed at the cut`);

// Corner heights from the field's own cells only, so the sheet never climbs
// onto the terrace it stops at.
const corner = new Float32Array((nx + 1) * (nz + 1));
const weight = new Float32Array((nx + 1) * (nz + 1));
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
  if (!field[j * nx + i]) continue;
  const h = height[j * nx + i];
  for (const [di, dj] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const c = (j + dj) * (nx + 1) + (i + di);
    corner[c] += h; weight[c] += 1;
  }
}
const cornerY = (i, j) => { const c = j * (nx + 1) + i; return weight[c] ? corner[c] / weight[c] : CUT; };

const position = [], normal = [], index = [];
const vertex = new Int32Array((nx + 1) * (nz + 1)).fill(-1);
const need = (i, j) => {
  const c = j * (nx + 1) + i;
  if (vertex[c] < 0) {
    vertex[c] = position.length / 3;
    position.push(x0 + i * CELL, cornerY(i, j), z0 + j * CELL);
    normal.push(0, 1, 0);
  }
  return vertex[c];
};
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
  if (!field[j * nx + i]) continue;
  const a = need(i, j), b = need(i, j + 1), c = need(i + 1, j + 1), d = need(i + 1, j);
  index.push(a, b, c, a, c, d);
}
console.log(`${position.length / 3} vertices, ${index.length / 3} triangles`);

const material = capsRoot.listMaterials().find((m) => m.getName() === HATCH);
if (!material) throw new Error(`section-caps.glb carries no ${HATCH} material`);
const buffer = capsRoot.listBuffers()[0] ?? capsDoc.createBuffer();
const prim = capsDoc.createPrimitive()
  .setAttribute('POSITION', capsDoc.createAccessor().setType('VEC3').setArray(new Float32Array(position)).setBuffer(buffer))
  .setAttribute('NORMAL', capsDoc.createAccessor().setType('VEC3').setArray(new Float32Array(normal)).setBuffer(buffer))
  .setIndices(capsDoc.createAccessor().setType('SCALAR').setArray(new Uint32Array(index)).setBuffer(buffer))
  .setMaterial(material);
capsRoot.listScenes()[0].addChild(capsDoc.createNode(NODE)
  .setMesh(capsDoc.createMesh(NODE).addPrimitive(prim))
  .setExtras({ category: 'section_cap', cut_height_m: CUT, cell_m: CELL, drape_m: DRAPE,
    note: 'R42 site section field: the plot ground and the void the cut leaves' }));

await capsDoc.transform(prune());
writeFileSync(CAPS, await io.writeBinary(capsDoc));

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
  generated_for: 'R42', cut_height_m: CUT, cell_m: CELL, drape_m: DRAPE,
  plot_footprint: { x: [+x0.toFixed(3), +x1.toFixed(3)], z: [+z0.toFixed(3), +z1.toFixed(3)] },
  ground_cells: earthCells, void_cells: voidCells,
  ground_area_m2: +(earthCells * CELL * CELL).toFixed(3),
  void_area_m2: +(voidCells * CELL * CELL).toFixed(3),
  closed_area_m2: +(cells * CELL * CELL).toFixed(3),
  triangles: index.length / 3,
  cap_asset_bytes: raw.length, cap_asset_triangles: triangles,
}, null, 2));
console.log(`section-caps.glb: ${nodes} faces, ${triangles} triangles, ${raw.length} bytes`);
