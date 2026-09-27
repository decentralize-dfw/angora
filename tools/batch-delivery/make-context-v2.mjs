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
  for (const m of doc.getRoot().listMaterials()) {
    if (!/^neighbor_wall/i.test(m.getName())) continue;
    m.setBaseColorTexture(null).setNormalTexture(null).setMetallicRoughnessTexture(null).setOcclusionTexture(null)
      .setBaseColorFactor([...WHITE, 1]).setRoughnessFactor(.92).setMetallicFactor(0);
    console.log('cephe düz mat beyaz:', m.getName());
  }
});
await build('cevre-yol-opt-v2.glb', 'CEVRE-YOL-opt-v2.glb');
