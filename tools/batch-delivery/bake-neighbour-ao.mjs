// V-RAY D2: komşu evlere pişmiş köşe (tepe noktası) AO'su.
//
//   node tools/batch-delivery/bake-neighbour-ao.mjs <girdi.glb> <çıktı.glb> [--from <ao-kaynak.glb>]
//
// KOMSULAR-opt-v2 düz, dokusuz beyaz cephe: saçak altları, pencere girintileri,
// iki evin birbirine bakan duvarları gün ışığında aynı beyazda okunuyor ve
// mahalle "maket" gibi duruyor. Her tepe noktasından normal yarıküresine 24
// kosinüs ağırlıklı ışın atılır (3 m), yakın çarpmalar daha çok karartır; sonuç
// COLOR_0 olarak yazılır (0,38 en koyu - siyaha değil, gölgeli sıvaya iner).
// Cam hem ışın engeli sayılmaz hem de kendi rengi 1'dir. Geometri, UV, doku ve
// sıkıştırma (Draco, KTX2) değişmez; çıktı ayrı dosyadır, eskisi silinmez.
// Çalışma zamanında yalnız bu dosyanın malzemeleri vertexColors ile okunur.
//
// --from: telefon dosyası aynı geometriyi taşır; AO masaüstünden kopyalanır
// (ilkel ve tepe noktası sayıları birebir eşleşmezse durur).
import {Worker, isMainThread, parentPort, workerData} from 'node:worker_threads';
import {cpus} from 'node:os';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import * as THREE from 'three';
import {MeshBVH} from 'three-mesh-bvh';

const RAYS = 24, MAX_DIST = 3.0, FLOOR = .38;

