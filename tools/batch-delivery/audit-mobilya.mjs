// Mobilya çakışma denetimi: her MOBILYA_ düğümünün dünya kutusu (3 cm içeri) ile
// BUILDING'in zemin dışı üçgenleri (duvar, şömine, kapı, radyatör, dolap) kesişiyor mu?
//   node audit-mobilya.mjs
import {NodeIO, getBounds} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const B = await io.read('../../build/bake/tur10/BUILDING-opt-v6-lm.glb'), I = await io.read('../../build/bake/tur10/INTERIOR-opt-v3-sahne.glb');
const FLOOR = /^(WOOD-FL|wood_floor|terra_floor|terra_floor_giris|stone_tile|RR|R31 \| R33 .*tile|EK_M1_Sicak_ceviz_supurgelik)$/;
const pts = [];
for (const node of B.getRoot().listNodes()) {
  const mesh = node.getMesh(); if (!mesh) continue; const w = node.getWorldMatrix();
  for (const prim of mesh.listPrimitives()) {
    const mat = prim.getMaterial()?.getName() ?? ''; if (FLOOR.test(mat)) continue;
    const pos = prim.getAttribute('POSITION'), v = [0, 0, 0];
    for (let i = 0; i < pos.getCount(); i++) {pos.getElement(i, v); pts.push([w[0]*v[0]+w[4]*v[1]+w[8]*v[2]+w[12], w[1]*v[0]+w[5]*v[1]+w[9]*v[2]+w[13], w[2]*v[0]+w[6]*v[1]+w[10]*v[2]+w[14], mat]);}
  }
}
let bad = 0;
for (const node of I.getRoot().listNodes()) {
  if (!node.getName().startsWith('MOBILYA_')) continue;
  const b = getBounds(node), m = 0.03;
  const hits = {};
  for (const [x, y, z, mat] of pts) if (x > b.min[0] + m && x < b.max[0] - m && y > b.min[1] + m && y < b.max[1] - m && z > b.min[2] + m && z < b.max[2] - m) hits[mat] = (hits[mat] ?? 0) + 1;
  const list = Object.entries(hits).sort((a, c) => c[1] - a[1]);
  if (list.length) bad++;
  console.log(node.getName().padEnd(28), list.length ? 'ÇAKIŞMA: ' + list.slice(0, 4).map(([k, n]) => `${k} (${n})`).join(', ') : 'temiz');
}
console.log(bad ? `${bad} mobilyada çakışma` : 'mobilya çakışması yok');
