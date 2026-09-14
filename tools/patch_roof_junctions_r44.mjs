// R44 | Two roof junctions the source model never closed.
//
// Both marked on the user's phone screenshot, both present in the full
// and mobile sets alike - import defects, not simplification:
//
//  A  The NW wing's tiles stop short of the attic's west wall (plane
//     x -3.66): an open slot runs along the junction and the room's
//     ceiling lining shows through it. A folded wall flashing in the
//     roof's own dark material closes it, following the tile profile.
//
//  B  The SE gable's raking verge board terminates raw at x~4.1 with a
//     detached tab sitting 20 cm too low (x 4.16..4.44, y ~9.2), the
//     soffit open behind it; and one bay lower the porch verge stops
//     while the gable's tile course ends saw-tooth over it. The tab is
//     removed, the board continued straight on its own line to the
//     corner with an end cap and a soffit closure, and a matching wedge
//     board covers the tile teeth.
//
// Plus the general defect those exposed: the R44 room-ceiling linings
// were copied under the full tile sheets, so their edges peeked out at
// eaves and verges. Lining triangles within ~40 cm of the tile
// footprint's edge are removed - rooms end well inside the overhangs.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const FILE = FULL + '/villa.glb';
const CELL = 0.075;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(FILE);
const root = doc.getRoot();
const baseName = (name = '') => name.replace(/\.\d{3}$/, '');
const report = {};

// idempotent: earlier runs' closures are rebuilt from scratch
for (const node of [...root.listNodes()]) {
  if (/^R44 \| (NW wing wall flashing|SE gable verge closure)$/.test(node.getName())) {
    const mesh = node.getMesh(); node.dispose();
    if (mesh && mesh.listParents().every((p) => p.propertyType !== 'Node')) mesh.dispose();
  }
}

// ------------------------------------------------- tile field (as trim tool)
const prims = [];
for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const m = node.getMatrix();
  const identity = m.every((v, i) => Math.abs(v - (i % 5 === 0 ? 1 : 0)) < 1e-9);
  for (const prim of mesh.listPrimitives())
    prims.push({ prim, matBase: baseName(prim.getMaterial()?.getName() ?? ''), identity });
}
let bx0 = Infinity, bz0 = Infinity, bx1 = -Infinity, bz1 = -Infinity;
const tileTris = [];
for (const { prim, matBase, identity } of prims) {
  if (!/^Clay tile \d+$/.test(matBase) || !identity) continue;
  const pos = prim.getAttribute('POSITION'); const idx = prim.getIndices();
  const count = idx ? idx.getCount() : pos.getCount();
  const el = [0, 0, 0];
  for (let i = 0; i < count; i += 3) {
    const t = [];
    for (let k = 0; k < 3; k++) { pos.getElement(idx ? idx.getScalar(i + k) : i + k, el); t.push([el[0], el[1], el[2]]); }
    tileTris.push(t);
    for (const [x, , z] of t) {
      if (x < bx0) bx0 = x; if (x > bx1) bx1 = x;
      if (z < bz0) bz0 = z; if (z > bz1) bz1 = z;
    }
  }
}
bx0 -= 0.2; bz0 -= 0.2; bx1 += 0.2; bz1 += 0.2;
const W = Math.ceil((bx1 - bx0) / CELL), H = Math.ceil((bz1 - bz0) / CELL);
const top = new Float32Array(W * H).fill(-Infinity);
for (const t of tileTris) {
  const y = Math.max(t[0][1], t[1][1], t[2][1]);
  const xs = t.map((p) => p[0]), zs = t.map((p) => p[2]);
  const ix0 = Math.max(0, Math.floor((Math.min(...xs) - bx0) / CELL)), ix1 = Math.min(W - 1, Math.floor((Math.max(...xs) - bx0) / CELL));
  const iz0 = Math.max(0, Math.floor((Math.min(...zs) - bz0) / CELL)), iz1 = Math.min(H - 1, Math.floor((Math.max(...zs) - bz0) / CELL));
  for (let iz = iz0; iz <= iz1; iz++) for (let ix = ix0; ix <= ix1; ix++) {
    const i = iz * W + ix;
    if (y > top[i]) top[i] = y;
  }
}
const inside = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) inside[i] = top[i] > -Infinity ? 1 : 0;
const edgeDist = new Uint8Array(W * H).fill(255);
let frontier = [];
for (let iz = 0; iz < H; iz++) for (let ix = 0; ix < W; ix++) {
  const i = iz * W + ix;
  if (!inside[i]) { edgeDist[i] = 0; continue; }
  if (ix === 0 || iz === 0 || ix === W - 1 || iz === H - 1 ||
      !inside[i - 1] || !inside[i + 1] || !inside[i - W] || !inside[i + W]) { edgeDist[i] = 1; frontier.push(i); }
}
for (let d = 2; d <= 7 && frontier.length; d++) {
  const next = [];
  for (const i of frontier) for (const j of [i - 1, i + 1, i - W, i + W])
    if (j >= 0 && j < W * H && inside[j] && edgeDist[j] > d) { edgeDist[j] = d; next.push(j); }
  frontier = next;
}
const cellAt = (x, z) => {
  const ix = Math.floor((x - bx0) / CELL), iz = Math.floor((z - bz0) / CELL);
  return ix < 0 || iz < 0 || ix >= W || iz >= H ? -1 : iz * W + ix;
};

