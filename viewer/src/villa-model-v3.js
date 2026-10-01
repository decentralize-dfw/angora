import * as THREE from 'three';
// Ürün sahibinin kendi malzeme yazarlığını yaptığı yeni villa modelleri
// (build/web/26092026/, 26 Eylül 2026 yüklemesi). Eskiler SİLİNMİYOR: bu
// sadece manifest'teki üç parçanın dosya adını değiştiriyor, yani bayrak
// kapatılınca teslimat bire bir eski hâline dönüyor.
//
//   architecture -> BUILDING-opt-v3.glb   25 malzeme /  673 006 üçgen
//   garden       -> GARDEN-opt-v2.glb     12 malzeme /  355 921 üçgen
//   interior     -> INTERIOR-opt-v2.glb   21 malzeme /  384 993 üçgen
//
// Dünya koordinatları ölçüldü ve birbirleriyle tutarlı (interior tam binanın
// içinde oturuyor), mevcut sahnenin merkeziyle uyumlu:
//   BUILDING X -9,0..7,6   Y -0,5..14,4  Z -10,9..10,1
//   GARDEN   X -9,6..26,7  Y -7,6..6,2   Z -29,1..10,3
//   INTERIOR X -7,6..7,3   Y -0,1..12,2  Z -8,9..5,6
//
// Bu dosyalar BATCHED DEĞİL: `angoraBatch` verisi taşımıyorlar. Bu kasıtlı -
// atlas/hücre-grade/dış-cephe-grade yolları `angoraBatch` olmayan malzemeyi
// atladığı için ürün sahibinin yazdığı malzemelerin ÜSTÜNE YAZILMIYOR.
// restoreBatchSurface da batch verisi olmayan malzemeyi olduğu gibi döndürür.
//
// Uzantılar (üçünde de three destekli): BUILDING/GARDEN Draco + EXT_texture_webp,
// INTERIOR EXT_meshopt_compression + KHR_mesh_quantization + EXT_texture_webp.
// Yükleyici üçünü de kurulu tutuyor (setDRACOLoader / setMeshoptDecoder; webp ve
// quantization three'nin kendi desteği).

// Manifest kökü build/web/batched/<profil>/ olduğu için iki seviye yukarı.
const ROOT = '../../26092026/';

export const VILLA_MODEL_V3 = Object.freeze({
  // 27.09: v4 = v3 + ürün sahibinin asansör kapısı (Simple wood) ve Simple
  // White Wall'a katılan merdiven altı (tools/batch-delivery/make-building-v4.mjs).
  architecture: {file: 'BUILDING-opt-v4.glb', bytes: 5999548},
  garden:       {file: 'GARDEN-opt-v2.glb',   bytes: 7071908},
  interior:     {file: 'INTERIOR-opt-v2.glb', bytes: 4770284},
});

// MOBİL İŞ EMRİ İŞ 1+2: aynı üç model, dokuları 256 px ETC1S KTX2'ye
// indirilmiş kopyalar (tools/batch-delivery/make-mobile-ktx2.mjs üretir,
// kaynaklara dokunmaz). Ölçüm: üç modelin doku-VRAM'i 369 -> 3,5 MiB;
// malzeme grafiği ve geometri sıkıştırması (draco/meshopt) aynı.
export const VILLA_MODEL_V3_MOBILE = Object.freeze({
  architecture: {file: 'mobile/BUILDING-opt-v4.ktx2.glb', bytes: 3694708},
  garden:       {file: 'mobile/GARDEN-opt-v2.ktx2.glb',   bytes: 4947588},
  interior:     {file: 'mobile/INTERIOR-opt-v2.ktx2.glb', bytes: 4229468},
});


// Manifest'i YERİNDE değiştirir ve değiştirilen parça adlarını döndürür.
// gpu_sha256 temizlenir: o hash eski dosyanın içeriğiydi, yenisinde
// tutmaz ve acquire onu ?v= olarak yazdığı için yanlış bir önbellek
// anahtarı üretirdi. bytes ilerleme çubuğunun ağırlığı, gerçek boyut yazılır.
export function applyVillaModelV3(manifest, {mobile = false} = {}) {
  if (!manifest?.parts || !manifest.batched) return [];
  const table = mobile ? VILLA_MODEL_V3_MOBILE : VILLA_MODEL_V3;
  const swapped = [];
  for (const part of manifest.parts) {
    const next = table[part.name];
    if (!next) continue;
    part.file = ROOT + next.file;
    part.bytes = next.bytes;
    delete part.gpu_sha256;
    swapped.push(part.name);
  }
  return swapped;
}

// 29.09 TUR 10: fotoğraflardan yeniden modellenmiş kabuk ve iç mekân
// (tools/batch-delivery/make-tur10-web.mjs; kaynak: modelleme dalı
// teslim-tur10/web). Masaüstü ve telefon: 512 px KTX2, aynı geometri ve UV. Eski
// dosyalar silinmez, bayrak kapatılınca v4/v2'ye döner.
export const TUR10_MODELS = Object.freeze({
  "architecture": {
    "file": "ktx512/BUILDING-opt-v6.ktx2.glb",
    "bytes": 12606448
  },
  "interior": {
    "file": "ktx512/INTERIOR-opt-v3.ktx2.glb",
    "bytes": 10405884
  },
  "garden": {
    "file": "ktx512/GARDEN-opt-v3.ktx2.glb",
    "bytes": 9040736
  }
});
// Telefon: aynı geometri (ışık UV'si birebir), dokular 512 px ETC1S (make-mobile-tur10.mjs).
// UASTC'ye göre indirme 32 -> 17 MB, telefonda doku çözme çok daha hızlı.
export const TUR10_MODELS_MOBILE = Object.freeze({
  architecture: {file: 'mobile-tur10/BUILDING-opt-v6.ktx2.glb', bytes: 6555184},
  interior:     {file: 'mobile-tur10/INTERIOR-opt-v3.ktx2.glb', bytes: 4290096},
  garden:       {file: 'mobile-tur10/GARDEN-opt-v3.ktx2.glb', bytes: 5837528},
});
export function applyTur10(manifest, {mobile = false} = {}) {
  if (!manifest?.parts || !manifest.batched) return [];
  const table = mobile ? TUR10_MODELS_MOBILE : TUR10_MODELS;
  const swapped = [];
  for (const part of manifest.parts) {
    const next = table[part.name];
    if (!next) continue;
    part.file = ROOT + next.file; part.bytes = next.bytes; delete part.gpu_sha256;
    swapped.push(part.name);
  }
  // Yürüme ızgarası Tur 10 geometrisinden (tools/batch-delivery/make-tur10-navigation.mjs):
  // eskisi değişen merdivenleri ve duvarları bilmiyor, bodrum merdiveninde takılınıyordu.
  if (swapped.length && typeof manifest.navigation === 'string') {
    manifest.navigation = ROOT + 'tur10-navigation.json';
    swapped.push('navigation');
  }
  return swapped;
}

