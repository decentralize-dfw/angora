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
  villaModelV3: true,          // 26.09.2026 yüklemesi: ürün sahibinin kendi malzeme yazarlığını yaptığı BUILDING-opt-v3 / GARDEN-opt-v2 / INTERIOR-opt-v2. Manifest'te ÜÇ parçanın dosyası değişir, eskiler silinmez; kapatınca teslimat bire bir eskiye döner: ?features=villaModelV3:0
  bootYieldV1: true,           // MOBİL İŞ 3: boşta yükseltmeler (grade revive / atlas dizileri / hücre aileleri) mobilde ilk etkileşime kadar bekler (8 sn emniyet) ve kare bütçesiyle dilim dilim koşar - 30 shader derlemesi tek karede olmaz, kart hemen tıklanabilir. Kapatmak: ?features=bootYieldV1:0
  villaModelV3Mobile: true,    // MOBİL İŞ 1+2: aynı üç model telefonda 256 px ETC1S KTX2 kopyalarıyla (26092026/mobile/, doku-VRAM 369 -> 3,5 MiB). Yalnız mobil profili etkiler; kapatınca telefon eski batched teslimata döner: ?features=villaModelV3Mobile:0
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
  contactAoMobile: false,      // KAPALI - ürün sahibinin kararı: "model de AO yok ki zaten, modelin içinde; olsa bile mobilde fazlalık, desktopda açık kalsın". ÖLÇÜM bunu destekliyor: temas AO'su boot SONRASI 55,8 sn donmanın 18,5 sn'si (buildOccupancy 2,7 M üçgeni TEK blokta tarıyor, pişirme yalnız mesh sınırında dilimli, en büyük tek mesh 484 k tepe x 10 ışın). Modelin kendisi AO taşıyor: BUILDING-opt-v3'te 3 malzemede occlusionTexture var. MASAÜSTÜ DEĞİŞMEDİ (runtimeVertexAO orada açık). Telefonda denemek: ?features=contactAoMobile:1
  exteriorGtao: false,         // 29.09 KAPALI: yakın çevrenin geniş çerçevesinde bütün sahneye bulanık hale basıyordu (ürün sahibi ?features=exteriorGtao:0 ile doğruladı).          // İŞ F - neighborhood'da GTAO, masaüstü SADECE (mobil matris postProcessing:false); region ASLA
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
  screenSpaceReflection: true, // V-RAY B2 (04.10): AÇIK - yalnız parlak zeminlerde (normal geçişinin alfa kanalı = parlaklık maskesi: parke, seramik, mozaik; mat sıva 0). 27.09'daki kapatma sebebi (mat sıvaya koyu yansıma) maskeyle giderildi. Yalnız masaüstü post zinciri. Kapatmak: ?features=screenSpaceReflection:0
  softShadowsV2: true,         // AÇIK (ölçüldü: prog -1, draw/tri/tex +0, konsol 0). PCSS 17+25=42 gölge örneği/piksel (statik sayım; eski PCF 9)
  windowPortalLight: false, // KAPALI (27.09): 17 pencere alan ışığı villa katına girişte yeni modelin HER malzemesine 17 LTC döngüsü ekliyordu -> kat açılırken dev shader derlemesi (villaya tıklayınca kilit). Açmak: ?features=windowPortalLight:1
  proceduralDetailHigh: true,  // AÇIK (ölçüldü: prog -1, geri kalan +0, konsol 0; ALU statik 210 skaler op - masaüstünde tavan yok, ölç-ve-yaz)
  gtaoFullRes: false,          // KAPALI-GEREKÇELİ: 4x GTAO pikseli; daha önce açılıp geri alındı (görünmeyen fark, MALZEME 3.2) ve bu turda da draw/prog etkisi sıfırken piksel maliyeti FPS'siz savunulamaz
  materialResponseV2: true,    // AÇIK (ölçüldü: prog -5, draw/tri/tex +0, konsol 0) - clearcoat/sheen aile bazlı, masaüstü
  cinemaDof: false,            // KAPALI - cinemaStill'e bağlı (onun birikiminde apertür yürür); o kapalıyken zaten ölü, ayrıca desktop-balanced'ı da sinema yoluna sokuyordu. Birlikte açılır: ?features=cinemaStill:1,cinemaDof:1
  // ADIM 1 - TAKILMA (27.09.2026). Her biri tek başına geri alınabilir.
  villaGlassAlpha: true,       // Yeni villa setinin camı/havuz suyu/dolap camı KHR_materials_transmission taşıyor -> three her karede tüm opak sahneyi ikinci kez çiziyordu. Eski yol bunu hep alfa camına çeviriyordu, yeni yol çevirmiyordu. Kıyas: ?features=villaGlassAlpha:0
  villaFixtureStrip: true,     // Yeni (batched olmayan) bahçe malzemeleri 8 iç mekân spot döngüsünü her pikselde hesaplıyordu; bahçe dışarıda, o lambaları göremez. Kıyas: ?features=villaFixtureStrip:0
  contactAoDesktop: false,     // Masaüstünde de KAPALI: 2,7 M üçgeni tek blokta tarayıp ardından toplu yeniden derleme yapıyordu ("villanın içinde takılıyor"); yeni modeller kendi AO'sunu taşıyor. Kıyas: ?features=contactAoDesktop:1
  contextV2: true,             // 27.09 çevre: ürün sahibinin KOMSULAR-opt-v2 (düz mat beyaz cephe) + CEVRE-YOL-opt-v2 (zemin/yol; eski mahalle ağaçları çıkar). Eski çevre: ?features=contextV2:0
  terrainNormalsV3: true,     // 28.09 zemin v3: çim/asfaltta 3 m alan-ağırlıklı arazi normali (make-context-v3.mjs). Çimdeki koyu kıymık/kamalar gölge değil normaldi - gölge atanlar kapatılınca da duruyordu. Eski zemin: ?features=terrainNormalsV3:0
  neighbourLines: true,       // 28.09 villa modu (dış görünüm + katlar): komşu evler yalnız ince %60 siyah kenar çizgisi, gölge atmaz; dolaşırken gerçek hâlleri. Eski: ?features=neighbourLines:0
  walkSkyV1: true,            // 28.09 yürürken gökyüzü: mavi eğim + hafif fbm bulut, güneş halesi (walk-sky.js); tek seferlik 512 küp, kare maliyeti yok. Eski: ?features=walkSkyV1:0
  ekler: false,               // 28.09 EKLER.glb: fotoğraflarda olup modelde olmayan detaylar (perde, korniş, aplik, tablo, halı; tools/blender/06_ekler.py). Ürün sahibi bakana kadar kapalı: ?features=ekler:1
  tur10: true,                // Son Tur 10 geometrisi, tüm profillerde 512 px KTX2.
  lightmaps: true,            // Tur 10: 20 pişmiş ışık haritası, 512 px doğrusal KTX2.
  trueNorth: true,            // 28.09 ÖLÇÜLDÜ ve ürün sahibi onayladı: model gerçek kuzeye göre 164,25° dönük (komşu ev izleri OSM ile çakıştırıldı); güneş gerçek yönden gelir. Işık pişirme (docs/blender-ajan) aynı yönle yapılır. Eski yön: ?features=trueNorth:0
  daylightV2: true,            // ADIM 2 - IŞIK: co-online/edetri reçetesi şehir ölçeğine uyarlandı. ACES eğrisi (0.8), nötr grade (siyah kaldırma/amber/ek doygunluk yok), güçlü güneş + zayıf ve koyu tabanlı ortam ışığı, dış karede tam GTAO. Eski ışık: ?features=daylightV2:0
  neutralTone: false,          // V-RAY C2 (03.10): Khronos PBR Neutral ton eğrisi - malzeme renkleri katalogdaki gibi, ACES'in doygunluk/kontrast itmesi yok. Pozlama 1.1 (orta gri ACES 0.8 ile aynı). Ürün sahibi A/B yapana kadar kapalı: ?features=neutralTone:1
  parquetGloss: false,        // 04.10: cilalı parke - oda sondası + düşük pürüzlülük + güçlü SSR. ?features=parquetGloss:1
  interiorExposure: true,     // 04.10: göz uyumu oda kameralarında da (kamera binanın içinde). ?features=interiorExposure:1
  woodTone: true,             // 04.10: koyu ceviz dokulu ahşaplar fotoğraftaki bal-kiraz tonuna. ?features=woodTone:1
  interiorGrade: true,        // 04.10: iç mekân rengi ilan fotoğraflarına göre (sıcak, doygun, yumuşak). ?features=interiorGrade:1
  pathTraceStill: false,      // V-RAY E (03.10): boşta ışın izleme, masaüstü, kamera binanın içinde. ?features=pathTraceStill:1
  roomProbeAll: true,         // 03.10: Tur 10 iç mekân malzemelerinin tamamı oda sondasıyla (dış gök yerine). Eski: ?features=roomProbeAll:0
  textures1k: false,          // 03.10: masaüstü renk dokuları 1024 (512 yerine) - ktx1k/. Eski: ?features=textures1k:0
  neighbourAo: true,           // V-RAY D2 (04.10, yalnız masaüstü): komşu evlerde pişmiş köşe AO'su (saçak altı, pencere girintisi, evler arası) - KOMSULAR-opt-v2-ao. Eski: ?features=neighbourAo:0
  boxProbes: true,            // V-RAY B1 (04.10): oda sondası kutu izdüşümüyle (paralaks düzeltmeli) örneklenir - parke/metal/cam yansıması bakışla kaymaz. Kapatmak: ?features=boxProbes:0
  autoExposure: true,          // V-RAY C3 (03.10): göz uyumu - kare ortalama parlaklığı 32x18 ölçüm hedefinden (async okuma, kare durmaz) okunur, pozlama 0,6 sn'de ±1 EV içinde uyarlanır; gece aydınlatmaz. Yalnız masaüstü post zinciri. Kapatmak: ?features=autoExposure:0
  mobileIdleUpgrades: false,   // Telefonda komşu bina doku/atlas yükseltmeleri KAPALI: ilk dokunuşa bağlı toplu yeniden derleme = açılış sonrası kilit. Masaüstü etkilenmez. Denemek: ?features=mobileIdleUpgrades:1
  programPrelink: false,       // KAPALI (27.09): açıkken villaya tıklamada masaüstü Chrome 'Sayfa yanıt vermiyor' verdi - ürün sahibi bildirdi. Kata giriş ve açılışta shader'lar yükleme göstergesi ARKASINDA gerçekten bağlanır (Safari paralel derleme yapmaz; compileAsync orada bağlamayı ilk çizime bırakıyordu) ve kat derlemesi pencere ışıkları açıldıktan SONRA yapılır. Denemek: ?features=programPrelink:1
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
