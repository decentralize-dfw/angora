// Mobilya çakışma denetimi - GPU gerekmez.
//   node audit-mobilya.mjs
// 1) kutu: her MOBILYA_ düğümünün dünya kutusu (3 cm içeri) içine BUILDING'in zemin
//    dışı bir köşesi (duvar, şömine, kapı, radyatör, cam) düşüyor mu?
// 2) kenar: mobilyanın üçgen kenarları BUILDING'in zemin dışı bir üçgenini deliyor mu?
//    (1 yalnız köşeye bakar: köşeleri kutunun dışında kalan geniş bir duvar
//    düzlemini kaçırır; 2 bunu yakalar - mobilya duvara/cama gömülmüşse kenarı keser.)
//    Çok gruplu parçalarda (ör. kanepe + TV) kutu boşluğu kapsayabilir: karar kenar testinindir.
import {NodeIO, getBounds} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const B = await io.read('../../build/bake/tur10/BUILDING-opt-v6-lm.glb'), I = await io.read('../../build/bake/tur10/INTERIOR-opt-v3-sahne.glb');
const FLOOR = /^(WOOD-FL|wood_floor|terra_floor|terra_floor_giris|stone_tile|RR|R31 \| R33 .*tile|EK_M1_Sicak_ceviz_supurgelik)$/;
function triangles(node) {
  const mesh = node.getMesh(), w = node.getWorldMatrix(), out = [];
  for (const prim of mesh.listPrimitives()) {
    const mat = prim.getMaterial()?.getName() ?? '';
    const pos = prim.getAttribute('POSITION'), idx = prim.getIndices(), v = [0, 0, 0];
    const P = i => {pos.getElement(i, v); return [w[0]*v[0]+w[4]*v[1]+w[8]*v[2]+w[12], w[1]*v[0]+w[5]*v[1]+w[9]*v[2]+w[13], w[2]*v[0]+w[6]*v[1]+w[10]*v[2]+w[14]];};
    const n = idx ? idx.getCount() : pos.getCount();
    for (let t = 0; t < n; t += 3) out.push({a: P(idx ? idx.getScalar(t) : t), b: P(idx ? idx.getScalar(t + 1) : t + 1), c: P(idx ? idx.getScalar(t + 2) : t + 2), mat});
  }
  return out;
}
const BT = [];
for (const node of B.getRoot().listNodes()) if (node.getMesh()) for (const t of triangles(node)) if (!FLOOR.test(t.mat)) BT.push(t);
const CELL = 0.25, grid = new Map(), key = (x, y, z) => `${x},${y},${z}`;
BT.forEach((t, i) => {
  const lo = [0, 1, 2].map(k => Math.floor(Math.min(t.a[k], t.b[k], t.c[k]) / CELL)), hi = [0, 1, 2].map(k => Math.floor(Math.max(t.a[k], t.b[k], t.c[k]) / CELL));
  if ((hi[0]-lo[0]+1) * (hi[1]-lo[1]+1) * (hi[2]-lo[2]+1) > 20000) return;
  for (let x = lo[0]; x <= hi[0]; x++) for (let y = lo[1]; y <= hi[1]; y++) for (let z = lo[2]; z <= hi[2]; z++) {const k = key(x, y, z); (grid.get(k) ?? grid.set(k, []).get(k)).push(i);}
});
// doğru parçası p->q üçgeni kesiyor mu (uçlar hariç, Möller-Trumbore)
function crosses(p, q, t) {
  const d = [q[0]-p[0], q[1]-p[1], q[2]-p[2]];
  const e1 = [t.b[0]-t.a[0], t.b[1]-t.a[1], t.b[2]-t.a[2]], e2 = [t.c[0]-t.a[0], t.c[1]-t.a[1], t.c[2]-t.a[2]];
  const h = [d[1]*e2[2]-d[2]*e2[1], d[2]*e2[0]-d[0]*e2[2], d[0]*e2[1]-d[1]*e2[0]];
  const det = e1[0]*h[0] + e1[1]*h[1] + e1[2]*h[2]; if (Math.abs(det) < 1e-12) return false;
  const s = [p[0]-t.a[0], p[1]-t.a[1], p[2]-t.a[2]], inv = 1 / det;
  const u = (s[0]*h[0] + s[1]*h[1] + s[2]*h[2]) * inv; if (u < 0 || u > 1) return false;
  const qq = [s[1]*e1[2]-s[2]*e1[1], s[2]*e1[0]-s[0]*e1[2], s[0]*e1[1]-s[1]*e1[0]];
  const v = (d[0]*qq[0] + d[1]*qq[1] + d[2]*qq[2]) * inv; if (v < 0 || u + v > 1) return false;
  const r = (e2[0]*qq[0] + e2[1]*qq[1] + e2[2]*qq[2]) * inv; return r > 0.02 && r < 0.98;
}
const pts = BT.flatMap(t => [[...t.a, t.mat], [...t.b, t.mat], [...t.c, t.mat]]);
let bad = 0;
for (const node of I.getRoot().listNodes()) {
  if (!node.getName().startsWith('MOBILYA_')) continue;
  const b = getBounds(node), m = 0.03, box = {};
  for (const [x, y, z, mat] of pts) if (x > b.min[0] + m && x < b.max[0] - m && y > b.min[1] + m && y < b.max[1] - m && z > b.min[2] + m && z < b.max[2] - m) box[mat] = (box[mat] ?? 0) + 1;
  const edge = {}, seen = new Set();
  for (const t of triangles(node)) for (const [p, q] of [[t.a, t.b], [t.b, t.c], [t.c, t.a]]) {
    // zemine değen ayak/taban kenarları sayılmaz (zemin süzülmüş olsa da süpürgelik payı): 1 cm üstü
    if (Math.min(p[1], q[1]) < b.min[1] + 0.01) continue;
    const mid = [(p[0]+q[0])/2, (p[1]+q[1])/2, (p[2]+q[2])/2];
    for (const i of grid.get(key(...mid.map(c => Math.floor(c / CELL)))) ?? []) {
      if (seen.has(i) || !crosses(p, q, BT[i])) continue;
      seen.add(i);
      const r = edge[BT[i].mat] ?? (edge[BT[i].mat] = {n: 0, ornek: mid.map(c => +c.toFixed(2))}); r.n++;
    }
  }
  const e = Object.entries(edge).sort((a, c) => c[1].n - a[1].n), k = Object.entries(box).sort((a, c) => c[1] - a[1]);
  if (e.length) bad++;
  console.log(node.getName().padEnd(28), e.length ? 'DELİYOR: ' + e.slice(0, 4).map(([mt, r]) => `${mt} (${r.n} üçgen @ ${r.ornek})`).join(', ') : 'temiz',
    k.length ? `| kutuda köşe: ${k.slice(0, 3).map(([mt, n]) => `${mt} (${n})`).join(', ')}` : '');
}
console.log(bad ? `${bad} mobilya binaya gömülü` : 'mobilya binaya gömülü değil');
