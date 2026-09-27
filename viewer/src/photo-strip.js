import {PHOTO_POINTS, photoCaption} from './photo-points.js';
import {currentLang} from './i18n.js';

// TELEFON: ekranın üst %15'i fotoğraf şeridi, kalan %85 çizim.
//
// Ürün sahibi: "mobil kısımda: üst kısımda yüzde 15'lik bir alan ayır,
// ekranın yüzde 15 height'i. kalan alanın da kamera ona göre yeniden extend
// olsun, hatta biraz geriye alabilirsin zoom out hafif yani sığmıyor hissi
// olmasın. üstte yüzde 15'te ise yan yana resimleri göster, aralarında ve
// kenardan ince çizgilerle ayrılsınlar, kalan alana sığacak şekilde yerleştir."
//
// Neden ayrı bir şerit: telefonda fotoğraf dock'u yok (layoutOverlays 720
// px'in altında hiç çalışmıyor) ve pinler ancak fotoğraf anahtarı açıkken
// çiziliyor. Yani telefondaki ziyaretçinin ilanın 55 fotoğrafına giden bir
// yolu YOKTU. Şerit o yol: bulunduğu katın kareleri, yan yana, tek dokunuşla.
//
// Şerit KATA bağlı. Mahalle/bölge görünümünde kat yok, dolayısıyla o
// görünümün fotoğrafı da yok; şerit kapanır ve tuval yüksekliğin tamamını
// geri alır. Yürüyüş modunda bütün arayüz gibi o da çekilir.
//
// Yükseklik CSS'te (--strip-h), burada DEĞİL: tuvali küçülten şey CSS, bu
// dosya yalnız "açık mı" ve "hangi kareler" sorularını yanıtlıyor. Boyut iki
// yerde yazılırsa er geç ikisi ayrışır.

// Ekran yüksekliğinin payı. CSS'teki --strip-h ile AYNI olmalı; test ikisini
// birlikte tutuyor.
export const STRIP_FRACTION = 0.15;

// Küçük kopyalar photogallery/thumbs/ altında ve HEPSİ .jpg - kaynak .jpeg
// veya .png olsa bile (angora_28.jpeg, angora_32.png). Şerit 400x300'lük
// kopyaları kullanır: 55 tam kare telefonda 34 MB, küçükleri 1,3 MB.
export function thumbName(file) {
  return String(file ?? '').replace(/\.[^.]+$/, '.jpg');
}

// Görünümün kareleri, ilanın kendi numara sırasında. Kural pinlerinkiyle
// AYNI (photo-gallery.js update): bir kare kendi katında, dışarıdan çekilmiş
// "takip eden" kareler ise gördükleri her katta çizilir.
export function stripPoints(view) {
  const floor = /^f[0-3]$/.test(view) ? Number(view[1]) : -1;
  if (floor < 0) return [];
  return PHOTO_POINTS.filter(point => point.file && (point.floors ?? [point.floor]).includes(floor));
}

// Şerit yalnız telefonda, yalnız bir kat açıkken ve yürüyüşte değilken.
// Geçiş (uçuş) sırasında KAPANMAZ: şerit kamerayla birlikte hareket etmiyor,
// her uçuşta açılıp kapanması tuvali iki kez yeniden boyutlandırırdı.
export function stripActive(view, {mobile = false, walking = false} = {}) {
  return Boolean(mobile) && !walking && stripPoints(view).length > 0;
}

export function createPhotoStrip(app, root, {onOpen}) {
  const strip = document.createElement('div');
  strip.id = 'photo-strip';
  strip.className = 'photo-strip';
  strip.hidden = true;
  strip.setAttribute('aria-label', 'Bu katın fotoğrafları');
  app.append(strip);

  // Hücreler bir kez kurulur ve sonra yalnız gizlenip gösterilir: her kat
  // değişiminde <img> yeniden yaratmak, tarayıcının çözdüğü kareyi de atar
  // ve aynı fotoğraf her dönüşte yeniden indirilir.
  const cells = new Map();
  for (const point of PHOTO_POINTS) {
    if (!point.file) continue;
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'photo-strip-cell';
    cell.dataset.photo = String(point.id);
    cell.hidden = true;
    const img = document.createElement('img');
    img.src = new URL('thumbs/' + thumbName(point.file), root).href;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 400; img.height = 300;      // düzen kayması (CLS) olmasın
    cell.append(img);
    // Pinlerdeki ile aynı sebep: kare pointerdown'da açılır. Şerit
    // yatayda kaydırılabildiği için parmak kayarsa tarayıcı click
    // üretmez ve dokunuş yutulur.
    cell.addEventListener('pointerdown', event => {
      event.stopPropagation();
      onOpen(point.id);
    });
    cell.addEventListener('click', event => {
      event.preventDefault(); event.stopPropagation();
      if (event.detail === 0) onOpen(point.id);
    });
    strip.append(cell);
    cells.set(point.id, {point, cell, img});
  }

  function labels() {
    const lang = currentLang();
    for (const {point, cell, img} of cells.values()) {
      const text = photoCaption(point, lang);
      cell.setAttribute('aria-label', text);
      img.alt = text;
    }
  }
  labels();

  let active = false;
  return {
    get active() {return active;},
    count: cells.size,
    refreshLabels: labels,
    select(id) {
      for (const {point, cell} of cells.values()) cell.setAttribute('aria-pressed', String(point.id === id));
    },
    // Döndürdüğü şey ETKİN DURUM DEĞİŞTİ mi - çağıran taraf yalnız o zaman
    // resize() çağırıyor, çünkü tuvalin yüksekliği ancak o zaman değişiyor.
    update(view, {mobile = false, walking = false} = {}) {
      const next = stripActive(view, {mobile, walking});
      const visible = new Set(stripPoints(view).map(point => point.id));
      for (const {point, cell} of cells.values()) cell.hidden = !next || !visible.has(point.id);
      strip.hidden = !next;
      strip.scrollLeft = 0;
      app.dataset.photostrip = String(next);
      const changed = next !== active;
      active = next;
      return changed;
    },
    dispose() {strip.remove(); delete app.dataset.photostrip;},
  };
}
