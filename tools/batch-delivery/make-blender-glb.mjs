// Blender 3.6 için tek dosya: Draco YOK, KTX2 YOK, bütün malzemeler içinde.
//
// Kaynak build/web/native-current/ - 12 parça .gpu.gltf, 171 benzersiz malzeme
// adı. Web teslimatı iki şeyi Blender'ın okuyamayacağı hale getiriyor:
//   1. KHR_draco_mesh_compression - 3.6 açabilir ama kullanıcı istemiyor
//   2. KHR_texture_basisu (KTX2) - 3.6 BUNU OKUYAMAZ
// Her dokunun zaten bir PNG `source` yedeği var; basisu uzantısını KAYIT
// ETMEYEREK gltf-transform'un PNG'yi tutmasını sağlıyoruz (basisu yalnız
// extensionsUsed'da, extensionsRequired'da DEĞİL - bu yüzden güvenli).
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS, KHRDracoMeshCompression} from '@gltf-transform/extensions';
import {dedup, prune, unpartition, mergeDocuments} from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import fs from 'node:fs';
import path from 'node:path';

const SRC = '/home/user/angora/build/web/native-current';
const OUT = process.argv[2] ?? '/home/user/angora/build/blender/angora-blender36-full.glb';

// KHR_texture_basisu DIŞINDA her uzantı kayıtlı: kayıtsız uzantı okunurken
// yok sayılır, texture.source (PNG) olduğu gibi kalır.
const extensions = ALL_EXTENSIONS.filter(e => e.EXTENSION_NAME !== 'KHR_texture_basisu');

const io = new NodeIO()
  .registerExtensions(extensions)
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
  });

const parts = fs.readdirSync(SRC).filter(f => f.endsWith('.gltf')).sort();
console.log(`${parts.length} parça okunuyor...`);

let doc = null;
for (const part of parts) {
  const t0 = Date.now();
  const next = await io.read(path.join(SRC, part));
  if (!doc) { doc = next; }
  else { mergeDocuments(doc, next); }
  console.log(`  ${part.padEnd(32)} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

// merge() her parçanın sahnesini ayrı bırakır; Blender'da tek sahne istiyoruz.
const root = doc.getRoot();
const scenes = root.listScenes();
const main = scenes[0];
main.setName('Angora21');
for (const scene of scenes.slice(1)) {
  for (const node of scene.listChildren()) main.addChild(node);
  scene.dispose();
}
root.setDefaultScene(main);

// Draco uzantısını belgeden düşür - geometri çözüldü, yeniden kodlanmasın.
for (const ext of root.listExtensionsUsed()) {
  if (ext.extensionName === KHRDracoMeshCompression.EXTENSION_NAME) ext.dispose();
}

// VRM eklentisinin materyal extras'ına bıraktığı artık - 227 malzemede
// tekrar ediyor, Blender'da hiçbir karşılığı yok.
let stripped = 0;
for (const material of root.listMaterials()) {
  const extras = material.getExtras();
  if (extras && extras.vrm_addon_extension) {
    const {vrm_addon_extension, ...rest} = extras;
    material.setExtras(rest);
    stripped++;
  }
}

await doc.transform(
  dedup(),    // shared/ içerik-hash'li: parçalar arası aynı doku/accessor teke iner
  prune(),        // basisu düşünce sahipsiz kalan görüntüler
  unpartition(), // GLB tek buffer ister: 12 parçanın .bin'i teke iner
);

fs.mkdirSync(path.dirname(OUT), {recursive: true});
await io.write(OUT, doc);

const r = doc.getRoot();
const bytes = fs.statSync(OUT).size;
console.log('\n--- ÇIKTI ---');
console.log('dosya           :', OUT, (bytes / 1048576).toFixed(1) + ' MB');
console.log('malzeme         :', r.listMaterials().length,
  '(benzersiz ad: ' + new Set(r.listMaterials().map(m => m.getName())).size + ')');
console.log('mesh            :', r.listMeshes().length);
console.log('doku            :', r.listTextures().length);
console.log('VRM extras silindi:', stripped);
console.log('uzantılar       :', r.listExtensionsUsed().map(e => e.extensionName).join(', ') || '(yok)');
