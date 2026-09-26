// Statik içerik sayfalarını ÜRETİR - elle yazılmaz, çünkü her rakam
// viewer/src/listing.js (RE/MAX P56131836), viewer/src/photo-points.js ve
// viewer/src/region-places.json'dan gelir. Kaynak değişirse sayfalar da
// değişir; ikisinin ayrışmasını viewer/tests/seo-pages.test.mjs yakalar.
//
//   node tools/seo/build-seo-pages.mjs
//
// NEDEN AYRI SAYFA: ana sayfa bir WebGL uygulaması - ağır, tek konu ve tek
// URL. Arama motoru her sorguya tek sayfa gösterir; kat planı arayan da,
// muhit soran da, fotoğraf arayan da aynı 26 MB'lık 3B sahneye düşüyordu.
// Bu sayfalar JS'siz, birkaç KB ve kendi konularında DOLU - uydurma içerikle
// şişirilmiş "doorway" sayfa DEĞİL: her cümlenin arkasında ya ilan metni ya
// ölçülmüş donatı verisi var. İçi boş sayfa üretmek Google tarafından
// cezalandırılır ve istenenin tam tersini yapardı.
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {LISTING} from '../../viewer/src/listing.js';
import {PHOTO_POINTS} from '../../viewer/src/photo-points.js';

const ROOT = new URL('../../', import.meta.url);
const SITE = 'https://angora.mergvs.com';
const tr = LISTING.tr;
const places = JSON.parse(readFileSync(new URL('viewer/src/region-places.json', ROOT), 'utf8'));
const GEO = {lat: places.center.lat.toFixed(7), lon: places.center.lon.toFixed(7)};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Sayfalar arası gezinme: her sayfa diğerlerine bağlanır, böylece hem
// kullanıcı hem tarayıcı sitede dolaşır ve otorite sayfalara dağılır.
const NAV_TR = [
  {href: '/', label: '3B Villa Turu'},
  {href: '/kat-planlari.html', label: 'Kat Planları'},
  {href: '/galeri.html', label: 'Fotoğraf Galerisi'},
  {href: '/angora-evleri-rehberi.html', label: 'Angora Evleri Rehberi'},
  {href: '/sikca-sorulan-sorular.html', label: 'Sıkça Sorulan Sorular'},
];
const NAV_EN = [
  {href: '/?lang=en', label: '3D Villa Tour'},
  {href: '/en/floor-plans.html', label: 'Floor Plans'},
  {href: '/en/photo-gallery.html', label: 'Photo Gallery'},
  {href: '/en/angora-evleri-guide.html', label: 'Angora Evleri Guide'},
  {href: '/en/faq.html', label: 'FAQ'},
];

const CSS = `:root{--ink:#1b2420;--muted:#5d6b63;--line:#dfe5df;--bg:#f7f8f6;--accent:#2f4f3e}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);
font:16px/1.65 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
a{color:var(--accent)}.wrap{max-width:820px;margin:0 auto;padding:0 20px}
header.site{border-bottom:1px solid var(--line);background:#fff}
header.site .wrap{display:flex;flex-wrap:wrap;gap:14px;align-items:center;padding-top:14px;padding-bottom:14px}
.brand{font-weight:700;letter-spacing:.24em;font-size:12px;text-decoration:none;color:var(--ink)}
nav.site a{font-size:14px;margin-right:14px;text-decoration:none}
nav.site a[aria-current=page]{font-weight:700;text-decoration:underline}
h1{font-size:30px;line-height:1.25;margin:28px 0 8px}
h2{font-size:21px;margin:30px 0 8px}h3{font-size:17px;margin:22px 0 6px}
p{margin:0 0 14px}ul{margin:0 0 16px;padding-left:20px}li{margin:4px 0}
.lede{font-size:18px;color:var(--muted)}
.crumbs{font-size:13px;color:var(--muted);margin:14px 0 0}.crumbs a{color:var(--muted)}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:18px 0 24px;padding:0;list-style:none}
.facts li{background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin:0;font-size:14px}
table{width:100%;border-collapse:collapse;margin:0 0 18px;font-size:15px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line)}th{color:var(--muted);font-weight:600}
.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;padding:0;list-style:none;margin:0 0 24px}
.gallery li{margin:0}.gallery img{width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:10px;background:#e7ebe7}
.gallery figcaption{font-size:13px;color:var(--muted);margin-top:5px}
.cta{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600;margin:6px 10px 6px 0}
.cta.ghost{background:#fff;color:var(--accent);border:1px solid var(--accent)}
footer.site{border-top:1px solid var(--line);margin-top:44px;padding:22px 0 40px;font-size:14px;color:var(--muted);background:#fff}
footer.site a{margin-right:14px}
.note{font-size:13px;color:var(--muted);border-left:3px solid var(--line);padding-left:12px}
@media(max-width:640px){h1{font-size:25px}.wrap{padding:0 16px}}`;

