// Tur 10 web teslimi -> sitenin yükleyeceği dosyalar + ışık pişirme sahnesi.
//
//   node make-tur10-web.mjs
//
// Girdi (Blender ajanının modelleme dalındaki teslimi, depoya ALINMAZ):
//   build/web/26092026/source/tur10/BUILDING-opt-v6-alt.glb  (bodrum + giriş)
//   build/web/26092026/source/tur10/BUILDING-opt-v6-ust.glb  (1. kat + çatı)
//   build/web/26092026/source/tur10/INTERIOR-opt-v3.glb
//   build/web/26092026/source/tur10/isiklar-v2.json
// Çıktı:
//   build/web/26092026/BUILDING-opt-v6.glb    site: Draco + WebP 1024, lightmap UV'li (TEXCOORD_1)
//   build/web/26092026/INTERIOR-opt-v3.glb    site: Draco + WebP 1024
//   build/bake/tur10/BUILDING-opt-v6-lm.glb   pişirme: SIKIŞTIRMASIZ, aynı geometri ve UV
//   build/bake/tur10/INTERIOR-opt-v3-sahne.glb
//   build/bake/tur10/lightmap-uv.json         atlaslar, düğümler, sahne dosyaları (02_pisir.py --tur10)
//
// Adımlar:
//   1. Merdiven onarımı (bodrum -> giriş iç merdiveni, aşağıda),
//   2. iki BUILDING parçası tek sahne; ortak malzeme/dokular tekilleştirilir,
//   3. EKLER'in 1 700+ küçük düğümü malzeme başına birleştirilir, sonra her
//      düğüm TEK ilkel taşıyacak şekilde ayrılır (pişirme nesne başına atlas),
//   4. lightmap UV: YALNIZ büyük yüzeyler (ATLASES), xatlas ile tek sayfa
//      (tools/blender/lightmap_uv_tur10.py). Kapı, kasa, kartonpiyer, dolap,
//      korkuluk, armatür, cam, metal lightmap almaz - sitede canlı ışık alır.
//   5. pişirme dosyası ve site dosyası AYNI belgeden yazılır: geometri ve UV
//      bire bir aynıdır (site dosyası yalnız sıkıştırılmıştır).
import {NodeIO, getBounds} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {mergeDocuments, dedup, flatten, join, prune, unpartition, draco, textureCompress} from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, statSync, writeFileSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '../..');
const DIR = path.join(REPO, 'build/web/26092026');
const SRC = path.join(DIR, 'source/tur10');
const BAKE = path.join(REPO, 'build/bake/tur10');
const PYTHON = process.env.PYTHON || 'python3';
const MAX_EDGE = 1024;
mkdirSync(BAKE, {recursive: true});

// Lightmap alan malzemeler (malzeme adıyla - site aynı malzemeyi tek parça çizer).
const ATLASES = {
  duvar: {boyut: 4096, malzemeler: ['Simple White Wall', 'EK_SimpleWhiteWall', 'EK_M2_Beyaz_merdiven_alti']},
  zemin: {boyut: 4096, malzemeler: ['ceiling.001', 'WOOD-FL', 'wood_floor', 'terra_floor', 'stone_tile', 'WHT.001',
    'EK_M2_Ceviz_basamak', 'EK_M3_Krem_karo_esik', 'EK_A09_Banyo_bordur', 'RR',
    'R31 | R33 ivory wall ceramic', 'R31 | R33 master pale cream tile', 'R31 | R33 attic cream tile',
    'R31 | R33 entrance WC ochre tile', 'R31 | R33 attic tan mosaic band', 'R31 | R33 entrance navy mosaic band',
    'R31 | R33 master fine mosaic band']},
  cephe: {boyut: 2048, malzemeler: ['Stucco painted wall', 'roof-7', 'Stone gravel']},
};

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const DROP = ['TEXCOORD_1', 'TEXCOORD_2', 'TEXCOORD_3', 'COLOR_1'];
const box = doc => getBounds(doc.getRoot().listScenes()[0]);
const fmt = b => b.min.map((v, i) => `${v.toFixed(3)}..${b.max[i].toFixed(3)}`).join(' ');

