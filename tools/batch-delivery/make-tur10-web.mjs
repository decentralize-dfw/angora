// Tur 10 web teslimi -> sitenin yükleyeceği dosyalar + ışık pişirme sahnesi.
//
//   node make-tur10-web.mjs
//
// Girdi (Blender ajanının modelleme dalındaki teslimi, depoya ALINMAZ):
//   build/web/26092026/source/tur10/BUILDING-opt-v6-alt.glb  (bodrum + giriş)
//   build/web/26092026/source/tur10/BUILDING-opt-v6-ust.glb  (1. kat + çatı)
//   build/web/26092026/source/tur10/INTERIOR-opt-v3.glb
//   build/web/26092026/source/tur10/isiklar-v2.json
// Çıktı:
//   build/web/26092026/BUILDING-opt-v6.glb    site: Draco + WebP 1024, lightmap UV'li (TEXCOORD_1)
//   build/web/26092026/INTERIOR-opt-v3.glb    site: Draco + WebP 1024
//   build/bake/tur10/BUILDING-opt-v6-lm.glb   pişirme: SIKIŞTIRMASIZ, aynı geometri ve UV
//   build/bake/tur10/INTERIOR-opt-v3-sahne.glb
//   build/bake/tur10/lightmap-uv.json         atlaslar, düğümler, sahne dosyaları (02_pisir.py --tur10)
//
// Adımlar:
//   1. Merdiven onarımı (bodrum -> giriş iç merdiveni, aşağıda),
//   2. iki BUILDING parçası tek sahne; ortak malzeme/dokular tekilleştirilir,
//   3. EKLER'in 1 700+ küçük düğümü malzeme başına birleştirilir, sonra her
//      düğüm TEK ilkel taşıyacak şekilde ayrılır (pişirme nesne başına atlas),
//   4. lightmap UV: YALNIZ büyük yüzeyler (ATLASES), xatlas ile tek sayfa
//      (tools/blender/lightmap_uv_tur10.py). Kapı, kasa, kartonpiyer, dolap,
//      korkuluk, armatür, cam, metal lightmap almaz - sitede canlı ışık alır.
//   5. pişirme dosyası ve site dosyası AYNI belgeden yazılır: geometri ve UV
//      bire bir aynıdır (site dosyası yalnız sıkıştırılmıştır).
import {NodeIO, getBounds} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {mergeDocuments, dedup, flatten, join, prune, unpartition, draco, textureCompress} from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, statSync, writeFileSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {orientForBake, dropCoveredDuplicates} from './tur10-yon.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '../..');
const DIR = path.join(REPO, 'build/web/26092026');
const SRC = path.join(DIR, 'source/tur10');
const BAKE = path.join(REPO, 'build/bake/tur10');
const PYTHON = process.env.PYTHON || 'python3';
const MAX_EDGE = 1024;
mkdirSync(BAKE, {recursive: true});

// Lightmap alan malzemeler (malzeme adıyla - site aynı malzemeyi tek parça çizer).
const ATLASES = {
  duvar: {boyut: 4096, malzemeler: ['Simple White Wall', 'EK_SimpleWhiteWall', 'EK_M2_Beyaz_merdiven_alti']},
  zemin: {boyut: 4096, malzemeler: ['ceiling.001', 'WOOD-FL', 'wood_floor', 'terra_floor', 'terra_floor_giris', 'stone_tile', 'WHT.001',
    'EK_M2_Ceviz_basamak', 'EK_M3_Krem_karo_esik', 'RR', 'EK_banyo_duvar',
    'R31 | R33 ivory wall ceramic', 'R31 | R33 master pale cream tile', 'R31 | R33 attic cream tile',
    'R31 | R33 entrance WC ochre tile', 'R31 | R33 attic tan mosaic band', 'R31 | R33 entrance navy mosaic band',
    'R31 | R33 master fine mosaic band', 'EK_cam_lambri']},
  cephe: {boyut: 2048, malzemeler: ['Stucco painted wall', 'roof-7', 'Stone gravel']},
};

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const DROP = ['TEXCOORD_1', 'TEXCOORD_2', 'TEXCOORD_3', 'COLOR_1'];
const box = doc => getBounds(doc.getRoot().listScenes()[0]);
const fmt = b => b.min.map((v, i) => `${v.toFixed(3)}..${b.max[i].toFixed(3)}`).join(' ');

// --- 1. Merdiven onarımı ---------------------------------------------------
// Bodrum -> giriş iç merdiveni (ikinci kol x 0,87..3,17, z -1,93..-0,93;
// basamaklar x 3,05'te y 1,69'dan x 1,0'da y 3,07'ye çıkıyor):
//  * EK_A08_F02_dolu_merdiven_alti 2,85 m'lik DİKDÖRTGEN kutuydu - ikinci
//    kolun basamaklarını gömüyordu. Üst yüzü kolun altından geçen eğik
//    düzleme indirilir: kutu merdiven altını dolduran kamaya döner.
//  * EK_A09_F47_tek_duvar iki kolun arasını tavana kadar kapatıyor, sahanlığı
//    da ikiye bölüyordu. Gerçekte orada duvar yok: silinir.
const STAIR = {x0: 0.87, x1: 3.17, yAtX1: 1.35, slope: 0.673}; // kama üstü: y = yAtX1 + (x1 - x) * slope
function repairStair(doc) {
  const nodes = new Map(doc.getRoot().listNodes().map(n => [n.getName(), n]));
  const edit = (name, fn) => {
    const node = nodes.get(name);
    if (!node) throw Error(`merdiven onarımı: düğüm yok: ${name}`);
    const w = node.getWorldMatrix();
    if (Math.abs(w[0] - 1) + Math.abs(w[5] - 1) + Math.abs(w[10] - 1) + Math.abs(w[1]) + Math.abs(w[2]) + Math.abs(w[4]) + Math.abs(w[6]) + Math.abs(w[8]) + Math.abs(w[9]) > 1e-4)
      throw Error(`merdiven onarımı: ${name} dönük/ölçekli, beklenmiyor`);
    const t = [w[12], w[13], w[14]];
    for (const prim of node.getMesh().listPrimitives()) fn(prim, t);
  };
  edit('EK_A08_F02_dolu_merdiven_alti', (prim, t) => {
    const pos = prim.getAttribute('POSITION'), nor = prim.getAttribute('NORMAL');
    const p = pos.getArray().slice(), n = nor?.getArray().slice();
    const len = Math.hypot(STAIR.slope, 1);
    for (let i = 0; i < p.length; i += 3) {
      const x = p[i] + t[0], y = p[i + 1] + t[1];
      if (y > 0.05) p[i + 1] = STAIR.yAtX1 + (STAIR.x1 - x) * STAIR.slope - t[1];
      else p[i + 1] = -0.085 - t[1]; // bodrum döşemesi -0,08: kama tabanı zemine oturur (8 cm havada duruyordu)
      if (n && n[i + 1] > 0.9) {n[i] = STAIR.slope / len; n[i + 1] = 1 / len; n[i + 2] = 0;}
    }
    pos.setArray(p); if (n) nor.setArray(n);
  });
  // F47 "tek duvar" iki kolun arasını tavana kadar kapatıyordu; gerçekte orada duvar yok.
  const wall = nodes.get('EK_A09_F47_tek_duvar');
  if (!wall) throw Error('merdiven onarımı: düğüm yok: EK_A09_F47_tek_duvar');
  wall.getMesh().dispose(); wall.dispose();
  // Eski modelin iki kol arasındaki duvarı (Simple White Wall, z -2,16..-1,90)
  // bodrum zemininden tavana (2,62) çıkıyor, sahanlığın üstünden de geçiyordu:
  // kollar arası kapalı görünüyordu. İkinci kolun alt çizgisine İNDİRİLİR
  // (kama düzlemi: x 3,17'de 1,35 -> x 0,87'de 2,90), sahanlık bölümünde
  // (x > 3,17) sahanlık altında (1,30) biter; kesik üstü beyaz kapakla kapanır.
  {
    const Z0 = -2.20, Z1 = -1.86, X0 = 0.30, X1 = 4.25;
    // kolun tepesinden (x 0,87) sonrası giriş katı döşemesinin altı: eğim orada durur (eskiden
    // x 0,30-0,83'te parkenin 14 cm'ye kadar üstüne beyaz kama olarak çıkıyordu)
    const top = x => (x <= STAIR.x1 ? STAIR.yAtX1 + (STAIR.x1 - Math.max(x, STAIR.x0)) * STAIR.slope : 1.30);
    let cutTris = 0, cap = null;
    for (const node of doc.getRoot().listNodes()) {
      const mesh = node.getMesh(); if (!mesh) continue;
      const w = node.getWorldMatrix(), t = [w[12], w[13], w[14]];
      if (Math.abs(w[0] - 1) + Math.abs(w[5] - 1) + Math.abs(w[10] - 1) > 1e-4) continue;
      for (const prim of mesh.listPrimitives()) {
        if (prim.getMaterial()?.getName() !== 'Simple White Wall') continue;
        const sems = prim.listSemantics(), acc = Object.fromEntries(sems.map(sm => [sm, prim.getAttribute(sm)]));
        const idx = prim.getIndices(), n = idx ? idx.getCount() : acc.POSITION.getCount();
        const vert = i => sems.map(sm => acc[sm].getElement(i, new Array(acc[sm].getElementSize()).fill(0)));
        const lerp = (a, b, f) => a.map((arr, k) => arr.map((x, j) => x + (b[k][j] - x) * f));
        const px = v => v[sems.indexOf('POSITION')];
        const out = []; let changed = false;
        for (let tt = 0; tt < n; tt += 3) {
          const tri = [0, 1, 2].map(k => vert(idx ? idx.getScalar(tt + k) : tt + k));
          const W = v => [px(v)[0] + t[0], px(v)[1] + t[1], px(v)[2] + t[2]];
          const inside = tri.every(v => {const [x, y, z] = W(v); return x > X0 && x < X1 && z > Z0 && z < Z1 && y > -0.2 && y < 2.75;});
          if (!inside) {out.push(tri); continue;}
          // x = 3,17 ile ikiye böl, her parçayı kendi üst sınırıyla kırp (y <= top(x))
          const clipBy = (poly, f) => {const r = []; for (let i = 0; i < poly.length; i++) {const a = poly[i], b = poly[(i + 1) % poly.length], fa = f(W(a)), fb = f(W(b)); if (fa >= 0) r.push(a); if ((fa >= 0) !== (fb >= 0)) r.push(lerp(a, b, fa / (fa - fb)));} return r;};
          const left = clipBy(clipBy(tri, ([x]) => STAIR.x1 - x), ([x, y]) => top(Math.min(x, STAIR.x1)) - y);
          const right = clipBy(clipBy(tri, ([x]) => x - STAIR.x1), ([, y]) => 1.30 - y);
          for (const pc of [left, right]) for (let i = 1; i + 1 < pc.length; i++) out.push([pc[0], pc[i], pc[i + 1]]);
          changed = true; cutTris++;
        }
        if (!changed) continue;
        for (const [k, sm] of sems.entries()) {
          const size = acc[sm].getElementSize(), arr = new (acc[sm].getArray().constructor)(out.length * 3 * size);
          out.forEach((tri, i) => tri.forEach((v, j) => arr.set(v[k], (i * 3 + j) * size)));
          prim.setAttribute(sm, doc.createAccessor().setType(acc[sm].getType()).setArray(arr).setNormalized(acc[sm].getNormalized()).setBuffer(doc.getRoot().listBuffers()[0]));
        }
        prim.setIndices(null);
        cap = prim.getMaterial();
      }
    }
    if (!cutTris) throw Error('merdiven: kollar arası duvar bulunamadı');
    // kapak: kesik çizgi boyunca yatay/eğik şerit (duvar kalınlığı Z0'dan Z1'e)
    const zs = [-2.16, -1.90], pts = [];
    for (let x = 0.36; x <= STAIR.x1 + 1e-6; x += (STAIR.x1 - 0.36) / 8) pts.push([x, top(x)]);
    const p = [], nr = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      const [a, b] = [pts[i], pts[i + 1]], q = [[a[0], a[1], zs[0]], [a[0], a[1], zs[1]], [b[0], b[1], zs[1]], [b[0], b[1], zs[0]]];
      const up = [STAIR.slope, 1, 0].map(v => v / Math.hypot(STAIR.slope, 1));
      for (const k of [0, 1, 2, 0, 2, 3]) {p.push(...q[k]); nr.push(...up);}
    }
    const buf = doc.getRoot().listBuffers()[0];
    const capPrim = doc.createPrimitive().setMaterial(cap)
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(p)).setBuffer(buf))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nr)).setBuffer(buf))
      .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(p.length / 3 * 2)).setBuffer(buf));
    doc.getRoot().listScenes()[0].addChild(doc.createNode('merdiven_arasi_kapak').setMesh(doc.createMesh('merdiven_arasi_kapak').addPrimitive(capPrim)).setExtras({kat: 'bodrum'}));
    // F47 duvarının üstü giriş katında iki merdiven arasındaki döşeme boşluğunu da
    // kapatıyordu (x 0,87-1,15, z -2,13..-1,93): silinince aşağısı görünen delik kaldı. Parke
    // yaması: WOOD-FL, applyFloors diğer parkeyle aynı dünya UV'sini verir.
    {
      const woodMat = doc.getRoot().listMaterials().find(m => m.getName() === 'WOOD-FL');
      if (!woodMat) throw Error('merdiven: WOOD-FL yok');
      const y = 3.0996, [xa, xb, za, zb] = [0.87, 1.15, -2.13, -1.93];
      const pp = new Float32Array([xa, y, za, xa, y, zb, xb, y, zb, xa, y, za, xb, y, zb, xb, y, za]);
      const patch = doc.createPrimitive().setMaterial(woodMat)
        .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(pp).setBuffer(buf))
        .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(18).map((_, i) => (i % 3 === 1 ? 1 : 0))).setBuffer(buf))
        .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(12)).setBuffer(buf));
      doc.getRoot().listScenes()[0].addChild(doc.createNode('merdiven_arasi_parke').setMesh(doc.createMesh('merdiven_arasi_parke').addPrimitive(patch)).setExtras({kat: 'giris'}));
    }
    console.log(`merdiven: kollar arası duvar ikinci kolun altına indirildi (${cutTris} üçgen kırpıldı)`);
  }
  console.log('merdiven: F02 kutusu kamaya, F47 duvarı silindi');
}

