// R44 | Nothing pokes through the tiles, nothing lies stranded on them.
//
// "çatıdan sarkan duvarları hizalı şekilde trimle. çerçeveler de çıkmış
//  onları da kaldır."
//
// Measured on the delivery: a row of frame parts - wood_dark and
// white_trim fragments of the 'architecture' pass - lies ON the north
// slope around x -2.7..-5.6, y 11.3..11.8, z -3.0..-3.6, floating 4-15 cm
// proud of the clay tiles; and at the front porch a stucco band (y ~10.1,
// z ~4.27) rises past the porch gable's tile line into the air gap under
// the main slope.
//
// The rule reads the roof as layered cover: every cell of a 7.5 cm grid
// keeps the tops of each clay-tile layer that crosses it (a porch roof
// under the main slope is two layers). A wall/trim vertex offends when it
// stands >3.5 cm above the highest layer beneath it AND is either open to
// the sky or >15 cm below the next layer (the air gap). Triangles fully
// made of offenders are deleted when they sit >=35 cm inside the tile
// footprint (fascia and verge boards live at the edges), off the ridge
// crests (ridge boards live there), and outside the chimney's own box.
// Crossing triangles are trimmed instead: offending stucco/interior/trim
// vertices drop to their layer top minus 12 mm, so wall tops follow the
// tile line - aligned, as asked.
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
const LAYER_GAP = 0.25;          // separate tile layers further apart than this
const ABOVE = 0.035;             // proud of the layer by more than this offends
const AIR_GAP = 0.15;            // ... unless a higher layer sits closer than this
const EDGE_GUARD = 5;            // cells (~0.38 m): fascia/verge stay untouched
const CLAMP_DROP = 0.012;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(FILE);
const root = doc.getRoot();

const baseName = (name = '') => name.replace(/\.\d{3}$/, '');
const TILE = (m) => /^Clay tile \d+$/.test(baseName(m));
const TARGET = new Set(['stucco', 'interior', 'white_trim', 'wood_dark', 'wood_honey', 'glass', 'ceiling']);
const CLAMPABLE = new Set(['stucco', 'interior', 'white_trim', 'ceiling']);

// ---------------------------------------------------------------- pass 1
// world triangles per prim; only identity-transform nodes are edited, so
// verify the merged villa still holds that shape.
const prims = [];   // {prim, matBase, nodeName, identity}
for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const m = node.getMatrix();
  const identity = m.every((v, i) => Math.abs(v - (i % 5 === 0 ? 1 : 0)) < 1e-9);
  for (const prim of mesh.listPrimitives()) {
    prims.push({ prim, matBase: baseName(prim.getMaterial()?.getName() ?? ''), nodeName: node.getName(), identity });
  }
}

// tile layer field
let bx0 = Infinity, bz0 = Infinity, bx1 = -Infinity, bz1 = -Infinity;
const tileTris = [];
for (const { prim, matBase, identity } of prims) {
  if (!TILE(matBase) || !identity) continue;
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
const cellLayers = Array.from({ length: W * H }, () => []);   // sorted tops, low->high
const ci = (x, z) => {
  const ix = Math.floor((x - bx0) / CELL), iz = Math.floor((z - bz0) / CELL);
  return ix < 0 || iz < 0 || ix >= W || iz >= H ? -1 : iz * W + ix;
};
for (const t of tileTris) {
  const xs = t.map((p) => p[0]), zs = t.map((p) => p[2]);
  const y = Math.max(t[0][1], t[1][1], t[2][1]);
  const ix0 = Math.max(0, Math.floor((Math.min(...xs) - bx0) / CELL)), ix1 = Math.min(W - 1, Math.floor((Math.max(...xs) - bx0) / CELL));
  const iz0 = Math.max(0, Math.floor((Math.min(...zs) - bz0) / CELL)), iz1 = Math.min(H - 1, Math.floor((Math.max(...zs) - bz0) / CELL));
  for (let iz = iz0; iz <= iz1; iz++) for (let ix = ix0; ix <= ix1; ix++) {
    const layers = cellLayers[iz * W + ix];
    let placed = false;
    for (let l = 0; l < layers.length; l++) {
      if (Math.abs(layers[l] - y) < LAYER_GAP) { if (y > layers[l]) layers[l] = y; placed = true; break; }
    }
    if (!placed) { layers.push(y); layers.sort((a, b) => a - b); }
  }
}
// edge distance in cells (erosion rounds)
const inside = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) inside[i] = cellLayers[i].length ? 1 : 0;
const edgeDist = new Uint8Array(W * H).fill(255);
let frontier = [];
for (let iz = 0; iz < H; iz++) for (let ix = 0; ix < W; ix++) {
  const i = iz * W + ix;
  if (!inside[i]) { edgeDist[i] = 0; continue; }
  if (ix === 0 || iz === 0 || ix === W - 1 || iz === H - 1 ||
      !inside[i - 1] || !inside[i + 1] || !inside[i - W] || !inside[i + W]) { edgeDist[i] = 1; frontier.push(i); }
}
for (let d = 2; d <= EDGE_GUARD + 1 && frontier.length; d++) {
  const next = [];
  for (const i of frontier) for (const j of [i - 1, i + 1, i - W, i + W]) {
    if (j >= 0 && j < W * H && inside[j] && edgeDist[j] > d) { edgeDist[j] = d; next.push(j); }
  }
  frontier = next;
}
// ridge crest cells: top layer within 8 cm of the 5x5 window max
const crest = new Uint8Array(W * H);
for (let iz = 2; iz < H - 2; iz++) for (let ix = 2; ix < W - 2; ix++) {
  const i = iz * W + ix;
  if (!inside[i]) continue;
  const top = cellLayers[i][cellLayers[i].length - 1];
  let windowMax = -Infinity;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const l = cellLayers[(iz + dz) * W + ix + dx];
    if (l.length) windowMax = Math.max(windowMax, l[l.length - 1]);
  }
  if (top >= windowMax - 0.08) crest[i] = 1;
}

