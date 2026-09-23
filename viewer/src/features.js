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
  pixelBudgetV2: false,        // matrix pixel budgets; off = legacy mobile 1.5M / desktop 5M, cap 2
  probeMassing: true,          // T3.4f - iki tier'da da canlı (tek seferlik probe yeniden kurulumu)
  poolWaterV2: true,           // T3.5 - iki tier'da da canlı (analitik dalga, saat-fazlı)
  glassTiersV2: false,         // T3.5/İŞ E.1 - bugüne dek ÖLÜydü (angoraAuthoredPBR 37/37 true); onarılmış hücre-bazlı hali faz6-e gate'iyle açılır
  bakedAoRevival: true,        // T3.4d - masaüstü SADECE (main.js tier şartı); telefon WebP AO'da
  atlasArrayV2: true,          // T3.3 runtime - iki tier'da da canlı; 512/1024 hücre H6'da
  gzipSceneJson: true,         // T2.1-b - iki tier'da da canlı (.gz + düz dosya fallback)
  proceduralDetailV1: false,   // FAZ 6 İŞ B - BÖLÜM 2.5: varsayılan false; gate ?features ile, yeşilse desktop açılır
  proceduralDetailInterior: false, // İŞ D - iç mekân uDetail satırları (yarı genlik); faz6-d gate'iyle, proceduralDetailV1 gerektirir
  runtimeVertexAO: false,      // İŞ C - gate ?features ile; masaüstü yeşilse açılır, iPhone 13 H1'e bağlı
  exteriorGtao: false,         // İŞ F (EK Bölüm 2) - neighborhood görünümünde GTAO; region'da ASLA, mobilde etkisiz (postProcessing:false)
  plantNormalsV1: false,       // İŞ E.2 - yaprak normal düzeltmesi (eski eşleşme ÖLÜydü); faz6-e gate'iyle açılır
  buildingsChunking: true,     // T2.2 runtime - iki tier'da da canlı
  plantVariation: true,        // T2.3 runtime - iki tier'da da canlı
  authoredMaterialsV2: false,  // Faz 3
  progressiveLoaderV2: true,   // T2.1 - iki tier'da da canlı (interior defer + tembel kat probe'ları)
  progressiveContextV1: false, // A7/T2.1 - context-buildings+plants boşta yüklenir (ilk interaktif -13.6/-9.3 MB); faz6-final ile açılır
  ktx2Delivery: false,         // Faz 4.1
  contextLodV2: false,         // Faz 2
  cinemaStill: true,           // FAZ 5 - YALNIZ desktop-high + postfx; telefonda ve walk'ta asla
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
