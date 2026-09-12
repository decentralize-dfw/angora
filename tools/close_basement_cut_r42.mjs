// R42 | Hatch what the basement plane cuts through, and nothing else.
//
// Two corrections in one, both from the review.
//
// The first pass closed the 48 m² hole under the entrance wing: six probes
// inside it return no level-0 geometry and no plot soil, and the first thing a
// ray meets is the ground-floor slab soffit at 2.70 m. The CAD excavated the
// whole footprint and built a basement under half of it, so the plane cuts a
// void and the view falls through to the back of the excavation. That is still
// closed here, and it is still earth in plan.
//
// The second pass then draped a field over the plot's ground, and that was the
// error: "tam tersini bahçede taramışsın". A section hatch marks what the plane
// passes THROUGH. The rear lawn lies below the plane - the plane never touches
// it - so it is seen, not cut, and it stays lawn. The upslope ground by the
// garage and the entrance stands above the plane, so the plane is in it, and
// that is what takes the poché. This hatches exactly that: every cell inside
// the plot whose ground surface rises above the cut, plus the void, and none
// of the ground that lies under it.
//
// The field is therefore flat, at the cut, like any section - which also ends
// the ripple the drape put through the ruling. It sits 4 mm under the plane so
// the wall poché from the atlas, which is drawn at the plane itself, stays on
// top of it where the two meet.
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
// The plot as the viewer frames it, which is wider than the soil body's own
// footprint and takes in the driveway, the entry path and the boundary planting.
const PLOT = { x: [-10.2, 12.5], z: [-29.1, 11.0] };
// Cut by the section plane at f0: the building, and the garden with it.
const CLIPPED = ['level-0', 'level-1', 'level-2', 'level-3', 'envelope', 'garden'];
// What counts as GROUND for "is the plane inside it". Only the site's own
// fabric: the earth, the paving, the steps, the terraces, the retaining walls.
// A tree is not ground - hatching the plan footprint of a spruce because its
// canopy happens to be above 1.60 m is what put poché under the trees. Nor is
// a grass blade: the lawn mesh is 344,390 triangles of blades standing up to
// 0.3 m proud of the soil, so on ground at 1.40 m a blade crosses the plane
// and the cell reads as cut when the ground under it is not. Nor is a fence
// spear, a gate handle or a garden light.
const GROUND = /soil|terrace|stair|step|driveway|path|paving|coping|retaining|apron|deck|kerb|curb|wall cap|slab/i;
// Of the neighbourhood only the plot's own earth is cut, by the snap plane.
const PLOT_SOIL = /^R32 \| Continuous local soil volume/;

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

const nx = Math.ceil((PLOT.x[1] - PLOT.x[0]) / CELL), nz = Math.ceil((PLOT.z[1] - PLOT.z[0]) / CELL);
const [x0, z0] = [PLOT.x[0], PLOT.z[0]];
console.log(`plot x[${PLOT.x}] z[${PLOT.z}] -> ${nx}x${nz} cells at ${CELL * 1000} mm`);

