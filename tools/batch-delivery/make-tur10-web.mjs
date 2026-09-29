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
    'R31 | R33 master fine mosaic band']},
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
    const top = x => (x <= STAIR.x1 ? STAIR.yAtX1 + (STAIR.x1 - x) * STAIR.slope : 1.30);
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
  if (mats.get('wood_floor')) restyle(mats.get('wood_floor'), parke);
  const basement = restyle(mats.get('terra_floor'), pbr('bodrum-karo'));
  const ground = restyle(mats.get('terra_floor').clone().setName('terra_floor_giris'), pbr('giris-karo'));
  // uv: dünya x/z'den; rot: karo yönü, su/sv: dokunun metre karşılığı
  // sahanlık dikdörtgeni (x-z): x -0,09..1,93, z -5,15..-3,81
  const VEST = [[-0.09, -5.15], [1.93, -5.15], [1.93, -3.81], [-0.09, -3.81]]; // saat yönü tersine (içi solda)
  const vestTile = mats.get('R31 | R33 attic cream tile');
  const RULES = {
    vest: {affine: [1 / 0.30, 0, 0, 0, 1 / 0.30, 1]},  // banyo zemininin kendi UV'si (u = x/0,30, v = z/0,30 + 1)
    'WOOD-FL': {rot: 0, su: 2.0, sv: 2.0}, 'wood_floor': {rot: 0, su: 2.0, sv: 2.0},
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
    const verts = [];
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
          if (L > 1e-12 && Math.abs(cr[1] / L) < 0.5) verts.push({tri, n: cr.map(x => x / L)}); else keep.push(...ids);
        }
        prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(keep)).setBuffer(buffer));
      }
    }
    const count = verts.length * 3, p = new Float32Array(count * 3), nr = new Float32Array(count * 3), uv = new Float32Array(count * 2);
    verts.forEach(({tri, n}, i) => tri.forEach((vv, j) => {
      const o = i * 3 + j; p.set(vv, o * 3); nr.set(n, o * 3);
      const k = floorOf((tri[0][1] + tri[1][1] + tri[2][1]) / 3), y0 = DATUMS[k] + BAND + V0 * H;
      uv[o * 2] = (Math.abs(n[0]) > Math.abs(n[2]) ? vv[2] : vv[0]) / W; uv[o * 2 + 1] = (y0 - vv[1]) / H;
    }));
    const prim = doc.createPrimitive().setMaterial(wallMat)
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(p).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(nr).setBuffer(buffer))
      .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(uv).setBuffer(buffer));
    scene.addChild(doc.createNode('banyo_duvar').setMesh(doc.createMesh('banyo_duvar').addPrimitive(prim)).setExtras({kat: 'kat1'}));
    console.log(`banyo duvarları: ${verts.length} üçgen yeni seramiğe (${(verts.reduce((a, {tri}) => {const e1 = [0,1,2].map(k => tri[1][k]-tri[0][k]), e2 = [0,1,2].map(k => tri[2][k]-tri[0][k]); return a + Math.hypot(e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]) / 2;}, 0)).toFixed(1)} m²)`);
  }
  console.log(`zeminler: parke/karo dokuları değişti, ıslak hacimlerde kesilen parke üçgeni ${cut}`);
}

