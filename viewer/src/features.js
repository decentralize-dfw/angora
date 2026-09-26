// FAZ 1 feature flags (upgrade plan, Bölüm 4). Every render-path change of
// the quality upgrade sits behind one of these; with a flag OFF the pipeline
// must behave byte-for-byte as it did before the change landed. The address
// bar can flip any flag for A/B: ?features=hybridSunShadow:0,ktx2Delivery:1.
//
// Flags flip to true only in the task that ships their behavior, after the
// task's own measurement - never in bulk.
export const DEFAULT_FEATURES = Object.freeze({
  hybridSunShadow: true,       // T1.2 - masaüstü tier'ları; iPhone 13'te KAPALI (mobileSunShadow, H1)
  mobileSunShadow: true,       // KAPANIŞ İŞ 2.4: 512 harita, villa-local, olay bazlı depth pass. Ürün sahibi telefonda bakar; akıcı değilse bu tek bayrak kapatır (?features=mobileSunShadow:0)
  exteriorGradeRevival: true,  // T1.3+İŞ A - 37 batched materyalin 8'i (sayım testte); iki tier'da da canlı
  // Task 1.4 is SHELVED (BLOCKED H8): the shell walls are two skins, the
  // context additions are mirrored copies whose winding build.mjs never
  // corrects, and the honest fix needs a Draco re-encode this environment
  // must not do. The delivery ships authored double-sided; the valve stays
  // inert until H8 reopens the task.
  singleSided: true,           // inert - no patched GLBs ship; 0 still forces DoubleSide back
  viewCulling: false,          // hiding planting seen through walk glazing is a quality call, deferred
  mobileGeometryRelease: true, // MOBİL BELLEK: yüklemeden SONRA CPU'daki vertex dizilerini bırak (ölçüm: 207,6 MiB tutuluyordu, JS heap 334,9 MiB -> iPhone sekmeyi öldürüyor). Görüntü DEĞİŞMEZ. Kapatmak: ?features=mobileGeometryRelease:0
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
  cinemaStill: false,          // KAPALI - ürün sahibi masaüstünde İKİNCİ kez siyah ekran bildirdi: "hareket ettirince gözüküyor, durunca siyah oluyor". Boştaki birikim devreye girince ekran kararıyor. KAPANIŞ İŞ 3'teki "örnek 0 = çözülmüş kare" düzeltmesi gerçek GPU'da TUTMUYOR; yazılım rasterizerde (SwiftShader) hata üretilemedi, o yüzden kör düzeltme yapılmadı. Siyah ekran, rafine boşta karesinden pahalı: özellik kapalı ship ediliyor. Açmak: ?features=cinemaStill:1
  // -- FAZ 7 (FAZ-7-MASAUSTU.md): masaüstü V-Ray. Hepsi İKİ masaüstü
  //    tier'ına birden; mobil satırlar YAPISAL olarak dokunulmaz (quality
  //    profile'daki !mobile guard'ı + testler). Ürün sahibi kararı (2026-09-23):
  //    FAZ 7 bayrakları KAPALI ship - kod hazır, ?features= ile açılır;
  //    gerçek tarayıcı değerlendirmesi bekleniyor. FAZ 6 bayrakları AÇIK.
  // AYDINLIK (ürün sahibi: "çok puslu, fazla gotik" - emlak görseli
  // YÜKSEK ANAHTAR ister). İŞ 1-5 tek bayrak: sis neighborhood'dan çıkar,
  // gök 0.85, kararma terimleri hafifler + min-birleşir, grade sıcak ve
  // düşük kontrast, açılış saati 13:30. ?features=warmGradeV1:1 ile A/B.
  warmGradeV1: true,           // AÇIK - ürün sahibi pusu defalarca bildirdi ve aydınlık sürümü tercih etti: sis yakın çevreden kalkar, gök 0.85, kararma terimleri düşer, grade gölgeleri kaldırıp orta tonları ısıtır, açılış 13:30. Eski hal: ?features=warmGradeV1:0
  gradeAnyGridV1: true,        // MALZEME İŞ 2 - grid şartı kalktı: hücre-bazlı gerçek dokular (çim/asfalt dünya-uzayı, komşu çatıları villa kiremidiyle aynı ölçek, cephe kum albedosu). Kapatmak: ?features=gradeAnyGridV1:0
  screenSpaceReflection: true, // AÇIK (ölçüldü: prog -4, draw +1, tri +1, konsol 0, cinemaStill kapalıyken); ucuzlatıldı: 12 adım / 10 m. Havuz HARİÇ; planarPoolReflection 0.5
  softShadowsV2: true,         // AÇIK (ölçüldü: prog -1, draw/tri/tex +0, konsol 0). PCSS 17+25=42 gölge örneği/piksel (statik sayım; eski PCF 9)
  windowPortalLight: true,     // AÇIK (ölçüldü C10: prog +34 - LTC derlemesi; draw +0, tri +0, tex +0, konsol 0). İç mekânın en büyük görsel kazancı
  proceduralDetailHigh: true,  // AÇIK (ölçüldü: prog -1, geri kalan +0, konsol 0; ALU statik 210 skaler op - masaüstünde tavan yok, ölç-ve-yaz)
  gtaoFullRes: false,          // KAPALI-GEREKÇELİ: 4x GTAO pikseli; daha önce açılıp geri alındı (görünmeyen fark, MALZEME 3.2) ve bu turda da draw/prog etkisi sıfırken piksel maliyeti FPS'siz savunulamaz
  materialResponseV2: true,    // AÇIK (ölçüldü: prog -5, draw/tri/tex +0, konsol 0) - clearcoat/sheen aile bazlı, masaüstü
  cinemaDof: false,            // KAPALI - cinemaStill'e bağlı (onun birikiminde apertür yürür); o kapalıyken zaten ölü, ayrıca desktop-balanced'ı da sinema yoluna sokuyordu. Birlikte açılır: ?features=cinemaStill:1,cinemaDof:1
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
