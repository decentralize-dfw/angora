import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LISTING} from '../src/listing.js';
import {PHOTO_POINTS} from '../src/photo-points.js';

// İçerik sayfaları tools/seo/build-seo-pages.mjs ile ÜRETİLİR; kaynakları
// listing.js, photo-points.js ve region-places.json'dur. Bu testler üretilen
// çıktının kaynakla aynı kaldığını ve SEO iskeletinin bozulmadığını tutar.
//
// Sayfaların varlık sebebi: ana sayfa tek URL'li ağır bir WebGL uygulaması;
// kat planı, fotoğraf ve muhit sorguları için ayrı, hafif ve DOLU sayfa
// gerekiyor. "Dolu" şart: içi boş doorway sayfası Google tarafından
// cezalandırılır. Kelime eşikleri bu yüzden test edilir.

const root = new URL('../../', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
const tr = LISTING.tr;
const places = JSON.parse(read('viewer/src/region-places.json'));

const PAGES_TR = ['kat-planlari.html', 'galeri.html', 'angora-evleri-rehberi.html', 'sikca-sorulan-sorular.html'];
const PAGES_EN = ['en/floor-plans.html', 'en/photo-gallery.html', 'en/angora-evleri-guide.html', 'en/faq.html'];
const PAGES = [...PAGES_TR, ...PAGES_EN];
// TR <-> EN eşleri: hreflang bunları karşılıklı göstermeli, yoksa Google
// ikisini kopya sanıp birini eler.
const PAIRS = PAGES_TR.map((t, i) => [t, PAGES_EN[i]]);
const html = Object.fromEntries(PAGES.map(p => [p, read(p)]));
const ldOf = s => JSON.parse(s.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const textOf = s => s.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => w.length > 1);

test('her sayfa SEO iskeletini taşır', () => {
  for (const [name, s] of Object.entries(html)) {
    const title = s.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title && title.length >= 30 && title.length <= 90, name + ' başlık uzunluğu: ' + title?.length);
    const desc = s.match(/name="description" content="([^"]+)"/)?.[1];
    assert.ok(desc && desc.length >= 80 && desc.length <= 320, name + ' açıklama uzunluğu: ' + desc?.length);
    assert.ok(s.includes(`<link rel="canonical" href="https://angora.mergvs.com/${name}" />`), name + ' canonical yanlış');
    assert.match(s, /<meta name="robots" content="index, follow/, name + ' robots eksik');
    assert.equal((s.match(/<h1/g) ?? []).length, 1, name + ' tam bir h1 olmalı');
    const wantLang = name.startsWith('en/') ? 'en' : 'tr';
    assert.ok(s.includes(`<html lang="${wantLang}">`), `${name} dili ${wantLang} olmalı`);
    assert.ok(s.includes('og:title') && s.includes('og:url'), name + ' OG eksik');
    assert.ok(!s.includes('<script src') && !s.includes('type="module"'), name + ' içerik sayfası JS yüklememeli');
  }
});

test('sayfalar DOLU - doorway değil', () => {
  for (const [name, s] of Object.entries(html)) {
    const words = textOf(s);
    assert.ok(words.length >= 250, name + ' çok ince: ' + words.length + ' kelime');
  }
});

test('sayfalar KENDİ DİLİNDE birbirine ve ana sayfaya bağlanır', () => {
  for (const set of [PAGES_TR, PAGES_EN]) {
    for (const name of set) {
      const s = html[name];
      for (const other of set) {
        if (other === name) continue;
        assert.ok(s.includes(`href="/${other}"`), `${name} -> ${other} bağlantısı yok`);
      }
    }
  }
  // ana sayfa TR sayfalarına bağlanmalı, yoksa bulunmaz ve otorite almaz
  const index = read('viewer/index.html');
  for (const p of PAGES_TR) assert.ok(index.includes(`href="/${p}"`), 'ana sayfa -> ' + p + ' bağlantısı yok');
});

test('TR ve EN sayfalar hreflang ile KARŞILIKLI eşlenir', () => {
  for (const [trPage, enPage] of PAIRS) {
    for (const [name, other] of [[trPage, enPage], [enPage, trPage]]) {
      const s = html[name];
      assert.ok(s.includes(`hreflang="tr" href="https://angora.mergvs.com/${name === trPage ? name : other}"`),
        name + ' tr hreflang yanlış');
      assert.ok(s.includes(`hreflang="en" href="https://angora.mergvs.com/${name === enPage ? name : other}"`),
        name + ' en hreflang yanlış');
      assert.ok(s.includes('hreflang="x-default"'), name + ' x-default yok');
    }
    assert.ok(html[enPage].includes('<html lang="en">'), enPage + ' dili en olmalı');
    assert.ok(html[trPage].includes('<html lang="tr">'), trPage + ' dili tr olmalı');
  }
});

test('görsel sitemap: 56 fotoğrafın HEPSİ başlık ve altyazıyla', () => {
  const sitemap = read('viewer/public/sitemap.xml');
  const photos = PHOTO_POINTS.filter(p => p.file);
  for (const p of photos) {
    assert.ok(sitemap.includes(`/photogallery/${p.file}`), 'sitemap\'de yok: ' + p.file);
  }
  const locs = (sitemap.match(/<image:loc>/g) ?? []).length;
  assert.ok(locs >= photos.length, 'görsel kaydı az: ' + locs);
  assert.equal((sitemap.match(/<image:title>/g) ?? []).length, locs, 'her görselin başlığı olmalı');
});