// --- 1. Merdiven onarımı ---------------------------------------------------
// Bodrum -> giriş iç merdiveni (ikinci kol x 0,87..3,17, z -1,93..-0,93;
// basamaklar x 3,05'te y 1,69'dan x 1,0'da y 3,07'ye çıkıyor):
//  * EK_A08_F02_dolu_merdiven_alti 2,85 m'lik DİKDÖRTGEN kutuydu - ikinci
//    kolun basamaklarını gömüyordu. Üst yüzü kolun altından geçen eğik
//    düzleme indirilir: kutu merdiven altını dolduran kamaya döner.
//  * EK_A09_F47_tek_duvar x 4,31'e kadar uzanıp sahanlığı (x 3,17..4,17)
//    ikiye bölüyordu - birinci koldan ikinciye geçilemiyordu. Sahanlık
//    kenarında (x 3,17) biter.
const STAIR = {x0: 0.87, x1: 3.17, yAtX1: 1.35, slope: 0.673}; // kama üstü: y = yAtX1 + (x1 - x) * slope
function repairStair(doc) {
  const nodes = new Map(doc.getRoot().listNodes().map(n => [n.getName(), n]));
  const edit = (name, fn) => {
    const node = nodes.get(name);
    if (!node) throw Error(`merdiven onarımı: düğüm yok: ${name}`);
    const w = node.getWorldMatrix();
    if (Math.abs(w[0] - 1) + Math.abs(w[5] - 1) + Math.abs(w[10] - 1) + Math.abs(w[1]) + Math.abs(w[2]) + Math.abs(w[4]) + Math.abs(w[6]) + Math.abs(w[8]) + Math.abs(w[9]) > 1e-4)
      throw Error(`merdiven onarımı: ${name} dönük/ölçekli, beklenmiyor`);
    const t = [w[12], w[13], w[14]];
    for (const prim of node.getMesh().listPrimitives()) fn(prim, t);
  };
  edit('EK_A08_F02_dolu_merdiven_alti', (prim, t) => {
    const pos = prim.getAttribute('POSITION'), nor = prim.getAttribute('NORMAL');
    const p = pos.getArray().slice(), n = nor?.getArray().slice();
    const len = Math.hypot(STAIR.slope, 1);
    for (let i = 0; i < p.length; i += 3) {
      const x = p[i] + t[0], y = p[i + 1] + t[1];
      if (y > 0.05) p[i + 1] = STAIR.yAtX1 + (STAIR.x1 - x) * STAIR.slope - t[1];
      if (n && n[i + 1] > 0.9) {n[i] = STAIR.slope / len; n[i + 1] = 1 / len; n[i + 2] = 0;}
    }
    pos.setArray(p); if (n) nor.setArray(n);
  });
  edit('EK_A09_F47_tek_duvar', (prim, t) => {
    const pos = prim.getAttribute('POSITION'), p = pos.getArray().slice();
    for (let i = 0; i < p.length; i += 3) if (p[i] + t[0] > STAIR.x1) p[i] = STAIR.x1 - t[0];
    pos.setArray(p);
  });
  console.log('merdiven: F02 kutusu kamaya, F47 duvarı sahanlık kenarına');
}

// --- ortak hazırlık ---------------------------------------------------------
async function load(sources, {stairRepair = false} = {}) {
  const doc = await io.read(sources[0]);
  if (stairRepair) repairStair(doc);
  const root = doc.getRoot(), scene = root.listScenes()[0];
  for (const extra of sources.slice(1)) {
    const other = await io.read(extra);
    const map = mergeDocuments(doc, other);
    for (const s of other.getRoot().listScenes()) {
      const merged = map.get(s);
      for (const n of merged.listChildren()) {merged.removeChild(n); scene.addChild(n);}
      merged.dispose();
    }
  }
  for (const prim of root.listMeshes().flatMap(m => m.listPrimitives()))
    for (const semantic of DROP) if (prim.getAttribute(semantic)) prim.setAttribute(semantic, null);
  for (const node of root.listNodes()) {const kat = node.getExtras()?.kat; node.setExtras(kat ? {kat} : {});}
  return doc;
}

// Her düğüm tek ilkel: birleştirme bir düğümde birden çok malzeme bırakabilir.
function splitPrimitives(doc) {
  const root = doc.getRoot(), scene = root.listScenes()[0];
  for (const node of [...root.listNodes()]) {
    const mesh = node.getMesh(); if (!mesh) continue;
    const prims = mesh.listPrimitives(); if (prims.length < 2) continue;
    for (const prim of prims.slice(1)) {
      mesh.removePrimitive(prim);
      const m = doc.createMesh(prim.getMaterial()?.getName() ?? 'parca').addPrimitive(prim);
      const child = doc.createNode(prim.getMaterial()?.getName() ?? 'parca').setMesh(m).setMatrix(node.getWorldMatrix());
      scene.addChild(child);
    }
  }
  for (const node of root.listNodes()) {
    const mat = node.getMesh()?.listPrimitives()[0]?.getMaterial()?.getName();
    if (mat) node.setName(mat);
  }
}

