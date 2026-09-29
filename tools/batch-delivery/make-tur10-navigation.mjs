// Tur 10 yürüme yüzeyi: build/web/26092026/tur10-navigation.json (+ .gz)
//
//   node make-tur10-navigation.mjs        (make-tur10-web.mjs'den SONRA)
//
// Site yürüme modunda önceden hesaplanmış bir yükseklik ızgarası kullanır
// (walk-surface.js; 12 cm hücre, 4 kat katmanı, maske bit 1 = sabit engel,
// bit 2 = mobilya). Eski ızgara (native-current/native-navigation.json) ESKİ
// modelden üretildi: Tur 10'da değişen merdivenler, kaldırılan/eklenen duvarlar
// ve yeni mobilya orada yok - bodrum merdiveninde görünmeyen duvara takılınıyordu.
// Bina içindeki hücreler Tur 10 geometrisinden yeniden hesaplanır; bina dışı
// (bahçe, rampalar, teras basamakları) eski ızgaradan aynen kalır.
//   * zemin: yürünen malzemelerin yukarı bakan üçgenleri, kat aralığında en üstteki
//   * engel: gövde silindiri (yarıçap = eski dosyadaki body_radius_m) zeminden
//     0,35..(minimum_headroom_m) m arasında yürünmeyen bir üçgene değiyorsa
//   * mobilya: aynı test INTERIOR üçgenleriyle, ayrı bit (mobilya gizlenince açılır)
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFileSync, writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '../..');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const OLD = JSON.parse(readFileSync(path.join(REPO, 'build/web/native-current/native-navigation.json'), 'utf8'));
const ROOMS = JSON.parse(readFileSync(path.join(REPO, 'build/web/full/rooms.json'), 'utf8')).spaces;
const OUT = path.join(REPO, 'build/web/26092026/tur10-navigation.json');
const DAT = [0, 3.0996, 6.3714, 9.4705];
const WALK = /^(WOOD-FL|wood_floor|terra_floor|terra_floor_giris|stone_tile|RR|R31 \| R33 .*tile|WHT\.001|EK_M3_Krem_karo_esik|EK_M2_.*basamak.*)$/;
const IGNORE = /glass|cam\b|Opal|zincir|ampul|bulb|plafonyer|sarkit/i;   // cam ve asılı armatür engel değil
const R = OLD.body_radius_m, HEAD = OLD.minimum_headroom_m, KNEE = 0.35;
const {x: GX, z: GZ, step: S, width: W, height: H} = OLD.grid;

async function tris(file) {
  const doc = await io.read(file), out = [];
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh(); if (!mesh) continue; const w = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const mat = prim.getMaterial()?.getName() ?? '';
      const pos = prim.getAttribute('POSITION'), idx = prim.getIndices(), v = [0, 0, 0];
      const P = i => {pos.getElement(i, v); return [w[0]*v[0]+w[4]*v[1]+w[8]*v[2]+w[12], w[1]*v[0]+w[5]*v[1]+w[9]*v[2]+w[13], w[2]*v[0]+w[6]*v[1]+w[10]*v[2]+w[14]];};
      const n = idx ? idx.getCount() : pos.getCount();
      for (let t = 0; t < n; t += 3) out.push({p: [0, 1, 2].map(k => P(idx ? idx.getScalar(t + k) : t + k)), mat});
    }
  }
  return out;
}
const building = await tris(path.join(REPO, 'build/bake/tur10/BUILDING-opt-v6-lm.glb'));
const interior = await tris(path.join(REPO, 'build/bake/tur10/INTERIOR-opt-v3-sahne.glb'));
console.log('üçgen: bina', building.length, 'iç', interior.length);

// oda poligonları (bitmiş duvar yüzü): hücrenin binanın içinde olup olmadığı
const polys = ROOMS.map(r => r.boundary_xz);
const inPoly = (x, z, P) => {let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) {const [a, b] = P[i], [e, f] = P[j]; if ((b > z) !== (f > z) && x < (e - a) * (z - b) / (f - b) + a) c = !c;} return c;};
const segDist = (x, z, a, b, e, f) => {const dx = e - a, dz = f - b, L = dx * dx + dz * dz; const t = L ? Math.max(0, Math.min(1, ((x - a) * dx + (z - b) * dz) / L)) : 0; return Math.hypot(x - a - t * dx, z - b - t * dz);};
const footDist = (x, z) => {let d = Infinity; for (const P of polys) {if (inPoly(x, z, P)) return 0; for (let i = 0; i < P.length; i++) {const [a, b] = P[i], [e, f] = P[(i + 1) % P.length]; d = Math.min(d, segDist(x, z, a, b, e, f));}} return d;};