// ------------------------------------- 1 | lining edges out of the overhangs
{
  let deleted = 0;
  for (const { prim, matBase, identity } of prims) {
    if (matBase !== 'ceiling' || !identity) continue;
    const pos = prim.getAttribute('POSITION'); const idx = prim.getIndices();
    if (!pos || !idx) continue;
    const el = [0, 0, 0];
    const keep = [];
    for (let i = 0; i < idx.getCount(); i += 3) {
      const tri = [idx.getScalar(i), idx.getScalar(i + 1), idx.getScalar(i + 2)];
      let cx = 0, cy = 0, cz = 0;
      for (const vi of tri) { pos.getElement(vi, el); cx += el[0] / 3; cy += el[1] / 3; cz += el[2] / 3; }
      const i2 = cellAt(cx, cz);
      // linings ride 25 mm under the tiles; anything of them near the
      // sheet's edge is overhang, not room
      if (cy > 5 && i2 >= 0 && inside[i2] && edgeDist[i2] <= 5 && top[i2] - cy < 0.35 && top[i2] > cy) { deleted++; continue; }
      keep.push(...tri);
    }
    if (keep.length < idx.getCount()) {
      const fresh = doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(keep)).setBuffer(root.listBuffers()[0]);
      const old = prim.getIndices(); prim.setIndices(fresh);
      if (old.listParents().every((p) => p.propertyType !== 'Primitive')) old.dispose();
    }
  }
  report.lining_edge_triangles_removed = deleted;
}

// ---------------------------------------- 2 | B: the detached verge tab goes
{
  const BOX = { x0: 3.85, x1: 4.55, y0: 9.0, y1: 9.36, z0: 4.5, z1: 5.02 };
  let deleted = 0;
  for (const { prim, matBase, identity } of prims) {
    if (matBase !== 'wood_dark' || !identity) continue;
    const pos = prim.getAttribute('POSITION'); const idx = prim.getIndices();
    if (!pos || !idx) continue;
    const el = [0, 0, 0];
    const keep = [];
    for (let i = 0; i < idx.getCount(); i += 3) {
      const tri = [idx.getScalar(i), idx.getScalar(i + 1), idx.getScalar(i + 2)];
      let cx = 0, cy = 0, cz = 0;
      for (const vi of tri) { pos.getElement(vi, el); cx += el[0] / 3; cy += el[1] / 3; cz += el[2] / 3; }
      if (cx > BOX.x0 && cx < BOX.x1 && cy > BOX.y0 && cy < BOX.y1 && cz > BOX.z0 && cz < BOX.z1) { deleted++; continue; }
      keep.push(...tri);
    }
    if (keep.length < idx.getCount()) {
      const fresh = doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(keep)).setBuffer(root.listBuffers()[0]);
      const old = prim.getIndices(); prim.setIndices(fresh);
      if (old.listParents().every((p) => p.propertyType !== 'Primitive')) old.dispose();
    }
  }
  report.verge_tab_triangles_removed = deleted;
}

