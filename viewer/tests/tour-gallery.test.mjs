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

test('kareler %80 - yanlarda ve üstte/altta %10 boşluk, köşeler yuvarlak', () => {
  const figure = css.match(/#app\[data-tour=true\] \.tour-gallery figure\{([\s\S]*?)\}/);
  assert.ok(figure, 'telefon kare kuralı yok');
  assert.match(figure[1], /width:80%/, 'yanlarda %10+%10 = arada %20');
  assert.match(figure[1], /height:80%/, 'üstte ve altta %10');
  assert.match(figure[1], /margin:auto/, 'kare sütununun ortasında yüzmeli');
  assert.match(figure[1], /border-radius:\d+px/, 'köşeler yuvarlak olmalı');
});

test('marka çubuğu YERİNDE kalır, şerit onun altına iner', () => {
  // "fakat MERGVS Angora 21 vs alt tarafa atılmasın, o üstte kalsın"
  assert.ok(!/#app\[data-tour=true\][^{]*\.topbar\s*\{/.test(css),
    'turda marka çubuğu yerinden oynatılmamalı');
  assert.match(css, /#app\[data-tour=true\] \.tour-gallery\{[\s\S]*?top:calc\(max\(12px,env\(safe-area-inset-top\)\) \+ 52px\)/);
  // Görünüm başlığı native telefonda top:112px - tam bandın içi. Turda
  // çekilmezse şeridin altında kalırdı.
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
