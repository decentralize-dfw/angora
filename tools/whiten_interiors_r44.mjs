// R44 | Rooms are white inside on every storey, walls and ceilings both.
//
// "üst kat duvarları beyaz yap. tavanlar beyaz olmalı."
//
// R44.2 corrects the side rule the hard way after the façade showed white:
// distance to a room polygon cannot tell a thin wall's two faces apart (both
// sit within the tolerance), and "a head is always indoors" painted every
// parapet coping white. The judgement is now which side of the face a room
// actually lies on: the face's two probe points, 7 cm along its own averaged
// normal in either direction, are tested against the room polygons of the
// storey the face stands in. A face with a room on either side is interior;
// a face with rooms on neither - a parapet top, a coping, an outer skin, a
// shaft - is the façade blue-grey. On a double-skinned wall this lands the
// inner skin white and the outer grey with no tolerance games at all.
//
// The one case a single face cannot serve is a single-skinned exterior wall:
// its room side must read white and its street side must not, and a material
// covers both. Wherever an interior face has open air behind it - no backing
// skin within 35 cm - a stucco copy is laid 6 mm to the outside, so the
// street sees the façade and the room keeps its plaster.
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
const SIDE_PROBE = 0.07;
const SKIN_REACH = 0.35;
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
// For walls the holes count as indoors: a stair void or the gallery is inside
// the house, and the walls that line it are plastered white like any room's.
function insideHull(f, x, z) {
  for (const { boundary } of perFloor.get(f)?.rings ?? [])
    if (hitRing(boundary, x, z)) return true;
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
// every storey's walls are judged by the side rule, the attic included -
// R43's distance rule is what painted its outer gable faces white
const WALL_FLOORS = { 'level-0': 0, 'level-1': 1, 'level-2': 2, 'level-3': 3 };
const floorOfY = (y) => {
  let f = 0;
  for (let g = 1; g < DATUMS.length; g++) if (Math.abs(y - DATUMS[g] - 1.4) < Math.abs(y - DATUMS[f] - 1.4)) f = g;
  return f;
};

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
    // pass 1: every wall triangle in world space, for the side rule and for
    // the backing-skin test alike
    const SKIN = `${id} | R44 exterior skin`;
    for (const node of root.listNodes()) {
      if (node.getName() !== SKIN) continue;
      const m = node.getMesh(); node.dispose(); m?.dispose();            // idempotent
    }
    const nodesToJudge = [];
    const allWall = [];
    for (const node of root.listNodes()) {
      const mesh = node.getMesh();
      if (!mesh) continue;
      // the lift shaft is white by design on every face the cabin passes; it
      // has no room polygon and must not fall to the facade colour for it
      if (/Lift/i.test(node.getName())) continue;
      const judged = mesh.listPrimitives().some((p) => ['interior', 'stucco'].includes(base(p.getMaterial()?.getName() ?? '')));
      if (!judged) continue;
      const wm = node.getWorldMatrix();
      const entry = { node, mesh, name: node.getName().replace(/_/g, ' '), prims: [] };
      for (const prim of mesh.listPrimitives()) {
        const material = prim.getMaterial();
        const judge = ['interior', 'stucco'].includes(base(material?.getName() ?? ''));
        const P = prim.getAttribute('POSITION').getArray();
        const N = prim.getAttribute('NORMAL')?.getArray();
        const U = prim.getAttribute('TEXCOORD_0')?.getArray();
        const I = prim.getIndices()?.getArray();
        const count = I ? I.length : P.length / 3;
        const rec = { material, judge, tris: [] };
        for (let t = 0; t + 2 < count; t += 3) {
          const ids = I ? [I[t], I[t + 1], I[t + 2]] : [t, t + 1, t + 2];
          const tri = ids.map((i) => ({
            p: [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]],
            n: N ? [N[i * 3], N[i * 3 + 1], N[i * 3 + 2]] : [0, 1, 0],
            u: U ? [U[i * 2], U[i * 2 + 1]] : [0, 0],
          }));
          const world = tri.map(({ p }) => [wm[0] * p[0] + wm[4] * p[1] + wm[8] * p[2] + wm[12],
                                            wm[1] * p[0] + wm[5] * p[1] + wm[9] * p[2] + wm[13],
                                            wm[2] * p[0] + wm[6] * p[1] + wm[10] * p[2] + wm[14]]);
          const wn = tri.map(({ n }) => [wm[0] * n[0] + wm[4] * n[1] + wm[8] * n[2],
                                         wm[1] * n[0] + wm[5] * n[1] + wm[9] * n[2],
                                         wm[2] * n[0] + wm[6] * n[1] + wm[10] * n[2]]);
          const an = [wn[0][0] + wn[1][0] + wn[2][0], wn[0][1] + wn[1][1] + wn[2][1], wn[0][2] + wn[1][2] + wn[2][2]];
          const al = Math.hypot(...an) || 1;
          const c = [(world[0][0] + world[1][0] + world[2][0]) / 3,
                     (world[0][1] + world[1][1] + world[2][1]) / 3,
                     (world[0][2] + world[1][2] + world[2][2]) / 3];
          const item = { tri, world, c, n: [an[0] / al, an[1] / al, an[2] / al] };
          rec.tris.push(item);
          if (rec.judge) allWall.push(item);
        }
        entry.prims.push(rec);
      }
      nodesToJudge.push(entry);
    }
    // a coarse hash of wall triangles, for "is there a skin behind this face"
    const CELLW = 0.5;
    const hash = new Map();
    const hkey = (x, y, z) => `${Math.floor(x / CELLW)},${Math.floor(y / CELLW)},${Math.floor(z / CELLW)}`;
    allWall.forEach((w, i) => {
      const k = hkey(w.c[0], w.c[1], w.c[2]);
      (hash.get(k) ?? hash.set(k, []).get(k)).push(i);
    });
    const backedBy = (item, dir) => {
      // any roughly parallel wall face 2..35 cm along dir counts as a skin
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) for (let dk = -1; dk <= 1; dk++) {
        const probe = [item.c[0] + dir[0] * 0.18 + di * CELLW, item.c[1] + dir[1] * 0.18 + dj * CELLW, item.c[2] + dir[2] * 0.18 + dk * CELLW];
        for (const i of hash.get(hkey(probe[0], probe[1], probe[2])) ?? []) {
          const other = allWall[i];
          if (other === item) continue;
          const d = [other.c[0] - item.c[0], other.c[1] - item.c[1], other.c[2] - item.c[2]];
          const along = d[0] * dir[0] + d[1] * dir[1] + d[2] * dir[2];
          if (along < 0.02 || along > SKIN_REACH) continue;
          const off = [d[0] - along * dir[0], d[1] - along * dir[1], d[2] - along * dir[2]];
          if (Math.hypot(...off) > 0.30) continue;
          if (Math.abs(other.n[0] * item.n[0] + other.n[1] * item.n[1] + other.n[2] * item.n[2]) < 0.5) continue;
          return true;
        }
      }
      return false;
    };
    // pass 2: judge every face by which side a room lies on, rebuild the
    // node, and grow a façade skin where a white face meets open air
    const skinTris = [];
    for (const entry of nodesToJudge) {
      const buckets = { interior: [], stucco: [] };
      const untouched = [];
      let flipped = { toWhite: 0, toFacade: 0 }, total = 0, skinned = 0;
      for (const rec of entry.prims) {
        if (!rec.judge) { if (rec.tris.length) untouched.push({ material: rec.material, tris: rec.tris.map((t) => t.tri) }); continue; }
        const was = base(rec.material.getName());
        for (const item of rec.tris) {
          total++;
          const f = floorOfY(item.c[1]);
          const pIn = [item.c[0] + item.n[0] * SIDE_PROBE, item.c[2] + item.n[2] * SIDE_PROBE];
          const pOut = [item.c[0] - item.n[0] * SIDE_PROBE, item.c[2] - item.n[2] * SIDE_PROBE];
          const roomFront = insideHull(f, pIn[0], pIn[1]);
          const roomBack = insideHull(f, pOut[0], pOut[1]);
          const white = roomFront || roomBack;
          if (white && was === 'stucco') flipped.toWhite++;
          if (!white && was === 'interior') flipped.toFacade++;
          buckets[white ? 'interior' : 'stucco'].push(item.tri);
          if (white && roomFront !== roomBack) {
            // a room on one side only: if open air stands on the other, the
            // street is looking at plaster - give it the façade skin
            const out = roomFront ? [-item.n[0], -item.n[1], -item.n[2]] : item.n;
            if (!backedBy(item, out)) {
              skinned++;
              skinTris.push(item.tri.map((v) => ({
                p: null, world: null,
                n: [out[0], out[1], out[2]], u: v.u,
              })).map((sv, vi) => ({
                p: [item.world[vi][0] + out[0] * 0.006, item.world[vi][1] + out[1] * 0.006, item.world[vi][2] + out[2] * 0.006],
                n: sv.n, u: sv.u,
              })));
            }
          }
        }
      }
      if (!total) continue;
      for (const prim of entry.mesh.listPrimitives()) prim.dispose();
      const write = (tris, material, mesh) => {
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
      write(buckets.interior, inside, entry.mesh);
      write(buckets.stucco, outside, entry.mesh);
      for (const { material, tris } of untouched) write(tris, material, entry.mesh);
      stats.walls[entry.name] = { judged: total, to_white: flipped.toWhite, to_facade: flipped.toFacade,
        interior: buckets.interior.length, facade: buckets.stucco.length, skinned };
      entry.writeHelper = write;
    }
    // the grown façade skin, in world space, one node per level
    {
      if (skinTris.length) {
        const position = new Float32Array(skinTris.length * 9), normal = new Float32Array(skinTris.length * 9);
        const uv = new Float32Array(skinTris.length * 6);
        skinTris.forEach((tri, t) => tri.forEach((v, k) => {
          position.set(v.p, t * 9 + k * 3); normal.set(v.n, t * 9 + k * 3); uv.set(v.u, t * 6 + k * 2);
        }));
        const prim = doc.createPrimitive()
          .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(position).setBuffer(buffer))
          .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(normal).setBuffer(buffer))
          .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(uv).setBuffer(buffer))
          .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(skinTris.length * 3).map((_, i) => i)).setBuffer(buffer))
          .setMaterial(outside);
        root.listScenes()[0].addChild(doc.createNode(SKIN)
          .setMesh(doc.createMesh(SKIN).addPrimitive(prim))
          .setExtras({ category: 'wall', note: 'R44.2: facade skin 6 mm outside single-skinned white faces' }));
        stats.exterior_skin_tris = skinTris.length;
      }
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
