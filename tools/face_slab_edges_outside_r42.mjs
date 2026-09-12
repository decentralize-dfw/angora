// R42 | The slab edges on the façade wear the façade.
//
// R40 put the inside finish inside and the outside finish outside for the
// walls, and left the slabs alone. A floor and a ceiling slab are mostly
// horizontal so that was almost right - but their EDGES are not horizontal,
// and on a balcony or a projecting bay the edge is a band of façade a hand
// deep running the width of the building. Those bands are finished in
// `ceiling`, the indoor cream, and they read as white stripes across a
// blue-grey house: "iç duvarlar beyaz, fakat dış cephe aynı renk olmak zorunda
// hepsi."
//
// The test is R40's, unchanged, because the reasoning is unchanged: winding
// cannot be trusted on the recovered CAD skin, but plan position can. A room's
// polygon IS its finished wall face, so a face that lines a room lies within a
// few centimetres of that polygon's boundary and a face on the outside of the
// same construction is the thickness away. Only near-vertical faces are
// judged; the soffit a room looks up at and the floor it stands on are
// horizontal and keep exactly what they have.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const LEVELS = [['level-0', 0], ['level-1', 1], ['level-2', 2], ['level-3', 3]];
// Slab edges, and the trim band that runs with them. `ek dalgalar` is the
// CAD's own name for the projecting band at each floor line and round the flat
// roofs; it is white_trim everywhere, which is right for a window frame and
// wrong for a hand-deep band of façade.
const SLAB = /KAT \d\$(TAVAN|ZEMİN)$|ek dalgalar$/;
const INDOORS = new Set(['ceiling', 'interior', 'white_trim']);
const TOL = 0.10;
const VERTICAL = 0.5;

const spaces = JSON.parse(readFileSync(FULL + '/room-spaces.json', 'utf8')).spaces;
const edges = new Map();
for (const space of spaces) {
  if (!edges.has(space.floor_index)) edges.set(space.floor_index, []);
  const list = edges.get(space.floor_index);
  for (const ring of [space.boundary_xz, ...(space.holes_xz || [])])
    for (let i = 0; i < ring.length; i++) {
      const [x1, z1] = ring[i], [x2, z2] = ring[(i + 1) % ring.length];
      list.push([x1, z1, x2, z2]);
    }
}
function nearRoomBoundary(floor, x, z, tol) {
  const t2 = tol * tol;
  for (const [x1, z1, x2, z2] of edges.get(floor) || []) {
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
const report = [];
for (const [level, floor] of LEVELS) {
  const file = `${FULL}/${level}.glb`;
  const doc = await io.read(file);
  const root = doc.getRoot();
  const outside = root.listMaterials().find((m) => m.getName() === 'stucco');
  if (!outside) { console.log(`${level}: no stucco`); continue; }
  let moved = 0, kept = 0, flat = 0;
  for (const node of root.listNodes()) {
    if (!SLAB.test(node.getName())) continue;
    const mesh = node.getMesh(); if (!mesh) continue;
    const wm = node.getWorldMatrix();
    const facade = [];
    for (const prim of mesh.listPrimitives()) {
      const name = prim.getMaterial()?.getName();
      if (!INDOORS.has(name)) continue;
      const P = prim.getAttribute('POSITION').getArray();
      const N = prim.getAttribute('NORMAL')?.getArray();
      const U = prim.getAttribute('TEXCOORD_0')?.getArray();
      const I = prim.getIndices()?.getArray();
      const count = I ? I.length : P.length / 3;
      const stay = [];
      for (let t = 0; t + 2 < count; t += 3) {
        const ids = I ? [I[t], I[t + 1], I[t + 2]] : [t, t + 1, t + 2];
        const tri = ids.map((i) => ({
          p: [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]],
          n: N ? [N[i * 3], N[i * 3 + 1], N[i * 3 + 2]] : [0, 1, 0],
          u: U ? [U[i * 2], U[i * 2 + 1]] : [0, 0],
        }));
        const world = tri.map(({ p }) => [wm[0]*p[0]+wm[4]*p[1]+wm[8]*p[2]+wm[12],
                                          wm[1]*p[0]+wm[5]*p[1]+wm[9]*p[2]+wm[13],
                                          wm[2]*p[0]+wm[6]*p[1]+wm[10]*p[2]+wm[14]]);
        const e1 = world[1].map((v, k) => v - world[0][k]);
        const e2 = world[2].map((v, k) => v - world[0][k]);
        const nv = [e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]];
        const len = Math.hypot(...nv);
        if (!len || Math.abs(nv[1] / len) >= VERTICAL) { stay.push(tri); flat++; continue; }
        const cx = (world[0][0]+world[1][0]+world[2][0])/3, cz = (world[0][2]+world[1][2]+world[2][2])/3;
        if (nearRoomBoundary(floor, cx, cz, TOL)) { stay.push(tri); kept++; }
        else { facade.push(tri); moved++; }
      }
      // A primitive emptied of every triangle is not an empty primitive, it is
      // no primitive: a zero-length accessor is what the Draco encoder chokes on.
      if (!stay.length) { prim.dispose(); continue; }
      const position = new Float32Array(stay.length * 9), normal = new Float32Array(stay.length * 9);
      const texcoord = new Float32Array(stay.length * 6);
      stay.forEach((tri, t) => tri.forEach((v, k) => {
        position.set(v.p, t * 9 + k * 3); normal.set(v.n, t * 9 + k * 3); texcoord.set(v.u, t * 6 + k * 2);
      }));
      const buffer = root.listBuffers()[0];
      prim.setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(position).setBuffer(buffer));
      prim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(normal).setBuffer(buffer));
      if (U) prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(texcoord).setBuffer(buffer));
      prim.setIndices(null);
    }
    if (!facade.length) continue;
    const position = new Float32Array(facade.length * 9), normal = new Float32Array(facade.length * 9);
    const texcoord = new Float32Array(facade.length * 6);
    facade.forEach((tri, t) => tri.forEach((v, k) => {
      position.set(v.p, t * 9 + k * 3); normal.set(v.n, t * 9 + k * 3); texcoord.set(v.u, t * 6 + k * 2);
    }));
    const buffer = root.listBuffers()[0];
    mesh.addPrimitive(doc.createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(position).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(normal).setBuffer(buffer))
      .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(texcoord).setBuffer(buffer))
      .setMaterial(outside));
  }
  report.push({ level, moved_to_facade: moved, kept_indoors: kept, horizontal: flat });
  console.log(`${level}: ${moved} slab-edge triangles to the façade, ${kept} kept indoors, ${flat} horizontal`);
  if (!moved) continue;

  await doc.transform(prune());
  for (const ext of root.listExtensionsUsed())
    if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
  const plain = `${file}.plain.glb`;
  writeFileSync(plain, await io.writeBinary(doc));
  execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, file,
    '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
  unlinkSync(plain);
  const manifest = JSON.parse(readFileSync(FULL + '/manifest.json', 'utf8'));
  const asset = manifest.assets.find((a) => a.id === level);
  const raw = readFileSync(file);
  asset.bytes = raw.length;
  asset.sha256 = createHash('sha256').update(raw).digest('hex');
  writeFileSync(FULL + '/manifest.json', JSON.stringify(manifest, null, 2));
}
writeFileSync(ROOT + '/build/slab-edge-finish-r42.json', JSON.stringify({
  generated_for: 'R42', tolerance_m: TOL, vertical_threshold: VERTICAL, levels: report,
}, null, 2));
