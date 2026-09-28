// tools/blender/lightmap_uv.py çıktısını (xatlas) GLB'lere yazar.
//
//   node apply-lightmap-uv.mjs
//   girdi : build/bake/<ad>.decoded.glb, build/bake/lightmap-uv.{json,bin}
//   çıktı : build/bake/<ad>-lm.glb  (SIKIŞTIRMASIZ - Blender pişirme sahnesi için)
//
// Pişen her ilkelde köşeler UV dikişlerinde çoğaltılır (vmapping: yeni -> eski
// köşe), bütün öznitelikler buna göre yeniden dizilir, indeksler xatlas'ın
// verdiğiyle değişir ve lightmap UV'si ilk boş TEXCOORD_n kanalına eklenir.
// Düğüme extras.lightmap = {atlas, texcoord} yazılır; Blender tarafı bu
// kanalı "Lightmap" diye adlandırır, web tarafı aynı kanalı okur.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import fs from 'node:fs';

const BAKE = '/home/user/angora/build/bake';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const spec = JSON.parse(fs.readFileSync(`${BAKE}/lightmap-uv.json`, 'utf8'));
const blob = fs.readFileSync(`${BAKE}/lightmap-uv.bin`);
const view = ([offset, count], Type) => new Type(blob.buffer.slice(blob.byteOffset + offset, blob.byteOffset + offset + count * 4));

const byFile = {};
for (const [atlas, entry] of Object.entries(spec.atlaslar))
  for (const [node, data] of Object.entries(entry.dugumler)) (byFile[entry.dosya] ??= []).push({atlas, node, data});

for (const [file, items] of Object.entries(byFile)) {
  const doc = await io.read(`${BAKE}/${file}.decoded.glb`);
  const buffer = doc.getRoot().listBuffers()[0];
  const nodes = new Map(doc.getRoot().listNodes().map(n => [n.getName(), n]));
  for (const {atlas, node: name, data} of items) {
    const node = nodes.get(name);
    if (!node) throw new Error(`${file}: düğüm yok: ${name}`);
    const [prim] = node.getMesh().listPrimitives();
    const vmap = view(data.vmapping, Uint32Array), indices = view(data.indices, Uint32Array), uv = view(data.uv, Float32Array);
    const oldCount = prim.getAttribute('POSITION').getCount();
    if (oldCount !== data.eski_kose) throw new Error(`${name}: köşe sayısı tutmuyor ${oldCount} != ${data.eski_kose}`);
    for (const semantic of prim.listSemantics()) {
      const src = prim.getAttribute(semantic), size = src.getElementSize(), array = src.getArray();
      const out = new array.constructor(vmap.length * size);
      for (let i = 0; i < vmap.length; i++) for (let k = 0; k < size; k++) out[i * size + k] = array[vmap[i] * size + k];
      const acc = doc.createAccessor().setType(src.getType()).setArray(out).setNormalized(src.getNormalized()).setBuffer(buffer);
      prim.setAttribute(semantic, acc);
    }
    prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(indices).setBuffer(buffer));
    let channel = 0;
    while (prim.getAttribute(`TEXCOORD_${channel}`)) channel++;
    prim.setAttribute(`TEXCOORD_${channel}`, doc.createAccessor().setType('VEC2').setArray(uv).setBuffer(buffer));
    node.setExtras({...node.getExtras(), lightmap: {atlas, texcoord: channel}});
    data.texcoord = channel;
  }
  for (const acc of doc.getRoot().listAccessors()) if (!acc.listParents().some(p => p.propertyType !== 'Root')) acc.dispose();
  await io.write(`${BAKE}/${file}-lm.glb`, doc);
  console.log(file, items.length, 'düğüm ->', `${file}-lm.glb`);
}
// texcoord kanallarını tanım dosyasına geri yaz (web ve Blender aynı kanalı okur)
fs.writeFileSync(`${BAKE}/lightmap-uv.json`, JSON.stringify(spec, null, 1));