function page({slug, title, description, h1, lede, body, extraLd = [], keywords, lang = 'tr', alt}) {
  const url = `${SITE}/${slug}`;
  const crumbs = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {'@type': 'ListItem', position: 1, name: 'Angora 21 · 3B Villa Turu', item: SITE + '/'},
      {'@type': 'ListItem', position: 2, name: h1, item: url},
    ],
  };
  const ld = {'@context': 'https://schema.org', '@graph': [crumbs, ...extraLd]};
  // hreflang çifti: aynı içeriğin TR ve EN hâli birbirini gösterir, yoksa
  // Google ikisini kopya sanıp birini eler.
  const hreflang = alt ? `<link rel="alternate" hreflang="tr" href="${SITE}/${lang === 'tr' ? slug : alt}" />
<link rel="alternate" hreflang="en" href="${SITE}/${lang === 'en' ? slug : alt}" />
<link rel="alternate" hreflang="x-default" href="${SITE}/${lang === 'tr' ? slug : alt}" />
` : '';
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
${keywords ? `<meta name="keywords" content="${esc(keywords)}" />\n` : ''}<link rel="canonical" href="${url}" />
${hreflang}<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
<meta name="geo.region" content="TR-06" />
<meta name="geo.placename" content="Mutlukent, Çankaya, Ankara" />
<meta name="geo.position" content="${GEO.lat};${GEO.lon}" />
<meta name="ICBM" content="${GEO.lat}, ${GEO.lon}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="MERGVS · Angora 21" />
<meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'tr_TR'}" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${SITE}/og-cover.jpg" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<header class="site"><div class="wrap">
  <a class="brand" href="/">MERGVS · ANGORA 21</a>
  <nav class="site" aria-label="${lang === 'en' ? 'Site navigation' : 'Site gezinmesi'}">${(lang === 'en' ? NAV_EN : NAV_TR).map(n =>
    `<a href="${n.href}"${('/' + slug) === n.href ? ' aria-current="page"' : ''}>${n.label}</a>`).join('')}</nav>
</div></header>
<main class="wrap">
  <p class="crumbs"><a href="${lang === 'en' ? '/?lang=en' : '/'}">Angora 21</a> › ${esc(h1)}</p>
  <h1>${esc(h1)}</h1>
  <p class="lede">${esc(lede)}</p>
${body}
  <p><a class="cta" href="${lang === 'en' ? '/?lang=en' : '/'}">${lang === 'en' ? 'Explore the villa in 3D →' : 'Villayı 3B modelde gez →'}</a><a class="cta ghost" href="https://remax.com.tr/tr/portfoy/P56131836" target="_blank" rel="noopener">${lang === 'en' ? 'Open the sales listing ↗' : 'Satış ilanını aç ↗'}</a></p>
</main>
<footer class="site"><div class="wrap">
  <p>${(lang === 'en' ? NAV_EN : NAV_TR).map(n => `<a href="${n.href}">${n.label}</a>`).join('')}</p>
  <p>${esc((lang === 'en' ? LISTING.en : tr).address.join(' · '))} · Ankara · MERGVS</p>
  <p class="note">${lang === 'en' ? 'Areas and features are from RE/MAX listing P56131836.' : 'İlan alanları ve özellikleri RE/MAX P56131836 kaynağındandır.'}</p>
  <p><a href="${lang === 'en' ? '/' : '/en/floor-plans.html'}">${lang === 'en' ? 'Türkçe' : 'English'}</a></p>
