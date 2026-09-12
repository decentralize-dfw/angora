// R41 | Clean the attic shell and put its finishes on the right side.
//
// Two faults, one mesh family. The attic roof came out of the CAD recovery as
// 11 986 triangles for what is two surfaces of about 192 m2 each: 1 070 of
// them are degenerate or smaller than a square centimetre, and a shell whose
// median triangle is 7 cm2 shades as noise and z-fights with itself. That is
// the "saçma sapan polygonlar" in the left and right attic rooms.
//
// And the finishes are on the wrong faces. Standing in the attic you see the
// blue-grey exterior render (`stucco`) on the inside of the walls and, along
// the eaves, the terracotta roof tile (`roof`) overhead instead of the
// painted soffit - the photographs show plain off-white plaster on every
// slope and wall up there.
//
// So: drop what has no area, and give every remaining triangle the finish that
// belongs to the side it faces.
//
// Which side that is cannot be read off the triangle's normal. The recovered
// skin winds inconsistently - that is why the section caps are built from
// opposite source faces rather than from winding - and a first cut of this
// tool, which trusted the normal, moved 713 faces and left 21.8 m2 of render
// still looking into the attic's rooms. Nor can it be read off the wall
// section by flood fill: the attic's envelope is the roof, so the section
// never closes.
//
// It is read off the material instead, which no winding can flip. A face is
// seen from whichever side has no wall behind it: probe 30 mm out on both
// sides against the atlas's own wall contour at that height, and the side that
// comes back empty is the side you stand on to look at it. Then the finish
// follows from whether that side is over the attic floor slab - indoors gets
// plaster, outdoors gets render - and a face with wall on both sides or on
// neither is left exactly as authored.
//
// The roof reads the same way, vertically: fire a ray up and down from each
// triangle, and the surface with roof over it is the soffit while the one with
// roof under it is the tile. The exposed timber - the fascia and the eaves
// boards - is not touched at all.
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
const SHELL = /^F3 \| (ÇATII|ÇATI ALIN|KAT 3\$DUVAR( KAPLAMA)?)$/;
const FLOOR = /^F3 \| KAT 3\$ZEMİN( KAPLAMA)?$/;
// finishes this tool may move a face between; anything else - the bathroom
// tile, the mosaic band, the exposed timber - is left exactly as authored
const INSIDE_WALL = 'interior', OUTSIDE_WALL = 'stucco';
const SOFFIT = 'ceiling', TILE = 'roof';
const MOVABLE = new Set([INSIDE_WALL, OUTSIDE_WALL, SOFFIT, TILE]);
const MIN_AREA = 1e-6;          // below this a triangle has no surface at all
const PROBE = 0.030;            // how far out of a face the material test stands
const ROOM = 0.120;             // and how far out the indoors test stands
const CELL = 0.05;
const ROOF_THICKNESS = 0.80;    // no further than this is the roof's other face

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
    const normalAttr = prim.getAttribute('NORMAL')?.getArray();
    const uvAttr = prim.getAttribute('TEXCOORD_0')?.getArray();
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
      out.push({
        material: prim.getMaterial()?.getName() ?? null,
        p: ids.map(point),
        uv: uvAttr ? ids.map((i) => [uvAttr[i * 2], uvAttr[i * 2 + 1]]) : null,
        hadNormal: !!normalAttr,
      });
    }
  }
  return out;
}

// ------------------------------------------------------- the attic footprint
const slabTriangles = [];
for (const node of root.listNodes())
  if (FLOOR.test(node.getName()) && node.getMesh()) slabTriangles.push(...worldTriangles(node));
