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

// Manifest'i YERİNDE değiştirir ve değiştirilen parça adlarını döndürür.
// gpu_sha256 temizlenir: o hash eski dosyanın içeriğiydi, yenisinde
// tutmaz ve acquire onu ?v= olarak yazdığı için yanlış bir önbellek
// anahtarı üretirdi. bytes ilerleme çubuğunun ağırlığı, gerçek boyut yazılır.
export function applyVillaModelV3(manifest) {
  if (!manifest?.parts || !manifest.batched) return [];
  const swapped = [];
  for (const part of manifest.parts) {
    const next = VILLA_MODEL_V3[part.name];
    if (!next) continue;
    part.file = ROOT + next.file;
    part.bytes = next.bytes;
    delete part.gpu_sha256;
    swapped.push(part.name);
  }
  return swapped;
}
