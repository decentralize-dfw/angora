// R44 | Rooms are white inside on every storey, walls and ceilings both.
//
// "üst kat duvarları beyaz yap. tavanlar beyaz olmalı."
//
// R43 settled the rule and the method on the attic: a wall face lining a room
// lies within centimetres of the room polygon that IS its finished face, so
// plan position tells the two sides of a wall apart where winding cannot be
// trusted; room faces wear `interior`, outward faces the façade blue-grey.
// This applies the same judgement to the storeys below - the master bedroom's
// walk showed a stucco wall on the left of the bed and a white one on the
// right - with one addition the attic did not need: a face standing free
// INSIDE a room (a pier, a chimney breast) touches no boundary and must not
// fall to the façade colour for it, so "inside the polygon" keeps a face
// white the way "near its edge" does.
//
// Ceilings are not re-painted but LINED. The plane a bedroom stands under is
// the roof body's own underside - the same triangles whose upper side is the
// roof the street sees - so recolouring them would flip tiles to white
// somewhere on the skyline. Instead every down-facing triangle over a room
// that wears roof, façade or floor-slab material gets a copy 25 mm below it
// in the storey's own `ceiling` material, the way the attic carries its
// authored lining. The original is untouched; from outside nothing changes.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const TOL = 0.10;
const VERTICAL = 0.5;
// A ceiling face is horizontal enough; its winding is as unreliable as every
// other orientation on the recovered CAD skin, so |n.y| is judged and the
// lining copy is wound downward regardless.
const DOWN = 0.6;
const LINING_DROP = 0.025;
const DATUMS = [0, 3.0996, 6.3714, 9.4705];
const BAND = (f) => [DATUMS[f] + 1.95, (DATUMS[f + 1] ?? DATUMS[f] + 3.2) + 0.25];
const base = (name) => name.replace(/\.\d{3}$/, '');
// slab undersides, roof bodies and façade render seen from below, all of
// which a room reads as its ceiling; joinery, beams, trim and lights stay
const LINABLE = /^(roof|stucco|wood_floor|terra_floor|stone_tile|clay tile.*|Projected clay tile.*)$/i;