// --------------------------------------------------- new closing geometry
const material = (name) => {
  const m = root.listMaterials().find((mm) => baseName(mm.getName()) === name);
  if (!m) throw new Error(`villa.glb carries no ${name}`);
  return m;
};
const buffer = root.listBuffers()[0];
function builder(nodeName, matName) {
  const position = [], normal = [], uv = [], index = [];
  const quad = (a, b, c, d) => {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(...n) || 1; n = n.map((s) => s / l);
    const base = position.length / 3;
    for (const p of [a, b, c, d]) { position.push(...p); normal.push(...n); uv.push(p[0] + p[2], p[1]); }
    index.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const commit = () => {
    if (!index.length) return 0;
    const mesh = doc.createMesh(nodeName);
    const accessor = (array, type) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
    mesh.addPrimitive(doc.createPrimitive()
      .setAttribute('POSITION', accessor(new Float32Array(position), 'VEC3'))
      .setAttribute('NORMAL', accessor(new Float32Array(normal), 'VEC3'))
      .setAttribute('TEXCOORD_0', accessor(new Float32Array(uv), 'VEC2'))
      .setIndices(accessor(new Uint32Array(index), 'SCALAR'))
      .setMaterial(material(matName)));
    root.listScenes()[0].addChild(doc.createNode(nodeName).setMesh(mesh)
      .setExtras({ category: 'fixed', note: 'R44 roof junction closure' }));
    return index.length / 3;
  };
  return { quad, commit };
}

// ---- A | wall flashing along the NW wing / attic-wall junction:
// a continuous dark apron hugging the tile profile, median-smoothed so
// tile course steps do not serrate it.
{
  const X_WALL = -3.655, X_OUT = -3.92, RISE = 0.13, LIFT = 0.015, DROP = 0.06;
  const Z0 = -8.18, Z1 = -5.85, STEP = 0.09;
  const raw = [];
  for (let z = Z0; z <= Z1 + 1e-6; z += STEP) {
    let t = -Infinity;
    for (let x = -3.96; x <= -3.68; x += 0.05) {
      const i = cellAt(x, z);
      if (i >= 0 && top[i] > t) t = top[i];
    }
    raw.push(Math.min(10.95, Math.max(9.6, t)));
  }
  const t5 = raw.map((_, i) => {
    const w = raw.slice(Math.max(0, i - 2), i + 3).sort((a, b) => a - b);
    return w[Math.floor(w.length / 2)];
  });
  const { quad, commit } = builder('R44 | NW wing wall flashing', 'wood_dark');
  for (let s = 0; s + 1 < t5.length; s++) {
    const za = Z0 + s * STEP, zb = Z0 + (s + 1) * STEP;
    const ta = t5[s], tb = t5[s + 1];
    quad([X_WALL, ta + LIFT + RISE, za], [X_WALL, tb + LIFT + RISE, zb], [X_WALL, tb + LIFT, zb], [X_WALL, ta + LIFT, za]);
    quad([X_WALL, ta + LIFT, za], [X_WALL, tb + LIFT, zb], [X_OUT, tb + LIFT, zb], [X_OUT, ta + LIFT, za]);
    quad([X_OUT, ta + LIFT, za], [X_OUT, tb + LIFT, zb], [X_OUT, tb + LIFT - DROP, zb], [X_OUT, ta + LIFT - DROP, za]);
  }
  report.flashing = { triangles: commit(), z: [Z0, Z1] };
}

// ---- B | the verge's raw end swallowed by a return block, plus a
// soffit strip, plus a wedge over the saw-toothed tile course below.
// The board's own line, measured off its end vertices:
// top(x) = 9.533 - 0.7 (x - 4.246), section height 0.34.
{
  const { quad, commit } = builder('R44 | SE gable verge closure', 'wood_dark');
  const topLine = (x) => 9.533 - 0.7 * (x - 4.246);
  const botLine = (x) => topLine(x) - 0.34;
  // end return block, slightly proud of the board on every side
  const bx0 = 4.08, bx1 = 4.30, bz0 = 4.70, bz1 = 4.94;
  const by0 = botLine(bx1) - 0.10, by1 = topLine(bx0) + 0.03;
  quad([bx0, by1, bz1], [bx1, by1, bz1], [bx1, by0, bz1], [bx0, by0, bz1]);   // front
  quad([bx1, by1, bz0], [bx0, by1, bz0], [bx0, by0, bz0], [bx1, by0, bz0]);   // back
  quad([bx1, by1, bz1], [bx1, by1, bz0], [bx1, by0, bz0], [bx1, by0, bz1]);   // end cap
  quad([bx0, by1, bz0], [bx1, by1, bz0], [bx1, by1, bz1], [bx0, by1, bz1]);   // top
  quad([bx0, by0, bz1], [bx1, by0, bz1], [bx1, by0, bz0], [bx0, by0, bz0]);   // bottom
  // soffit from the gable wall out to the board's inner face
  const sx0 = 4.20 - 0.35, sx1 = 4.30;
  quad([sx0, botLine(sx0), 4.26], [sx1, botLine(sx1), 4.26], [sx1, botLine(sx1), bz0], [sx0, botLine(sx0), bz0]);
  // the saw-toothed tile course one bay lower, covered by a matching wedge
  const qline = (x) => 9.06 + (x - 2.24) * ((8.52 - 9.06) / (3.02 - 2.24));  // slope kept, run extended
  const W0 = 5.42, W1 = 5.66, QX0 = 2.24, QX1 = 3.10, UP = 0.28, DOWN = 0.26;
  quad([QX0, qline(QX0) + UP, W1], [QX1, qline(QX1) + UP, W1], [QX1, qline(QX1) - DOWN, W1], [QX0, qline(QX0) - DOWN, W1]);
  quad([QX0, qline(QX0) - DOWN, W0], [QX1, qline(QX1) - DOWN, W0], [QX1, qline(QX1) + UP, W0], [QX0, qline(QX0) + UP, W0]);
  quad([QX0, qline(QX0) + UP, W0], [QX1, qline(QX1) + UP, W0], [QX1, qline(QX1) + UP, W1], [QX0, qline(QX0) + UP, W1]);
  quad([QX1, qline(QX1) + UP, W1], [QX1, qline(QX1) + UP, W0], [QX1, qline(QX1) - DOWN, W0], [QX1, qline(QX1) - DOWN, W1]);
  report.verge_closure_triangles = commit();
}

// ------------------------------------------------------------------ write
await doc.transform(prune());
for (const ext of root.listExtensionsUsed())
  if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
const plain = `${FULL}/villa.plain.glb`;
writeFileSync(plain, await io.writeBinary(doc));
execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, FILE,
  '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'pipe' });
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
  const asset = manifest.assets.find((a) => a.id === 'villa');
  asset.bytes = raw.length;
  asset.sha256 = createHash('sha256').update(raw).digest('hex');
  asset.triangles = triangles;
  writeFileSync(path, JSON.stringify(manifest, null, 2));
}
const mirror = ROOT + '/viewer/public/models/full/villa.glb';
if (existsSync(mirror)) writeFileSync(mirror, raw);
writeFileSync(ROOT + '/build/roof-junction-patch-r44.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
console.log(`villa.glb: ${triangles} triangles, ${raw.length} bytes`);
