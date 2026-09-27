import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {STRIP_FRACTION, thumbName, stripPoints, stripActive} from '../src/photo-strip.js';
import {PHOTO_POINTS} from '../src/photo-points.js';

// TELEFON ŞERİDİ - ekranın üst %15'i, kalan %85 çizim.
//
// Şeridin varlık sebebi ölçülebilir bir boşluktu: telefonda fotoğraf dock'u
// hiç çalışmıyor (layoutOverlays 720 px altında erken dönüyor) ve pinler
// ancak fotoğraf anahtarı açıkken çiziliyor - yani ilanın 55 karesine giden
// bir yol yoktu. Buradaki testler şeridin NE GÖSTERDİĞİNİ ve yüksekliğin
// TEK yerde yazıldığını tutuyor; görsel yerleşim CSS'in işi.

const root = new URL('../../', import.meta.url);

test('her karenin küçük kopyası diskte ve adı .jpg', () => {
  for (const point of PHOTO_POINTS) {
    if (!point.file) continue;
    const thumb = thumbName(point.file);
    assert.match(thumb, /\.jpg$/, point.file + ' -> ' + thumb);
    assert.ok(existsSync(new URL('photogallery/thumbs/' + thumb, root)),
      'küçük kopya yok: ' + thumb + ' (kaynak ' + point.file + ')');
  }
  // Kaynağı .jpeg/.png olanlar da .jpg küçük kopyaya düşer - şerit 34 MB'lık
  // tam kareleri değil 1,3 MB'lık kopyaları indiriyor.
  assert.equal(thumbName('angora_28.jpeg'), 'angora_28.jpg');
  assert.equal(thumbName('angora_32.png'), 'angora_32.jpg');
});

test('şerit PİNLERLE aynı kareleri gösterir - iki liste ayrışamaz', () => {
  for (let floor = 0; floor < 4; floor++) {
    const view = 'f' + floor;
    // photo-gallery.js update() kuralının birebir aynısı
    const pins = PHOTO_POINTS.filter(p => p.file && (p.floors ?? [p.floor]).includes(floor));
    assert.deepEqual(stripPoints(view).map(p => p.id), pins.map(p => p.id), view);
    assert.ok(stripPoints(view).length > 0, view + ' boş olamaz');
  }
  // Dışarıdan çekilen "takip eden" kareler gördükleri HER katta listede
  const following = PHOTO_POINTS.find(p => p.follow && (p.floors?.length ?? 0) > 1);
  for (const floor of following.floors) {
    assert.ok(stripPoints('f' + floor).some(p => p.id === following.id),
      following.id + ' f' + floor + ' şeridinde olmalı');
  }
  // Kat olmayan görünümde kat fotoğrafı da yok
  for (const view of ['neighborhood', 'region', 'building', '']) {
    assert.deepEqual(stripPoints(view), [], view + ' şeridi boş olmalı');
  }
});

test('şerit YALNIZ telefonda, yürüyüşte değil, karesi olan görünümde', () => {
  assert.equal(stripActive('f1', {mobile: true}), true);
  assert.equal(stripActive('f1', {mobile: false}), false, 'masaüstünde dock var, şerit yok');
  assert.equal(stripActive('f1', {mobile: true, walking: true}), false, 'yürüyüşte arayüz çekilir');
  assert.equal(stripActive('neighborhood', {mobile: true}), false, 'karesi olmayan görünümde açılmamalı');
  assert.equal(stripActive('region', {mobile: true}), false);
});

test('1. kat salonunda çift kare kalmadı: 20 gitti, 4 durdu', () => {
  // Ürün sahibi: "1. kat salonda aynı resimden iki tane koyulmuş onun bir
  // tanesini hem mobilden hem de desktopdan kaldır". 20 ile 4 aynı kareydi;
  // 4 plana işaretli olan, o yüzden duran o.
  const ids = stripPoints('f1').map(p => p.id);
  assert.ok(ids.includes(4), '4 kalmalı - plana işaretli olan o');
  assert.equal(ids.includes(20), false, '20, 4\'ün aynı karesiydi');
  assert.equal(PHOTO_POINTS.some(p => p.id === 20), false);
  // Numaralar ürün sahibinin kendi fotoğraf numaraları: 20 silindi diye
  // 21 kaymaz.
  assert.ok(PHOTO_POINTS.some(p => p.id === 21 && p.file === 'angora_21.jpg'));
});

test('yükseklik TEK yerde: JS payı ile CSS --strip-h aynı', () => {
  const css = readFileSync(new URL('viewer/src/interface-quality.css', root), 'utf8');
  const declared = css.match(/#app\[data-photostrip=true\]\{--strip-h:(\d+(?:\.\d+)?)dvh\}/);
  assert.ok(declared, 'CSS --strip-h tanımı bulunamadı');
  assert.equal(Number(declared[1]) / 100, STRIP_FRACTION, 'CSS ile JS payı ayrışmış');
  // vh DEĞİL dvh: adres çubuğu gizlenince vh sabit kalır ve şerit ekranın
  // %15'inden büyük görünür.
  assert.ok(!/--strip-h:\d+(?:\.\d+)?vh\}/.test(css), 'vh kullanılmamalı, dvh şart');
  // Tuvali küçülten tek satır bu; olmazsa şerit çizimin ÜSTÜNE biner.
  assert.match(css, /#app\[data-photostrip=true\] #viewport\{top:var\(--strip-h\)\}/);
  // Aralarında ve kenarda ince çizgi: 1px gap + 1px padding, zemin çizgi rengi
  assert.match(css, /\.photo-strip\{[\s\S]*?gap:1px;padding:1px/);
});

test('main.js kadrajı ŞERİT KURULDUKTAN SONRA hesaplar', () => {
  const main = readFileSync(new URL('viewer/src/main.js', root), 'utf8');
  // Sıra önemli: şerit tuvali kısaltıyor, frame() host.clientHeight okuyor.
  // Ters sırada kadraj eski yüksekliğe göre kurulur ve bina şeridin altında
  // kalır.
  const order = main.indexOf('refreshPhotoStrip();   // frame\'den ÖNCE');
  assert.ok(order > 0, 'selectView içinde şerit tazeleme yok');
  assert.ok(main.indexOf('frame(initial);', order) > order, 'frame() şeritten sonra gelmeli');
  // CSS kaynaklı boyut değişimi resize olayı üretmez - elle çağrılmalı.
  assert.match(main, /if\(!photoStrip\.update\([\s\S]{0,80}?\)\)return false;\s*\n\s*resize\(\);/);
  // "biraz geriye alabilirsin, sığmıyor hissi olmasın"
  assert.match(main, /const stripPullback=photoStrip\?\.active\?1\.08:1;/);
  assert.match(main, /\*stripPullback;/);
});