// --- Çatı katı mini mutfak (foto 06), basit kutularla -----------------------
// Banyo önündeki sahanlıkta doğu duvarı (x 1,89) boyunca, önü batıya bakar;
// kuzeyden güneye: evyeli 2 kapaklı dolap 0,80 | mini buzdolabı 0,50 | tek
// kapaklı dolap 0,44. Tezgâh 0,90 yükseklik, 0,60 derinlik; raf tezgâhın
// 0,35 m üstünde, askı çubuğu çatı eğiminin hemen altında. Ajanın önünü
// kapatan duvarı (EK_M3C_sag_yan) ve tavan bloğu (EK_M3C_kapi_ustu) silinir.
function buildKitchenette(doc) {
  const root = doc.getRoot(), scene = root.listScenes()[0], buffer = root.listBuffers()[0];
  for (const node of [...root.listNodes()]) if (/^EK_M3C_(sag_yan|kapi_ustu)$/.test(node.getName())) {node.getMesh()?.dispose(); node.dispose();}
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
  const units = [['dolap2', 0.80], ['buzdolabi', 0.50], ['dolap1', 0.44]];
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
  if (stairRepair) {applyFloors(doc); buildKitchenette(doc);}
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
        if (prim.getMaterial()?.getName() !== cut.malzeme || !prim.getIndices()) continue;
        const pos = prim.getAttribute('POSITION'), idx = prim.getIndices(), v = [0, 0, 0], keep = [];
        const inBox = i => {pos.getElement(i, v); const q = [w[0]*v[0]+w[4]*v[1]+w[8]*v[2]+w[12], w[1]*v[0]+w[5]*v[1]+w[9]*v[2]+w[13], w[2]*v[0]+w[6]*v[1]+w[10]*v[2]+w[14]]; return q.every((c, k) => c >= cut.min[k] && c <= cut.max[k]);};
        for (let t = 0; t < idx.getCount(); t += 3) {
          const ids = [idx.getScalar(t), idx.getScalar(t + 1), idx.getScalar(t + 2)];
          if (ids.every(inBox)) removed++; else keep.push(...ids);
        }
        prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(keep)).setBuffer(buffer));
      }
    }
    console.log(`mobilya: eski '${cut.malzeme}' ${removed} üçgen silindi (${cut.not ?? ''})`);
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
    const th = (part.yon ?? 0) * Math.PI / 180, s = src.scale, c = Math.cos(th), sn = Math.sin(th);
    // M = T(x,y,z) * R_y(th) * S(s) * T(-pivot)
    const m = [c * s, 0, -sn * s, 0, 0, s, 0, 0, sn * s, 0, c * s, 0, 0, 0, 0, 1];
    const tp = [-pivot[0] * s, -pivot[1] * s, -pivot[2] * s];
    m[12] = x + c * tp[0] + sn * tp[2]; m[13] = y + tp[1]; m[14] = z - sn * tp[0] + c * tp[2];
    const node = doc.createNode('MOBILYA_' + part.ad).setMesh(doc.createMesh('MOBILYA_' + part.ad).addPrimitive(prim)).setMatrix(m).setExtras({kat: floorOf(y)});
    scene.addChild(node);
    const w = [(mx[0] - mn[0]) * s, (mx[1] - mn[1]) * s, (mx[2] - mn[2]) * s];
    console.log(`mobilya: ${part.ad} (${chosen.length} parça) ${w.map(v => v.toFixed(2)).join(' x ')} m @ (${x}, ${y.toFixed(3)}, ${z}) ${part.yon ?? 0}°`);
  }
  for (const {prim} of Object.values(sources)) {const mesh = prim.listParents().find(p => p.propertyType === 'Mesh'); prim.dispose(); mesh?.dispose();}
}

// --- BUILDING ----------------------------------------------------------------
{
  const doc = await load([path.join(SRC, 'BUILDING-opt-v6-alt.glb'), path.join(SRC, 'BUILDING-opt-v6-ust.glb')], {stairRepair: true});
  const before = box(doc);
  await doc.transform(dedup(), flatten(), join({keepNamed: false}), prune({keepAttributes: false}),
    textureCompress({encoder: sharp, resize: [MAX_EDGE, MAX_EDGE]}));
  splitPrimitives(doc);
  const spec = lightmapUV(doc);
  const after = box(doc);
  const drift = Math.max(...before.min.map((v, i) => Math.abs(v - after.min[i])), ...before.max.map((v, i) => Math.abs(v - after.max[i])));
  if (drift > 0.002) throw Error(`BUILDING: sınır kutusu kaydı ${drift} m`);
  console.log('BUILDING kutu', fmt(after), `kayma ${drift.toExponential(1)} m`);
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

// --- INTERIOR (mobilya; lightmap almaz, pişirmede gölge verir) ----------------
{
  const doc = await load([path.join(SRC, 'INTERIOR-opt-v3.glb')]);
  await addFurniture(doc);
  await doc.transform(dedup(), prune({keepAttributes: false}), textureCompress({encoder: sharp, resize: [MAX_EDGE, MAX_EDGE]}), unpartition());
  await io.write(path.join(BAKE, 'INTERIOR-opt-v3-sahne.glb'), doc);
  await writeWeb(doc, path.join(DIR, 'INTERIOR-opt-v3.glb'));
}
for (const f of ['BUILDING-opt-v6-lm.glb', 'INTERIOR-opt-v3-sahne.glb'])
  console.log('pişirme', f, `${(statSync(path.join(BAKE, f)).size / 1e6).toFixed(1)} MB`);