// --- 4. lightmap UV ---------------------------------------------------------
function lightmapUV(doc) {
  const root = doc.getRoot(), buffer = root.listBuffers()[0];
  const atlasOf = new Map(Object.entries(ATLASES).flatMap(([a, s]) => s.malzemeler.map(m => [m, a])));
  const found = new Set();
  const input = {atlaslar: {}}, chunks = []; let offset = 0;
  const push = arr => {const b = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); chunks.push(b); const r = [offset, arr.length]; offset += b.length; return r;};
  const targets = new Map();
  root.listNodes().forEach((node, i) => {
    const prim = node.getMesh()?.listPrimitives()[0]; if (!prim) return;
    const mat = prim.getMaterial()?.getName(); const atlas = atlasOf.get(mat); if (!atlas) return;
    found.add(mat);
    const key = `${String(i).padStart(4, '0')}|${mat}`;
    const w = node.getWorldMatrix(), src = prim.getAttribute('POSITION').getArray();
    const world = new Float32Array(src.length);
    for (let v = 0; v < src.length; v += 3) {
      const x = src[v], y = src[v + 1], z = src[v + 2];
      world[v] = w[0] * x + w[4] * y + w[8] * z + w[12];
      world[v + 1] = w[1] * x + w[5] * y + w[9] * z + w[13];
      world[v + 2] = w[2] * x + w[6] * y + w[10] * z + w[14];
    }
    const idx = prim.getIndices() ? Uint32Array.from(prim.getIndices().getArray()) : Uint32Array.from({length: src.length / 3}, (_, k) => k);
    (input.atlaslar[atlas] ??= {boyut: ATLASES[atlas].boyut, parcalar: []}).parcalar.push({dugum: key, konum: push(world), indeks: push(idx)});
    targets.set(key, {node, prim, atlas});
  });
  const missing = Object.values(ATLASES).flatMap(s => s.malzemeler).filter(m => !found.has(m));
  if (missing.length) console.warn('lightmap: modelde olmayan malzemeler (atlandı):', missing.join(', '));
  writeFileSync(path.join(BAKE, 'giris.json'), JSON.stringify(input));
  writeFileSync(path.join(BAKE, 'giris.bin'), Buffer.concat(chunks));
  execFileSync(PYTHON, [path.join(REPO, 'tools/blender/lightmap_uv_tur10.py'), path.join(BAKE, 'giris.json')], {stdio: 'inherit'});
  const out = JSON.parse(readFileSync(path.join(BAKE, 'cikis.json'), 'utf8'));
  const blob = readFileSync(path.join(BAKE, 'cikis.bin'));
  const view = ([o, n], T) => new T(blob.buffer.slice(blob.byteOffset + o, blob.byteOffset + o + n * 4));
  const spec = {uretim: 'tools/batch-delivery/make-tur10-web.mjs', dolgu_px: out.dolgu_px, atlaslar: {}};
  for (const [atlas, entry] of Object.entries(out.atlaslar)) {
    const dugumler = {};
    for (const [key, rec] of Object.entries(entry.parcalar)) {
      const {node, prim} = targets.get(key);
      const vmap = view(rec.vmapping, Uint32Array), uv = view(rec.uv, Float32Array), indices = view(rec.indices, Uint32Array);
      if (prim.getAttribute('POSITION').getCount() !== rec.eski_kose) throw Error(`${key}: köşe sayısı tutmuyor`);
      // TEXCOORD_0 yoksa sıfırla eklenir: lightmap her zaman TEXCOORD_1'de
      if (!prim.getAttribute('TEXCOORD_0'))
        prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(rec.eski_kose * 2)).setBuffer(buffer));
      for (const semantic of prim.listSemantics()) {
        const acc = prim.getAttribute(semantic), size = acc.getElementSize(), arr = acc.getArray();
        const next = new arr.constructor(vmap.length * size);
        for (let i = 0; i < vmap.length; i++) for (let k = 0; k < size; k++) next[i * size + k] = arr[vmap[i] * size + k];
        prim.setAttribute(semantic, doc.createAccessor().setType(acc.getType()).setArray(next).setNormalized(acc.getNormalized()).setBuffer(buffer));
      }
      prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(indices).setBuffer(buffer));
      prim.setAttribute('TEXCOORD_1', doc.createAccessor().setType('VEC2').setArray(uv).setBuffer(buffer));
      const name = `LM_${atlas}_${Object.keys(dugumler).length.toString().padStart(3, '0')}`;
      node.setName(name).setExtras({...node.getExtras(), lightmap: {atlas, texcoord: 1}});
      prim.getMaterial().setExtras({...prim.getMaterial().getExtras(), lightmap: {atlas, texcoord: 1}});
      dugumler[name] = {texcoord: 1, malzeme: prim.getMaterial().getName()};
    }
    const {parcalar, ...summary} = entry;
    spec.atlaslar[atlas] = {...summary, dosya: 'tur10/BUILDING-opt-v6', dugumler}; // 03_web_isik: build/bake/<dosya>-lm.glb
  }
  return spec;
}

