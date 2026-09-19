// R43 | Put the attic shell back where it stood ten commits ago.
//
// The review marks one roof wing: "işaretli olan çatı kanadı yanlışlıkla bir
// hata sonucu alçağa alındı, ve saçma birşey oldu. duvar yüksekliği de çatının
// konumu da yanlış ve alçak."
//
// Measured against the delivery at 7ff3a54, which is where the native model
// line branched off: the roof over the attic dropped by up to 1.63 m across
// 19.5 m², a hip edge at x 4.13 lost 2.65 m, and the C05 paintings and the
// fittings beside them now stand proud of the roof they are supposed to be
// under - which is the "saçma şey" the mark is drawn around. The cause is
// visible in the node table: `F3 | ÇATII` went from 10,958 triangles to 2,971
// and three new pieces were laid over the hole it left (`Source high hall
// roof`, `Source high hall white ceiling`, `Corrected continuous inner roof
// lining`), sitting lower than the shell they replaced. c50d6a9 lowered it
// first, 5562f2e put it back, aff34eb lowered it again and 58aebe1 recovered
// only part of it.
//
// So the attic shell - roof, fascia, wave course, wall, wall lining and the
// partition core behind it - is taken wholesale from 7ff3a54 and the pieces
// that replaced it are removed. Wholesale rather than by region because that
// is what went wrong in the first place: the shell is one surface, and cutting
// a new piece into part of it is what left the wing hanging. Nothing else in
// the storey is touched, so the new rooms, doors, furniture and fittings all
// stay as they are - and they fit, because the shell they now sit under is the
// higher one they were modelled against before it dropped.
//
// Materials come across with the geometry, so the shell keeps the finishes it
// had. The family matcher in material-response.js strips the `.00n` suffix
// glTF gives a duplicate name, so `stucco` and `stucco.003` land in the same
// family and the restored surfaces are lit like the ones around them.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { mergeDocuments, prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const FILE = FULL + '/level-3.glb';
const FROM = process.env.FROM || '7ff3a54';        // the delivery to restore from
// What the attic shell is. The first six are restored; the last four replaced
// parts of them and go.
const KEEP = [
  'F3 | ÇATII',
  'F3 | ÇATI ALIN',
  'F3 | ek dalgalar',
  'F3 | KAT 3$DUVAR',
  'F3 | KAT 3$DUVAR KAPLAMA',
  'F3 | Attic partition core',
];
const DROP = [
  'F3 | Source high hall roof',
  'F3 | Source high hall white ceiling',
  'F3 | Corrected continuous inner roof lining',
  'F3 | Hall parapet triangular gap closed',
];

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