// Tur 10 ekleri (EK_ malzemeleri: süpürgelik, kartonpiyer, merdiven altı
// kaplaması, eşik, kasa) eski yüzeylerin 3 mm yakınına, aynı yöne bakarak
// oturuyor (tools/batch-delivery/audit-overlap.mjs ölçtü: ~40 m²). Derinlik
// eşitliğinde yeni parça öne çizilir - titreyen yama olmaz. Eski modelde
// EK_ malzemesi yok, dokunulmaz.
export function settleTur10Overlays(model) {
  const materials = new Set();
  model.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) if (m && /^EK_/.test(m.name)) materials.add(m); });
  for (const m of materials) { m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -4; }
  return materials.size;
}

// "Procedural Wood" (asansörün ceviz kapısı) Blender'da prosedürel dokuyla
// yazılmış; glTF prosedürel düğüm taşıyamadığı için dosyada dokusuz ve
// renksiz - yani BEYAZ - geliyor. Aynı modelin kendi koyu ahşap malzemesinin
// dokuları ödünç verilir; rengi tahmin edilmez, modelde zaten olan ahşap
// kullanılır. Dokusu olan bir malzemeye dokunulmaz.
export function repairUntexturedWood(model) {
  const materials = new Set();
  model.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) if (m) materials.add(m); });
  const donor = [...materials].find(m => /^WOODY-DARK/i.test(m.name) && m.map)
    ?? [...materials].find(m => /wood/i.test(m.name) && m.map);
  if (!donor) return 0;
  let repaired = 0;
  for (const m of materials) {
    if (!/^Procedural Wood/i.test(m.name) || m.map) continue;
    m.map = donor.map; m.normalMap = donor.normalMap ?? null; m.roughnessMap = donor.roughnessMap ?? null;
    if (donor.normalMap) m.normalScale.copy(donor.normalScale);
    m.color.set(0xffffff); m.roughness = donor.roughness; m.metalness = 0;
    m.needsUpdate = true; repaired++;
  }
  return repaired;
}

// 27.09 ÇEVRE v2 (tools/batch-delivery/make-context-v2.mjs) - villadan AYRI,
// kendi bayrağıyla (contextV2): komşular düz mat beyaz cepheyle, zemin+yol
// ürün sahibinin yeni modeli. Yeni zeminde arsa ve kenar ağaçları yok; eski
// mahalle ağaçları parçası (context-plants) teslimattan çıkar.
export const CONTEXT_V2 = Object.freeze({
  'context-buildings': {file: 'ktx512/KOMSULAR-opt-v2.ktx2.glb', bytes: 9732452},
  'context-ground':    {file: 'CEVRE-YOL-opt-v2.glb', bytes: 932092},
});
export const CONTEXT_V2_MOBILE = Object.freeze({
  'context-buildings': {file: 'mobile-tur10/KOMSULAR-opt-v2.ktx2.glb', bytes: 9525084},
  'context-ground':    {file: 'mobile/CEVRE-YOL-opt-v2.ktx2.glb', bytes: 864772},
});
// 28.09 zemin v3 (tools/batch-delivery/make-context-v3.mjs): aynı geometri,
// çim ve asfaltta 3 m alan-ağırlıklı "arazi normali". Çimdeki koyu
// kıymıklar gölge değil, dik ince şeritlerin yan bakan normaliydi.
export const CONTEXT_GROUND_V3 = Object.freeze({file: 'ktx512/CEVRE-YOL-opt-v3.ktx2.glb', bytes: 1991564});
export const CONTEXT_GROUND_V3_MOBILE = Object.freeze({file: 'mobile-tur10/CEVRE-YOL-opt-v3.ktx2.glb', bytes: 974784});
const CONTEXT_V2_DROPPED = ['context-plants'];
export function applyContextV2(manifest, {mobile = false, groundV3 = false} = {}) {
  if (!manifest?.parts || !manifest.batched) return [];
  const table = {...(mobile ? CONTEXT_V2_MOBILE : CONTEXT_V2)};
  if (groundV3) table['context-ground'] = mobile ? CONTEXT_GROUND_V3_MOBILE : CONTEXT_GROUND_V3;
  const changed = [];
  for (const part of manifest.parts) {
    const next = table[part.name];
    if (!next) continue;
    part.file = ROOT + next.file; part.bytes = next.bytes; delete part.gpu_sha256;
    changed.push(part.name);
  }
  const before = manifest.parts.length;
  manifest.parts = manifest.parts.filter(part => !CONTEXT_V2_DROPPED.includes(part.name));
  if (manifest.parts.length !== before) changed.push(...CONTEXT_V2_DROPPED.map(name => '-' + name));
  return changed;
}

