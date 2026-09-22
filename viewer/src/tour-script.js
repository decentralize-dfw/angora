// R48 | The narrated tour: the owner's voiceover, and what the viewer shows
// while each sentence is spoken.
//
// Times are seconds into audio/angora21-tur.mp3, taken from the owner's own
// transcript of it; the recording opens on its first word, so nothing is
// offset. The file is the delivered 48 kHz joint-stereo 192 kbps MP3 with its
// ID3 tags stripped and not one frame re-encoded.
//
// Every cue carries the sentence itself, which doubles as the subtitle, so
// what is written and what is heard cannot drift apart.
export const TOUR_AUDIO = 'angora21-tur.mp3';
export const TOUR_DURATION = 401.64;

// A cue names only what CHANGES. The driver carries the rest forward, so a
// run of sentences about one room reframes once and then simply turns over
// its subtitles.
//   view    'region' | 'neighborhood' | 'f0'..'f3'. There is no separate villa
//           view: 'building' in the scale picker is the f3 cut, so an UNCUT
//           house is the neighbourhood's section height with the camera
//           brought in, which is what frame:'villa' does.
//   radius  region map radius in metres (2000 | 1000 | 500)
//   rooms   room ids from native-rooms.json to light, plus the tour's own
//           'mark:' volumes; [] darkens nothing. Where a sentence names
//           several, they light one after another across the sentence rather
//           than all at once.
//   frame   what the camera is for: 'villa', 'plot', 'storey' (the view's own
//           framing, with something inside it lit), or null for the lit rooms
//   photos  listing photograph ids for the side gallery; [] closes it
//   group   which amenity family the Bolge map shows; null puts them away
//   azimuth camera bearing in radians; polar its pitch; pad how much air
//   hour    the daylight hour the cue asks for (6..21)
//   rotate  the camera turns while this cue holds
//   spin    the map turns slowly about the villa while this cue holds
//   link    the listing link stands on screen from this cue on
//
// The turn follows one rule. The camera orbits only where there is nothing to
// point at and a long time to fill: the settlement described from the street,
// and the closing summary. It never turns while a room, the plot or the pool
// is lit, and never inside the house. So there are exactly two orbits in six
// and a half minutes rather than a turn that starts and stops with every
// sentence - which, rewound by every reframe, read as a glitch.
export const TOUR_CUES = [
  // ---------------------------------------------------------------- Bolge
  {at: 0.0, view: 'region', radius: 2000, rooms: [], spin: true, group: null, photos: [],
   tr: 'Hoş geldiniz.',
   en: 'Welcome.'},
  {at: 1.3,
   tr: 'Bugün sizi Ankara’nın en prestijli konut bölgelerinden birinde, özel bir villa turuna davet ediyorum.',
   en: 'Today I invite you on a tour of a private villa in one of Ankara’s most prestigious residential districts.'},
  {at: 8.9,
   tr: 'Başkentin kalbi Çankaya’dan batıya, Eskişehir Yolu aksına doğru ilerliyoruz ve şehrin en sakin, en yeşil yaşam bölgesi Çayyolu’na ulaşıyoruz.',
   en: 'From Çankaya, the heart of the capital, we move west along the Eskişehir Road axis to Çayyolu — the city’s calmest and greenest district.'},
  {at: 14.4, radius: 1000, group: 4},
  {at: 19.6, radius: 500, group: 3,
   tr: 'Şimdi Çayyolu’nun kalbindeyiz.',
   en: 'Now we are in the heart of Çayyolu.'},
  {at: 22.2, group: null, spot: 'centre',
   tr: 'Karşınızda, Ankara’nın en köklü ve en tanınmış villa yerleşimi: Angora Evleri.',
   en: 'Before you is Ankara’s most established and best known villa settlement: Angora Evleri.'},

  // --------------------------------------------------------- the settlement
  {at: 27.8, view: 'neighborhood', spot: null, rotate: true, frame: null, azimuth: 0.9,
   tr: 'Angora Evleri, bir yerleşim yeri olarak baştan sona planlanmış, kendi içinde bütünlüklü bir yaşam alanı.',
   en: 'Angora Evleri was planned from end to end as a settlement — a complete place to live in its own right.'},
  {at: 35.7,
   tr: 'Yüzlerce müstakil villa, sıra evler ve bloklardan oluşan bu büyük yerleşim; düşük yapı yoğunluğu, geniş bulvarları, büyük yeşil alanları, spor alanları ve bulvar boyunca uzanan yürüyüş yollarıyla tasarlandı.',
   en: 'Hundreds of detached villas, terraces and apartment blocks, laid out at low density with wide boulevards, large greens, sports grounds and walking paths the length of the avenue.'},
  {at: 50.6,
   tr: 'Mimarisinde İskandinav esintileri taşıyan kiremit çatılı evler, olgun ağaçlar ve sakin sokaklar, Angora’ya kendine özgü bir karakter kazandırıyor.',
   en: 'Tiled roofs with a Scandinavian touch, mature trees and quiet streets give Angora a character of its own.'},
  {at: 61.1,
   tr: 'Site, dört ayrı güvenlik girişiyle korunuyor.',
   en: 'The estate is protected by four separate security gates.'},
  {at: 64.0,
   tr: 'Bu da sakinlerine huzurlu ve güvenli bir yaşam sunuyor.',
   en: 'Which gives its residents a calm and secure life.'},
  {at: 68.3,
   tr: 'Kış aylarında karla kaplandığında ise Angora Evleri adeta bir masal kasabasına dönüşüyor.',
   en: 'Under winter snow, Angora Evleri turns into something out of a storybook.'},
  {at: 74.4,
   tr: 'Angora’nın bir diğer ayrıcalığı da çevresi.',
   en: 'Angora’s other advantage is what surrounds it.'},

  // ------------------------------------------------------- the surroundings
  {at: 78.1, view: 'region', radius: 2000, rotate: false, spin: true, group: null,
   tr: 'Site, Beysukent ve Beytepe ormanlarına komşu.',
   en: 'The estate borders the Beysukent and Beytepe woods.'},
  {at: 81.4,
   tr: 'Yani doğanın hemen yanı başında bir yaşam.',
   en: 'A life right beside open country.'},
  {at: 84.7,
   tr: 'Beytepe ve Beysukent yalnızca birkaç dakika uzaklıkta.',
   en: 'Beytepe and Beysukent are minutes away.'},
  {at: 89.0, group: 0,
   tr: 'Hacettepe Üniversitesi Beytepe Kampüsü, Bilkent Üniversitesi ve Orta Doğu Teknik Üniversitesi kısa mesafede.',
   en: 'Hacettepe’s Beytepe campus, Bilkent University and METU are all a short distance away.'},
  {at: 97.1, group: 3,
   tr: 'Eskişehir Yolu üzerinden ise şehir merkezine, alışveriş merkezlerine, okullara ve hastanelere kolayca ulaşılıyor.',
   en: 'The Eskişehir road puts the city centre, the shopping centres, schools and hospitals within easy reach.'},
  {at: 101.6, group: 1},
  {at: 104.7, group: null,
   tr: 'Doğayla iç içe, güvenli ve prestijli bir yaşam…',
   en: 'A secure, prestigious life, close to nature…'},

  // --------------------------------------------------------------- the villa
  {at: 108.3, view: 'neighborhood', spin: false, rotate: false, azimuth: 0.95, photos: [],
   tr: 'Ve şimdi Angora Evleri’nin içindeki özel bir villaya doğru ilerliyoruz.',
   en: 'And now we move towards one particular villa inside Angora Evleri.'},
  {at: 113.0, frame: 'villa', azimuth: 0.45, photos: [38],
   tr: 'Hatırlı Sokak, numara 10.',
   en: 'Hatırlı Sokak, number 10.'},
  {at: 115.2, azimuth: 0.8, photos: [28],
   tr: 'Karşınızda Villa 21.',
   en: 'This is Villa 21.'},
  {at: 117.9, photos: [28, 55],
   tr: 'Yaklaşık 500 metrekare brüt, 400 metrekare net kullanım alanına sahip, asansörlü, müstakil bir villa.',
   en: 'A detached villa of about 500 m² gross and 400 m² net, with its own lift.'},
  // The lift gets its sentence here through the gallery rather than through a
  // camera move: three storey changes inside four seconds would be a lurch,
  // and the owner's own frames of the car say it better.
  {at: 126.8,
   tr: 'Asansör, katlar arasında rahat ve konforlu bir bağlantı sunuyor.',
   en: 'The lift connects the floors comfortably.'},
  {at: 131.6, rooms: ['mark:plot-ring'], frame: 'plot', polar: 0.17, azimuth: 0, photos: [25, 50],
   tr: 'Villayı 900 metrekarelik bir bahçe çevreliyor.',
   en: 'A 900 m² garden wraps around the villa.'},
  {at: 135.4, rooms: ['f0-site-pool'], frame: null, polar: null, azimuth: 3.05, photos: [53, 54, 24],
   tr: 'Meyve ağaçları, yeşil alanlar ve yaklaşık 50 metrekarelik özel bir havuz.',
   en: 'Fruit trees, lawns, and a private pool of about 50 m².'},
  {at: 140.6, rooms: [], frame: 'villa', azimuth: 1.9, photos: [],
   tr: '5 yatak odası, 4 yaşam alanı, 3 banyo, bağımsız girişli bir müştemilat ve 3 araçlık otopark.',
   en: 'Five bedrooms, four living spaces, three bathrooms, a separately entered annexe and parking for three.'},
  {at: 149.2, azimuth: 0.55,
   tr: 'Evin kurgusunda önemli bir detay var.',
   en: 'There is one important thing about how this house is set out.'},
  {at: 152.1, rooms: ['f1-Z01'], photos: [38, 37],
   tr: 'Sokaktan giriş, bodrumun bir üst seviyesindeki giriş katından yapılıyor.',
   en: 'You enter from the street on the ground floor, one level above the basement.'},
  {at: 157.1, rooms: ['f0-B06'], azimuth: 2.85, photos: [25, 51],
   tr: 'Arazinin eğimi sayesinde bodrum kat ise doğrudan bahçe ve havuz seviyesine açılıyor.',
   en: 'The slope of the site lets the basement open straight onto the garden and pool.'},

  // ------------------------------------------------------------- the basement
  {at: 163.4, view: 'f0', rooms: [], frame: null, photos: [],
   tr: 'Turumuza da bu kattan, en alttan başlıyoruz.',
   en: 'So our tour begins there, at the lowest level.'},
  {at: 166.6, photos: [47],
   tr: 'Bodrum kattayız. Ama burası alışık olduğunuz bir bodrum değil.',
   en: 'We are in the basement. But this is not the basement you are picturing.'},
  {at: 170.6, rooms: ['f0-B06'], photos: [2, 3, 5],
   tr: 'Bahçeye ve havuza doğrudan açılan, gün ışığı alan ferah bir yaşam katı.',
   en: 'An airy living floor with daylight, opening straight onto the garden and pool.'},
  {at: 175.6, rooms: ['f0-B06', 'f0-B05'], photos: [1, 2],
   tr: 'Yaklaşık 54 metrekarelik geniş yaşam alanı, açık mutfağıyla birlikte kullanışlı bir bütün oluşturuyor.',
   en: 'About 54 m² of living space, open to the kitchen, makes one workable whole.'},
  {at: 182.7, rooms: ['f0-site-pool'], photos: [53, 54, 51],
   tr: 'Havuz başında geçen yaz günleri, barbekülü bahçede açık hava yemekleri, kalabalık davetler…',
   en: 'Summer days by the pool, meals outdoors by the barbecue, large gatherings…'},
  {at: 188.7,
   tr: 'Hepsi için ideal.',
   en: 'It suits all of them.'},
  {at: 189.9, rooms: ['f0-B02'], photos: [],
   tr: 'Bu katta ayrıca yaklaşık 27 metrekarelik, bağımsız girişli bir müştemilat bulunuyor.',
   en: 'This floor also holds a separately entered annexe of about 27 m².'},
  {at: 196.8,
   tr: 'Kendi ayrı odası, banyosu ve tuvaleti olan bu bölüm, çalışanlar için ya da ihtiyaca göre farklı amaçlarla kullanılabilecek, evin ana yaşamından ayrı ve konforlu bir alan sunuyor.',
   en: 'With its own room, bathroom and WC, it is a comfortable space apart from the main house — for staff, or for whatever else is needed.'},

  // --------------------------------------------------------- the ground floor
  {at: 208.6, view: 'f1', rooms: [], photos: [42],
   tr: 'Şimdi bir üst kata, sokak seviyesindeki giriş katına çıkıyoruz.',
   en: 'Now we go up a level, to the ground floor at street height.'},
  {at: 213.6, rooms: ['f1-Z01', 'f1-Z02'], photos: [41, 40],
   tr: 'Girişten geçip yaklaşık 12 metrekarelik antreye adım atıyoruz.',
   en: 'Through the entrance we step into a hallway of about 12 m².'},
  {at: 217.8,
   tr: 'Buradan evin ana yaşam alanlarına açılıyoruz.',
   en: 'From here the house opens into its main living spaces.'},
  {at: 221.0, rooms: ['f1-Z06', 'f1-Z05'], photos: [4, 23],
   tr: 'Yaklaşık 53 metrekarelik salon ve yemek alanı, evin kalbi.',
   en: 'The living and dining space, about 53 m², is the heart of the house.'},
  {at: 225.2, rooms: ['f1-Z06'], photos: [4, 23],
   tr: 'Geniş pencerelerden gün ışığı içeri doluyor ve havuza bakan balkonu, bahçe manzarasını salonun bir parçası hâline getiriyor.',
   en: 'Daylight pours through the wide windows, and the pool-facing balcony makes the garden part of the room.'},
  {at: 234.2, rooms: ['f1-Z04'], photos: [21, 22],
   tr: 'Yaklaşık 26 metrekarelik kapalı mutfak, kahvaltı köşesine yer verecek kadar geniş.',
   en: 'The enclosed kitchen, about 26 m², has room for a breakfast corner.'},
  {at: 240.0, rooms: ['f1-Z03', 'f1-Z08', 'f1-Z07'], photos: [39, 43, 44],
   tr: 'Katta ayrıca bir misafir tuvaleti, tesisat odası ve evin içinden doğrudan ulaşılan, yaklaşık 21 metrekarelik kapalı garaj bulunuyor.',
   en: 'The floor also holds a guest WC, a plant room, and a 21 m² garage reached from inside the house.'},

  // ----------------------------------------------------------- the first floor
  // The lift, quickly: it is marked on the floor we leave and on the one we
  // arrive at, inside the sentence that names it, and the tour does not stop.
  {at: 249.2, rooms: ['mark:lift-1'], frame: 'storey', photos: [42],
   tr: 'Asansörle ya da ferforje korkuluklu merdivenden birinci kata çıkıyoruz.',
   en: 'By lift, or up the wrought-iron staircase, we reach the first floor.'},
  {at: 251.4, view: 'f2', rooms: ['mark:lift-2'], photos: [18, 34]},
  {at: 253.5, rooms: [], frame: null, photos: [35],
   tr: 'Bu kat tamamen gece yaşamına ayrılmış.',
   en: 'This floor is given over entirely to the night.'},
  {at: 257.1, rooms: ['f2-102', 'f2-103', 'f2-104'], photos: [19, 16, 32],
   tr: 'Yaklaşık 22 metrekarelik ebeveyn yatak odası, kendi giyinme odası ve yaklaşık sekiz buçuk metrekarelik ebeveyn banyosuyla gerçek bir süit.',
   en: 'A 22 m² principal bedroom with its own dressing room and an 8.5 m² en-suite — a true suite.'},
  {at: 266.6, rooms: ['f2-110'], azimuth: 2.95, photos: [],
   tr: 'Ve kendi balkonuna açılıyor.',
   en: 'And it opens onto its own balcony.'},
  {at: 269.2, rooms: ['f2-106', 'f2-107', 'f2-108', 'f2-105'], azimuth: null, photos: [13, 30, 11],
   tr: 'Katta ayrıca yaklaşık 13 ve 12 metrekarelik iki yatak odası, ortak banyo ve yaklaşık 15 metrekarelik bir oturma alanı yer alıyor.',
   en: 'The floor also has bedrooms of about 13 and 12 m², a shared bathroom, and a 15 m² sitting area.'},
  // The corner balcony is the OTHER one: 110 hangs over the pool on the garden
  // side, 109 sits on the street corner, so they are looked at from opposite
  // bearings and cannot be taken for the same balcony.
  {at: 278.7, rooms: ['f2-109'], azimuth: 0.15, photos: [],
   tr: 'Geniş köşe balkonu ise sabah kahvesi için en keyifli nokta olmaya aday.',
   en: 'The wide corner balcony is the pick of the house for morning coffee.'},

  // ------------------------------------------------------------ the roof floor
  {at: 284.1, view: 'f3', rooms: [], azimuth: null, photos: [29],
   tr: 'Merdivenle son kata, çatı katına çıkıyoruz.',
   en: 'The stairs take us to the top floor, under the roof.'},
  {at: 287.3, rooms: ['f3-C05', 'f3-C04', 'f3-C02', 'f3-C03'], photos: [9, 14, 15],
   tr: 'Yaklaşık 24 metrekarelik oturma alanı, yaklaşık 20 ve 10,5 metrekarelik iki yatak odası, banyo ve mini mutfağıyla bu kat, kendi içinde bağımsız bir yaşam sunuyor.',
   en: 'A 24 m² sitting area, bedrooms of about 20 and 10.5 m², a bathroom and a kitchenette make this floor a home of its own.'},
  {at: 299.0, rooms: [], photos: [10, 6],
   tr: 'Yetişkin çocuklar, uzun süreli misafirler ya da sessiz bir çalışma alanı arayanlar için mükemmel bir çözüm.',
   en: 'Ideal for grown-up children, long-staying guests, or anyone wanting a quiet place to work.'},

  // ---------------------------------------------------------------- materials
  {at: 305.6, photos: [8, 14],
   tr: 'Evin genelinde kullanılan malzemeler de bu sıcak ve klasik atmosferi tamamlıyor.',
   en: 'The materials used throughout complete this warm, classical atmosphere.'},
  {at: 311.5, view: 'f2', rooms: ['f2-102', 'f2-105'], photos: [19, 33, 13],
   tr: 'Yaşam alanlarında ve yatak odalarında, yüksek parlaklıkta cilalı, maun tonlarında ahşap parke kullanılmış.',
   en: 'The living spaces and bedrooms are laid with high-gloss parquet in mahogany tones.'},
  {at: 318.4, rooms: [], photos: [30, 12],
   tr: 'Derin kırmızı kahverengi rengi ve belirgin damar yapısıyla bu parke, mekânlara hem sıcaklık hem de zamansız bir şıklık katıyor.',
   en: 'Its deep red-brown colour and pronounced grain give the rooms both warmth and a timeless elegance.'},
  {at: 327.9, view: 'f1', rooms: ['f1-Z04', 'f1-Z02', 'f1-Z07'], photos: [21, 40, 43],
   tr: 'Mutfaklarda, bodrum katta, garajda ve antrede ise bej ve toprak tonlarında, doğal taş görünümlü seramik karolar tercih edilmiş.',
   en: 'The kitchens, basement, garage and hallway are tiled in beige and earth tones, in a natural stone finish.'},
  {at: 336.6, rooms: [], photos: [44, 22],
   tr: 'Neme dayanıklı ve kolay temizlenen bu zemin, günlük kullanımın yoğun olduğu alanlarda pratiklik sağlıyor.',
   en: 'Moisture-resistant and easy to clean, it is the practical choice where daily use is heaviest.'},

  // ------------------------------------------------------------------ closing
  // Almost a front elevation, at the viewer's own dusk: the camera comes down
  // off the roof, with nothing marked, and turns slowly through the
  // whole summary - and the house's own lamps are lit behind the glazing, one
  // to a storey, which is the only thing that makes a dark elevation read as a
  // home rather than a model. The visitor's daylight and their own light switch
  // are both put back when the tour ends.
  //
  // None of that is taste; it is what the plot allows. A neighbour stands 11 m
  // from this villa's centre, so at the tour's own 16 deg lens the frame has to
  // stand 74 m out - and from there, clearing that neighbour's roof needs the
  // eye 40 m up, which is the roof shot this cue was asked to stop being. Hence
  // the 50 deg lens: it brings the same frame in to 22 m, close enough to look
  // UP at the house - and the nearer the camera, the more of the circle opens
  // up, because a short sight line meets fewer neighbours.
  //
  // And hence a sweep rather than an orbit. Even at 22 m better than a third of
  // the circle puts the camera inside a neighbour's walls, so the turn runs
  // through the arc that is actually clear at this distance - 158 to 230
  // degrees, across the pool and the garden, the face the listing's own
  // exterior photographs were taken from - in one slow pass over the whole
  // closing. pad 1.18 leaves the
  // roof room: at this polar the near face is metres closer than the box's
  // middle, so it projects about a fifth larger.
  {at: 343.7, view: 'neighborhood', rooms: [], frame: 'villa',
   polar: 1.42, pad: 1.18, lens: 50, azimuth: 2.76, sweep: 1.26,
   hour: 21, windows: true, photos: [48, 49, 24],
   tr: 'İlk üç katı birbirine bağlayan asansör, 10 metreye 5 metre boyutunda kendine ait deposu olan özel havuz, 900 metrekarelik çift kotlu bahçe, bağımsız girişli müştemilat ve her kuşağa ayrı yaşam alanı sunan esnek bir kurgu.',
   en: 'A lift joining the first three floors, a private pool of 10 by 5 metres with its own tank, a 900 m² garden on two levels, a separately entered annexe, and a plan flexible enough to give every generation its own space.'},
  {at: 359.8, photos: [25, 50, 36],
   tr: 'Bahçenin çevresindeki uzun ağaçlar ise tam bir mahremiyet garantilemektedir.',
   en: 'The tall trees around the garden make it completely private.'},
  {at: 364.8, link: true, photos: [],
   tr: 'Çayyolu’nun kalbinde, Angora Evleri Hatırlı Sokak 10 numaradaki bu villa, 99 milyon Türk lirası fiyatıyla satışta.',
   en: 'In the heart of Çayyolu, at Angora Evleri, Hatırlı Sokak 10, this villa is for sale at 99 million Turkish lira.'},
  {at: 373.5,
   tr: 'Ev krediye uygun, boş ve hemen teslime hazır.',
   en: 'It is mortgageable, empty, and ready for immediate handover.'},
  {at: 377.3,
   tr: 'Bu emlak satış arayüzü, Lüksemburg merkezli MERGVS tarafından geliştirilmiştir.',
   en: 'This property interface was built by MERGVS, based in Luxembourg.'},
  {at: 382.5,
   tr: 'Evi yerinde görmek ve satın alma süreciyle ilgili detaylı bilgi almak için ilan linkine tıklayarak RE/MAX satış temsilcisiyle iletişime geçebilirsiniz.',
   en: 'To see the house in person and ask about the purchase, follow the listing link to the RE/MAX agent.'},
  {at: 391.4,
   tr: 'Bu güzel aile evinin alıcısına şimdiden bol şans ve mutluluk getirmesini dileriz.',
   en: 'We wish this fine family home every happiness for whoever buys it.'},
  {at: 398.3,
   tr: 'Bizi dinlediğiniz için teşekkür ederiz.',
   en: 'Thank you for listening.'},
];

