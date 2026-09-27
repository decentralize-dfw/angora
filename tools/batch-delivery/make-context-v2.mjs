// Çevre teslimatı v2 - ürün sahibinin 27.09.2026 yüklemesi.
//
//   node make-context-v2.mjs
//
// Girdiler (build/web/26092026/source/, SİLİNMEZ):
//   komsular-opt-v1.glb   komşu binalar (tek düğüm, 9 malzeme, 1,19 M üçgen)
//   cevre-yol-opt-v2.glb  zemin + yollar + çim (arsa ve kenar ağaçları çıkarılmış)
// Çıktılar (build/web/26092026/):
//   KOMSULAR-opt-v2.glb   dış cephe DÜZ MAT BEYAZ (ürün sahibi: "1 px beyaz ya da
//                         düz hex, çok parlamasın, normal kullanma"); cephedeki
//                         sıva dokusu + pişmiş AO haritası çıkarıldı. Doku
//                         taşımayan malzemelerin kullanılmayan UV kanalları
//                         atılır; geometri (konum) nicemlemesi AYNI 14 bit - mesh
//                         bozulmaz; yalnız normal 8 bit ve UV 11 bit.
//   CEVRE-YOL-opt-v2.glb  aynı dosya, aynı sıkıştırmayla yeniden yazılır.
// Mobil 256 px KTX2 kopyaları make-mobile-ktx2.mjs ile.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS, KHRDracoMeshCompression} from '@gltf-transform/extensions';
import {prune, dedup, weld} from '@gltf-transform/functions';
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
// sRGB #EFEDE8 -> doğrusal
const toLinear = c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
const WHITE = [0xef, 0xed, 0xe8].map(v => toLinear(v / 255));

// --- 27.09 (2. tur) ---------------------------------------------------------
// Siyah ev: bazı komşu evlerde (aynalanmış kopyalar) üçgen dönüş yönü ile
// köşe normalleri ters. Önce her üçgenin dönüşü kendi normaliyle hizalanır;
// sonra her bağlı parça (ev kabuğu) için normallerin DIŞA bakıp bakmadığı
// oylanır, belirgin biçimde içe bakan parçada normal ve dönüş birlikte
// çevrilir. Tek düzlem (çatı yüzü gibi) oylamada ~0 çıkar, dokunulmaz.
function fixOrientation(prim, {vote = true} = {}) {
  const pos = prim.getAttribute('POSITION'), nor = prim.getAttribute('NORMAL'), idx = prim.getIndices();
  if (!pos || !nor || !idx) return {rewound: 0, flipped: 0};
  const P = pos.getArray(), N = nor.getArray(), I = idx.getArray();
  const face = t => {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  };
  let rewound = 0;
  for (let t = 0; t < I.length; t += 3) {
    const g = face(t), a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
    const n = [N[a] + N[b] + N[c], N[a + 1] + N[b + 1] + N[c + 1], N[a + 2] + N[b + 2] + N[c + 2]];
    if (g[0] * n[0] + g[1] * n[1] + g[2] * n[2] < 0) {const x = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = x; rewound++;}
  }
  let flipped = 0;
  if (vote) {
    // bağlı parçalar: aynı konumdaki köşeler kaynaştırılarak
    const parent = new Int32Array(pos.getCount()).map((_, i) => i);
    const find = i => {while (parent[i] !== i) {parent[i] = parent[parent[i]]; i = parent[i];} return i;};
    const join = (a, b) => {a = find(a); b = find(b); if (a !== b) parent[a] = b;};
    const weld = new Map();
    for (let i = 0; i < pos.getCount(); i++) {
      const k = Math.round(P[i * 3] * 200) + ',' + Math.round(P[i * 3 + 1] * 200) + ',' + Math.round(P[i * 3 + 2] * 200);
      if (weld.has(k)) join(i, weld.get(k)); else weld.set(k, i);
    }
    for (let t = 0; t < I.length; t += 3) {join(I[t], I[t + 1]); join(I[t], I[t + 2]);}
    const parts = new Map();
    for (let t = 0; t < I.length; t += 3) {
      const r = find(I[t]); let e = parts.get(r);
      if (!e) parts.set(r, e = {tris: [], min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9]});
      e.tris.push(t);
      for (const v of [I[t], I[t + 1], I[t + 2]]) for (let k = 0; k < 3; k++) {e.min[k] = Math.min(e.min[k], P[v * 3 + k]); e.max[k] = Math.max(e.max[k], P[v * 3 + k]);}
    }
    for (const e of parts.values()) {
      if (e.tris.length < 40) continue;
      const c = [0, 1, 2].map(k => (e.min[k] + e.max[k]) / 2);
      let out = 0, total = 0;
      for (const t of e.tris) {
        const g = face(t), area = Math.hypot(...g) || 1e-9;
        const m = [0, 1, 2].map(k => (P[I[t] * 3 + k] + P[I[t + 1] * 3 + k] + P[I[t + 2] * 3 + k]) / 3 - c[k]);
        const d = Math.hypot(...m) || 1e-9;
        out += (g[0] * m[0] + g[1] * m[1] + g[2] * m[2]) / d; total += area;
      }
      if (out / total > -.3) continue;           // dışa ya da kararsız: dokunma
      const verts = new Set();
      for (const t of e.tris) {const x = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = x; verts.add(I[t]); verts.add(I[t + 1]); verts.add(I[t + 2]);}
      for (const v of verts) for (let k = 0; k < 3; k++) N[v * 3 + k] = -N[v * 3 + k];
      flipped++;
    }
  }
  idx.setArray(I); nor.setArray(N);
  return {rewound: rewound / (I.length / 3), flipped};
}
// Arazi "low-poly" görünüyordu: çimin her yüzü kendi düz normaliyle. Aynı
// konumdaki köşelerin normalleri, aralarındaki açı kırılma açısından
// (60°) küçükse alanla ağırlıklı ortalanır - tepe yumuşak, yol/bordür
// kenarı keskin kalır. Geometri ve UV değişmez.
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

