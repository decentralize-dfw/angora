// R43 | The attic's rooms are white inside and the façade colour outside.
//
// "bu katın duvarları iç duvarlarının hepsi beyaz. dış da ise tüm duvarlar o
// grimsi mavimsi renk. bunu karıştırma hiçbir yerde." In the 360° tour of the
// attic hall the walls around you are the façade's blue-grey: `F3 | KAT
// 3$DUVAR` carries 1,258 triangles of `stucco` (0.323, 0.371, 0.413) against
// 1,001 of `interior` (0.940), and the split is not by which side of the wall
// a face is on - room-side faces are painted the outside colour all through
// the storey.
//
// R40 settled how to tell a wall's two sides apart and R42 reused it for the
// partition core: winding cannot be trusted on the recovered CAD skin, but
// plan position can. A room's polygon in room-spaces.json IS its finished wall
// face, so a face lining a room lies within a few centimetres of that
// polygon's boundary while the face on the far side of the same wall is the
// wall's thickness away. Same test, same tolerance, now applied to the wall
// itself rather than to the core behind it.
//
// Every one of the wall's stucco and interior triangles is re-judged, so the
// mixing is corrected in both directions: a room-side face goes white whatever
// it wore, and an outward face takes the façade colour. The bathroom's ceramic,
// cream tile and mosaic band are left alone - they are finishes, not the two
// sides of a wall.
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
const NODE = 'F3 | KAT 3$DUVAR';
const FLOOR = 3;
const TOL = 0.10;          // m, between the 0.030 lining and the ~0.23 far face
const VERTICAL = 0.5;      // |n.y| above this is a head or a soffit, not a side
// The native model suffixes duplicated material names; the family matcher in
// material-response.js strips the suffix, so match the same way here.
const base = (name) => name.replace(/\.\d{3}$/, '');

const spaces = JSON.parse(readFileSync(FULL + '/room-spaces.json', 'utf8')).spaces;
const edges = [];
for (const space of spaces) {
  if (space.floor_index !== FLOOR) continue;
  for (const ring of [space.boundary_xz, ...(space.holes_xz || [])])
    for (let i = 0; i < ring.length; i++) {
      const [x1, z1] = ring[i], [x2, z2] = ring[(i + 1) % ring.length];
      edges.push([x1, z1, x2, z2]);
    }
}
if (!edges.length) throw new Error('no attic room boundaries to judge against');
function nearRoomBoundary(x, z, tol) {
  const t2 = tol * tol;
  for (const [x1, z1, x2, z2] of edges) {
    if (x < Math.min(x1, x2) - tol || x > Math.max(x1, x2) + tol) continue;
    if (z < Math.min(z1, z2) - tol || z > Math.max(z1, z2) + tol) continue;
    const dx = x2 - x1, dz = z2 - z1, len2 = dx * dx + dz * dz;
    const t = len2 ? Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / len2)) : 0;
    const px = x1 + t * dx - x, pz = z1 + t * dz - z;
    if (px * px + pz * pz <= t2) return true;
  }
  return false;
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(FILE);
const root = doc.getRoot();
const node = root.listNodes().find((n) => n.getName() === NODE && n.getMesh());
if (!node) throw new Error(`${NODE} is not in the delivery`);
const mesh = node.getMesh();
const inside = root.listMaterials().find((m) => base(m.getName()) === 'interior');
const outside = root.listMaterials().find((m) => base(m.getName()) === 'stucco');
if (!inside || !outside) throw new Error('level-3 carries no interior/stucco pair');
console.log(`white is ${inside.getName()} ${inside.getBaseColorFactor().slice(0, 3).map((v) => v.toFixed(3))}, ` +
  `façade is ${outside.getName()} ${outside.getBaseColorFactor().slice(0, 3).map((v) => v.toFixed(3))}`);