// --- Zeminler (ürün sahibinin verdiği dokular, tur10-dokular/) --------------
//  * parke (WOOD-FL, wood_floor): parke.jpg, doku 2,0 m, tahtalar x boyunca.
//    Ebeveyn banyosu, 1. kat banyosu ve çatı banyosunda parke seramiğin
//    ÜSTÜNE taşmıştı (çatıda 5,5 m² seramik üstünde 11 m² parke): ıslak
//    hacimlerin (rooms.json spaces) içindeki parke kesilip atılır.
//  * terra_floor ikiye ayrılır: bodrum (kat 0) bodrum-karo.jpg, 45° çapraz,
//    karo 33 cm; giriş katı (kat 1) giris-karo.jpg, düz, karo 40 cm.
//  Normal ve pürüzlülük haritaları dokunun kendisinden (pbr.py); metal 0.
const DOKU = path.join(here, 'tur10-dokular');
const WET = ['f2-104', 'f2-108', 'f3-C03'];
const DATUMS = [0, 3.0996, 6.3714, 9.4705];
const floorOf = y => DATUMS.reduce((k, d, i) => (y > d - 0.6 ? i : k), 0);
function applyFloors(doc) {
  const root = doc.getRoot(), scene = root.listScenes()[0], buffer = root.listBuffers()[0];
  const rooms = JSON.parse(readFileSync(path.join(REPO, 'build/web/full/rooms.json'), 'utf8'));
  const wet = rooms.spaces.filter(sp => WET.some(m => sp.members.includes(m)))
    .map(sp => ({floor: sp.floor_index, poly: sp.boundary_xz}));
  for (const w of wet) if (w.poly.length !== 4) throw Error('ıslak hacim dikdörtgen değil');
  // Kapı eşikleri (EK_A04_*_esik_kapagi, EK_M3_*_esik_doseme): kapı boşluğundan
  // büyük (1 m x 0,66 m), zeminden 2-8 cm kabarık, krem/koyu parçalardı. Her biri
  // bulunduğu yerin ZEMİN malzemesiyle düz bir parçaya çevrilir, zeminin 3 mm
  // altına iner: zemin olan yerde görünmez, yalnız kapı boşluğundaki açığı
  // doldurur ve dünya UV'siyle yandaki zeminle kesintisiz devam eder.
  {
    const FLOORS = /^(WOOD-FL|wood_floor|terra_floor)$/;
    const floorTris = [];
    for (const node of root.listNodes()) {
      const mesh = node.getMesh(); if (!mesh) continue; const w = node.getWorldMatrix();
      for (const prim of mesh.listPrimitives()) {
        const mat = prim.getMaterial(); if (!FLOORS.test(mat?.getName() ?? '')) continue;
        const pos = prim.getAttribute('POSITION'), idx = prim.getIndices(), v = [0, 0, 0];
        const P = i => {pos.getElement(i, v); return [w[0]*v[0]+w[4]*v[1]+w[8]*v[2]+w[12], w[1]*v[0]+w[5]*v[1]+w[9]*v[2]+w[13], w[2]*v[0]+w[6]*v[1]+w[10]*v[2]+w[14]];};
        const n = idx ? idx.getCount() : pos.getCount();
        for (let t = 0; t < n; t += 3) floorTris.push({a: P(idx ? idx.getScalar(t) : t), b: P(idx ? idx.getScalar(t + 1) : t + 1), c: P(idx ? idx.getScalar(t + 2) : t + 2), mat});
      }
    }
    const hitY = ({a, b, c}, x, z) => {
      const d = (b[2]-c[2])*(a[0]-c[0]) + (c[0]-b[0])*(a[2]-c[2]); if (Math.abs(d) < 1e-12) return null;
      const l1 = ((b[2]-c[2])*(x-c[0]) + (c[0]-b[0])*(z-c[2])) / d, l2 = ((c[2]-a[2])*(x-c[0]) + (a[0]-c[0])*(z-c[2])) / d, l3 = 1 - l1 - l2;
      return l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6 ? null : l1 * a[1] + l2 * b[1] + l3 * c[1];
    };
    let patched = 0, dropped = 0;
    for (const node of [...root.listNodes()]) {
      if (!/esik_(kapagi|doseme)|doseme_boslugu/.test(node.getName()) || !node.getMesh()) continue;
      const b = getBounds(node), cx = (b.min[0] + b.max[0]) / 2, cz = (b.min[2] + b.max[2]) / 2;
      const hits = [];
      for (const [dx, dz] of [[0, 0], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5], [0.35, 0.35], [-0.35, 0.35], [0.35, -0.35], [-0.35, -0.35]])
        for (const t of floorTris) {const y = hitY(t, cx + dx, cz + dz); if (y !== null && y > b.min[1] - 0.3 && y < b.max[1] + 0.02) hits.push({y, mat: t.mat});}
      const mesh = node.getMesh();
      if (!hits.length) {mesh.dispose(); node.dispose(); dropped++; continue;}
      const ys = hits.map(h => h.y).sort((p, q) => p - q), y = ys[Math.floor(ys.length / 2)] - 0.003;
      const count = new Map(); for (const h of hits) count.set(h.mat, (count.get(h.mat) ?? 0) + 1);
      const mat = [...count].sort((p, q) => q[1] - p[1])[0][0];
      const [x0, x1, z0, z1] = [b.min[0], b.max[0], b.min[2], b.max[2]];
      const pos = new Float32Array([x0, y, z0, x0, y, z1, x1, y, z1, x0, y, z0, x1, y, z1, x1, y, z0]);
      const prim = doc.createPrimitive().setMaterial(mat)
        .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(pos).setBuffer(buffer))
        .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(18).map((_, i) => (i % 3 === 1 ? 1 : 0))).setBuffer(buffer))
        .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(12)).setBuffer(buffer));
      const patch = doc.createNode(node.getName()).setMesh(doc.createMesh(node.getName()).addPrimitive(prim)).setExtras({kat: node.getExtras()?.kat});
      scene.addChild(patch);
      mesh.dispose(); node.dispose(); patched++;
    }
    console.log(`eşikler: ${patched} parça zemine gömüldü, ${dropped} parçanın altında zemin yok (silindi)`);
  }
  const texture = (file, name) => doc.createTexture(name).setImage(readFileSync(path.join(DOKU, file))).setMimeType(file.endsWith('.png') ? 'image/png' : 'image/jpeg');
  // normal + pürüzlülük: dokunun kendisinden (tur10-dokular/pbr.py), desenle birebir; metal 0
  execFileSync(PYTHON, [path.join(DOKU, 'pbr.py')], {stdio: 'inherit'});
  const pbr = base => ({color: texture(base + '.jpg', base), normal: texture(base + '_normal.png', base + '_normal'), mr: texture(base + '_mr.png', base + '_mr')});
  const mats = new Map(root.listMaterials().map(m => [m.getName(), m]));
  const restyle = (mat, tex) => {
    mat.setBaseColorTexture(tex.color).setBaseColorFactor([1, 1, 1, 1]).setNormalTexture(tex.normal).setNormalScale(1)
      .setMetallicRoughnessTexture(tex.mr).setOcclusionTexture(null).setRoughnessFactor(1).setMetallicFactor(0);
    for (const info of [mat.getBaseColorTextureInfo(), mat.getNormalTextureInfo(), mat.getMetallicRoughnessTextureInfo()]) {
      info.setTexCoord(0);
      for (const ext of info.listExtensions()) info.setExtension(ext.extensionName, null);
    }
    for (const ext of mat.listExtensions()) if (/specular|clearcoat/.test(ext.extensionName)) mat.setExtension(ext.extensionName, null);
    return mat;
  };
  const parke = pbr('parke');
  const wood = restyle(mats.get('WOOD-FL'), parke);
  // 1. kat oturma alanı tavanı: kirişler arası bal rengi çam lambri (fotoğraf 12; RETILE taşır)
  restyle(wood.clone().setName('EK_cam_lambri'), pbr('cam-lambri'));
  if (mats.get('wood_floor')) restyle(mats.get('wood_floor'), parke);
  const basement = restyle(mats.get('terra_floor'), pbr('bodrum-karo'));
  const ground = restyle(mats.get('terra_floor').clone().setName('terra_floor_giris'), pbr('giris-karo'));
  // UV0 ölçeği: malzemenin bütün ilkellerinde (paylaşılan erişimci kopyalanır)
  const scaleUV = (mat, s) => {
    for (const prim of root.listMeshes().flatMap(m => m.listPrimitives())) {
      if (prim.getMaterial() !== mat || !prim.getAttribute('TEXCOORD_0')) continue;
      const a = prim.getAttribute('TEXCOORD_0');
      prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(a.getArray().map(v => v * s)).setBuffer(buffer));
    }
  };
  // (alt ve üst kaynakta aynı adlı AYRI malzemeler var: hepsi değişir)
  const named = name => root.listMaterials().filter(m => m.getName() === name);
  // üçgen üçgen dünya koordinatı (düğüm matrisiyle), ilkel başına
  const worldTris = (node, prim) => {
    const w = node.getWorldMatrix(), pos = prim.getAttribute('POSITION'), idx = prim.getIndices(), v = [0, 0, 0];
    const P = i => {pos.getElement(i, v); return [w[0]*v[0]+w[4]*v[1]+w[8]*v[2]+w[12], w[1]*v[0]+w[5]*v[1]+w[9]*v[2]+w[13], w[2]*v[0]+w[6]*v[1]+w[10]*v[2]+w[14]];};
    const n = idx ? idx.getCount() : pos.getCount(), out = [];
    for (let t = 0; t < n; t += 3) out.push([0, 1, 2].map(k => P(idx ? idx.getScalar(t + k) : t + k)));
    return out;
  };
  const faceN = t => {
    const e1 = [0, 1, 2].map(k => t[1][k] - t[0][k]), e2 = [0, 1, 2].map(k => t[2][k] - t[0][k]);
    const c = [e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]], L = Math.hypot(...c);
    return L > 1e-12 ? c.map(x => x / L) : null;
  };
  // Merdiven basamakları/sahanlıkları ZEMİNİN KENDİ malzemesine (wood = WOOD-FL) geçer:
  // ürün sahibi 'aynı ahşap' istedi; ayrı malzemede (EK_M2_Ceviz_basamak) sitede farklı
  // parlıyordu. Üst yüzler plankalar basamak boyunca (z) uzanacak dünya UV'si (2 m),
  // rıht/yan yüzler kutu izdüşümü.
  // (üçgenler burada toplanır, ilkel zemin döngüsünden SONRA eklenir: döngü WOOD-FL adlı
  // her şeye zemin UV'si verirdi, rıhtlar gerilirdi)
  const stairTris = [];
  for (const node of [...root.listNodes()]) {
    const mesh = node.getMesh(); if (!mesh) continue;
    for (const prim of [...mesh.listPrimitives()]) {
      if (prim.getMaterial()?.getName() !== 'EK_M2_Ceviz_basamak') continue;
      stairTris.push(...worldTris(node, prim)); mesh.removePrimitive(prim); prim.dispose();
    }
    if (!mesh.listPrimitives().length) {mesh.dispose(); node.dispose();}
  }
  const addStairs = () => {
    const tris = stairTris, p = [], nr = [], uv = [];
    for (const t of tris) {
      const n = faceN(t); if (!n) continue;
      for (const v of t) {
        p.push(...v); nr.push(...n);
        if (Math.abs(n[1]) > 0.7) uv.push(v[2] / 2.0, -v[0] / 2.0);
        else if (Math.abs(n[0]) > Math.abs(n[2])) uv.push(v[2] / 2.0, -v[1] / 2.0);
        else uv.push(v[0] / 2.0, -v[1] / 2.0);
      }
    }
    const prim = doc.createPrimitive().setMaterial(wood)
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(p)).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nr)).setBuffer(buffer))
      .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(uv)).setBuffer(buffer));
    scene.addChild(doc.createNode('merdiven_parke').setMesh(doc.createMesh('merdiven_parke').addPrimitive(prim)));
    console.log(`merdiven: ${p.length / 9} basamak/sahanlık üçgeni zemin parkesi malzemesine (WOOD-FL)`);
  };
  // Sıva (Stucco painted wall) v6'da İÇ duvarlarda da kullanılıyor: yalnız DIŞ cephe mavi-gri
  // olur. Ölçüt: üçgen merkezinin kendi katındaki oda poligonlarına (rooms.json, bitmiş
  // duvar yüzü) uzaklığı. İç yüzler ~3 cm, dış cephe duvar kalınlığı kadar (20-35 cm)
  // uzakta: < 12 cm -> iç (beyaz iç duvar malzemesi), değilse dış.
  const ROOMS = JSON.parse(readFileSync(path.join(REPO, 'build/web/full/rooms.json'), 'utf8')).spaces;
  const roomPolys = [0, 1, 2, 3].map(k => ROOMS.filter(r => r.floor_index === k).map(r => r.boundary_xz));
  const inPoly = (x, z, P) => {let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) {const [a, b] = P[i], [e, f] = P[j]; if ((b > z) !== (f > z) && x < (e - a) * (z - b) / (f - b) + a) c = !c;} return c;};
  const segDist = (x, z, [a, b], [e, f]) => {const dx = e - a, dz = f - b, L = dx * dx + dz * dz; const t = L ? Math.max(0, Math.min(1, ((x - a) * dx + (z - b) * dz) / L)) : 0; return Math.hypot(x - a - t * dx, z - b - t * dz);};
  const roomDist = (x, z, k) => {let d = Infinity; for (const P of roomPolys[k]) {if (inPoly(x, z, P)) return 0; for (let i = 0; i < P.length; i++) d = Math.min(d, segDist(x, z, P[i], P[(i + 1) % P.length]));} return d;};
  const roomFloor = y => (y < DATUMS[1] - 0.3 ? 0 : y < DATUMS[2] - 0.3 ? 1 : y < DATUMS[3] - 0.3 ? 2 : 3);
  {
    const white = named('Simple White Wall')[0];
    if (!white) throw Error('sıva: Simple White Wall yok');
    let inA = 0, outA = 0;
    for (const node of [...root.listNodes()]) {
      const mesh = node.getMesh(); if (!mesh) continue;
      for (const prim of [...mesh.listPrimitives()]) {
        if (prim.getMaterial()?.getName() !== 'Stucco painted wall' || !prim.getIndices()) continue;
        const idx = prim.getIndices(), tris = worldTris(node, prim), inner = [], outer = [];
        tris.forEach((t, i) => {
          const c = [0, 1, 2].map(k => (t[0][k] + t[1][k] + t[2][k]) / 3), n = faceN(t);
          const ids = [idx.getScalar(3 * i), idx.getScalar(3 * i + 1), idx.getScalar(3 * i + 2)];
          const e1 = [0, 1, 2].map(k => t[1][k] - t[0][k]), e2 = [0, 1, 2].map(k => t[2][k] - t[0][k]);
          const a = Math.hypot(e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]) / 2;
          if (roomDist(c[0], c[2], roomFloor(c[1])) < 0.12) {inner.push(...ids); inA += a;} else {outer.push(...ids); outA += a;}
        });
        if (!inner.length) continue;
        const ip = doc.createPrimitive().setMaterial(white).setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(inner)).setBuffer(buffer));
        for (const sem of prim.listSemantics()) ip.setAttribute(sem, prim.getAttribute(sem));
        mesh.addPrimitive(ip);
        if (outer.length) prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(outer)).setBuffer(buffer));
        else {mesh.removePrimitive(prim); prim.dispose();}
      }
    }
    console.log(`sıva: iç ${inA.toFixed(0)} m² beyaz iç duvara, dış ${outA.toFixed(0)} m² mavi-gri cephe`);
  }
  // dış cephe: ürün sahibinin mavi-gri sıvası (BUILDING-opt-v4 / angora-wip, wall012). v6'da
  // ajan düz beyaz dokuya çevirmişti (prune onu tek renge indiriyordu). v4'te doku 2,344/m
  // (TEXCOORD_2), v6 UV0'ı 1/m: aynı tekrar için UV0 x2,344.
  // Çukur salonun (zemin 2,80) duvar dibindeki 22 cm'lik taş karo şeridi (stone_tile, dikey)
  // süpürgelik gibi görünüyor ama gri karo desenliydi: evin öteki süpürgelikleriyle aynı
  // ceviz süpürgelik malzemesine geçer (kutu UV, 1 m).
  {
    const skirt = named('EK_M1_Sicak_ceviz_supurgelik')[0];
    if (!skirt) throw Error('süpürgelik malzemesi yok');
    const moved = [];
    for (const node of [...root.listNodes()]) {
      const mesh = node.getMesh(); if (!mesh) continue;
      for (const prim of [...mesh.listPrimitives()]) {
        if (prim.getMaterial()?.getName() !== 'stone_tile' || !prim.getIndices()) continue;
        const idx = prim.getIndices(), keep = [];
        worldTris(node, prim).forEach((t, i) => {
          const n = faceN(t), cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
          if (n && Math.abs(n[1]) < 0.5 && cy > 2.75 && cy < 3.12) moved.push({t, n});
          else keep.push(idx.getScalar(3 * i), idx.getScalar(3 * i + 1), idx.getScalar(3 * i + 2));
        });
        if (keep.length === idx.getCount()) continue;
        if (keep.length) prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(keep)).setBuffer(buffer));
        else {mesh.removePrimitive(prim); prim.dispose();}
      }
    }
    const p = [], nr = [], uv = [];
    for (const {t, n} of moved) for (const v of t) {p.push(...v); nr.push(...n); uv.push(Math.abs(n[0]) > Math.abs(n[2]) ? v[2] : v[0], -v[1]);}
    if (p.length) scene.addChild(doc.createNode('salon_supurgelik').setMesh(doc.createMesh('salon_supurgelik').addPrimitive(doc.createPrimitive().setMaterial(skirt)
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(p)).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nr)).setBuffer(buffer))
      .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(uv)).setBuffer(buffer)))));
    console.log(`salon: taş karo duvar dibi şeridi ${moved.length} üçgen ceviz süpürgeliğe`);
  }
  const facade = {color: texture('cephe-v4.png', 'cephe-v4'), normal: texture('cephe-v4_normal.png', 'cephe-v4_normal'), mr: texture('cephe-v4_mr.png', 'cephe-v4_mr')};
  const stuccos = named('Stucco painted wall');
  if (!stuccos.length) throw Error('cephe: Stucco painted wall yok');
  for (const stucco of stuccos) {restyle(stucco, facade); scaleUV(stucco, 2.344);}
  console.log(`cephe: ${stuccos.length} sıva malzemesi v4 mavi-gri dokuya (yalnız dış yüzler)`);
  // uv: dünya x/z'den; rot: karo yönü, su/sv: dokunun metre karşılığı
  // sahanlık dikdörtgeni (x-z): x -0,09..1,93, z -5,15..-3,81
  const VEST = [[-0.09, -5.15], [1.93, -5.15], [1.93, -3.81], [-0.09, -3.81]]; // saat yönü tersine (içi solda)
  const vestTile = mats.get('R31 | R33 attic cream tile');
  const RULES = {
    vest: {affine: [1 / 0.30, 0, 0, 0, 1 / 0.30, 1]},  // banyo zemininin kendi UV'si (u = x/0,30, v = z/0,30 + 1)
    'WOOD-FL': {rot: 0, su: 2.0, sv: 2.0}, 'wood_floor': {rot: 0, su: 2.0, sv: 2.0},
    // 45° çapraz (ürün sahibi, fotoğraf 02): bordür düz, karolar duvara 45°
    terra0: {rot: Math.PI / 4, su: 1600 / 87.5 * 0.33, sv: 1200 / 87.5 * 0.33},
    terra1: {rot: 0, su: 12.6 * 0.40, sv: 12.6 * 0.40},
  };
  const inside = (x, z, P) => {let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) {const [a, b] = P[i], [e, f] = P[j]; if ((b > z) !== (f > z) && x < (e - a) * (z - b) / (f - b) + a) c = !c;} return c;};
  // üçgen (xz) - dışbükey çokgen: T \ P = U_i (T ∩ iç(e1..e_{i-1}) ∩ dış(e_i))
  const clip = (poly, a, b, c, keepLeft) => {  // yarı düzlem: kenar a->b'nin solu (keepLeft) ya da sağı
    const side = p => ((b[0] - a[0]) * (p[2] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) * (keepLeft ? 1 : -1); // a, b: [x, z]; p: [x, y, z]
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], sp = side(p), sq = side(q);
      if (sp >= 0) out.push(p);
      if ((sp >= 0) !== (sq >= 0)) {const t = sp / (sp - sq); out.push(p.map((v, k) => v + (q[k] - v) * t));}
    }
    return out;
  };
  const minus = (tri, P) => {
    // P'nin saat yönü: iç = sol mu sağ mı
    let area = 0; for (let i = 0; i < P.length; i++) {const [x1, z1] = P[i], [x2, z2] = P[(i + 1) % P.length]; area += x1 * z2 - x2 * z1;}
    const ccw = area > 0, pieces = [];
    let rest = tri;
    for (let i = 0; i < P.length && rest.length >= 3; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      const outside = clip(rest, a, b, null, !ccw);
      if (outside.length >= 3) pieces.push(outside);
      rest = clip(rest, a, b, null, ccw);
    }
    return pieces;
  };
  let cut = 0;
  for (const node of [...root.listNodes()]) {
    const mesh = node.getMesh(); if (!mesh) continue;
    const w = node.getWorldMatrix();
    for (const prim of [...mesh.listPrimitives()]) {
      const name = prim.getMaterial()?.getName();
      if (!['WOOD-FL', 'wood_floor', 'terra_floor'].includes(name)) continue;
      const pos = prim.getAttribute('POSITION'), idx = prim.getIndices(), v = [0, 0, 0];
      const P = i => {pos.getElement(i, v); return [w[0]*v[0]+w[4]*v[1]+w[8]*v[2]+w[12], w[1]*v[0]+w[5]*v[1]+w[9]*v[2]+w[13], w[2]*v[0]+w[6]*v[1]+w[10]*v[2]+w[14]];};
      const n = idx ? idx.getCount() : pos.getCount();
      const groups = new Map(); // anahtar -> {mat, rule, verts: [[x,y,z],...] (üçgen üçgen)}
      const put = (key, mat, rule, tri) => (groups.get(key) ?? groups.set(key, {mat, rule, verts: []}).get(key)).verts.push(...tri);
      for (let t = 0; t < n; t += 3) {
        const tri = [P(idx ? idx.getScalar(t) : t), P(idx ? idx.getScalar(t + 1) : t + 1), P(idx ? idx.getScalar(t + 2) : t + 2)];
        const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3, k = floorOf(cy);
        const isWood = name !== 'terra_floor';
        const [mat, rule] = isWood ? [name === 'WOOD-FL' ? wood : mats.get('wood_floor'), RULES[name]] : k === 0 ? [basement, RULES.terra0] : [ground, RULES.terra1];
        const key = mat.getName();
        const u = [0, 1, 2].map(i => tri[1][i] - tri[0][i]), q = [0, 1, 2].map(i => tri[2][i] - tri[0][i]);
        const ny = u[2] * q[0] - u[0] * q[2], len = Math.hypot(u[1]*q[2]-u[2]*q[1], ny, u[0]*q[1]-u[1]*q[0]);
        const flat = len > 1e-12 && Math.abs(ny / len) > 0.99;
        if (isWood && flat) {
          let pieces = [tri];
          for (const room of wet.filter(r => r.floor === k)) pieces = pieces.flatMap(pc => minus(pc, room.poly.map(([x, z]) => [x, z])));
          // çatı banyosu önündeki sahanlık (mini mutfak): fotoğrafta krem karo -> banyonun karosu, aynı UV
          if (k === 3 && vestTile) {
            const inside = pieces.flatMap(pc => {let r = pc; for (let i = 0; i < VEST.length && r.length >= 3; i++) r = clip(r, VEST[i], VEST[(i + 1) % VEST.length], null, true); return r.length >= 3 ? [r] : [];});
            for (const pc of inside) for (let i = 1; i + 1 < pc.length; i++) put('vestibul', vestTile, RULES.vest, [pc[0], pc[i], pc[i + 1]]);
            pieces = pieces.flatMap(pc => minus(pc, VEST));
          }
          if (pieces.length !== 1 || pieces[0] !== tri) cut++;
          for (const pc of pieces) for (let i = 1; i + 1 < pc.length; i++) put(key, mat, rule, [pc[0], pc[i], pc[i + 1]]);
        } else put(key, mat, rule, tri);
      }
      mesh.removePrimitive(prim);
      for (const {mat, rule, verts} of groups.values()) {
        const count = verts.length, p = new Float32Array(count * 3), nr = new Float32Array(count * 3), uv = new Float32Array(count * 2);
        const c = Math.cos(rule.rot ?? 0), s = Math.sin(rule.rot ?? 0);
        for (let i = 0; i < count; i += 3) {
          const [a, b, d] = [verts[i], verts[i + 1], verts[i + 2]];
          const e1 = [b[0]-a[0], b[1]-a[1], b[2]-a[2]], e2 = [d[0]-a[0], d[1]-a[1], d[2]-a[2]];
          const cr = [e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]], L = Math.hypot(...cr) || 1;
          for (let j = 0; j < 3; j++) {
            const vv = verts[i + j], o = (i + j);
            p.set(vv, o * 3); nr.set(cr.map(x => x / L), o * 3);
            if (rule.affine) {const [a, b, e, f, g, h] = rule.affine; uv[o * 2] = a * vv[0] + b * vv[2] + e; uv[o * 2 + 1] = f * vv[0] + g * vv[2] + h;}
            else {uv[o * 2] = (c * vv[0] - s * vv[2]) / rule.su; uv[o * 2 + 1] = (s * vv[0] + c * vv[2]) / rule.sv;}
          }
        }
        const prim2 = doc.createPrimitive().setMaterial(mat)
          .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(p).setBuffer(buffer))
          .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(nr).setBuffer(buffer))
          .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(uv).setBuffer(buffer));
        const child = doc.createNode(mat.getName()).setMesh(doc.createMesh(mat.getName()).addPrimitive(prim2));
        child.setExtras({kat: node.getExtras()?.kat});
        scene.addChild(child);
      }
    }
    if (mesh.listPrimitives().length === 0) {mesh.dispose(); node.dispose();}
  }
  addStairs();
  // Banyo duvar seramiği (ürün sahibinin dokusu, bordür dokunun içinde): 1. kat
  // banyosu (RR) ve ebeveyn banyosu (master pale cream tile). Bu malzemeler
  // zeminde de kullanılıyor: YALNIZ dikey yüzler yeni malzemeye geçer, zemin
  // kalır. Karo eni 25 cm (131 px), bordür ortası zeminden 95 cm (fotoğrafta
  // tezgâhın hemen üstü). Ajanın ayrı bordür şeridi (EK_A09_Banyo_bordur) silinir.
  {
    const tile = pbr('banyo-duvar');
    const wallMat = restyle(doc.createMaterial('EK_banyo_duvar'), tile);
    const W = 1600 * 0.25 / 131.3, H = 1200 * 0.25 / 131.3, V0 = 617 / 1200, BAND = 0.95;
    const WALLS = ['RR', 'R31 | R33 master pale cream tile'];
    const verts = []; let flipped = 0;
    for (const node of [...root.listNodes()]) {
      const mesh = node.getMesh(); if (!mesh) continue; const w = node.getWorldMatrix();
      if (/Banyo_bordur/.test(mesh.listPrimitives()[0]?.getMaterial()?.getName() ?? '')) {mesh.dispose(); node.dispose(); continue;}
      for (const prim of mesh.listPrimitives()) {
        if (!WALLS.includes(prim.getMaterial()?.getName())) continue;
        const pos = prim.getAttribute('POSITION'), idx = prim.getIndices(), v = [0, 0, 0];
        if (!idx) throw Error('banyo duvarı: indekssiz ilkel beklenmiyor');
        const P = i => {pos.getElement(i, v); return [w[0]*v[0]+w[4]*v[1]+w[8]*v[2]+w[12], w[1]*v[0]+w[5]*v[1]+w[9]*v[2]+w[13], w[2]*v[0]+w[6]*v[1]+w[10]*v[2]+w[14]];};
        const keep = [];
        for (let t = 0; t < idx.getCount(); t += 3) {
          const ids = [idx.getScalar(t), idx.getScalar(t + 1), idx.getScalar(t + 2)], tri = ids.map(P);
          const e1 = [0, 1, 2].map(k => tri[1][k] - tri[0][k]), e2 = [0, 1, 2].map(k => tri[2][k] - tri[0][k]);
          const cr = [e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]], L = Math.hypot(...cr);
          if (L > 1e-12 && Math.abs(cr[1] / L) < 0.5) {
            // sarılması odanın DIŞINA bakan üçgenler çevrilir (yoksa 4 mm kaydırma onları beyaz
            // duvarın arkasına itiyordu: dörtgenlerin yarısı beyaz görünüyordu)
            let n = cr.map(x => x / L), t3 = tri;
            const c = [0, 1, 2].map(k => (tri[0][k] + tri[1][k] + tri[2][k]) / 3), kf = roomFloor(c[1]);
            const room = d => roomPolys[kf].some(P => inPoly(c[0] + n[0] * d, c[2] + n[2] * d, P));
            if (!room(0.05) && room(-0.05)) {n = n.map(x => -x); t3 = [tri[0], tri[2], tri[1]]; flipped++;}
            verts.push({tri: t3, n});
          } else keep.push(...ids);
        }
        prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(keep)).setBuffer(buffer));
      }
    }
    const count = verts.length * 3, p = new Float32Array(count * 3), nr = new Float32Array(count * 3), uv = new Float32Array(count * 2);
    verts.forEach(({tri, n}, i) => tri.forEach((vv, j) => {
      // eski beyaz duvar (Simple White Wall) aynı düzlemde 1-3 mm arkada kalıyordu: uzakta
      // derinlik çözünürlüğü yetmiyor, üçgen üçgen beyaz öne çıkıyordu. Seramik 4 mm odaya alınır.
      const o = i * 3 + j; p.set(vv.map((c, k) => c + n[k] * 0.004), o * 3); nr.set(n, o * 3);
      const k = floorOf((tri[0][1] + tri[1][1] + tri[2][1]) / 3), y0 = DATUMS[k] + BAND + V0 * H;
      uv[o * 2] = (Math.abs(n[0]) > Math.abs(n[2]) ? vv[2] : vv[0]) / W; uv[o * 2 + 1] = (y0 - vv[1]) / H;
    }));
    const prim = doc.createPrimitive().setMaterial(wallMat)
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(p).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(nr).setBuffer(buffer))
      .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(uv).setBuffer(buffer));
    scene.addChild(doc.createNode('banyo_duvar').setMesh(doc.createMesh('banyo_duvar').addPrimitive(prim)).setExtras({kat: 'kat1'}));
    console.log(`banyo duvarları: ${flipped} ters üçgen odaya çevrildi`);
    console.log(`banyo duvarları: ${verts.length} üçgen yeni seramiğe (${(verts.reduce((a, {tri}) => {const e1 = [0,1,2].map(k => tri[1][k]-tri[0][k]), e2 = [0,1,2].map(k => tri[2][k]-tri[0][k]); return a + Math.hypot(e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]) / 2;}, 0)).toFixed(1)} m²)`);
  }
  // Kapı boşluklarında ve duvar diplerinde duvar kaplamasının / kasanın YATAY alt kapakları
  // zeminle aynı düzlemde (0-1 mm): eşiğin iki yanında ve duvar dibinde beyaz/koyu çizgi
  // olarak titreşiyordu. Malzemeler çift yüzlü (doubleSided): aşağı bakan kapak da yukarıdan
  // görünür. Altında 4 mm içinde zemin olan, iki yöne de bakan yatay beyaz duvar / kasa
  // üçgeni silinir (zemin zaten altta; giriş kapısının 4 cm yüksek eşiği gibi gerçek
  // basamaklar kalır).
  {
    const WALK = /^(WOOD-FL|wood_floor|terra_floor|terra_floor_giris|stone_tile|RR|R31 \| R33 .*tile)$/;
    const floors = [], grid = new Map(), C = 0.5;
    const slope = t => {
      const e1 = [0, 1, 2].map(k => t[1][k] - t[0][k]), e2 = [0, 1, 2].map(k => t[2][k] - t[0][k]);
      const cy = e1[2]*e2[0] - e1[0]*e2[2], L = Math.hypot(e1[1]*e2[2]-e1[2]*e2[1], cy, e1[0]*e2[1]-e1[1]*e2[0]);
      return L > 1e-10 ? cy / L : 0;
    };
    const up = t => slope(t) > 0.9, flat = t => Math.abs(slope(t)) > 0.9;
    const CAPS = /^(Simple White Wall|EK_SimpleWhiteWall|WHT\.001|EK_M1_Beyaz_saten_alci|EK_M3_Koyu_ceviz_kapi|WOODY-DARK)$/;
    const each = (fn) => {
      for (const node of root.listNodes()) {
        const mesh = node.getMesh(); if (!mesh) continue; const w = node.getWorldMatrix();
        for (const prim of mesh.listPrimitives()) {
          const pos = prim.getAttribute('POSITION'), v = [0, 0, 0];
          const P = i => {pos.getElement(i, v); return [w[0]*v[0]+w[4]*v[1]+w[8]*v[2]+w[12], w[1]*v[0]+w[5]*v[1]+w[9]*v[2]+w[13], w[2]*v[0]+w[6]*v[1]+w[10]*v[2]+w[14]];};
          fn(prim, P);
        }
      }
    };
    each((prim, P) => {
      if (!WALK.test(prim.getMaterial()?.getName() ?? '')) return;
      const idx = prim.getIndices(), n = idx ? idx.getCount() : prim.getAttribute('POSITION').getCount();
      for (let t = 0; t < n; t += 3) {
        const tri = [0, 1, 2].map(k => P(idx ? idx.getScalar(t + k) : t + k)); if (!up(tri)) continue;
        const i = floors.push(tri) - 1;
        const x0 = Math.floor(Math.min(...tri.map(p => p[0])) / C), x1 = Math.floor(Math.max(...tri.map(p => p[0])) / C);
        const z0 = Math.floor(Math.min(...tri.map(p => p[2])) / C), z1 = Math.floor(Math.max(...tri.map(p => p[2])) / C);
        for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) (grid.get(x * 7919 + z) ?? grid.set(x * 7919 + z, []).get(x * 7919 + z)).push(i);
      }
    });
    const hitY = ([a, b, c], x, z) => {
      const d = (b[2]-c[2])*(a[0]-c[0]) + (c[0]-b[0])*(a[2]-c[2]); if (Math.abs(d) < 1e-12) return null;
      const l1 = ((b[2]-c[2])*(x-c[0]) + (c[0]-b[0])*(z-c[2])) / d, l2 = ((c[2]-a[2])*(x-c[0]) + (a[0]-c[0])*(z-c[2])) / d, l3 = 1 - l1 - l2;
      return l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6 ? null : l1 * a[1] + l2 * b[1] + l3 * c[1];
    };
    let removed = 0;
    each((prim, P) => {
      if (!CAPS.test(prim.getMaterial()?.getName() ?? '') || !prim.getIndices()) return;
      const idx = prim.getIndices(), keep = [];
      for (let t = 0; t < idx.getCount(); t += 3) {
        const ids = [idx.getScalar(t), idx.getScalar(t + 1), idx.getScalar(t + 2)], tri = ids.map(P);
        const c = [0, 1, 2].map(k => (tri[0][k] + tri[1][k] + tri[2][k]) / 3);
        const cover = flat(tri) && (grid.get(Math.floor(c[0] / C) * 7919 + Math.floor(c[2] / C)) ?? []).some(i => {const y = hitY(floors[i], c[0], c[2]); return y !== null && Math.abs(y - c[1]) < 0.004;});
        if (cover) removed++; else keep.push(...ids);
      }
      if (keep.length !== idx.getCount()) prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(keep)).setBuffer(buffer));
    });
    console.log(`kapı boşlukları: zeminle aynı düzlemdeki ${removed} yatay duvar/kasa kapağı silindi`);
  }
  console.log(`zeminler: parke/karo dokuları değişti, ıslak hacimlerde kesilen parke üçgeni ${cut}`);
}

