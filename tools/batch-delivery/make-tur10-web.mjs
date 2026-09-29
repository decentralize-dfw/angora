// Tur 10 web teslimi -> sitenin yükleyeceği iki dosya.
//
//   node make-tur10-web.mjs
//
// Girdi (Blender ajanının modelleme dalındaki teslimi, depoya ALINMAZ):
//   build/web/26092026/source/tur10/BUILDING-opt-v6-alt.glb  (bodrum + giriş)
//   build/web/26092026/source/tur10/BUILDING-opt-v6-ust.glb  (1. kat + çatı)
//   build/web/26092026/source/tur10/INTERIOR-opt-v3.glb
// Çıktı:
//   build/web/26092026/BUILDING-opt-v6.glb   (iki parça tek dosyada)
//   build/web/26092026/INTERIOR-opt-v3.glb
//
// Protokol v3/v4 ile aynı: Draco geometri, EXT_texture_webp, doku kenarı en
// çok 1024 (teslim 2048 JPEG/PNG). Ek olarak:
//   * iki BUILDING parçası tek sahnede; ortak malzeme/dokular tekilleştirilir
//     (iki parça aynı 48 malzemeyi ayrı ayrı taşıyor),
//   * EKLER'in 1 700+ küçük düğümü (zincir halkaları, korkuluk modülleri...)
//     malzeme başına birleştirilir - her biri ayrı çizim çağrısı olurdu
//     (INTERIOR birleştirilmez: mobilya anahtarı düğüm adlarını okuyor),
//   * pişirme artığı TEXCOORD_1..3 ve COLOR_1 atılır (sitenin pişmiş ışığı
//     ayrı v5 dosyalarından gelir; bu dosyalar için yeniden pişirilecek).
//     COLOR_0 kalır: foto 40 desenli camın alfası orada.
// Sonunda birleştirmeden önceki ve sonraki dünya sınır kutuları karşılaştırılır.
import {NodeIO, getBounds} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {mergeDocuments, dedup, flatten, join, prune, unpartition, draco, textureCompress} from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';
import {statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(here, '../../build/web/26092026');
const SRC = path.join(DIR, 'source/tur10');
const MAX_EDGE = 1024;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

const DROP = ['TEXCOORD_1', 'TEXCOORD_2', 'TEXCOORD_3', 'COLOR_1'];
const box = doc => getBounds(doc.getRoot().listScenes()[0]);
const fmt = b => b.min.map((v, i) => `${v.toFixed(3)}..${b.max[i].toFixed(3)}`).join(' ');

async function build(sources, out, {joinMeshes}) {
  const doc = await io.read(sources[0]);
  const root = doc.getRoot();
  const scene = root.listScenes()[0];
  for (const extra of sources.slice(1)) {
    const other = await io.read(extra);
    const map = mergeDocuments(doc, other);
    for (const s of other.getRoot().listScenes()) {
      const merged = map.get(s);
      for (const n of merged.listChildren()) {merged.removeChild(n); scene.addChild(n);}
      merged.dispose();
    }
  }
  const before = box(doc);
  const nodesBefore = root.listNodes().length;
  for (const prim of root.listMeshes().flatMap(m => m.listPrimitives()))
    for (const semantic of DROP) if (prim.getAttribute(semantic)) prim.setAttribute(semantic, null);
  // extras: yalnız kat etiketi kalır (kaynak_* kayıtları teslim klasöründe).
  for (const node of root.listNodes()) {
    const kat = node.getExtras()?.kat;
    node.setExtras(kat ? {kat} : {});
  }
  await doc.transform(
    dedup(),
    ...(joinMeshes ? [flatten(), join({keepNamed: false})] : []),
    prune({keepAttributes: false}),
    textureCompress({encoder: sharp, targetFormat: 'webp', resize: [MAX_EDGE, MAX_EDGE], quality: 88}),
    unpartition(),
    draco({method: 'edgebreaker'}),
  );
  const after = box(doc);
  const drift = Math.max(...before.min.map((v, i) => Math.abs(v - after.min[i])), ...before.max.map((v, i) => Math.abs(v - after.max[i])));
  if (drift > 0.002) throw Error(`${out}: sınır kutusu kaydı ${drift} m`);
  await io.write(out, doc);
  const check = (await io.read(out)).getRoot();
  console.log(path.basename(out), `${(statSync(out).size / 1e6).toFixed(2)} MB`,
    `düğüm ${nodesBefore} -> ${check.listNodes().length}`,
    `çizim ${check.listMeshes().flatMap(m => m.listPrimitives()).length}`,
    `malzeme ${check.listMaterials().length}`, `doku ${check.listTextures().length}`,
    `\n  kutu ${fmt(after)} (kayma ${drift.toExponential(1)} m)`);
}

await build([path.join(SRC, 'BUILDING-opt-v6-alt.glb'), path.join(SRC, 'BUILDING-opt-v6-ust.glb')], path.join(DIR, 'BUILDING-opt-v6.glb'), {joinMeshes: true});
await build([path.join(SRC, 'INTERIOR-opt-v3.glb')], path.join(DIR, 'INTERIOR-opt-v3.glb'), {joinMeshes: false});
