// R44 | The excavated void beside the basement reads as ground, not as a pit.
//
// "bodrum katında boş kısım var ya, orasını taramalısın. boş gözükmemeli
// öyle. orda o kolonları da gösterme."
//
// The CAD excavated the whole footprint and built a basement under half of
// it. At the 1.6 m cut the modelled earth is drawn by its authored face and
// the house by the wall atlas, but between them lies the strip the excavation
// left: no earth to cut, no room to draw, just the entrance wing's buried
// stub walls and columns standing in a hole. R42 once answered this with a
// full-site field - the whole plot inked at one height - and that reading was
// rejected; this one is narrower and is the review's own: only the enclosed
// void is closed, as solid hatched ground, and the ground that actually lies
// below the plane (the pool terrace, the lawns) stays green.
//
// The void is found, not assumed: plot cells that carry the entrance wing's
// own floor overhead - the excavation exists exactly because the wing above
// it does - and no basement room, no cut-earth face, no garden fabric near
// the plane and no modelled earth standing through it. An enclosure test was
// tried first and failed honestly: the void opens onto the west side passage
// through a rough doorway, so "unreachable from outside" finds 0.9 m² of it.
// "Under the wing" finds the thing itself.
//
// The fill is drawn 2 mm ABOVE the plane where R42 drew 4 mm below, and that
// difference is the columns: the buried stubs are cut open at exactly 1.6 m
// and their poché is drawn there too, so a face under the plane leaves every
// one of them printed on the "ground". Over the plane, the ground wins and
// the columns are simply under it. The one-cell seal the fill grows toward
// its neighbours stays at 0.5 mm UNDER the plane, so a real room wall it
// laps onto keeps its own black cross-section on top.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const CAPS = FULL + '/section-caps.glb';
const HATCH = 'R32 | soil section hatch';
const NODE = 'R44 F0 excavation fill';
const REJECTED = 'R42 F0 site section field';
const CUT = 1.6;
const OVER = 0.002;                 // the fill covers the buried stubs' own cut
const SEAL_UNDER = 0.0005;          // but a real wall's poché stays on top of the seal
const CELL = 0.10;
const LEVELS = ['level-0', 'level-1', 'level-2', 'level-3', 'envelope'];
const PLOT_SOIL = /^R32 \| Continuous local soil volume/;
const BOUNDARY = {
  west: /^West CAD retaining wall\b/,
  east: /^East elevated neighbor retaining wall\b/,
  front: /^R33 \| Front fence spear\b/,
};

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

// ------------------------------------------------------ where the property is
const gardenDoc = await io.read(`${FULL}/garden.glb`);
const boundary = { west: -Infinity, east: Infinity, front: Infinity };
const gardenTriangles = [];
for (const node of gardenDoc.getRoot().listNodes()) {
  if (!node.getMesh()) continue;
  const authoredName = node.getName().replace(/\.\d+$/, '');
  const tris = worldTriangles(node);
  for (const tri of tris) gardenTriangles.push(tri);
  if (BOUNDARY.west.test(authoredName)) for (const tri of tris) for (const [x] of tri) boundary.west = Math.max(boundary.west, x);
  if (BOUNDARY.east.test(authoredName)) for (const tri of tris) for (const [x] of tri) boundary.east = Math.min(boundary.east, x);
  if (BOUNDARY.front.test(authoredName)) for (const tri of tris) for (const [, , z] of tri) boundary.front = Math.min(boundary.front, z);
}
if (![boundary.west, boundary.east, boundary.front].every(Number.isFinite))
  throw new Error('the site marks no property line');