async function build(input, output, edit) {
  const doc = await io.read(path.join(DIR, 'source', input));
  edit?.(doc);
  await doc.transform(dedup(), prune({keepAttributes: false, keepLeaves: false}));
  const draco = doc.getRoot().listExtensionsUsed().find(e => e.extensionName === KHRDracoMeshCompression.EXTENSION_NAME)
    ?? doc.createExtension(KHRDracoMeshCompression);
  draco.setRequired(true).setEncoderOptions({
    method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
    encodeSpeed: 0, decodeSpeed: 5,
    quantizationBits: {POSITION: 14, NORMAL: 8, TEX_COORD: 11, COLOR: 8, GENERIC: 12},
  });
  await io.write(path.join(DIR, output), doc);
  const before = fs.statSync(path.join(DIR, 'source', input)).size, after = fs.statSync(path.join(DIR, output)).size;
  console.log(`${output}: ${(before / 1048576).toFixed(2)} MB -> ${(after / 1048576).toFixed(2)} MB`);
}

await build('komsular-opt-v1.glb', 'KOMSULAR-opt-v2.glb', doc => {
  for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
    const name = prim.getMaterial()?.getName() ?? '';
    const r = fixOrientation(prim, {vote: !/limestone|retaining/i.test(name)});
    console.log(`yön: ${name} - dönüş düzeltilen ${(r.rewound * 100).toFixed(1)} %, çevrilen parça ${r.flipped}`);
  }
  // Saçak altı/tavan: kayıtta metalik 1 - gölgede siyaha çekiyordu. Mat beyaz.
  for (const m of doc.getRoot().listMaterials()) if (/^ceiling/i.test(m.getName()))
    m.setMetallicRoughnessTexture(null).setMetallicFactor(0).setRoughnessFactor(.9);
  for (const m of doc.getRoot().listMaterials()) {
    if (!/^neighbor_wall/i.test(m.getName())) continue;
    m.setBaseColorTexture(null).setNormalTexture(null).setMetallicRoughnessTexture(null).setOcclusionTexture(null)
      .setBaseColorFactor([...WHITE, 1]).setRoughnessFactor(.92).setMetallicFactor(0);
    console.log('cephe düz mat beyaz:', m.getName());
  }
});
await build('cevre-yol-opt-v2.glb', 'CEVRE-YOL-opt-v2.glb', doc => {
  for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives())
    console.log(`yumuşak normal: ${prim.getMaterial()?.getName()} - ${smoothNormals(prim)} üçgen`);
});