// chimney box(es): wall material vertices rising past the ridge line
const chimney = [];
{
  const pts = [];
  for (const { prim, matBase, identity } of prims) {
    if (!identity || !['stucco', 'interior', 'white_trim'].includes(matBase)) continue;
    const pos = prim.getAttribute('POSITION'); const el = [0, 0, 0];
    for (let i = 0; i < pos.getCount(); i++) { pos.getElement(i, el); if (el[1] > 12.95) pts.push([el[0], el[2]]); }
  }
  const taken = new Set();
  for (let a = 0; a < pts.length; a++) {
    if (taken.has(a)) continue;
    let x0 = pts[a][0], x1 = pts[a][0], z0 = pts[a][1], z1 = pts[a][1];
    let grew = true;
    taken.add(a);
    while (grew) {
      grew = false;
      for (let b = 0; b < pts.length; b++) {
        if (taken.has(b)) continue;
        if (pts[b][0] > x0 - 1 && pts[b][0] < x1 + 1 && pts[b][1] > z0 - 1 && pts[b][1] < z1 + 1) {
          x0 = Math.min(x0, pts[b][0]); x1 = Math.max(x1, pts[b][0]);
          z0 = Math.min(z0, pts[b][1]); z1 = Math.max(z1, pts[b][1]);
          taken.add(b); grew = true;
        }
      }
    }
    chimney.push({ x0: x0 - 0.45, x1: x1 + 0.45, z0: z0 - 0.45, z1: z1 + 0.45 });
  }
}
const inChimney = (x, z) => chimney.some((c) => x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1);

// vertex verdict: {ref} the layer it stands proud of, or null
function offends(x, y, z) {
  const i = ci(x, z);
  if (i < 0 || !inside[i] || inChimney(x, z)) return null;
  const layers = cellLayers[i];
  let ref = null, above = null;
  for (const l of layers) { if (y > l + ABOVE) ref = l; else if (above === null && y < l) above = l; }
  if (ref === null) return null;
  if (above !== null && above - y < AIR_GAP) return null;   // tight under the next roof: it belongs to it
  return { ref, i };
}

// ---------------------------------------------------------------- pass 2
const report = { deleted: {}, clamped: {}, skipped_nonidentity: 0, chimney };
for (const { prim, matBase, nodeName, identity } of prims) {
  if (!TARGET.has(matBase)) continue;
  const pos = prim.getAttribute('POSITION'); const idx = prim.getIndices();
  if (!pos || !idx) continue;
  if (!identity) {
    // detect-only for transformed nodes; expected empty
    continue;
  }
  const el = [0, 0, 0];
  const verdicts = new Map();   // vertex index -> offends() result or null
  const verdictOf = (vi) => {
    if (!verdicts.has(vi)) { pos.getElement(vi, el); verdicts.set(vi, offends(el[0], el[1], el[2])); }
    return verdicts.get(vi);
  };
  const keep = [];
  let deleted = 0;
  const clampTargets = new Map();   // vi -> ref
  for (let i = 0; i < idx.getCount(); i += 3) {
    const tri = [idx.getScalar(i), idx.getScalar(i + 1), idx.getScalar(i + 2)];
    const v = tri.map(verdictOf);
    const bad = v.filter(Boolean).length;
    if (bad === 3) {
      // fully proud of the tiles: delete, unless it hugs the footprint edge
      // (fascia, verge) or rides a ridge crest (ridge boards)
      let cx = 0, cz = 0;
      for (const vi of tri) { pos.getElement(vi, el); cx += el[0] / 3; cz += el[2] / 3; }
      const i2 = ci(cx, cz);
      const guarded = i2 < 0 || edgeDist[i2] <= EDGE_GUARD || crest[i2];
      if (!guarded) { deleted++; report.deleted[matBase] = (report.deleted[matBase] || 0) + 1; continue; }
    }
    if (bad > 0 && CLAMPABLE.has(matBase)) {
      for (let k = 0; k < 3; k++) if (v[k]) {
        const i2 = v[k].i;
        if (edgeDist[i2] > EDGE_GUARD && !crest[i2]) clampTargets.set(tri[k], v[k].ref);
      }
    }
    keep.push(...tri);
  }
  for (const [vi, ref] of clampTargets) {
    pos.getElement(vi, el);
    el[1] = ref - CLAMP_DROP;
    pos.setElement(vi, el);
    report.clamped[matBase] = (report.clamped[matBase] || 0) + 1;
  }
  if (deleted) {
    const fresh = doc.createAccessor().setType('SCALAR')
      .setArray(new Uint32Array(keep)).setBuffer(root.listBuffers()[0]);
    const old = prim.getIndices(); prim.setIndices(fresh);
    if (old.listParents().every((p) => p.propertyType !== 'Primitive')) old.dispose();
  }
  if (deleted || clampTargets.size) report[nodeName] = { deleted, clamped: clampTargets.size };
}