</div></footer>
</body>
</html>`;
}

const out = [];
const write = (slug, html) => {
  if (slug.includes('/')) mkdirSync(new URL(slug.slice(0, slug.lastIndexOf('/')), ROOT), {recursive: true});
  writeFileSync(new URL(slug, ROOT), html); out.push(slug);
};

/* ---------------- 1. KAT PLANLARI ---------------- */
write('kat-planlari.html', page({
  slug: 'kat-planlari.html', alt: 'en/floor-plans.html',
  title: 'Kat Planları · 4 Katlı Müstakil Villa · Angora Evleri, Çankaya Ankara',
  description: 'Angora Evleri Hatırlı Sokak\'taki müstakil villanın dört katı: bodrum havuz katı, giriş katı, ebeveyn süitli birinci kat ve bağımsız çatı katı. Oda oda m² değerleriyle.',
  keywords: 'villa kat planı, 4 katlı villa, Angora Evleri kat planı, ebeveyn süiti, müştemilat, Ankara villa oda ölçüleri',
  h1: 'Kat Planları: Dört Kat, Oda Oda',
  lede: `${tr.features[0]}, ${tr.features[1]}. Dört kat asansörle birbirine bağlı; arazinin eğimi sayesinde bodrum doğrudan bahçe ve havuz seviyesine açılıyor.`,
  body: `  <ul class="facts">${tr.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
${tr.floors.map(f => `  <h2>${esc(f.title)}</h2>\n${f.body.map(p => `  <p>${esc(p)}</p>`).join('\n')}`).join('\n')}
  <h2>Tapu ve teslim</h2>
  <p>${esc(tr.deed)}</p>
  <h2>Katları 3B modelde gezin</h2>
  <p>Planı okumak yerine içinde yürümek isterseniz, villanın dört katı da etkileşimli 3B modelde açık: kat seçip odaları dolaşabilir, gün ışığını saatine göre değiştirebilir ve 360° oda turuna girebilirsiniz.</p>`,
  extraLd: [{'@type': 'WebPage', '@id': SITE + '/kat-planlari.html',
    about: {'@id': SITE + '/#villa'}, inLanguage: 'tr-TR'}],
}));

/* ---------------- 2. GALERİ ---------------- */
const photos = PHOTO_POINTS.filter(p => p.file);
const FLOOR_NAME = ['Bodrum kat · havuz ve bahçe', 'Giriş katı', 'Birinci kat', 'Çatı katı'];
const groups = new Map();
for (const p of photos) {
  const key = p.outdoor ? 'Bahçe, havuz ve dış cephe' : (FLOOR_NAME[p.floor] ?? 'Villa');
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(p);
}
write('galeri.html', page({
  slug: 'galeri.html', alt: 'en/photo-gallery.html',
  title: `Fotoğraf Galerisi · ${photos.length} Fotoğraf · Angora Evleri'nde Satılık Villa`,
  description: `Angora Evleri Hatırlı Sokak'taki müstakil villanın ${photos.length} fotoğrafı: salon, mutfak, ebeveyn süiti, banyolar, havuz, bahçe, garaj ve müştemilat. Her kare hangi odada çekildiği yazılı.`,
  keywords: 'Angora Evleri villa fotoğrafları, Ankara satılık villa iç mekan, havuzlu villa fotoğraf, villa salon mutfak yatak odası',
  h1: `Villanın ${photos.length} Fotoğrafı`,
  lede: 'Her fotoğrafın altında hangi katta ve hangi odada çekildiği yazıyor. Aynı noktaları 3B modelde de gezebilirsiniz.',
  body: [...groups.entries()].map(([name, list]) => `  <h2>${esc(name)} (${list.length})</h2>
  <ul class="gallery">${list.map(p => {
    const caption = `${p.tr} · Angora Evleri'nde satılık villa`;
    return `<li><figure><img src="/photogallery/${esc(p.file)}" width="800" height="600" loading="lazy" decoding="async" alt="${esc(caption)}" /><figcaption>${esc(p.tr)}</figcaption></figure></li>`;
  }).join('')}</ul>`).join('\n'),
  extraLd: [{'@type': 'ImageGallery', '@id': SITE + '/galeri.html', inLanguage: 'tr-TR',
    about: {'@id': SITE + '/#villa'},
    image: photos.slice(0, 30).map(p => ({'@type': 'ImageObject',
      contentUrl: `${SITE}/photogallery/${p.file}`, caption: `${p.tr} · Angora Evleri'nde satılık villa`}))}],
}));

