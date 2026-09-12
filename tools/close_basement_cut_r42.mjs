// R42 | Cut the whole plot at the basement plane, not just the bank.
//
// Three passes, and the review has been pointing at the same thing each time.
//
// The first closed the 48 m² hole under the entrance wing: six probes inside
// it return no level-0 geometry and no plot soil, and the first thing a ray
// meets is the ground-floor slab soffit at 2.70 m. The CAD excavated the whole
// footprint and built a basement under half of it, so the plane cuts a void.
//
// The second draped a field over the ground at its own level, which was wrong
// twice over - "tam tersini bahçede taramışsın" - and the third hatched only
// the cells whose ground rises above the plane. That is the textbook rule and
// it is still not the drawing that was asked for: the villa sits on a slope,
// so the rule inks the bank by the garage and the entrance and leaves the pool
// terrace and the rear lawn green, 1.6 m below the plane. Measured: the plot's
// own earth covers 601 m², of which 249 m² carried a section face - the rest
// is the "ön kısım" and the "arka alan" of the review, and the level change
// between them is the "kot farkı".
//
// So the instruction is taken as written: "arsa içindeki, bahçe olan ve kesit
// alanının altında kalan alanlar da taranmalıdır", "arsa içi, orda kot farkı
// olmasın, tek bir clipping plane çalışacak işte". Inside the property the
// site is one solid body of earth cut at one height. Its face is the plan's
// ground and it is ruled like any cut material; the rooms are the holes in it;
// the pool, the terrace and the steps lie inside it, which is what "no level
// difference" means; and the planting stands on it, uncut, as it does on a
// plan. Outside the property nothing changes: the neighbours and their trees
// are not this drawing's subject and are not touched.
//
// The extent is the plot's own earth - the plan footprint of `R32 | Continuous
// local soil volume` - rather than a box typed in here, so the face ends where
// the modelled property ends. A skirt closes the body down to that earth's own
// surface, so tilting the basement view shows a cut block of ground and not a
// sheet floating over the lawn.
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
const UNDER = 0.004;             // the wall poché is drawn at the plane; this goes under it
const CELL = 0.10;
// The building, whose own cut is the plan's subject and is drawn by the atlas.
const BUILDING = ['level-0', 'level-1', 'level-2', 'level-3', 'envelope'];
// The plot's own earth. Its plan footprint is the property, and its surface is
// where the skirt lands.
const PLOT_SOIL = /^R32 \| Continuous local soil volume/;
const SKIRT_UNDER = 0.06;        // the skirt runs this far past the ground it meets
const SKIRT_MAX = 3.0;           // and no further, where the earth falls away

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

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

// ------------------------------------------------------- the plot's own earth
const contextDoc = await io.read(`${FULL}/context.glb`);
const soilNodes = contextDoc.getRoot().listNodes().filter((n) => n.getMesh() && PLOT_SOIL.test(n.getName()));
if (!soilNodes.length) throw new Error('no plot soil volume in context.glb');
const soilTriangles = soilNodes.flatMap(worldTriangles);
let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
for (const tri of soilTriangles) for (const [x, , z] of tri) {
  x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
}
x0 = Math.floor(x0 / CELL) * CELL; z0 = Math.floor(z0 / CELL) * CELL;
const nx = Math.ceil((x1 - x0) / CELL) + 1, nz = Math.ceil((z1 - z0) / CELL) + 1;

const plot = new Uint8Array(nx * nz);      // the property, in plan
const ground = new Float32Array(nx * nz).fill(-Infinity);  // its surface, for the skirt
const building = new Uint8Array(nx * nz);  // the house at or below the cut

