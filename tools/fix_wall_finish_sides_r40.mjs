// R40 | Put the inside finish inside and the outside finish outside.
//
// Two complaints, one cause. Upstairs a wall comes out split diagonally
// between the interior cream and the exterior blue-grey, and out at the back
// the balcony reveals - which are outdoor surfaces - come out white like a
// bedroom. The delivered wall meshes carry both finishes as two primitives,
// and the split between them does not follow which side of the envelope a
// face is on: F3's interior lining alone holds 125 triangles of exterior
// stucco, and the balcony recesses hold interior cream.
//
// Winding cannot be used to decide it - the recovered CAD skin's winding is
// inconsistent, which is why the section atlas refuses to rely on it either.
// What can be used is where the face sits in plan. A room's polygon in
// room-spaces.json IS its finished wall face, so:
//
//   a face that lines a room lies ON that polygon's boundary - the lining's
//   room side at 0 m, its back and the wall's own inner face at 0.030 m;
//   a face on the outside of the same wall is the lining plus the wall
//   thickness away, about 0.23 m;
//   a face around a balcony reveal is nowhere near any room's boundary at all.
//
// So the test is a distance in plan to the nearest room boundary of that
// storey, and TOL sits in the gap between 0.03 and 0.23. Being a plan test it
// does not care what height the face is at, which matters in the attic: the
// room polygons there are cut at datum+1.0 where the roof has already closed
// in, so an inside/outside test against the polygon AREA would call the walls
// down at floor level outdoors and paint the bedrooms blue.
//
// Only near-vertical faces are judged. Horizontal ones - wall heads, sills,
// the underside of a run - do not face a room or the outdoors in the sense the
// test asks about. The authored tile finishes (bathroom ceramics, mosaic
// bands) are left exactly as delivered; this only ever moves a triangle
// between 'interior' and 'stucco'.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const LEVELS = [['level-0', 0], ['level-1', 1], ['level-2', 2], ['level-3', 3]];
const WALL = /KAT \d\$DUVAR( KAPLAMA)?$/;
const TOL = 0.10;          // m, between the 0.030 lining and the ~0.23 far face
const VERTICAL = 0.5;      // |n.y| below this is a wall face rather than a head or a sill

