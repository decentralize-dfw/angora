// Işık pişirme (Blender) için web modellerinin SIKIŞTIRILMAMIŞ kopyası.
// Blender'ın glTF içe aktarıcısı meshopt'u okuyamıyor; Draco'yu da açarken
// köşe sırasını değiştirebilir. Burada geometri AYNEN (yalnız sıkıştırması
// açılmış) yazılır; lightmap UV'leri bu dosyalar üzerinde hesaplanır.
//   node decode-for-bake.mjs  ->  build/bake/<ad>.decoded.glb
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dequantize} from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import {MeshoptDecoder} from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'meshopt.decoder': MeshoptDecoder});
const SRC = '/home/user/angora/build/web/26092026', OUT = '/home/user/angora/build/bake';
for (const name of ['BUILDING-opt-v4', 'INTERIOR-opt-v2', 'GARDEN-opt-v2']) {
  const doc = await io.read(`${SRC}/${name}.glb`);
  for (const ext of doc.getRoot().listExtensionsUsed())
    if (['KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_mesh_quantization'].includes(ext.extensionName)) ext.dispose();
  await doc.transform(dequantize());
  await io.write(`${OUT}/${name}.decoded.glb`, doc);
  console.log(name, 'ok');
}