const wm = node.getWorldMatrix();
const buckets = { interior: [], stucco: [] };
const untouched = new Map();      // material -> triangles, kept exactly as they are
let heads = 0, wasStucco = 0, wasInterior = 0;
for (const prim of mesh.listPrimitives()) {
  const material = prim.getMaterial();
  const judged = ['interior', 'stucco'].includes(base(material?.getName() ?? ''));
  const P = prim.getAttribute('POSITION').getArray();
  const N = prim.getAttribute('NORMAL')?.getArray();
  const U = prim.getAttribute('TEXCOORD_0')?.getArray();
  const I = prim.getIndices()?.getArray();
  const count = I ? I.length : P.length / 3;
  for (let t = 0; t + 2 < count; t += 3) {
    const ids = I ? [I[t], I[t + 1], I[t + 2]] : [t, t + 1, t + 2];
    const tri = ids.map((i) => ({
      p: [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]],
      n: N ? [N[i * 3], N[i * 3 + 1], N[i * 3 + 2]] : [0, 1, 0],
      u: U ? [U[i * 2], U[i * 2 + 1]] : [0, 0],
    }));
    if (!judged) {
      const key = material.getName();
      (untouched.get(key) ?? untouched.set(key, { material, tris: [] }).get(key)).tris.push(tri);
      continue;
    }
    if (base(material.getName()) === 'stucco') wasStucco++; else wasInterior++;
    const world = tri.map(({ p }) => [wm[0] * p[0] + wm[4] * p[1] + wm[8] * p[2] + wm[12],
                                      wm[1] * p[0] + wm[5] * p[1] + wm[9] * p[2] + wm[13],
                                      wm[2] * p[0] + wm[6] * p[1] + wm[10] * p[2] + wm[14]]);
    const e1 = world[1].map((v, k) => v - world[0][k]);
    const e2 = world[2].map((v, k) => v - world[0][k]);
    const nv = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const len = Math.hypot(...nv);
    // a head or a soffit faces neither a room nor the street in the sense the
    // test asks about, and the roof caps it either way
    if (!len || Math.abs(nv[1] / len) >= VERTICAL) { buckets.interior.push(tri); heads++; continue; }
    const cx = (world[0][0] + world[1][0] + world[2][0]) / 3;
    const cz = (world[0][2] + world[1][2] + world[2][2]) / 3;
    buckets[nearRoomBoundary(cx, cz, TOL) ? 'interior' : 'stucco'].push(tri);
  }
}
console.log(`${wasStucco} façade and ${wasInterior} indoor triangles re-judged -> ` +
  `${buckets.interior.length} indoors (${heads} heads and soffits), ${buckets.stucco.length} on the façade`);
console.log(`${[...untouched.values()].reduce((n, u) => n + u.tris.length, 0)} tiled triangles left alone`);
if (!buckets.stucco.length) throw new Error('no wall face reads as an outside face; the test is wrong');
if (!buckets.interior.length) throw new Error('no wall face reads as a room face; the test is wrong');

const buffer = root.listBuffers()[0] ?? doc.createBuffer();
for (const prim of mesh.listPrimitives()) prim.dispose();
const write = (tris, material) => {
  if (!tris.length) return;
  const position = new Float32Array(tris.length * 9), normal = new Float32Array(tris.length * 9);
  const uv = new Float32Array(tris.length * 6);
  tris.forEach((tri, t) => tri.forEach((v, k) => {
    position.set(v.p, t * 9 + k * 3); normal.set(v.n, t * 9 + k * 3); uv.set(v.u, t * 6 + k * 2);
  }));
  const index = new Uint32Array(tris.length * 3).map((_, i) => i);
  mesh.addPrimitive(doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(position).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(normal).setBuffer(buffer))
    .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(uv).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(index).setBuffer(buffer))
    .setMaterial(material));
};
write(buckets.interior, inside);
write(buckets.stucco, outside);
for (const { material, tris } of untouched.values()) write(tris, material);

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
writeFileSync(ROOT + '/build/attic-wall-faces-r43.json', JSON.stringify({
  generated_for: 'R43', node: NODE, tolerance_m: TOL, vertical: VERTICAL,
  white: inside.getName(), facade: outside.getName(),
  was: { stucco: wasStucco, interior: wasInterior },
  now: { interior: buckets.interior.length, stucco: buckets.stucco.length, heads_and_soffits: heads },
  asset_bytes: raw.length, asset_triangles: triangles,
}, null, 2));
console.log(`level-3.glb: ${triangles} triangles, ${raw.length} bytes`);
