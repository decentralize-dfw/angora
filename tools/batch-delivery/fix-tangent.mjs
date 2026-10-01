// Sıfır/bozuk uzunluklu TANGENT değerlerini normal'e dik geçerli bir vektörle değiştirir.
// Diğer her şey (mesh, malzeme, doku, ad) aynen kalır.
//   node fix-tangent.mjs girdi.glb [çıktı.glb]   (çıktı verilmezse üzerine yazar)
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';

const [inp, out = inp] = process.argv.slice(2);
if (!inp) throw Error('kullanım: node fix-tangent.mjs girdi.glb [çıktı.glb]');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inp);
let fixed = 0;
for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
  const T = prim.getAttribute('TANGENT'), N = prim.getAttribute('NORMAL');
  if (!T) continue;
  const t = T.getArray().slice(), n = N?.getArray();
  let changed = false;
  for (let i = 0; i < T.getCount(); i++) {
    const a = t[i*4], b = t[i*4+1], c = t[i*4+2], len = Math.hypot(a, b, c);
    if (Number.isFinite(len) && Math.abs(len - 1) < 5e-4 && (t[i*4+3] === 1 || t[i*4+3] === -1)) continue;
    let v;
    if (Number.isFinite(len) && len > 1e-6) v = [a/len, b/len, c/len];
    else {
      const nx = n ? n[i*3] : 0, ny = n ? n[i*3+1] : 1, nz = n ? n[i*3+2] : 0;
      const r = Math.abs(ny) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      v = [ny*r[2] - nz*r[1], nz*r[0] - nx*r[2], nx*r[1] - ny*r[0]];
      const l = Math.hypot(...v); v = l > 1e-6 ? v.map(x => x / l) : [1, 0, 0];
    }
    t.set([...v, t[i*4+3] < 0 ? -1 : 1], i*4); fixed++; changed = true;
  }
  if (changed) {
    // Aynı accessor başka primitive'lerde de kullanılıyorsa onları bozmamak için kopya.
    prim.setAttribute('TANGENT', doc.createAccessor().setType('VEC4').setArray(t).setBuffer(T.getBuffer()));
  }
}
await io.write(out, doc);
console.log(`${inp}: ${fixed} tangent düzeltildi -> ${out}`);