const spaces = JSON.parse(readFileSync(FULL + '/room-spaces.json', 'utf8')).spaces;
const edges = new Map();   // floor -> [[x1,z1,x2,z2], ...] of every room boundary segment
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
  const doc = await io.read(`${FULL}/${level}.glb`);
  const root = doc.getRoot();
  let moved = { toInterior: 0, toStucco: 0, kept: 0, skipped: 0 };
  for (const node of root.listNodes()) {
    if (!WALL.test(node.getName())) continue;
    const mesh = node.getMesh(); if (!mesh) continue;
    const wm = node.getWorldMatrix();
    const prims = new Map();
    for (const prim of mesh.listPrimitives()) {
      const name = prim.getMaterial()?.getName();
      if (name === 'interior' || name === 'stucco') prims.set(name, prim);
    }
    if (prims.size !== 2) continue;
    // gather every judged triangle as world-space vertices, keyed by target
    const buckets = { interior: [], stucco: [] };
    for (const [name, prim] of prims) {
      const pos = prim.getAttribute('POSITION'), nor = prim.getAttribute('NORMAL');
      const uv = prim.getAttribute('TEXCOORD_0'), idx = prim.getIndices();
      const P = pos.getArray(), N = nor?.getArray(), U = uv?.getArray();
      const I = idx ? idx.getArray() : null;
      const count = I ? I.length : pos.getCount();
      for (let t = 0; t + 2 < count; t += 3) {
        const a = I ? I[t] : t, b = I ? I[t + 1] : t + 1, c = I ? I[t + 2] : t + 2;
        const vertex = (i) => ({
          p: [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]],
          n: N ? [N[i * 3], N[i * 3 + 1], N[i * 3 + 2]] : [0, 1, 0],
          u: U ? [U[i * 2], U[i * 2 + 1]] : [0, 0],
        });
        const tri = [vertex(a), vertex(b), vertex(c)];
        const world = tri.map(({ p }) => [wm[0]*p[0]+wm[4]*p[1]+wm[8]*p[2]+wm[12],
                                          wm[1]*p[0]+wm[5]*p[1]+wm[9]*p[2]+wm[13],
                                          wm[2]*p[0]+wm[6]*p[1]+wm[10]*p[2]+wm[14]]);
        // geometric normal, so a broken vertex normal cannot decide anything
        const e1 = world[1].map((v, k) => v - world[0][k]);
        const e2 = world[2].map((v, k) => v - world[0][k]);
        let nx = e1[1]*e2[2]-e1[2]*e2[1], ny = e1[2]*e2[0]-e1[0]*e2[2], nz = e1[0]*e2[1]-e1[1]*e2[0];
        const len = Math.hypot(nx, ny, nz);
        if (!len) { buckets[name].push(tri); moved.skipped++; continue; }
        nx /= len; ny /= len; nz /= len;
        if (Math.abs(ny) >= VERTICAL) { buckets[name].push(tri); moved.skipped++; continue; }
        const cx = (world[0][0]+world[1][0]+world[2][0])/3, cz = (world[0][2]+world[1][2]+world[2][2])/3;
        const target = nearRoomBoundary(floor, cx, cz, TOL) ? 'interior' : 'stucco';
        if (target !== name) moved[target === 'interior' ? 'toInterior' : 'toStucco']++; else moved.kept++;
        buckets[target].push(tri);
      }
    }
    for (const [name, prim] of prims) {
      const tris = buckets[name];
      const position = new Float32Array(tris.length * 9), normal = new Float32Array(tris.length * 9);
      const texcoord = new Float32Array(tris.length * 6);
      tris.forEach((tri, t) => tri.forEach((v, k) => {
        position.set(v.p, t * 9 + k * 3); normal.set(v.n, t * 9 + k * 3); texcoord.set(v.u, t * 6 + k * 2);
      }));
      const buffer = root.listBuffers()[0];
      prim.setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(position).setBuffer(buffer));
      prim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(normal).setBuffer(buffer));
      if (prim.getAttribute('TEXCOORD_0'))
        prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(texcoord).setBuffer(buffer));
      prim.setIndices(null);
    }
  }
  report.push({ level, ...moved });
  console.log(level, 'to interior', moved.toInterior, '| to stucco', moved.toStucco,
    '| unchanged', moved.kept, '| not judged (horizontal/degenerate)', moved.skipped);
  if (moved.toInterior + moved.toStucco === 0) continue;
  for (const ext of root.listExtensionsUsed())
    if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
  const plain = `${FULL}/${level}.plain.glb`;
  writeFileSync(plain, await io.writeBinary(doc));
  execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, `${FULL}/${level}.glb`,
    '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
  execFileSync('rm', [plain]);
}
const manifest = JSON.parse(readFileSync(FULL + '/manifest.json', 'utf8'));
for (const { level, toInterior, toStucco } of report) {
  if (toInterior + toStucco === 0) continue;
  const asset = manifest.assets.find((a) => a.id === level);
  asset.bytes = statSync(`${FULL}/${level}.glb`).size;
  asset.sha256 = createHash('sha256').update(readFileSync(`${FULL}/${level}.glb`)).digest('hex');
}
writeFileSync(FULL + '/manifest.json', JSON.stringify(manifest, null, 2));
writeFileSync(ROOT + '/build/wall-finish-sides-r40.json', JSON.stringify({
  revision: 'R40', boundary_tolerance_m: TOL, vertical_normal_limit: VERTICAL,
  rule: 'a near-vertical wall face is interior when its centroid lies within 0.10 m of an enclosed '
      + 'room boundary of its storey - room-spaces.json boundaries are the finished wall faces, so a '
      + 'lining sits at 0 m and the wall behind it at 0.030 m - and exterior stucco otherwise, the far '
      + 'face of the same wall being about 0.23 m away',
  room_polygons: 'build/web/full/room-spaces.json', levels: report,
}, null, 1));
console.log('wrote build/wall-finish-sides-r40.json');
