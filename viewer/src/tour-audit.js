// TUR KADRAJ DENETİMİ — "gösterilen yer ekranda ortalanmak ve sığmak zorundadır."
//
// Ürün sahibi turda bir cümlenin anlattığı yerin ekranın kenarında, yarısı
// dışarıda kaldığını gördü ve bütün turun denetlenmesini istedi. Göz kararı
// bir denetim altmış ipucunda yürümez: bu dosya her ipucu için AYDINLATILAN
// kutunun ekrandaki dikdörtgenini ölçer ve iki şeyi sayıya döker -
//
//   1) SIĞIYOR MU: dikdörtgen, arayüzün kapatmadığı alanın içinde mi?
//      (üstte marka çubuğu, altta altyazı ve transport, solda tur galerisi -
//      "ekranda" demek "piksel var" demek değil, "görünüyor" demek.)
//   2) ORTALANMIŞ MI: merkezi, o güvenli alanın merkezinden ne kadar sapıyor?
//
// Kamera matrisinden okur, ekran görüntüsünden değil: kutunun sekiz köşesi
// projelendirilir. Bir köşe kameranın ARKASINDA kalırsa (z<=-1) projeksiyon
// işareti döner ve dikdörtgen anlamsızlaşır - o durum ayrıca bildirilir,
// sessizce "sığıyor" sayılmaz.

// Kutunun sekiz köşesi -> ekran dikdörtgeni. Kamera arkasında kalan köşe
// varsa {behind:true} döner; çağıran onu "ölçülemedi" diye işler.
export function projectBox(box, camera, width, height, THREE) {
  if (!box || box.isEmpty()) return null;
  const v = new THREE.Vector3();
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, behind = false;
  for (let i = 0; i < 8; i++) {
    v.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
    v.project(camera);
    if (v.z <= -1 || v.z >= 1) behind = true;
    const x = (v.x + 1) * width / 2, y = (1 - v.y) * height / 2;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return {x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, behind};
}

// Arayüzün bıraktığı alan. Her kenar, o kenarı kapatan en içteki elemana
// göre içeri çekilir - turda üstte marka çubuğu, altta altyazı ve transport,
// masaüstünde solda fotoğraf sütunu durur.
export function safeArea(width, height, rects = []) {
  let top = 0, bottom = height, left = 0, right = width;
  for (const r of rects) {
    if (!r || !(r.width > 0) || !(r.height > 0)) continue;
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    // Bir eleman hangi kenara yakınsa o kenarı yer. Dikey mi yatay mı
    // olduğuna, merkezinin hangi eksende daha uçta durduğuna bakılır.
    const dy = Math.min(cy, height - cy) / height, dx = Math.min(cx, width - cx) / width;
    if (dy <= dx) {
      if (cy < height / 2) top = Math.max(top, r.y + r.height);
      else bottom = Math.min(bottom, r.y);
    } else if (cx < width / 2) left = Math.max(left, r.x + r.width);
    else right = Math.min(right, r.x);
  }
  return {top, bottom, left, right, width: right - left, height: bottom - top,
    cx: (left + right) / 2, cy: (top + bottom) / 2};
}

// Tek ipucunun karnesi. `tolerance` merkez sapmasının kabul sınırı (güvenli
// alanın yarı genişliğine oranla), `margin` ise kenara değmeden bırakılması
// istenen pay (piksel).
export function gradeFraming(rect, area, {tolerance = 0.22, margin = 8} = {}) {
  if (!rect) return {measured: false};
  const fitsX = rect.x0 >= area.left + margin && rect.x1 <= area.right - margin;
  const fitsY = rect.y0 >= area.top + margin && rect.y1 <= area.bottom - margin;
  const cx = (rect.x0 + rect.x1) / 2, cy = (rect.y0 + rect.y1) / 2;
  // Sapma, güvenli alanın YARI ölçüsüne oranlanır: 0 tam ortada, 1 kenarda.
  const offX = area.width ? (cx - area.cx) / (area.width / 2) : 0;
  const offY = area.height ? (cy - area.cy) / (area.height / 2) : 0;
  const offset = Math.hypot(offX, offY);
  return {measured: true, fits: fitsX && fitsY && !rect.behind, fitsX, fitsY,
    behind: Boolean(rect.behind), offX, offY, offset, centred: offset <= tolerance,
    // Güvenli alanın ne kadarını dolduruyor - çok küçük bir özne de
    // "ortalanmış" sayılır ama anlatılan şey görünmez kalır.
    fill: area.width && area.height
      ? Math.min(1, Math.max(rect.w / area.width, rect.h / area.height)) : 0};
}