if (!slabTriangles.length) throw new Error('no attic floor slab to read the footprint from');
let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
for (const tri of slabTriangles) for (const [x, , z] of tri.p) {
  x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
}
x0 -= 0.5; z0 -= 0.5; x1 += 0.5; z1 += 0.5;
const nx = Math.ceil((x1 - x0) / CELL), nz = Math.ceil((z1 - z0) / CELL);
const slab = new Uint8Array(nx * nz);
for (const tri of slabTriangles) {
  const [a, b, c] = tri.p;
  const lo = [Math.min(a[0], b[0], c[0]), Math.min(a[2], b[2], c[2])];
  const hi = [Math.max(a[0], b[0], c[0]), Math.max(a[2], b[2], c[2])];
  const i0 = Math.max(0, Math.floor((lo[0] - x0) / CELL)), i1 = Math.min(nx - 1, Math.ceil((hi[0] - x0) / CELL));
  const j0 = Math.max(0, Math.floor((lo[1] - z0) / CELL)), j1 = Math.min(nz - 1, Math.ceil((hi[1] - z0) / CELL));
  const det = (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
  if (Math.abs(det) < 1e-12) continue;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const px = x0 + (i + 0.5) * CELL, pz = z0 + (j + 0.5) * CELL;
    const u = ((b[0] - a[0]) * (pz - a[2]) - (b[2] - a[2]) * (px - a[0])) / det;
    const v = ((c[0] - b[0]) * (pz - b[2]) - (c[2] - b[2]) * (px - b[0])) / det;
    if (u >= 0 && v >= 0 && 1 - u - v >= 0) slab[j * nx + i] = 1;
  }
}
// The slab is used as it is. An earlier cut eroded it 0.15 m first, on the
// theory that an outer wall's outer face would then fall off it - but the slab
// stops at the inner face of those walls, so eroding it threw the rooms' own
// faces off the footprint too and turned most of the attic's inside surfaces
// into render.
const indoors = (x, z) => {
  const i = Math.floor((x - x0) / CELL), j = Math.floor((z - z0) / CELL);
  return i >= 0 && i < nx && j >= 0 && j < nz ? slab[j * nx + i] === 1 : false;
};
console.log(`attic floor footprint: ${(slab.reduce((n, v) => n + v, 0) * CELL * CELL).toFixed(1)} m2`);

// ------------------------------------------------- where the walls actually are
// The section atlas already carries the building's wall cross-section every
// 8 cm. Rasterised on the same grid it answers, for any point, whether there
// is wall there - which is what tells a face's outside from its inside without
// ever consulting a normal.
const atlas = JSON.parse(readFileSync(FULL + '/sections.json', 'utf8'));
const sliceHeights = atlas.slices.map((s) => s.height);
const wallCache = new Map();
function wallMask(index) {
  if (wallCache.has(index)) return wallCache.get(index);
  const mask = new Uint8Array(nx * nz);
  const slice = atlas.slices[index];
  const p = slice.p, idx = slice.i;
  if (p?.length && idx?.length) {
    for (let t = 0; t < idx.length; t += 3) {
      const a = [p[idx[t] * 2], p[idx[t] * 2 + 1]];
      const b = [p[idx[t + 1] * 2], p[idx[t + 1] * 2 + 1]];
      const c = [p[idx[t + 2] * 2], p[idx[t + 2] * 2 + 1]];
      const i0 = Math.max(0, Math.floor((Math.min(a[0], b[0], c[0]) - x0) / CELL));
      const i1 = Math.min(nx - 1, Math.ceil((Math.max(a[0], b[0], c[0]) - x0) / CELL));
      const j0 = Math.max(0, Math.floor((Math.min(a[1], b[1], c[1]) - z0) / CELL));
      const j1 = Math.min(nz - 1, Math.ceil((Math.max(a[1], b[1], c[1]) - z0) / CELL));
      const det = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      if (Math.abs(det) < 1e-12) continue;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const px = x0 + (i + 0.5) * CELL, pz = z0 + (j + 0.5) * CELL;
        const u = ((b[0] - a[0]) * (pz - a[1]) - (b[1] - a[1]) * (px - a[0])) / det;
        const v = ((c[0] - b[0]) * (pz - b[1]) - (c[1] - b[1]) * (px - b[0])) / det;
        if (u >= 0 && v >= 0 && 1 - u - v >= 0) mask[j * nx + i] = 1;
      }
    }
  }
  wallCache.set(index, mask);
  return mask;
}
function wallAt(x, y, z) {
  let best = 0;
  for (let i = 1; i < sliceHeights.length; i++)
    if (Math.abs(sliceHeights[i] - y) < Math.abs(sliceHeights[best] - y)) best = i;
  const mask = wallMask(best);
  const i = Math.floor((x - x0) / CELL), j = Math.floor((z - z0) / CELL);
  return i >= 0 && i < nx && j >= 0 && j < nz ? mask[j * nx + i] === 1 : false;
}

