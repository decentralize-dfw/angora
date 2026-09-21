// R47 | The owner's listing text, kept whole and placed where it belongs.
//
// One source for every word of sales copy in the viewer. The overview and the
// schedule of features belong to the property sheet; each storey's paragraphs
// belong to that storey and appear only while it is the open floor; the
// location paragraph belongs to the Bölge scale. Nothing here is generated
// from the model - it is the listing, quoted - so the model's own measured
// figures stay in property-info.js where their provenance is stated.
export const LISTING = {
  tr: {
    kind: 'Villa',
    address: ['Çankaya / Mutlukent, Angora Evleri', 'Hatırlı Sokak No: 10'],
    price: '99.000.000 ₺',
    headline: 'Angora Evleri’nde havuzlu, asansörlü, 900 m² bahçeli müstakil villa',
    features: [
      '500 m² brüt alan', '400 m² net alan', '900 m² bahçe', '5+4 oda',
      '3 banyo + 2 misafir WC', '4 kat', '2 balkon', 'Özel havuz',
      'Kapalı garaj + açık otopark (3 araç)', 'Asansör', 'Müştemilat',
    ],
    overview: [
      'Ankara’nın en köklü ve en çok tercih edilen villa yerleşimlerinden biri olan Angora Evleri’nde, Hatırlı Sokak’ta konumlanan bu müstakil villa; 900 m²’lik bahçesi, özel havuzu ve ferah yaşam alanlarıyla ayrıcalıklı bir yaşam sunuyor.',
      'Yaklaşık 500 m² brüt ve 400 m² net kullanım alanına sahip villa, asansörle birbirine bağlanan dört kattan oluşuyor. Sokaktan giriş kotu, bodrumun bir üst seviyesindeki giriş katıdır; arazinin eğimi sayesinde bodrum kat doğrudan bahçe ve havuz seviyesine açılır. Böylece giriş katı günlük yaşam ve ağırlama için, bodrum kat ise bahçe ve havuz yaşamı için birbirinden ayrışan iki ayrı yaşam katı sunar.',
    ],
    sections: [
      {title: 'Bahçe ve havuz', body: [
        'Villayı çevreleyen 900 m²’lik bahçe, yeşil alanları ve meyve ağaçlarıyla şehrin içinde huzurlu bir yeşil vaha yaratır. Bodrum katla aynı seviyede yer alan özel havuz, bahçeyle bütünleşen dış mekân yaşamının merkezidir.',
      ]},
      {title: 'Konfor ve donanım', body: [
        'Villa öne çıkan şu özelliklere sahiptir: dört katı birbirine bağlayan asansör, doğalgaz kombi ile ısıtma, 6 tonluk su deposu, özel havuz, 900 m² bahçe, üç araçlık açık ve kapalı otopark, bağımsız girişli müştemilat, iki balkon, her katta ayrı oturma alanı ve toplam üç mutfak.',
        'Esnek kat kurgusu, geniş hacimleri ve havuzlu bahçesiyle bu villa, 5 yatak odası ve 4 yaşam alanıyla Ankara’nın en prestijli konut bölgelerinden birinde nadir bulunan bir yaşam fırsatı sunuyor.',
      ]},
    ],
    deed: 'Tapu durumu: Kat mülkiyetli tapu · Ada 18.967, Parsel 2 · Krediye uygundur · Boş, hemen teslim.',
    floors: [
      {title: 'Bodrum kat: havuz ve bahçe katı', body: [
        'Bodrum kat, villanın bahçe ve havuzla aynı seviyede yer alan katıdır. Yaklaşık 54 m²’lik geniş salonu ve mutfağıyla kendi başına tam bir yaşam alanı oluşturur ve doğrudan yaklaşık 50 m² su yüzeyine sahip özel havuza ve bahçeye açılır. Yaz aylarında havuz başı yaşam, açık hava yemekleri ve davetler için ideal bir kurguya sahiptir.',
        'Katta ayrıca hol, misafir WC’si ve yaklaşık 27 m²’lik, bağımsız girişli müştemilat yer alır. Müştemilat; misafir odası, çalışan odası ya da ofis olarak rahatlıkla değerlendirilebilir.',
      ]},
      {title: 'Giriş katı: yaşamın merkezi', body: [
        'Sokak seviyesindeki giriş katı, giriş holü ve yaklaşık 12 m²’lik antre üzerinden ana yaşam alanlarına açılır.',
        'Yaklaşık 53 m²’lik salon, yemek alanıyla birlikte evin kalbini oluşturur. Geniş pencerelerle gün ışığı alan salon, havuza bakan balkonuyla bahçe manzarasını iç mekâna taşır.',
        'Yaklaşık 26 m²’lik kapalı mutfak, kahvaltı köşesine yer verecek genişliktedir. Katta ayrıca misafir WC’si, tesisat odası ve iç bağlantılı, yaklaşık 21 m²’lik kapalı garaj bulunur.',
        'Katlar arası bağlantıyı asansörün yanı sıra ferforje korkuluklu merdiven sağlar.',
      ]},
      {title: 'Birinci kat: ebeveyn süiti ve yatak odaları', body: [
        'Birinci kat tamamen gece yaşamına ayrılmıştır.',
        'Yaklaşık 22 m²’lik ebeveyn yatak odası, yaklaşık 7,5 m²’lik giyinme odası ve yaklaşık 8,5 m²’lik ebeveyn banyosuyla konforlu bir süit oluşturur ve balkona açılır. Katta ayrıca yaklaşık 13 m² ve 12 m²’lik iki yatak odası, yaklaşık 8 m²’lik ortak banyo, kat holü ve yaklaşık 15 m²’lik oturma alanı yer alır. Geniş köşe balkonu bahçe manzarasının keyfini çıkarmak için idealdir.',
      ]},
      {title: 'Çatı katı: bağımsız yaşam imkânı', body: [
        'Çatı katı; yaklaşık 24 m²’lik oturma alanı, yaklaşık 20 m² ve 10,5 m²’lik iki yatak odası, banyo ve mini mutfağıyla kendi içinde bağımsız bir yaşam alanı sunar. Yetişkin çocuklar, misafirler ya da ev ofisi ihtiyacı için mükemmel bir çözümdür.',
      ]},
    ],
    location: 'Çankaya’nın Mutlukent Mahallesi’nde, Angora Evleri içinde yer alan villa, Eskişehir Yolu’na yakınlığı sayesinde şehrin önemli merkezlerine kolay ulaşım imkânı sağlar.',
    region: {
      set: 'Çayyolu · Mutlukent · Çankaya, Ankara',
      body: [
        'Angora Evleri, Çankaya’nın Çayyolu bölgesinde, Mutlukent Mahallesi sınırları içinde yer alan alçak yoğunluklu bir villa yerleşimidir. Planlı sokak dokusu, olgun bahçeleri ve kendi içine dönük düzeniyle Ankara’nın en köklü villa adreslerinden biridir.',
        'Hacettepe Beytepe kampüsünün yeşili yerleşkenin hemen komşusudur; Eskişehir Yolu ve Bilkent bağlantısı sayesinde şehrin önemli merkezlerine ulaşım dakikalarla ölçülür. Günlük ihtiyaçlar Çayyolu’nun çarşı ve alışveriş hattında karşılanır.',
      ],
    },
  },
  en: {
    kind: 'Detached villa',
    address: ['Çankaya / Mutlukent, Angora Evleri', 'Hatırlı Sokak No: 10'],
    price: '₺99,000,000',
    headline: 'A detached villa in Angora Evleri with its own pool, a lift and a 900 m² garden',
    features: [
      '500 m² gross', '400 m² net', '900 m² garden', '5 + 4 rooms',
      '3 bathrooms + 2 guest WCs', '4 floors', '2 balconies', 'Private pool',
      'Garage + open parking (3 cars)', 'Lift', 'Annexe',
    ],
    overview: [
      'In Angora Evleri — one of Ankara’s oldest and most sought-after villa settlements — this detached house on Hatırlı Sokak offers a 900 m² garden, its own pool and generous living space.',
      'With about 500 m² gross and 400 m² net, the villa has four floors linked by a lift. The street door is on the ground floor, one level above the basement; because the site falls away, the basement opens straight onto the garden and the pool. The ground floor is therefore for daily life and entertaining, and the basement for garden and pool life — two separate living levels.',
    ],
    sections: [
      {title: 'Garden and pool', body: [
        'The 900 m² garden wrapping the villa, with its lawns and fruit trees, makes a calm green pocket inside the city. The private pool, on the same level as the basement, is the centre of outdoor life.',
      ]},
      {title: 'Comfort and equipment', body: [
        'The villa’s notable features: a lift linking all four floors, gas combi heating, a 6-tonne water tank, a private pool, a 900 m² garden, covered and open parking for three cars, an annexe with its own entrance, two balconies, a sitting area on every floor and three kitchens in all.',
        'With its flexible floor plan, generous volumes and garden with a pool, this house — five bedrooms and four living spaces — is a rare opportunity in one of Ankara’s most prestigious residential areas.',
      ]},
    ],
    deed: 'Title: full condominium title · Block 18,967, Parcel 2 · Mortgage eligible · Vacant, immediate handover.',
    floors: [
      {title: 'Basement: the pool and garden floor', body: [
        'The basement sits level with the garden and the pool. With a living room of about 54 m² and its own kitchen it is a complete home in itself, opening straight onto the garden and the private pool of roughly 50 m² of water. In summer it is laid out for poolside life, outdoor meals and entertaining.',
        'The floor also holds a hall, a guest WC and an annexe of about 27 m² with its own entrance — easily used as a guest room, a staff room or an office.',
      ]},
      {title: 'Ground floor: the centre of the house', body: [
        'At street level, the ground floor opens into the main living spaces through the entrance and an entry hall of about 12 m².',
        'The living room of about 53 m², together with the dining area, is the heart of the house. Daylight comes through wide windows, and the balcony over the pool brings the garden into the room.',
        'The enclosed kitchen of about 26 m² is wide enough for a breakfast corner. The floor also has a guest WC, a utility room and an internally connected garage of about 21 m².',
        'Besides the lift, a staircase with wrought-iron balustrades links the floors.',
      ]},
      {title: 'First floor: the primary suite and bedrooms', body: [
        'The first floor is given over entirely to the night rooms.',
        'The primary bedroom of about 22 m², with a dressing room of about 7.5 m² and an en-suite bathroom of about 8.5 m², makes a comfortable suite and opens onto a balcony. The floor also has two bedrooms of about 13 m² and 12 m², a family bathroom of about 8 m², a landing and a sitting area of about 15 m². The wide corner balcony is made for the garden view.',
      ]},
      {title: 'Attic floor: an independent home', body: [
        'The attic — a sitting area of about 24 m², two bedrooms of about 20 m² and 10.5 m², a bathroom and a kitchenette — is a self-contained home. It suits grown children, guests or a home office.',
      ]},
    ],
    location: 'In Çankaya’s Mutlukent district, inside Angora Evleri, the villa is close to the Eskişehir road, which puts the city’s main centres within easy reach.',
    region: {
      set: 'Çayyolu · Mutlukent · Çankaya, Ankara',
      body: [
        'Angora Evleri is a low-density villa settlement in Çankaya’s Çayyolu, within the Mutlukent district. Its planned street fabric, mature gardens and inward-facing layout make it one of Ankara’s oldest established villa addresses.',
        'The green of the Hacettepe Beytepe campus borders the settlement; the Eskişehir road and the Bilkent link put the city’s main centres minutes away, and daily needs are met along Çayyolu’s shopping streets.',
      ],
    },
  },
};
export const listing = lang => LISTING[lang] ?? LISTING.tr;