/* ---------------- 3. ANGORA EVLERİ REHBERİ ---------------- */
const curated = (places.curated ?? []).slice().sort((a, b) => a.d - b.d);
const CATEGORY_TR = {
  public_transport: 'Ulaşım', education_research: 'Eğitim', parks_recreation: 'Park ve yeşil alan',
  food_drink: 'Yeme içme', sport: 'Spor', retail: 'Alışveriş', mobility_parking: 'Otopark',
  religion: 'İbadet', health: 'Sağlık', business_services: 'Hizmet', finance: 'Finans',
};
write('angora-evleri-rehberi.html', page({
  slug: 'angora-evleri-rehberi.html', alt: 'en/angora-evleri-guide.html',
  title: 'Angora Evleri Rehberi · Çayyolu, Mutlukent, Çankaya Ankara · Villa Yerleşimi',
  description: 'Angora Evleri nerede, neden tercih edilir? Çankaya Çayyolu\'ndaki bu villa yerleşiminin konumu, ulaşımı, okulları ve çevresindeki donatılar — Hatırlı Sokak\'a yürüme mesafesiyle.',
  keywords: 'Angora Evleri nerede, Angora Evleri Ankara, Çayyolu villa, Mutlukent Mahallesi, Çankaya villa sitesi, Beytepe, Eskişehir Yolu, Ankara villa bölgesi',
  h1: 'Angora Evleri Rehberi: Çayyolu · Mutlukent · Çankaya',
  lede: tr.region.set,
  body: `${tr.region.body.map(p => `  <p>${esc(p)}</p>`).join('\n')}
  <h2>Konum</h2>
  <p>${esc(tr.location)}</p>
  <h2>Yürüme mesafesindeki donatılar</h2>
  <p>Aşağıdaki mesafeler Hatırlı Sokak No: 10'dan kuş uçuşu ölçülmüştür. Liste, villanın ${places.radius_m} m yarıçapındaki ${places.named} isimli donatıdan derlenen seçkidir.</p>
  <table>
    <thead><tr><th>Yer</th><th>Tür</th><th>Mesafe</th></tr></thead>
    <tbody>${curated.map(c => `<tr><td>${esc(c.name)}</td><td>${esc(CATEGORY_TR[c.category] ?? c.kind)}</td><td>${c.d} m</td></tr>`).join('')}</tbody>
  </table>
  <p class="note">Kaynak: ${esc(places.source)} · ${esc(places.atlas_generated_at)}. Toplam ${places.total} nokta tarandı, ${places.named} tanesi isimli.</p>
  <h2>Bu yerleşimde satılık villa</h2>
  <p>${esc(tr.overview[0])}</p>`,
  extraLd: [{'@type': 'Place', '@id': SITE + '/#angora-evleri-rehber', name: 'Angora Evleri',
    description: tr.region.body[0],
    geo: {'@type': 'GeoCoordinates', latitude: Number(GEO.lat), longitude: Number(GEO.lon)},
    address: {'@type': 'PostalAddress', addressLocality: 'Çankaya', addressRegion: 'Ankara', addressCountry: 'TR'},
    containsPlace: curated.map(c => ({'@type': 'Place', name: c.name}))}],
}));