// ------------------------------------------------ and where the roof's other face is
const roofTriangles = [];
for (const node of root.listNodes())
  if (node.getName() === 'F3 | ÇATII' && node.getMesh()) roofTriangles.push(...worldTriangles(node));
const ROOF_CELL = 0.30;
const roofBuckets = new Map();
const bucketKey = (x, z) => `${Math.floor(x / ROOF_CELL)},${Math.floor(z / ROOF_CELL)}`;
for (const tri of roofTriangles) {
  const lo = [Math.min(...tri.p.map((q) => q[0])), Math.min(...tri.p.map((q) => q[2]))];
  const hi = [Math.max(...tri.p.map((q) => q[0])), Math.max(...tri.p.map((q) => q[2]))];
  for (let i = Math.floor(lo[0] / ROOF_CELL); i <= Math.floor(hi[0] / ROOF_CELL); i++)
    for (let j = Math.floor(lo[1] / ROOF_CELL); j <= Math.floor(hi[1] / ROOF_CELL); j++) {
      const key = `${i},${j}`;
      if (!roofBuckets.has(key)) roofBuckets.set(key, []);
      roofBuckets.get(key).push(tri);
    }
}
// is there roof above (sign +1) or below (sign -1) this point, within a roof's
// thickness of it?
function roofBeyond(point, sign) {
  for (const tri of roofBuckets.get(bucketKey(point[0], point[2])) ?? []) {
    const [a, b, c] = tri.p;
    const det = (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
    if (Math.abs(det) < 1e-12) continue;
    const u = ((b[0] - a[0]) * (point[2] - a[2]) - (b[2] - a[2]) * (point[0] - a[0])) / det;
    const v = ((c[0] - b[0]) * (point[2] - b[2]) - (c[2] - b[2]) * (point[0] - b[0])) / det;
    if (u < 0 || v < 0 || 1 - u - v < 0) continue;
    // u weights c, v weights a and the remainder weights b - the order the
    // two cross products above were taken in, and getting it wrong put the
    // interpolated height on the wrong vertex and made this test miss.
    const y = v * a[1] + (1 - u - v) * b[1] + u * c[1];
    const gap = (y - point[1]) * sign;
    if (gap > 0.015 && gap < ROOF_THICKNESS) return true;
  }
  return false;
}

// ----------------------------------------------------------------- the shell
const materials = new Map(root.listMaterials().map((m) => [m.getName(), m]));
for (const name of [INSIDE_WALL, OUTSIDE_WALL, SOFFIT, TILE])
  if (!materials.has(name)) throw new Error('missing finish: ' + name);

const report = { generated_for: 'R41', meshes: {} };
for (const node of root.listNodes()) {
  if (!SHELL.test(node.getName()) || !node.getMesh()) continue;
  const name = node.getName();
  const triangles = worldTriangles(node);
  const kept = new Map();      // material name -> triangles
  let dropped = 0, moved = 0;
  for (const tri of triangles) {
    const [a, b, c] = tri.p;
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cross = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const length = Math.hypot(...cross);
    if (length / 2 < MIN_AREA) { dropped++; continue; }
    const normal = cross.map((k) => k / length);
    let material = tri.material;
    if (MOVABLE.has(material)) {
      const centroid = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
      const roofFamily = name === 'F3 | ÇATII';
      if (roofFamily && Math.abs(normal[1]) >= 0.15) {
        // A roof surface with roof above it is the soffit you stand under;
        // one with roof below it is the tile. Only if neither answers - a
        // free edge - does the slope's own direction get a say.
        const above = roofBeyond(centroid, 1), below = roofBeyond(centroid, -1);
        if (above && !below) material = SOFFIT;
        else if (below && !above) material = TILE;
        else material = normal[1] >= 0 ? TILE : SOFFIT;
      } else {
        // the side with no wall behind it is the side this face is seen from
        const side = [1, -1].filter((sign) => !wallAt(
          centroid[0] + normal[0] * PROBE * sign, centroid[1], centroid[2] + normal[2] * PROBE * sign));
        if (side.length === 1) {
          const sign = side[0];
          const room = indoors(centroid[0] + normal[0] * ROOM * sign, centroid[2] + normal[2] * ROOM * sign);
          material = room ? (roofFamily ? SOFFIT : INSIDE_WALL) : (roofFamily ? TILE : OUTSIDE_WALL);
        }
        // wall on both sides, or on neither: leave it as authored
      }
      if (material !== tri.material) moved++;
    }
    if (!kept.has(material)) kept.set(material, []);
    kept.get(material).push({ p: tri.p, uv: tri.uv, normal });
  }

  // Rebuild the mesh, one primitive per finish, flat-shaded. The shell is
  // planar slopes and flat walls: a flat normal is what it actually has, and
  // it is what stops the slivers reading as torn shading.
  const mesh = node.getMesh();
  for (const prim of mesh.listPrimitives()) mesh.removePrimitive(prim);
  const buffer = root.listBuffers()[0] ?? doc.createBuffer();
  const inverse = invert(node.getWorldMatrix());
  let total = 0;
  for (const [material, list] of kept) {
    const position = new Float32Array(list.length * 9);
    const normal = new Float32Array(list.length * 9);
    const uv = list[0].uv ? new Float32Array(list.length * 6) : null;
    list.forEach((tri, t) => {
      tri.p.forEach((point, k) => {
        const local = apply(inverse, point);
        position.set(local, t * 9 + k * 3);
        normal.set(tri.normal, t * 9 + k * 3);
        if (uv && tri.uv) uv.set(tri.uv[k], t * 6 + k * 2);
      });
    });
    const prim = doc.createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(position).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(normal).setBuffer(buffer))
      .setMaterial(materials.get(material) ?? null);
    if (uv) prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(uv).setBuffer(buffer));
    mesh.addPrimitive(prim);
    total += list.length;
  }
  report.meshes[name] = {
    before: triangles.length, after: total, dropped, refinished: moved,
    finishes: Object.fromEntries([...kept].map(([m, l]) => [m, l.length])),
  };
  console.log(`${name}: ${triangles.length} -> ${total} triangles, ${dropped} with no area dropped, ` +
    `${moved} refinished  [${[...kept].map(([m, l]) => `${m} ${l.length}`).join(', ')}]`);
}