// ---------------------------------------------------------------- pass 3
// The stranded debris is a picture-frame assembly the import left on the
// north slope: 'C05 | Original four framed paintings' canvases with their
// wood_dark bars (pass 2 took those) and one white_trim curl. Canvases
// have no business above the rooms at all, so any of that material above
// y 10.8 goes; the white curl goes by its own measured box, far from any
// dormer frame or the chimney cap.
{
  const CURL = { x0: -5.75, x1: -5.1, y0: 11.2, y1: 11.75, z0: -3.75, z1: -3.2 };
  // the frame bars all hang on one plane, measured z -3.52, mid-slope -
  // no fascia, verge, ridge board or chimney comes near this slab
  const BARS = { x0: -5.75, x1: -2.4, y0: 11.05, y1: 12.1, z0: -3.72, z1: -3.42 };
  for (const { prim, matBase, identity } of prims) {
    if (!identity) continue;
    const isCanvas = matBase === 'C05 | Original four framed paintings';
    const isTrim = matBase === 'white_trim';
    const isBar = matBase === 'wood_dark';
    if (!isCanvas && !isTrim && !isBar) continue;
    const pos = prim.getAttribute('POSITION'); const idx = prim.getIndices();
    if (!pos || !idx) continue;
    const el = [0, 0, 0];
    const keep = [];
    let deleted = 0;
    for (let i = 0; i < idx.getCount(); i += 3) {
      const tri = [idx.getScalar(i), idx.getScalar(i + 1), idx.getScalar(i + 2)];
      let cx = 0, cy = 0, cz = 0;
      for (const vi of tri) { pos.getElement(vi, el); cx += el[0] / 3; cy += el[1] / 3; cz += el[2] / 3; }
      const strandedCanvas = isCanvas && cy > 10.8;
      const strandedCurl = isTrim && cx > CURL.x0 && cx < CURL.x1 && cy > CURL.y0 && cy < CURL.y1 && cz > CURL.z0 && cz < CURL.z1;
      const strandedBar = isBar && cx > BARS.x0 && cx < BARS.x1 && cy > BARS.y0 && cy < BARS.y1 && cz > BARS.z0 && cz < BARS.z1;
      if (strandedCanvas || strandedCurl || strandedBar) { deleted++; continue; }
      keep.push(...tri);
    }
    if (deleted) {
      const fresh = doc.createAccessor().setType('SCALAR')
        .setArray(new Uint32Array(keep)).setBuffer(root.listBuffers()[0]);
      const old = prim.getIndices(); prim.setIndices(fresh);
      if (old.listParents().every((p) => p.propertyType !== 'Primitive')) old.dispose();
      report.deleted[matBase + ' (stranded)'] = (report.deleted[matBase + ' (stranded)'] || 0) + deleted;
    }
  }
}

// ---------------------------------------------------------------- write
await doc.transform(prune());
for (const ext of root.listExtensionsUsed())
  if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
const plain = `${FULL}/villa.plain.glb`;
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
  const asset = manifest.assets.find((a) => a.id === 'villa');
  asset.bytes = raw.length;
  asset.sha256 = createHash('sha256').update(raw).digest('hex');
  asset.triangles = triangles;
  writeFileSync(path, JSON.stringify(manifest, null, 2));
}
const mirror = ROOT + '/viewer/public/models/full/villa.glb';
if (existsSync(mirror)) writeFileSync(mirror, raw);
writeFileSync(ROOT + '/build/roof-trim-r44.json', JSON.stringify(report, null, 2));
console.log('deleted', JSON.stringify(report.deleted), 'clamped', JSON.stringify(report.clamped));
console.log(`villa.glb: ${triangles} triangles, ${raw.length} bytes`);