/* ---------------- 4. SSS ---------------- */
// Her cevap ilan metnindeki bir cümleye dayanır; uydurma soru-cevap yok.
const FAQ = [
  ['Angora Evleri\'ndeki bu villa nerede?', `Villa, ${tr.address[0]}, ${tr.address[1]} adresindedir. Çankaya'nın Çayyolu bölgesinde, Mutlukent Mahallesi sınırları içindeki Angora Evleri yerleşimindedir.`],
  ['Villanın alanı ne kadar?', `${tr.features[0]} ve ${tr.features[1]}. Ayrıca ${tr.features[2]} bulunur.`],
  ['Kaç oda ve kaç kat?', `${tr.features[3]}, ${tr.features[5]}. Katlar asansörle birbirine bağlıdır ve her katta ayrı bir oturma alanı vardır.`],
  ['Kaç banyo var?', `${tr.features[4]}.`],
  ['Havuz var mı?', 'Evet, bodrum katla aynı seviyede yer alan özel bir havuz var. Yaklaşık 50 m² su yüzeyine sahip ve doğrudan bahçeye açılıyor.'],
  ['Otopark ve garaj durumu nedir?', `${tr.features[8]}. Garaj giriş katıyla iç bağlantılıdır ve yaklaşık 21 m²'dir.`],
  ['Isıtma nasıl?', 'Isıtma doğalgaz kombi iledir. Villada ayrıca 6 tonluk su deposu bulunur.'],
  ['Müştemilat var mı?', 'Evet. Bodrum katta yaklaşık 27 m²\'lik, bağımsız girişli bir müştemilat var; misafir odası, çalışan odası ya da ofis olarak kullanılabilir.'],
  ['Tapu durumu nedir, krediye uygun mu?', tr.deed],
  ['Fiyatı ne kadar?', `İlan fiyatı ${tr.price}. Güncel durum için RE/MAX P56131836 ilanına bakabilirsiniz.`],
  ['Villayı yerinde görmeden gezebilir miyim?', 'Evet. Villanın dört katı da etkileşimli 3B modelde açık: kat seçip odaları dolaşabilir, gün ışığını saatine göre değiştirebilir, 360° oda turuna girebilir ve fotoğrafları odalarıyla birlikte görebilirsiniz.'],
];
write('sikca-sorulan-sorular.html', page({
  slug: 'sikca-sorulan-sorular.html', alt: 'en/faq.html',
  title: 'Sıkça Sorulan Sorular · Angora Evleri\'nde Satılık Villa · Çankaya Ankara',
  description: 'Angora Evleri Hatırlı Sokak\'taki satılık müstakil villa hakkında sık sorulanlar: alan, oda sayısı, kat, havuz, otopark, ısıtma, tapu durumu ve fiyat.',
  keywords: 'Angora Evleri villa fiyat, satılık villa tapu durumu, villa kaç oda, havuzlu villa Ankara, villa krediye uygun mu',
  h1: 'Sıkça Sorulan Sorular',
  lede: 'Villayla ilgili en çok sorulanlar ve ilan kaynağındaki cevapları.',
  body: FAQ.map(([q, a]) => `  <h2>${esc(q)}</h2>\n  <p>${esc(a)}</p>`).join('\n'),
  extraLd: [{'@type': 'FAQPage', '@id': SITE + '/sikca-sorulan-sorular.html', inLanguage: 'tr-TR',
    mainEntity: FAQ.map(([q, a]) => ({'@type': 'Question', name: q,
      acceptedAnswer: {'@type': 'Answer', text: a}}))}],
}));

/* ---------------- İNGİLİZCE SAYFALAR ----------------
   Ankara'da yabancı alıcı/kiracı kitlesi gerçek (elçilikler, üniversiteler,
   kurumsal atamalar) ve "villa for sale Ankara" sorgusunda Türkçe sayfa
   çıkmaz. Metin uydurulmuyor: LISTING.en zaten ürün sahibinin ilanının
   İngilizcesi. TR/EN sayfalar hreflang ile eşlenir, yoksa Google ikisini
   kopya sanıp birini eler.                                              */
const en = LISTING.en;
const enCurated = curated;