test('llms.txt, 404 ve manifest yerinde', () => {
  const llms = read('llms.txt');
  assert.ok(llms.includes(tr.headline), 'llms.txt ilan başlığını taşımalı');
  assert.ok(llms.includes(tr.price) && llms.includes(tr.deed), 'llms.txt fiyat/tapu taşımalı');
  for (const f of tr.floors) assert.ok(llms.includes(f.title), 'llms.txt kat eksik: ' + f.title);
  assert.ok(llms.includes('P56131836'), 'llms.txt kaynağı yazmalı');

  const notFound = read('404.html');
  assert.ok(notFound.includes('<h1'), '404 sayfası boş olmamalı');
  for (const p of PAGES_TR) assert.ok(notFound.includes(`href="/${p}"`), '404 -> ' + p + ' bağlantısı yok');
  assert.ok(!read('viewer/public/sitemap.xml').includes('404.html'), '404 sitemap\'e girmemeli');

  const manifest = JSON.parse(read('site.webmanifest'));
  assert.ok(manifest.name.includes('Angora'), 'manifest adı');
  assert.equal(manifest.start_url, '/');
  assert.ok(manifest.icons.length >= 2, 'manifest ikonları');
});

test('kat planları: dört katın hepsi ilan metniyle', () => {
  const s = html['kat-planlari.html'];
  for (const floor of tr.floors) {
    assert.ok(s.includes(floor.title), 'kat eksik: ' + floor.title);
    for (const para of floor.body) assert.ok(s.includes(para.replace(/&/g, '&amp;')), 'kat metni eksik: ' + floor.title);
  }
  assert.ok(s.includes(tr.deed), 'tapu satırı eksik');
});

test('galeri: her fotoğraf alt metinli ve tembel yüklenir', () => {
  const s = html['galeri.html'];
  const photos = PHOTO_POINTS.filter(p => p.file);
  const imgs = s.match(/<img [^>]*>/g) ?? [];
  assert.equal(imgs.length, photos.length, 'fotoğraf sayısı tutmuyor');
  for (const img of imgs) {
    assert.match(img, /alt="[^"]{10,}"/, 'alt metni yok veya çok kısa: ' + img.slice(0, 80));
    assert.ok(img.includes('loading="lazy"'), 'lazy eksik');
    assert.ok(img.includes('width=') && img.includes('height='), 'boyut yok - düzen kayması (CLS) yapar');
  }
  const gallery = ldOf(s)['@graph'].find(n => n['@type'] === 'ImageGallery');
  assert.ok(gallery.image.length > 0, 'ImageObject listesi boş');
});

test('rehber: donatılar GERÇEK veriden, mesafeleriyle', () => {
  const s = html['angora-evleri-rehberi.html'];
  const curated = places.curated ?? [];
  assert.ok(curated.length > 0, 'donatı verisi yok');
  for (const c of curated) {
    assert.ok(s.includes(c.name), 'donatı eksik: ' + c.name);
    assert.ok(s.includes(`${c.d} m`), 'mesafe eksik: ' + c.name);
  }
  assert.ok(s.includes(places.source), 'kaynak künyesi yok - ölçüm nereden geldiği yazmalı');
  for (const para of tr.region.body) assert.ok(s.includes(para), 'bölge metni eksik');
});

test('SSS: FAQPage şeması ve cevaplar ilanla tutuyor', () => {
  const s = html['sikca-sorulan-sorular.html'];
  const faq = ldOf(s)['@graph'].find(n => n['@type'] === 'FAQPage');
  assert.ok(faq, 'FAQPage şeması yok - zengin sonuç kaybı');
  assert.ok(faq.mainEntity.length >= 8, 'soru sayısı az: ' + faq.mainEntity.length);
  for (const q of faq.mainEntity) {
    assert.equal(q['@type'], 'Question');
    assert.ok(q.name.length > 10 && q.acceptedAnswer.text.length > 20, 'zayıf soru/cevap: ' + q.name);
    // şemadaki her cevap sayfada da GÖRÜNMELİ - gizli şema spam sayılır
    assert.ok(s.includes(q.name), 'soru sayfada görünmüyor: ' + q.name);
  }
  assert.ok(s.includes(tr.price), 'fiyat cevabı ilandan gelmeli');
  assert.ok(s.includes(tr.deed), 'tapu cevabı ilandan gelmeli');
});

test('sitemap bütün sayfaları sayar', () => {
  const sitemap = read('viewer/public/sitemap.xml');
  assert.ok(sitemap.includes('<loc>https://angora.mergvs.com/</loc>'), 'ana sayfa yok');
  for (const p of PAGES) {
    assert.ok(sitemap.includes(`<loc>https://angora.mergvs.com/${p}</loc>`), 'sitemap eksik: ' + p);
  }
  assert.ok(sitemap.includes('sitemaps.org/schemas/sitemap/0.9'), 'namespace yanlış');
});
