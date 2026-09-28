// Çevre zemini v3 - 28.09.2026.
//
//   node make-context-v3.mjs
//
// Girdi (SİLİNMEZ): build/web/26092026/source/cevre-yol-opt-v2.glb
// Çıktı:            build/web/26092026/CEVRE-YOL-opt-v3.glb
// (v2 yerinde kalır; görüntüleyici v3'ü okur, bayrakla v2'ye dönülür.)
//
// Ürün sahibi: "arazideki anlamsız gölgeler devam ediyor". Ölçüm: gölge
// atan her şey kapatıldığında da çimdeki koyu kıymıklar ve kamalar
// DURUYOR - yani bunlar gölge haritası değil, yüzey normali. Çim ağında
// 125 260 üçgenin 12 004'ü 60°'den dik ince şerit (yol/parsel kenarı
// basamakları), 552'si ters dönük kıvrım. v2'deki köşe-komşu yumuşatma bu
// şeritlerin yan bakan normalini düz komşularına da yayıyordu: güneşe
// sırtını dönen şerit + çevresi kararıyordu.
//
// v3: çim ve asfaltın normali "arazi normali" - her köşede, en az 3 m
// (iri üçgende kendi kenarının 1,5 katı) yarıçap içindeki yüzlerin ALAN x
// yataylık² ile ağırlıklı ortalaması (yüzler yukarı çevrilerek). İnce ve dik
// şeridin hem alanı küçük hem yataylığı ~0 olduğu için sesi kısılır; tepe ve vadiler
// büyük ölçekte gölgelenmeye devam eder, ama yumuşak. Sonuç ayrıca %30
// dünya-yukarısına eğilir: ACES eğrisi yamaç tonunu sertleştiriyordu.
// Geometri, UV ve malzeme DEĞİŞMEZ; yalnız NORMAL.
// Mobil 256 px KTX2 kopyası make-mobile-ktx2.mjs ile.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS, KHRDracoMeshCompression} from '@gltf-transform/extensions';
import {prune, dedup} from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(here, '../../build/web/26092026');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

const RADIUS = 3.0;     // m - bu ölçeğin altındaki kırışıklık ışıkta görünmez
const UP_BIAS = 0.30;   // normalin dünya-yukarısına eğilme payı

// Düğüm dönüşümü yok varsayılır (kaynakta tek düğüm, birim matris) -
// yine de kontrol edilir; varsa betik durur, yanlış normal yazılmaz.
export function terrainNormals(P, I, {radius = RADIUS, upBias = UP_BIAS} = {}) {
  const faceCount = I.length / 3;
  const cx = new Float32Array(faceCount), cz = new Float32Array(faceCount);
  const fn = new Float32Array(faceCount * 3);   // alanla ölçekli, yukarı çevrilmiş
  for (let f = 0; f < faceCount; f++) {
    const a = I[f * 3] * 3, b = I[f * 3 + 1] * 3, c = I[f * 3 + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;   // |n| = 2 x alan
    if (ny < 0) {nx = -nx; ny = -ny; nz = -nz;}
    fn[f * 3] = nx; fn[f * 3 + 1] = ny; fn[f * 3 + 2] = nz;
    cx[f] = (P[a] + P[b] + P[c]) / 3; cz[f] = (P[a + 2] + P[b + 2] + P[c + 2]) / 3;
  }
  // Köşenin yarıçapı: en az RADIUS, ama kendi en uzun kenarının 1,5 katı -
  // iri üçgenli düz alanda köşe yalnız yakındaki ince şeritleri görmesin.
  const vertexCount = P.length / 3, reach = new Float32Array(vertexCount).fill(radius);
  for (let f = 0; f < faceCount; f++) {
    const ids = [I[f * 3], I[f * 3 + 1], I[f * 3 + 2]];
    for (let e = 0; e < 3; e++) {
      const a = ids[e] * 3, b = ids[(e + 1) % 3] * 3;
      const len = Math.hypot(P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]) * 1.5;
      if (len > reach[ids[e]]) reach[ids[e]] = len;
      if (len > reach[ids[(e + 1) % 3]]) reach[ids[(e + 1) % 3]] = len;
    }
  }
  // XZ ızgarası: hücre = RADIUS; köşe kendi yarıçapını kapsayan halkaya bakar
  const cell = radius, grid = new Map();
  const cellKey = (x, z) => Math.floor(x / cell) + ',' + Math.floor(z / cell);
  for (let f = 0; f < faceCount; f++) {
    const k = cellKey(cx[f], cz[f]);
    let list = grid.get(k); if (!list) grid.set(k, list = []); list.push(f);
  }
  const N = new Float32Array(P.length);
  for (let v = 0; v < vertexCount; v++) {
    const x = P[v * 3], z = P[v * 3 + 2], R = reach[v], r2 = R * R, ring = Math.ceil(R / cell);
    const gx = Math.floor(x / cell), gz = Math.floor(z / cell);
    let ax = 0, ay = 0, az = 0;
    for (let i = -ring; i <= ring; i++) for (let j = -ring; j <= ring; j++) {
      const list = grid.get((gx + i) + ',' + (gz + j)); if (!list) continue;
      for (const f of list) {
        const dx = cx[f] - x, dz = cz[f] - z, d2 = dx * dx + dz * dz;
        if (d2 > r2) continue;
        // alan x mesafe düşüşü x yataylık²: dik şerit (yol/parsel basamağı)
        // büyük ölçekli eğime oy vermez
        const nx = fn[f * 3], ny = fn[f * 3 + 1], nz = fn[f * 3 + 2], len = Math.hypot(nx, ny, nz) || 1;
        const flat = ny / len, w = Math.exp(-2 * d2 / r2) * flat * flat;
        ax += nx * w; ay += ny * w; az += nz * w;
      }
    }
    let l = Math.hypot(ax, ay, az);
    if (l < 1e-12) {ax = 0; ay = 1; az = 0; l = 1;}
    ax = ax / l * (1 - upBias); ay = ay / l * (1 - upBias) + upBias; az = az / l * (1 - upBias);
    l = Math.hypot(ax, ay, az);
    N[v * 3] = ax / l; N[v * 3 + 1] = ay / l; N[v * 3 + 2] = az / l;
  }
  return N;
}

