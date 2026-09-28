// Bölge haritasının site katmanı - ürün sahibinin 3D modellerinden.
//
//   cd tools/batch-delivery && node make-region-site.mjs
//
// Ürün sahibi (28.09): "yakın çevre haritası özellikle accurate olmak
// zorundadır; evler, kütleler, donatılar, yollar, herşey". Eski R44 katmanı
// (region-plan.json) eski bağlam modelinden, "model -z = kuzey" varsayımıyla
// çizilmişti ve OSM altlığıyla üst üste biniyordu.
//
// Hizalama ÖLÇÜLDÜ, varsayılmadı: KOMSULAR-opt-v2'deki 29 evin taban izi
// 0,5 m ızgarada OSM bina ayak izleriyle çakıştırıldı (tam 360° tarama,
// ±80 m öteleme, sonra 0,25°/0,5 m inceltme). Tek ve belirgin tepe:
//   harita = R(-164,25°) · (model x, model z) + (31,5; 21,0)   [harita x=doğu, y=güney]
// model örnek noktalarının %77'si OSM binası içinde; en yakın rakip açı %48.
//
// Çıktılar:
//   viewer/src/region-site.json    harita metresinde: evler, villa, havuz, parsel,
//                                  asfalt (delikli yol lekesi), kapsama alanı
//   viewer/src/street-labels.json  model koordinatında 3D sokak adı yerleşimleri
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readTriangles, rasterize, components} from './region-footprints.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const MODELS = path.join(ROOT, 'build/web/26092026');

export const MODEL_TO_MAP = Object.freeze({deg: -164.25, tx: 31.5, ty: 21.0});
const th = MODEL_TO_MAP.deg * Math.PI / 180, C = Math.cos(th), S = Math.sin(th);
export const toMap = ([x, z]) => [x * C - z * S + MODEL_TO_MAP.tx, x * S + z * C + MODEL_TO_MAP.ty];
export const toModel = ([mx, my]) => { const x = mx - MODEL_TO_MAP.tx, y = my - MODEL_TO_MAP.ty; return [x * C + y * S, -x * S + y * C]; };

// Izgara sınırlarını dolaşan kontur izleme: dolu hücre solda kalacak şekilde
// yönlü kenarlar toplanır, halkalara bağlanır. Delikler ters yönde çıkar;
// SVG'de evenodd ile doğru dolar.
export function traceContours({grid, W, H, minX, minZ, cell}, keep = k => grid[k]) {
  const filled = (x, z) => x >= 0 && z >= 0 && x < W && z < H && keep(z * W + x);
  const next = new Map();
  const key = (x, z) => x + ',' + z;
  const add = (a, b) => { const k = key(...a); if (!next.has(k)) next.set(k, []); next.get(k).push(b); };
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
    if (!filled(x, z)) continue;
    if (!filled(x, z - 1)) add([x, z], [x + 1, z]);
    if (!filled(x + 1, z)) add([x + 1, z], [x + 1, z + 1]);
    if (!filled(x, z + 1)) add([x + 1, z + 1], [x, z + 1]);
    if (!filled(x - 1, z)) add([x, z + 1], [x, z]);
  }
  const loops = [];
  for (const [start, outs] of next) {
    while (outs.length) {
      const loop = [start.split(',').map(Number)];
      let cur = outs.pop();
      while (key(...cur) !== start) {
        loop.push(cur);
        const list = next.get(key(...cur));
        if (!list?.length) break;
        cur = list.pop();
      }
      if (loop.length >= 4) loops.push(loop.map(([gx, gz]) => [minX + gx * cell, minZ + gz * cell]));
    }
  }
  return loops;
}

export function simplify(points, tol) {
  if (points.length < 4) return points;
  // kapalı halka: en uzak iki nokta ile ikiye bölünüp DP
  const dp = (pts) => {
    if (pts.length < 3) return pts;
    const [a, b] = [pts[0], pts[pts.length - 1]];
    let max = 0, idx = 0;
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1e-9;
    for (let i = 1; i < pts.length - 1; i++) {
      const d = Math.abs((pts[i][0] - a[0]) * dz - (pts[i][1] - a[1]) * dx) / len;
      if (d > max) { max = d; idx = i; }
    }
    if (max <= tol) return [a, b];
    const left = dp(pts.slice(0, idx + 1)), right = dp(pts.slice(idx));
    return left.slice(0, -1).concat(right);
  };
  let far = 0, fi = 0;
  for (let i = 1; i < points.length; i++) { const d = Math.hypot(points[i][0] - points[0][0], points[i][1] - points[0][1]); if (d > far) { far = d; fi = i; } }
  const a = dp(points.slice(0, fi + 1)), b = dp(points.slice(fi).concat([points[0]]));
  return a.slice(0, -1).concat(b.slice(0, -1));
}
const ringArea = r => { let a = 0; for (let i = 0; i < r.length; i++) { const [x0, y0] = r[i], [x1, y1] = r[(i + 1) % r.length]; a += x0 * y1 - x1 * y0; } return a / 2; };
const round = r => r.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);

