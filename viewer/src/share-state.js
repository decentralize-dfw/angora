// A visitor who finds the right floor at the right hour should be able to send
// that exact view to someone else, so the state the controls expose is mirrored
// in the query string. Every value is validated against the same set the
// control itself offers: a hand-edited, truncated or stale link can only ever
// produce a state the interface could have reached on its own.
const VIEWS = ['region', 'neighborhood', 'building', 'f0', 'f1', 'f2', 'f3'];
const SEASONS = ['172', '80', '355'];
const STYLES = ['soft', 'sun'];
const DEFAULTS = {view: 'neighborhood', hour: 12.5, season: '172', style: 'soft'};
// The daylight slider moves in five-minute steps.
const snapHour = hour => Math.round(hour * 12) / 12;
// Two decimals is finer than one step, so a link round-trips to the same
// slider position without carrying a repeating fraction.
const formatHour = hour => String(Number(snapHour(hour).toFixed(2)));

export function readShareState(search) {
  const params = new URLSearchParams(search), state = {};
  if (VIEWS.includes(params.get('view'))) state.view = params.get('view');
  const slugView = viewFromSlug(params); if (slugView) state.view = slugView;
  const hour = Number(params.get('hour'));
  if (params.has('hour') && Number.isFinite(hour) && hour >= 6 && hour <= 21) state.hour = snapHour(hour);
  if (SEASONS.includes(params.get('season'))) state.season = params.get('season');
  if (STYLES.includes(params.get('light'))) state.style = params.get('light');
  return state;
}

// 27.09 (ürün sahibi): adres çubuğunda "?hour=16&light=sun" gibi şeyler
// YAZILMAZ. En çok TEK bir görünüm kelimesi, dile göre Türkçe ya da İngilizce;
// açılış görünümünde (yakın çevre) hiç parametre yok. Saat/ışık/mevsim eski
// linklerden OKUNMAYA devam eder ama bir daha yazılmaz.
export const VIEW_SLUGS = Object.freeze({
  tr: {region: 'bolge', neighborhood: 'yakin-cevre', building: 'villa', f0: 'bodrum', f1: 'giris', f2: '1-kat', f3: 'cati'},
  en: {region: 'region', neighborhood: 'neighborhood', building: 'villa', f0: 'basement', f1: 'entrance', f2: 'first-floor', f3: 'attic'},
});
export function viewFromSlug(params) {
  for (const table of Object.values(VIEW_SLUGS))
    for (const [view, slug] of Object.entries(table)) if (params.has(slug) && params.get(slug) === '') return view;
  return null;
}
export function shareSearch(state) {
  const parts = [];
  // Dil ve (QA'nın) zorlanan profili ziyaretçinin kendi seçimi - korunur.
  if (state.lang === 'en') parts.push('lang=en');
  if (['desktop','mobile'].includes(state.profile)) parts.push('profile=' + state.profile);
  if (VIEWS.includes(state.view) && state.view !== DEFAULTS.view)
    parts.push(VIEW_SLUGS[state.lang === 'en' ? 'en' : 'tr'][state.view]);
  // Deneme bayrakları (?features=tur10:1) adres temizlenirken silinirse
  // yenileme eski modele döner - açıkça istenen bayrak korunur.
  if (typeof state.features === 'string' && /^[A-Za-z0-9]+:[01](,[A-Za-z0-9]+:[01])*$/.test(state.features))
    parts.push('features=' + state.features);
  return parts.length ? '?' + parts.join('&') : '';
}