write('en/floor-plans.html', page({
  slug: 'en/floor-plans.html', alt: 'kat-planlari.html', lang: 'en',
  title: 'Floor Plans · Four-Storey Detached Villa · Angora Evleri, Ankara',
  description: 'The four floors of the detached villa on Hatırlı Sokak in Angora Evleri, Ankara: basement pool floor, ground floor, primary-suite first floor and a self-contained attic. Room by room, with areas.',
  keywords: 'villa floor plan Ankara, four storey villa, Angora Evleri floor plan, detached house Ankara layout',
  h1: 'Floor Plans: Four Storeys, Room by Room',
  lede: `${en.features[0]}, ${en.features[1]}. Four floors linked by a lift; because the site falls away, the basement opens straight onto the garden and the pool.`,
  body: `  <ul class="facts">${en.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
${en.floors.map(f => `  <h2>${esc(f.title)}</h2>\n${f.body.map(x => `  <p>${esc(x)}</p>`).join('\n')}`).join('\n')}
  <h2>Title deed and handover</h2>
  <p>${esc(en.deed)}</p>`,
  extraLd: [{'@type': 'WebPage', '@id': SITE + '/en/floor-plans.html', about: {'@id': SITE + '/#villa'}, inLanguage: 'en'}],
}));

write('en/photo-gallery.html', page({
  slug: 'en/photo-gallery.html', alt: 'galeri.html', lang: 'en',
  title: `Photo Gallery · ${photos.length} Photographs · Villa for Sale in Angora Evleri, Ankara`,
  description: `${photos.length} photographs of the detached villa on Hatırlı Sokak, Angora Evleri: living rooms, kitchens, the primary suite, bathrooms, the pool, the garden, the garage and the annexe.`,
  keywords: 'Ankara villa photos, villa for sale Ankara interior, house with pool Ankara pictures',
  h1: `${photos.length} Photographs of the Villa`,
  lede: 'Each photograph names the floor and the room it was taken in. You can walk the same points in the 3D model.',
  body: [...groups.entries()].map(([name, list]) => {
    const enName = list[0].outdoor ? 'Garden, pool and exterior' : (['Basement · pool and garden', 'Ground floor', 'First floor', 'Attic floor'][list[0].floor] ?? 'Villa');
    return `  <h2>${esc(enName)} (${list.length})</h2>
  <ul class="gallery">${list.map(p => `<li><figure><img src="/photogallery/${esc(p.file)}" width="800" height="600" loading="lazy" decoding="async" alt="${esc(p.en + ' · villa for sale in Angora Evleri, Ankara')}" /><figcaption>${esc(p.en)}</figcaption></figure></li>`).join('')}</ul>`;
  }).join('\n'),
  extraLd: [{'@type': 'ImageGallery', '@id': SITE + '/en/photo-gallery.html', inLanguage: 'en',
    about: {'@id': SITE + '/#villa'},
    image: photos.slice(0, 30).map(p => ({'@type': 'ImageObject',
      contentUrl: `${SITE}/photogallery/${p.file}`, caption: `${p.en} · villa for sale in Angora Evleri, Ankara`}))}],
}));

write('en/angora-evleri-guide.html', page({
  slug: 'en/angora-evleri-guide.html', alt: 'angora-evleri-rehberi.html', lang: 'en',
  title: 'Angora Evleri Guide · Çayyolu, Mutlukent, Çankaya · Ankara Villa Settlement',
  description: 'Where is Angora Evleri and why do people choose it? The location, transport, schools and amenities around this low-density villa settlement in Çankaya, Ankara — with walking distances from Hatırlı Sokak.',
  keywords: 'Angora Evleri Ankara, Cayyolu villas, Mutlukent, Çankaya villa settlement, living in Ankara villa',
  h1: 'Angora Evleri Guide: Çayyolu · Mutlukent · Çankaya',
  lede: en.region.set,
  body: `${en.region.body.map(x => `  <p>${esc(x)}</p>`).join('\n')}
  <h2>Location</h2>
  <p>${esc(en.location)}</p>
  <h2>Amenities within walking distance</h2>
  <p>Distances are straight-line from Hatırlı Sokak No: 10, drawn from ${places.named} named amenities within ${places.radius_m} m of the villa.</p>
  <table><thead><tr><th>Place</th><th>Distance</th></tr></thead>
  <tbody>${enCurated.map(c => `<tr><td>${esc(c.name)}</td><td>${c.d} m</td></tr>`).join('')}</tbody></table>
  <p class="note">Source: ${esc(places.source)} · ${esc(places.atlas_generated_at)}.</p>`,
  extraLd: [{'@type': 'Place', '@id': SITE + '/en/#angora-evleri', name: 'Angora Evleri',
    description: en.region.body[0],
    geo: {'@type': 'GeoCoordinates', latitude: Number(GEO.lat), longitude: Number(GEO.lon)}}],
}));