// 2B kova (xz): üçgen kutusu + yarıçap
const BK = 0.3;
function bucket(list) {
  const g = new Map();
  list.forEach((t, i) => {
    const xs = t.p.map(q => q[0]), zs = t.p.map(q => q[2]);
    const x0 = Math.floor((Math.min(...xs) - R) / BK), x1 = Math.floor((Math.max(...xs) + R) / BK);
    const z0 = Math.floor((Math.min(...zs) - R) / BK), z1 = Math.floor((Math.max(...zs) + R) / BK);
    if ((x1 - x0 + 1) * (z1 - z0 + 1) > 6000) return;
    for (let a = x0; a <= x1; a++) for (let b = z0; b <= z1; b++) {const k = a * 100003 + b; (g.get(k) ?? g.set(k, []).get(k)).push(i);}
  });
  return g;
}
const upFacing = t => {const [a, b, c] = t.p; const e1 = [b[0]-a[0], b[1]-a[1], b[2]-a[2]], e2 = [c[0]-a[0], c[1]-a[1], c[2]-a[2]]; const ny = e1[2]*e2[0]-e1[0]*e2[2], L = Math.hypot(e1[1]*e2[2]-e1[2]*e2[1], ny, e1[0]*e2[1]-e1[1]*e2[0]); return L > 1e-12 && Math.abs(ny / L) > 0.7;};   // sarılma yönüne bakılmaz: bazı parke üçgenleri ters sarılı (doubleSided)
// kapı eşikleri (koyu ahşap / kasa / kapak): yalnız kat kotunun hemen üstündekiler yürünür
const SILL = /^(WOODY-DARK|EK_M3_Koyu_ceviz_kapi|EK_M1_.*|Simple White Wall|EK_SimpleWhiteWall)$/;
const nearDatum = t => {const y = (t.p[0][1] + t.p[1][1] + t.p[2][1]) / 3; return [...DAT, 2.80].some(d => y - d > -0.03 && y - d < 0.06);};
const floors = building.filter(t => upFacing(t) && (WALK.test(t.mat) || (SILL.test(t.mat) && nearDatum(t))));
const obstacles = building.filter(t => !WALK.test(t.mat) && !IGNORE.test(t.mat));
const furniture = interior.filter(t => !IGNORE.test(t.mat));
const [FB, OB, IB] = [bucket(floors), bucket(obstacles), bucket(furniture)];
const key = (x, z) => Math.floor(x / BK) * 100003 + Math.floor(z / BK);
const hitY = ([a, b, c], x, z) => {const d = (b[2]-c[2])*(a[0]-c[0]) + (c[0]-b[0])*(a[2]-c[2]); if (Math.abs(d) < 1e-12) return null; const l1 = ((b[2]-c[2])*(x-c[0]) + (c[0]-b[0])*(z-c[2])) / d, l2 = ((c[2]-a[2])*(x-c[0]) + (a[0]-c[0])*(z-c[2])) / d, l3 = 1 - l1 - l2; return l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6 ? null : l1 * a[1] + l2 * b[1] + l3 * c[1];};
// üçgen, y in [lo, hi] dilimine kırpılır; xz izdüşümünün (x, z)'ye uzaklığı
function sliceDist(p, lo, hi, x, z) {
  let poly = p;
  for (const [lim, sgn] of [[lo, 1], [hi, -1]]) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], fa = (a[1] - lim) * sgn, fb = (b[1] - lim) * sgn;
      if (fa >= 0) out.push(a);
      if ((fa >= 0) !== (fb >= 0)) {const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, lim, a[2] + (b[2] - a[2]) * t]);}
    }
    poly = out; if (poly.length < 1) return Infinity;
  }
  if (poly.length >= 3 && inPoly(x, z, poly.map(q => [q[0], q[2]]))) return 0;
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) {const a = poly[i], b = poly[(i + 1) % poly.length]; d = Math.min(d, segDist(x, z, a[0], a[2], b[0], b[2]));}
  return d;
}
const blocked = (B, list, x, z, h) => (B.get(key(x, z)) ?? []).some(i => {
  const p = list[i].p; if (Math.max(p[0][1], p[1][1], p[2][1]) < h + KNEE || Math.min(p[0][1], p[1][1], p[2][1]) > h + HEAD) return false;
  return sliceDist(p, h + KNEE, h + HEAD, x, z) < R;
});