// The roof the fittings have to sit under is both storeys' - the attic's own
// shell and the envelope's tile shells over it - so the test reads the two
// together and interpolates each triangle exactly rather than bucketing to a
// grid: a painting 0.45 m proud of a roof that slopes 0.3 m across its own
// width is missed by any raster coarse enough to be quick.
const ROOFNODE = /ÇATII|ÇATI ALIN|ek dalgalar|high hall roof|Corrected continuous inner roof lining|clay tile/i;
const FITTING_EXEMPT = /ÇATI|KAT 3\$DUVAR|Attic partition core|PENCERE|high hall|Corrected continuous|Hall parapet|ek dalgalar|clay tile|ridge|hip |valley|fascia|eaves|Chimney|ZEMİN/i;
const BUCKET = 0.5;
function roofLookup(docs) {
  const bucket = new Map();
  for (const doc of docs) for (const node of doc.getRoot().listNodes()) {
    if (!node.getMesh() || !ROOFNODE.test(node.getName())) continue;
    for (const T of worldTriangles(node)) {
      const x0 = Math.min(T[0][0], T[1][0], T[2][0]), x1 = Math.max(T[0][0], T[1][0], T[2][0]);
      const z0 = Math.min(T[0][2], T[1][2], T[2][2]), z1 = Math.max(T[0][2], T[1][2], T[2][2]);
      for (let i = Math.floor(x0 / BUCKET); i <= Math.floor(x1 / BUCKET); i++)
        for (let j = Math.floor(z0 / BUCKET); j <= Math.floor(z1 / BUCKET); j++) {
          const k = `${i},${j}`;
          (bucket.get(k) ?? bucket.set(k, []).get(k)).push(T);
        }
    }
  }
  return (x, z) => {
    let best = -Infinity;
    for (const [a, b, c] of bucket.get(`${Math.floor(x / BUCKET)},${Math.floor(z / BUCKET)}`) ?? []) {
      const det = (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
      if (Math.abs(det) < 1e-12) continue;
      const u = ((b[0] - a[0]) * (z - a[2]) - (b[2] - a[2]) * (x - a[0])) / det;
      const v = ((c[0] - b[0]) * (z - b[2]) - (c[2] - b[2]) * (x - b[0])) / det;
      if (u < -1e-6 || v < -1e-6 || 1 - u - v < -1e-6) continue;
      const y = v * a[1] + (1 - u - v) * b[1] + u * c[1];
      if (y > best) best = y;
    }
    return best;
  };
}
function piercing(doc, roofAt) {
  const out = [];
  for (const node of doc.getRoot().listNodes()) {
    if (!node.getMesh() || FITTING_EXEMPT.test(node.getName())) continue;
    let worst = 0;
    for (const tri of worldTriangles(node)) for (const [x, y, z] of tri) {
      const r = roofAt(x, z);
      if (Number.isFinite(r) && y - r > worst) worst = y - r;
    }
    if (worst > 0.03) out.push({ name: node.getName(), above: +worst.toFixed(3) });
  }
  return out.sort((a, b) => b.above - a.above);
}
const CELL = 0.10, GX0 = -9, GZ0 = -12, GNX = Math.ceil(18 / CELL), GNZ = Math.ceil(22 / CELL);
const SHELL = /ÇATII|ÇATI ALIN|ek dalgalar|high hall roof|Corrected continuous inner roof lining/;
function roofTop(doc) {
  const g = new Float32Array(GNX * GNZ).fill(-Infinity);
  for (const node of doc.getRoot().listNodes()) {
    if (!node.getMesh() || !SHELL.test(node.getName())) continue;
    for (const [a, b, c] of worldTriangles(node)) {
      const det = (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
      const lo = [Math.min(a[0], b[0], c[0]), Math.min(a[2], b[2], c[2])];
      const hi = [Math.max(a[0], b[0], c[0]), Math.max(a[2], b[2], c[2])];
      const slim = (hi[0] - lo[0]) < CELL || (hi[1] - lo[1]) < CELL || Math.abs(det) < 1e-12;
      const i0 = Math.max(0, Math.floor((lo[0] - GX0) / CELL)), i1 = Math.min(GNX - 1, Math.floor((hi[0] - GX0) / CELL));
      const j0 = Math.max(0, Math.floor((lo[1] - GZ0) / CELL)), j1 = Math.min(GNZ - 1, Math.floor((hi[1] - GZ0) / CELL));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const px = GX0 + (i + 0.5) * CELL, pz = GZ0 + (j + 0.5) * CELL;
        let y = Math.max(a[1], b[1], c[1]);
        if (!slim) {
          const u = ((b[0] - a[0]) * (pz - a[2]) - (b[2] - a[2]) * (px - a[0])) / det;
          const v = ((c[0] - b[0]) * (pz - b[2]) - (c[2] - b[2]) * (px - b[0])) / det;
          if (u < -0.02 || v < -0.02 || 1 - u - v < -0.02) continue;
          y = v * a[1] + (1 - u - v) * b[1] + u * c[1];
        }
        const k = j * GNX + i; if (y > g[k]) g[k] = y;
      }
    }
  }
  return g;
}
// ------------------------------------------------------------------ restore
const older = `${FULL}/level-3.${FROM}.glb`;
writeFileSync(older, execFileSync('git', ['show', `${FROM}:build/web/full/level-3.glb`],
  { cwd: ROOT, maxBuffer: 1 << 28, encoding: 'buffer' }));
const old = await io.read(older);
const doc = await io.read(FILE);
const envelope = await io.read(FULL + '/envelope.glb');
// Everything the attic carried ten commits ago, so nothing that predates the
// regression can be removed by this tool - only what arrived with it.
const inherited = new Set(old.getRoot().listNodes().map((n) => n.getName()));

const beforeRoof = roofTop(doc);
const beforePierce = piercing(doc, roofLookup([doc, envelope]));
console.log(`before: ${beforePierce.length} fittings pierce the roof` +
  (beforePierce.length ? ` (worst ${beforePierce[0].name}, +${beforePierce[0].above} m)` : ''));

let removed = 0, removedTriangles = 0;
for (const node of doc.getRoot().listNodes()) {
  if (![...KEEP, ...DROP].includes(node.getName())) continue;
  const mesh = node.getMesh(); if (!mesh) continue;
  for (const p of mesh.listPrimitives())
    removedTriangles += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
  node.dispose(); mesh.dispose(); removed++;
}
console.log(`${removed} shell nodes removed (${Math.round(removedTriangles)} triangles)`);

// Bring the old delivery in whole, keep the shell, drop the rest of it.
const scene = doc.getRoot().listScenes()[0];
const mine = new Set(scene.listChildren());
mergeDocuments(doc, old);
let restored = 0, restoredTriangles = 0;
for (const other of doc.getRoot().listScenes()) {
  if (other === scene) continue;
  for (const node of other.listChildren()) {
    if (KEEP.includes(node.getName()) && node.getMesh()) {
      other.removeChild(node); scene.addChild(node); restored++;
      for (const p of node.getMesh().listPrimitives())
        restoredTriangles += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
    }
  }
  for (const node of other.listChildren()) { const m = node.getMesh(); node.dispose(); m?.dispose(); }
  other.dispose();
}
if (restored !== KEEP.length) throw new Error(`restored ${restored} of ${KEEP.length} shell nodes`);
console.log(`${restored} shell nodes restored from ${FROM} (${Math.round(restoredTriangles)} triangles)`);
unlinkSync(older);

// --------------------------------------------- and what the wing left behind
// The shell coming back up does not save the fittings hung above where it ever
// reached. Four framed pictures and the round window in C05 stand up to 0.45 m
// through a roof that never moved under them - they were placed against a wall
// taller than the one delivered, which is the other half of "duvar yüksekliği
// de çatının konumu da yanlış ve alçak". They are taken back with the rest of
// the wing: none of them existed ten commits ago, and this tool removes only
// what did not.
const afterRestore = piercing(doc, roofLookup([doc, envelope]));
const dropped = [];
for (const node of doc.getRoot().listNodes()) {
  const hit = afterRestore.find((p) => p.name === node.getName());
  if (!hit || inherited.has(node.getName())) continue;
  const mesh = node.getMesh();
  node.dispose(); mesh?.dispose();
  dropped.push(hit);
}
if (dropped.length) console.log(`${dropped.length} fittings removed, hung up to ` +
  `${dropped[0].above} m above the roof and none of them older than the wing`);
for (const p of afterRestore) if (inherited.has(p.name))
  console.log(`   kept (older than the wing): ${p.name} +${p.above} m`);

// ------------------------------------------------------------------- verify
const afterRoof = roofTop(doc);
const afterPierce = piercing(doc, roofLookup([doc, envelope]));
let raised = 0, lowered = 0, worstRise = 0;
for (let k = 0; k < afterRoof.length; k++) {
  const a = beforeRoof[k], b = afterRoof[k];
  if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
  if (b - a > 0.02) { raised++; worstRise = Math.max(worstRise, b - a); }
  if (a - b > 0.02) lowered++;
}
console.log(`roof raised over ${(raised * CELL * CELL).toFixed(1)} m² (worst +${worstRise.toFixed(2)} m), ` +
  `lowered over ${(lowered * CELL * CELL).toFixed(1)} m²`);
console.log(`after: ${afterPierce.length} fittings pierce the roof`);
for (const p of afterPierce.slice(0, 5)) console.log(`   +${p.above} m  ${p.name}`);
if (afterPierce.length > beforePierce.length)
  throw new Error('the restore left more fittings sticking through the roof than it found');

await doc.transform(prune());
// The merge brings the old delivery's buffer with it, and a GLB carries one.
const buffer = doc.getRoot().listBuffers()[0];
for (const accessor of doc.getRoot().listAccessors()) accessor.setBuffer(buffer);
for (const spare of doc.getRoot().listBuffers().slice(1)) spare.dispose();
for (const ext of doc.getRoot().listExtensionsUsed())
  if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
const plain = `${FULL}/level-3.plain.glb`;
writeFileSync(plain, await io.writeBinary(doc));
execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, FILE,
  '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
unlinkSync(plain);

const raw = readFileSync(FILE);
let triangles = 0;
for (const node of (await io.read(FILE)).getRoot().listNodes()) {
  const mesh = node.getMesh(); if (!mesh) continue;
  for (const p of mesh.listPrimitives())
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
writeFileSync(ROOT + '/build/attic-shell-restore-r43.json', JSON.stringify({
  generated_for: 'R43', restored_from: FROM,
  restored_nodes: KEEP, removed_nodes: DROP,
  removed_triangles: Math.round(removedTriangles), restored_triangles: Math.round(restoredTriangles),
  roof_raised_m2: +(raised * CELL * CELL).toFixed(2), roof_worst_rise_m: +worstRise.toFixed(3),
  roof_lowered_m2: +(lowered * CELL * CELL).toFixed(2),
  piercing_before: beforePierce, piercing_after: afterPierce,
  fittings_removed: dropped,
  asset_bytes: raw.length, asset_triangles: triangles,
}, null, 2));
console.log(`level-3.glb: ${triangles} triangles, ${raw.length} bytes`);
