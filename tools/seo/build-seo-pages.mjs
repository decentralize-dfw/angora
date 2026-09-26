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
const NAV = [
  {href: '/', label: '3B Villa Turu'},
  {href: '/kat-planlari.html', label: 'Kat Planları'},
  {href: '/galeri.html', label: 'Fotoğraf Galerisi'},
  {href: '/angora-evleri-rehberi.html', label: 'Angora Evleri Rehberi'},
  {href: '/sikca-sorulan-sorular.html', label: 'Sıkça Sorulan Sorular'},
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

function page({slug, title, description, h1, lede, body, extraLd = [], keywords}) {
  const url = `${SITE}/${slug}`;
  const crumbs = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {'@type': 'ListItem', position: 1, name: 'Angora 21 · 3B Villa Turu', item: SITE + '/'},
      {'@type': 'ListItem', position: 2, name: h1, item: url},
    ],
  };
  const ld = {'@context': 'https://schema.org', '@graph': [crumbs, ...extraLd]};
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
${keywords ? `<meta name="keywords" content="${esc(keywords)}" />\n` : ''}<link rel="canonical" href="${url}" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
<meta name="geo.region" content="TR-06" />
<meta name="geo.placename" content="Mutlukent, Çankaya, Ankara" />
<meta name="geo.position" content="${GEO.lat};${GEO.lon}" />
<meta name="ICBM" content="${GEO.lat}, ${GEO.lon}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="MERGVS · Angora 21" />
<meta property="og:locale" content="tr_TR" />
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
  <nav class="site" aria-label="Site gezinmesi">${NAV.map(n =>
    `<a href="${n.href}"${('/' + slug) === n.href ? ' aria-current="page"' : ''}>${n.label}</a>`).join('')}</nav>
</div></header>
<main class="wrap">
  <p class="crumbs"><a href="/">Angora 21</a> › ${esc(h1)}</p>
  <h1>${esc(h1)}</h1>
  <p class="lede">${esc(lede)}</p>
${body}
  <p><a class="cta" href="/">Villayı 3B modelde gez →</a><a class="cta ghost" href="https://remax.com.tr/tr/portfoy/P56131836" target="_blank" rel="noopener">Satış ilanını aç ↗</a></p>
</main>
<footer class="site"><div class="wrap">
  <p>${NAV.map(n => `<a href="${n.href}">${n.label}</a>`).join('')}</p>
  <p>${esc(tr.address.join(' · '))} · Ankara · MERGVS</p>
  <p class="note">İlan alanları ve özellikleri RE/MAX P56131836 kaynağındandır.</p>
</div></footer>
</body>
</html>`;
}

const out = [];
const write = (slug, html) => {writeFileSync(new URL(slug, ROOT), html); out.push(slug);};

/* ---------------- 1. KAT PLANLARI ---------------- */
write('kat-planlari.html', page({
  slug: 'kat-planlari.html',
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
  slug: 'galeri.html',
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
  slug: 'angora-evleri-rehberi.html',
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
  slug: 'sikca-sorulan-sorular.html',
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

/* ---------------- SITEMAP ---------------- */
const today = new Date().toISOString().slice(0, 10);
const urls = [
  {loc: SITE + '/', priority: '1.0', changefreq: 'weekly', image: true},
  ...out.map(slug => ({loc: `${SITE}/${slug}`, priority: '0.8', changefreq: 'monthly'})),
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
    <priority>${u.priority}</priority>${u.image ? `
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

console.log('Üretilen sayfalar:', out.join(', '));
console.log('sitemap URL sayısı:', urls.length);
console.log('galeri fotoğrafı:', photos.length, '· donatı satırı:', curated.length, '· SSS:', FAQ.length);