// --- Çatı katı mini mutfak (foto 06), basit kutularla -----------------------
// Banyo önündeki sahanlıkta doğu duvarı (x 1,89) boyunca, önü batıya bakar;
// kuzeyden güneye: evyeli 2 kapaklı dolap 0,83 | mini buzdolabı 0,50 (sıra güney
// duvarında biter). Tezgâh 0,90 yükseklik, 0,60 derinlik; raf tezgâhın
// 0,35 m üstünde, askı çubuğu çatı eğiminin hemen altında. Ajanın önünü
// kapatan duvarı (EK_M3C_sag_yan), tavan bloğu (EK_M3C_kapi_ustu) ve yatak odası kapısını
// kapatan sol yanı (EK_M3C_sol_yan) silinir.
function buildKitchenette(doc) {
  const root = doc.getRoot(), scene = root.listScenes()[0], buffer = root.listBuffers()[0];
  // ajanın eski mutfak kutusunun kalan sol yanı (EK_M3C_sol_yan) çatı yatak odasının kapısını
  // (x -0,1..-0,25, z -5,1..-4,1) beyaz duvarla kapatıyordu; F29 kirişi ve iki spotu o kutunun
  // tavanına bağlıydı (z -3,55'te) ve kapının önüne giriyordu: hepsi silinir
  for (const node of [...root.listNodes()]) if (/^EK_M3C_(sag_yan|sol_yan|kapi_ustu)$|^EK_A04_F29_(sol_kiris|spot_\d)$/.test(node.getName())) {node.getMesh()?.dispose(); node.dispose();}
  // çatı holündeki eski TV'nin ekran camı (0,96 x 0,53 m, z -1,01): TV Tripo oturma grubuyla
  // değişti (mobilya.json cati_oturma), eski TV silinince cam havada kalıyordu
  for (const node of [...root.listNodes()]) if (node.getName() === 'EK_glass_cati') {node.getMesh()?.dispose(); node.dispose();}
  const mats = new Map(root.listMaterials().map(m => [m.getName(), m]));
  const plain = (name, rgb, rough, metal = 0) => doc.createMaterial(name).setBaseColorFactor([...rgb, 1]).setRoughnessFactor(rough).setMetallicFactor(metal);
  const walnut = mats.get('EK_M3_Ceviz_gobek') ?? plain('EK_mini_ceviz', [0.30, 0.15, 0.08], 0.5);
  const M = {
    govde: walnut, kapak: walnut, raf: walnut,
    tezgah: plain('EK_mini_tezgah', [0.90, 0.86, 0.78], 0.45),
    celik: plain('EK_mini_celik', [0.72, 0.72, 0.72], 0.28, 1),
    beyaz: plain('EK_mini_beyaz', [0.93, 0.93, 0.92], 0.35),
    siyah: plain('EK_mini_siyah', [0.04, 0.04, 0.04], 0.4, 0.6),
    baza: plain('EK_mini_baza', [0.12, 0.07, 0.04], 0.6),
  };
  const F = 9.47, WALL = 1.89, D = 0.60, FRONT = WALL - D, Z0 = -5.14;
  const boxes = [];
  const box = (mat, x0, x1, y0, y1, z0, z1) => boxes.push({mat, min: [x0, F + y0, z0], max: [x1, F + y1, z1]});
  // sıra sahanlığın güney duvarında (yüz z -3,807) biter: eskiden 0,44'lük tek kapaklı dolapla
  // z -3,40'a uzanıp duvarı delerek hole taşıyordu. Evyeli dolap kalan boşluğu doldurur.
  const ZW = -3.807, FRIDGE = 0.50;
  const units = [['dolap2', ZW - 0.003 - Z0 - FRIDGE], ['buzdolabi', FRIDGE]];
  let z = Z0;
  for (const [kind, w] of units) {
    const za = z, zb = z + w; z = zb;
    if (kind === 'buzdolabi') {
      box(M.beyaz, FRONT + 0.03, WALL - 0.02, 0.0, 0.85, za + 0.01, zb - 0.01);
      box(M.celik, FRONT + 0.015, FRONT + 0.03, 0.78, 0.80, za + 0.08, zb - 0.08);          // kapak tutamağı
      continue;
    }
    box(M.baza, FRONT + 0.05, WALL, 0.0, 0.10, za, zb);                                     // baza (içeride)
    box(M.govde, FRONT + 0.02, WALL, 0.10, 0.86, za, zb);                                   // gövde
    const n = kind === 'dolap2' ? 2 : 1, dw = (zb - za) / n;
    for (let i = 0; i < n; i++) {
      const a = za + i * dw + 0.003, b = za + (i + 1) * dw - 0.003;
      box(M.kapak, FRONT, FRONT + 0.02, 0.11, 0.85, a, b);                                 // kapak
      box(M.kapak, FRONT - 0.008, FRONT, 0.19, 0.77, a + 0.07, b - 0.07);                  // göbek
      const hz = n === 2 ? (i === 0 ? b - 0.05 : a + 0.05) : b - 0.05;
      box(M.celik, FRONT - 0.03, FRONT - 0.008, 0.64, 0.78, hz - 0.006, hz + 0.006);        // kulp
    }
  }
  const Z1 = z;
  box(M.tezgah, FRONT - 0.02, WALL, 0.86, 0.90, Z0, Z1);                                    // tezgâh
  box(M.tezgah, WALL - 0.02, WALL, 0.90, 0.96, Z0, Z1);                                    // arka süpürgelik
  box(M.celik, FRONT + 0.08, FRONT + 0.48, 0.9005, 0.903, Z0 + 0.12, Z0 + 0.60);            // evye (tezgâhta çelik yüzey)
  box(M.siyah, FRONT + 0.12, FRONT + 0.44, 0.9031, 0.9035, Z0 + 0.16, Z0 + 0.56);           // evye içi (koyu)
  box(M.celik, WALL - 0.08, WALL - 0.05, 0.90, 1.12, Z0 + 0.34, Z0 + 0.37);                 // batarya gövdesi
  box(M.celik, WALL - 0.20, WALL - 0.05, 1.09, 1.12, Z0 + 0.34, Z0 + 0.37);                 // batarya ağzı
  box(M.raf, WALL - 0.22, WALL, 1.25, 1.28, Z0 + 0.20, Z1);                                // raf
  for (const zz of [Z0 + 0.45, Z1 - 0.25]) box(M.raf, WALL - 0.03, WALL, 1.05, 1.25, zz - 0.02, zz + 0.02); // konsollar
  box(M.siyah, WALL - 0.07, WALL - 0.05, 1.36, 1.38, Z0 + 0.30, Z1 - 0.05);                 // askı çubuğu
  for (const zz of [Z0 + 0.30, Z1 - 0.05]) box(M.siyah, WALL - 0.07, WALL, 1.36, 1.38, zz - 0.01, zz + 0.01); // çubuk ayakları
  // kutular -> malzeme başına tek ilkel, yüz başına dünya-kutu UV (0,5 m)
  const byMat = new Map();
  for (const b of boxes) (byMat.get(b.mat) ?? byMat.set(b.mat, []).get(b.mat)).push(b);
  const faces = [[0, 1, 1], [0, -1, 1], [1, 1, 0], [1, -1, 0], [2, 1, 0], [2, -1, 0]]; // eksen, işaret, uv ekseni
  for (const [mat, list] of byMat) {
    const p = [], nr = [], uv = [];
    for (const {min, max} of list) for (const [ax, sg] of faces) {
      const o = [(ax + 1) % 3, (ax + 2) % 3], c = [min, max];
      const q = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([i, j]) => {const v = [0, 0, 0]; v[ax] = sg > 0 ? max[ax] : min[ax]; v[o[0]] = c[i][o[0]]; v[o[1]] = c[j][o[1]]; return v;});
      const order = sg > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
      for (const k of order) {
        const v = q[k]; p.push(...v); const n = [0, 0, 0]; n[ax] = sg; nr.push(...n);
        const ua = ax === 1 ? 0 : 2, va = ax === 1 ? 2 : 1;                 // dikey yüzde damar dikey (v = y)
        uv.push(v[ax === 0 ? 2 : 0] / 0.5, -v[va === 1 ? 1 : 2] / 0.5);
      }
    }
    const prim = doc.createPrimitive().setMaterial(mat)
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(p)).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nr)).setBuffer(buffer))
      .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(uv)).setBuffer(buffer));
    scene.addChild(doc.createNode('EK_mini_mutfak').setMesh(doc.createMesh('EK_mini_mutfak').addPrimitive(prim)).setExtras({kat: 'cati'}));
  }
  console.log(`mini mutfak: ${boxes.length} kutu, z ${Z0}..${Z1.toFixed(2)}, ön yüz x ${FRONT.toFixed(2)}; EK_M3C duvar/tavan bloğu silindi`);
}