// Rasterise a triangle's plan projection, interpolating its height at each cell
// centre. A near-vertical face projects to a sliver, so its whole bounding box
// is taken rather than lose it to the barycentric test.
function rasterise(triangles, visit) {
  for (const [a, b, c] of triangles) {
    const det = (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
    const lo = [Math.min(a[0], b[0], c[0]), Math.min(a[2], b[2], c[2])];
    const hi = [Math.max(a[0], b[0], c[0]), Math.max(a[2], b[2], c[2])];
    const slim = (hi[0] - lo[0]) < CELL || (hi[1] - lo[1]) < CELL || Math.abs(det) < 1e-12;
    const i0 = Math.max(0, Math.floor((lo[0] - x0) / CELL)), i1 = Math.min(nx - 1, Math.floor((hi[0] - x0) / CELL));
    const j0 = Math.max(0, Math.floor((lo[1] - z0) / CELL)), j1 = Math.min(nz - 1, Math.floor((hi[1] - z0) / CELL));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const px = x0 + (i + 0.5) * CELL, pz = z0 + (j + 0.5) * CELL;
      let y = Math.max(a[1], b[1], c[1]);
      if (!slim) {
        const u = ((b[0] - a[0]) * (pz - a[2]) - (b[2] - a[2]) * (px - a[0])) / det;
        const v = ((c[0] - b[0]) * (pz - b[2]) - (c[2] - b[2]) * (px - b[0])) / det;
        if (u < -0.02 || v < -0.02 || 1 - u - v < -0.02) continue;
        y = v * a[1] + (1 - u - v) * b[1] + u * c[1];
      }
      visit(j * nx + i, y);
    }
  }
}

rasterise(soilTriangles, (k, y) => { plot[k] = 1; if (y > ground[k]) ground[k] = y; });
let plotCells = 0; for (const v of plot) plotCells += v;
console.log(`the plot's own earth covers ${(plotCells * CELL * CELL).toFixed(1)} m²`);

for (const id of BUILDING) {
  const doc = await io.read(`${FULL}/${id}.glb`);
  for (const node of doc.getRoot().listNodes())
    if (node.getMesh()) rasterise(worldTriangles(node), (k, y) => { if (y <= CUT) building[k] = 1; });
  console.log(`  ${id} rasterised`);
}

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
rasterise(authored, (k) => { covered[k] = 1; });

// ------------------------------------------------------------------ the field
const field = new Uint8Array(nx * nz);
let cells = 0, voidCells = 0;
for (let k = 0; k < field.length; k++) {
  if (!plot[k] || covered[k] || building[k]) continue;
  field[k] = 1; cells++;
  if (!Number.isFinite(ground[k])) voidCells++;
}
// Grow one cell into the house so the earth meets the wall it is cut against
// rather than leaving a hairline of daylight where the rasters disagree. A
// wall is two cells thick at worst, so this reaches its outer face and no
// further, and the atlas poché is drawn 4 mm above it in any case.
const at = (g, i, j) => (i < 0 || j < 0 || i >= nx || j >= nz) ? 0 : g[j * nx + i];
const grown = Uint8Array.from(field);
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
  const k = j * nx + i;
  if (field[k] || !building[k] || !plot[k]) continue;
  if (at(field, i - 1, j) || at(field, i + 1, j) || at(field, i, j - 1) || at(field, i, j + 1)) {
    grown[k] = 1; cells++;
  }
}
if (!cells) throw new Error('the plot carries no ground to cut');
console.log(`${cells} cells (${(cells * CELL * CELL).toFixed(1)} m²) of site section, ` +
  `${(voidCells * CELL * CELL).toFixed(1)} m² of it the excavated void under the entrance wing`);

// ------------------------------------------------- merge the face into panels
const rows = [];
for (let j = 0; j < nz; j++) {
  let i = 0;
  while (i < nx) {
    if (!grown[j * nx + i]) { i++; continue; }
    let end = i + 1;
    while (end < nx && grown[j * nx + end]) end++;
    rows.push({ i, end, j });
    i = end;
  }
}
rows.sort((a, b) => a.i - b.i || a.end - b.end || a.j - b.j);
const boxes = [];
for (const row of rows) {
  const last = boxes.at(-1);
  if (last && last.i === row.i && last.end === row.end && last.jEnd === row.j) { last.jEnd = row.j + 1; continue; }
  boxes.push({ i: row.i, end: row.end, j: row.j, jEnd: row.j + 1 });
}

const y = CUT - UNDER;
const position = [], normal = [], index = [];
const quad = (a, b, c, d, n) => {
  const base = position.length / 3;
  for (const p of [a, b, c, d]) { position.push(...p); normal.push(...n); }
  index.push(base, base + 1, base + 2, base, base + 2, base + 3);
};
for (const box of boxes) {
  const ax = x0 + box.i * CELL, bx = x0 + box.end * CELL;
  const az = z0 + box.j * CELL, bz = z0 + box.jEnd * CELL;
  quad([ax, y, az], [ax, y, bz], [bx, y, bz], [bx, y, az], [0, 1, 0]);
}
const faceTriangles = index.length / 3;