// eski katmanlar -> diziler
const layers = OLD.layers.map(layer => {
  const heights = new Int16Array(W * H).fill(-32768), masks = new Uint8Array(W * H).fill(1);
  layer.rows.forEach((runs, row) => runs.forEach(([s, l, h, m]) => {for (let c = s; c < s + l; c++) {heights[row * W + c] = h; masks[row * W + c] = m;}}));
  return {heights, masks};
});
let inside = 0, changed = 0, support = 0;
for (let row = 0; row < H; row++) for (let col = 0; col < W; col++) {
  const x = GX + (col + 0.5) * S, z = GZ + (row + 0.5) * S, d = footDist(x, z);
  if (d > 0.45) continue;                       // bina dışı: eski ızgara
  inside++;
  // hücredeki ayrı yürünen yüzeyler (3 cm'den yakınlar bir), aşağıdan yukarı katmanlara:
  // tercih = yüksekliğin kat aralığı, ama sıra korunur (üst üste binen merdiven kollarında
  // bodrum zemini, iniş basamağı ve üstteki çıkış kolu ayrı katmanlara düşer; tek katmana
  // 'en üstteki' yazılsaydı basamak kaybolur, merdivende görünmez duvar oluşurdu)
  const raw = (FB.get(key(x, z)) ?? []).map(i => hitY(floors[i].p, x, z)).filter(y => y !== null).sort((a, b) => a - b);
  // üstünde baş yüksekliği (minimum_headroom_m) kadar boşluk olmayan yüzey yürünemez ve
  // katman da almaz: gömülü döşeme katmanları (bodrumda 0 / -0,08 / -0,24), basamak
  // altında kalan zemin. Yığılı merdiven kollarında hücre başına en fazla 4 yüzey kalır.
  const levels = [];
  for (const y of raw.slice().reverse()) if (!levels.length || levels[0] - y >= HEAD) levels.unshift(y);
  const pref = y => (y < DAT[1] - 0.45 ? 0 : y < DAT[2] - 0.45 ? 1 : y < DAT[3] - 0.45 ? 2 : 3);
  const assign = new Map(); let last = -1;
  levels.forEach((y, j) => {const f = Math.max(pref(y), last + 1); if (f > 3) return; assign.set(f, {y, above: levels[j + 1]}); last = f;});
  for (let f = 0; f < 4; f++) {
    const i = row * W + col, oldH = layers[f].heights[i], oldM = layers[f].masks[i], a = assign.get(f);
    if (!a) {
      if (d > 0) continue;                        // duvar dibi dış bant: eski değer kalır (kapı önü yolları)
      layers[f].heights[i] = -32768; layers[f].masks[i] = 1;
    } else {
      const h = a.y; support++;
      let m = 0;
      if (a.above !== undefined && a.above - h < HEAD) m |= 1;   // üstünde başka yürünen yüzey (merdiven altı): baş yüksekliği yok
      if (blocked(OB, obstacles, x, z, h)) m |= 1;
      if (blocked(IB, furniture, x, z, h)) m |= 2;
      layers[f].heights[i] = Math.round(h * 1000); layers[f].masks[i] = m;
    }
    if (layers[f].heights[i] !== oldH || layers[f].masks[i] !== oldM) changed++;
  }
}
// tek hücrelik zemin yarıkları (ıslak hacim kapılarında parke ile karo arası ~4 cm): iki
// karşı komşusu aynı kotta (5 cm) ve açıksa doldurulur
let filled = 0;
for (let f = 0; f < 4; f++) {
  const {heights, masks} = layers[f], add = [];
  for (let row = 1; row < H - 1; row++) for (let col = 1; col < W - 1; col++) {
    const i = row * W + col; if (heights[i] !== -32768) continue;
    for (const [a, b] of [[i - 1, i + 1], [i - W, i + W]]) {
      if (heights[a] === -32768 || heights[b] === -32768 || masks[a] & 1 || masks[b] & 1 || Math.abs(heights[a] - heights[b]) > 50) continue;
      add.push([i, Math.max(heights[a], heights[b]), masks[a] | masks[b]]); break;
    }
  }
  for (const [i, h, m] of add) {heights[i] = h; masks[i] = m; filled++;}
}
console.log(`yürüme: ${filled} tek hücrelik yarık dolduruldu`);
const out = {...OLD, revision: 'tur10', source_tur10: 'tools/batch-delivery/make-tur10-navigation.mjs',
  layers: layers.map(({heights, masks}) => ({rows: Array.from({length: H}, (_, row) => {
    const runs = []; let c = 0;
    while (c < W) {const i = row * W + c, h = heights[i], m = masks[i]; let e = c + 1; while (e < W && heights[row * W + e] === h && masks[row * W + e] === m) e++; if (h !== -32768) runs.push([c, e - c, h, m]); c = e;}
    return runs;
  })}))};
writeFileSync(OUT, JSON.stringify(out));
writeFileSync(OUT + '.gz', gzipSync(JSON.stringify(out), {level: 9}));
console.log(`yürüme: bina içi ${inside} hücre, zemini bulunan ${support} katman-hücre, değişen ${changed}; ${path.relative(REPO, OUT)}`);