const PROPERTY = { x: [boundary.west - 0.45, boundary.east + 0.45], z: boundary.front + 0.15 };

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
const at = (g, i, j) => (i < 0 || j < 0 || i >= nx || j >= nz) ? 0 : g[j * nx + i];

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
      let y = Math.max(a[1], b[1], c[1]), horizontal = false;
      if (!slim) {
        const u = ((b[0] - a[0]) * (pz - a[2]) - (b[2] - a[2]) * (px - a[0])) / det;
        const v = ((c[0] - b[0]) * (pz - b[2]) - (c[2] - b[2]) * (px - b[0])) / det;
        if (u < -0.02 || v < -0.02 || 1 - u - v < -0.02) continue;
        y = v * a[1] + (1 - u - v) * b[1] + u * c[1];
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
        const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        const nxc = uy * vz - uz * vy, nyc = uz * vx - ux * vz, nzc = ux * vy - uy * vx;
        horizontal = Math.abs(nyc) > 0.7 * Math.hypot(nxc, nyc, nzc);
      }
      visit(j * nx + i, y, horizontal);
    }
  }
}

const plot = new Uint8Array(nx * nz);
const ground = new Float32Array(nx * nz).fill(-Infinity);
rasterise(soilTriangles, (k, y) => {
  const i = k % nx, px = x0 + (i + 0.5) * CELL, pz = z0 + ((k - i) / nx + 0.5) * CELL;
  if (px < PROPERTY.x[0] || px > PROPERTY.x[1] || pz > PROPERTY.z) return;
  plot[k] = 1; if (y > ground[k]) ground[k] = y;
});
// close the punched holes so the extent is the property, as R42 established
{
  const outside = new Uint8Array(nx * nz), stack = [];
  for (let i = 0; i < nx; i++) stack.push(i, (nz - 1) * nx + i);
  for (let j = 0; j < nz; j++) stack.push(j * nx, j * nx + nx - 1);
  while (stack.length) {
    const k = stack.pop();
    if (plot[k] || outside[k]) continue;
    outside[k] = 1;
    const i = k % nx, j = (k - i) / nx;
    if (i > 0) stack.push(k - 1); if (i < nx - 1) stack.push(k + 1);
    if (j > 0) stack.push(k - nx); if (j < nz - 1) stack.push(k + nx);
  }
  for (let k = 0; k < plot.length; k++) if (!plot[k] && !outside[k]) plot[k] = 1;
}
let plotCells = 0; for (const v of plot) plotCells += v;
console.log(`plot ${(plotCells * CELL * CELL).toFixed(1)} m², x ${PROPERTY.x.map(v=>v.toFixed(2)).join('..')}, front z ${PROPERTY.z.toFixed(2)}`);

// ------------------------------------------- what the house occupies down here
// Room floors: horizontal storey fabric near the basement datum, in patches
// big enough to be a floor rather than a buried column's own cap.
const floorHits = new Uint8Array(nx * nz);
const wallHits = new Uint8Array(nx * nz);   // anything standing through the view band
const overhead = new Uint8Array(nx * nz);   // the entrance wing's floor, 2.7 m up
for (const id of LEVELS) {
  const doc = await io.read(`${FULL}/${id}.glb`);
  for (const node of doc.getRoot().listNodes()) {
    if (!node.getMesh()) continue;
    rasterise(worldTriangles(node), (k, y, horizontal) => {
      if (horizontal && y > -0.5 && y < 0.45) floorHits[k] = 1;
      if (y > 0.2 && y <= CUT + 0.05) wallHits[k] = 1;
      if (horizontal && y > 2.0 && y < 4.5) overhead[k] = 1;
    });
  }
  console.log(`  ${id} rasterised`);
}
// keep floor patches >= 1.5 m²; a stub column's bottom cap is far smaller
const room = new Uint8Array(nx * nz);
{
  const seen = new Uint8Array(nx * nz);
  for (let s = 0; s < floorHits.length; s++) {
    if (!floorHits[s] || seen[s]) continue;
    const component = [s]; seen[s] = 1;
    for (let head = 0; head < component.length; head++) {
      const k = component[head], i = k % nx, j = (k - i) / nx;
      for (const [di, dj] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const ii = i + di, jj = j + dj;
        if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
        const kk = jj * nx + ii;
        if (floorHits[kk] && !seen[kk]) { seen[kk] = 1; component.push(kk); }
      }
    }
    if (component.length * CELL * CELL >= 1.5) for (const k of component) room[k] = 1;
  }
  // two cells of wall thickness around every floor stays the house's own
  const grown = Uint8Array.from(room);
  for (let pass = 0; pass < 2; pass++) {
    const source = Uint8Array.from(grown);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      if (source[j * nx + i]) continue;
      if (at(source, i-1, j) || at(source, i+1, j) || at(source, i, j-1) || at(source, i, j+1)) grown[j * nx + i] = 1;
    }
  }
  room.set(grown);
}

