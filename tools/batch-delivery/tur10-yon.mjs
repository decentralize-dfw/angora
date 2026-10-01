// Pişirme öncesi yüz yönü: Cycles bir yüzeyi NORMALİNİN baktığı taraftan pişirir.
// Tur 10 kabuğunda sarılma tutarsız (malzemeler çift yüzlü, sitede görünmüyordu):
// duvar atlasının %31'i duvarın içine bakıyordu ve o yüzeyler kara pişiyordu.
// Her atlas üçgeni görünen (açık) tarafına çevrilir; sarılma ve köşe normali birlikte.
//   dik yüzey: tam bir yanı oda poligonunun içindeyse o yan (rooms.json, kendi katı)
//   yatay / kararsız: iki yöne ışın; yakın (<0,6 m) yüz kapalı, arka belirgin açıksa çevrilir
// Kaplamanın arkasında kalan yüzeyler (iki yanı da <0,3 m kapalı) olduğu gibi kalır.
const DATUMS = [0, 3.0996, 6.3714, 9.4705];
const C = 0.3, STEP = 0.1, FAR = 3;

// force: [{mat: RegExp, min, max, want: [x,y,z]}] - kutudaki (ağırlık merkezi) ve normali want ekseninde olan
// üçgen kesin olarak want yönüne çevrilir (oda/ışın testi yanıldığı yerler için, denetimle belirlenmiş).
export function orientForBake(doc, materials, rooms, force = []) {
  const root = doc.getRoot(), buffer = root.listBuffers()[0];
  const roomPolys = [0, 1, 2, 3].map(k => rooms.filter(r => r.floor_index === k).map(r => r.boundary_xz));
  const inPoly = (x, z, P) => {let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) {const [a, b] = P[i], [e, f] = P[j]; if ((b > z) !== (f > z) && x < (e - a) * (z - b) / (f - b) + a) c = !c;} return c;};
  const roomFloor = y => (y < DATUMS[1] - 0.3 ? 0 : y < DATUMS[2] - 0.3 ? 1 : y < DATUMS[3] - 0.3 ? 2 : 3);

  // tüm kabuk üçgenleri (dünya) + 0,3 m ızgara: ışın engelleri
  const prims = [];
  for (const node of root.listNodes()) {
    const mesh = node.getMesh(); if (!mesh) continue;
    for (const prim of mesh.listPrimitives()) if (prim.getIndices()) prims.push({node, prim, w: node.getWorldMatrix()});
  }
  const total = prims.reduce((a, {prim}) => a + prim.getIndices().getCount() / 3, 0);
  const T = new Float64Array(total * 9); let nt = 0;
  for (const p of prims) {
    const pos = p.prim.getAttribute('POSITION').getArray(), idx = p.prim.getIndices().getArray(), w = p.w;
    p.first = nt;
    for (let t = 0; t < idx.length; t += 3, nt++) for (let j = 0; j < 3; j++) {
      const v = idx[t + j] * 3, x = pos[v], y = pos[v + 1], z = pos[v + 2], o = nt * 9 + j * 3;
      T[o] = w[0] * x + w[4] * y + w[8] * z + w[12]; T[o + 1] = w[1] * x + w[5] * y + w[9] * z + w[13]; T[o + 2] = w[2] * x + w[6] * y + w[10] * z + w[14];
    }
  }
  const cell = (x, y, z) => ((Math.floor(x / C) + 512) * 1024 + Math.floor(y / C) + 512) * 1024 + Math.floor(z / C) + 512;
  const grid = new Map();
  for (let t = 0; t < nt; t++) {
    const o = t * 9, lo = [0, 1, 2].map(k => Math.floor(Math.min(T[o + k], T[o + 3 + k], T[o + 6 + k]) / C)), hi = [0, 1, 2].map(k => Math.floor(Math.max(T[o + k], T[o + 3 + k], T[o + 6 + k]) / C));
    for (let x = lo[0]; x <= hi[0]; x++) for (let y = lo[1]; y <= hi[1]; y++) for (let z = lo[2]; z <= hi[2]; z++) {
      const k = ((x + 512) * 1024 + y + 512) * 1024 + z + 512; const l = grid.get(k); if (l) l.push(t); else grid.set(k, [t]);
    }
  }
  // o'dan d yönünde ilk çarpma mesafesi (FAR'a kadar), self hariç
  const ray = (o, d, self) => {
    let best = Infinity, last = -1;
    for (let s = 0; s <= FAR && s < best + C * 1.5; s += STEP) {
      const k = cell(o[0] + d[0] * s, o[1] + d[1] * s, o[2] + d[2] * s); if (k === last) continue; last = k;
      for (const t of grid.get(k) ?? []) {
        if (t === self) continue;
        const q = t * 9, e1x = T[q + 3] - T[q], e1y = T[q + 4] - T[q + 1], e1z = T[q + 5] - T[q + 2], e2x = T[q + 6] - T[q], e2y = T[q + 7] - T[q + 1], e2z = T[q + 8] - T[q + 2];
        const px = d[1] * e2z - d[2] * e2y, py = d[2] * e2x - d[0] * e2z, pz = d[0] * e2y - d[1] * e2x, det = e1x * px + e1y * py + e1z * pz;
        if (Math.abs(det) < 1e-12) continue;
        const inv = 1 / det, tx = o[0] - T[q], ty = o[1] - T[q + 1], tz = o[2] - T[q + 2], u = (tx * px + ty * py + tz * pz) * inv; if (u < 0 || u > 1) continue;
        const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x, v = (d[0] * qx + d[1] * qy + d[2] * qz) * inv; if (v < 0 || u + v > 1) continue;
        const h = (e2x * qx + e2y * qy + e2z * qz) * inv; if (h > 1e-4 && h < best) best = h;
      }
    }
    return best;
  };

  const stats = {oda: 0, isin: 0, cevrilen: 0, alan: 0, cevrilen_alan: 0, supheli_alan: 0};
  for (const p of prims) {
    if (!materials.has(p.prim.getMaterial()?.getName())) continue;
    const prim = p.prim, idx = Array.from(prim.getIndices().getArray()), N = prim.getAttribute('NORMAL')?.getArray();
    const want = new Int8Array(idx.length); // köşe başına: normal -1 ile çarpılmalı mı
    let changed = false;
    for (let t = 0; t < idx.length; t += 3) {
      const g = p.first + t / 3, q = g * 9;
      const e1 = [T[q + 3] - T[q], T[q + 4] - T[q + 1], T[q + 5] - T[q + 2]], e2 = [T[q + 6] - T[q], T[q + 7] - T[q + 1], T[q + 8] - T[q + 2]];
      const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], L = Math.hypot(...cr);
      if (L < 1e-10) continue;
      const n = cr.map(x => x / L), c = [0, 1, 2].map(k => (T[q + k] + T[q + 3 + k] + T[q + 6 + k]) / 3), area = L / 2;
      stats.alan += area;
      let flip = null;
      const mname = prim.getMaterial()?.getName() ?? '';
      const rule = force.find(r => r.mat.test(mname) && c.every((x, k) => x >= r.min[k] && x <= r.max[k]) && Math.abs(n[0]*r.want[0] + n[1]*r.want[1] + n[2]*r.want[2]) > 0.9);
      if (rule) {flip = n[0]*rule.want[0] + n[1]*rule.want[1] + n[2]*rule.want[2] < 0; stats.zorla = (stats.zorla ?? 0) + 1;}
      else if (Math.abs(n[1]) < 0.5) {
        const k = roomFloor(c[1]), room = d => roomPolys[k].some(P => inPoly(c[0] + n[0] * d, c[2] + n[2] * d, P));
        const f = room(0.08), r = room(-0.08);
        // dış cephe sıvası/çatı/çakıl ODAYA DEĞİL dışarıya bakar: oda poligonu duvarın dış yüzüne
        // taştığı yerde (pencere söveleri) cephe üçgeni içe çevrilip kapkara pişiyordu (01.10).
        if (f !== r) {flip = /^(Stucco painted wall|roof-7|Stone gravel)$/.test(mname) ? f : r; stats.oda++;}
      }
      if (flip === null) {
        const off = s => c.map((x, k) => x + n[k] * 1e-3 * s);
        const dF = ray(off(1), n, g), dB = ray(off(-1), n.map(x => -x), g);
        flip = dF < 0.6 && dB > Math.max(0.3, 2 * dF);
        // oda içindeki yatay yüz: kat zemininde yukarı, tavan yüksekliğinde aşağı bakmalı
        // (tavanın üstü boşsa ışın ölçütü karar veremiyordu: 500 m² tavan yukarı bakıyordu).
        // Oda tarafı 10 cm içinde kapalıysa (ince levhanın gizli yüzü) dokunulmaz.
        const k = roomFloor(c[1]), h = c[1] - DATUMS[k];
        if (Math.abs(n[1]) > 0.9 && (h < 0.35 || h > 2) && roomPolys[k].some(P => inPoly(c[0], c[2], P))) {
          const wantUp = h < 0.35, facingUp = n[1] > 0;
          if (wantUp !== facingUp && dB >= 0.1) flip = true;
          if (wantUp === facingUp) flip = false;
        }
        // kalan şüpheli: ön yüz 5 cm içinde kapalı, arka 0,5 m'den açık (ölçüm, karar değil)
        if ((flip ? dB : dF) < 0.05 && (flip ? dF : dB) > 0.5) stats.supheli_alan += area;
        stats.isin++;
      }
      // köşe normalleri seçilen yana (s) bakmalı; çevrilen üçgende s = -n
      const s = flip ? n.map(x => -x) : n;
      if (flip) {[idx[t + 1], idx[t + 2]] = [idx[t + 2], idx[t + 1]]; stats.cevrilen++; stats.cevrilen_alan += area; changed = true;}
      if (N) for (let j = 0; j < 3; j++) {
        const v = idx[t + j] * 3, w = p.w;
        const nx = w[0] * N[v] + w[4] * N[v + 1] + w[8] * N[v + 2], ny = w[1] * N[v] + w[5] * N[v + 1] + w[9] * N[v + 2], nz = w[2] * N[v] + w[6] * N[v + 1] + w[10] * N[v + 2];
        if (nx * s[0] + ny * s[1] + nz * s[2] < 0) {want[t + j] = 1; changed = true;}
      }
    }
    if (!changed) continue;
    // ters normal isteyen köşeler kopyalanır (normal ve tanjant w eksi); kullanılmayan köşe kalmaz
    const remap = new Map(), order = [];
    const out = idx.map((v, i) => {const key = v * 2 + want[i]; let r = remap.get(key); if (r === undefined) {r = order.length; remap.set(key, r); order.push(key);} return r;});
    for (const sem of prim.listSemantics()) {
      const acc = prim.getAttribute(sem), size = acc.getElementSize(), arr = acc.getArray(), next = new arr.constructor(order.length * size);
      order.forEach((key, i) => {
        const v = key >> 1, neg = key & 1;
        for (let k = 0; k < size; k++) next[i * size + k] = arr[v * size + k];
        if (neg && sem === 'NORMAL') for (let k = 0; k < 3; k++) next[i * size + k] = -next[i * size + k];
        if (neg && sem === 'TANGENT') next[i * size + 3] = -next[i * size + 3];
      });
      prim.setAttribute(sem, doc.createAccessor().setType(acc.getType()).setArray(next).setNormalized(acc.getNormalized()).setBuffer(buffer));
    }
    prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(out)).setBuffer(buffer));
  }
  return stats;
}

