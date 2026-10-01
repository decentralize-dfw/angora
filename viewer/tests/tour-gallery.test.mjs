import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {TOUR_PHOTO_MAX, PHOTO_POINTS} from '../src/photo-points.js';

// SESLİ REHBER ŞERİDİ - telefonda turun kareleri üstte, marka çubuğunun altında.
//
// Bu testlerin varlık sebebi bir HATA: şerit önce KALICI yapılmıştı (her
// katta, ekranın üst %15'i, tuvali kısaltarak). Ürün sahibi düzeltti -
// "sadece sesli rehber esnasında... bu resmi default olarak göstermemiz çok
// saçma, bunu kaldır". Aşağıdaki ilk test o kalıcı şeridin geri gelmediğini
// tutuyor; geri kalanı istenen yerleşimin ölçülerini.

const root = new URL('../../', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
const css = read('viewer/src/interface-quality.css');
const main = read('viewer/src/main.js');

test('KALICI şerit geri gelmedi - galeri yalnız turda', () => {
  assert.equal(existsSync(new URL('viewer/src/photo-strip.js', root)), false,
    'kalıcı şerit modülü silinmeliydi');
  assert.ok(!css.includes('--strip-h'), 'tuvali kısaltan değişken kalmamalı');
  assert.ok(!/#viewport\{top:/.test(css), '#viewport yüksekliği ellenmemeli');
  assert.ok(!main.includes('photoStrip'), 'main.js kalıcı şeridi tanımamalı');
  // Telefon galerisinin HER kuralı tura bağlı olmalı: turda olmayan biri
  // kalırsa şerit yine her ekranda belirir.
  const block = css.slice(css.indexOf('SESLİ REHBER'));
  for (const rule of block.match(/^\s{2}#?[^@\s][^{]*\{/gm) ?? []) {
    assert.match(rule, /#app\[data-tour=true\]/, 'tura bağlı değil: ' + rule.trim());
  }
});

test('bir, iki veya üç kare - hepsi kaydırmasız sığar', () => {
  assert.equal(TOUR_PHOTO_MAX, 3);
  // Tek sınır: telefon/masaüstü ayrımı kalktı. İki farklı sınır tutmak,
  // sütunları kare sayısına bölen yerleşimi bozardı.
  assert.ok(!/const limit=matchMedia\('\(max-width:720px\)'\)/.test(main),
    'telefona ayrı sınır kalmamalı');
  assert.match(main, /tourPhotos\.slice\(0,photoPoints\.TOUR_PHOTO_MAX\)/);
  // Sütunlar kare sayısına bölünür (1fr), yani taşma ve kaydırma yok.
  assert.match(css, /#app\[data-tour=true\] \.tour-gallery\{[\s\S]*?grid-auto-columns:1fr/);
  assert.match(css, /#app\[data-tour=true\] \.tour-gallery\{[\s\S]*?overflow:visible/);
  assert.ok(!/#app\[data-tour=true\] \.tour-gallery\{[\s\S]*?overflow-x:auto/.test(css),
    'kaydırma olmamalı');
});

test('kareler HER ZAMAN 4:3, sütunun ortasında, köşeler yuvarlak', () => {
  // 01.10: "tek fotoğraf yayıldığı için... her birisi 4:3 formattan bozulmamalı.
  // dikey 3 yatay 4" - tek kare sütunun tamamına yayılıp basık bir şerit oluyordu.
  const figure = css.match(/#app\[data-tour=true\] \.tour-gallery figure\{([\s\S]*?)\}/);
  assert.ok(figure, 'telefon kare kuralı yok');
  assert.match(figure[1], /width:min\(84%,calc\(/, 'genişlik sütun ve bant yüksekliğinden küçük olanı');
  assert.match(figure[1], /height:auto/, 'yükseklik 4:3 görüntüden gelir');
  assert.match(figure[1], /margin:0 auto/, 'kare sütununun ortasında');
  assert.match(figure[1], /border-radius:\d+px/, 'köşeler yuvarlak olmalı');
  assert.match(css, /#app\[data-tour=true\] \.tour-gallery img\{[^}]*aspect-ratio:4\/3/, 'görüntü 4:3');
});

test('kareler yandan değil, marka çubuğunun altından AŞAĞI düşer', () => {
  // Masaüstü animasyonu soldan kaydırıyor (kartlar sol sütunda). Üstteki
  // şeritte bu yanlamasına süzülme okunuyor - ölçümde kareler duruş
  // yerlerinden 16 px solda yakalandı. Telefonda dikey giriş.
  assert.match(css, /#app\[data-tour=true\] \.tour-gallery figure\{animation-name:tour-photo-drop\}/);
  assert.match(css, /@keyframes tour-photo-drop\{from\{opacity:0;transform:translateY\(-\d+px\)\}/);
  assert.match(read('viewer/src/style.css'), /@keyframes tour-photo-in\{from\{opacity:0;transform:translateX/,
    'masaüstü yatay girişini korumalı');
});

test('şerit en üstten başlar, üstte boşluk kalmaz', () => {
  // 01.10: telefonda marka satırı kalktı, turda üst düğmeler de çekiliyor -
  // eski 52 px'lik pay boş bir bant bırakıyordu ("üst alanda çok boşluk").
  assert.ok(!/#app\[data-tour=true\][^{]*\.topbar\s*\{/.test(css),
    'turda üst çubuk yerinden oynatılmamalı');
  assert.match(css, /#app\[data-tour=true\] \.tour-gallery\{[\s\S]*?top:max\(10px,env\(safe-area-inset-top\)\)/);
  assert.match(css, /#app\[data-tour=true\] \.view-description\{opacity:0/);
});

test('kareye tıklanmaz, numarası her zaman yazar', () => {
  // "resme tıklanınca da açılmasın, orda dursun sadece bilgi olarak"
  const base = read('viewer/src/style.css');
  assert.match(base, /\.tour-gallery\{[^}]*pointer-events:none/);
  assert.ok(!main.includes("tour-gallery').addEventListener"), 'galeriye dinleyici bağlanmamalı');
  // "1 2 3 falan diye yazıyor ya, onlar da yazsın hangisi hangisi anlayalım"
  // - masaüstü tek kareyken numarayı gizliyor, telefonda gizlenmez.
  assert.match(base, /\.tour-gallery\[data-single=true\] figcaption b\{display:none\}/);
  assert.match(css, /#app\[data-tour=true\] \.tour-gallery\[data-single=true\] figcaption b\{display:grid\}/);
  // Numara, sahnedeki işaretin numarasıyla aynı sırada üretilir.
  assert.match(main, /number\.textContent=String\(i\+1\)/);
  assert.match(main, /spotlight\?\.setShots\(shown\.map\(\(point,i\)=>\(\s*\{n:i\+1/);
});

test('galeri turun karelerinden beslenir - uydurma yok', () => {
  // setTourPhotos'un aldığı id'ler tur senaryosundan gelir; hepsi gerçek
  // fotoğraf noktası olmalı, yoksa şeritte boş kart çıkar.
  const script = read('viewer/src/tour-script.js');
  const ids = new Set(PHOTO_POINTS.map(p => p.id));
  const steps = [...script.matchAll(/photos:\s*\[([0-9,\s]*)\]/g)]
    // 'photos: []' adımı galeriyi KAPATIR; boş dizgiyi sayıya çevirmek 0 verir
    // ve olmayan bir kare uydururdu.
    .map(m => m[1].split(',').map(n => n.trim()).filter(Boolean).map(Number));
  const used = steps.flat();
  assert.ok(used.length > 0, 'tur senaryosunda fotoğraf yok');
  for (const id of used) assert.ok(ids.has(id), 'tur senaryosunda olmayan kare: ' + id);
  // 20 kaldırıldı; senaryo onu göstermeye çalışmamalı.
  assert.equal(used.includes(20), false, '20 kaldırıldı, tur onu isteyemez');
  // Şerit sütunları kare sayısına bölüyor; senaryo TOUR_PHOTO_MAX'tan fazla
  // isterse fazlası sessizce kırpılır ve sahnedeki numaralarla eşleşme bozulur.
  for (const step of steps) {
    assert.ok(step.length <= TOUR_PHOTO_MAX, 'bir adımda çok kare: ' + step.join(','));
  }
});