// garden fabric that actually lives at this level - pool shell, lower stairs -
// keeps its cells open; the entrance approach 1.5 m overhead does not.
const gardenNear = new Uint8Array(nx * nz);
rasterise(gardenTriangles, (k, y) => { if (y < CUT + 0.3) gardenNear[k] = 1; });

// ------------------------------------------ what the authored face already draws
const capsDoc = await io.read(CAPS);
const capsRoot = capsDoc.getRoot();
const covered = new Uint8Array(nx * nz);
for (const node of capsRoot.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  if ([NODE, REJECTED].includes(node.getName())) continue;
  if (!mesh.listPrimitives().some((p) => p.getMaterial()?.getName() === HATCH)) continue;
  rasterise(worldTriangles(node), (k) => { covered[k] = 1; });
}

// ------------------------------------------------------------------- the fill
const fill = new Uint8Array(nx * nz);
let cells = 0;
for (let k = 0; k < fill.length; k++) {
  if (!plot[k] || !overhead[k] || room[k] || covered[k] || gardenNear[k]) continue;
  if (ground[k] >= CUT) continue;          // cut earth is the authored face's job
  fill[k] = 1; cells++;
}
if (!cells) throw new Error('no enclosed void to fill');
// one-cell seal toward the fabric the fill is cut against
const seal = new Uint8Array(nx * nz);
let sealCells = 0;
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
  const k = j * nx + i;
  if (fill[k] || !plot[k] || !(covered[k] || wallHits[k] || room[k])) continue;
  if (at(fill, i-1, j) || at(fill, i+1, j) || at(fill, i, j-1) || at(fill, i, j+1)) { seal[k] = 1; sealCells++; }
}
console.log(`${(cells * CELL * CELL).toFixed(1)} m² of enclosed void filled, ` +
  `${(sealCells * CELL * CELL).toFixed(1)} m² of seal onto its enclosure`);