// --------------------------------------------------------------- the skirt
// Only where the body meets open air: an edge against the house is closed by
// the wall, an edge against the authored face is the same body continuing.
// The skirt drops to the earth's own surface, so it is a cut block of ground
// rather than a sheet on stilts, and it stops after SKIRT_MAX where the earth
// falls away past the property.
let skirts = 0;
const bottomAt = (i, j) => {
  let top = -Infinity;
  for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
    const g = at(ground, i + di, j + dj);
    if (Number.isFinite(g) && g > top) top = g;
  }
  if (!Number.isFinite(top)) top = y;
  return Math.max(y - SKIRT_MAX, Math.min(top, y) - SKIRT_UNDER);
};
const open = (i, j) => !at(grown, i, j) && !at(building, i, j) && !at(covered, i, j);
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
  if (!grown[j * nx + i]) continue;
  const ax = x0 + i * CELL, bx = ax + CELL, az = z0 + j * CELL, bz = az + CELL;
  const y1 = bottomAt(i, j);
  if (y1 >= y - 1e-4) continue;
  if (open(i - 1, j)) { quad([ax, y, az], [ax, y1, az], [ax, y1, bz], [ax, y, bz], [-1, 0, 0]); skirts++; }
  if (open(i + 1, j)) { quad([bx, y, bz], [bx, y1, bz], [bx, y1, az], [bx, y, az], [1, 0, 0]); skirts++; }
  if (open(i, j - 1)) { quad([bx, y, az], [bx, y1, az], [ax, y1, az], [ax, y, az], [0, 0, -1]); skirts++; }
  if (open(i, j + 1)) { quad([ax, y, bz], [ax, y1, bz], [bx, y1, bz], [bx, y, bz], [0, 0, 1]); skirts++; }
}
console.log(`${boxes.length} panels (${faceTriangles} triangles) and ${skirts} skirt faces, ` +
  `${index.length / 3} triangles in all`);

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
  .setExtras({ category: 'section_cap', cut_height_m: CUT, cell_m: CELL,
    note: 'R42 site section: the plot cut at one height, with the rooms as its holes' }));

await capsDoc.transform(prune());
writeFileSync(CAPS, await io.writeBinary(capsDoc));

const manifest = JSON.parse(readFileSync(FULL + '/manifest.json', 'utf8'));
const raw = readFileSync(CAPS);
// The skirt is the first cap geometry to reach below the plane it is cut at,
// so the asset's recorded bounds move with it. They are kept in the exporter's
// own axes, x / -z / y.
let triangles = 0, nodes = 0;
const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
for (const node of (await io.read(CAPS)).getRoot().listNodes()) {
  const mesh = node.getMesh(); if (!mesh) continue;
  nodes++;
  for (const p of mesh.listPrimitives()) {
    triangles += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
  }
  for (const tri of worldTriangles(node)) for (const [px, py, pz] of tri) {
    const native = [px, -pz, py];
    for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], native[a]); hi[a] = Math.max(hi[a], native[a]); }
  }
}
manifest.section_cap_asset = { ...manifest.section_cap_asset, bytes: raw.length,
  sha256: createHash('sha256').update(raw).digest('hex'),
  exported_mesh_nodes: nodes, shared_meshes: nodes, triangles, bounds_native_m: [lo, hi] };
writeFileSync(FULL + '/manifest.json', JSON.stringify(manifest, null, 2));
writeFileSync(ROOT + '/build/basement-cut-closure-r42.json', JSON.stringify({
  generated_for: 'R42', cut_height_m: CUT, drawn_at_m: y, cell_m: CELL,
  plot_footprint: { x: [x0, x0 + nx * CELL], z: [z0, z0 + nz * CELL] },
  plot_area_m2: +(plotCells * CELL * CELL).toFixed(3),
  authored_face_cells: covered.reduce((n, v) => n + v, 0),
  void_area_m2: +(voidCells * CELL * CELL).toFixed(3),
  closed_area_m2: +(cells * CELL * CELL).toFixed(3),
  rectangles: boxes.length, skirt_faces: skirts,
  face_triangles: faceTriangles, triangles: index.length / 3,
  cap_asset_bytes: raw.length, cap_asset_triangles: triangles,
}, null, 2));
console.log(`section-caps.glb: ${nodes} faces, ${triangles} triangles, ${raw.length} bytes`);