// --- ortak hazırlık ---------------------------------------------------------
// Giyinme odası -> ebeveyn banyosu kapısı (EK_M3_04): kanat doğu kasadan menteşeli, odaya
// 125° açık duruyordu ve gardırobun (D16 X1) ayna kapağını, rayını ve gövdesini kesiyordu.
// Kanat grubu (68 düğüm) batı kasaya alınır ve 90° açık durur (öteki kapılar gibi):
// eksen (2,1729, -6,0277) -> (1,3655, -6,0277), y ekseni etrafında -35° katı dönüş. Yansıtma
// değil: yansıtma normal haritalı ahşabın teğet çerçevesini ters çevirirdi. Kasa, üst kasa ve
// pervazlar yerinde kalır (açıklığın ortası x 1,7692'ye göre simetrik).
// Fotoğraf denetiminde (30.09, tools/batch-delivery/_batch: her fotoğraf kamerasından model ile
// fotoğraf yan yana) bulunan fazla parçalar: malzeme + dünya kutusu; ağırlık merkezi kutudaki
// üçgenler atılır. Her satır neden orada olduğunu söyler.
const TRIM = [
  // giriş katı salon/yemek tavanı: tavandan 12 cm sarkan 46 cm kiriş, fotoğraf 04/23'te yok
  {mat: /^(Simple White Wall|WHT\.001)$/, min: [-3.3, 5.7, -1.56], max: [0.87, 6.12, -1.07], neden: 'salon tavan kirişi'},
  // 1. kat kirişli tavan: duvar dibinde kartonpiyer yok, kirişler duvara oturuyor (fotoğraf 12/33)
  {mat: /^EK_M1_Beyaz_saten_alci$/, min: [-5.96, 8.8, -4.26], max: [-1.05, 9.0, -0.05], neden: '1. kat kirişli tavan kartonpiyeri'},
];
// Fotoğraf denetimi: yüzeyin malzemesi yanlış (ör. misafir WC'de bordür üstü sıva, fotoğrafta
// tavana kadar beyaz seramik). Kutudaki dik üçgenler hedef malzemeye taşınır, düzlemsel UV.
const RETILE = [
  {mat: /^(Simple White Wall|EK_SimpleWhiteWall)$/, hedef: 'R31 | R33 ivory wall ceramic', uvm: 3.333,
    min: [2.78, 4.17, 0.5], max: [4.13, 5.95, 2.43], neden: 'misafir WC bordür üstü beyaz seramik (fotoğraf 39)'},
  // yatay: tavan üçgenleri; tahtalar kirişlere (z boyunca) dik, x boyunca uzanır
  {mat: /^ceiling\.001$/, hedef: 'EK_cam_lambri', uvm: 1 / 2.4, yatay: true,
    min: [-5.96, 8.95, -4.26], max: [-1.05, 9.1, -0.05], neden: '1. kat oturma alanı + hol tavanı çam lambri (fotoğraf 12/33)'},
];
function retileBoxes(doc) {
  const root = doc.getRoot(), buffer = root.listBuffers()[0], scene = root.listScenes()[0];
  for (const rule of RETILE) {
    const target = root.listMaterials().find(m => m.getName() === rule.hedef);
    if (!target) throw Error(`RETILE hedef yok: ${rule.hedef}`);
    const out = [];
    for (const node of root.listNodes()) {
      const mesh = node.getMesh(); if (!mesh) continue; const w = node.getWorldMatrix();
      for (const prim of mesh.listPrimitives()) {
        if (!rule.mat.test(prim.getMaterial()?.getName() ?? '') || !prim.getIndices()) continue;
        const P = prim.getAttribute('POSITION').getArray(), I = prim.getIndices().getArray(), keep = [];
        const X = i => [0, 1, 2].map(k => w[k]*P[i*3] + w[4+k]*P[i*3+1] + w[8+k]*P[i*3+2] + w[12+k]);
        for (let t = 0; t < I.length; t += 3) {
          const v = [X(I[t]), X(I[t + 1]), X(I[t + 2])], c = [0, 1, 2].map(k => (v[0][k] + v[1][k] + v[2][k]) / 3);
          const e1 = v[1].map((x, k) => x - v[0][k]), e2 = v[2].map((x, k) => x - v[0][k]);
          const n = [e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]], L = Math.hypot(...n);
          if (L > 1e-10 && (rule.yatay ? Math.abs(n[1] / L) > 0.9 : Math.abs(n[1] / L) < 0.3) && c.every((x, k) => x >= rule.min[k] && x <= rule.max[k])) out.push({v, n: n.map(x => x / L)});
          else keep.push(I[t], I[t + 1], I[t + 2]);
        }
        if (keep.length !== I.length) prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(keep)).setBuffer(buffer));
      }
    }
    if (!out.length) throw Error(`RETILE boş: ${rule.neden}`);
    const p = new Float32Array(out.length * 9), nr = new Float32Array(out.length * 9), uv = new Float32Array(out.length * 6);
    out.forEach(({v, n}, i) => v.forEach((q, j) => {
      const o = i * 3 + j; p.set(q, o * 3); nr.set(n, o * 3);
      if (rule.yatay) {uv[o * 2] = q[0] * rule.uvm; uv[o * 2 + 1] = q[2] * rule.uvm;}
      else {uv[o * 2] = (Math.abs(n[0]) > Math.abs(n[2]) ? q[2] : q[0]) * rule.uvm; uv[o * 2 + 1] = -q[1] * rule.uvm;}
    }));
    const prim = doc.createPrimitive().setMaterial(target)
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(p).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(nr).setBuffer(buffer))
      .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(uv).setBuffer(buffer));
    scene.addChild(doc.createNode('denetim_' + out.length).setMesh(doc.createMesh('denetim_retile').addPrimitive(prim)));
    console.log(`denetim: ${rule.neden} - ${out.length} üçgen`);
  }
}
// Fotoğraf 02/42: merdiven korkuluklarının üstünde ceviz küpeşte var; modelde demir lama çıplaktı.
// Demir (EK_metal.002) bağlı bileşenlere ayrılır; 74-80 cm altında eşi olan lama "üst lama"dır.
// Üst lamanın noktaları doğru parçalarına bölünür (RANSAC, L biçimli galeri korkuluğu için) ve her
// parçanın üstüne 6x4,5 cm ceviz kutu konur.
function addHandrails(doc, interior) {
  const root = doc.getRoot(), buffer = root.listBuffers()[0], scene = root.listScenes()[0];
  const wood = root.listMaterials().find(m => m.getName() === 'EK_M1_Sicak_ceviz_supurgelik');
  if (!wood) throw Error('küpeşte: ceviz malzeme yok');
  const comps = [];
  for (const node of root.listNodes()) {
    const mesh = node.getMesh(); if (!mesh) continue; const w = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      if (prim.getMaterial()?.getName() !== 'EK_metal.002' || !prim.getIndices()) continue;
      const P = prim.getAttribute('POSITION').getArray(), I = prim.getIndices().getArray(), n = P.length / 3;
      const X = i => [0, 1, 2].map(k => w[k]*P[i*3] + w[4+k]*P[i*3+1] + w[8+k]*P[i*3+2] + w[12+k]);
      const canon = new Map(), rep = new Int32Array(n);
      for (let i = 0; i < n; i++) {const k = X(i).map(v => Math.round(v * 2000)).join(); if (!canon.has(k)) canon.set(k, i); rep[i] = canon.get(k);}
      const par = Int32Array.from({length: n}, (_, i) => i), f = i => {while (par[i] !== i) i = par[i] = par[par[i]]; return i;};
      for (let t = 0; t < I.length; t += 3) {const a = f(rep[I[t]]), b = f(rep[I[t+1]]), c = f(rep[I[t+2]]); par[a] = b; par[f(b)] = c;}
      const groups = new Map();
      for (let i = 0; i < n; i++) {const r = f(rep[i]); (groups.get(r) ?? groups.set(r, []).get(r)).push(X(i));}
      for (const pts of groups.values()) {
        const lo = [0, 1, 2].map(k => Math.min(...pts.map(p => p[k]))), hi = [0, 1, 2].map(k => Math.max(...pts.map(p => p[k])));
        if (Math.max(hi[0] - lo[0], hi[2] - lo[2]) < 0.5 || pts.length < 4) continue;
        comps.push({pts, lo, hi});
      }
    }
  }
  // mevcut ahşap (1. kat holünde korkulukların üstünde ceviz küpeşte zaten var, fotoğraf 18):
  // parçanın boyunca noktaların çoğunun 8 cm üstünde ahşap köşe varsa küpeşte eklenmez
  const woodGrid = new Set(), G = 0.04, gk = (x, y, z) => `${Math.floor(x / G)},${Math.floor(y / G)},${Math.floor(z / G)}`;
  // INTERIOR'daki özgün korkuluk ahşapları da (EK_ORIJINAL_KORKULUK_WOOD*, 'antique nook walnut') sayılır:
  // 1. kat ve giriş merdiveninde küpeşte orada zaten var, üstüne ikinci küpeşte biniyordu
  const woodNodes = [...root.listNodes(), ...interior.getRoot().listNodes().filter(n => /KORKULUK/i.test(n.getName()))];
  for (const node of woodNodes) {
    const mesh = node.getMesh(); if (!mesh) continue; const w = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const name = prim.getMaterial()?.getName() ?? '';
      if (!/ceviz|Ceviz|WOODY|wood|Wood|walnut/.test(name) || /floor|FL|basamak/.test(name) || !prim.getIndices()) continue;
      // yüzey örneklenir (uzun düz küpeştede köşe yalnız uçlarda: yalnız köşe noktaları yetmiyordu)
      const P = prim.getAttribute('POSITION').getArray(), I = prim.getIndices().getArray();
      const X = i => [0, 1, 2].map(k => w[k]*P[i*3] + w[4+k]*P[i*3+1] + w[8+k]*P[i*3+2] + w[12+k]);
      for (let t = 0; t < I.length; t += 3) {
        const [a, b, c] = [X(I[t]), X(I[t + 1]), X(I[t + 2])];
        const m = Math.min(60, Math.ceil(Math.max(Math.hypot(...b.map((x, k) => x - a[k])), Math.hypot(...c.map((x, k) => x - a[k]))) / G));
        for (let i = 0; i <= m; i++) for (let j = 0; i + j <= m; j++)
          woodGrid.add(gk(...a.map((x, k) => x + (b[k] - x) * i / Math.max(m, 1) + (c[k] - x) * j / Math.max(m, 1))));
      }
    }
  }
  const hasWood = (a, b) => {
    let hit = 0, n = 0;
    for (let t = 0.1; t <= 0.9; t += 0.1) { n++; const q = a.map((x, k) => x + (b[k] - x) * t);
      let found = false; for (let dx = -2; dx <= 2 && !found; dx++) for (let dy = -1; dy <= 2 && !found; dy++) for (let dz = -2; dz <= 2 && !found; dz++)
        found = woodGrid.has(gk(q[0] + dx * G, q[1] + dy * G, q[2] + dz * G));
      if (found) hit++; }
    return hit / n > 0.5;
  };
  // üst lama: 0,70-0,85 m altında, xz'de örtüşen başka bir lama olan
  const overlap = (a, b) => Math.min(a.hi[0], b.hi[0]) - Math.max(a.lo[0], b.lo[0]) > -0.05 && Math.min(a.hi[2], b.hi[2]) - Math.max(a.lo[2], b.lo[2]) > -0.05;
  const tops = comps.filter(a => comps.some(b => b !== a && overlap(a, b) && a.lo[1] - b.lo[1] > 0.65 && a.lo[1] - b.lo[1] < 0.9));
  const boxes = []; let skipped = 0;
  for (const {pts} of tops) {
    let rest = pts.slice();
    for (let seg = 0; seg < 3 && rest.length >= 4; seg++) {
      let best = null;
      for (let it = 0; it < 300; it++) {
        const a = rest[(it * 7919) % rest.length], b = rest[(it * 104729 + 17) % rest.length];
        const d = [b[0]-a[0], b[1]-a[1], b[2]-a[2]], L = Math.hypot(...d); if (L < 0.3) continue;
        const u = d.map(x => x / L), inl = rest.filter(p => {const q = [p[0]-a[0], p[1]-a[1], p[2]-a[2]], t = q[0]*u[0]+q[1]*u[1]+q[2]*u[2]; return Math.hypot(q[0]-t*u[0], q[1]-t*u[1], q[2]-t*u[2]) < 0.035;});
        if (!best || inl.length > best.inl.length) best = {a, u, inl};
      }
      if (!best || best.inl.length < 4) break;
      const ts = best.inl.map(p => (p[0]-best.a[0])*best.u[0] + (p[1]-best.a[1])*best.u[1] + (p[2]-best.a[2])*best.u[2]);
      const t0 = Math.min(...ts), t1 = Math.max(...ts); if (t1 - t0 < 0.4) break;
      const top = Math.max(...best.inl.map(p => p[1] - (best.a[1] + ((p[0]-best.a[0])*best.u[0] + (p[1]-best.a[1])*best.u[1] + (p[2]-best.a[2])*best.u[2]) * best.u[1])));
      const at = t => best.a.map((x, k) => x + best.u[k] * t + (k === 1 ? top : 0));
      const seg = [at(t0 - 0.03), at(t1 + 0.03)]; if (!hasWood(...seg)) boxes.push(seg); else skipped++;
      const inSet = new Set(best.inl); rest = rest.filter(p => !inSet.has(p));
    }
  }
  if (!boxes.length) {console.log(`küpeşte: ${skipped} parçanın hepsinde ahşap var, eklenmedi`); return;}
  const p = [], nr = [], uv = [];
  for (const [a, b] of boxes) {
    const d = [b[0]-a[0], b[1]-a[1], b[2]-a[2]], L = Math.hypot(...d), u = d.map(x => x / L);
    const side = (() => {const s = [u[2], 0, -u[0]], l = Math.hypot(...s) || 1; return s.map(x => x / l);})();
    const up = [u[1]*side[2]-u[2]*side[1], u[2]*side[0]-u[0]*side[2], u[0]*side[1]-u[1]*side[0]].map((x, _, arr) => x / (Math.hypot(...arr) || 1));
    const upv = up[1] < 0 ? up.map(x => -x) : up, W = 0.03, H = 0.045;
    const corner = (t, sx, sy) => [0, 1, 2].map(k => (t ? b[k] : a[k]) + side[k] * sx * W + upv[k] * sy * H);
    const faces = [[[0,-1,0],[0,1,0],[0,1,1],[0,-1,1]], [[1,-1,0],[1,-1,1],[1,1,1],[1,1,0]], [[0,-1,1],[0,1,1],[1,1,1],[1,-1,1]],
      [[0,-1,0],[1,-1,0],[1,1,0],[0,1,0]], [[0,-1,0],[0,-1,1],[1,-1,1],[1,-1,0]], [[0,1,0],[1,1,0],[1,1,1],[0,1,1]]];
    for (const q of faces) {
      const v = q.map(([t, sx, sy]) => corner(t, sx, sy));
      const e1 = v[1].map((x, k) => x - v[0][k]), e2 = v[2].map((x, k) => x - v[0][k]);
      const nn = [e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]], nl = Math.hypot(...nn) || 1;
      for (const idx of [0, 1, 2, 0, 2, 3]) {p.push(...v[idx]); nr.push(...nn.map(x => x / nl)); uv.push((q[idx][0] ? L : 0) * 2, q[idx][1] * 0.05 + q[idx][2] * 0.05);}
    }
  }
  const prim = doc.createPrimitive().setMaterial(wood)
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(p)).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nr)).setBuffer(buffer))
    .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(uv)).setBuffer(buffer));
  scene.addChild(doc.createNode('kupeste').setMesh(doc.createMesh('kupeste').addPrimitive(prim)));
  console.log(`küpeşte: ${tops.length} üst lama, ${skipped} parçada zaten ahşap var, ${boxes.length} ceviz parça (${boxes.reduce((s, [a, b]) => s + Math.hypot(b[0]-a[0], b[1]-a[1], b[2]-a[2]), 0).toFixed(1)} m)`);
}
// Fotoğraf 43: garajın kuzey açıklığında (iç yüz z 1,17, x 4,35..7,20, y 3,10..5,53) kapalı beyaz
// sectional kapı var; hiçbir modelde yoktu, açıklıktan araç yolu görünüyordu.
function addGarageDoor(doc) {
  const root = doc.getRoot(), buffer = root.listBuffers()[0], scene = root.listScenes()[0];
  const white = doc.createMaterial('EK_garaj_kapisi').setBaseColorFactor([0.9, 0.9, 0.88, 1]).setRoughnessFactor(0.45).setMetallicFactor(0).setDoubleSided(true);
  const steel = doc.createMaterial('EK_garaj_ray').setBaseColorFactor([0.55, 0.57, 0.58, 1]).setRoughnessFactor(0.4).setMetallicFactor(0.8).setDoubleSided(true);
  const X0 = 4.36, X1 = 7.19, Y0 = 3.10, Y1 = 5.52, Z = 1.20;
  const boxes = {[white.getName()]: [[X0, Y0, Z], [X1, Y1, Z + 0.04]]};
  const rails = [];
  for (let k = 1; k < 4; k++) {const y = Y0 + (Y1 - Y0) * k / 4; rails.push([[X0 + 0.02, y - 0.012, Z - 0.012], [X1 - 0.02, y + 0.012, Z]]);}   // panel derzleri
  rails.push([[(X0 + X1) / 2 - 0.02, Y0, Z - 0.012], [(X0 + X1) / 2 + 0.02, Y1, Z]]);                                       // orta dikme
  for (const x of [X0 - 0.06, X1 + 0.01]) rails.push([[x, Y0, Z - 0.05], [x + 0.05, Y1 + 0.05, Z + 0.02]]);                     // yan raylar
  rails.push([[X0 - 0.06, Y1, Z - 0.05], [X1 + 0.06, Y1 + 0.05, Z + 0.02]]);                                                   // üst ray
  const build = (mat, list) => {
    const p = [], nr = [];
    for (const [a, b] of list) {
      const F = [[[0,0,0],[0,1,0],[0,1,1],[0,0,1],[-1,0,0]], [[1,0,0],[1,0,1],[1,1,1],[1,1,0],[1,0,0]], [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,-1]],
        [[0,0,1],[0,1,1],[1,1,1],[1,0,1],[0,0,1]], [[0,0,0],[0,0,1],[1,0,1],[1,0,0],[0,-1,0]], [[0,1,0],[1,1,0],[1,1,1],[0,1,1],[0,1,0]]];
      for (const f of F) {const v = f.slice(0, 4).map(c => c.map((t, k) => t ? b[k] : a[k])); for (const i of [0, 1, 2, 0, 2, 3]) {p.push(...v[i]); nr.push(...f[4]);}}
    }
    const prim = doc.createPrimitive().setMaterial(mat)
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(p)).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nr)).setBuffer(buffer));
    scene.addChild(doc.createNode(mat.getName()).setMesh(doc.createMesh(mat.getName()).addPrimitive(prim)));
  };
  build(white, [boxes[white.getName()]]); build(steel, rails);
  console.log('garaj kapısı: 2,83 x 2,42 m beyaz sectional + galvaniz raylar');
}

