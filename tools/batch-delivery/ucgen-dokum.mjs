// Ham üçgen dökümü (dünya koordinatı, çalışma anı değişikliği yok): node ucgen-dokum.mjs <cikis> <glb>...
// <cikis>.bin float32 Nx3x3, <cikis>.json [[düğüm, malzeme, üçgen sayısı], ...] (tools/cad/cati_tavan_ozgun.py girdisi)
import fs from 'node:fs';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import {MeshoptDecoder} from 'meshoptimizer';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder': await draco3d.createDecoderModule(), 'meshopt.decoder': MeshoptDecoder});
const [out, ...files] = process.argv.slice(2); const P = [], meta = [];
for (const f of files) { const doc = await io.read(f);
for (const node of doc.getRoot().listNodes()) { const mesh = node.getMesh(); if (!mesh) continue; const w = node.getWorldMatrix();
  for (const p of mesh.listPrimitives()) { const m = p.getMaterial()?.getName() ?? ''; const A = p.getAttribute('POSITION').getArray(), I = p.getIndices()?.getArray() ?? [...Array(A.length/3).keys()];
    for (let t = 0; t < I.length; t++) { const i = I[t]; for (let k = 0; k < 3; k++) P.push(w[k]*A[i*3]+w[4+k]*A[i*3+1]+w[8+k]*A[i*3+2]+w[12+k]); }
    meta.push([node.getName(), m, I.length/3]); } } }
fs.writeFileSync(out+'.bin', Buffer.from(new Float32Array(P).buffer)); fs.writeFileSync(out+'.json', JSON.stringify(meta)); console.log(P.length/9);
