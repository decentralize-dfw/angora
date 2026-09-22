// R48 | The narrated tour: the owner's voiceover, and what the viewer shows
// while each sentence is spoken.
//
// There are two recordings of it, one per language, and they are not the same
// length: the English read runs half a minute longer and its sentences do not
// fall where the Turkish ones do. So a cue carries BOTH times - `at` into the
// Turkish recording, `atEn` into the English - and the tour is the same tour
// either way, with the same camera doing the same things over whichever voice
// is speaking. A cue that only moves the camera, with no sentence of its own,
// takes its English time from the same point THROUGH the sentence it falls in.
//
// Times are seconds into the file, taken from each recording's own
// transcript; both open on the first word, so nothing is offset. Both are the
// delivered 48 kHz joint-stereo 192 kbps MP3s with their ID3 tags stripped and
// not one frame re-encoded.
//
// Every cue carries the sentence itself in both languages, and each doubles as
// that language's subtitle, so what is written and what is heard cannot drift
// apart in either.
export const TOUR_AUDIO = {tr: 'angora21-tur.mp3', en: 'angora21-eng.mp3'};
export const TOUR_DURATION = {tr: 401.64, en: 433.18};
// Which recording a language listens to. Anything that is not English gets the
// Turkish one, which is the viewer's own default.
export const tourLang = lang => (lang === 'en' ? 'en' : 'tr');
export const cueTime = (cue, lang) => (tourLang(lang) === 'en' ? cue.atEn : cue.at);

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
  {at: 0.0, atEn: 0.0, view: 'region', radius: 2000, rooms: [], spin: true, group: null, photos: [],
   tr: 'Hoş geldiniz.',
   en: 'Welcome.'},
  {at: 1.3, atEn: 1.1,
   tr: 'Bugün sizi Ankara’nın en prestijli konut bölgelerinden birinde, özel bir villa turuna davet ediyorum.',
   en: 'Today, I invite you on an exclusive villa tour in one of Ankara’s most prestigious residential areas.'},
  {at: 8.9, atEn: 8.0,
   tr: 'Başkentin kalbi Çankaya’dan batıya, Eskişehir Yolu aksına doğru ilerliyoruz ve şehrin en sakin, en yeşil yaşam bölgesi Çayyolu’na ulaşıyoruz.',
   en: 'From Çankaya, the heart of the capital, we head west along the Eskişehir Road corridor and arrive in Çayyolu, the city’s calmest and greenest residential area.'},
  {at: 14.4, atEn: 13.7, radius: 1000, group: 4},
  {at: 19.6, atEn: 19.0, radius: 500, group: 3,
   tr: 'Şimdi Çayyolu’nun kalbindeyiz.',
   en: 'We are now in the heart of Çayyolu.'},
  {at: 22.2, atEn: 21.6, group: null, spot: 'centre',
   tr: 'Karşınızda, Ankara’nın en köklü ve en tanınmış villa yerleşimi: Angora Evleri.',
   en: 'Before you is Ankara’s most established and best-known villa community: Angora Evleri.'},

  // --------------------------------------------------------- the settlement
  {at: 27.8, atEn: 28.2, view: 'neighborhood', spot: null, rotate: true, frame: null, azimuth: 0.9,
   tr: 'Angora Evleri, bir yerleşim yeri olarak baştan sona planlanmış, kendi içinde bütünlüklü bir yaşam alanı.',
   en: 'Angora Evleri was planned from the ground up as a complete, self-contained living environment.'},
  {at: 35.7, atEn: 34.1,
   tr: 'Yüzlerce müstakil villa, sıra evler ve bloklardan oluşan bu büyük yerleşim; düşük yapı yoğunluğu, geniş bulvarları, büyük yeşil alanları, spor alanları ve bulvar boyunca uzanan yürüyüş yollarıyla tasarlandı.',
   en: 'Made up of hundreds of detached villas, row houses and apartment blocks, this large community was designed with low building density, wide boulevards, expansive green spaces, sports areas and walking paths stretching along the boulevard.'},
  {at: 50.6, atEn: 50.3,
   tr: 'Mimarisinde İskandinav esintileri taşıyan kiremit çatılı evler, olgun ağaçlar ve sakin sokaklar, Angora’ya kendine özgü bir karakter kazandırıyor.',
   en: 'Red-tiled houses with a touch of Scandinavian architecture, mature trees and quiet streets give Angora a character all its own.'},
  {at: 61.1, atEn: 59.3,
   tr: 'Site, dört ayrı güvenlik girişiyle korunuyor.',
   en: 'The community is protected by four separate security gates,'},
  {at: 64.0, atEn: 62.9,
   tr: 'Bu da sakinlerine huzurlu ve güvenli bir yaşam sunuyor.',
   en: 'offering its residents a peaceful and secure way of life.'},
  {at: 68.3, atEn: 66.9,
   tr: 'Kış aylarında karla kaplandığında ise Angora Evleri adeta bir masal kasabasına dönüşüyor.',
   en: 'And in winter, when it is covered in snow, Angora Evleri turns into something like a fairytale village.'},
  {at: 74.4, atEn: 74.1,
   tr: 'Angora’nın bir diğer ayrıcalığı da çevresi.',
   en: 'Another great advantage of Angora is its surroundings.'},

  // ------------------------------------------------------- the surroundings
  {at: 78.1, atEn: 76.9, view: 'region', radius: 2000, rotate: false, spin: true, group: null,
   tr: 'Site, Beysukent ve Beytepe ormanlarına komşu.',
   en: 'The community borders the Beysukent and Beytepe forests,'},
  {at: 81.4, atEn: 80.7,
   tr: 'Yani doğanın hemen yanı başında bir yaşam.',
   en: 'which means life right next to nature.'},
  {at: 84.7, atEn: 83.9,
   tr: 'Beytepe ve Beysukent yalnızca birkaç dakika uzaklıkta.',
   en: 'Beytepe and Beysukent are only a few minutes away.'},
  {at: 89.0, atEn: 87.6, group: 0,
   tr: 'Hacettepe Üniversitesi Beytepe Kampüsü, Bilkent Üniversitesi ve Orta Doğu Teknik Üniversitesi kısa mesafede.',
   en: 'Hacettepe University’s Beytepe Campus, Bilkent University and Middle East Technical University are all close by.'},
  {at: 97.1, atEn: 95.3, group: 3,
   tr: 'Eskişehir Yolu üzerinden ise şehir merkezine, alışveriş merkezlerine, okullara ve hastanelere kolayca ulaşılıyor.',
   en: 'And via Eskişehir Road, the city centre, shopping centres, schools and hospitals are all easily accessible.'},
  {at: 101.6, atEn: 99.8, group: 1},
  {at: 104.7, atEn: 102.9, group: null,
   tr: 'Doğayla iç içe, güvenli ve prestijli bir yaşam…',
   en: 'A life surrounded by nature, secure and prestigious…'},

  // --------------------------------------------------------------- the villa
  {at: 108.3, atEn: 107.9, view: 'neighborhood', spin: false, rotate: false, azimuth: 0.95, photos: [],
   tr: 'Ve şimdi Angora Evleri’nin içindeki özel bir villaya doğru ilerliyoruz.',
   en: 'And now, we are heading towards a very special villa within Angora Evleri.'},
  {at: 113.0, atEn: 113.9, frame: 'villa', azimuth: 0.45, photos: [38],
   tr: 'Hatırlı Sokak, numara 10.',
   en: 'Hatırlı Street, number 10.'},
  {at: 115.2, atEn: 116.1, azimuth: 0.8, photos: [28],
   tr: 'Karşınızda Villa 21.',
   en: 'Welcome to Villa 21.'},
  {at: 117.9, atEn: 118.3, photos: [28, 55],
   tr: 'Yaklaşık 500 metrekare brüt, 400 metrekare net kullanım alanına sahip, asansörlü, müstakil bir villa.',
   en: 'A detached villa with an elevator, offering approximately 500 square metres of gross area and 400 square metres of net living space.'},
  // The lift gets its sentence here through the gallery rather than through a
  // camera move: three storey changes inside four seconds would be a lurch,
  // and the owner's own frames of the car say it better.
  {at: 126.8, atEn: 127.5,
   tr: 'Asansör, katlar arasında rahat ve konforlu bir bağlantı sunuyor.',
   en: 'The elevator provides an easy and comfortable connection between the floors.'},
  {at: 131.6, atEn: 132.6, rooms: ['mark:plot-ring'], frame: 'plot', polar: 0.17, azimuth: 0, photos: [25, 50],
   tr: 'Villayı 900 metrekarelik bir bahçe çevreliyor.',
   en: 'The villa is surrounded by a 900 square metre garden,'},
  {at: 135.4, atEn: 136.1, rooms: ['f0-site-pool'], frame: null, polar: null, azimuth: 3.05, photos: [53, 54, 24],
   tr: 'Meyve ağaçları, yeşil alanlar ve yaklaşık 50 metrekarelik özel bir havuz.',
   en: 'with fruit trees, green lawns and a private pool of approximately 50 square metres.'},
  {at: 140.6, atEn: 142.3, rooms: [], frame: 'villa', azimuth: 1.9, photos: [],
   tr: '5 yatak odası, 4 yaşam alanı, 3 banyo, bağımsız girişli bir müştemilat ve 3 araçlık otopark.',
   en: 'Five bedrooms, four living areas, three bathrooms, a staff annex with its own entrance, and parking for three cars.'},
  {at: 149.2, atEn: 150.8, azimuth: 0.55,
   tr: 'Evin kurgusunda önemli bir detay var.',
   en: 'There is an important detail in the layout of this home.'},
  {at: 152.1, atEn: 153.9, rooms: ['f1-Z01'], photos: [38, 37],
   tr: 'Sokaktan giriş, bodrumun bir üst seviyesindeki giriş katından yapılıyor.',
   en: 'The street entrance is on the entrance floor, one level above the lower ground floor.'},
  {at: 157.1, atEn: 159.7, rooms: ['f0-B06'], azimuth: 2.85, photos: [25, 51],
   tr: 'Arazinin eğimi sayesinde bodrum kat ise doğrudan bahçe ve havuz seviyesine açılıyor.',
   en: 'Thanks to the slope of the land, the lower ground floor opens directly onto the garden and the pool.'},

  // ------------------------------------------------------------- the basement
  {at: 163.4, atEn: 166.0, view: 'f0', rooms: [], frame: null, photos: [],
   tr: 'Turumuza da bu kattan, en alttan başlıyoruz.',
   en: 'And that is where our tour begins, from the lowest level.'},
  {at: 166.6, atEn: 170.0, photos: [47],
   tr: 'Bodrum kattayız. Ama burası alışık olduğunuz bir bodrum değil.',
   en: 'We are on the lower ground floor. But this is no ordinary basement.'},
  {at: 170.6, atEn: 174.1, rooms: ['f0-B06'], photos: [2, 3, 5],
   tr: 'Bahçeye ve havuza doğrudan açılan, gün ışığı alan ferah bir yaşam katı.',
   en: 'It is a bright and spacious living floor that opens directly onto the garden and the pool.'},
  {at: 175.6, atEn: 180.3, rooms: ['f0-B06', 'f0-B05'], photos: [1, 2],
   tr: 'Yaklaşık 54 metrekarelik geniş yaşam alanı, açık mutfağıyla birlikte kullanışlı bir bütün oluşturuyor.',
   en: 'The generous living area of approximately 54 square metres, together with its open-plan kitchen, forms a practical and welcoming space.'},
  {at: 182.7, atEn: 190.1, rooms: ['f0-site-pool'], photos: [53, 54, 51],
   tr: 'Havuz başında geçen yaz günleri, barbekülü bahçede açık hava yemekleri, kalabalık davetler…',
   en: 'Summer days by the pool, outdoor dining in the garden with its barbecue, large gatherings with family and friends…'},
  {at: 188.7, atEn: 197.6,
   tr: 'Hepsi için ideal.',
   en: 'This level is perfect for all of them.'},
  {at: 189.9, atEn: 200.6, rooms: ['f0-B02'], photos: [],
   tr: 'Bu katta ayrıca yaklaşık 27 metrekarelik, bağımsız girişli bir müştemilat bulunuyor.',
   en: 'This floor also features a staff annex of approximately 27 square metres with its own separate entrance.'},
  {at: 196.8, atEn: 207.9,
   tr: 'Kendi ayrı odası, banyosu ve tuvaleti olan bu bölüm, çalışanlar için ya da ihtiyaca göre farklı amaçlarla kullanılabilecek, evin ana yaşamından ayrı ve konforlu bir alan sunuyor.',
   en: 'With its own room, bathroom and toilet, this section offers a comfortable space set apart from the main living areas of the house, ideal for household staff or for any other purpose you may need.'},

  // --------------------------------------------------------- the ground floor
  {at: 208.6, atEn: 221.2, view: 'f1', rooms: [], photos: [42],
   tr: 'Şimdi bir üst kata, sokak seviyesindeki giriş katına çıkıyoruz.',
   en: 'Now we move up to the entrance floor, at street level.'},
  {at: 213.6, atEn: 225.1, rooms: ['f1-Z01', 'f1-Z02'], photos: [41, 40],
   tr: 'Girişten geçip yaklaşık 12 metrekarelik antreye adım atıyoruz.',
   en: 'Passing through the entrance, we step into a hallway of approximately 12 square metres,'},
  {at: 217.8, atEn: 230.1,
   tr: 'Buradan evin ana yaşam alanlarına açılıyoruz.',
   en: 'which leads us to the main living spaces of the house.'},
  {at: 221.0, atEn: 233.7, rooms: ['f1-Z06', 'f1-Z05'], photos: [4, 23],
   tr: 'Yaklaşık 53 metrekarelik salon ve yemek alanı, evin kalbi.',
   en: 'The living and dining room of approximately 53 square metres is the heart of the home.'},
  {at: 225.2, atEn: 240.0, rooms: ['f1-Z06'], photos: [4, 23],
   tr: 'Geniş pencerelerden gün ışığı içeri doluyor ve havuza bakan balkonu, bahçe manzarasını salonun bir parçası hâline getiriyor.',
   en: 'Natural light pours in through its large windows, and its balcony overlooking the pool brings the garden view right into the living room.'},
  {at: 234.2, atEn: 248.4, rooms: ['f1-Z04'], photos: [21, 22],
   tr: 'Yaklaşık 26 metrekarelik kapalı mutfak, kahvaltı köşesine yer verecek kadar geniş.',
   en: 'The separate kitchen of approximately 26 square metres is large enough to accommodate a breakfast corner.'},
  {at: 240.0, atEn: 255.6, rooms: ['f1-Z03', 'f1-Z08', 'f1-Z07'], photos: [39, 43, 44],
   tr: 'Katta ayrıca bir misafir tuvaleti, tesisat odası ve evin içinden doğrudan ulaşılan, yaklaşık 21 metrekarelik kapalı garaj bulunuyor.',
   en: 'This floor also features a guest toilet, a utility room, and a closed garage of approximately 21 square metres, accessible directly from inside the house.'},

  // ----------------------------------------------------------- the first floor
  // The lift, quickly: it is marked on the floor we leave and on the one we
  // arrive at, inside the sentence that names it, and the tour does not stop.
  {at: 249.2, atEn: 266.8, rooms: ['mark:lift-1'], frame: 'storey', photos: [42],
   tr: 'Asansörle ya da ferforje korkuluklu merdivenden birinci kata çıkıyoruz.',
   en: 'We go up to the first floor by elevator, or by the staircase with its elegant wrought-iron railings.'},
  {at: 251.4, atEn: 270.1, view: 'f2', rooms: ['mark:lift-2'], photos: [18, 34]},
  {at: 253.5, atEn: 273.2, rooms: [], frame: null, photos: [35],
   tr: 'Bu kat tamamen gece yaşamına ayrılmış.',
   en: 'This entire floor is dedicated to the private sleeping quarters.'},
  {at: 257.1, atEn: 276.8, rooms: ['f2-102', 'f2-103', 'f2-104'], photos: [19, 16, 32],
   tr: 'Yaklaşık 22 metrekarelik ebeveyn yatak odası, kendi giyinme odası ve yaklaşık sekiz buçuk metrekarelik ebeveyn banyosuyla gerçek bir süit.',
   en: 'The master bedroom of approximately 22 square metres, with its own dressing room and a master bathroom of approximately eight and a half square metres, forms a true suite.'},
  {at: 266.6, atEn: 287.8, rooms: ['f2-110'], azimuth: 2.95, photos: [],
   tr: 'Ve kendi balkonuna açılıyor.',
   en: 'And it opens onto its own balcony.'},
  {at: 269.2, atEn: 291.2, rooms: ['f2-106', 'f2-107', 'f2-108', 'f2-105'], azimuth: null, photos: [13, 30, 11],
   tr: 'Katta ayrıca yaklaşık 13 ve 12 metrekarelik iki yatak odası, ortak banyo ve yaklaşık 15 metrekarelik bir oturma alanı yer alıyor.',
   en: 'This floor also features two bedrooms of approximately 13 and 12 square metres, a shared bathroom, and a sitting area of approximately 15 square metres.'},
  // The corner balcony is the OTHER one: 110 hangs over the pool on the garden
  // side, 109 sits on the street corner, so they are looked at from opposite
  // bearings and cannot be taken for the same balcony.
  {at: 278.7, atEn: 302.4, rooms: ['f2-109'], azimuth: 0.15, photos: [],
   tr: 'Geniş köşe balkonu ise sabah kahvesi için en keyifli nokta olmaya aday.',
   en: 'The spacious corner balcony is sure to become the favourite spot for morning coffee.'},

  // ------------------------------------------------------------ the roof floor
  {at: 284.1, atEn: 307.6, view: 'f3', rooms: [], azimuth: null, photos: [29],
   tr: 'Merdivenle son kata, çatı katına çıkıyoruz.',
   en: 'We take the stairs up to the top level, the attic floor.'},
  {at: 287.3, atEn: 311.6, rooms: ['f3-C05', 'f3-C04', 'f3-C02', 'f3-C03'], photos: [9, 14, 15],
   tr: 'Yaklaşık 24 metrekarelik oturma alanı, yaklaşık 20 ve 10,5 metrekarelik iki yatak odası, banyo ve mini mutfağıyla bu kat, kendi içinde bağımsız bir yaşam sunuyor.',
   en: 'With a sitting area of approximately 24 square metres, two bedrooms of approximately 20 and 10 and a half square metres, a bathroom and a kitchenette, this floor offers an independent living space of its own.'},
  {at: 299.0, atEn: 325.4, rooms: [], photos: [10, 6],
   tr: 'Yetişkin çocuklar, uzun süreli misafirler ya da sessiz bir çalışma alanı arayanlar için mükemmel bir çözüm.',
   en: 'A perfect solution for grown-up children, long-term guests, or anyone looking for a quiet place to work.'},

  // ---------------------------------------------------------------- materials
  {at: 305.6, atEn: 334.5, photos: [8, 14],
   tr: 'Evin genelinde kullanılan malzemeler de bu sıcak ve klasik atmosferi tamamlıyor.',
   en: 'The materials used throughout the house complete its warm and classic atmosphere.'},
  {at: 311.5, atEn: 339.5, view: 'f2', rooms: ['f2-102', 'f2-105'], photos: [19, 33, 13],
   tr: 'Yaşam alanlarında ve yatak odalarında, yüksek parlaklıkta cilalı, maun tonlarında ahşap parke kullanılmış.',
   en: 'The living areas and bedrooms feature high-gloss, mahogany-toned hardwood flooring.'},
  {at: 318.4, atEn: 345.2, rooms: [], photos: [30, 12],
   tr: 'Derin kırmızı kahverengi rengi ve belirgin damar yapısıyla bu parke, mekânlara hem sıcaklık hem de zamansız bir şıklık katıyor.',
   en: 'With its deep reddish-brown colour and distinctive grain, this flooring brings both warmth and timeless elegance to every room.'},
  {at: 327.9, atEn: 353.7, view: 'f1', rooms: ['f1-Z04', 'f1-Z02', 'f1-Z07'], photos: [21, 40, 43],
   tr: 'Mutfaklarda, bodrum katta, garajda ve antrede ise bej ve toprak tonlarında, doğal taş görünümlü seramik karolar tercih edilmiş.',
   en: 'In the kitchens, the lower ground floor, the garage and the hallway, beige and earth-toned ceramic tiles with a natural stone look have been chosen.'},
  {at: 336.6, atEn: 363.9, rooms: [], photos: [44, 22],
   tr: 'Neme dayanıklı ve kolay temizlenen bu zemin, günlük kullanımın yoğun olduğu alanlarda pratiklik sağlıyor.',
   en: 'Moisture-resistant and easy to clean, this flooring offers practicality in the areas of heaviest daily use.'},

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
  {at: 343.7, atEn: 371.1, view: 'neighborhood', rooms: [], frame: 'villa',
   polar: 1.42, pad: 1.18, lens: 50, azimuth: 2.76, sweep: 1.26,
   hour: 21, windows: true, photos: [48, 49, 24],
   tr: 'İlk üç katı birbirine bağlayan asansör, 10 metreye 5 metre boyutunda kendine ait deposu olan özel havuz, 900 metrekarelik çift kotlu bahçe, bağımsız girişli müştemilat ve her kuşağa ayrı yaşam alanı sunan esnek bir kurgu.',
   en: 'An elevator connecting the first three floors, a private 10 by 5 metre pool with its own dedicated water tank, a 900 square metre garden on two levels, a staff annex with its own entrance, and a flexible layout offering separate living spaces for every generation.'},
  {at: 359.8, atEn: 388.6, photos: [25, 50, 36],
   tr: 'Bahçenin çevresindeki uzun ağaçlar ise tam bir mahremiyet garantilemektedir.',
   en: 'The tall trees surrounding the garden ensure complete privacy.'},
  {at: 364.8, atEn: 393.3, link: true, photos: [],
   tr: 'Çayyolu’nun kalbinde, Angora Evleri Hatırlı Sokak 10 numaradaki bu villa, 99 milyon Türk lirası fiyatıyla satışta.',
   en: 'Located in the heart of Çayyolu, at Hatırlı Street number 10 in Angora Evleri, this villa is offered for sale at 99 million Turkish lira.'},
  {at: 373.5, atEn: 403.2,
   tr: 'Ev krediye uygun, boş ve hemen teslime hazır.',
   en: 'The property is eligible for mortgage financing, vacant and ready for immediate handover.'},
  {at: 377.3, atEn: 409.5,
   tr: 'Bu emlak satış arayüzü, Lüksemburg merkezli MERGVS tarafından geliştirilmiştir.',
   en: 'This real estate sales interface was developed by Mergus, based in Luxembourg.'},
  {at: 382.5, atEn: 414.4,
   tr: 'Evi yerinde görmek ve satın alma süreciyle ilgili detaylı bilgi almak için ilan linkine tıklayarak RE/MAX satış temsilcisiyle iletişime geçebilirsiniz.',
   en: 'To view the property in person and receive detailed information about the purchasing process, please click on the listing link and get in touch with the Remax sales representative.'},
  {at: 391.4, atEn: 424.4,
   tr: 'Bu güzel aile evinin alıcısına şimdiden bol şans ve mutluluk getirmesini dileriz.',
   en: 'We wish the new owners of this beautiful family home every happiness and good fortune.'},
  {at: 398.3, atEn: 430.3,
   tr: 'Bizi dinlediğiniz için teşekkür ederiz.',
   en: 'Thank you for joining us.'},
];

// The state a cue leaves behind, so the driver can tell a reframe from a
// subtitle change. A field a cue omits is inherited - the camera holds the
// bearing it was given until a later sentence asks for another - and a field
// set to null or [] clears it.
export function resolveCues(cues = TOUR_CUES, lang = 'tr') {
  const speech = tourLang(lang);
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
    const at = cueTime(cue, speech);
    const until = cues[i + 1] ? cueTime(cues[i + 1], speech) : TOUR_DURATION[speech];
    return {...carried, at, tr, en, span: Math.max(0, until - at)};
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
