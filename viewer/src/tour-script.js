// R48 | The narrated tour: the owner's voiceover, and what the viewer shows
// while each sentence is spoken.
//
// The recording is a single unbroken read - 94 phrases, no pause longer than
// 1,4 s - so the tour is driven by the audio clock rather than by a step
// button. Every cue carries the sentence itself, which doubles as the
// subtitle, so what is written and what is heard cannot drift apart.
//
// Times are seconds into audio/angora21-tur.mp3. That file is the delivered
// recording with its 6,975 s slate ("#Angora Evleri / Villa 21 / Sanal Tur
// Senaryosu / Yaklaşık 5 dakika") trimmed off at an MPEG frame boundary, so
// every timestamp here is the voiceover's own minus 6,975 s.
export const TOUR_AUDIO = 'angora21-tur.mp3';
export const TOUR_DURATION = 268.64;
// What the slate cost, kept so a re-trim can be checked against the source.
export const TOUR_TRIM_S = 6.975;

// A cue names only what CHANGES. The driver carries the rest forward, so a
// run of sentences about one room reframes once and then simply turns over
// its subtitles.
//   view    'region' | 'neighborhood' | 'f0'..'f3'. There is no separate
//           villa view: 'building' in the scale picker is the f3 cut, so an
//           UNCUT house is the neighbourhood's section height with the camera
//           brought in - which is what frame:'villa' does.
//   radius  region map radius in metres (2000 | 1000 | 500)
//   rooms   room ids from native-rooms.json to light; [] darkens nothing
//   frame   what the camera is for: 'villa', 'plot', or null for the lit
//           rooms, or for the view's own framing when nothing is lit
//   azimuth camera bearing in radians; omitted lets the framing choose
//   polar   camera pitch in radians; omitted keeps the view's own
//   rotate  slow orbit while this cue holds
export const TOUR_CUES = [
  {at: 0.71, view: 'region', radius: 2000, rooms: [],
   tr: 'Hoş geldiniz.',
   en: 'Welcome.'},
  {at: 1.03,
   tr: 'Bugün sizi Ankara’nın en prestijli konut bölgelerinden birinde özel bir villa turuna davet ediyorum.',
   en: 'Today I invite you on a tour of a private villa in one of Ankara’s most prestigious residential districts.'},
  {at: 8.03,
   tr: 'Çankaya, başkentin hem idari hem de sosyal yaşamının kalbi.',
   en: 'Çankaya is the heart of the capital’s administrative and social life alike.'},
  {at: 14.03,
   tr: 'Şehrin batısına, Eskişehir Yolu aksına doğru ilerledikçe ise Çankaya’nın en sakin, en yeşil ve en çok tercih edilen yaşam bölgesiyle karşılaşıyoruz.',
   en: 'Moving west along the Eskişehir Road axis, we reach Çankaya’s calmest, greenest and most sought-after district.'},
  {at: 24.03, radius: 1000,
   tr: 'Çayyolu.',
   en: 'Çayyolu.'},
  {at: 25.03,
   tr: 'Şehir merkezine kolay ulaşım ama şehrin gürültüsünden uzak bir yaşam.',
   en: 'Easy reach of the city centre, and a life away from its noise.'},
  {at: 31.03,
   tr: 'Çayyolu’nu yıllardır ailelerin gözdesi yapan şey tam da bu denge.',
   en: 'That balance is exactly what has made Çayyolu a favourite with families for years.'},
  {at: 36.03, radius: 500,
   tr: 'Şimdi Çayyolu’nun kalbindeyiz.',
   en: 'Now we are in the heart of Çayyolu.'},
  {at: 39.03,
   tr: 'Karşınızda, Ankara’nın en köklü ve en tanınmış villa yerleşimlerinden biri.',
   en: 'Before you is one of Ankara’s most established and best known villa settlements.'},
  {at: 44.03, spot: 'centre',
   tr: 'Angora Evleri.',
   en: 'Angora Evleri.'},

  {at: 45.03, view: 'neighborhood', rotate: true,
   tr: 'Kiremit çatılar, geniş bahçeler, olgun ağaçlar ve sakin sokaklar.',
   en: 'Tiled roofs, generous gardens, mature trees and quiet streets.'},
  {at: 51.03,
   tr: 'Angora Evleri yıllardır kendine özgü yaşam dokusuyla ayrıcalıklı bir adres olmayı sürdürüyor.',
   en: 'Angora Evleri has kept its standing as a privileged address through its own way of living.'},
  {at: 58.03, frame: 'villa', rotate: true, azimuth: 0.95,
   tr: 'Ve şimdi bu dokunun içindeki özel bir villaya doğru ilerliyoruz.',
   en: 'And now we move towards one particular villa inside that fabric.'},
  {at: 62.03, rotate: false, azimuth: 0.45,
   tr: 'Hatırlı Sokak, numara 10.',
   en: 'Hatırlı Sokak, number 10.'},
  {at: 64.03, azimuth: 0.8,
   tr: 'Karşınızda Villa 21.',
   en: 'This is Villa 21.'},
  {at: 66.03, rotate: true,
   tr: 'Yaklaşık 500 metrekare brüt, 400 metrekare net kullanım alanına sahip, asansörlü, müstakil bir villa.',
   en: 'A detached villa of about 500 m² gross and 400 m² net, with its own lift.'},
  {at: 74.03, rooms: ['f0-site-garden', 'f0-site-pool'], frame: 'plot', rotate: false, azimuth: 2.65,
   tr: 'Villayı 900 metrekarelik bir bahçe çevreliyor.',
   en: 'A 900 m² garden wraps around the villa.'},
  {at: 78.03, rooms: ['f0-site-pool'], frame: null, azimuth: 3.05,
   tr: 'Meyve ağaçları, yeşil alanlar ve yaklaşık 50 metrekarelik özel bir havuz.',
   en: 'Fruit trees, lawns, and a private pool of about 50 m².'},
  {at: 84.03, rooms: [], frame: 'villa', rotate: true,
   tr: '5 yatak odası, 4 yaşam alanı, 3 banyo, bağımsız girişli bir müştemilat ve 3 araçlık otopark.',
   en: 'Five bedrooms, four living spaces, three bathrooms, a separately entered annexe and parking for three.'},
  {at: 91.03, rotate: false, azimuth: 0.55,
   tr: 'Evin kurgusunda önemli bir detay var.',
   en: 'There is one important thing about how this house is set out.'},
  {at: 94.03, rooms: ['f1-Z01'],
   tr: 'Sokaktan giriş, bodrumun bir üst seviyesindeki giriş katından yapılıyor.',
   en: 'You enter from the street on the ground floor, one level above the basement.'},
  {at: 99.03, rooms: ['f0-B06'], azimuth: 2.85,
   tr: 'Arazinin eğimi sayesinde bodrum kat ise doğrudan bahçe ve havuz seviyesine açılıyor.',
   en: 'The slope of the site lets the basement open straight onto the garden and pool.'},

  {at: 105.03, view: 'f0', rooms: [], frame: null, rotate: false,
   tr: 'Turumuza da bu kattan, en alttan başlıyoruz.',
   en: 'So our tour begins there, at the lowest level.'},
  {at: 108.03,
   tr: 'Bodrum kattayız.',
   en: 'We are on the basement floor.'},
  {at: 110.03,
   tr: 'Ama burası alışık olduğunuz bir bodrum değil.',
   en: 'But this is not the basement you are picturing.'},
  {at: 113.03, rooms: ['f0-B06'],
   tr: 'Bahçeye ve havuza doğrudan açılan, gün ışığı alan, bağımsız girişli tam bir müştemilat.',
   en: 'A full annexe with its own entrance, daylight, and doors straight onto the garden and pool.'},
  {at: 119.03, rooms: ['f0-B06', 'f0-B05'],
   tr: 'Yaklaşık 54 metrekarelik geniş yaşam alanı, açık mutfağıyla birlikte ferah ve kullanışlı bir bütün oluşturuyor.',
   en: 'About 54 m² of living space, open to the kitchen, reads as one airy, workable whole.'},
  {at: 127.03, rooms: ['f0-site-pool'], azimuth: 3.05,
   tr: 'Havuz başında geçen yaz günleri, bahçede açık hava yemekleri, kalabalık davetler… Hepsi için ideal.',
   en: 'Summer days by the pool, meals outdoors, large gatherings — it suits all of them.'},
  {at: 133.03, rooms: ['f0-B02', 'f0-WC'],
   tr: 'Ana yaşam alanının yanı sıra yaklaşık 27 metrekarelik ayrı bir oda ve müştemilatın kendi banyosu ve WC’si bulunuyor.',
   en: 'Beside the main living space there is a separate room of about 27 m², plus the annexe’s own bathroom and WC.'},
  {at: 143.03, rooms: [],
   tr: 'Yani bu kat kendi içinde eksiksiz bir yaşam birimi.',
   en: 'This floor is a complete dwelling in itself.'},
  {at: 147.03,
   tr: 'Misafirler, aile büyükleri ya da çalışanlar için bağımsız ve konforlu bir alan.',
   en: 'An independent, comfortable space for guests, grandparents or staff.'},

  {at: 153.03, view: 'f1', rooms: [],
   tr: 'Şimdi bir üst kata, sokak seviyesindeki giriş katına çıkıyoruz.',
   en: 'Now we go up a level, to the ground floor at street height.'},
  {at: 157.03, rooms: ['f1-Z01', 'f1-Z02'],
   tr: 'Giriş holünden geçip yaklaşık 12 metrekarelik antreye adım atıyoruz.',
   en: 'Through the entrance hall we step into a hallway of about 12 m².'},
  {at: 162.03,
   tr: 'Buradan evin ana yaşam alanlarına açılıyoruz.',
   en: 'From here the house opens into its main living spaces.'},
  {at: 165.03, rooms: ['f1-Z06', 'f1-Z05'],
   tr: 'Yaklaşık 53 metrekarelik salon ve yemek alanı, evin kalbi.',
   en: 'The living and dining space, about 53 m², is the heart of the house.'},
  {at: 170.03, rooms: ['f1-Z06'], azimuth: 2.9,
   tr: 'Geniş pencerelerden gün ışığı içeri doluyor ve havuza bakan balkonu, bahçe manzarasını salonun bir parçası hâline getiriyor.',
   en: 'Daylight pours through the wide windows, and the pool-facing balcony makes the garden part of the room.'},
  {at: 178.03, rooms: ['f1-Z04'],
   tr: 'Yaklaşık 26 metrekarelik kapalı mutfak, kahvaltı köşesine yer verecek kadar geniş.',
   en: 'The enclosed kitchen, about 26 m², has room for a breakfast corner.'},
  {at: 183.03, rooms: ['f1-Z03', 'f1-Z08', 'f1-Z07'],
   tr: 'Katta ayrıca misafir WC’si, tesisat odası ve evin içinden doğrudan ulaşılan yaklaşık 21 metrekarelik kapalı garaj bulunuyor.',
   en: 'The floor also holds a guest WC, a plant room, and a 21 m² garage reached from inside the house.'},

  {at: 194.03, view: 'f2', rooms: [],
   tr: 'Asansörle ya da ferforje korkuluklu merdivenden birinci kata çıkıyoruz.',
   en: 'By lift, or up the wrought-iron staircase, we reach the first floor.'},
  {at: 198.03,
   tr: 'Bu kat tamamen gece yaşamına ayrılmış.',
   en: 'This floor is given over entirely to the night.'},
  {at: 201.03, rooms: ['f2-102', 'f2-103', 'f2-104'],
   tr: 'Yaklaşık 22 metrekarelik ebeveyn yatak odası, kendi giyinme odası ve yaklaşık 8,5 metrekarelik ebeveyn banyosuyla gerçek bir süit.',
   en: 'A 22 m² principal bedroom with its own dressing room and an 8.5 m² en-suite — a true suite.'},
  {at: 212.03, rooms: ['f2-110'], azimuth: 2.9,
   tr: 'Ve kendi balkonuna açılıyor.',
   en: 'And it opens onto its own balcony.'},
  {at: 214.03, rooms: ['f2-106', 'f2-107', 'f2-108', 'f2-105'],
   tr: 'Katta yaklaşık 13 ve 12 metrekarelik iki yatak odası, ortak banyo ve yaklaşık 15 metrekarelik bir oturma alanı yer alıyor.',
   en: 'The floor also has bedrooms of about 13 and 12 m², a shared bathroom, and a 15 m² sitting area.'},
  {at: 223.03, rooms: ['f2-109'], azimuth: 0.2,
   tr: 'Geniş köşe balkonu ise sabah kahvesi için en keyifli nokta olmaya aday.',
   en: 'The wide corner balcony is the pick of the house for morning coffee.'},

  {at: 228.03, view: 'f3', rooms: [],
   tr: 'Merdivenle son kata, çatı katına çıkıyoruz.',
   en: 'The stairs take us to the top floor, under the roof.'},
  {at: 232.03, rooms: ['f3-C05', 'f3-C04', 'f3-C02', 'f3-C03'],
   tr: 'Yaklaşık 24 metrekarelik oturma alanı, yaklaşık 20 ve 10,5 metrekarelik iki yatak odası, banyo ve mini mutfağıyla bu kat kendi içinde bağımsız bir yaşam sunuyor.',
   en: 'A 24 m² sitting area, bedrooms of about 20 and 10.5 m², a bathroom and a kitchenette make this floor a home of its own.'},
  {at: 244.03, rooms: [],
   tr: 'Yetişkin çocuklar, uzun süreli misafirler ya da sessiz bir çalışma alanı arayanlar için mükemmel bir çözüm.',
   en: 'Ideal for grown-up children, long-staying guests, or anyone wanting a quiet place to work.'},

  {at: 251.03, view: 'neighborhood', rooms: [], frame: 'plot', rotate: true, azimuth: 2.2,
   tr: 'Asansör, özel havuz, 900 metrekarelik bahçe, bağımsız müştemilat ve her kuşağa ayrı yaşam alanı sunan esnek bir kurgu.',
   en: 'A lift, a private pool, a 900 m² garden, a separate annexe, and a plan flexible enough to give every generation its own space.'},
  {at: 261.03, frame: 'villa', rotate: false, azimuth: 0.8,
   tr: 'Çayyolu’nun kalbinde, Angora Evleri Hatırlı Sokak 10 numaradaki bu villa, 99 milyon Türk lirası fiyatıyla satışta.',
   en: 'In the heart of Çayyolu, at Angora Evleri, Hatırlı Sokak 10, this villa is for sale at 99 million Turkish lira.'},
];

// The state a cue leaves behind, so the driver can tell a reframe from a
// subtitle change. A field a cue omits is inherited - the camera holds the
// bearing it was given until a later sentence asks for another - and a field
// set to null or [] clears it.
export function resolveCues(cues = TOUR_CUES) {
  const carried = {view: 'region', radius: 2000, rooms: [], frame: null,
    azimuth: null, polar: null, rotate: false, spot: null};
  return cues.map(cue => {
    for (const key of Object.keys(carried)) if (key in cue) carried[key] = cue[key];
    return {...carried, at: cue.at, tr: cue.tr, en: cue.en};
  });
}
// What must be reframed for, as opposed to merely re-subtitled.
export const cueKey = step =>
  [step.view, step.radius, step.rooms.join('+'), step.frame, step.azimuth, step.polar, step.rotate, step.spot].join('|');