const FAQ_EN = [
  ['Where is this villa in Angora Evleri?', `The villa is at ${en.address[0]}, ${en.address[1]}, in the Angora Evleri settlement within Mutlukent, in the Çayyolu part of Çankaya, Ankara.`],
  ['How large is the villa?', `${en.features[0]} and ${en.features[1]}, with a ${en.features[2]}.`],
  ['How many rooms and floors?', `${en.features[3]}, ${en.features[5]}. The floors are linked by a lift and each floor has its own sitting area.`],
  ['How many bathrooms?', `${en.features[4]}.`],
  ['Is there a pool?', 'Yes. A private pool sits at the same level as the basement, with roughly 50 m² of water, opening straight onto the garden.'],
  ['What about parking?', `${en.features[8]}. The garage connects internally to the ground floor and is about 21 m².`],
  ['How is the house heated?', 'By a natural-gas combi boiler. There is also a 6-tonne water tank.'],
  ['Is there an annexe?', 'Yes — about 27 m² on the basement floor with its own entrance, suitable as a guest room, staff room or office.'],
  ['What is the title deed status?', en.deed],
  ['What is the price?', `The listed price is ${en.price}. See RE/MAX listing P56131836 for the current position.`],
  ['Can I view the villa without visiting?', 'Yes. All four floors are open in an interactive 3D model: pick a floor, walk the rooms, change the daylight by hour, take the 360° room tour and see the photographs in place.'],
];
write('en/faq.html', page({
  slug: 'en/faq.html', alt: 'sikca-sorulan-sorular.html', lang: 'en',
  title: 'Frequently Asked Questions · Villa for Sale in Angora Evleri, Ankara',
  description: 'Common questions about the detached villa for sale on Hatırlı Sokak, Angora Evleri: size, rooms, floors, pool, parking, heating, title deed and price.',
  keywords: 'Ankara villa price, villa for sale Turkey title deed, house with pool Ankara',
  h1: 'Frequently Asked Questions',
  lede: 'The questions asked most often, answered from the listing.',
  body: FAQ_EN.map(([q, a]) => `  <h2>${esc(q)}</h2>\n  <p>${esc(a)}</p>`).join('\n'),
  extraLd: [{'@type': 'FAQPage', '@id': SITE + '/en/faq.html', inLanguage: 'en',
    mainEntity: FAQ_EN.map(([q, a]) => ({'@type': 'Question', name: q, acceptedAnswer: {'@type': 'Answer', text: a}}))}],
}));

/* ---------------- SITEMAP ---------------- */
const today = new Date().toISOString().slice(0, 10);
const urls = [
  {loc: SITE + '/', priority: '1.0', changefreq: 'weekly', image: true},
  ...out.map(slug => ({loc: `${SITE}/${slug}`, priority: '0.8', changefreq: 'monthly',
    // Galeri sayfaları 56 fotoğrafın TAMAMINI sitemap'e taşır. Google
    // Görseller emlakta ayrı bir giriş kapısı: "angora evleri villa"
    // aramasının önemli kısmı görsel sekmesinde olur ve oradan tıklanan
    // fotoğraf sayfayı açar. Başlıksız/altyazısız fotoğraf o kapıyı kapatır.
    photos: slug.endsWith('galeri.html') || slug.endsWith('photo-gallery.html')})),
];
writeFileSync(new URL('viewer/public/sitemap.xml', ROOT),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.photos ? PHOTO_POINTS.filter(p => p.file).map(p => `
    <image:image>
      <image:loc>${SITE}/photogallery/${p.file}</image:loc>
      <image:title>${esc(p.tr)} · Angora Evleri'nde satılık villa</image:title>
      <image:caption>${esc(p.tr)} · ${esc(tr.address[1])}, Çankaya Ankara</image:caption>
    </image:image>`).join('') : ''}${u.image ? `
    <xhtml:link rel="alternate" hreflang="tr" href="${SITE}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}/?lang=en"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/"/>
    <image:image>
      <image:loc>${SITE}/og-cover.jpg</image:loc>
      <image:title>Angora Evleri'nde satılık müstakil villa · Hatırlı Sokak, Çankaya Ankara</image:title>
      <image:caption>900 m² bahçeli, özel havuzlu, asansörlü 4 katlı müstakil villa</image:caption>
    </image:image>` : ''}
  </url>`).join('\n')}
</urlset>
`);

