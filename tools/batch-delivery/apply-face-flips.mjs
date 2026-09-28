// Ters dönük pişen yüzleri çevirir (tools/blender/yuz_yonu.py çıktısı).
//
//   node apply-face-flips.mjs      (apply-lightmap-uv.mjs'ten SONRA, bir kez)
//   girdi/çıktı: build/bake/<ad>-lm.glb, build/bake/yuz-cevir.json
//
// Ters üçgenin sarımı çevrilir, köşe normalleri eksi yapılır. Bir köşe hem
// ters hem düz üçgenlerce paylaşılıyorsa çoğaltılır. Düğüme
// extras.facesFlipped yazılır; ikinci çalıştırma dosyayı değiştirmez.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import fs from 'node:fs';

const BAKE = '/home/user/angora/build/bake';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const flips = JSON.parse(fs.readFileSync(`${BAKE}/yuz-cevir.json`, 'utf8'));

for (const [file, nodes] of Object.entries(flips)) {
  const path = `${BAKE}/${file}-lm.glb`;
  const doc = await io.read(path);
  const buffer = doc.getRoot().listBuffers()[0];
  const byName = new Map(doc.getRoot().listNodes().map(n => [n.getName(), n]));
  let changed = 0;
  for (const [name, list] of Object.entries(nodes)) {
    const node = byName.get(name);
    if (!node) throw new Error(`${file}: düğüm yok: ${name}`);
    if (node.getExtras().facesFlipped) continue;
    const [prim] = node.getMesh().listPrimitives();
    const index = Array.from(prim.getIndices().getArray());
    const count = prim.getAttribute('POSITION').getCount();
    const flipped = new Uint8Array(index.length / 3);
    for (const t of list) flipped[t] = 1;
    const users = new Uint8Array(count);               // bit 1: düz, bit 2: ters
    for (let t = 0; t < flipped.length; t++)
      for (let k = 0; k < 3; k++) users[index[t * 3 + k]] |= flipped[t] ? 2 : 1;
    // paylaşılan köşeler çoğaltılır
    const dup = new Map();
    let next = count;
    for (let t = 0; t < flipped.length; t++) {
      if (!flipped[t]) continue;
      for (let k = 0; k < 3; k++) {
        const v = index[t * 3 + k];
        if (users[v] === 3) { if (!dup.has(v)) dup.set(v, next++); index[t * 3 + k] = dup.get(v); }
      }
      [index[t * 3 + 1], index[t * 3 + 2]] = [index[t * 3 + 2], index[t * 3 + 1]];
    }
    const source = [...dup.keys()];
    for (const semantic of prim.listSemantics()) {
      const acc = prim.getAttribute(semantic), size = acc.getElementSize(), array = acc.getArray();
      const out = new array.constructor(next * size);
      out.set(array);
      source.forEach((v, i) => { for (let k = 0; k < size; k++) out[(count + i) * size + k] = array[v * size + k]; });
      if (semantic === 'NORMAL') {
        for (let v = 0; v < count; v++) if (users[v] === 2) for (let k = 0; k < 3; k++) out[v * 3 + k] *= -1;
        for (let i = 0; i < source.length; i++) for (let k = 0; k < 3; k++) out[(count + i) * 3 + k] *= -1;
      }
      prim.setAttribute(semantic, doc.createAccessor().setType(acc.getType()).setArray(out).setNormalized(acc.getNormalized()).setBuffer(buffer));
    }
    prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(index)).setBuffer(buffer));
    node.setExtras({...node.getExtras(), facesFlipped: list.length});
    changed++;
  }
  for (const acc of doc.getRoot().listAccessors()) if (!acc.listParents().some(p => p.propertyType !== 'Root')) acc.dispose();
  await io.write(path, doc);
  console.log(file, changed, 'düğüm çevrildi');
}