// Ürün sahibinin kesit işaretleri (01.10): modelde olup olmaması gereken yüzler.
// Çatı holündeki dormer geçidini kapatan eğik tavan şeridi (ceiling.001, x 0..4,17,
// z -2,33..-1,73, normal ≈ (-0,57,-0,82,0)) planda geçidin ortasında çizgi gibi
// görünüyordu. Yüz yalnız eşleşen üçgenler indeksten çıkarılarak kaldırılır; ışık
// UV'si ve diğer yüzler değişmez (yeniden pişirme gerekmez).
const TUR10_DROP = [
  // (01.10 geri alındı: çatı holündeki eğik tavan şeridi kaldırılınca tavanda siyah yarık açıldı -
  //  çizgi kesitte görünse de yüz gerçek tavanın parçası. Yalnız kesit taramasında gizlenmeli.)
  // 01.10 antre: WC seramiğinin antre yüzündeki ikinci katmanı (x 2,97; öndeki x 2,94 beyaza çevrilir)
  {mat: /^R31 \| R33 ivory wall ceramic$/, min: [2.955, 3.2, 0.25], max: [2.985, 6.0, 1.6], normal: [1, 0, 0]},
];
// Yanlış malzemeli yüzler: üçgenler kaynak mesh'ten ayrılıp hedef malzemenin bir kopyasıyla ayrı
// mesh'e taşınır. Işık UV'si (TEXCOORD_1) ve atlas aynı kalır; o yüzlerin ışık haritası
// tools/batch-delivery/lightmap-aktar.py ile hedef yüzeyden aktarıldı. yMax: üstünde aynı düzlemde
// hedef malzemenin kendi yüzü varsa üçgen o yükseklikte kırpılır (üst üste binip titreşmesin).
//   antre (01.10, ekran görüntüsü 115): girişteki WC'nin seramiği duvarın antre yüzüne de basılmış:
//   make-tur10-web.mjs RETILE kutusu (x 2,78..4,13) WC duvarının DIŞ yüzlerini de seramiğe çevirdi. Görünen
//   üç yüz: radyatörün arkası (x 2,938, z 0,32..1,51), yanındaki pah (x 2,655..2,939, z 1,509..1,793, normal
//   (-0,71,0,-0,71): üst üçgeni seramik, alt üçgeni beyaz -> asıl "kama") ve WC kapısının hol tarafındaki
//   üstü (x 2,69..3,29, y 5,2..5,89). `away`: WC'nin içindeki bir nokta (x, z); kutudaki dik üçgenlerden ona
//   BAKMAYANLAR taşınır (WC'nin kendi seramiği ona bakar). yMax kullanılmaz: panelin üstündeki beyaz üçgen
//   panelle yalnız eğik kenarı paylaşıyor (üst üste binmiyor); y 5,2'de kırpmak 0,4 m²'lik delik açıp
//   arkadaki WC seramiğini (LM_zemin_005, x 3,098) gösteriyordu.
const TUR10_RETILE = [
  {mat: /^R31 \| R33 ivory wall ceramic$/, min: [2.6, 3.0, 0.3], max: [4.2, 6.0, 2.6], away: [3.6, 1.5], to: /^Simple White Wall$/},
];
export function retileTur10(model) {
  model.updateMatrixWorld(true);
  const materials = new Map(), jobs = [];
  model.traverse(o => { if (o.isMesh && !Array.isArray(o.material)) materials.set(o.material.name, o.material); });
  model.traverse(o => {
    if (!o.isMesh || Array.isArray(o.material) || !o.geometry?.index) return;
    for (const rule of TUR10_RETILE) if (rule.mat.test(o.material.name ?? '')) jobs.push([o, rule]);
  });
  let moved = 0;
  for (const [o, rule] of jobs) {
    const target = [...materials].find(([name]) => rule.to.test(name ?? ''))?.[1];
    if (!target) continue;
    const g = o.geometry, pos = g.attributes.position, idx = g.index, names = Object.keys(g.attributes);
    const want = new THREE.Vector3(...(rule.normal ?? [0, 0, 0])), n = new THREE.Vector3(), keep = [], take = [];
    const world = i => new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
    for (let t = 0; t < idx.count; t += 3) {
      const ids = [idx.getX(t), idx.getX(t + 1), idx.getX(t + 2)], w = ids.map(world);
      n.subVectors(w[1], w[0]).cross(w[2].clone().sub(w[0])).normalize();
      const inside = w.every(v => v.x >= rule.min[0] && v.x <= rule.max[0] && v.y >= rule.min[1] && v.y <= rule.max[1] && v.z >= rule.min[2] && v.z <= rule.max[2]);
      const cx = (w[0].x + w[1].x + w[2].x) / 3, cz = (w[0].z + w[1].z + w[2].z) / 3;
      const match = rule.away ? Math.abs(n.y) < 0.3 && n.x * (rule.away[0] - cx) + n.z * (rule.away[1] - cz) < 0 : Math.abs(n.dot(want)) > 0.98;
      if (inside && match) take.push(ids); else keep.push(...ids);
    }
    if (!take.length) continue;
    // köşe: dünya konumu (kırpma için) + bütün öznitelikler (normalize/nicelenmiş olanlar açılarak)
    const vertex = i => ({w: world(i), a: names.map(k => { const at = g.attributes[k]; return [at.getX(i), at.getY(i), at.getZ(i), at.getW(i)].slice(0, at.itemSize); })});
    const lerp = (p, q, s) => ({w: p.w.clone().lerp(q.w, s), a: p.a.map((v, k) => v.map((x, c) => x + (q.a[k][c] - x) * s))});
    const out = names.map(() => []);
    for (const ids of take) {
      let poly = ids.map(vertex);
      if (rule.yMax !== undefined) {
        const clipped = [];
        poly.forEach((p, k) => {
          const q = poly[(k + 1) % poly.length], pin = p.w.y <= rule.yMax, qin = q.w.y <= rule.yMax;
          if (pin) clipped.push(p);
          if (pin !== qin) clipped.push(lerp(p, q, (rule.yMax - p.w.y) / (q.w.y - p.w.y)));
        });
        poly = clipped;
      }
      for (let k = 1; k + 1 < poly.length; k++) for (const v of [poly[0], poly[k], poly[k + 1]]) v.a.forEach((x, j) => out[j].push(...x));
    }
    const geometry = new THREE.BufferGeometry();
    names.forEach((k, j) => geometry.setAttribute(k, new THREE.Float32BufferAttribute(out[j], g.attributes[k].itemSize)));
    const material = target.clone();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = o.name + '_yeni_yuz';
    mesh.userData = JSON.parse(JSON.stringify(o.userData));
    mesh.position.copy(o.position); mesh.quaternion.copy(o.quaternion); mesh.scale.copy(o.scale);
    mesh.castShadow = o.castShadow; mesh.receiveShadow = o.receiveShadow;
    o.parent.add(mesh);
    g.setIndex(keep);
    moved += take.length;
  }
  return moved;
}
// Salon/yemek (01.10 denetim): pişirmeden önce duvarın İÇİNE çevrilmiş görünen yüzler. tur10-yon.mjs
// söveler için karar veremedi (söve oda poligonunun dışında; ışın testini pencere kasası ve içi boş duvar
// gövdesi yanılttı). Cycles onları duvarın içinden pişirdi (5 haritanın hepsi <=13/255) ve normal duvarın
// içine baktığı için canlı güneşin gölge araması da (normalBias) duvarın içine kayıyor. Pencere sövelerinin
// çoğu köşegenle ikiye bölünmüş: Simple White Wall yarısı doğru, Stucco yarısı ters -> perdenin yanında kara
// üçgen; sağ sövelerde iki yarı da ters. Kolon hizasındaki asansör nişinin doğu yüzü (x -1,212): 1,74 m²
// kara üçgen. Ters üçgen kaynağından çıkarılır, görünen yana çevrilir (sarılma + normal) ve ışık UV'si aynı
// söve/yüzün doğru pişmiş Simple White Wall üçgeninden aktarılır (yoksa açıklığın öbür sövesinden, ortaya
// göre yansıtılarak); malzeme ve atlas vericinin (duvar). Asıl çözüm: make-tur10-web.mjs force + pişirme.
const jambs = (axis, s0, s1, depth, height) => {
  const box = s => axis === 'x' ? {min: [s - 0.012, height[0], depth[0]], max: [s + 0.012, height[1], depth[1]]}
    : {min: [depth[0], height[0], s - 0.012], max: [depth[1], height[1], s + 0.012]};
  const dir = sign => axis === 'x' ? [sign, 0, 0] : [0, 0, sign];
  const mirror = {axis, at: (s0 + s1) / 2};
  return [{...box(s0), want: dir(1), partner: {...box(s1), want: dir(-1), mirror}},
          {...box(s1), want: dir(-1), partner: {...box(s0), want: dir(1), mirror}}];
};
const TUR10_RELIGHT = [
  ...jambs('x', -4.242, -3.041, [-8.30, -8.04], [3.3, 5.0]),   // salon güney penceresi (perdenin yanı)
  ...jambs('x', -1.586, -0.387, [-8.30, -8.04], [3.0, 5.0]),   // salon balkon kapısı
  ...jambs('x', 1.088, 2.288, [-8.30, -8.04], [3.3, 5.0]),     // salon doğu penceresi
  ...jambs('z', -2.927, -1.127, [-5.85, -5.59], [3.6, 5.3]),   // yemek alanı batı penceresi (Salon_fon perdeleri)
  {min: [-1.222, 3.0, -1.72], max: [-1.205, 5.95, -0.19], want: [-1, 0, 0]},   // asansör nişi doğu yüzü
];
const RELIGHT_MATS = /^(Simple White Wall|Stucco painted wall)$/;
export function relightTur10(model) {
  model.updateMatrixWorld(true);
  const lit = [];
  model.traverse(o => { if (o.isMesh && !Array.isArray(o.material) && o.geometry?.index && o.userData?.lightmap && RELIGHT_MATS.test(o.material.name ?? '')) lit.push(o); });
  if (!lit.some(o => /^LM_(duvar|cephe)_\d{3}$/.test(o.name))) return 0;   // yalnız Tur 10 kabuğu
  const v = () => new THREE.Vector3();
  const inBox = (p, r) => p.x >= r.min[0] && p.x <= r.max[0] && p.y >= r.min[1] && p.y <= r.max[1] && p.z >= r.min[2] && p.z <= r.max[2];
  const all = lit.flatMap(o => {
    const pos = o.geometry.attributes.position, idx = o.geometry.index, out = [];
    for (let t = 0; t < idx.count; t += 3) {
      const i = [idx.getX(t), idx.getX(t + 1), idx.getX(t + 2)], p = i.map(k => v().fromBufferAttribute(pos, k).applyMatrix4(o.matrixWorld));
      out.push({o, t, i, p, n: v().subVectors(p[1], p[0]).cross(v().subVectors(p[2], p[0])).normalize()});
    }
    return out;
  });
  const facing = (tr, r, sign) => tr.p.every(p => inBox(p, r)) && tr.n.dot(v().fromArray(r.want)) * sign > 0.9;
  const reflect = (p, mir) => mir ? p.clone().setComponent(mir.axis === 'x' ? 0 : 2, 2 * mir.at - p.getComponent(mir.axis === 'x' ? 0 : 2)) : p;
  const groups = new Map(), drop = new Map();
  const tri = new THREE.Triangle(), cp = v(), bc = v(), uvs = [new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2()];
  let relit = 0;
  for (const r of TUR10_RELIGHT) {
    const bad = all.filter(tr => facing(tr, r, -1));
    if (!bad.length) continue;
    // verici: aynı kutuda doğru bakan duvar üçgenleri; yoksa ortağın (açıklığın öbür sövesi) yansıyanı
    let donors = all.filter(tr => tr.o.material.name === 'Simple White Wall' && facing(tr, r, 1)), mir = null;
    if (!donors.length && r.partner) { donors = all.filter(tr => tr.o.material.name === 'Simple White Wall' && facing(tr, r.partner, 1)); mir = r.partner.mirror; }
    if (!donors.length) continue;
    for (const tr of bad) {
      const q = tr.p.map(p => reflect(p, mir));
      const c = v().add(q[0]).add(q[1]).add(q[2]).divideScalar(3);
      // tek verici üçgen (UV adaları karışmasın): ağırlık merkezine en yakın, eşitse büyük olan
      let best = null, bestD = Infinity;
      for (const d of donors) {
        tri.set(...d.p); const dist = tri.closestPointToPoint(c, cp).distanceTo(c) - tri.getArea() * 1e-3;
        if (dist < bestD) { bestD = dist; best = d; }
      }
      const uv1 = best.o.geometry.attributes.uv1;
      best.i.forEach((k, j) => uvs[j].fromBufferAttribute(uv1, k));
      tri.set(...best.p);
      // köşegenle bölünmüş dörtgen: ortak iki köşe aynen, üçüncü köşe vericinin üçüncü köşesine (tam yansıma)
      const same = q.map(p => best.p.findIndex(d => d.distanceTo(p) < 2e-3));
      const free = [0, 1, 2].find(j => !same.includes(j));
      const uvAt = (p, j) => {
        if (same[j] >= 0) return uvs[same[j]].clone();
        if (same.filter(s => s >= 0).length === 2) return uvs[free].clone();
        tri.closestPointToPoint(p, cp); tri.getBarycoord(cp, bc);
        return new THREE.Vector2().addScaledVector(uvs[0], bc.x).addScaledVector(uvs[1], bc.y).addScaledVector(uvs[2], bc.z);
      };
      const order = tr.n.dot(v().fromArray(r.want)) < 0 ? [0, 2, 1] : [0, 1, 2];   // sarılma görünen yana
      const out = groups.get(best.o) ?? groups.set(best.o, {pos: [], nor: [], uv1: []}).get(best.o);
      for (const j of order) { out.pos.push(...tr.p[j].toArray()); out.nor.push(...r.want); out.uv1.push(...uvAt(q[j], j).toArray()); }
      (drop.get(tr.o) ?? drop.set(tr.o, new Set()).get(tr.o)).add(tr.t);
      relit++;
    }
  }
  const inv = new THREE.Matrix4().copy(model.matrixWorld).invert();
  for (const [donor, d] of groups) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(d.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(d.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(d.pos.length / 3 * 2), 2));
    g.setAttribute('uv1', new THREE.Float32BufferAttribute(d.uv1, 2));
    g.applyMatrix4(inv);
    const part = new THREE.Mesh(g, donor.material);   // aynı malzeme örneği ve atlas (duvar)
    part.name = donor.name + '_ters_onarim'; part.userData = JSON.parse(JSON.stringify(donor.userData));
    part.castShadow = donor.castShadow; part.receiveShadow = donor.receiveShadow;
    model.add(part);
  }
  for (const [o, dead] of drop) {   // kaynaktan çıkar; kalan üçgenlerin indeks/UV'si aynen
    const idx = o.geometry.index, keep = [];
    for (let t = 0; t < idx.count; t += 3) if (!dead.has(t)) keep.push(idx.getX(t), idx.getX(t + 1), idx.getX(t + 2));
    o.geometry.setIndex(keep);
  }
  return relit;
}
export function dropTur10Faces(model) {
  model.updateMatrixWorld(true);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  let dropped = 0;
  // 01.10: modelde garaj kapısı zaten var (tepede toplanmış); derlemenin eklediği ikinci kapı ve rayları gizlenir.
  model.traverse(o => { if (o.isMesh && /^EK_garaj_(kapisi|ray)/.test([].concat(o.material)[0]?.name ?? '')) { o.visible = false; dropped++; } });
  model.traverse(o => {
    if (!o.isMesh || Array.isArray(o.material) || !o.geometry?.index) return;
    const rules = TUR10_DROP.filter(r => r.mat.test(o.material?.name ?? ''));
    if (!rules.length) return;
    const pos = o.geometry.attributes.position, idx = o.geometry.index, keep = [];
    for (let t = 0; t < idx.count; t += 3) {
      const ia = idx.getX(t), ib = idx.getX(t + 1), ic = idx.getX(t + 2);
      a.fromBufferAttribute(pos, ia).applyMatrix4(o.matrixWorld); b.fromBufferAttribute(pos, ib).applyMatrix4(o.matrixWorld); c.fromBufferAttribute(pos, ic).applyMatrix4(o.matrixWorld);
      n.subVectors(b, a).cross(c.clone().sub(a)).normalize();
      const hit = rules.some(r => [a, b, c].every(v => v.x >= r.min[0] && v.x <= r.max[0] && v.y >= r.min[1] && v.y <= r.max[1] && v.z >= r.min[2] && v.z <= r.max[2])
        && Math.abs(Math.abs(n.dot(new THREE.Vector3(...r.normal))) - 1) < 0.02);
      if (hit) { dropped++; continue; }
      keep.push(ia, ib, ic);
    }
    if (keep.length !== idx.count) o.geometry.setIndex(keep);
  });
  return dropped + fixTur10Stair(model) + dropTur10Parts(model);
}

