// Açılış ekranının altında 5 sn'de bir dönen bilgiler: arayüz nasıl kullanılır,
// ev, bölge. Dil değişince o an gösterilen bilgi de anında çevrilir.
import {currentLang} from './i18n.js';

export const BOOT_TIPS = [
  {tr: 'Sürükleyerek evi döndürün; tekerlek ya da iki parmakla yakınlaştırın.',
   en: 'Drag to turn the house; scroll or pinch to zoom.'},
  {tr: 'Ev 500 m² brüt, 400 m² net: 5+4 oda, dört kat.',
   en: 'The house is 500 m² gross, 400 m² net: 5+4 rooms over four floors.'},
  {tr: 'Angora Evleri, Beysukent\'te: Hatırlı Sokak, Mutlukent, Çankaya.',
   en: 'Angora Evleri sits in Beysukent: Hatırlı Sokak, Mutlukent, Çankaya.'},
  {tr: 'Kat düğmeleri evi kesitten gösterir: bodrumdan çatıya dört kat.',
   en: 'The floor buttons show the house in section, basement to attic.'},
  {tr: '900 m² bahçe, özel havuz ve dört katı bağlayan asansör.',
   en: 'A 900 m² garden, a private pool and a lift joining all four floors.'},
  {tr: 'Yürüme figürünü bir odaya bırakın, evin içinde gezin; W A S D ile yürüyün.',
   en: 'Drop the walking figure into a room to walk inside; W A S D to move.'},
  {tr: 'Beytepe Ormanı yaklaşık 1 km, Hacettepe Üniversitesi 1,4 km uzakta.',
   en: 'Beytepe Forest is about 1 km away, Hacettepe University 1.4 km.'},
  {tr: 'Sesli tur evi ve bölgeyi baştan sona anlatır; istediğiniz an durdurun.',
   en: 'The narrated tour walks through the house and the area; pause it any time.'},
  {tr: 'Bodrumda kendi odası, banyosu ve WC\'si olan ayrı bir bölüm var.',
   en: 'The basement has a separate suite with its own room, bathroom and WC.'},
  {tr: 'Saat çubuğuyla güneşi gün boyu gezdirin; akşam evin ışıkları yanar.',
   en: 'Move the hour slider to follow the sun; in the evening the house lights up.'},
  {tr: 'Bölge haritasında okulları, sağlığı, alışverişi ve parkları tek dokunuşla açın.',
   en: 'On the area map, schools, health, shops and parks open with one tap.'},
  {tr: 'Fotoğraf iğneleri gerçek çekim noktalarıdır; dokununca fotoğraf açılır.',
   en: 'Photo pins mark where each real photograph was taken; tap to open it.'},
  {tr: 'Bilkent Üniversitesi yaklaşık 2,5 km; Çayyolu ve Çankaya merkezine kolay ulaşım.',
   en: 'Bilkent University is about 2.5 km away, with easy access to Çayyolu and central Çankaya.'},
  {tr: 'Plan görünümünde oda adları ve ölçüler gösterilir.',
   en: 'Plan view shows the room names and dimensions.'},
];

export function startBootTips(el, {every = 5000} = {}) {
  if (!el) return {refresh() {}, stop() {}};
  let i = Math.floor(Math.random() * BOOT_TIPS.length), timer = null;
  const text = () => BOOT_TIPS[i][currentLang() === 'en' ? 'en' : 'tr'];
  el.textContent = text();
  const next = () => {
    el.classList.add('boot-tip-out');
    setTimeout(() => {i = (i + 1) % BOOT_TIPS.length; el.textContent = text(); el.classList.remove('boot-tip-out');}, 420);
  };
  timer = setInterval(next, every);
  return {
    refresh() {el.textContent = text();},
    stop() {clearInterval(timer); timer = null;},
  };
}