// Aynı malzemeden, 3 mm içinde başka bir yüzeyin TAMAMEN örttüğü üçgenler atılır.
// Tur 10 kabuğunda 357 m² beyaz duvar iki kat halindeydi (aynı düzlem, farklı
// bölünme): malzeme aynı olduğu için sitede görünmüyordu, pişirmede ise öndeki
// kat arkadakinin ışığını kesiyor, biri aydınlık biri kara pişip titreşiyordu.
// Küçükten büyüğe gidilir; atılan üçgen başkasını örtmüş sayılmaz (iki kopyadan
// biri kalır). Kısmen örtülen üçgen kalır (delik açılmaz).
// extra: {malzeme: /örtebilecek başka malzemeler/} - ör. merdiven altı kaplaması duvarın ve
// parkenin 3 mm önünde aynı düzlemde duruyordu (basamaklı leke); örtülen kaplama üçgeni atılır.
export function dropCoveredDuplicates(doc, extra = {}) {
  const root = doc.getRoot(), buffer = root.listBuffers()[0], EPS = 0.003, G = 0.25;
  const tris = [];
  for (const node of root.listNodes()) {
    const mesh = node.getMesh(); if (!mesh) continue; const w = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      if (!prim.getIndices()) continue;
      const mat = prim.getMaterial()?.getName() ?? '', P = prim.getAttribute('POSITION').getArray(), I = prim.getIndices().getArray();
      const X = i => [w[0]*P[i*3]+w[4]*P[i*3+1]+w[8]*P[i*3+2]+w[12], w[1]*P[i*3]+w[5]*P[i*3+1]+w[9]*P[i*3+2]+w[13], w[2]*P[i*3]+w[6]*P[i*3+1]+w[10]*P[i*3+2]+w[14]];
      for (let t = 0; t < I.length; t += 3) {
        const v = [X(I[t]), X(I[t + 1]), X(I[t + 2])];
        const e1 = v[1].map((x, k) => x - v[0][k]), e2 = v[2].map((x, k) => x - v[0][k]);
        const cr = [e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]], L = Math.hypot(...cr);
        if (L < 1e-10) continue;
        tris.push({prim, t, mat, v, n: cr.map(x => x / L), area: L / 2, e1, e2, dead: false});
      }
    }
  }
  const grid = new Map(), K = (x, y, z) => `${x},${y},${z}`;
  tris.forEach((tr, i) => {
    const lo = [0, 1, 2].map(k => Math.floor((Math.min(tr.v[0][k], tr.v[1][k], tr.v[2][k]) - EPS) / G));
    const hi = [0, 1, 2].map(k => Math.floor((Math.max(tr.v[0][k], tr.v[1][k], tr.v[2][k]) + EPS) / G));
    for (let x = lo[0]; x <= hi[0]; x++) for (let y = lo[1]; y <= hi[1]; y++) for (let z = lo[2]; z <= hi[2]; z++) {
      const k = K(x, y, z); const l = grid.get(k); if (l) l.push(i); else grid.set(k, [i]);
    }
  });
  // p'den u'nun düzlemine dik iz düşüm u'nun içinde (1 mm pay) ve uzaklık <= EPS mi
  const covers = (u, p) => {
    const d = u.n, a = u.v[0], dist = (p[0]-a[0])*d[0] + (p[1]-a[1])*d[1] + (p[2]-a[2])*d[2];
    if (Math.abs(dist) > EPS) return false;
    const q = [p[0]-d[0]*dist-a[0], p[1]-d[1]*dist-a[1], p[2]-d[2]*dist-a[2]];
    const d00 = u.e1[0]*u.e1[0]+u.e1[1]*u.e1[1]+u.e1[2]*u.e1[2], d01 = u.e1[0]*u.e2[0]+u.e1[1]*u.e2[1]+u.e1[2]*u.e2[2], d11 = u.e2[0]*u.e2[0]+u.e2[1]*u.e2[1]+u.e2[2]*u.e2[2];
    const d20 = q[0]*u.e1[0]+q[1]*u.e1[1]+q[2]*u.e1[2], d21 = q[0]*u.e2[0]+q[1]*u.e2[1]+q[2]*u.e2[2], den = d00*d11 - d01*d01;
    if (Math.abs(den) < 1e-14) return false;
    const b1 = (d11*d20 - d01*d21) / den, b2 = (d00*d21 - d01*d20) / den, tol = 0.001 / Math.sqrt(Math.max(d00, d11));
    return b1 >= -tol && b2 >= -tol && b1 + b2 <= 1 + tol;
  };
  const order = tris.map((_, i) => i).sort((a, b) => tris[a].area - tris[b].area);
  let dropped = 0, area = 0;
  for (const i of order) {
    const tr = tris[i], c = [0, 1, 2].map(k => (tr.v[0][k] + tr.v[1][k] + tr.v[2][k]) / 3);
    const pts = [c, ...tr.v.map(p => p.map((x, k) => x + (c[k] - x) * 0.02)),
      ...[[0, 1], [1, 2], [2, 0]].map(([a, b]) => tr.v[a].map((x, k) => (x + tr.v[b][k]) / 2 * 0.98 + c[k] * 0.02))];
    const ok = pts.every(p => (grid.get(K(...p.map(x => Math.floor(x / G)))) ?? []).some(j => {
      if (j === i) return false; const u = tris[j];
      return !u.dead && (u.mat === tr.mat || extra[tr.mat]?.test(u.mat)) && Math.abs(u.n[0]*tr.n[0] + u.n[1]*tr.n[1] + u.n[2]*tr.n[2]) > 0.98 && covers(u, p);
    }));
    if (ok) {tr.dead = true; dropped++; area += tr.area;}
  }
  const byPrim = new Map();
  for (const tr of tris) if (tr.dead) (byPrim.get(tr.prim) ?? byPrim.set(tr.prim, new Set()).get(tr.prim)).add(tr.t);
  for (const [prim, dead] of byPrim) {
    const I = prim.getIndices().getArray(), keep = [];
    for (let t = 0; t < I.length; t += 3) if (!dead.has(t)) keep.push(I[t], I[t + 1], I[t + 2]);
    prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(keep)).setBuffer(buffer));
  }
  return {dropped, area};
}
