// R42 | The attic core wears the façade where it faces the street.
//
// "de bu cephe işaretli yerler neden beyaz??? iç duvarlar beyaz, fakat dış
// cephe aynı renk olmak zorunda hepsi." The white patches marked at the
// attic-to-roof junction are the partition core I put in at R41. It exists to
// back a lining that in places has only one skin, so wherever the outer skin
// is the missing one the core itself is the outside face - and it was finished
// in `interior`, the indoor cream, on every face.
//
// R40 settled how to tell a wall's two sides apart and its reasoning holds
// here: winding cannot be trusted on the recovered CAD skin, but plan position
// can. A room's polygon in room-spaces.json IS its finished wall face, so a
// face that lines a room lies within a few centimetres of that polygon's
// boundary while a face on the far side of the same wall is the wall thickness
// away. The core's faces sit on 50 mm cell boundaries between the two skins,
// so its room-side faces fall inside the tolerance and its outward faces do
// not. Same test, same tolerance, applied to the node R40 could not know about.
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
const FLOOR = 3;
const TOL = 0.10;          // m, between the 0.030 lining and the ~0.23 far face
const VERTICAL = 0.5;      // |n.y| below this is a wall face rather than a head

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
const inside = root.listMaterials().find((m) => m.getName() === 'interior');
const outside = root.listMaterials().find((m) => m.getName() === 'stucco');
if (!inside || !outside) throw new Error('level-3 carries no interior/stucco pair');

const wm = node.getWorldMatrix();
const buckets = { interior: [], stucco: [] };
let heads = 0;
for (const prim of mesh.listPrimitives()) {
  const P = prim.getAttribute('POSITION').getArray();
  const N = prim.getAttribute('NORMAL')?.getArray();
  const I = prim.getIndices()?.getArray();
  const count = I ? I.length : P.length / 3;
  for (let t = 0; t + 2 < count; t += 3) {
    const ids = I ? [I[t], I[t + 1], I[t + 2]] : [t, t + 1, t + 2];
    const tri = ids.map((i) => ({
      p: [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]],
      n: N ? [N[i * 3], N[i * 3 + 1], N[i * 3 + 2]] : [0, 1, 0],
    }));
    const world = tri.map(({ p }) => [wm[0] * p[0] + wm[4] * p[1] + wm[8] * p[2] + wm[12],
                                      wm[1] * p[0] + wm[5] * p[1] + wm[9] * p[2] + wm[13],
                                      wm[2] * p[0] + wm[6] * p[1] + wm[10] * p[2] + wm[14]]);
    const e1 = world[1].map((v, k) => v - world[0][k]);
    const e2 = world[2].map((v, k) => v - world[0][k]);
    const nv = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const len = Math.hypot(...nv);
    // a head or a soffit faces neither a room nor the street in the sense the
    // test asks about, and it is capped by roof above it either way
    if (!len || Math.abs(nv[1] / len) >= VERTICAL) { buckets.interior.push(tri); heads++; continue; }
    const cx = (world[0][0] + world[1][0] + world[2][0]) / 3;
    const cz = (world[0][2] + world[1][2] + world[2][2]) / 3;
    buckets[nearRoomBoundary(cx, cz, TOL) ? 'interior' : 'stucco'].push(tri);
  }
}
console.log(`${buckets.interior.length + buckets.stucco.length} core triangles: ` +
  `${buckets.interior.length} indoors (${heads} heads and soffits), ${buckets.stucco.length} moved to the façade`);
if (!buckets.stucco.length) throw new Error('no core face reads as an outside face; the test is wrong');

const buffer = root.listBuffers()[0] ?? doc.createBuffer();
for (const prim of mesh.listPrimitives()) prim.dispose();
for (const [name, material] of [['interior', inside], ['stucco', outside]]) {
  const tris = buckets[name];
  if (!tris.length) continue;
  const position = new Float32Array(tris.length * 9), normal = new Float32Array(tris.length * 9);
  tris.forEach((tri, t) => tri.forEach((v, k) => {
    position.set(v.p, t * 9 + k * 3); normal.set(v.n, t * 9 + k * 3);
  }));
  mesh.addPrimitive(doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(position).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(normal).setBuffer(buffer))
    .setMaterial(material));
}

await doc.transform(prune());
for (const ext of root.listExtensionsUsed())
  if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
const plain = FILE + '.plain.glb';
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
writeFileSync(ROOT + '/build/attic-core-finish-r42.json', JSON.stringify({
  generated_for: 'R42', node: NODE, tolerance_m: TOL, vertical_threshold: VERTICAL,
  interior_triangles: buckets.interior.length, stucco_triangles: buckets.stucco.length,
  heads_and_soffits: heads,
}, null, 2));
console.log('level-3.glb re-encoded:', asset.bytes, 'bytes');