// Fotoğraf 22: giriş katı mutfak-hol arasındaki çapraz açıklık (1,5 m, çerçevesi WOODY-DARK var)
// kapısızdı; fotoğrafta koyu ceviz çerçeveli, çiçek desenli camlı, kuşbaşı çıtalı sürme kanat
// açıklığın sol (mutfaktan bakınca) yarısını kapatıyor. Duvar ekseni A(-0,93, 0,74) -> B(0,06, 1,87).
function addKitchenSlider(doc) {
  const root = doc.getRoot(), buffer = root.listBuffers()[0], scene = root.listScenes()[0];
  const find = name => root.listMaterials().find(m => m.getName() === name) ?? (() => {throw Error('sürme kapı: malzeme yok ' + name);})();
  const wood = find('EK_M3_Koyu_ceviz_kapi'), glass = find('EK_M3G_Foto40_gul_desenli_cam');
  const A = [-0.93, 0.74], B = [0.06, 1.87], L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const u = [(B[0] - A[0]) / L, (B[1] - A[1]) / L], n = [-u[1], u[0]];           // n: mutfağa doğru (u, yukarı, n sağ el)
  const W = ([s, y, t]) => [A[0] + u[0] * s + n[0] * t, y, A[1] + u[1] * s + n[1] * t];
  const S0 = 0.04, S1 = 0.80, Y0 = 3.105, Y1 = 5.17, T = 0.02;                   // kanat: 76 x 207 x 4 cm
  const frame = [], glassQ = [];
  const box = (s0, s1, y0, y1, t0, t1) => frame.push([[s0, y0, t0], [s1, y1, t1]]);
  const st = 0.09, top = 0.09, bot = 0.16, bar = 0.022;
  box(S0, S0 + st, Y0, Y1, -T, T); box(S1 - st, S1, Y0, Y1, -T, T);                // dikmeler
  box(S0 + st, S1 - st, Y1 - top, Y1, -T, T); box(S0 + st, S1 - st, Y0, Y0 + bot, -T, T);  // kayıtlar
  const g0 = S0 + st, g1 = S1 - st, h0 = Y0 + bot, h1 = Y1 - top;
  box((g0 + g1) / 2 - bar / 2, (g0 + g1) / 2 + bar / 2, h0, h1, -T * 0.6, T * 0.6); // orta çıta
  for (let k = 1; k < 7; k++) {const y = h0 + (h1 - h0) * k / 7; box(g0, g1, y - bar / 2, y + bar / 2, -T * 0.6, T * 0.6);}
  box(-0.02, L + 0.02, Y1 + 0.005, Y1 + 0.05, -0.035, 0.035);                    // üst ray
  const p = [], nr = [], uv = [];
  const F = [[[0,0,0],[0,1,0],[0,1,1],[0,0,1],[-1,0,0]], [[1,0,0],[1,0,1],[1,1,1],[1,1,0],[1,0,0]], [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,-1]],
    [[0,0,1],[0,1,1],[1,1,1],[1,0,1],[0,0,1]], [[0,0,0],[0,0,1],[1,0,1],[1,0,0],[0,-1,0]], [[0,1,0],[1,1,0],[1,1,1],[0,1,1],[0,1,0]]];
  const wn = ([a, b, c]) => [u[0] * a + n[0] * c, b, u[1] * a + n[1] * c];
  for (const [a, b] of frame) for (const f of F) {
    const v = f.slice(0, 4).map(c => c.map((t, k) => t ? b[k] : a[k]));
    for (const i of [0, 2, 1, 0, 3, 2]) {                                         // F'nin sırası normalin tersine döner
      p.push(...W(v[i])); nr.push(...wn(f[4]));
      uv.push(f[4][1] ? v[i][0] : f[4][0] ? v[i][2] : v[i][0], -v[i][1] + (f[4][1] ? v[i][2] : 0));
    }
  }
  const gp = [], gn = [], guv = [];
  for (const t of [-0.004, 0.004]) {
    const q = [[g0, h0], [g1, h0], [g1, h1], [g0, h1]], order = t < 0 ? [0, 3, 2, 0, 2, 1] : [0, 1, 2, 0, 2, 3];
    for (const i of order) {gp.push(...W([q[i][0], q[i][1], t])); gn.push(...wn([0, 0, Math.sign(t)])); guv.push((q[i][0] - g0) / (g1 - g0), 1 - (q[i][1] - h0) / (h1 - h0));}
  }
  const prim = (mat, P, N, U) => doc.createPrimitive().setMaterial(mat)
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(P)).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(N)).setBuffer(buffer))
    .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(U)).setBuffer(buffer));
  scene.addChild(doc.createNode('EK_mutfak_surme_kapi').setMesh(doc.createMesh('EK_mutfak_surme_kapi')
    .addPrimitive(prim(wood, p, nr, uv)).addPrimitive(prim(glass, gp, gn, guv))));
  console.log(`mutfak sürme kapısı: ${(S1 - S0).toFixed(2)} x ${(Y1 - Y0).toFixed(2)} m, açıklık ${L.toFixed(2)} m`);
}

