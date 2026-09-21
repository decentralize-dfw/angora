// R46 | Two complete languages, one source of truth.
// Turkish is the property's own language; English serves international
// demonstrations. French/Italian slot in as further columns when verified
// translations exist - nothing here is structural to Turkish.
// Static DOM carries data-i18n / data-i18n-label attributes; dynamic code
// asks t(). Room names translate through ROOM_TERMS so drawing names stay
// the source of truth and only their language changes.
const STRINGS = {
  tr: {
    scaleRegion: 'Bölge', scaleStreet: 'Yakın çevre', scaleVilla: 'Villa',
    f0: 'Bodrum', f1: 'Giriş katı', f2: '1. kat', f3: 'Çatı katı',
    f0Short: 'Bodrum', f1Short: 'Giriş', f2Short: '1. kat', f3Short: 'Çatı',
    building: 'Villa 21', neighborhood: 'Yakın çevre', region: 'Bölge',
    buildingSub: 'Bahçe · Havuz · Villa', neighborhoodSub: 'Angora Evleri · Ankara',
    regionSub: 'Angora Evleri · Mutlukent, Ankara',
    cut130: '1,30 m kesit', cut160: '1,60 m kesit',
    walkSub: '360° oda turu',
    options: 'Görünüm', optionsTitle: 'Mobilya, ölçüler ve ışık',
    info: 'Mülk bilgisi', infoTitle: 'İlan bilgileri ve alanlar',
    floorInfo: 'Kat bilgisi', floorInfoShort: 'Kat', infoShort: 'Mülk',
    floorInfoTitle: 'Açık katın tanımı ve alanları', closeFloor: 'Kat bilgilerini kapat',
    optionsHeading: 'Görünüm', closeOptions: 'Ayarları kapat', closeInfo: 'Bilgileri kapat',
    furniture: 'Mobilya', roomNames: 'Oda adları', measurements: 'Ölçüler',
    photos: 'Fotoğraflar', closePhoto: 'Fotoğrafı kapat',
    daylight: 'Gün ışığı', light: 'Işık', lightSoft: 'Yumuşak gün ışığı', lightSun: 'Doğrudan güneş',
    interiorLights: 'İç ışıklar', soundOff: 'Arayüz sesi kapalı', soundOn: 'Arayüz sesi açık',
    solarNote: 'Yerel saat · Görsel gün ışığı çalışması; sertifikalı analiz değildir',
    cutLightNote: 'Kesit görünümündeki aydınlık gösterim amaçlıdır; kapalı hacim ışığı 360° turda görülür.',
    explore: 'İçeride gez', exitWalk: 'Kata dön',
    enterVR: 'VR’a gir', exitVR: 'VR’dan çık', retryVR: 'VR’a tekrar dene',
    roomTour: 'Oda turu', goRoom: 'Gezilecek oda', lens: 'Görüş açısı',
    lift: 'Asansör', liftHere: 'bu katta',
    walkHelp: 'Sürükle: 360° bak · Yerdeki noktalara dokun: ilerle',
    orbitHelp: 'Sürükle: döndür · İki parmak: kaydır / yakınlaştır',
    stairs: 'Merdiven', garden: 'Bahçe', terrace: 'Teras',
    plan: 'Plan', planTitle: 'Plan ve izometrik görünüm', recenter: 'Görünümü ortala',
    zoomIn: 'Yakınlaştır', zoomOut: 'Uzaklaştır', rotate: 'Sürükleyerek döndür', pan: 'Sürükleyerek kaydır',
    listing: 'Satış ilanını aç ↗', listingShort: 'İlan ↗',
    returnVilla: 'Villa 21’e yaklaş ↗', sitePlan: 'Vaziyet planı',
    radiusLabel: 'Harita yarıçapı', straightLine: 'kuş uçuşu',
    groupEdu: 'Eğitim', groupHealth: 'Sağlık', groupFood: 'Yeme içme',
    groupShop: 'Alışveriş', groupSport: 'Spor · Park', groupService: 'Hizmet',
    loading: 'Model yükleniyor…', loadingAll: 'Bütün model yükleniyor…', preparing: 'Görünümler hazırlanıyor…',
    stepModel: 'Model', stepLight: 'Işık', stepScene: 'Sahne', stepView: 'Görünüm',
    loadingData: 'Plan verileri okunuyor…', loadingModel: 'Model indiriliyor…',
    loadingLight: 'Işık ve yansımalar hazırlanıyor…', loadingScene: 'Sahne kuruluyor…',
    loadingView: 'Görünüm hazırlanıyor…',
    retry: 'Tekrar dene',
    loadFailed: 'Model yüklenemedi. Bağlantını kontrol edip tekrar deneyebilirsin.',
    contextLost: '3D grafik bağlantısı kesildi. Sayfayı yeniden açarak devam edebilirsin.',
    fallbackLead: '3D görünüm bu cihazda başlatılamadı. Mülkün doğrulanmış bilgileri yine buradadır:',
    welcomeExplore: 'Evi keşfet', welcomeTour: 'Rehberli tur', welcomeClose: 'Kapat',
    welcomeNote: 'Alanlar RE/MAX P56131836 ilanındandır',
    factGross: 'brüt', factNet: 'net', factRooms: 'oda', factFloors: 'kat',
    tourExterior: 'Villa ve arsa', tourLiving: 'Giriş katı: salon, mutfak, yemek',
    tourUpper: 'Üst kat: yatak odaları', tourGarden: 'Bahçe, teras ve havuz ilişkisi',
    tourInterior: 'Temsili iç mekân — sürükleyerek bakın', tourStreet: 'Yakın çevre',
    tourRegion: 'Bölge ve günlük ihtiyaçlar', tourEnd: 'Mülk bilgisi',
    tourNext: 'İleri', tourPrev: 'Geri', tourStop: 'Turu bitir',
    modelEstimate: 'model tahmini', listingSource: 'RE/MAX ilanı',
    liftCall: 'bu kata çağır', liftSend0: 'Bodrum katına gönder', liftSend1: 'Giriş katına gönder', liftSend2: '1. kata gönder',
    panHelp: 'Sürükle: kaydır · İki parmak: kaydır ve yakınlaştır',
    regionIntro: 'Ankara’nın batı yakasında, Hacettepe Beytepe kampüsünün yeşiline komşu, alçak yoğunluklu bir villa yerleşkesi. Planlı sokak dokusu ve olgun bahçeleri gündelik hayatı yerleşke içinde tutar; Eskişehir Yolu ve Bilkent bağlantısı kenti dakikalar uzağında bırakır.',
    lblPark: 'park', lblSchool: 'okul', lblMarket: 'market', lblPharmacy: 'eczane',
    distNote: 'Mesafeler kuş uçuşudur · Atlas: OSM',
    amenities: 'donatı', buildingsWord: 'yapı',
    piCoverage: 'Kaplama izdüşümü · model hesabı', piRoomsOnPlan: 'Plan üzerinde alan',
    piGross: 'Brüt alan · RE/MAX ilanı', piNet: 'Net alan · RE/MAX ilanı',
    piFeatures: 'Öne çıkanlar', piLocation: 'Konum',
    piFloors: 'Kat', piRooms: 'Oda · RE/MAX ilanı',
    piFloorNote: 'Kat değeri, kaynak modeldeki kaplama yüzeylerinin yatay izdüşümüdür; kot farkları dahil, çakışan yüzeyler tek sayılır. Kullanılabilir net alan veya tapu alanı değildir. Oda sınırları ayrı doğrulanmadan oda m² değeri gösterilmez.',
    piListingNote: 'İlan alanları RE/MAX P56131836 kaynağındandır. ≈, yorumlanmış bahçe sınırları içindeki model arazi yüzeyini veya fotoğrafa dayalı havuz tahminini belirtir; yerinde ölçüm ve parsel alanı değildir.',
  },
  en: {
    scaleRegion: 'Area', scaleStreet: 'Street', scaleVilla: 'Villa',
    f0: 'Basement', f1: 'Ground floor', f2: 'First floor', f3: 'Attic floor',
    f0Short: 'Basement', f1Short: 'Ground', f2Short: 'First', f3Short: 'Attic',
    building: 'Villa 21', neighborhood: 'Street', region: 'Area',
    buildingSub: 'Garden · Pool · Villa', neighborhoodSub: 'Angora Evleri · Ankara',
    regionSub: 'Angora Evleri · Mutlukent, Ankara',
    cut130: 'Cut at 1.30 m', cut160: 'Cut at 1.60 m',
    walkSub: '360° room tour',
    options: 'View options', optionsTitle: 'Furniture, measurements and light',
    info: 'Property details', infoTitle: 'Listing data and areas',
    floorInfo: 'Floor details', floorInfoShort: 'Floor', infoShort: 'Property',
    floorInfoTitle: 'The open floor and its spaces', closeFloor: 'Close floor details',
    optionsHeading: 'View', closeOptions: 'Close view options', closeInfo: 'Close property details',
    furniture: 'Show furniture', roomNames: 'Room names', measurements: 'Measurements',
    photos: 'Photographs', closePhoto: 'Close photograph',
    daylight: 'Daylight', light: 'Light', lightSoft: 'Soft daylight', lightSun: 'Direct sun',
    interiorLights: 'Interior lights', soundOff: 'Interface sound off', soundOn: 'Interface sound on',
    solarNote: 'Local time · Illustrative daylight study; not a certified analysis',
    cutLightNote: 'Light in cutaway views is illustrative; enclosed-room light is shown in the 360° tour.',
    explore: 'Explore inside', exitWalk: 'Back to floor',
    enterVR: 'Enter VR', exitVR: 'Leave VR', retryVR: 'Try VR again',
    roomTour: 'Room tour', goRoom: 'Go to room', lens: 'Field of view',
    lift: 'Lift', liftHere: 'on this floor',
    walkHelp: 'Drag: look around · Tap the floor: walk there',
    orbitHelp: 'Drag: rotate · Two fingers: pan / zoom',
    stairs: 'Stairs', garden: 'Garden', terrace: 'Terrace',
    plan: 'Plan', planTitle: 'Plan and isometric view', recenter: 'Recenter view',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', rotate: 'Drag to rotate', pan: 'Drag to pan',
    listing: 'Open sales listing ↗', listingShort: 'Listing ↗',
    returnVilla: 'Approach Villa 21 ↗', sitePlan: 'Site plan',
    radiusLabel: 'Map radius', straightLine: 'straight-line',
    groupEdu: 'Education', groupHealth: 'Health', groupFood: 'Food & drink',
    groupShop: 'Shopping', groupSport: 'Sport · Parks', groupService: 'Services',
    loading: 'Loading model…', loadingAll: 'Loading the full model…', preparing: 'Preparing views…',
    stepModel: 'Model', stepLight: 'Light', stepScene: 'Scene', stepView: 'View',
    loadingData: 'Reading plan data…', loadingModel: 'Downloading the model…',
    loadingLight: 'Preparing light and reflections…', loadingScene: 'Building the scene…',
    loadingView: 'Preparing the view…',
    retry: 'Try again',
    loadFailed: 'The model could not be loaded. Check your connection and try again.',
    contextLost: 'The 3D graphics context was lost. Reopen the page to continue.',
    fallbackLead: '3D could not start on this device. The property’s verified details are still here:',
    welcomeExplore: 'Explore the home', welcomeTour: 'Guided tour', welcomeClose: 'Close',
    welcomeNote: 'Areas are from the RE/MAX listing P56131836',
    factGross: 'gross', factNet: 'net', factRooms: 'rooms', factFloors: 'floors',
    tourExterior: 'The villa and its plot', tourLiving: 'Ground floor: living, kitchen, dining',
    tourUpper: 'Upper floor: bedrooms', tourGarden: 'Garden, terrace and pool',
    tourInterior: 'A representative interior — drag to look', tourStreet: 'The immediate street',
    tourRegion: 'The area and daily needs', tourEnd: 'Property details',
    tourNext: 'Next', tourPrev: 'Back', tourStop: 'End tour',
    modelEstimate: 'model estimate', listingSource: 'RE/MAX listing',
    liftCall: 'call to this floor', liftSend0: 'Send to basement', liftSend1: 'Send to ground floor', liftSend2: 'Send to first floor',
    panHelp: 'Drag: pan · Two fingers: pan and zoom',
    regionIntro: 'A low-density villa settlement on Ankara’s west side, bordering the green of the Hacettepe Beytepe campus. Its planned street fabric and mature gardens keep daily life inside the settlement; the Eskişehir road and the Bilkent link keep the city minutes away.',
    lblPark: 'park', lblSchool: 'school', lblMarket: 'market', lblPharmacy: 'pharmacy',
    distNote: 'Distances are straight-line · Atlas: OSM',
    amenities: 'amenities', buildingsWord: 'buildings',
    piCoverage: 'Finished-surface footprint · model calculation', piRoomsOnPlan: 'Spaces on this plan',
    piGross: 'Gross area · RE/MAX listing', piNet: 'Net area · RE/MAX listing',
    piFeatures: 'Highlights', piLocation: 'Location',
    piFloors: 'Floors', piRooms: 'Rooms · RE/MAX listing',
    piFloorNote: 'The floor value is the horizontal projection of finished surfaces in the source model, level changes included, overlapping surfaces counted once. It is not usable net area or a deed area. Room m² is not shown until room boundaries are separately verified.',
    piListingNote: 'Listing areas are from RE/MAX P56131836. ≈ marks the modelled ground surface within interpreted garden boundaries, or a photo-based pool estimate; not an on-site measurement or the plot area.',
  },
};
// Drawing room names, translated as terms - never invented, only rendered
// in the viewer's language. Anything unmatched stays in Turkish.
const ROOM_TERMS = [
  [/^salon$/i, 'Living room'], [/^mutfak$/i, 'Kitchen'], [/^yemek alanı$/i, 'Dining area'],
  [/^oturma alanı$/i, 'Sitting area'], [/^antre$/i, 'Entry hall'], [/^giriş$/i, 'Entrance'],
  [/^kat holü$/i, 'Landing'], [/^hol$/i, 'Hall'], [/^koridor$/i, 'Corridor'],
  [/^yatak odası$/i, 'Bedroom'], [/^ebeveyn yatak odası$/i, 'Primary bedroom'],
  [/^ebeveyn banyosu$/i, 'En-suite bathroom'], [/^banyo$/i, 'Bathroom'], [/^wc$/i, 'WC'],
  [/^çamaşır( odası)?$/i, 'Laundry'], [/^kiler$/i, 'Pantry'], [/^depo$/i, 'Storage'],
  [/^garaj$/i, 'Garage'], [/^tesisat odası$/i, 'Utility room'], [/^kazan dairesi$/i, 'Boiler room'],
  [/^balkon$/i, 'Balcony'], [/^teras$/i, 'Terrace'], [/^bahçe$/i, 'Garden'],
  [/^çalışma odası$/i, 'Study'], [/^giyinme odası$/i, 'Dressing room'],
  [/^oyun odası$/i, 'Playroom'], [/^tv odası$/i, 'TV room'], [/^sauna$/i, 'Sauna'],
  [/^hobi odası$/i, 'Hobby room'], [/^misafir odası$/i, 'Guest room'],
  [/^bodrum holü$/i, 'Basement hall'], [/^merdiven$/i, 'Stairs'],
  [/^havuz$/i, 'Pool'], [/^ön bahçe$/i, 'Front garden'], [/^arka bahçe$/i, 'Back garden'],
  [/^yan bahçe$/i, 'Side garden'], [/^otopark$/i, 'Parking'], [/açık balkon/i, 'Open balcony'],
];
let lang = (() => {
  if (typeof location === 'undefined') return 'tr';   // node-side tests
  const forced = new URLSearchParams(location.search).get('lang');
  if (forced === 'en' || forced === 'tr') return forced;
  try { return localStorage.getItem('angora-lang') === 'en' ? 'en' : 'tr'; } catch { return 'tr'; }
})();
export const t = (key) => STRINGS[lang][key] ?? STRINGS.tr[key] ?? key;
export const currentLang = () => lang;
export function roomName(name) {
  if (lang === 'tr' || !name) return name;
  const hit = ROOM_TERMS.find(([rx]) => rx.test(name.trim()));
  return hit ? hit[1] : name;
}
// static DOM: <el data-i18n="key"> for text, data-i18n-label for aria-label,
// data-i18n-title for title. Called at boot and again on every switch.
export function applyStatic(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-label]')) el.setAttribute('aria-label', t(el.dataset.i18nLabel));
  for (const el of root.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
  document.documentElement.lang = lang;
}
export function setLang(next, onChange) {
  if (next === lang) return;
  lang = next;
  try { localStorage.setItem('angora-lang', next); } catch { /* private mode */ }
  applyStatic();
  onChange?.(next);
}