// Arazi dışındaki (istinat taşı) yüzeyler v2'deki gibi 60° kırılmalı yumuşatma.
function smoothNormals(prim, creaseDeg = 60) {
  const pos = prim.getAttribute('POSITION'), nor = prim.getAttribute('NORMAL'), idx = prim.getIndices();
  if (!pos || !nor || !idx) return 0;
  const P = pos.getArray(), I = idx.getArray(), N = new Float32Array(nor.getArray().length);
  const faces = [], byKey = new Map(), cos = Math.cos(creaseDeg * Math.PI / 180);
  const key = v => Math.round(P[v * 3] * 500) + ',' + Math.round(P[v * 3 + 1] * 500) + ',' + Math.round(P[v * 3 + 2] * 500);
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
    const u = [P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]], w = [P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]];
    const g = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    faces.push(g);
    for (const v of [I[t], I[t + 1], I[t + 2]]) {const k = key(v); if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push([v, faces.length - 1]);}
  }
  const unit = g => {const l = Math.hypot(...g) || 1; return g.map(x => x / l);};
  for (const list of byKey.values()) for (const [v, f] of list) {
    const own = unit(faces[f]); const acc = [0, 0, 0];
    for (const [, other] of list) {
      const g = faces[other], n = unit(g);
      if (own[0] * n[0] + own[1] * n[1] + own[2] * n[2] >= cos) {acc[0] += g[0]; acc[1] += g[1]; acc[2] += g[2];}
    }
    const n = unit(acc); N[v * 3] = n[0]; N[v * 3 + 1] = n[1]; N[v * 3 + 2] = n[2];
  }
  nor.setArray(N);
  return I.length / 3;
}

const TERRAIN = /continuous grass|asphalt/i;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const input = path.join(DIR, 'source', 'cevre-yol-opt-v2.glb'), output = path.join(DIR, 'CEVRE-YOL-opt-v3.glb');
  const doc = await io.read(input);
  for (const node of doc.getRoot().listNodes()) {
    const m = node.getMatrix();
    const identity = m.every((value, i) => Math.abs(value - (i % 5 === 0 ? 1 : 0)) < 1e-6);
    if (node.getMesh() && !identity) throw Error('Düğüm dönüşümü var: ' + node.getName() + ' - dünya-yukarısı yanlış olur');
  }
  for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
    const name = prim.getMaterial()?.getName() ?? '';
    const pos = prim.getAttribute('POSITION'), nor = prim.getAttribute('NORMAL'), idx = prim.getIndices();
    if (!pos || !nor || !idx) {console.log('dokunulmadı:', name); continue;}
    if (!TERRAIN.test(name)) {console.log(`yumuşak normal (v2 gibi): ${name} - ${smoothNormals(prim)} üçgen`); continue;}
    nor.setArray(terrainNormals(pos.getArray(), idx.getArray()));
    console.log(`arazi normali: ${name} - ${idx.getCount() / 3} üçgen, ${pos.getCount()} köşe`);
  }
  await doc.transform(dedup(), prune({keepAttributes: false, keepLeaves: false}));
  const draco = doc.getRoot().listExtensionsUsed().find(e => e.extensionName === KHRDracoMeshCompression.EXTENSION_NAME)
    ?? doc.createExtension(KHRDracoMeshCompression);
  draco.setRequired(true).setEncoderOptions({
    method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
    encodeSpeed: 0, decodeSpeed: 5,
    quantizationBits: {POSITION: 14, NORMAL: 8, TEX_COORD: 11, COLOR: 8, GENERIC: 12},
  });
  await io.write(output, doc);
  console.log(`CEVRE-YOL-opt-v3.glb: ${(fs.statSync(input).size / 1048576).toFixed(2)} MB -> ${(fs.statSync(output).size / 1048576).toFixed(2)} MB (${fs.statSync(output).size} B)`);
}