// 01.10 giriş -> 1. kat merdiveni (ürün sahibinin salondan/antreden ekran görüntüsü). Kollar:
// K1_0 x 0,62..3,17 z -3,13..-2,13 (3,10 -> 4,82), sahanlık x 3,17..4,17, K1_1 z -1,93..-0,93
// (x 3,17'de 4,82 -> x 0,87'de 6,37); K2_0 (1. kat -> çatı) K1_0'ın üstünde x 0,87'den kalkar.
// Giriş tavanının altı y 5,891, 1. kat döşemesinin kenarı x 0,869.
//  * Çıkıntı: kaynağın 1. kat döşeme burnu (EK_wood_floor.001_giris, WOOD-FL kutu x 0,869..1,169
//    y 5,971..6,292 z -3,128..-2,127) ve giriş tavanının taşan plakası (EK_ceiling .001_giris,
//    x 0,844..1,080 y 5,891..5,971) K2_0'ın dibinde merdiven boşluğuna 21-30 cm sarkıyordu.
//    Kutu atılır, plaka x 0,872'ye çekilir, K2_0'ın alt yüzü tavan altından (5,891) başlar.
//  * Çentik: K1_1'in alt yüzü üst uçta 6,121'de bitiyordu; tavan altı 5,891 olduğu için x 0,87..1,25
//    arasında 23 cm'lik kamada döşemenin parke kenarı görünüyordu. Üst uç 5,891'e iner.
//  * Ceviz çubuklar: addHandrails RANSAC'ının iki ayrı lamayı tek doğru sandığı 5 kutu (kollar
//    arası dikine çubuk, iki sahanlık dönüşü, K1_1 dış küpeştesinin 12-20 cm altında yanlış
//    eğimli ikinci çubuk, galeri köşesinde planda çapraz çubuk). Özgün küpeşte INTERIOR'da var.
//  * Galeri boşluğunun kenarları (x 0,219 / z 0,392 / z -0,927, y 5,971..6,292) parke dokuluydu
//    (salondan bakınca alt yüzün tavana değdiği yerde koyu bant): aynı ışık UV'siyle tavan malzemesine.
// Yalnız konum taşınır / üçgen indeksten çıkar / üçgen kardeş mesh'e geçer; TEXCOORD_1 değişmez.
const TUR10_STAIR_MOVES = [
  {mat: /^EK_M2_Beyaz_merdiven_alti$/, at: [0.872, 6.121], zs: [-0.927, -1.927], to: {y: 5.891}}, // K1_1 alt yüz üst ucu
  {mat: /^EK_M2_Beyaz_merdiven_alti$/, at: [0.872, 6.251], zs: [-2.127, -3.127], to: {y: 5.891}}, // K2_0 alt yüz başı
  {mat: /^ceiling\.001$/, min: [1.06, 5.885, -3.135], max: [1.09, 5.976, -2.12], to: {x: 0.872}},  // taşan tavan plakası
  // Merdiven boşluğunun güney duvarı (çift kabuk z -3,097 / -3,127) tavan altı ile döşeme arasında (y 5,892..6,291)
  // x 1,079'da bitiyordu; aradaki açığı plakanın z -3,127 ucu ile döşeme burnu örtüyordu. Plaka çekilince K2_0'ın
  // yeni alt yüzünün altında (x 0,872..1,079, y 5,891..6,05) salonun üstündeki döşeme boşluğuna açılan üçgen delik
  // kalıyordu: duvarın iki kabuğu ile uç kapağı x 0,872'ye uzar (8 üçgen, köşe taşınır, ışık UV'si aynı).
  {mat: /^Simple White Wall$/, min: [1.065, 5.885, -3.135], max: [1.095, 6.300, -3.090], to: {x: 0.872}},
];
const TUR10_BAD_RAILS = [
  [[1.722, 4.481, -2.184], [2.046, 6.413, -1.890]], // kollar arası 20 cm boşlukta dikine çubuk (1,98 m)
  [[2.880, 4.702, -2.085], [2.760, 5.200, -1.895]], // giriş -> 1. kat sahanlık dönüşü
  [[2.775, 8.447, -2.209], [2.313, 9.523, -1.874]], // 1. kat -> çatı sahanlık dönüşü
  [[2.007, 6.375, -0.957], [0.160, 7.276, -0.967]], // K1_1 dış küpeştesinin altında, eğim 0,49 (merdiven 0,67)
  [[0.910, 7.080, -1.000], [0.174, 7.281, 0.461]],  // galeri köşesi, planda çapraz
];
function fixTur10Stair(model) {
  let marker = false;
  model.traverse(o => { if (o.isMesh && /^EK_M2_Beyaz_merdiven_alti$/.test([].concat(o.material)[0]?.name ?? '')) marker = true; });
  if (!marker) return 0; // yalnız Tur 10 binası
  const v = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const n = new THREE.Vector3(), e = new THREE.Vector3(), inv = new THREE.Matrix4();
  const near = (x, y) => Math.abs(x - y) <= 0.005;
  const inBox = (p, lo, hi) => p.x >= lo[0] && p.x <= hi[0] && p.y >= lo[1] && p.y <= hi[1] && p.z >= lo[2] && p.z <= hi[2];
  const onPlane = (tri, k, v) => tri.every(p => Math.abs(p[k] - v) < 0.004);
  const rails = TUR10_BAD_RAILS.map(([p, q]) => {const s = new THREE.Vector3(...p), u = new THREE.Vector3(...q).sub(s), L = u.length(); return {s, u: u.divideScalar(L), L};});
  const onRail = tri => rails.some(({s, u, L}) => {
    const k = Math.abs(n.dot(u)); if (k > 0.03 && k < 0.995) return false; // kutu yüzü: eksene dik ya da paralel
    return tri.every(p => {e.subVectors(p, s); const t = e.dot(u); return t > -0.045 && t < L + 0.045 && e.addScaledVector(u, -t).length() < 0.058;});
  });
  let ceiling = null;
  model.traverse(o => { if (!ceiling && o.isMesh && !Array.isArray(o.material) && o.material?.name === 'ceiling.001' && o.userData?.lightmap?.atlas === 'zemin') ceiling = o.material; });
  let count = 0; const extra = [];
  model.traverse(o => {
    if (!o.isMesh || Array.isArray(o.material) || !o.geometry?.index) return;
    const name = o.material?.name ?? '', g = o.geometry, pos = g.attributes.position;
    const moves = TUR10_STAIR_MOVES.filter(m => m.mat.test(name));
    if (moves.length) {
      inv.copy(o.matrixWorld).invert(); let k = 0;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
        const m = moves.find(m => (m.at ? near(v.x, m.at[0]) && near(v.y, m.at[1]) && m.zs.some(z => near(v.z, z)) : inBox(v, m.min, m.max)));
        if (!m) continue;
        if (m.to.x !== undefined) v.x = m.to.x;
        if (m.to.y !== undefined) v.y = m.to.y;
        v.applyMatrix4(inv); pos.setXYZ(i, v.x, v.y, v.z); k++;
      }
      if (k) { pos.needsUpdate = true; g.computeBoundingBox(); g.computeBoundingSphere(); count += k; }
    }
    const walnut = name === 'EK_M1_Sicak_ceviz_supurgelik', parquet = name === 'WOOD-FL';
    if (!walnut && !parquet) return;
    const idx = g.index, keep = [], white = [];
    for (let t = 0; t < idx.count; t += 3) {
      const ia = idx.getX(t), ib = idx.getX(t + 1), ic = idx.getX(t + 2);
      a.fromBufferAttribute(pos, ia).applyMatrix4(o.matrixWorld); b.fromBufferAttribute(pos, ib).applyMatrix4(o.matrixWorld); c.fromBufferAttribute(pos, ic).applyMatrix4(o.matrixWorld);
      n.subVectors(b, a).cross(e.subVectors(c, a));
      if (n.lengthSq() < 1e-18) { keep.push(ia, ib, ic); continue; }
      n.normalize(); const tri = [a, b, c];
      if (walnut && onRail(tri)) { count++; continue; }
      if (parquet && tri.every(p => inBox(p, [0.865, 5.965, -3.135], [1.175, 6.300, -2.120])) && Math.max(a.x, b.x, c.x) > 0.875) { count++; continue; }
      // Tavan malzemesine geçenler: galeri kenarının üç düzlemi (x 0,219 / z 0,392 / z -0,927) üstteki 6,291..6,371
      // şeridi dahil bütünüyle (yalnız alt 32 cm'i çevrilince salondan bakınca tavan çizgisinde ince koyu hat kalıyordu);
      // döşeme kenarı x 0,869 (kollar arası boşluğun ucunda görünür) ve o uçta tavan altındaki 10 x 20 cm cebin tabanı.
      if (parquet && ceiling && ((Math.abs(n.y) < 0.1 && tri.every(p => inBox(p, [0.215, 5.965, -2.131], [2.945, 6.375, 0.396]))
          && (onPlane(tri, 'x', 0.219) || onPlane(tri, 'z', 0.392) || (onPlane(tri, 'z', -0.927) && Math.max(a.x, b.x, c.x) <= 0.871)
            || (onPlane(tri, 'x', 0.869) && Math.max(a.y, b.y, c.y) <= 6.300)))
        || (n.y < -0.99 && tri.every(p => inBox(p, [0.765, 5.965, -2.131], [0.873, 5.975, -1.923]))))) { white.push(ia, ib, ic); count++; continue; }
      keep.push(ia, ib, ic);
    }
    if (keep.length === idx.count) return;
    g.setIndex(keep);
    if (!white.length) return;
    const g2 = new THREE.BufferGeometry();
    for (const [key, attr] of Object.entries(g.attributes)) g2.setAttribute(key, attr); // aynı öznitelikler (TEXCOORD_1 dahil)
    g2.setIndex(white); g2.computeBoundingSphere();
    const edge = new THREE.Mesh(g2, ceiling);
    edge.name = o.name + '_galeri_kenari'; edge.userData = {...o.userData}; // extras.lightmap: aynı zemin atlası
    edge.position.copy(o.position); edge.quaternion.copy(o.quaternion); edge.scale.copy(o.scale);
    edge.castShadow = o.castShadow; edge.receiveShadow = o.receiveShadow;
    extra.push([o.parent, edge]);
  });
  for (const [parent, edge] of extra) parent.add(edge);
  return count;
}


