// Web modellerinin malzeme envanteri (ajan fotoğrafla karşılaştırıp öneri yazsın diye).
//   node malzeme-envanter.mjs  ->  tools/blender/malzemeler.json
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import {MeshoptDecoder} from 'meshoptimizer';
import fs from 'node:fs';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'meshopt.decoder': MeshoptDecoder});
const r = v => Math.round(v * 1000) / 1000;
const out = {aciklama: 'Web modellerindeki malzemelerin ŞU ANKİ değerleri. renk: baseColorFactor (doku varsa onunla çarpılır). pürüzlülük 0 ayna - 1 mat.', dosyalar: {}};
for (const f of ['BUILDING-opt-v4', 'INTERIOR-opt-v2', 'GARDEN-opt-v2']) {
  const doc = await io.read(`/home/user/angora/build/web/26092026/${f}.glb`);
  const list = {};
  for (const m of doc.getRoot().listMaterials()) {
    const ext = n => m.getExtension(n);
    const users = m.listParents().filter(p => p.propertyType === 'Primitive');
    let tris = 0; for (const p of users) tris += (p.getIndices()?.getCount() ?? 0) / 3;
    list[m.getName()] = {
      ucgen: tris,
      renk: m.getBaseColorFactor().map(r), renk_dokusu: Boolean(m.getBaseColorTexture()),
      purluluk: r(m.getRoughnessFactor()), metallik: r(m.getMetallicFactor()),
      purluluk_dokusu: Boolean(m.getMetallicRoughnessTexture()), normal_dokusu: Boolean(m.getNormalTexture()),
      normal_siddeti: m.getNormalTexture() ? r(m.getNormalScale()) : null, ao_dokusu: Boolean(m.getOcclusionTexture()),
      isik_yayma: m.getEmissiveFactor().map(r), alfa: m.getAlphaMode(),
      clearcoat: ext('KHR_materials_clearcoat') ? r(ext('KHR_materials_clearcoat').getClearcoatFactor()) : null,
      specular: ext('KHR_materials_specular') ? r(ext('KHR_materials_specular').getSpecularFactor()) : null,
      gecirgenlik: ext('KHR_materials_transmission') ? r(ext('KHR_materials_transmission').getTransmissionFactor()) : null,
    };
  }
  out.dosyalar[f] = list;
}
fs.writeFileSync('/home/user/angora/tools/blender/malzemeler.json', JSON.stringify(out, null, 1) + '\n');
console.log(Object.entries(out.dosyalar).map(([f, l]) => f + ': ' + Object.keys(l).length).join(', '));
