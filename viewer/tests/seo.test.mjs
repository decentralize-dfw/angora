import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LISTING} from '../src/listing.js';

// SEO, üç yerde birden durduğu için sessizce ayrışmaya açık: kaynak HTML'in
// metni, JSON-LD'nin rakamları ve listing.js'teki asıl ilan. Bu testler
// üçünü birbirine bağlar - biri değişip diğeri kalırsa kırılır.
//
// Uydurma bilgi yasağı: her rakam RE/MAX P56131836 ilanından gelir ve
// listing.js'te yazılıdır. Test, HTML'de listing.js'te OLMAYAN bir alan
// iddiası yapılmadığını da doğrular.

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
const tr = LISTING.tr;

const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const node = type => ld['@graph'].find(n => n['@type'] === type);

test('head: başlık, açıklama, canonical, hreflang, robots yerinde', () => {
  const title = html.match(/<title>([^<]+)<\/title>/)[1];
  assert.ok(title.length >= 30 && title.length <= 160, 'başlık uzunluğu makul: ' + title.length);
  for (const word of ['Angora Evleri', 'Villa', 'Ankara']) {
    assert.ok(title.includes(word), 'başlıkta eksik: ' + word);
  }
  const description = html.match(/<meta name="description" content="([^"]+)"/)[1];
  assert.ok(description.length >= 70 && description.length <= 320, 'açıklama uzunluğu: ' + description.length);
  assert.ok(html.includes('<link rel="canonical" href="https://angora.mergvs.com/" />'));
  for (const lang of ['tr', 'en', 'x-default']) {
    assert.ok(html.includes(`hreflang="${lang}"`), 'hreflang eksik: ' + lang);
  }
  assert.match(html, /<meta name="robots" content="index, follow/);
  assert.equal(html.match(/<html lang="tr">/) !== null, true, 'kök dil tr olmalı');
});