// Eksene hizalı kutular (dünya koordinatı) tek ilkel olarak; dışa bakan yüzler, düzlemsel UV (1 m = 1).
function addWorldBoxes(doc, name, mat, boxes) {
  const buffer = doc.getRoot().listBuffers()[0], p = [], nr = [], uv = [];
  const F = [[[0,0,0],[0,1,0],[0,1,1],[0,0,1],[-1,0,0]], [[1,0,0],[1,0,1],[1,1,1],[1,1,0],[1,0,0]], [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,-1]],
    [[0,0,1],[0,1,1],[1,1,1],[1,0,1],[0,0,1]], [[0,0,0],[0,0,1],[1,0,1],[1,0,0],[0,-1,0]], [[0,1,0],[1,1,0],[1,1,1],[0,1,1],[0,1,0]]];
  for (const [a, b] of boxes) for (const f of F) {
    const v = f.slice(0, 4).map(c => c.map((t, k) => t ? b[k] : a[k]));
    for (const i of [0, 2, 1, 0, 3, 2]) {
      p.push(...v[i]); nr.push(...f[4]);
      uv.push(f[4][0] ? v[i][2] : v[i][0], f[4][1] ? v[i][2] : -v[i][1]);
    }
  }
  const prim = doc.createPrimitive().setMaterial(mat)
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(p)).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nr)).setBuffer(buffer))
    .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(uv)).setBuffer(buffer));
  doc.getRoot().listScenes()[0].addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)));
}
// Fotoğraf 42: merdiven kollarının açık yan yüzünde basamakları izleyen basamaklı ceviz şerit var
// (her basamakta basamak altı yatay + rıht dikey bant, ~4,5 cm); modelde yan yüz düz beyazdı.
// Basamaklar merdiven_parke'nin üst yüzlerinden, yan yüz EK_M2_Beyaz_merdiven_alti dik yüzlerinden bulunur;
// yan yüzü olmayan uç (duvar tarafı) atlanır.
function addStairTrim(doc) {
  const root = doc.getRoot();
  const wood = root.listMaterials().find(m => m.getName() === 'EK_M1_Sicak_ceviz_supurgelik');
  if (!wood) throw Error('merdiven şeridi: ceviz malzeme yok');
  const tris = (test) => {
    const out = [];
    for (const node of root.listNodes()) {
      const mesh = node.getMesh(); if (!mesh) continue; const w = node.getWorldMatrix();
      for (const prim of mesh.listPrimitives()) {
        if (!test(node, prim)) continue;
        const P = prim.getAttribute('POSITION').getArray(), I = prim.getIndices()?.getArray(), n = I ? I.length : P.length / 3;
        const X = i => [0, 1, 2].map(k => w[k]*P[i*3] + w[4+k]*P[i*3+1] + w[8+k]*P[i*3+2] + w[12+k]);
        for (let t = 0; t < n; t += 3) {
          const v = [X(I ? I[t] : t), X(I ? I[t + 1] : t + 1), X(I ? I[t + 2] : t + 2)];
          const e1 = v[1].map((x, k) => x - v[0][k]), e2 = v[2].map((x, k) => x - v[0][k]);
          const c = [e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]], L = Math.hypot(...c);
          if (L > 1e-9) out.push({v, n: c.map(x => x / L)});
        }
      }
    }
    return out;
  };
  // basamak üst yüzleri -> kutular (aynı yükseklik ±3 cm, xz örtüşen üçgenler birleşir)
  const tops = tris(node => node.getName() === 'merdiven_parke').filter(t => t.n[1] > 0.9);
  if (!tops.length) throw Error('merdiven şeridi: merdiven_parke yok');
  const groups = [];
  for (const t of tops) {
    const y = Math.max(...t.v.map(q => q[1])), b = [Math.min(...t.v.map(q => q[0])), Math.max(...t.v.map(q => q[0])), Math.min(...t.v.map(q => q[2])), Math.max(...t.v.map(q => q[2]))];
    const g = groups.find(g => Math.abs(g.y - y) < 0.03 && b[0] <= g.b[1] + 0.02 && b[1] >= g.b[0] - 0.02 && b[2] <= g.b[3] + 0.02 && b[3] >= g.b[2] - 0.02);
    if (g) {g.y = Math.max(g.y, y); g.b = [Math.min(g.b[0], b[0]), Math.max(g.b[1], b[1]), Math.min(g.b[2], b[2]), Math.max(g.b[3], b[3])];}
    else groups.push({y, b});
  }
  const treads = groups.map(g => {
    const dx = g.b[1] - g.b[0], dz = g.b[3] - g.b[2], L = dx > dz ? 0 : 2, R = 2 - L;   // L: genişlik ekseni, R: koşu ekseni
    const lo = i => (i === 0 ? g.b[0] : g.b[2]), hi = i => (i === 0 ? g.b[1] : g.b[3]);
    return {y: g.y, L, R, l0: lo(L), l1: hi(L), r0: lo(R), r1: hi(R)};
  }).filter(t => t.r1 - t.r0 < 0.42 && t.l1 - t.l0 > 0.6 && t.l1 - t.l0 < 1.6);
  const sides = tris((node, prim) => prim.getMaterial()?.getName() === 'EK_M2_Beyaz_merdiven_alti').filter(t => Math.abs(t.n[1]) < 0.2);
  const inTri = (t, q, ax) => {   // q'nun ax eksenine dik izdüşümü üçgende mi, düzleme uzaklık < 3 cm
    const [u, w] = [0, 1, 2].filter(k => k !== ax), [a, b, c] = t.v;
    const d = (b[w]-c[w])*(a[u]-c[u]) + (c[u]-b[u])*(a[w]-c[w]); if (Math.abs(d) < 1e-12) return false;
    const l1 = ((b[w]-c[w])*(q[u]-c[u]) + (c[u]-b[u])*(q[w]-c[w])) / d, l2 = ((c[w]-a[w])*(q[u]-c[u]) + (a[u]-c[u])*(q[w]-c[w])) / d, l3 = 1 - l1 - l2;
    if (l1 < -0.01 || l2 < -0.01 || l3 < -0.01) return false;
    return Math.abs(l1 * a[ax] + l2 * b[ax] + l3 * c[ax] - q[ax]) < 0.03;
  };
  const boxes = [], T = 0.012, W = 0.045; let n = 0;
  for (const t of treads) {
    const lower = treads.find(o => o !== t && o.L === t.L && t.y - o.y > 0.1 && t.y - o.y < 0.26
      && Math.min(o.l1, t.l1) - Math.max(o.l0, t.l0) > 0.5 && (Math.abs(o.r1 - t.r0) < 0.06 || Math.abs(o.r0 - t.r1) < 0.06));
    for (const [end, out] of [[t.l0, -1], [t.l1, 1]]) {
      const q = [0, 0, 0]; q[t.L] = end; q[t.R] = (t.r0 + t.r1) / 2; q[1] = t.y - 0.1;
      if (!sides.some(s => Math.abs(s.n[t.L]) > 0.9 && inTri(s, q, t.L))) continue;
      const box = (r0, r1, y0, y1) => {const a = [0, y0, 0], b = [0, y1, 0]; a[t.L] = out < 0 ? end - T : end; b[t.L] = out < 0 ? end : end + T; a[t.R] = r0; b[t.R] = r1; boxes.push([a, b]);};
      box(t.r0 - 0.005, t.r1 + 0.005, t.y - W, t.y + 0.002);                       // basamak bandı
      if (lower) {
        const edge = (lower.r0 + lower.r1) / 2 < (t.r0 + t.r1) / 2 ? [t.r0, t.r0 + W] : [t.r1 - W, t.r1];
        box(edge[0], edge[1], lower.y, t.y - W);                                      // rıht bandı
      }
      n++;
    }
  }
  if (!n) throw Error('merdiven şeridi: açık yan yüz bulunamadı');
  addWorldBoxes(doc, 'merdiven_yan_serit', wood, boxes);
  console.log(`merdiven yan şeridi: ${treads.length} basamak, ${n} açık uç, ${boxes.length} ceviz parça`);
}

function trimBoxes(doc) {
  const buffer = doc.getRoot().listBuffers()[0];
  for (const rule of TRIM) {
    let removed = 0;
    for (const node of doc.getRoot().listNodes()) {
      const mesh = node.getMesh(); if (!mesh) continue; const w = node.getWorldMatrix();
      for (const prim of mesh.listPrimitives()) {
        if (!rule.mat.test(prim.getMaterial()?.getName() ?? '') || !prim.getIndices()) continue;
        const P = prim.getAttribute('POSITION').getArray(), I = prim.getIndices().getArray(), keep = [];
        for (let t = 0; t < I.length; t += 3) {
          const c = [0, 1, 2].map(k => [0, 1, 2].reduce((a, j) => {const i = I[t + j] * 3; return a + (w[k]*P[i] + w[4+k]*P[i+1] + w[8+k]*P[i+2] + w[12+k]) / 3;}, 0));
          if (c.every((x, k) => x >= rule.min[k] && x <= rule.max[k])) removed++; else keep.push(I[t], I[t + 1], I[t + 2]);
        }
        if (keep.length !== I.length) prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(keep)).setBuffer(buffer));
      }
    }
    if (!removed) throw Error(`TRIM boş: ${rule.neden}`);
    console.log(`denetim: ${rule.neden} - ${removed} üçgen`);
  }
}

function fixDressingDoor(doc) {
  const MOVE = /^EK_M3_04_(kanat|dik_profil|yatay_profil|gobek|pirinc_topuz|topuz_mili|mentese)(\.\d+)?$/;
  const th = -35 * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
  const R = ([x, z]) => [c * x + s * z, -s * x + c * z];                 // R_y(th), xz
  const [hx, hz] = [2.1729, -6.0277], [nx, nz] = [1.3655, -6.0277];
  const [rx, rz] = R([hx, hz]), t = [nx - rx, 0, nz - rz];
  const D = [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, t[0], t[1], t[2], 1];  // sütun düzeninde
  const mul = (a, b) => {const o = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) o[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k]; return o;};
  let moved = 0;
  for (const node of doc.getRoot().listNodes()) {
    if (!MOVE.test(node.getName())) continue;
    if (node.getParentNode()) throw Error(`kapı EK_M3_04: ${node.getName()} kökte değil`);
    node.setMatrix(mul(D, node.getMatrix())); moved++;
  }
  if (moved !== 68) throw Error(`kapı EK_M3_04: 68 kanat parçası bekleniyordu, ${moved} bulundu`);
  console.log(`kapı EK_M3_04 (giyinme odası): kanat grubu ${moved} parça batı kasaya, 90° açık (aynadan uzak)`);
}

async function load(sources, {stairRepair = false} = {}) {
  const doc = await io.read(sources[0]);
  if (stairRepair) repairStair(doc);
  const root = doc.getRoot(), scene = root.listScenes()[0];
  for (const extra of sources.slice(1)) {
    const other = await io.read(extra);
    const map = mergeDocuments(doc, other);
    for (const s of other.getRoot().listScenes()) {
      const merged = map.get(s);
      for (const n of merged.listChildren()) {merged.removeChild(n); scene.addChild(n);}
      merged.dispose();
    }
  }
  if (stairRepair) {fixDressingDoor(doc); applyFloors(doc); buildKitchenette(doc); trimBoxes(doc); retileBoxes(doc); addHandrails(doc, await io.read(path.join(SRC, 'INTERIOR-opt-v3.glb'))); addGarageDoor(doc); restyleWardrobe(doc); addKitchenSlider(doc); addStairTrim(doc);}
  for (const prim of root.listMeshes().flatMap(m => m.listPrimitives()))
    for (const semantic of DROP) if (prim.getAttribute(semantic)) prim.setAttribute(semantic, null);
  for (const node of root.listNodes()) {const kat = node.getExtras()?.kat; node.setExtras(kat ? {kat} : {});}
  return doc;
}

