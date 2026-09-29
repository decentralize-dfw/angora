// Tur 10 geometri denetimi - siteye koymadan ÖNCE koşulur (GPU gerekmez).
//
//   node audit-tur10.mjs [yeni.glb] [eski.glb]
//   varsayılan: build/bake/tur10/BUILDING-opt-v6-lm.glb  vs  build/web/26092026/BUILDING-opt-v4.glb
//
// Soru: yeni modelde, ESKİ modelde boş olan bir yerde insan boyunu kesen bir
// parça var mı? (Tur 10'da merdivenin ikinci kolunu gömen kutu, sahanlığı
// bölen duvar bu türdendi.) Yöntem: 0,25 m ızgarada her (x, z) için dikey
// doğru (10 cm aralık); yeni modeldeki her yürünen yüzeyin (döşeme, basamak, sahanlık)
// üstünde 0,15..1,80 m aralığına giren üçgenler aranır. Aynı noktada eski
// modelde AYNI yükseklikte engel varsa (duvar, dolap) sayılmaz; yalnız YENİ
// engeller malzeme ve kat bazında raporlanır, ayrıca yürünen yüzeyi hiç
// olmayan (yeni modelde döşemesi kaybolmuş) noktalar.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import {MeshoptDecoder} from 'meshoptimizer';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeFileSync} from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '../..');
const NEW = process.argv[2] ?? path.join(REPO, 'build/bake/tur10/BUILDING-opt-v6-lm.glb');
const OLD = process.argv[3] ?? path.join(REPO, 'build/web/26092026/BUILDING-opt-v4.glb');
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'meshopt.decoder': MeshoptDecoder});

const WALK = /^(WOOD-FL|wood_floor|terra_floor|stone_tile|EK_M2_Ceviz_basamak|EK_M3_Krem_karo_esik|RR|R31 \| R33 .*tile|WHT\.001)$/;
const IGNORE = /glass|cam\b|Opal|zincir|spot|ampul|plafonyer|sarkit/i; // asılı armatür/cam: engel sayılmaz
const CELL = 0.25, STEP = 0.10, H0 = 0.15, H1 = 1.80, SAME = 0.12;

async function triangles(file) {
  const doc = await io.read(file), tris = [];
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh(); if (!mesh) continue;
    const w = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const mat = prim.getMaterial()?.getName() ?? '';
      const pos = prim.getAttribute('POSITION'), idx = prim.getIndices();
      const n = idx ? idx.getCount() : pos.getCount(), v = [0, 0, 0];
      const P = i => {pos.getElement(i, v); return [w[0]*v[0]+w[4]*v[1]+w[8]*v[2]+w[12], w[1]*v[0]+w[5]*v[1]+w[9]*v[2]+w[13], w[2]*v[0]+w[6]*v[1]+w[10]*v[2]+w[14]];};
      for (let t = 0; t < n; t += 3) {
        const a = P(idx ? idx.getScalar(t) : t), b = P(idx ? idx.getScalar(t + 1) : t + 1), c = P(idx ? idx.getScalar(t + 2) : t + 2);
        const nx = (b[1]-a[1])*(c[2]-a[2]) - (b[2]-a[2])*(c[1]-a[1]), ny = (b[2]-a[2])*(c[0]-a[0]) - (b[0]-a[0])*(c[2]-a[2]), nz = (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
        const len = Math.hypot(nx, ny, nz); if (len < 1e-10) continue;
        tris.push({a, b, c, up: Math.abs(ny / len), mat, node: node.getName()});
      }
    }
  }
  return tris;
}
function grid(tris) {
  const g = new Map();
  tris.forEach((t, i) => {
    const x0 = Math.floor(Math.min(t.a[0], t.b[0], t.c[0]) / CELL), x1 = Math.floor(Math.max(t.a[0], t.b[0], t.c[0]) / CELL);
    const z0 = Math.floor(Math.min(t.a[2], t.b[2], t.c[2]) / CELL), z1 = Math.floor(Math.max(t.a[2], t.b[2], t.c[2]) / CELL);
    if ((x1 - x0 + 1) * (z1 - z0 + 1) > 4000) return; // dev yer/çatı üçgeni: yalnız kendi kutusu yeter değil, atla
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {const k = x * 100003 + z; (g.get(k) ?? g.set(k, []).get(k)).push(i);}
  });
  return g;
}
// dikey doğru (x, z) ile üçgenin kesiştiği y (yoksa null)
function hitY(t, x, z) {
  const {a, b, c} = t;
  const d = (b[2]-c[2])*(a[0]-c[0]) + (c[0]-b[0])*(a[2]-c[2]); if (Math.abs(d) < 1e-12) return null;
  const l1 = ((b[2]-c[2])*(x-c[0]) + (c[0]-b[0])*(z-c[2])) / d, l2 = ((c[2]-a[2])*(x-c[0]) + (a[0]-c[0])*(z-c[2])) / d, l3 = 1 - l1 - l2;
  if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) return null;
  return l1 * a[1] + l2 * b[1] + l3 * c[1];
}
function column(tris, g, x, z) {
  const ids = g.get(Math.floor(x / CELL) * 100003 + Math.floor(z / CELL)) ?? [];
  const hits = [];
  for (const i of ids) {const y = hitY(tris[i], x, z); if (y !== null) hits.push({y, t: tris[i]});}
  return hits;
}

