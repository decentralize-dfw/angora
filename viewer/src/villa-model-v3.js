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
  architecture: {file: 'BUILDING-opt-v3.glb', bytes: 5806572},
  garden:       {file: 'GARDEN-opt-v2.glb',   bytes: 7071908},
  interior:     {file: 'INTERIOR-opt-v2.glb', bytes: 4770284},
});

// MOBİL İŞ EMRİ İŞ 1+2: aynı üç model, dokuları 256 px ETC1S KTX2'ye
// indirilmiş kopyalar (tools/batch-delivery/make-mobile-ktx2.mjs üretir,
// kaynaklara dokunmaz). Ölçüm: üç modelin doku-VRAM'i 369 -> 3,5 MiB;
// malzeme grafiği ve geometri sıkıştırması (draco/meshopt) aynı.
export const VILLA_MODEL_V3_MOBILE = Object.freeze({
  architecture: {file: 'mobile/BUILDING-opt-v3.ktx2.glb', bytes: 3696484},
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