// Her düğüm tek ilkel: birleştirme bir düğümde birden çok malzeme bırakabilir.
function splitPrimitives(doc) {
  const root = doc.getRoot(), scene = root.listScenes()[0];
  for (const node of [...root.listNodes()]) {
    const mesh = node.getMesh(); if (!mesh) continue;
    const prims = mesh.listPrimitives(); if (prims.length < 2) continue;
    for (const prim of prims.slice(1)) {
      mesh.removePrimitive(prim);
      const m = doc.createMesh(prim.getMaterial()?.getName() ?? 'parca').addPrimitive(prim);
      const child = doc.createNode(prim.getMaterial()?.getName() ?? 'parca').setMesh(m).setMatrix(node.getWorldMatrix());
      scene.addChild(child);
    }
  }
  for (const node of root.listNodes()) {
    const mat = node.getMesh()?.listPrimitives()[0]?.getMaterial()?.getName();
    if (mat) node.setName(mat);
  }
}

// --- 4. lightmap UV ---------------------------------------------------------
function lightmapUV(doc) {
  const root = doc.getRoot(), buffer = root.listBuffers()[0];
  const atlasOf = new Map(Object.entries(ATLASES).flatMap(([a, s]) => s.malzemeler.map(m => [m, a])));
  const found = new Set();
  const input = {atlaslar: {}}, chunks = []; let offset = 0;
  const push = arr => {const b = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); chunks.push(b); const r = [offset, arr.length]; offset += b.length; return r;};
  const targets = new Map();
  root.listNodes().forEach((node, i) => {
    const prim = node.getMesh()?.listPrimitives()[0]; if (!prim) return;
    const mat = prim.getMaterial()?.getName(); const atlas = atlasOf.get(mat); if (!atlas) return;
    found.add(mat);
    const key = `${String(i).padStart(4, '0')}|${mat}`;
    const w = node.getWorldMatrix(), src = prim.getAttribute('POSITION').getArray();
    const world = new Float32Array(src.length);
    for (let v = 0; v < src.length; v += 3) {
      const x = src[v], y = src[v + 1], z = src[v + 2];
      world[v] = w[0] * x + w[4] * y + w[8] * z + w[12];
      world[v + 1] = w[1] * x + w[5] * y + w[9] * z + w[13];
      world[v + 2] = w[2] * x + w[6] * y + w[10] * z + w[14];
    }
    const idx = prim.getIndices() ? Uint32Array.from(prim.getIndices().getArray()) : Uint32Array.from({length: src.length / 3}, (_, k) => k);
    (input.atlaslar[atlas] ??= {boyut: ATLASES[atlas].boyut, parcalar: []}).parcalar.push({dugum: key, konum: push(world), indeks: push(idx)});
    targets.set(key, {node, prim, atlas});
  });
  const missing = Object.values(ATLASES).flatMap(s => s.malzemeler).filter(m => !found.has(m));
  if (missing.length) console.warn('lightmap: modelde olmayan malzemeler (atlandı):', missing.join(', '));
  writeFileSync(path.join(BAKE, 'giris.json'), JSON.stringify(input));
  writeFileSync(path.join(BAKE, 'giris.bin'), Buffer.concat(chunks));
  execFileSync(PYTHON, [path.join(REPO, 'tools/blender/lightmap_uv_tur10.py'), path.join(BAKE, 'giris.json')], {stdio: 'inherit'});
  const out = JSON.parse(readFileSync(path.join(BAKE, 'cikis.json'), 'utf8'));
  const blob = readFileSync(path.join(BAKE, 'cikis.bin'));
  const view = ([o, n], T) => new T(blob.buffer.slice(blob.byteOffset + o, blob.byteOffset + o + n * 4));
  const spec = {uretim: 'tools/batch-delivery/make-tur10-web.mjs', dolgu_px: out.dolgu_px, atlaslar: {}};
  for (const [atlas, entry] of Object.entries(out.atlaslar)) {
    const dugumler = {};
    for (const [key, rec] of Object.entries(entry.parcalar)) {
      const {node, prim} = targets.get(key);
      const vmap = view(rec.vmapping, Uint32Array), uv = view(rec.uv, Float32Array), indices = view(rec.indices, Uint32Array);
      if (prim.getAttribute('POSITION').getCount() !== rec.eski_kose) throw Error(`${key}: köşe sayısı tutmuyor`);
      // TEXCOORD_0 yoksa sıfırla eklenir: lightmap her zaman TEXCOORD_1'de
      if (!prim.getAttribute('TEXCOORD_0'))
        prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(rec.eski_kose * 2)).setBuffer(buffer));
      for (const semantic of prim.listSemantics()) {
        const acc = prim.getAttribute(semantic), size = acc.getElementSize(), arr = acc.getArray();
        const next = new arr.constructor(vmap.length * size);
        for (let i = 0; i < vmap.length; i++) for (let k = 0; k < size; k++) next[i * size + k] = arr[vmap[i] * size + k];
        prim.setAttribute(semantic, doc.createAccessor().setType(acc.getType()).setArray(next).setNormalized(acc.getNormalized()).setBuffer(buffer));
      }
      prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(indices).setBuffer(buffer));
      prim.setAttribute('TEXCOORD_1', doc.createAccessor().setType('VEC2').setArray(uv).setBuffer(buffer));
      const name = `LM_${atlas}_${Object.keys(dugumler).length.toString().padStart(3, '0')}`;
      node.setName(name).setExtras({...node.getExtras(), lightmap: {atlas, texcoord: 1}});
      prim.getMaterial().setExtras({...prim.getMaterial().getExtras(), lightmap: {atlas, texcoord: 1}});
      dugumler[name] = {texcoord: 1, malzeme: prim.getMaterial().getName()};
    }
    const {parcalar, ...summary} = entry;
    spec.atlaslar[atlas] = {...summary, dosya: 'tur10/BUILDING-opt-v6', dugumler}; // 03_web_isik: build/bake/<dosya>-lm.glb
  }
  return spec;
}

async function writeWeb(doc, out) {
  await doc.transform(textureCompress({encoder: sharp, targetFormat: 'webp', resize: [MAX_EDGE, MAX_EDGE], quality: 88}), unpartition(), draco({method: 'edgebreaker'}));
  await io.write(out, doc);
  const check = (await io.read(out)).getRoot();
  console.log(path.basename(out), `${(statSync(out).size / 1e6).toFixed(2)} MB`,
    `çizim ${check.listMeshes().flatMap(m => m.listPrimitives()).length}`, `malzeme ${check.listMaterials().length}`,
    `UV1 ${check.listMeshes().flatMap(m => m.listPrimitives()).filter(p => p.getAttribute('TEXCOORD_1')).length}`);
}

// --- Mobilya (ürün sahibinin Tripo modelleri, tur10-mobilya/mobilya.json) -----
// Tripo bir fotoğraftaki grubu TEK mesh olarak ve ~1 m'ye normalize verir:
// parçalar bağlı bileşenlerden ayrılır ('kutu' ya da en yakın 'merkez_secim'),
// kaynağın ölçeğiyle büyütülür, 'yon' kadar döner ve alt-orta noktası
// 'konum'daki ZEMİNE (BUILDING'den dikey ışınla) oturur. 'sil' eski
// INTERIOR üçgenlerini (malzeme + kutu) kaldırır.
const FLOOR_TRIS = [];
function collectFloors(doc) {
  const WALK = /^(WOOD-FL|wood_floor|terra_floor|terra_floor_giris|stone_tile|RR|R31 \| R33 .*tile)$/;
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh(); if (!mesh) continue; const w = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      if (!WALK.test(prim.getMaterial()?.getName() ?? '')) continue;
      const pos = prim.getAttribute('POSITION'), idx = prim.getIndices(), v = [0, 0, 0];
      const P = i => {pos.getElement(i, v); return [w[0]*v[0]+w[4]*v[1]+w[8]*v[2]+w[12], w[1]*v[0]+w[5]*v[1]+w[9]*v[2]+w[13], w[2]*v[0]+w[6]*v[1]+w[10]*v[2]+w[14]];};
      const n = idx ? idx.getCount() : pos.getCount();
      for (let t = 0; t < n; t += 3) FLOOR_TRIS.push([P(idx ? idx.getScalar(t) : t), P(idx ? idx.getScalar(t + 1) : t + 1), P(idx ? idx.getScalar(t + 2) : t + 2)]);
    }
  }
}
function floorAt(x, z, below = 99) {
  let best = null;
  for (const [a, b, c] of FLOOR_TRIS) {
    const d = (b[2]-c[2])*(a[0]-c[0]) + (c[0]-b[0])*(a[2]-c[2]); if (Math.abs(d) < 1e-12) continue;
    const l1 = ((b[2]-c[2])*(x-c[0]) + (c[0]-b[0])*(z-c[2])) / d, l2 = ((c[2]-a[2])*(x-c[0]) + (a[0]-c[0])*(z-c[2])) / d, l3 = 1 - l1 - l2;
    if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
    const y = l1 * a[1] + l2 * b[1] + l3 * c[1];
    if (y < below && (best === null || y > best)) best = y;
  }
  return best;
}
async function addFurniture(doc) {
  const DIR_M = path.join(here, 'tur10-mobilya');
  const spec = JSON.parse(readFileSync(path.join(DIR_M, 'mobilya.json'), 'utf8'));
  const root = doc.getRoot(), scene = root.listScenes()[0], buffer = root.listBuffers()[0];
  // eski üçgenleri sil
  for (const cut of spec.sil ?? []) {
    let removed = 0;
    for (const node of root.listNodes()) {
      const mesh = node.getMesh(); if (!mesh) continue; const w = node.getWorldMatrix();
      for (const prim of mesh.listPrimitives()) {
        if (![cut.malzeme].flat().includes(prim.getMaterial()?.getName()) || !prim.getIndices()) continue;
        const pos = prim.getAttribute('POSITION'), idx = prim.getIndices(), v = [0, 0, 0], keep = [];
        const inBox = i => {pos.getElement(i, v); const q = [w[0]*v[0]+w[4]*v[1]+w[8]*v[2]+w[12], w[1]*v[0]+w[5]*v[1]+w[9]*v[2]+w[13], w[2]*v[0]+w[6]*v[1]+w[10]*v[2]+w[14]]; return q.every((c, k) => c >= cut.min[k] && c <= cut.max[k]);};
        for (let t = 0; t < idx.getCount(); t += 3) {
          const ids = [idx.getScalar(t), idx.getScalar(t + 1), idx.getScalar(t + 2)];
          if (ids.every(inBox)) removed++; else keep.push(...ids);
        }
        prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(keep)).setBuffer(buffer));
      }
    }
    if (!removed) throw Error(`mobilya: sil kutusu boş (${cut.not ?? cut.malzeme})`);
    console.log(`mobilya: eski '${[cut.malzeme].flat().join("', '")}' ${removed} üçgen silindi (${cut.not ?? ''})`);
  }
  // kaynakları oku, bağlı bileşenlere ayır
  const sources = {};
  for (const [key, src] of Object.entries(spec.kaynaklar)) {
    const other = await io.read(path.join(DIR_M, src.dosya));
    const prim = other.getRoot().listMeshes()[0].listPrimitives()[0];
    const pos = prim.getAttribute('POSITION').getArray(), idx = prim.getIndices().getArray();
    const n = pos.length / 3, parent = Int32Array.from({length: n}, (_, i) => i), keyOf = new Map();
    const find = a => {while (parent[a] !== a) a = parent[a] = parent[parent[a]]; return a;};
    const rep = new Int32Array(n);
    for (let i = 0; i < n; i++) {const k = `${pos[3*i].toFixed(5)},${pos[3*i+1].toFixed(5)},${pos[3*i+2].toFixed(5)}`; rep[i] = keyOf.get(k) ?? (keyOf.set(k, i), i);}
    for (let t = 0; t < idx.length; t += 3) {const a = find(rep[idx[t]]); parent[find(rep[idx[t + 1]])] = a; parent[find(rep[idx[t + 2]])] = a;}
    const comps = new Map();
    for (let t = 0; t < idx.length; t += 3) {const r = find(rep[idx[t]]); (comps.get(r) ?? comps.set(r, []).get(r)).push(t);}
    const list = [...comps.values()].map(tris => {
      let mn = [9, 9, 9], mx = [-9, -9, -9];
      for (const t of tris) for (let k = 0; k < 3; k++) {const i = idx[t + k]; for (let j = 0; j < 3; j++) {mn[j] = Math.min(mn[j], pos[3*i+j]); mx[j] = Math.max(mx[j], pos[3*i+j]);}}
      return {tris, cx: (mn[0] + mx[0]) / 2, cz: (mn[2] + mx[2]) / 2};
    });
    const map = mergeDocuments(doc, other);
    for (const s2 of other.getRoot().listScenes()) {const m = map.get(s2); for (const c of m.listChildren()) {m.removeChild(c); c.dispose();} m.dispose();}
    sources[key] = {prim: map.get(prim), comps: list, scale: src.olcek};
  }
  for (const part of spec.parcalar) {
    const src = sources[part.kaynak];
    let chosen;
    if (part.merkez_secim) {const [x, z] = part.merkez_secim; chosen = [src.comps.reduce((b, c) => Math.hypot(c.cx - x, c.cz - z) < Math.hypot(b.cx - x, b.cz - z) ? c : b)];}
    else {const [x0, x1, z0, z1] = part.kutu; chosen = src.comps.filter(c => c.cx >= x0 && c.cx <= x1 && c.cz >= z0 && c.cz <= z1);}
    if (!chosen.length) throw Error(`mobilya: ${part.ad} için parça bulunamadı`);
    const tris = chosen.flatMap(c => c.tris), sp = src.prim, idx = sp.getIndices().getArray();
    const used = [...new Set(tris.flatMap(t => [idx[t], idx[t + 1], idx[t + 2]]))], remap = new Map(used.map((o, i) => [o, i]));
    const prim = doc.createPrimitive().setMaterial(sp.getMaterial());
    for (const sem of sp.listSemantics()) {
      const acc = sp.getAttribute(sem), size = acc.getElementSize(), arr = acc.getArray(), out = new arr.constructor(used.length * size);
      used.forEach((o, i) => {for (let k = 0; k < size; k++) out[i * size + k] = arr[o * size + k];});
      prim.setAttribute(sem, doc.createAccessor().setType(acc.getType()).setArray(out).setNormalized(acc.getNormalized()).setBuffer(buffer));
    }
    prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(tris.flatMap(t => [remap.get(idx[t]), remap.get(idx[t + 1]), remap.get(idx[t + 2])]))).setBuffer(buffer));
    // alt-orta nokta
    const pa = prim.getAttribute('POSITION').getArray(); let mn = [9, 9, 9], mx = [-9, -9, -9];
    for (let i = 0; i < pa.length; i += 3) for (let j = 0; j < 3; j++) {mn[j] = Math.min(mn[j], pa[i + j]); mx[j] = Math.max(mx[j], pa[i + j]);}
    const pivot = [(mn[0] + mx[0]) / 2, mn[1], (mn[2] + mx[2]) / 2];
    if (!Number.isInteger(part.kat)) throw Error(`mobilya: ${part.ad} için 'kat' yok`);
    const [x, z] = part.konum, y = floorAt(x, z, DATUMS[part.kat] + 1.0);
    if (y !== null && Math.abs(y - DATUMS[part.kat]) > 0.5) throw Error(`mobilya: ${part.ad} zemini ${y} - ${part.kat}. kat değil`);
    if (y === null) throw Error(`mobilya: ${part.ad} altında zemin yok (${x}, ${z})`);
    // ölçek tek sayı ya da Tripo eksenlerinde [x, y, z] (fotoğraftan gelen boy oranı bozukluğu için);
    // parçanın kendi 'olcek'i kaynağınkini ezer
    const sc = part.olcek ?? src.scale, s = Array.isArray(sc) ? sc : [sc, sc, sc];
    const th = (part.yon ?? 0) * Math.PI / 180, c = Math.cos(th), sn = Math.sin(th);
    // M = T(x,y,z) * R_y(th) * S(s) * T(-pivot)
    const m = [c * s[0], 0, -sn * s[0], 0, 0, s[1], 0, 0, sn * s[2], 0, c * s[2], 0, 0, 0, 0, 1];
    const tp = [-pivot[0] * s[0], -pivot[1] * s[1], -pivot[2] * s[2]];
    m[12] = x + c * tp[0] + sn * tp[2]; m[13] = y + tp[1]; m[14] = z - sn * tp[0] + c * tp[2];
    const node = doc.createNode('MOBILYA_' + part.ad).setMesh(doc.createMesh('MOBILYA_' + part.ad).addPrimitive(prim)).setMatrix(m).setExtras({kat: floorOf(y)});
    scene.addChild(node);
    const w = [(mx[0] - mn[0]) * s[0], (mx[1] - mn[1]) * s[1], (mx[2] - mn[2]) * s[2]];
    console.log(`mobilya: ${part.ad} (${chosen.length} parça) ${w.map(v => v.toFixed(2)).join(' x ')} m @ (${x}, ${y.toFixed(3)}, ${z}) ${part.yon ?? 0}°`);
  }
  for (const {prim} of Object.values(sources)) {const mesh = prim.listParents().find(p => p.propertyType === 'Mesh'); prim.dispose(); mesh?.dispose();}
  // 'hazir': ürün sahibinin Blender'da yerine koyduğu dosyalar (dünya koordinatı, glTF).
  // Konum/dönüş/ölçek AYNEN alınır; yalnız her bağlı bileşenin altı, birkaç cm'lik
  // elle yerleştirme payı kadar (<= 8 cm) o kattaki zemine indirilir/kaldırılır. Bir düğüm
  // birkaç kata yayılabilir (bodrum takımı + giriş koltukları): kat başına ayrı düğüm olur,
  // sitede kat kesiti mobilyayı doğru katla gizlesin.
  for (const item of spec.hazir ?? []) {
    const other = await io.read(path.join(DIR_M, item.dosya));
    const map = mergeDocuments(doc, other);
    for (const src of other.getRoot().listNodes()) {
      const srcMesh = src.getMesh(); if (!srcMesh) continue;
      const w = src.getWorldMatrix(), sp = map.get(srcMesh.listPrimitives()[0]);
      const pa = sp.getAttribute('POSITION').getArray(), na = sp.getAttribute('NORMAL')?.getArray(), idx = sp.getIndices().getArray();
      const n = pa.length / 3, P = new Float32Array(pa.length), N = na ? new Float32Array(na.length) : null;
      // dünya matrisi köşelere işlenir (ölçek düzgün: normal için aynı 3x3, sonra birim boy)
      for (let i = 0; i < n; i++) {
        const v = [pa[3*i], pa[3*i+1], pa[3*i+2]];
        for (let k = 0; k < 3; k++) P[3*i+k] = w[k]*v[0] + w[4+k]*v[1] + w[8+k]*v[2] + w[12+k];
        if (N) {
          const q = [na[3*i], na[3*i+1], na[3*i+2]], r = [0, 1, 2].map(k => w[k]*q[0] + w[4+k]*q[1] + w[8+k]*q[2]), l = Math.hypot(...r) || 1;
          for (let k = 0; k < 3; k++) N[3*i+k] = r[k] / l;
        }
      }
      // bağlı bileşenler (kaynak konumuna göre kaynaşık köşeler)
      const parent = Int32Array.from({length: n}, (_, i) => i), keyOf = new Map(), rep = new Int32Array(n);
      const find = a => {while (parent[a] !== a) a = parent[a] = parent[parent[a]]; return a;};
      for (let i = 0; i < n; i++) {const k = `${pa[3*i].toFixed(5)},${pa[3*i+1].toFixed(5)},${pa[3*i+2].toFixed(5)}`; rep[i] = keyOf.get(k) ?? (keyOf.set(k, i), i);}
      for (let t = 0; t < idx.length; t += 3) {const a = find(rep[idx[t]]); parent[find(rep[idx[t + 1]])] = a; parent[find(rep[idx[t + 2]])] = a;}
      const comps = new Map();
      for (let t = 0; t < idx.length; t += 3) {const r = find(rep[idx[t]]); (comps.get(r) ?? comps.set(r, []).get(r)).push(t);}
      const byFloor = new Map(), done = new Set();
      for (const tris of comps.values()) {
        const verts = [...new Set(tris.flatMap(t => [idx[t], idx[t + 1], idx[t + 2]]))];
        let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
        for (const i of verts) for (let k = 0; k < 3; k++) {mn[k] = Math.min(mn[k], P[3*i+k]); mx[k] = Math.max(mx[k], P[3*i+k]);}
        const kat = floorOf(mn[1] + 0.3), cx = (mn[0] + mx[0]) / 2, cz = (mn[2] + mx[2]) / 2;
        const y = floorAt(cx, cz, DATUMS[kat] + 1.0);
        let dy = 0;
        if (y !== null && Math.abs(y - DATUMS[kat]) < 0.5 && Math.abs(mn[1] - y) <= 0.08) dy = y - mn[1];
        for (const i of verts) if (!done.has(i)) {P[3*i+1] += dy; done.add(i);}
        (byFloor.get(kat) ?? byFloor.set(kat, []).get(kat)).push(...tris);
      }
      for (const [kat, tris] of [...byFloor].sort((a, b) => a[0] - b[0])) {
        const used = [...new Set(tris.flatMap(t => [idx[t], idx[t + 1], idx[t + 2]]))], remap = new Map(used.map((o, i) => [o, i]));
        const prim = doc.createPrimitive().setMaterial(sp.getMaterial());
        for (const sem of sp.listSemantics()) {
          const acc = sp.getAttribute(sem), size = acc.getElementSize();
          const arr = sem === 'POSITION' ? P : sem === 'NORMAL' && N ? N : acc.getArray(), out = new arr.constructor(used.length * size);
          used.forEach((o, i) => {for (let k = 0; k < size; k++) out[i * size + k] = arr[o * size + k];});
          prim.setAttribute(sem, doc.createAccessor().setType(acc.getType()).setArray(out).setNormalized(acc.getNormalized()).setBuffer(buffer));
        }
        prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(tris.flatMap(t => [remap.get(idx[t]), remap.get(idx[t + 1]), remap.get(idx[t + 2])]))).setBuffer(buffer));
        const name = `MOBILYA_${item.ad}_${srcMesh.getName().replace(/\W+/g, '')}_kat${kat}`;
        scene.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)).setExtras({kat}));
        console.log(`mobilya: ${name} ${tris.length} üçgen`);
      }
      sp.listParents().filter(p => p.propertyType === 'Mesh').forEach(m => m.dispose()); sp.dispose();
    }
    for (const s2 of other.getRoot().listScenes()) {const m = map.get(s2); for (const c of m.listChildren()) {m.removeChild(c); c.dispose();} m.dispose();}
  }
}

