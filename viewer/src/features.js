// FAZ 1 feature flags (upgrade plan, Bölüm 4). Every render-path change of
// the quality upgrade sits behind one of these; with a flag OFF the pipeline
// must behave byte-for-byte as it did before the change landed. The address
// bar can flip any flag for A/B: ?features=hybridSunShadow:0,ktx2Delivery:1.
//
// Flags flip to true only in the task that ships their behavior, after the
// task's own measurement - never in bulk.
export const DEFAULT_FEATURES = Object.freeze({
  hybridSunShadow: true,       // T1.2 - masaüstü tier'ları; iPhone 13'te KAPALI (mobileSunShadow, H1)
  mobileSunShadow: false,      // Task 1.2 - phones join ONLY after H1 measures the ratchet green
  exteriorGradeRevival: true,  // T1.3+İŞ A - 37 batched materyalin 8'i (sayım testte); iki tier'da da canlı
  // Task 1.4 is SHELVED (BLOCKED H8): the shell walls are two skins, the
  // context additions are mirrored copies whose winding build.mjs never
  // corrects, and the honest fix needs a Draco re-encode this environment
  // must not do. The delivery ships authored double-sided; the valve stays
  // inert until H8 reopens the task.
  singleSided: true,           // inert - no patched GLBs ship; 0 still forces DoubleSide back
  viewCulling: false,          // hiding planting seen through walk glazing is a quality call, deferred
  plantsChunking: true,        // pure culling win: shared attributes, off-screen cells only
  cameraRigsV2: true,          // T1.5 - iki tier'da da canlı
  gardenSpotStrip: true,       // T1.6 - iki tier'da da canlı
  atlasAnisotropyFix: true,    // T1.6 - iki tier'da da canlı
  postfxV2: true,              // T1.1b - masaüstü tier'ları SADECE; mobil matris satırı postProcessing:false
  pixelBudgetV2: true,         // MALZEME İŞ 3.3 - matris bütçeleri canlı: balanced 3.5M (legacy 5M'di), mobil 1.5M aynı
  probeMassing: true,          // T3.4f - iki tier'da da canlı (tek seferlik probe yeniden kurulumu)
  poolWaterV2: true,           // T3.5 - iki tier'da da canlı (analitik dalga, saat-fazlı)
  glassTiersV2: true,          // T3.5/İŞ E.1 - iki tier; hücre-bazlı polish (gül+buzlu cam korunur, testte). 3.5'teki hali ÖLÜydü (angoraAuthoredPBR 37/37); doğrulama faz6-final C10 diff
  bakedAoRevival: true,        // T3.4d - masaüstü SADECE (main.js tier şartı); telefon WebP AO'da
  atlasArrayV2: true,          // T3.3 runtime - iki tier'da da canlı; 512/1024 hücre H6'da
  gzipSceneJson: true,         // T2.1-b - iki tier'da da canlı (.gz + düz dosya fallback)
  proceduralDetailV1: true,    // İŞ B - main.js tier şartıyla masaüstü SADECE; mobil eski byte'larda (H1). Doğrulama faz6-final
  proceduralDetailInterior: true, // İŞ D - iç uDetail satırları (yarı genlik); proceduralDetail üzerinden masaüstü SADECE
  runtimeVertexAO: true,       // İŞ C - İKİ tier (IS-EMRI: "mobilde de çalışan tek AO"; kare başı maliyet 0 draw/byte, bake boşta; mobil 10 ışın). H1 veto edebilir
  exteriorGtao: true,          // İŞ F - neighborhood'da GTAO, masaüstü SADECE (mobil matris postProcessing:false); region ASLA
  plantNormalsV1: true,        // İŞ E.2 - iki tier; RAM-içi normal düzeltme, bake attestasyonuna dokunmaz (testte)
  buildingsChunking: true,     // T2.2 runtime - iki tier'da da canlı
  plantVariation: true,        // T2.3 runtime - iki tier'da da canlı
  authoredMaterialsV2: false,  // Faz 3
  progressiveLoaderV2: true,   // T2.1 - iki tier'da da canlı (interior defer + tembel kat probe'ları)
  progressiveContextV1: false, // KAPALI - ürün sahibi: sahne açıldıktan ~5 sn sonra mahallenin belirmesi kabul edilemez. 13,6 MB kazanç pop etkisine değmiyor; erteleme yerine kaynak tarafı LOD/instancing (H6) beklenecek.
  ktx2Delivery: false,         // Faz 4.1
  contextLodV2: false,         // Faz 2
  cinemaStill: false,         // KAPALI - boşta birikim siyahtan başlıyor ve her girdide sıfırlanıyor; ürün sahibi siyah ekran bildirdi. İlerlemeli rafinasyon çözülmüş kareden başlayacak şekilde yeniden yazılana kadar kapalı.
  // -- FAZ 7 (FAZ-7-MASAUSTU.md): masaüstü V-Ray. Hepsi İKİ masaüstü
  //    tier'ına birden; mobil satırlar YAPISAL olarak dokunulmaz (quality
  //    profile'daki !mobile guard'ı + testler). Ürün sahibi kararı (2026-09-23):
  //    FAZ 7 bayrakları KAPALI ship - kod hazır, ?features= ile açılır;
  //    gerçek tarayıcı değerlendirmesi bekleniyor. FAZ 6 bayrakları AÇIK.
  // AYDINLIK (ürün sahibi: "çok puslu, fazla gotik" - emlak görseli
  // YÜKSEK ANAHTAR ister). İŞ 1-5 tek bayrak: sis neighborhood'dan çıkar,
  // gök 0.85, kararma terimleri hafifler + min-birleşir, grade sıcak ve
  // düşük kontrast, açılış saati 13:30. ?features=warmGradeV1:1 ile A/B.
  warmGradeV1: false,
  gradeAnyGridV1: true,        // MALZEME İŞ 2 - grid şartı kalktı: hücre-bazlı gerçek dokular (çim/asfalt dünya-uzayı, komşu çatıları villa kiremidiyle aynı ölçek, cephe kum albedosu). Kapatmak: ?features=gradeAnyGridV1:0
  screenSpaceReflection: false, // İŞ 1 - SSR geçişi (postfx); havuz HARİÇ (poolWaterV2 kendi yansımasını sürer); planarPoolReflection 0.5'e eşitlenir
  softShadowsV2: false,        // İŞ 2 - PCSS (blocker search + değişken PCF) + iki masaüstü satırında 4096 harita
  windowPortalLight: false,    // İŞ 3 - pencere alan ışığı (glazing setinden konum/normal, gök rengi, oda başına <=2)
  proceduralDetailHigh: false, // İŞ 4 - 4 oktav + genlik çarpanı (albedo 1.5x, roughness 2x); proceduralDetailV1 üstüne masaüstü katmanı
  gtaoFullRes: false,          // İŞ 5 - gtaoResolutionScale 1.0 iki masaüstü satırında
  materialResponseV2: false,   // İŞ 6 - clearcoat (cilalı taş/ahşap/seramik) + sheen (kumaş) aile bazlı, masaüstü
  cinemaDof: false,            // İŞ 7 - cinemaStill birikiminde apertür yürüyüşü (gerçek DOF); balanced'ı sinemaya katar
});

// '?features=a:0,b:1' - unknown names are ignored so a stale link cannot
// invent a switch; values are strictly 0/1.
export function resolveFeatures(search = '', defaults = DEFAULT_FEATURES) {
  const value = {...defaults};
  const raw = new URLSearchParams(search).get('features');
  if (!raw) return Object.freeze(value);
  for (const entry of raw.split(',')) {
    const [name, state] = entry.split(':');
    if (name in value && (state === '0' || state === '1')) value[name] = state === '1';
  }
  return Object.freeze(value);
}

export const FEATURES = resolveFeatures(typeof location === 'undefined' ? '' : location.search);