if (!isMainThread) {
  const {positions, index, origins, normals, start, end} = workerData;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  // MeshBVH indeksi YERİNDE yeniden sıralar: paylaşılan tampon dört iş parçacığında bozuluyordu - her biri kendi kopyası.
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(index).slice(), 1));
  const bvh = new MeshBVH(geometry, {maxLeafSize: 8});
  const O = new Float32Array(origins), N = new Float32Array(normals);
  const out = new Float32Array(end - start);
  const ray = new THREE.Ray(), n = new THREE.Vector3(), t = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3();
  // sabit (tekrarlanabilir) düşük tutarsızlıklı yön seti
  const dirs = [];
  for (let k = 0; k < RAYS; k++) {
    const u = (k + .5) / RAYS, v = (k * .618033988749895) % 1;
    const r = Math.sqrt(u), phi = 2 * Math.PI * v;
    dirs.push([r * Math.cos(phi), r * Math.sin(phi), Math.sqrt(1 - u)]);
  }
  for (let i = start; i < end; i++) {
    n.set(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]);
    if (n.lengthSq() < 1e-8) {out[i - start] = 1; continue;}
    n.normalize();
    t.set(Math.abs(n.x) < .9 ? 1 : 0, Math.abs(n.x) < .9 ? 0 : 1, 0).cross(n).normalize(); b.crossVectors(n, t);
    ray.origin.set(O[i * 3], O[i * 3 + 1], O[i * 3 + 2]).addScaledVector(n, .02);
    let occ = 0;
    for (const [x, y, z] of dirs) {
      d.set(0, 0, 0).addScaledVector(t, x).addScaledVector(b, y).addScaledVector(n, z).normalize();
      ray.direction.copy(d);
      const hit = bvh.raycastFirst(ray, THREE.DoubleSide, 0, MAX_DIST);
      if (hit) occ += 1 - hit.distance / MAX_DIST * .6;   // yakın çarpma daha karanlık
    }
    out[i - start] = 1 - occ / RAYS;
    if ((i - start) % 100000 === 0 && i > start) parentPort.postMessage({progress: i - start});
  }
  parentPort.postMessage({done: out.buffer}, [out.buffer]);
} else {
  const args = process.argv.slice(2);
  const [input, output] = args;
  const fromAt = args.indexOf('--from');
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  });
  const doc = await io.read(input);
  const prims = [];
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh(); if (!mesh) continue;
    const m = new THREE.Matrix4().fromArray(node.getWorldMatrix());
    for (const prim of mesh.listPrimitives()) prims.push({prim, m, glass: /glaz|glass|cam/i.test(prim.getMaterial()?.getName() ?? '')});
  }
  let aoPerPrim;
  if (fromAt >= 0) {
    const src = await io.read(args[fromAt + 1]);
    const srcPrims = src.getRoot().listMeshes().flatMap(mesh => mesh.listPrimitives());
    if (srcPrims.length !== prims.length) throw Error(`ilkel sayısı farklı: ${srcPrims.length} / ${prims.length}`);
    aoPerPrim = srcPrims.map((p, i) => {
      const c = p.getAttribute('COLOR_0'), count = prims[i].prim.getAttribute('POSITION').getCount();
      if (!c || c.getCount() !== count) throw Error(`ilkel ${i}: tepe noktası sayısı farklı ya da AO yok`);
      return c.getArray();
    });
  } else {
    // engel geometrisi (dünya uzayı, cam hariç) + hedef tepe noktaları
    const occPos = [], occIdx = []; let base = 0;
    const origins = [], normals = [], ranges = [];
    const v = new THREE.Vector3(), nm = new THREE.Matrix3();
    for (const {prim, m, glass} of prims) {
      const pos = prim.getAttribute('POSITION'), nor = prim.getAttribute('NORMAL'), idx = prim.getIndices();
      nm.getNormalMatrix(m);
      const count = pos.getCount(), first = origins.length / 3;
      for (let i = 0; i < count; i++) {
        v.fromArray(pos.getElement(i, [])).applyMatrix4(m); origins.push(v.x, v.y, v.z);
        if (!glass) occPos.push(v.x, v.y, v.z);
        v.fromArray(nor ? nor.getElement(i, []) : [0, 1, 0]).applyMatrix3(nm); normals.push(v.x, v.y, v.z);
      }
      ranges.push({first, count, glass});
      if (!glass) { const a = idx.getArray(); for (let i = 0; i < a.length; i++) occIdx.push(a[i] + base); base += count; }
    }
    const total = origins.length / 3;
    console.log(`${prims.length} ilkel, ${total} tepe noktası, ${occIdx.length / 3} engel üçgeni`);
    const share = arr => {const buf = new SharedArrayBuffer(arr.length * 4); new Float32Array(buf).set(arr); return buf;};
    const posBuf = share(occPos), oBuf = share(origins), nBuf = share(normals);
    const iBuf = new SharedArrayBuffer(occIdx.length * 4); new Uint32Array(iBuf).set(occIdx);
    const workers = Math.max(1, cpus().length);
    const ao = new Float32Array(total);
    const t0 = Date.now();
    await Promise.all(Array.from({length: workers}, (_, w) => new Promise((resolve, reject) => {
      const start = Math.floor(total * w / workers), end = Math.floor(total * (w + 1) / workers);
      const worker = new Worker(new URL(import.meta.url), {workerData: {positions: posBuf, index: iBuf, origins: oBuf, normals: nBuf, start, end}});
      worker.on('message', msg => {
        if (msg.progress && w === 0) console.log(`  %${Math.round(msg.progress / (end - start) * 100)} (${((Date.now() - t0) / 1000).toFixed(0)} sn)`);
        if (msg.done) {ao.set(new Float32Array(msg.done), start); resolve();}
      });
      worker.on('error', reject);
    })));
    console.log(`AO: ${((Date.now() - t0) / 1000).toFixed(0)} sn`);
    aoPerPrim = ranges.map(({first, count, glass}) => {
      const c = new Uint8Array(count * 4);
      for (let i = 0; i < count; i++) {
        const g = glass ? 1 : FLOOR + (1 - FLOOR) * Math.max(0, Math.min(1, ao[first + i]));
        const q = Math.round(g * 255); c[i * 4] = c[i * 4 + 1] = c[i * 4 + 2] = q; c[i * 4 + 3] = 255;
      }
      return c;
    });
    let sum = 0; for (const x of ao) sum += x; console.log(`ortalama görünürlük ${(sum / total).toFixed(3)}`);
  }
  prims.forEach(({prim}, i) => {
    const acc = doc.createAccessor().setType('VEC4').setArray(new Uint8Array(aoPerPrim[i])).setNormalized(true).setBuffer(doc.getRoot().listBuffers()[0]);
    prim.setAttribute('COLOR_0', acc);
  });
  await io.write(output, doc);
  console.log('yazıldı', output);
}