async function writeWeb(doc, out) {
  await doc.transform(textureCompress({encoder: sharp, targetFormat: 'webp', resize: [MAX_EDGE, MAX_EDGE], quality: 88}), unpartition(), draco({method: 'edgebreaker'}));
  await io.write(out, doc);
  const check = (await io.read(out)).getRoot();
  console.log(path.basename(out), `${(statSync(out).size / 1e6).toFixed(2)} MB`,
    `çizim ${check.listMeshes().flatMap(m => m.listPrimitives()).length}`, `malzeme ${check.listMaterials().length}`,
    `UV1 ${check.listMeshes().flatMap(m => m.listPrimitives()).filter(p => p.getAttribute('TEXCOORD_1')).length}`);
}

// --- BUILDING ----------------------------------------------------------------
{
  const doc = await load([path.join(SRC, 'BUILDING-opt-v6-alt.glb'), path.join(SRC, 'BUILDING-opt-v6-ust.glb')], {stairRepair: true});
  const before = box(doc);
  await doc.transform(dedup(), flatten(), join({keepNamed: false}), prune({keepAttributes: false}),
    textureCompress({encoder: sharp, resize: [MAX_EDGE, MAX_EDGE]}));
  splitPrimitives(doc);
  const spec = lightmapUV(doc);
  const after = box(doc);
  const drift = Math.max(...before.min.map((v, i) => Math.abs(v - after.min[i])), ...before.max.map((v, i) => Math.abs(v - after.max[i])));
  if (drift > 0.002) throw Error(`BUILDING: sınır kutusu kaydı ${drift} m`);
  console.log('BUILDING kutu', fmt(after), `kayma ${drift.toExponential(1)} m`);
  await doc.transform(unpartition());
  await io.write(path.join(BAKE, 'BUILDING-opt-v6-lm.glb'), doc);
  // bahçe: Tur 6'nın lightmap UV'li bahçesi aynen (build/bake/GARDEN-opt-v2-lm.glb)
  const old = JSON.parse(readFileSync(path.join(REPO, 'build/bake/lightmap-uv.json'), 'utf8'));
  spec.atlaslar.bahce = {...old.atlaslar.bahce, dosya: 'GARDEN-opt-v2',
    dugumler: Object.fromEntries(Object.entries(old.atlaslar.bahce.dugumler).map(([n, d]) => [n, {texcoord: d.texcoord}]))};
  spec.sahne = ['tur10/BUILDING-opt-v6-lm.glb', 'GARDEN-opt-v2-lm.glb', 'tur10/INTERIOR-opt-v3-sahne.glb'];
  spec.isiklar = 'tools/blender/isiklar-v2.json';
  writeFileSync(path.join(BAKE, 'lightmap-uv.json'), JSON.stringify(spec, null, 1));
  copyFileSync(path.join(SRC, 'isiklar-v2.json'), path.join(REPO, 'tools/blender/isiklar-v2.json'));
  await writeWeb(doc, path.join(DIR, 'BUILDING-opt-v6.glb'));
}

// --- INTERIOR (mobilya; lightmap almaz, pişirmede gölge verir) ----------------
{
  const doc = await load([path.join(SRC, 'INTERIOR-opt-v3.glb')]);
  await doc.transform(dedup(), prune({keepAttributes: false}), textureCompress({encoder: sharp, resize: [MAX_EDGE, MAX_EDGE]}), unpartition());
  await io.write(path.join(BAKE, 'INTERIOR-opt-v3-sahne.glb'), doc);
  await writeWeb(doc, path.join(DIR, 'INTERIOR-opt-v3.glb'));
}
for (const f of ['BUILDING-opt-v6-lm.glb', 'INTERIOR-opt-v3-sahne.glb'])
  console.log('pişirme', f, `${(statSync(path.join(BAKE, f)).size / 1e6).toFixed(1)} MB`);