const [nt, ot] = [await triangles(NEW), await triangles(OLD)];
const [ng, og] = [grid(nt), grid(ot)];
console.log('üçgen yeni', nt.length, 'eski', ot.length);
let xs = Infinity, xe = -Infinity, zs = Infinity, ze = -Infinity;
for (const t of nt) if (WALK.test(t.mat)) for (const p of [t.a, t.b, t.c]) {xs = Math.min(xs, p[0]); xe = Math.max(xe, p[0]); zs = Math.min(zs, p[2]); ze = Math.max(ze, p[2]);}
const blocked = new Map(), samples = [];
let points = 0;
for (let x = xs + STEP / 2; x < xe; x += STEP) for (let z = zs + STEP / 2; z < ze; z += STEP) {
  const hits = column(nt, ng, x, z);
  const floors = hits.filter(h => WALK.test(h.t.mat) && h.t.up > 0.9).map(h => h.y).sort((p, q) => p - q);
  const levels = floors.filter((y, i) => i === 0 || y - floors[i - 1] > 0.08);
  if (!levels.length) continue;
  const old = column(ot, og, x, z);
  for (const y of levels) {
    points++;
    const lo = y + H0, hi = y + H1;
    const obstacle = hits.filter(h => h.y > lo && h.y < hi && !IGNORE.test(h.t.mat) && !(WALK.test(h.t.mat) && h.t.up > 0.9));
    if (!obstacle.length) continue;
    // eski modelde AYNI yükseklikte (±12 cm) engel varsa yeni değil. Yalnız
    // "aralıkta bir şey vardı" yetmez: eski merdivenin üst basamakları, aynı
    // yere konmuş 2,85 m'lik kutuyu da "eskiden vardı" diye saklıyordu.
    const fresh = obstacle.filter(h => !old.some(o => Math.abs(o.y - h.y) < SAME && !IGNORE.test(o.t.mat)));
    if (!fresh.length) continue;
    const top = fresh.sort((p, q) => p.y - q.y)[0];
    const key = top.t.mat;
    const rec = blocked.get(key) ?? blocked.set(key, {n: 0, ornek: []}).get(key);
    rec.n++;
    if (rec.ornek.length < 6) rec.ornek.push({x: +x.toFixed(2), z: +z.toFixed(2), zemin_y: +y.toFixed(2), engel_y: +top.y.toFixed(2)});
    samples.push({x, z, y, mat: key});
  }
}
const report = [...blocked].sort((p, q) => q[1].n - p[1].n).map(([mat, r]) => ({malzeme: mat, alan_m2: +(r.n * STEP * STEP).toFixed(2), ornek: r.ornek}));
console.log(`yürünen nokta ${points}; YENİ engel ${samples.length} nokta (${(samples.length * STEP * STEP).toFixed(1)} m²)`);
for (const r of report) console.log(String(r.alan_m2).padStart(7), 'm² |', r.malzeme, '|', r.ornek.slice(0, 3).map(o => `(${o.x},${o.zemin_y},${o.z})↑${o.engel_y}`).join(' '));
writeFileSync(process.env.DENETIM_NOKTA ?? '/dev/null', JSON.stringify(samples));
writeFileSync(path.join(REPO, 'build/bake/tur10/denetim.json'), JSON.stringify({yeni: NEW, eski: OLD, hucre_m: STEP, aralik_m: [H0, H1], yurunen_nokta: points, yeni_engeller: report}, null, 1));