// 01.10 giriş salonu / yemek alanı (ürün sahibi işareti; fotoğraf 04/23: düz tavan, kolon başında
// tek kartonpiyer halkası). Seçim BAĞLI PARÇA ile: konumları 0,1 mm'de kaynaşan üçgen kümesinin
// dünya sınır kutusu 'kutu' ile her yönde 6 mm içinde örtüşürse kümenin bütün üçgenleri indeksten
// çıkar. 'bolge' verilirse küme yalnız tamamı o kutuda kalan üçgenlerden kurulur (parça daha büyük
// bir kümeye bağlıysa). Köşe dizileri ve ışık UV'si (TEXCOORD_1) değişmez: yeniden pişirme gerekmez.
const TUR10_DROP_PARTS = [
  // Salon tavanını dolaşan üç ince WHT.001 boru (LM_zemin_019, 398/404/383 üçgen, tavanın 5-13 cm
  // altında): duvar boyunca kartonpiyerin içinden dışarı taşıyor, yemek tarafında (z -3,39) P1 kolonu
  // ile merdiven duvarı ucu arasında havada asılı -> "kirişin üstündeki koyu çizgi".
  {mat: /^WHT\.001$/, kutu: [[-4.966, 5.761, -7.982], [3.024, 5.787, -3.392]]},
  {mat: /^WHT\.001$/, kutu: [[-4.994, 5.783, -8.008], [3.050, 5.817, -3.365]]},
  {mat: /^WHT\.001$/, kutu: [[-4.988, 5.813, -8.024], [3.066, 5.839, -3.369]]},
  // aynı üç boru 1. kat oturma alanında da var (tavanın altında, x -4,99..0,07, z -8,02..-4,07)
  {mat: /^WHT\.001$/, kutu: [[-4.966, 8.860, -7.982], [0.024, 8.886, -4.112]]},
  {mat: /^WHT\.001$/, kutu: [[-4.994, 8.882, -8.009], [0.051, 8.915, -4.086]]},
  {mat: /^WHT\.001$/, kutu: [[-4.988, 8.912, -8.024], [0.066, 8.938, -4.070]]},
  // P1 kolonu (x -1,212..-0,951, z -3,758..-3,097) 3 cm'lik çift kabuk: kartonpiyer üreticisi iç
  // kabuğa da (z -3,728 / -3,127) birer şerit koymuş; dış halkanın (106 üçgen) 3 cm içinden kayık
  // çıkıp köşe gönyelerinde taşıyor (beyaz eğik yüzler, uymayan köşeler). 46 + 47 üçgen.
  {mat: /^EK_M1_Beyaz_saten_alci$/, kutu: [[-1.325, 5.773, -3.840], [-0.839, 5.890, -3.728]]},
  {mat: /^EK_M1_Beyaz_saten_alci$/, kutu: [[-1.325, 5.773, -3.126], [-0.839, 5.890, -3.014]]},
  // Merdiven duvarının salon ucu (x 0,788): iç kabuğa (x 0,818) oturan ikinci uç başlığı, 38 üçgen.
  {mat: /^EK_M1_Beyaz_saten_alci$/, kutu: [[0.705, 5.773, -3.471], [0.817, 5.890, -3.128]],
    bolge: [[0.60, 5.70, -3.60], [0.95, 5.95, -2.95]]},
];
function dropTur10Parts(model) {
  const v = new THREE.Vector3();
  let dropped = 0;
  model.traverse(o => {
    if (!o.isMesh || Array.isArray(o.material) || !o.geometry?.index) return;
    const rules = TUR10_DROP_PARTS.filter(r => r.mat.test(o.material?.name ?? ''));
    if (!rules.length) return;
    const pos = o.geometry.attributes.position, idx = o.geometry.index, n = idx.count / 3;
    const W = new Float32Array(pos.count * 3), weld = new Int32Array(pos.count), keys = new Map();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); W[i * 3] = v.x; W[i * 3 + 1] = v.y; W[i * 3 + 2] = v.z;
      const k = `${Math.round(v.x * 1e4)},${Math.round(v.y * 1e4)},${Math.round(v.z * 1e4)}`;
      let q = keys.get(k); if (q === undefined) keys.set(k, q = keys.size); weld[i] = q;
    }
    const drop = new Uint8Array(n);
    // aynı 'bolge'yi paylaşan kurallar (çoğu: bölgesiz = bütün mesh) tek bir küme geçişi kullanır
    for (const g of new Set(rules.map(r => r.bolge))) {
      const inside = i => !g || [0, 1, 2].every(k => W[i * 3 + k] >= g[0][k] && W[i * 3 + k] <= g[1][k]);
      const par = Int32Array.from({length: keys.size}, (_, i) => i);
      const find = x => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
      const use = [];
      for (let t = 0; t < n; t++) {
        const i0 = idx.getX(t * 3), i1 = idx.getX(t * 3 + 1), i2 = idx.getX(t * 3 + 2);
        if (!inside(i0) || !inside(i1) || !inside(i2)) continue;
        use.push(t); const root = find(weld[i0]); par[find(weld[i1])] = root; par[find(weld[i2])] = root;
      }
      const box = new Map();
      for (const t of use) {
        const root = find(weld[idx.getX(t * 3)]);
        let bb = box.get(root); if (!bb) box.set(root, bb = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]);
        for (let j = 0; j < 3; j++) { const i = idx.getX(t * 3 + j); for (let k = 0; k < 3; k++) { bb[k] = Math.min(bb[k], W[i * 3 + k]); bb[k + 3] = Math.max(bb[k + 3], W[i * 3 + k]); } }
      }
      const hit = new Set();
      for (const [root, bb] of box) if (rules.some(r => r.bolge === g && [0, 1, 2].every(k => Math.abs(bb[k] - r.kutu[0][k]) < 0.006 && Math.abs(bb[k + 3] - r.kutu[1][k]) < 0.006))) hit.add(root);
      for (const t of use) if (hit.has(find(weld[idx.getX(t * 3)]))) drop[t] = 1;
    }
    const keep = [];
    for (let t = 0; t < n; t++) if (!drop[t]) keep.push(idx.getX(t * 3), idx.getX(t * 3 + 1), idx.getX(t * 3 + 2));
    if (keep.length !== idx.count) { dropped += n - keep.length / 3; o.geometry.setIndex(keep); }
  });
  return dropped;
}