/* ---------------- llms.txt ----------------
   Artık aramanın bir kısmı ChatGPT / Gemini / Perplexity üzerinden
   yapılıyor ve bu asistanlar sayfayı okurken JS çalıştırmıyor, yapılandırılmış
   özet arıyor. llms.txt o özeti tek dosyada verir: ne satılıyor, nerede,
   hangi sayfada ne var. Maliyeti birkaç KB.                            */
writeFileSync(new URL('llms.txt', ROOT), `# Angora 21 — ${tr.headline}

> ${tr.address[0]}, ${tr.address[1]}, Çankaya / Ankara, Türkiye.
> ${tr.features.slice(0, 6).join(' · ')}. İlan fiyatı ${tr.price}.
> Kaynak: RE/MAX ilanı P56131836. Etkileşimli 3B model: ${SITE}/

## Özet
${tr.overview.join('\n')}

## Sayfalar
${NAV_TR.filter(n => n.href !== '/').map(n => `- [${n.label}](${SITE}${n.href})`).join('\n')}
- [3B villa turu — dört kat, 360° oda turu, saate göre gün ışığı](${SITE}/)

## English
${NAV_EN.filter(n => !n.href.startsWith('/?')).map(n => `- [${n.label}](${SITE}${n.href})`).join('\n')}

## Özellikler
${tr.features.map(f => `- ${f}`).join('\n')}

## Katlar
${tr.floors.map(f => `### ${f.title}\n${f.body.join('\n')}`).join('\n\n')}

## Tapu
${tr.deed}

## Konum
${tr.location}
${tr.region.body.join('\n')}

Koordinat: ${GEO.lat}, ${GEO.lon}
`);

/* ---------------- 404 ----------------
   GitHub Pages 404.html'i servis eder. Kırık bağlantıya düşen ziyaretçi
   boş sayfa yerine sitenin haritasını görür; arama motoru da soft-404
   yerine düzgün bir 404 alır.                                          */
write('404.html', page({
  slug: '404.html',
  title: 'Sayfa bulunamadı · Angora 21',
  description: 'Aradığınız sayfa bulunamadı. Angora Evleri\'ndeki satılık villanın kat planlarına, fotoğraf galerisine ve 3B turuna buradan ulaşabilirsiniz.',
  h1: 'Sayfa bulunamadı',
  lede: 'Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir. Aşağıdakiler villanın bütün sayfaları.',
  body: `  <ul>${NAV_TR.map(n => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}</ul>
  <p>${esc(tr.address.join(' · '))}</p>`,
}));
out.pop();   // 404 sitemap'e girmez

/* ---------------- web app manifest ---------------- */
writeFileSync(new URL('site.webmanifest', ROOT), JSON.stringify({
  name: `Angora 21 · ${tr.headline}`,
  short_name: 'Angora 21',
  description: tr.overview[0],
  start_url: '/', display: 'standalone', background_color: '#edf0eb', theme_color: '#edf0eb',
  lang: 'tr', categories: ['lifestyle', 'business'],
  icons: [{src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png'},
    {src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any'}],
}, null, 2));

console.log('Üretilen sayfalar:', out.join(', '));
console.log('sitemap URL sayısı:', urls.length);
console.log('galeri fotoğrafı:', photos.length, '· donatı satırı:', curated.length, '· SSS:', FAQ.length);