function invert(m) {
  // rigid-with-scale inverse is enough here; these nodes carry no shear
  const out = new Array(16).fill(0);
  const a = [[m[0], m[4], m[8]], [m[1], m[5], m[9]], [m[2], m[6], m[10]]];
  const det = a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1])
            - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0])
            + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
  if (Math.abs(det) < 1e-12) throw new Error('singular node transform');
  const inv = [[], [], []];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const s = [[0, 1, 2].filter((k) => k !== j), [0, 1, 2].filter((k) => k !== i)];
    const minor = a[s[0][0]][s[1][0]] * a[s[0][1]][s[1][1]] - a[s[0][1]][s[1][0]] * a[s[0][0]][s[1][1]];
    inv[i][j] = ((i + j) % 2 ? -minor : minor) / det;
  }
  const t = [m[12], m[13], m[14]];
  for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) out[c * 4 + r] = inv[r][c];
  for (let r = 0; r < 3; r++) out[12 + r] = -(inv[r][0] * t[0] + inv[r][1] * t[1] + inv[r][2] * t[2]);
  out[15] = 1;
  return out;
}
function apply(m, p) {
  return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
          m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
          m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
}

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
writeFileSync(ROOT + '/build/attic-shell-r41.json', JSON.stringify(report, null, 2));
console.log('level-3.glb re-encoded:', asset.bytes, 'bytes');