const spaces = JSON.parse(readFileSync(FULL + '/room-spaces.json', 'utf8')).spaces;
const perFloor = new Map();
for (const space of spaces) {
  const f = space.floor_index;
  if (!perFloor.has(f)) perFloor.set(f, { edges: [], rings: [] });
  const g = perFloor.get(f);
  g.rings.push({ boundary: space.boundary_xz, holes: space.holes_xz || [] });
  for (const ring of [space.boundary_xz, ...(space.holes_xz || [])])
    for (let i = 0; i < ring.length; i++) {
      const [x1, z1] = ring[i], [x2, z2] = ring[(i + 1) % ring.length];
      g.edges.push([x1, z1, x2, z2]);
    }
}
function nearBoundary(f, x, z, tol = TOL) {
  const t2 = tol * tol;
  for (const [x1, z1, x2, z2] of perFloor.get(f)?.edges ?? []) {
    if (x < Math.min(x1, x2) - tol || x > Math.max(x1, x2) + tol) continue;
    if (z < Math.min(z1, z2) - tol || z > Math.max(z1, z2) + tol) continue;
    const dx = x2 - x1, dz = z2 - z1, len2 = dx * dx + dz * dz;
    const t = len2 ? Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / len2)) : 0;
    const px = x1 + t * dx - x, pz = z1 + t * dz - z;
    if (px * px + pz * pz <= t2) return true;
  }
  return false;
}
const hitRing = (ring, x, z) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i], [xj, zj] = ring[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
};
function insideRoom(f, x, z) {
  for (const { boundary, holes } of perFloor.get(f)?.rings ?? [])
    if (hitRing(boundary, x, z) && !holes.some((h) => hitRing(h, x, z))) return true;
  return false;
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

const report = {};
// which room floors each level file carries ceilings for: a storey's ceiling
// can be the underside of the slab in the NEXT storey's file
const CEILING_SOURCES = { 'level-0': [0], 'level-1': [0, 1], 'level-2': [1, 2], 'level-3': [2] };
// wall faces are re-judged on the storeys R43 did not already settle
const WALL_FLOORS = { 'level-0': 0, 'level-1': 1, 'level-2': 2 };

for (const id of ['level-0', 'level-1', 'level-2', 'level-3']) {
  const FILE = `${FULL}/${id}.glb`;
  const doc = await io.read(FILE);
  const root = doc.getRoot();
  const stats = { walls: {}, lining: {} };

  const inside = root.listMaterials().find((m) => base(m.getName()) === 'interior');
  const outside = root.listMaterials().find((m) => base(m.getName()) === 'stucco');
  const ceiling = root.listMaterials().filter((m) => base(m.getName()) === 'ceiling')
    .sort((a, b) => b.getBaseColorFactor()[0] - a.getBaseColorFactor()[0])[0];  // the white one
  const buffer = root.listBuffers()[0] ?? doc.createBuffer();

  // ---------------------------------------------------------------- walls
  const wallFloor = WALL_FLOORS[id];
  if (wallFloor !== undefined && inside && outside) {
    for (const node of root.listNodes()) {
      const mesh = node.getMesh();
      if (!mesh) continue;
      const judged = mesh.listPrimitives().some((p) => ['interior', 'stucco'].includes(base(p.getMaterial()?.getName() ?? '')));
      if (!judged) continue;
      const name = node.getName().replace(/_/g, ' ');
      const wm = node.getWorldMatrix();
      const buckets = { interior: [], stucco: [] };
      const untouched = [];
      let flipped = { toWhite: 0, toFacade: 0 }, total = 0;
      for (const prim of mesh.listPrimitives()) {
        const material = prim.getMaterial();
        const judge = ['interior', 'stucco'].includes(base(material?.getName() ?? ''));
        const P = prim.getAttribute('POSITION').getArray();
        const N = prim.getAttribute('NORMAL')?.getArray();
        const U = prim.getAttribute('TEXCOORD_0')?.getArray();
        const I = prim.getIndices()?.getArray();
        const count = I ? I.length : P.length / 3;
        const keep = { material, tris: [] };
        for (let t = 0; t + 2 < count; t += 3) {
          const ids = I ? [I[t], I[t + 1], I[t + 2]] : [t, t + 1, t + 2];
          const tri = ids.map((i) => ({
            p: [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]],
            n: N ? [N[i * 3], N[i * 3 + 1], N[i * 3 + 2]] : [0, 1, 0],
            u: U ? [U[i * 2], U[i * 2 + 1]] : [0, 0],
          }));
          if (!judge) { keep.tris.push(tri); continue; }
          total++;
          const world = tri.map(({ p }) => [wm[0] * p[0] + wm[4] * p[1] + wm[8] * p[2] + wm[12],
                                            wm[1] * p[0] + wm[5] * p[1] + wm[9] * p[2] + wm[13],
                                            wm[2] * p[0] + wm[6] * p[1] + wm[10] * p[2] + wm[14]]);
          const e1 = world[1].map((v, k) => v - world[0][k]);
          const e2 = world[2].map((v, k) => v - world[0][k]);
          const nv = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
          const len = Math.hypot(...nv);
          const cx = (world[0][0] + world[1][0] + world[2][0]) / 3;
          const cz = (world[0][2] + world[1][2] + world[2][2]) / 3;
          const head = !len || Math.abs(nv[1] / len) >= VERTICAL;
          const white = head || nearBoundary(wallFloor, cx, cz) || insideRoom(wallFloor, cx, cz);
          const was = base(prim.getMaterial().getName());
          if (white && was === 'stucco') flipped.toWhite++;
          if (!white && was === 'interior') flipped.toFacade++;
          buckets[white ? 'interior' : 'stucco'].push(tri);
        }
        if (keep.tris.length) untouched.push(keep);
      }
      if (!total) continue;
      for (const prim of mesh.listPrimitives()) prim.dispose();
      const write = (tris, material) => {
        if (!tris.length) return;
        const position = new Float32Array(tris.length * 9), normal = new Float32Array(tris.length * 9);
        const uv = new Float32Array(tris.length * 6);
        tris.forEach((tri, t) => tri.forEach((v, k) => {
          position.set(v.p, t * 9 + k * 3); normal.set(v.n, t * 9 + k * 3); uv.set(v.u, t * 6 + k * 2);
        }));
        mesh.addPrimitive(doc.createPrimitive()
          .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(position).setBuffer(buffer))
          .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(normal).setBuffer(buffer))
          .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(uv).setBuffer(buffer))
          .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(tris.length * 3).map((_, i) => i)).setBuffer(buffer))
          .setMaterial(material));
      };
      write(buckets.interior, inside);
      write(buckets.stucco, outside);
      for (const { material, tris } of untouched) write(tris, material);
      stats.walls[name] = { judged: total, to_white: flipped.toWhite, to_facade: flipped.toFacade,
        interior: buckets.interior.length, facade: buckets.stucco.length };
    }
  }

  // --------------------------------------------------------------- lining
  if (ceiling) {
    const LINING = `${id} | R44 room ceiling lining`;
    for (const node of root.listNodes()) {
      if (node.getName() === LINING) { const m = node.getMesh(); node.dispose(); m?.dispose(); }   // idempotent
    }
    const lining = [];
    for (const node of root.listNodes()) {
      const mesh = node.getMesh();
      if (!mesh) continue;
      if ((node.getExtras() || {}).category === 'furniture') continue;
      const wm = node.getWorldMatrix();
      for (const prim of mesh.listPrimitives()) {
        const matName = base(prim.getMaterial()?.getName() ?? '');
        if (!LINABLE.test(matName)) continue;
        const P = prim.getAttribute('POSITION').getArray();
        const I = prim.getIndices()?.getArray();
        const count = I ? I.length : P.length / 3;
        for (let t = 0; t + 2 < count; t += 3) {
          const ids = I ? [I[t], I[t + 1], I[t + 2]] : [t, t + 1, t + 2];
          const world = ids.map((i) => {
            const p = [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]];
            return [wm[0] * p[0] + wm[4] * p[1] + wm[8] * p[2] + wm[12],
                    wm[1] * p[0] + wm[5] * p[1] + wm[9] * p[2] + wm[13],
                    wm[2] * p[0] + wm[6] * p[1] + wm[10] * p[2] + wm[14]];
          });
          const e1 = world[1].map((v, k) => v - world[0][k]);
          const e2 = world[2].map((v, k) => v - world[0][k]);
          const nv = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
          const len = Math.hypot(...nv);
          if (!len || Math.abs(nv[1] / len) < DOWN) continue;
          const cx = (world[0][0] + world[1][0] + world[2][0]) / 3;
          const cy = (world[0][1] + world[1][1] + world[2][1]) / 3;
          const cz = (world[0][2] + world[1][2] + world[2][2]) / 3;
          for (const f of CEILING_SOURCES[id]) {
            const [lo, hi] = BAND(f);
            if (cy < lo || cy > hi) continue;
            if (!insideRoom(f, cx, cz)) continue;
            lining.push(world.map((p) => [p[0], p[1] - LINING_DROP, p[2]]));
            stats.lining[`f${f}`] = (stats.lining[`f${f}`] ?? 0) + 1;
            break;
          }
        }
      }
    }
    if (lining.length) {
      const position = new Float32Array(lining.length * 9), normal = new Float32Array(lining.length * 9);
      const uv = new Float32Array(lining.length * 6);
      lining.forEach((tri, t) => tri.forEach((p, k) => {
        position.set(p, t * 9 + k * 3); normal.set([0, -1, 0], t * 9 + k * 3); uv.set([p[0], p[2]], t * 6 + k * 2);
      }));
      const prim = doc.createPrimitive()
        .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(position).setBuffer(buffer))
        .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(normal).setBuffer(buffer))
        .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(uv).setBuffer(buffer))
        .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(lining.length * 3).map((_, i) => i)).setBuffer(buffer))
        .setMaterial(ceiling);
      root.listScenes()[0].addChild(doc.createNode(`${id} | R44 room ceiling lining`)
        .setMesh(doc.createMesh(`${id} | R44 room ceiling lining`).addPrimitive(prim))
        .setExtras({ category: 'ceiling', note: 'R44: white lining 25 mm under what a room reads as its ceiling' }));
    }
  }

  await doc.transform(prune());
  for (const ext of root.listExtensionsUsed())
    if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
  const plain = `${FULL}/${id}.plain.glb`;
  writeFileSync(plain, await io.writeBinary(doc));
  execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, FILE,
    '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
  unlinkSync(plain);

  const raw = readFileSync(FILE);
  let triangles = 0;
  {
    const meshes = new Set();
    for (const n of (await io.read(FILE)).getRoot().listNodes()) if (n.getMesh()) meshes.add(n.getMesh());
    for (const m of meshes) for (const p of m.listPrimitives())
      triangles += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
  }
  for (const path of [FULL + '/manifest.json', ROOT + '/viewer/public/models/full/manifest.json']) {
    if (!existsSync(path)) continue;
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    const asset = manifest.assets.find((a) => a.id === id);
    if (!asset) continue;              // post-merge manifests carry villa, not the storeys
    asset.bytes = raw.length;
    asset.sha256 = createHash('sha256').update(raw).digest('hex');
    asset.triangles = triangles;
    writeFileSync(path, JSON.stringify(manifest, null, 2));
  }
  const mirror = `${ROOT}/viewer/public/models/full/${id}.glb`;
  if (existsSync(mirror)) writeFileSync(mirror, raw);
  report[id] = { ...stats, asset_bytes: raw.length, asset_triangles: triangles };
  console.log(id, JSON.stringify(stats.lining), Object.keys(stats.walls).length, 'wall nodes re-judged');
}
writeFileSync(ROOT + '/build/white-interiors-r44.json', JSON.stringify({
  generated_for: 'R44', tolerance_m: TOL, vertical: VERTICAL, lining_drop_m: LINING_DROP,
  method: 'walls re-judged by room-boundary distance and room interiors (R43 rule + inside-polygon); ceilings lined, not repainted',
  levels: report,
}, null, 2));
console.log('white-interiors-r44.json written');