// --- BUILDING ----------------------------------------------------------------
{
  const doc = await load([path.join(SRC, 'BUILDING-opt-v6-alt.glb'), path.join(SRC, 'BUILDING-opt-v6-ust.glb')], {stairRepair: true});
  const before = box(doc);
  await doc.transform(dedup(), flatten(), join({keepNamed: false}), prune({keepAttributes: false}),
    textureCompress({encoder: sharp, resize: [MAX_EDGE, MAX_EDGE]}));
  splitPrimitives(doc);
  // aynı malzemeden iki kat yüzey: pişirmede biri kara çıkıp titreşiyordu (357 m² beyaz duvar)
  const dup = dropCoveredDuplicates(doc, {EK_M2_Beyaz_merdiven_alti: /^(Simple White Wall|EK_SimpleWhiteWall|WOOD-FL|wood_floor|terra_floor|terra_floor_giris|stone_tile|WHT\.001|ceiling\.001)$/});
  console.log(`çift katman: ${dup.dropped} örtülen üçgen atıldı (${dup.area.toFixed(0)} m²)`);
  // Cycles yüzeyi normalinin baktığı yandan pişirir: içe bakan duvar/tavan kara çıkıyordu
  const yon = orientForBake(doc, new Set(Object.values(ATLASES).flatMap(s => s.malzemeler)),
    JSON.parse(readFileSync(path.join(REPO, 'build/web/full/rooms.json'), 'utf8')).spaces);
  console.log(`pişirme yönü: ${yon.cevrilen} üçgen (${yon.cevrilen_alan.toFixed(0)} m² / ${yon.alan.toFixed(0)} m²) görünen yana çevrildi, şüpheli ${yon.supheli_alan.toFixed(1)} m²`);
  const spec = lightmapUV(doc);
  const after = box(doc);
  const drift = Math.max(...before.min.map((v, i) => Math.abs(v - after.min[i])), ...before.max.map((v, i) => Math.abs(v - after.max[i])));
  if (drift > 0.002) throw Error(`BUILDING: sınır kutusu kaydı ${drift} m`);
  console.log('BUILDING kutu', fmt(after), `kayma ${drift.toExponential(1)} m`);
  // yön ve lightmap UV adımlarının yerine koyduğu eski öznitelikler kimseye bağlı değil ama
  // dosyaya yazılıyordu (4 MB); prune kullanılmaz: tek renkli dokuları faktöre çevirir
  const root = doc.getRoot(); let orphans = 0;
  for (const a of root.listAccessors()) if (a.listParents().every(p => p === root)) {a.dispose(); orphans++;}
  console.log(`BUILDING: ${orphans} bağsız erişimci atıldı`);
  await doc.transform(unpartition());
  await io.write(path.join(BAKE, 'BUILDING-opt-v6-lm.glb'), doc);
  collectFloors(doc);
  // bahçe: Tur 6'nın lightmap UV'li bahçesi aynen (build/bake/GARDEN-opt-v2-lm.glb)
  const old = JSON.parse(readFileSync(path.join(REPO, 'build/bake/lightmap-uv.json'), 'utf8'));
  spec.atlaslar.bahce = {...old.atlaslar.bahce, dosya: 'GARDEN-opt-v2',
    dugumler: Object.fromEntries(Object.entries(old.atlaslar.bahce.dugumler).map(([n, d]) => [n, {texcoord: d.texcoord}]))};
  spec.sahne = ['tur10/BUILDING-opt-v6-lm.glb', 'GARDEN-opt-v2-lm.glb', 'tur10/INTERIOR-opt-v3-sahne.glb'];
  spec.isiklar = 'tools/blender/isiklar-v2.json';
  writeFileSync(path.join(BAKE, 'lightmap-uv.json'), JSON.stringify(spec, null, 1));
  copyFileSync(path.join(SRC, 'isiklar-v2.json'), path.join(REPO, 'tools/blender/isiklar-v2.json'));
  await writeWeb(doc, path.join(DIR, 'BUILDING-opt-v6.glb'));
}

// Fotoğraf denetimi, mobilya/ahşap rengi: kutudaki (tamamı içinde) üçgenler aynı erişimcilerle
// (UV, normal korunur) yeni ilkele, taban rengi DOKU/<doku> olan kopya malzemeye taşınır. Dokular
// aynı ahşap dokusunun hedef renge çekilmiş hâli: normal/pürüzlülük haritası desenle uyar.
const RECOLOR = [
  // 1. kat oturma alanı kirişleri bal rengi çam; modelde koyu ceviz dokulu wood_honey, siyah görünüyordu
  {mat: 'wood_honey', ad: 'EK_cam_kiris', doku: 'cam-kiris.jpg', min: [-5.96, 8.9, -4.26], max: [-1.05, 9.02, -0.05], neden: 'fotoğraf 12/33 kirişler (x -1,14e kadar)'},
  // giriş katı mutfak dolapları sıcak kiraz (fotoğraf 21/22); model koyu, kahve-gri
  // 1. kat giyinme odası dolapları açık tik (fotoğraf 16); BUILDING'deki EK_A08_Ceviz de aynı dokuya (restyleWardrobe)
  {mat: 'wood_honey', ad: 'EK_giyinme_tik', doku: 'giyinme-tik.jpg', min: [0.3, 6.3, -5.96], max: [3.1, 8.8, -3.35], neden: 'fotoğraf 16 giyinme dolapları'},
  {mat: 'wood_honey', ad: 'EK_mutfak_kiraz', doku: 'mutfak-kiraz.jpg', min: [-5.7, 3.0, -0.2], max: [-2.2, 5.8, 3.3], neden: 'fotoğraf 21 mutfak dolapları'},
];
function restyleWardrobe(doc) {
  const mats = doc.getRoot().listMaterials().filter(m => m.getName() === 'EK_A08_Ceviz');
  if (!mats.length) throw Error('EK_A08_Ceviz yok');
  const tex = doc.createTexture('giyinme-tik').setImage(readFileSync(path.join(DOKU, 'giyinme-tik.jpg'))).setMimeType('image/jpeg');
  for (const m of mats) m.setBaseColorTexture(tex).setBaseColorFactor([1, 1, 1, 1]);
}
function recolorBoxes(doc) {
  const root = doc.getRoot(), buffer = root.listBuffers()[0];
  for (const rule of RECOLOR) {
    const tex = doc.createTexture(rule.ad).setImage(readFileSync(path.join(DOKU, rule.doku))).setMimeType('image/jpeg');
    const clones = new Map(); let moved = 0;
    for (const node of root.listNodes()) {
      const mesh = node.getMesh(); if (!mesh) continue; const w = node.getWorldMatrix();
      for (const prim of [...mesh.listPrimitives()]) {
        const mat = prim.getMaterial(); if (mat?.getName() !== rule.mat || !mat.getBaseColorTexture() || !prim.getIndices()) continue;
        const P = prim.getAttribute('POSITION').getArray(), I = prim.getIndices().getArray(), keep = [], out = [];
        const X = i => [0, 1, 2].map(k => w[k]*P[i*3] + w[4+k]*P[i*3+1] + w[8+k]*P[i*3+2] + w[12+k]);
        for (let t = 0; t < I.length; t += 3) {
          const v = [X(I[t]), X(I[t + 1]), X(I[t + 2])];
          (v.every(q => q.every((x, k) => x >= rule.min[k] && x <= rule.max[k])) ? out : keep).push(I[t], I[t + 1], I[t + 2]);
        }
        if (!out.length) continue;
        if (!clones.has(mat)) clones.set(mat, mat.clone().setName(rule.ad).setBaseColorTexture(tex).setBaseColorFactor([1, 1, 1, 1]));
        prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(keep)).setBuffer(buffer));
        mesh.addPrimitive(prim.clone().setMaterial(clones.get(mat))
          .setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(out)).setBuffer(buffer)));
        moved += out.length / 3;
      }
    }
    if (!moved) throw Error(`renk: kutuda ${rule.mat} yok (${rule.neden})`);
    console.log(`renk: ${rule.neden} - ${moved} üçgen ${rule.ad}`);
  }
}

// --- INTERIOR (mobilya; lightmap almaz, pişirmede gölge verir) ----------------
{
  const doc = await load([path.join(SRC, 'INTERIOR-opt-v3.glb')]);
  await addFurniture(doc);
  // Tripo malzemeleri metalik=1 geliyor: deri/ahşap/kumaş seramik gibi parlıyordu (30.09)
  for (const m of doc.getRoot().listMaterials()) if (/^tripo_material|^adsad$/.test(m.getName())) m.setMetallicFactor(0);
  recolorBoxes(doc);
  await doc.transform(dedup(), prune({keepAttributes: false}), textureCompress({encoder: sharp, resize: [MAX_EDGE, MAX_EDGE]}), unpartition());
  await io.write(path.join(BAKE, 'INTERIOR-opt-v3-sahne.glb'), doc);
  await writeWeb(doc, path.join(DIR, 'INTERIOR-opt-v3.glb'));
}
for (const f of ['BUILDING-opt-v6-lm.glb', 'INTERIOR-opt-v3-sahne.glb'])
  console.log('pişirme', f, `${(statSync(path.join(BAKE, f)).size / 1e6).toFixed(1)} MB`);
