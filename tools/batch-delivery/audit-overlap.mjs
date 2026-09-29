// Üst üste binen yüzey denetimi (z-fighting) - GPU gerekmez.
//
//   node audit-overlap.mjs [model.glb]     (varsayılan build/bake/tur10/BUILDING-opt-v6-lm.glb)
//
// Farklı malzemeli iki yüzey 3 mm'den yakın ve paralelse sitede titreyen /
// yamalı görünür (Tur 10'da eski yüzeyin üstüne yeni yüzey konmasıyla olur).
// Her üçgenin ağırlık merkezinden normali boyunca ±3 mm'lik doğru parçası
// atılır; başka malzemeden, normali aynı yöne bakan (cos > 0,98) bir üçgene
// değerse çakışma sayılır. Malzeme çifti başına alan raporlanır.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeFileSync} from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '../..');
const FILE = process.argv[2] ?? path.join(REPO, 'build/bake/tur10/BUILDING-opt-v6-lm.glb');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder': await draco3d.createDecoderModule()});
const EPS = 0.003, CELL = 0.2, MIN_AREA = 1e-4;

const doc = await io.read(FILE), T = [];
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh(); if (!mesh) continue;
  const w = node.getWorldMatrix();
  for (const prim of mesh.listPrimitives()) {
    const mat = prim.getMaterial()?.getName() ?? '';
    const pos = prim.getAttribute('POSITION'), idx = prim.getIndices(), v = [0, 0, 0];
    const P = i => {pos.getElement(i, v); return [w[0]*v[0]+w[4]*v[1]+w[8]*v[2]+w[12], w[1]*v[0]+w[5]*v[1]+w[9]*v[2]+w[13], w[2]*v[0]+w[6]*v[1]+w[10]*v[2]+w[14]];};
    const n = idx ? idx.getCount() : pos.getCount();
    for (let t = 0; t < n; t += 3) {
      const a = P(idx ? idx.getScalar(t) : t), b = P(idx ? idx.getScalar(t + 1) : t + 1), c = P(idx ? idx.getScalar(t + 2) : t + 2);
      const u = [b[0]-a[0], b[1]-a[1], b[2]-a[2]], q = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];
      const nn = [u[1]*q[2]-u[2]*q[1], u[2]*q[0]-u[0]*q[2], u[0]*q[1]-u[1]*q[0]], len = Math.hypot(...nn);
      if (len / 2 < MIN_AREA) continue;
      T.push({a, b, c, n: nn.map(x => x / len), area: len / 2, mat});
    }
  }
}
const g = new Map(), key = (x, y, z) => `${x},${y},${z}`;
T.forEach((t, i) => {
  const lo = [0, 1, 2].map(k => Math.floor((Math.min(t.a[k], t.b[k], t.c[k]) - EPS) / CELL));
  const hi = [0, 1, 2].map(k => Math.floor((Math.max(t.a[k], t.b[k], t.c[k]) + EPS) / CELL));
  if ((hi[0]-lo[0]+1) * (hi[1]-lo[1]+1) * (hi[2]-lo[2]+1) > 20000) return;
  for (let x = lo[0]; x <= hi[0]; x++) for (let y = lo[1]; y <= hi[1]; y++) for (let z = lo[2]; z <= hi[2]; z++) {
    const k = key(x, y, z); (g.get(k) ?? g.set(k, []).get(k)).push(i);
  }
});
// Möller-Trumbore, doğru parçası o + d*s, s in [-1, 1]
function hit(o, d, t) {
  const e1 = [t.b[0]-t.a[0], t.b[1]-t.a[1], t.b[2]-t.a[2]], e2 = [t.c[0]-t.a[0], t.c[1]-t.a[1], t.c[2]-t.a[2]];
  const p = [d[1]*e2[2]-d[2]*e2[1], d[2]*e2[0]-d[0]*e2[2], d[0]*e2[1]-d[1]*e2[0]];
  const det = e1[0]*p[0] + e1[1]*p[1] + e1[2]*p[2]; if (Math.abs(det) < 1e-14) return false;
  const s = [o[0]-t.a[0], o[1]-t.a[1], o[2]-t.a[2]], inv = 1 / det;
  const u = (s[0]*p[0] + s[1]*p[1] + s[2]*p[2]) * inv; if (u < 0 || u > 1) return false;
  const qv = [s[1]*e1[2]-s[2]*e1[1], s[2]*e1[0]-s[0]*e1[2], s[0]*e1[1]-s[1]*e1[0]];
  const v = (d[0]*qv[0] + d[1]*qv[1] + d[2]*qv[2]) * inv; if (v < 0 || u + v > 1) return false;
  const tt = (e2[0]*qv[0] + e2[1]*qv[1] + e2[2]*qv[2]) * inv; return tt >= -1 && tt <= 1;
}
const pairs = new Map();
T.forEach((t, i) => {
  const o = [0, 1, 2].map(k => (t.a[k] + t.b[k] + t.c[k]) / 3), d = t.n.map(x => x * EPS);
  const cell = g.get(key(...o.map(x => Math.floor(x / CELL)))) ?? [];
  for (const j of cell) {
    if (j === i) continue; const u = T[j];
    if (u.mat === t.mat) continue;
    if (u.n[0]*t.n[0] + u.n[1]*t.n[1] + u.n[2]*t.n[2] < 0.98) continue; // yalnız AYNI yöne bakan (sırt sırta yüzler titreşmez)
    if (!hit(o, d, u)) continue;
    const k = [t.mat, u.mat].sort().join('  <->  ');
    const r = pairs.get(k) ?? pairs.set(k, {alan: 0, ornek: o.map(x => +x.toFixed(2))}).get(k);
    r.alan += t.area / 2; break;   // iki taraf da sayılır, yarısı
  }
});
const report = [...pairs].map(([k, r]) => ({cift: k, alan_m2: +r.alan.toFixed(2), ornek: r.ornek})).sort((a, b) => b.alan_m2 - a.alan_m2);
console.log('üçgen', T.length, '| çakışan malzeme çifti', report.length);
for (const r of report.slice(0, 25)) console.log(String(r.alan_m2).padStart(8), 'm² |', r.cift, '|', r.ornek.join(','));
writeFileSync(process.env.CIKTI ?? path.join(REPO, 'build/bake/tur10/cakisma.json'), JSON.stringify(report, null, 1));