async function footprint(file, filter, {cell = 0.25, minArea = 30, tol = 0.25, largestOnly = false} = {}) {
  const tris = await readTriangles(path.join(MODELS, file), filter);
  const r = rasterize(tris, cell);
  const {label, comps} = components(r, minArea);
  const chosen = largestOnly ? [comps.sort((a, b) => b.area - a.area)[0]] : comps;
  const out = [];
  for (const c of chosen) {
    const loops = traceContours(r, k => label[k] === c.id);
    const outer = loops.sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)))[0];
    out.push(round(simplify(outer, tol).map(p => toMap(p))));
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const houses = await footprint('KOMSULAR-opt-v2.glb', n => !/retaining|limestone/i.test(n), {minArea: 60});
  const villa = (await footprint('BUILDING-opt-v4.glb', () => true, {largestOnly: true}))[0];
  const pool = (await footprint('GARDEN-opt-v2.glb', n => /^water$/i.test(n), {cell: 0.2, minArea: 10, largestOnly: true}))[0];
  const plotData = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/web/native-current/plot-boundary.json')));
  const plot = round(plotData.polygon_native_xy.map(([x, y]) => toMap([x, -y])));

  // Yollar: asfalt (bordür dahil) 0,5 m ızgarada, delikli leke olarak
  const asphaltTris = await readTriangles(path.join(MODELS, 'CEVRE-YOL-opt-v3.glb'), n => /asphalt/i.test(n));
  const ar = rasterize(asphaltTris, 0.5);
  const roads = traceContours(ar).filter(l => Math.abs(ringArea(l)) > 4).map(l => round(simplify(l, 0.3).map(p => toMap(p))));
  // Kapsama: modelin zemini (çim + asfalt) 1 m ızgarada, dış halka
  const groundTris = await readTriangles(path.join(MODELS, 'CEVRE-YOL-opt-v3.glb'), n => /grass|asphalt/i.test(n));
  const gr = rasterize(groundTris, 1.0);
  const {label: gl, comps: gc} = components(gr, 500);
  const coverage = gc.map(c => traceContours(gr, k => gl[k] === c.id).sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)))[0])
    .map(l => round(simplify(l, 1.0).map(p => toMap(p))));

  // OSM ile modelin çakıştığı yerde model çizilir: model evinin içine düşen
  // OSM binası ve modelin asfaltına 5 m'den yakın OSM yol noktaları gizlenir.
  const streetsAll = JSON.parse(fs.readFileSync(path.join(ROOT, 'viewer/src/region-streets.json')));
  const inPoly = (x, y, poly) => { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; } return inside; };
  const modelShapes = [...houses, villa];
  const hideBuildings = [];
  streetsAll.buildings.forEach((b, i) => {
    let cx = 0, cy = 0; for (let k = 0; k < b.length; k += 2) { cx += b[k]; cy += b[k + 1]; } cx /= b.length / 2; cy /= b.length / 2;
    if (Math.hypot(cx, cy) > 300) return;
    const pts = [[cx, cy]]; for (let k = 0; k < b.length; k += 2) pts.push([b[k] * 0.7 + cx * 0.3, b[k + 1] * 0.7 + cy * 0.3]);
    if (modelShapes.some(poly => pts.filter(([x, y]) => inPoly(x, y, poly)).length >= pts.length * 0.4)) hideBuildings.push(i);
  });
  // asfalt ızgarasına 5 m tampon (0,5 m hücre, 10 hücre)
  const near = new Uint8Array(ar.W * ar.H), B = 10;
  for (let z = 0; z < ar.H; z++) for (let x = 0; x < ar.W; x++) if (ar.grid[z * ar.W + x])
    for (let dz = -B; dz <= B; dz++) for (let dx = -B; dx <= B; dx++) { if (dx * dx + dz * dz > B * B) continue; const nx = x + dx, nz = z + dz; if (nx >= 0 && nz >= 0 && nx < ar.W && nz < ar.H) near[nz * ar.W + nx] = 1; }
  const nearAsphalt = (mx, my) => { const [x, z] = toModel([mx, my]); const gx = Math.floor((x - ar.minX) / ar.cell), gz = Math.floor((z - ar.minZ) / ar.cell); return gx >= 0 && gz >= 0 && gx < ar.W && gz < ar.H && near[gz * ar.W + gx] === 1; };
  // Microsoft ML (Overture) binaları da modelin evine düşüyorsa gizlenir
  const mlPath = path.join(ROOT, 'viewer/src/region-buildings-ml.json');
  const ml = fs.existsSync(mlPath) ? JSON.parse(fs.readFileSync(mlPath)).buildings : [];
  const hideMl = [];
  ml.forEach((b, i) => {
    let cx = 0, cy = 0; for (let k = 0; k < b.length; k += 2) { cx += b[k]; cy += b[k + 1]; } cx /= b.length / 2; cy /= b.length / 2;
    if (Math.hypot(cx, cy) > 300) return;
    const pts = [[cx, cy]]; for (let k = 0; k < b.length; k += 2) pts.push([b[k] * 0.7 + cx * 0.3, b[k + 1] * 0.7 + cy * 0.3]);
    if (modelShapes.some(poly => pts.filter(([x, y]) => inPoly(x, y, poly)).length >= pts.length * 0.4)) hideMl.push(i);
  });
  const replacedRoads = [], keptRuns = [];
  streetsAll.roads.forEach(([cls, name, pts], i) => {
    let any = false; const flags = [];
    for (let k = 0; k < pts.length; k += 2) { const h = nearAsphalt(pts[k], pts[k + 1]); flags.push(h); any ||= h; }
    if (!any) return;
    replacedRoads.push(i);
    // görünür kalan parçalar: ardışık gizlenmemiş noktalar (kenarda bir nokta pay)
    let run = [];
    for (let k = 0; k < flags.length; k++) {
      if (!flags[k]) { run.push(pts[2 * k], pts[2 * k + 1]); continue; }
      if (run.length) { run.push(pts[2 * k], pts[2 * k + 1]); if (run.length >= 4) keptRuns.push([cls, run]); run = []; }
    }
    if (run.length >= 4) keptRuns.push([cls, run]);
  });

  const site = {
    generated_for: 'Bölge haritası site katmanı (28.09.2026)',
    source: 'KOMSULAR-opt-v2 / BUILDING-opt-v4 / GARDEN-opt-v2 / CEVRE-YOL-opt-v3 / plot-boundary.json',
    transform: {...MODEL_TO_MAP, note: 'harita = R(deg)·(model x, model z) + (tx, ty); harita x=doğu, y=güney; OSM bina ayak izleriyle ölçüldü'},
    houses, villa, pool, plot, roads, coverage,
    osm: {hideBuildings, replacedRoads, keptRuns, hideMl},
  };
  fs.writeFileSync(path.join(ROOT, 'viewer/src/region-site.json'), JSON.stringify(site));
  console.log(`evler ${houses.length}, villa ${villa.length} nokta, havuz ${pool?.length}, yol halkası ${roads.length}, kapsama ${coverage.length}, OSM gizlenen bina ${hideBuildings.length}, yol ${replacedRoads.length}`,
    `-> ${(fs.statSync(path.join(ROOT, 'viewer/src/region-site.json')).size / 1024).toFixed(0)} KB`);

  // --- 3D sokak adları -------------------------------------------------------
  // OSM yol ekseni (adlı olanlar) model koordinatına çevrilir; zeminin kapsama
  // alanı içinde, asfaltın üstünde, yazı uzunluğu boyunca düz (±0,8 m) giden
  // bir parçaya bir etiket. Yükseklik asfalt üçgenlerinden okunur.
  const streets = JSON.parse(fs.readFileSync(path.join(ROOT, 'viewer/src/region-streets.json')));
  const heightAt = (() => {
    const cell = 2, grid = new Map();
    for (const t of asphaltTris) {
      const xs = t.slice(0, 3).map(p => p[0]), zs = t.slice(0, 3).map(p => p[2]);
      for (let gx = Math.floor(Math.min(...xs) / cell); gx <= Math.floor(Math.max(...xs) / cell); gx++)
        for (let gz = Math.floor(Math.min(...zs) / cell); gz <= Math.floor(Math.max(...zs) / cell); gz++) {
          const k = gx + ',' + gz; if (!grid.has(k)) grid.set(k, []); grid.get(k).push(t);
        }
    }
    return (x, z) => {
      let best = null;
      for (const [a, b, c] of grid.get(Math.floor(x / cell) + ',' + Math.floor(z / cell)) ?? []) {
        const d = (b[0] - a[0]) * (c[2] - a[2]) - (c[0] - a[0]) * (b[2] - a[2]); if (Math.abs(d) < 1e-9) continue;
        const w1 = ((x - a[0]) * (c[2] - a[2]) - (c[0] - a[0]) * (z - a[2])) / d, w2 = ((b[0] - a[0]) * (z - a[2]) - (x - a[0]) * (b[2] - a[2])) / d, w0 = 1 - w1 - w2;
        if (w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4) continue;
        const y = w0 * a[1] + w1 * b[1] + w2 * c[1]; if (best === null || y > best) best = y;
      }
      return best;
    };
  })();
  const names = new Map();
  // OSM'de adsız site yolları: ad, yolun yanındaki bir noktayla bağlanır
  // (harita koordinatı). Villanın önündeki yol adresten: "Hatırlı Sokak No:10"
  // - villanın giriş yüzüne (model +z) en yakın adsız OSM ekseni.
  // Ürün sahibi yeni ad verdikçe buraya bir satır eklenir.
  // 28.09 (2): ürün sahibinin Google Haritalar görüntüleri OSM yollarıyla
  // bindirilip doğrulandı - site içi yolların adları:
  const NAMED_BY_POINT = [
    {name: 'Hatırlı Sokak', near: toMap([0, 14])},
    {name: 'Gülümser Sokak', near: [-51, 23]},
    {name: 'Meraklı Sokak', near: [-72, 58]},
    {name: 'Sanatkarlar Caddesi', near: [99, -133]},
    {name: 'Özleyen Sokak', near: [82, -52]},
  ];
  const candidates = [];
  for (const [cls, name, pts] of streets.roads) if (name) candidates.push([name, pts]);
  for (const {name, near} of NAMED_BY_POINT) {
    let road = null, bestD = Infinity;
    for (const [cls, n, pts] of streets.roads) {
      if (n) continue;
      // parçaya uzaklık (köşeye değil: uzun düz yolda köşeler uzakta kalır)
      for (let i = 0; i + 2 < pts.length; i += 2) {
        const ax = pts[i], ay = pts[i + 1], dx = pts[i + 2] - ax, dy = pts[i + 3] - ay, l2 = dx * dx + dy * dy || 1;
        const t = Math.max(0, Math.min(1, ((near[0] - ax) * dx + (near[1] - ay) * dy) / l2));
        const d = Math.hypot(ax + t * dx - near[0], ay + t * dy - near[1]);
        if (d < bestD) { bestD = d; road = pts; }
      }
    }
    if (road && bestD < 25) candidates.push([name, road]);
  }
  const labels = [];
  for (const [name, pts] of candidates) {
    const model = []; for (let i = 0; i < pts.length; i += 2) model.push(toModel([pts[i], pts[i + 1]]));
    const len = name.length * 0.95 + 2;              // ~1,6 m yazı yüksekliğinde metin uzunluğu + pay
    // eksen boyunca 1 m adımla yeniden örnekle
    const dense = [];
    for (let i = 0; i + 1 < model.length; i++) {
      const [ax, az] = model[i], [bx, bz] = model[i + 1], d = Math.hypot(bx - ax, bz - az);
      for (let s = 0; s < d; s += 1) dense.push([ax + (bx - ax) * s / d, az + (bz - az) * s / d]);
    }
    // Aday parçalar (düz, asfaltta) villaya yakından uzağa; ilk "temiz"
    // olanı alınır: yazı boyunca yolun genişliği düzgün (kavşak değil).
    const cands = [];
    for (let i = 0; i < dense.length; i++) {
      const j = i + Math.ceil(len); if (j >= dense.length) break;
      const [ax, az] = dense[i], [bx, bz] = dense[j], chord = Math.hypot(bx - ax, bz - az);
      if (chord < len * 0.95) continue;
      let straight = true, off = 0;
      for (let k = i; k <= j; k++) {
        const [px, pz] = dense[k];
        if (Math.abs((px - ax) * (bz - az) - (pz - az) * (bx - ax)) / chord > 1.2) { straight = false; break; }
        if (heightAt(px, pz) === null) off++;
      }
      // OSM ekseni modelin asfaltından 2-3 m kayabiliyor: yazının ortası ve
      // en az %85'i asfaltta olmalı
      if (!straight || off > (j - i + 1) * 0.15 || heightAt((ax + bx) / 2, (az + bz) / 2) === null) continue;
      cands.push({dist: Math.hypot((ax + bx) / 2, (az + bz) / 2), a: [ax, az], b: [bx, bz]});
    }
    cands.sort((p, q) => p.dist - q.dist);
    // Yolun GERÇEK ortası (ürün sahibi: "tam yolun ortasında"): OSM ekseni
    // asfalttan birkaç metre kayabiliyor. Yazı boyunca her metrede yola dik
    // bir kesit alınır, asfalt aralığının ortası bulunur; ortalara doğru
    // oturtulur (en küçük kareler) - merkez ve yön asfalttan gelir.
    const centre = ({a: [ax, az], b: [bx, bz]}) => {
      let mx = (ax + bx) / 2, mz = (az + bz) / 2, angle = Math.atan2(bz - az, bx - ax);
      const ux = Math.cos(angle), uz = Math.sin(angle), nx = -uz, nz = ux;
      const samples = [], widths = []; let total = 0;
      for (let t = -len / 2; t <= len / 2 + 1e-6; t += 1) {
        total++;
        const px = mx + ux * t, pz = mz + uz * t, runs = [];
        let start = null;
        for (let s = -12; s <= 12.001; s += 0.1) {
          const on = heightAt(px + nx * s, pz + nz * s) !== null;
          if (on && start === null) start = s;
          if ((!on || s > 12) && start !== null) { runs.push([start, on ? s : s - 0.1]); start = null; }
        }
        if (!runs.length) continue;
        const score = r => r[0] <= 0 && r[1] >= 0 ? 0 : Math.min(Math.abs(r[0]), Math.abs(r[1]));
        const run = runs.sort((p, q) => score(p) - score(q))[0];
        const width = run[1] - run[0];
        if (width < 3 || width > 16) continue;
        samples.push([t, (run[0] + run[1]) / 2]); widths.push(width);
      }
      if (samples.length < total * 0.8) return null;
      if (Math.max(...widths) - Math.min(...widths) > 2.5) return null;   // kavşak / cep
      const n = samples.length, st = samples.reduce((q, [t]) => q + t, 0) / n, sm = samples.reduce((q, [, m]) => q + m, 0) / n;
      let num = 0, den = 0; for (const [t, m] of samples) { num += (t - st) * (m - sm); den += (t - st) ** 2; }
      const slope = den ? num / den : 0, c0 = sm - slope * st;
      return {mx: mx + nx * c0, mz: mz + nz * c0, angle: angle + Math.atan(slope)};
    };
    let placed = null;
    for (const c of cands) { placed = centre(c); if (placed) break; }
    if (!placed) { console.log('yer yok:', name); continue; }
    const {mx, mz} = placed;
    let angle = placed.angle;
    // okuma yönü: soldan sağa, model +x'e doğru (açı -90°..90°)
    if (angle > Math.PI / 2) angle -= Math.PI; else if (angle <= -Math.PI / 2) angle += Math.PI;
    const ha = (dx) => heightAt(mx + Math.cos(angle) * dx, mz + Math.sin(angle) * dx) ?? heightAt(mx, mz);
    labels.push({name, x: +mx.toFixed(2), y: +(heightAt(mx, mz) + 0.04).toFixed(2), z: +mz.toFixed(2), angle: +angle.toFixed(4), length: +len.toFixed(1),
      rise: +(ha(len / 2) - ha(-len / 2)).toFixed(3)});
    if (names.has(name)) continue; names.set(name, true);
  }
  // aynı adın birden çok OSM parçası: villaya en yakın tek etiket
  const byName = new Map();
  for (const l of labels) { const d = Math.hypot(l.x, l.z); if (!byName.has(l.name) || d < byName.get(l.name).d) byName.set(l.name, {...l, d}); }
  const out = [...byName.values()].filter(l => l.d < 170).map(({d, ...l}) => l);
  fs.writeFileSync(path.join(ROOT, 'viewer/src/street-labels.json'), JSON.stringify({
    generated_for: '3D sokak adları (28.09.2026)', source: 'OSM yol eksenleri (© OpenStreetMap, ODbL) + CEVRE-YOL-opt-v3 asfalt yüksekliği; adsız site yollarının adları ürün sahibinin Google Haritalar görüntülerinden (OSM ile bindirilip doğrulandı)',
    labels: out}, null, 1));
  console.log('sokak adları:', out.map(l => `${l.name} (${Math.hypot(l.x, l.z).toFixed(0)} m)`).join(', '));
}
