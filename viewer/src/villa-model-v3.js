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
export const TUR10_MODELS_MOBILE = TUR10_MODELS;
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
  'context-buildings': {file: 'ktx512/KOMSULAR-opt-v2.ktx2.glb', bytes: 9732452},
  'context-ground':    {file: 'mobile/CEVRE-YOL-opt-v2.ktx2.glb', bytes: 864772},
});
// 28.09 zemin v3 (tools/batch-delivery/make-context-v3.mjs): aynı geometri,
// çim ve asfaltta 3 m alan-ağırlıklı "arazi normali". Çimdeki koyu
// kıymıklar gölge değil, dik ince şeritlerin yan bakan normaliydi.
export const CONTEXT_GROUND_V3 = Object.freeze({file: 'ktx512/CEVRE-YOL-opt-v3.ktx2.glb', bytes: 1991564});
export const CONTEXT_GROUND_V3_MOBILE = Object.freeze({file: 'ktx512/CEVRE-YOL-opt-v3.ktx2.glb', bytes: 1991564});
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