// The state a cue leaves behind, so the driver can tell a reframe from a
// subtitle change. A field a cue omits is inherited - the camera holds the
// bearing it was given until a later sentence asks for another - and a field
// set to null or [] clears it.
export function resolveCues(cues = TOUR_CUES) {
  const carried = {view: 'region', radius: 2000, rooms: [], frame: null,
    azimuth: null, polar: null, rotate: false, spot: null, spin: false,
    group: null, link: false, photos: [], pad: null, hour: null, windows: false,
    lens: null, sweep: 0};
  let tr = '', en = '';
  return cues.map((cue, i) => {
    for (const key of Object.keys(carried)) if (key in cue) carried[key] = cue[key];
    // A cue with no words of its own keeps the sentence still being spoken -
    // the lift is marked on two storeys inside one sentence.
    tr = cue.tr ?? tr; en = cue.en ?? en;
    // How long this cue holds, which is how the rooms it names are spread.
    const until = cues[i + 1]?.at ?? TOUR_DURATION;
    return {...carried, at: cue.at, tr, en, span: Math.max(0, until - cue.at)};
  });
}
// What must be reframed for, as opposed to merely re-subtitled. The side
// gallery and the listing link are applied before the camera is touched at
// all, so a cue that changes only those must not restart a flight - that is
// what used to rewind the orbit three times before "Karşınızda Villa 21".
export const cueKey = step =>
  [step.view, step.radius, step.rooms.join('+'), step.frame, step.azimuth, step.polar,
   step.pad, step.rotate, step.spot, step.spin, step.group, step.windows,
   step.lens, step.sweep].join('|');