// Perdeler (01.10): model-d1'de pencere yanlarına eklenen "fon" kopyaları 30 cm genişliğinde,
// 6 cm kalınlığında, ahşap malzemeli dikmelerdi - gezintide kahverengi çubuk gibi görünüyordu.
// Her biri yerinde, modelin kendi damask perde kumaşıyla, 55 cm genişliğinde kıvrımlı bir
// perde paneline çevrilir. Bodrum salonunun doğu penceresinde (x 1,1..2,3) perde yoktu: eklenir.
const TUR10_EXTRA_CURTAINS = [
  {x: [0.82, 1.38], y: [0.06, 2.52], z: -7.99},
  {x: [2.02, 2.58], y: [0.06, 2.52], z: -7.99},
];
// Kumaş dokusu ("Original damask curtain photograph") bir oda FOTOĞRAFI: perde fotoğrafın sol
// üstünde (u 0,09..0,17, satır 0,27..0,43). Panel yalnız o bölgeyi örnekler; boyda 3 kez aynalanarak
// (dikişsiz) tekrarlanır. Doku dönüşümü (KHR_texture_transform, v' = 1 - v) yüzünden v = 1 - satır.
const CURTAIN_UV = {u: [0.09, 0.17], row: [0.27, 0.43], tiles: 3};
function pleatedCurtain(axis, along, fixed, y0, y1, width) {
  const cols = 28, a0 = along - width / 2, amp = 0.035, folds = 5, rows = CURTAIN_UV.tiles;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= cols; i++) {
    const u = i / cols, s = a0 + u * width, off = amp * Math.sin(u * folds * 2 * Math.PI);
    for (let r = 0; r <= rows; r++) {
      const y = y1 - (y1 - y0) * r / rows, t = r % 2;      // üstten alta; t aynalı 0,1,0,1
      if (axis === 'x') pos.push(s, y, fixed + off); else pos.push(fixed + off, y, s);
      const row = CURTAIN_UV.row[0] + t * (CURTAIN_UV.row[1] - CURTAIN_UV.row[0]);
      uv.push(CURTAIN_UV.u[0] + u * (CURTAIN_UV.u[1] - CURTAIN_UV.u[0]), 1 - row);
    }
    if (i < cols) for (let r = 0; r < rows; r++) { const k = i * (rows + 1) + r, n = k + rows + 1; idx.push(k, n, k + 1, k + 1, n, n + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
export function rebuildTur10Curtains(model) {
  model.updateMatrixWorld(true);
  let fabric = null; const stubs = [];
  model.traverse(o => {
    if (!o.isMesh) return;
    const m = [].concat(o.material)[0];
    if (!fabric && /damask curtain/i.test(m?.name ?? '')) fabric = m;
    if (/^EK_D1_.*fon_\d/.test(o.name) || /^EK_D1_.*fon_\d/.test(o.parent?.name ?? '')) stubs.push(o);
  });
  if (!fabric || !stubs.length) return 0;
  const mat = fabric.clone(); mat.side = THREE.DoubleSide; mat.name = 'EK_perde_kumas';
  const box = new THREE.Box3(), size = new THREE.Vector3(), c = new THREE.Vector3();
  const place = g => { const mesh = new THREE.Mesh(g, mat); mesh.name = 'EK_perde_panel'; mesh.castShadow = true; mesh.receiveShadow = true; model.add(mesh); return mesh; };
  const inv = new THREE.Matrix4().copy(model.matrixWorld).invert();
  let made = 0;
  for (const o of stubs) {
    box.setFromObject(o); box.getSize(size); box.getCenter(c);
    const axis = size.x >= size.z ? 'x' : 'z';             // perde duvar boyunca uzanır
    const g = pleatedCurtain(axis, axis === 'x' ? c.x : c.z, axis === 'x' ? c.z : c.x, box.min.y, box.max.y, 0.55);
    g.applyMatrix4(inv); place(g); o.visible = false; made++;
  }
  for (const e of TUR10_EXTRA_CURTAINS) {
    const g = pleatedCurtain('x', (e.x[0] + e.x[1]) / 2, e.z, e.y[0], e.y[1], e.x[1] - e.x[0]);
    g.applyMatrix4(inv); place(g); made++;
  }
  return made;
}