test('paylaşım kartları: OG ve Twitter MUTLAK adres kullanır', () => {
  // Göreli yol ./og-cover.jpg paylaşımda çözülmez; mutlak olmalı.
  const image = html.match(/<meta property="og:image" content="([^"]+)"/)[1];
  assert.ok(image.startsWith('https://'), 'og:image mutlak olmalı: ' + image);
  assert.ok(html.includes('<meta property="og:url" content="https://angora.mergvs.com/" />'));
  assert.ok(html.includes('og:locale'), 'og:locale eksik');
  assert.ok(html.match(/<meta name="twitter:image" content="https:\/\//), 'twitter:image mutlak olmalı');
});

test('h1 villayı ve konumu SÖYLER, sadece marka değil', () => {
  const h1 = html.match(/<h1>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, '');
  for (const word of ['villa', 'Angora Evleri', 'Ankara', 'Hatırlı']) {
    assert.ok(h1.toLowerCase().includes(word.toLowerCase()), 'h1 eksik: ' + word);
  }
});

test('ilan metni KAYNAK HTML içinde - JS çalışmadan da okunur', () => {
  // 3B görüntüleyicinin tek başına metni yoktur; taranabilir metin buradan
  // gelir. Sayısı düşerse SEO sessizce çökmüş demektir.
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  const words = text.split(/\s+/).filter(w => w.length > 1);
  assert.ok(words.length > 400, 'kaynak HTML metni çok kısa: ' + words.length);

  // Metin listing.js ile AYNI kaynaktan olmalı - anahtar cümleler birebir.
  assert.ok(html.includes(tr.headline), 'ilan başlığı HTML\'de yok');
  assert.ok(html.includes(tr.address[1]), 'sokak adresi HTML\'de yok');
  assert.ok(html.includes(tr.price), 'fiyat HTML\'de yok');
  assert.ok(html.includes(tr.deed), 'tapu satırı HTML\'de yok');
  for (const feature of tr.features) {
    assert.ok(html.includes(feature), 'özellik HTML\'de yok: ' + feature);
  }
});

test('JSON-LD: emlak tipleri var ve rakamlar ilanla TUTUYOR', () => {
  for (const type of ['RealEstateListing', 'SingleFamilyResidence', 'Organization', 'WebSite', 'BreadcrumbList']) {
    assert.ok(node(type), 'JSON-LD tipi eksik: ' + type);
  }
  const villa = node('SingleFamilyResidence');
  const offer = node('RealEstateListing').offers;

  // fiyat: "99.000.000 ₺" -> 99000000
  assert.equal(offer.price, tr.price.replace(/[^\d]/g, ''), 'JSON-LD fiyatı ilandan farklı');
  assert.equal(offer.priceCurrency, 'TRY');

  // brüt alan
  assert.equal(villa.floorSize.value, 500);
  assert.ok(tr.features.some(f => f.startsWith('500 m²')), 'ilan 500 m² demiyor');

  // oda sayıları: ilan "5+4 oda" ve "3 banyo + 2 misafir WC"
  assert.equal(villa.numberOfBedrooms, 5);
  assert.equal(villa.numberOfFullBathrooms, 3);
  assert.equal(villa.numberOfPartialBathrooms, 2);
  assert.equal(villa.numberOfAccommodationUnits.value, 4, 'kat sayısı 4 olmalı');

  // adres
  assert.ok(villa.address.streetAddress.includes('Hatırlı Sokak'));
  assert.equal(villa.address.addressLocality, 'Çankaya');
  assert.equal(villa.address.addressRegion, 'Ankara');
  assert.equal(villa.address.addressCountry, 'TR');

  // dört katın hepsi anlatılmış
  assert.equal(villa.containsPlace.length, tr.floors.length);
});

test('JSON-LD bilinmeyen alan UYDURMAZ', () => {
  const villa = node('SingleFamilyResidence');
  // Yapım yılı ilanda yok; şema alanı da olmamalı.
  assert.ok(!('yearBuilt' in villa), 'yearBuilt ilanda yok, uydurulmamalı');
  const json = JSON.stringify(ld);
  assert.ok(!json.includes('null'), 'JSON-LD içinde null alan kalmamalı');
});

test('robots.txt ve sitemap: QA sayfaları dışarıda, sitemap bildirilmiş', () => {
  assert.match(robots, /^User-agent: \*/m);
  assert.match(robots, /^Allow: \/$/m);
  for (const path of ['/qa-mobile.html', '/uzakolcek.html', '/build/', '/web-assets/']) {
    assert.ok(robots.includes('Disallow: ' + path), 'robots.txt kapatmamış: ' + path);
  }
  assert.ok(robots.includes('Sitemap: https://angora.mergvs.com/sitemap.xml'));
  assert.ok(sitemap.includes('http://www.sitemaps.org/schemas/sitemap/0.9'),
    'sitemap namespace SITEMAPS.org olmalı (çoğul) - tekil hâli geçersizdir');
  assert.ok(sitemap.includes('<loc>https://angora.mergvs.com/</loc>'));
  assert.ok(sitemap.includes('hreflang="en"'), 'sitemap dil alternatifi eksik');
});

test('kat anlatımı JS render\'ından SAĞ ÇIKAR - #property-info DIŞINDA durur', () => {
  // renderPropertyInfo() #property-info'yu replaceChildren() ile siler ve
  // yeniden basar; kat metni orada kalsaydı JS çalıştıktan sonra DOM'dan
  // düşerdi. Google render edilmiş sayfayı okuduğu için bu metni kaybetmek
  // SEO'yu sessizce yarıya indirirdi. (Ölçüldü: panel JS'ten sonra 2049
  // karakter, kat metni yok.)
  const info = html.match(/<div id="property-info">([\s\S]*?)\n    <\/div>/);
  assert.ok(info, '#property-info bulunamadı');
  for (const floor of tr.floors) {
    assert.ok(html.includes(floor.title), 'kat başlığı HTML\'de yok: ' + floor.title);
    assert.ok(!info[1].includes(floor.title),
      'kat metni #property-info İÇİNDE - JS onu silecek: ' + floor.title);
  }
  assert.ok(html.includes('class="listing-floors"'), 'kalıcı kat bloğu yok');
});