// ------------------------------------------------- merge the faces into panels
function panels(mask) {
  const rows = [];
  for (let j = 0; j < nz; j++) {
    let i = 0;
    while (i < nx) {
      if (!mask[j * nx + i]) { i++; continue; }
      let end = i + 1;
      while (end < nx && mask[j * nx + end]) end++;
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
  return boxes;
}
const position = [], normal = [], index = [];
const quad = (a, b, c, d, n) => {
  const base = position.length / 3;
  for (const p of [a, b, c, d]) { position.push(...p); normal.push(...n); }
  index.push(base, base + 1, base + 2, base, base + 2, base + 3);
};
const face = (mask, y) => {
  const boxes = panels(mask);
  for (const box of boxes) {
    const ax = x0 + box.i * CELL, bx = x0 + box.end * CELL;
    const az = z0 + box.j * CELL, bz = z0 + box.jEnd * CELL;
    quad([ax, y, az], [ax, y, bz], [bx, y, bz], [bx, y, az], [0, 1, 0]);
  }
  return boxes.length;
};
const fillPanels = face(fill, CUT + OVER);
const sealPanels = face(seal, CUT - SEAL_UNDER);
// skirts where the fill still meets open air (it should barely ever)
let skirts = 0;
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
  if (!fill[j * nx + i]) continue;
  const ax = x0 + i * CELL, bx = ax + CELL, az = z0 + j * CELL, bz = az + CELL;
  const y = CUT + OVER, y1 = CUT - 1.5;
  const openEdge = (ii, jj) => !at(fill, ii, jj) && !at(seal, ii, jj) &&
    !at(covered, ii, jj) && !at(wallHits, ii, jj) && !at(room, ii, jj);
  if (openEdge(i - 1, j)) { quad([ax, y, az], [ax, y1, az], [ax, y1, bz], [ax, y, bz], [-1, 0, 0]); skirts++; }
  if (openEdge(i + 1, j)) { quad([bx, y, bz], [bx, y1, bz], [bx, y1, az], [bx, y, az], [1, 0, 0]); skirts++; }
  if (openEdge(i, j - 1)) { quad([bx, y, az], [bx, y1, az], [ax, y1, az], [ax, y, az], [0, 0, -1]); skirts++; }
  if (openEdge(i, j + 1)) { quad([ax, y, bz], [ax, y1, bz], [bx, y1, bz], [bx, y, bz], [0, 0, 1]); skirts++; }
}
console.log(`${fillPanels} fill panels, ${sealPanels} seal panels, ${skirts} skirt faces`);

// ------------------------------------------------------------- write the cap
for (const name of [NODE, REJECTED]) {
  for (const node of capsRoot.listNodes()) {
    if (node.getName() !== name) continue;
    const mesh = node.getMesh(); node.dispose(); mesh?.dispose();
  }
}
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
    note: 'R44: the enclosed excavation reads as solid hatched ground; its buried stubs lie under it' }));

await capsDoc.transform(prune());
writeFileSync(CAPS, await io.writeBinary(capsDoc));

// ------------------------------------------------- manifest and the QA record
const manifest = JSON.parse(readFileSync(FULL + '/manifest.json', 'utf8'));
const raw = readFileSync(CAPS);
let triangles = 0, nodes = 0;
const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
for (const node of (await io.read(CAPS)).getRoot().listNodes()) {
  const mesh = node.getMesh(); if (!mesh) continue;
  nodes++;
  for (const p of mesh.listPrimitives())
    triangles += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
  for (const tri of worldTriangles(node)) for (const [px, py, pz] of tri) {
    const native = [px, -pz, py];
    for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], native[a]); hi[a] = Math.max(hi[a], native[a]); }
  }
}
manifest.section_cap_asset = { ...manifest.section_cap_asset, bytes: raw.length,
  sha256: createHash('sha256').update(raw).digest('hex'),
  exported_mesh_nodes: nodes, shared_meshes: nodes, triangles, bounds_native_m: [lo, hi] };
writeFileSync(FULL + '/manifest.json', JSON.stringify(manifest, null, 2));
const mirror = ROOT + '/viewer/public/models/full/section-caps.glb';
if (existsSync(mirror)) writeFileSync(mirror, raw);
writeFileSync(ROOT + '/build/basement-void-fill-r44.json', JSON.stringify({
  generated_for: 'R44', cut_height_m: CUT, drawn_at_m: +(CUT + OVER).toFixed(4),
  seal_drawn_at_m: +(CUT - SEAL_UNDER).toFixed(4), cell_m: CELL,
  fill_area_m2: +(cells * CELL * CELL).toFixed(2), seal_area_m2: +(sealCells * CELL * CELL).toFixed(2),
  fill_panels: fillPanels, seal_panels: sealPanels, skirt_faces: skirts,
  rejected_full_site_field_removed: true,
  property: { x: PROPERTY.x, front_z: PROPERTY.z },
  cap_asset_bytes: raw.length, cap_asset_triangles: triangles,
}, null, 2));
console.log(`section-caps.glb: ${nodes} faces, ${triangles} triangles, ${raw.length} bytes`);