const groundAbove = new Uint8Array(nx * nz);   // the plane is inside the ground here
const anyBelow = new Uint8Array(nx * nz);      // something exists at or under the plane
const underBuilding = new Uint8Array(nx * nz); // the house stands over this cell
// Rasterise a triangle's plan projection and answer, per cell, which side of
// the plane the surface is on. A vertical face covers no plan area and says
// nothing about the ground, so it is skipped.
function rasterise(node, ground, building = false) {
  for (const [a, b, c] of worldTriangles(node)) {
    const det = (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
    if (Math.abs(det) < 1e-12) continue;
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
      const k = j * nx + i;
      if (building) underBuilding[k] = 1;
      if (y <= CUT) anyBelow[k] = 1;
      else if (ground) groundAbove[k] = 1;
    }
  }
}
for (const id of CLIPPED) {
  const doc = await io.read(`${FULL}/${id}.glb`);
  for (const node of doc.getRoot().listNodes())
    if (node.getMesh()) rasterise(node, id === 'garden' && GROUND.test(node.getName()), id !== 'garden');
  console.log(`  ${id} rasterised`);
}
const contextDoc = await io.read(`${FULL}/context.glb`);
const soilNodes = contextDoc.getRoot().listNodes().filter((n) => n.getMesh() && PLOT_SOIL.test(n.getName()));
if (!soilNodes.length) throw new Error('no plot soil volume in context.glb');
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
const field = new Uint8Array(nx * nz);
let cutCells = 0, voidCells = 0;
for (let k = 0; k < field.length; k++) {
  if (covered[k]) continue;
  if (groundAbove[k]) { field[k] = 1; cutCells++; continue; }
  // A void only counts under the house. That is where the CAD excavated and
  // then built no basement; beyond the building an empty cell is just the edge
  // of the model, and hatching it would lay poché over the neighbours' land.
  if (!anyBelow[k] && underBuilding[k]) { field[k] = 1; voidCells++; }
}
// A single stray cell is the rasteriser's, not the model's: an opening keeps
// every region that is two cells across and drops the rest.
const at = (g, i, j) => (i < 0 || j < 0 || i >= nx || j >= nz) ? 0 : g[j * nx + i];
const eroded = new Uint8Array(nx * nz);
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++)
  eroded[j * nx + i] = (at(field, i, j) && at(field, i - 1, j) && at(field, i + 1, j)
    && at(field, i, j - 1) && at(field, i, j + 1)) ? 1 : 0;
const keep = new Uint8Array(nx * nz);
let cells = 0;
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
  if (!field[j * nx + i]) continue;
  if (eroded[j * nx + i] || at(eroded, i - 1, j) || at(eroded, i + 1, j)
      || at(eroded, i, j - 1) || at(eroded, i, j + 1)) { keep[j * nx + i] = 1; cells++; }
}
if (!cells) throw new Error('the basement plane cuts no ground and leaves no void; nothing to hatch');
console.log(`${cells} cells (${(cells * CELL * CELL).toFixed(1)} m²) of section: ` +
  `${(cutCells * CELL * CELL).toFixed(1)} m² where the plane is in the ground, ` +
  `${(voidCells * CELL * CELL).toFixed(1)} m² of void`);

// merge into rectangles: rows first, then rows of equal span stacked
const rows = [];
for (let j = 0; j < nz; j++) {
  let i = 0;
  while (i < nx) {
    if (!keep[j * nx + i]) { i++; continue; }
    let end = i + 1;
    while (end < nx && keep[j * nx + end]) end++;
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
for (const box of boxes) {
  const ax = x0 + box.i * CELL, bx = x0 + box.end * CELL;
  const az = z0 + box.j * CELL, bz = z0 + box.jEnd * CELL;
  const base = position.length / 3;
  for (const p of [[ax, y, az], [ax, y, bz], [bx, y, bz], [bx, y, az]]) { position.push(...p); normal.push(0, 1, 0); }
  index.push(base, base + 1, base + 2, base, base + 2, base + 3);
}
console.log(`${boxes.length} rectangles, ${index.length / 3} triangles`);

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
    note: 'R42 site section: the plot ground the plane passes through, and the void it leaves' }));

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
  generated_for: 'R42', cut_height_m: CUT, drawn_at_m: y, cell_m: CELL,
  plot_footprint: PLOT,
  cut_cells: cutCells, void_cells: voidCells, kept_cells: cells,
  cut_area_m2: +(cutCells * CELL * CELL).toFixed(3),
  void_area_m2: +(voidCells * CELL * CELL).toFixed(3),
  closed_area_m2: +(cells * CELL * CELL).toFixed(3),
  rectangles: boxes.length, triangles: index.length / 3,
  cap_asset_bytes: raw.length, cap_asset_triangles: triangles,
}, null, 2));
console.log(`section-caps.glb: ${nodes} faces, ${triangles} triangles, ${raw.length} bytes`);
