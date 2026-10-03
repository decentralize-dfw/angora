// R44 | The Bölge scale is a map, not a model. North-up, villa-centred,
// 1 km / 2 km radius. Two data layers, both the project's own:
//   - region-plan.json: the settlement itself, extracted from the delivery
//     (context roads rasterised, B-family hulls, the villa's footprint);
//   - region-places.json: the surroundings, extracted from uzakolcek.html
//     at the repo root - the 'Hatırlı Sokak No:10 Kentsel Donatı Atlası'
//     (OSM + Google/Yandex). Its information is used, never its design:
//     the atlas centre is the villa's own address point, chip distances
//     are the atlas's measured metres, and the quiet dot field is its
//     named amenities thinned by tools/extract_region_places_r44.mjs.
// One design language with the rest of the chrome: paper, hairline rings,
// glass chips, ink for the subject.
import plan from './region-plan.json';
import places from './region-places.json';
// The whole 2 km drawn as a plan - every road and building around the villa,
// from OSM via the fetch-osm-region workflow ("2km boyunca planı çiz").
import streets from './region-streets.json';
// 28.09: sitenin kendisi ürün sahibinin 3D modellerinden, OSM'e ÖLÇÜLEREK
// hizalanmış (tools/batch-delivery/make-region-site.mjs). Eski R44 katmanı
// (region-plan.json: yollar PNG + eski kütleler) OSM ile üst üste biniyordu.
import site from './region-site.json';
// OSM'in taşımadığı binalar (Beysukent ve çevresinde yarıdan fazlası):
// Overture Maps / Microsoft ML Building Footprints, 2,3 km içinde
// (tools/region/fetch_overture_buildings.py).
import mlBuildings from './region-buildings-ml.json';
// Çevrede: ürün sahibinin işaretlediği yerler + üç site kapısı, her zaman
// görünür; atlas kayıtlarından "hard ticari" olanlar gizlenir
// (tools/region/build_region_local.py).
import local from './region-local.json';
import { t, currentLang } from './i18n.js';
import { listing } from './listing.js';

const AREAS = [
  { name: 'Angora Evleri', x: 40, y: -195 },
  { name: 'Beysukent', x: -640, y: -430 },
];
// Sesli rehberin andığı yerler (tour-script.js 'mentions'). Konumlar harita
// verisinin kendisinden: orman, kampüs ve semt noktaları region-places.json
// kayıtlarından; 2 km'nin dışındakiler (Bilkent, ODTÜ, Çankaya) kenarda yön
// okuyla durur. Anıldıkları cümle boyunca haritada yanarlar.
const MENTIONS = {
  cankaya:         {tr: 'Çankaya', en: 'Çankaya', x: 15000, y: -1500},
  cayyolu:         {tr: 'Çayyolu', en: 'Çayyolu', x: -1400, y: -1500},
  beysukent:       {tr: 'Beysukent', en: 'Beysukent', x: -640, y: -430},
  'beytepe-forest':{tr: 'Beytepe Ormanı', en: 'Beytepe Forest', x: 542, y: -841},
  beytepe:         {tr: 'Beytepe', en: 'Beytepe', x: -600, y: 1050},
  hacettepe:       {tr: 'Hacettepe Üniversitesi', en: 'Hacettepe University', x: 1423, y: 199},
  bilkent:         {tr: 'Bilkent Üniversitesi', en: 'Bilkent University', x: 2521, y: 280},
  odtu:            {tr: 'ODTÜ', en: 'METU', x: 6000, y: -1200},
};
// one label per amenity group, in places.groups order (see the extractor)
const GROUP_KEYS = ['groupEdu', 'groupHealth', 'groupFood', 'groupShop', 'groupSport', 'groupService'];
// One drawing per family, in that family's own colour. Six named chips do not
// fit across a phone - the row ran off the right edge and the last two had to
// be scrolled to - so on a phone the name comes off the button and this takes
// its place: a cap, a cross, a fork and knife, a bag, a tree and a civic
// front, which is about as close to unambiguous as a 19 px mark gets. The
// name stays on the button as its label, so nothing is lost to a reader.
const GROUP_ICONS = [
  '<path d="M8 2.6 15 5.9 8 9.2 1 5.9Z" fill="currentColor" stroke="none"/><path d="M4.3 7.5v3c0 1.3 7.4 1.3 7.4 0v-3"/>',
  '<path d="M6.5 2.4h3v4.1h4.1v3h-4.1v4.1h-3V9.5H2.4v-3h4.1Z" fill="currentColor" stroke="none"/>',
  '<path d="M4 2.4v3.1M6 2.4v3.1M8 2.4v3.1M4 5.5h4M6 5.5v8.1"/><path d="M10.9 2.4c1.5 1 1.5 5.4 0 6.4v4.8"/>',
  '<path d="M3.6 5.7h8.8l-.8 7.9H4.4Z"/><path d="M6.2 5.7V4.4a1.8 1.8 0 0 1 3.6 0v1.3"/>',
  '<path d="M8 2.2 4.6 7.1h6.8Z"/><path d="M8 5.7 3.6 11.5h8.8Z"/><path d="M8 11.5v2.3"/>',
  '<path d="M2.4 6.5 8 3.2l5.6 3.3"/><path d="M4.6 7.9v4.2M8 7.9v4.2M11.4 7.9v4.2"/><path d="M2.8 13.3h10.4"/>',
];
const groupIcon = (g, color) =>
  `<svg class="rm-ico" viewBox="0 0 16 16" style="color:${color}" fill="none" stroke="currentColor"` +
  ` stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GROUP_ICONS[g]}</svg>`;
const svgNS = 'http://www.w3.org/2000/svg';
const km = (m) => (m < 950 ? `${m} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`);

export const atlasMeta = () => `${places.total} ${t('amenities')} · Atlas ${places.atlas_generated_at}` +
  (streets.roads.length ? ' · Plan © OpenStreetMap, Microsoft (Overture)' : ' (OSM)');

// Çevrede listelerinde genel adlar (marka/dükkân adları olduğu gibi kalır).
const LIST_EN = {Eczane: 'Pharmacy', 'Balıkçı': 'Fishmonger', Kasap: 'Butcher', Kafe: 'Café', restoran: 'restaurant'};
const listEn = (text) => text.split(' · ').map((w) => LIST_EN[w] ?? w).join(' · ');

export function createRegionMap(host) {
  const el = document.createElement('div');
  el.className = 'region-map';
  el.hidden = true;
  el.setAttribute('aria-hidden', 'true');

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'rm-svg');
  const world = document.createElementNS(svgNS, 'g');
  svg.append(world);
  const labels = document.createElement('div');
  labels.className = 'rm-labels';
  // Sitenin DIŞI: %20 beyaz + 8 px bulanıklık. Sınır çizgisinin üstüne
  // gelince ya da sesli rehber "Angora Evleri" derken açılır; kırpma yolu
  // layout() içinde sınırın ekran izdüşümünden kurulur.
  const outside = document.createElement('div');
  outside.className = 'rm-outside';
  el.append(svg, outside, labels);

  const shape = (tag, cls, attrs = {}) => {
    const n = document.createElementNS(svgNS, tag);
    if (cls) n.setAttribute('class', cls);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    world.append(n);
    return n;
  };
  const poly = (pts) => pts.map(([x, y]) => `${x},${y}`).join(' ');

  // plan layers, meter units. Underneath everything the district itself,
  // drawn as a plan: green, buildings, then the street network with the
  // hierarchy a drawing gives it. The derived monochrome wash only stands
  // in while no OSM extract has been fetched.
  const flatPoints = (pts) => {
    let s = '';
    for (let i = 0; i < pts.length; i += 2) s += `${pts[i]},${pts[i + 1]} `;
    return s.trim();
  };
  if (streets.roads.length) {
    // Modelin çizdiği yerde OSM'in kopyası çizilmez: model evine düşen OSM
    // binası ve modelin asfaltına oturan OSM yol parçası atlanır.
    const hiddenBuildings = new Set(site.osm.hideBuildings), replacedRoads = new Set(site.osm.replacedRoads);
    // 03.10 BÖLGE TAKILMASI: plan katmanı eskiden her bina/yol/yeşil için ayrı
    // bir SVG düğümüydü - ~13 500 düğüm, ~110 bin köşe. Bölge'ye basınca
    // tarayıcı bunların hepsine birden stil + yerleşim + boyama yapıyordu
    // (ana iş parçacığı kilitlenir), sonra her animasyon karesinde hepsini
    // yeniden boyuyordu. Aynı sınıftaki şekiller artık TEK <path>'in alt
    // yolları: çizim aynı, düğüm sayısı ~10. Binalar örtüşmez; OSM ve
    // Overture ayrı yolda kalır, ikisi üst üste binse bile delik açılmaz.
    const subpath = (pts) => 'M' + flatPoints(pts) + 'Z';
    const openPath = (pts) => 'M' + flatPoints(pts);
    shape('path', 'rm-green', { d: streets.green.map(subpath).join('') });
    shape('path', 'rm-bldg', { d: streets.buildings.filter((_, i) => !hiddenBuildings.has(i)).map(subpath).join('') });
    const hiddenMl = new Set(site.osm.hideMl ?? []);
    shape('path', 'rm-bldg', { d: mlBuildings.buildings.filter((_, i) => !hiddenMl.has(i)).map(subpath).join('') });
    // sitenin gerçek asfaltı (bordür dahil), yol çizgilerinin altında
    shape('path', 'rm-site-road', { d: site.roads.map(r => 'M' + poly(r) + 'Z').join(' '), 'fill-rule': 'evenodd' });
    for (const cls of [3, 2, 1, 0]) {
      const runs = streets.roads.filter(([c], i) => c === cls && !replacedRoads.has(i)).map(([, , pts]) => openPath(pts));
      for (const [c, pts] of site.osm.keptRuns) if (c === cls) runs.push(openPath(pts));
      if (runs.length) shape('path', `rm-road rm-road-${cls}`, { d: runs.join('') });
    }
    // Ana arterler (ürün sahibi kırmızıyla çizdi): bir ton koyu, adıyla
    const major = streets.roads.filter(([, name]) => local.majorRoads.includes(name)).map(([, , pts]) => openPath(pts));
    if (major.length) shape('path', 'rm-road rm-road-major', { d: major.join('') });
    // the settlement's own OSM polygon: Angora Evleri, outlined
    if (streets.boundary) shape('polygon', 'rm-bound', { points: flatPoints(streets.boundary.ring) });
  } else {
    shape('image', 'rm-base', { href: places.base.png, x: places.base.x, y: places.base.y,
      width: places.base.w, height: places.base.h, preserveAspectRatio: 'none' });
  }
  shape('polygon', 'rm-plot', { points: poly(site.plot) });
  // The narrated tour's light on the settlement. Cut along Angora Evleri's own
  // boundary - streets.boundary.ring, the OSM way this map already draws as
  // the dashed outline - and drawn inside the world group, so it keeps its
  // registration through every radius and turn.
  //
  // NOT plan.plot, which is the VILLA's 22 x 35 m plot: cutting the hole from
  // that left a mark the size of one house on a two-kilometre map. And not a
  // circle about the villa either, which is what it was before that: a disc
  // lights part of Beysukent and leaves the estate's east half in the dark.
  const dimDefs = document.createElementNS(svgNS, 'defs');
  const dimMask = document.createElementNS(svgNS, 'mask');
  dimMask.setAttribute('id', 'rm-plot-mask');
  dimMask.setAttribute('maskUnits', 'userSpaceOnUse');
  const dimAll = document.createElementNS(svgNS, 'rect');
  for (const [k, v] of Object.entries({x: -12000, y: -12000, width: 24000, height: 24000, fill: '#fff'}))
    dimAll.setAttribute(k, v);
  const dimBlur = document.createElementNS(svgNS, 'filter');
  dimBlur.setAttribute('id', 'rm-plot-feather');
  dimBlur.setAttribute('x', '-20%'); dimBlur.setAttribute('y', '-20%');
  dimBlur.setAttribute('width', '140%'); dimBlur.setAttribute('height', '140%');
  const dimGauss = document.createElementNS(svgNS, 'feGaussianBlur');
  dimGauss.setAttribute('stdDeviation', '26');
  dimBlur.append(dimGauss);
  const dimHole = document.createElementNS(svgNS, 'polygon');
  dimHole.setAttribute('points', streets.boundary
    ? flatPoints(streets.boundary.ring) : poly(plan.plot));
  dimHole.setAttribute('fill', '#000');
  dimHole.setAttribute('filter', 'url(#rm-plot-feather)');
  dimMask.append(dimAll, dimHole);
  dimDefs.append(dimBlur, dimMask);
  world.append(dimDefs);
  const dim = shape('rect', 'rm-dim', {x: -12000, y: -12000, width: 24000, height: 24000,
    mask: 'url(#rm-plot-mask)'});
  dim.setAttribute('visibility', 'hidden');
  for (const b of site.houses) shape('polygon', 'rm-bldg rm-site-bldg', { points: poly(b) });
  if (site.pool) shape('polygon', 'rm-pool', { points: poly(site.pool) });
  // the atlas's named amenities: every dot carries its own title on a
  // rounded card (the bare halo read as nothing), in its group's colour.
  // Which titles actually print at a given radius is decided in layout(),
  // where nothing is allowed to sit on anything else.
  const dotLabels = [], dotMarks = [];
  const hiddenDots = new Set(local.hideDots);
  for (const [i, [x, y, g, name]] of places.dots.entries()) {
    if (hiddenDots.has(i)) continue;
    dotMarks.push(shape('circle', `rm-dot rm-g${g}`, { cx: x, cy: y, r: 9, fill: places.groups[g] }));
    if (name) {
      const tag = document.createElementNS(svgNS, 'g');
      tag.setAttribute('class', `rm-dot-tag rm-g${g}`);
      const bg = document.createElementNS(svgNS, 'rect');
      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', x + 14); text.setAttribute('y', y + 10);
      text.textContent = name;
      tag.append(bg, text); world.append(tag);
      dotLabels.push({ el: tag, bg, text, x, y, g, name, d: Math.hypot(x, y) });
    }
  }
  dotLabels.sort((a, b) => a.d - b.d);
  for (const r of [500, 1000, 2000]) shape('circle', 'rm-ring', { cx: 0, cy: 0, r, 'vector-effect': 'non-scaling-stroke' });
  // Villa, kendi gerçek yerinde (harita merkezi adres noktası; villa ondan
  // ~38 m doğu-güneyde).
  const villaAt = site.villa.reduce((a, [x, y]) => [a[0] + x / site.villa.length, a[1] + y / site.villa.length], [0, 0]);
  // Villa nabzı HTML katmanında: SVG içindeki sonsuz CSS animasyonu, harita
  // açık kaldığı sürece HER KAREDE bütün planı yeniden boyatıyordu. Ayrı bir
  // HTML öğesinin transform/opacity animasyonu bileşiciden (GPU) yürür.
  const pulse = document.createElement('i');
  pulse.className = 'rm-pulse';
  shape('polygon', 'rm-villa', { points: poly(site.villa) });
  const hiddenCurated = new Set(local.hideCurated);
  for (const [i, p] of places.curated.entries()) {
    if (p.d <= 2000 && !hiddenCurated.has(i)) dotMarks.push(shape('circle', `rm-poi rm-g${p.g}`, { cx: p.x, cy: p.y, r: 4, 'vector-effect': 'non-scaling-stroke' }));
  }
  // Çevrede katmanı: gerçek konumda küçük bir nokta, adı üstünde (her zaman)
  // Donatı katmanına uyar: grubu kapalıysa noktası da etiketi de yok
  for (const p of local.places) dotMarks.push(shape('circle', `rm-local-dot rm-g${p.g}`, { cx: p.x, cy: p.y, r: 4, fill: places.groups[p.g] }));
  for (const g of local.gates) dotMarks.push(shape('circle', 'rm-gate-dot', { cx: g.x, cy: g.y, r: 4 }));

  // labels: glass chips in screen space, gliding with the same projection
  const chips = [];
  const chip = (cls, html, mx, my, clamp = false) => {
    const c = document.createElement('span');
    c.className = 'rm-chip ' + cls;
    c.innerHTML = html;
    labels.append(c);
    chips.push({ el: c, mx, my, clamp });
    return c;
  };
  chip('rm-chip-villa', '<strong>Villa 21</strong>', villaAt[0] + 4, villaAt[1] - 16);
  for (const r of [500, 1000, 2000]) chip('rm-chip-ring', r < 1000 ? '500 m' : `${r / 1000} km`, 0, -r);
  for (const a of AREAS) chip('rm-chip-area' + (a.name === 'Angora Evleri' ? ' rm-chip-site' : ''), a.name, a.x, a.y);
  for (const [i, p] of places.curated.entries()) {
    if (local.hideCurated.includes(i)) continue;
    const bearing = Math.atan2(p.y, p.x) * 180 / Math.PI;
    const c = chip('rm-chip-poi', `${p.name} <b>${km(p.d)}</b>` +
      (p.d > 2000 ? ` <em style="transform:rotate(${bearing.toFixed(0)}deg)">→</em>` : ''), p.x, p.y, p.d > 2000);
    c.dataset.distance = p.d;
    c.dataset.g = p.g;
  }
  const en = currentLang() === 'en';
  for (const p of local.places) {
    const c = chip("rm-chip-poi rm-chip-local", `${en && p.en ? p.en : p.name}` +
      (p.list ? `<small>${en ? listEn(p.list) : p.list}</small>` : ''), p.x, p.y);
    c.dataset.distance = Math.hypot(p.x, p.y); c.dataset.g = String(p.g); c.dataset.rank = p.rank ?? 2;
  }
  for (const g of local.gates) {
    const c = chip('rm-chip-poi rm-chip-local rm-chip-gate', en ? 'Site gate' : 'Site kapısı', g.x, g.y);
    c.dataset.distance = Math.hypot(g.x, g.y); c.dataset.g = '-2'; c.dataset.rank = 0;
  }
  // Ana arter adları: yol boyunca döndürülmüş, villaya 250 m'den uzak ilk
  // uygun noktada (villanın çevresini kalabalıklaştırmaz)
  const roadNames = [];
  for (const name of local.majorRoads) {
    let best = null;
    for (const [, n, p] of streets.roads) {
      if (n !== name) continue;
      for (let i = 2; i + 2 < p.length; i += 2) {
        const d = Math.hypot(p[i], p[i + 1]);
        if (d < 250) continue;
        if (!best || d < best.d) best = {d, x: p[i], y: p[i + 1], a: Math.atan2(p[i + 3] - p[i - 1], p[i + 2] - p[i - 2]) * 180 / Math.PI};
      }
    }
    if (!best) continue;
    const c = chip('rm-chip-road', name, best.x, best.y);
    c.dataset.distance = best.d; roadNames.push({el: c, a: best.a, d: best.d});
  }
  // Anılan yerler: haritada yumuşak bir ışık halkası + kendi etiketi.
  const mentionState = new Set();
  const mentionMarks = [];
  for (const [id, m] of Object.entries(MENTIONS)) {
    const d = Math.hypot(m.x, m.y);
    const glow = shape('circle', 'rm-mention-glow', { cx: m.x, cy: m.y, r: 40 });
    mentionMarks.push({ id, glow, d });
    const bearingDeg = Math.atan2(m.y, m.x) * 180 / Math.PI;
    const c = chip('rm-chip-poi rm-chip-mention', `${currentLang() === 'en' ? m.en : m.tr}` +
      (d > 2000 ? ` <em style="transform:rotate(${bearingDeg.toFixed(0)}deg)">→</em>` : ''), m.x, m.y, d > 2000);
    c.dataset.distance = d; c.dataset.g = '-1'; c.dataset.mention = id;
  }
  labels.prepend(pulse);
  const compass = document.createElement('span');
  compass.className = 'rm-compass';
  compass.innerHTML = '<i>↑</i>K';
  labels.append(compass);

  // The settlement, introduced once and properly, when the Bölge scale opens.
  // The panel used to close on a grid of straight-line distances to a park, a
  // school, a market and a pharmacy. They are still on the map, each dot
  // carrying its own measured distance in its chip, which is where a distance
  // belongs; repeated as a headline list they read as sales copy about
  // somewhere else. The introduction and the listing's own location paragraph
  // stand in their place.
  const info = document.createElement('aside');
  info.className = 'rm-info';
  info.setAttribute('aria-label', currentLang() === 'en' ? 'About Angora Evleri' : 'Angora Evleri hakkında');
  const area = listing(currentLang()).region;
  info.innerHTML =
    `<h3>Angora Evleri</h3><p class="rm-info-set">${area.set}</p>` +
    area.body.map(text => `<p class="rm-info-body">${text}</p>`).join('');
  // One amenity family at a time: the map opens as the bare plan - every
  // category off - and a chip turns exactly one on; pressing it again, or
  // pressing another, puts it away ("hepsi kapalı gelsin, tek bir şey").
  const filters = document.createElement('div');
  filters.className = 'rm-filters';
  filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', currentLang() === 'en' ? 'Amenity filters' : 'Donatı filtreleri');
  const off = new Set(places.groups.map((_, i) => i));
  for (const g of off) el.classList.add(`rm-off-${g}`);
  let activeGroup = null;
  const filterButtons = places.groups.map((color, g) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    // Both forms travel on the button; the screen decides which is drawn.
    const name = t(GROUP_KEYS[g]);
    b.innerHTML = `<i style="background:${color}"></i>${groupIcon(g, color)}<span>${name}</span>`;
    b.setAttribute('aria-label', name);
    b.title = name;
    b.onclick = () => {
      if (activeGroup !== null) {
        off.add(activeGroup); el.classList.add(`rm-off-${activeGroup}`);
        filterButtons[activeGroup].setAttribute('aria-pressed', 'false');
      }
      if (activeGroup === g) activeGroup = null;
      else {
        activeGroup = g; off.delete(g); el.classList.remove(`rm-off-${g}`);
        b.setAttribute('aria-pressed', 'true');
      }
      layout();
    };
    filters.append(b);
    return b;
  });
  const description=document.querySelector('#region-description');
  if(description){description.replaceChildren(info);info.classList.add('rm-info-inline');el.append(filters);}
  else el.append(info, filters);

  // Angora Evleri sınırı (OSM): ekran izdüşümü her layout'ta yenilenir.
  const ring = streets.boundary ? (() => { const r = []; const f = streets.boundary.ring; for (let i = 0; i < f.length; i += 2) r.push([f[i], f[i + 1]]); return r; })() : null;
  let screenRing = [];
  let hoverOn = false, tourOn = false, clickOn = false, panelOn = false;
  const siteOn = () => el.classList.toggle('rm-site-on', hoverOn || tourOn || clickOn || panelOn);
  // Haritadaki "Angora Evleri" yazısı: basınca sınır vurgusu açılır/kapanır
  const siteChip = chips.find(c => c.el.classList.contains('rm-chip-site'));
  if (siteChip) {
    siteChip.el.setAttribute('role', 'button'); siteChip.el.tabIndex = 0;
    const toggle = () => { clickOn = !clickOn; siteOn(); };
    siteChip.el.addEventListener('click', toggle);
    siteChip.el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  }
  // Adı yazmayan noktalar: üzerine gelince ad belirir
  const tip = document.createElement('span');
  tip.className = 'rm-chip rm-tip'; tip.hidden = true; labels.append(tip);
  const hoverables = [
    ...dotLabels.map(l => ({x: l.x, y: l.y, g: l.g, name: l.name, shown: () => l.el.getAttribute('visibility') === 'visible'})),
    ...local.places.map(p => {
      const c = chips.find(ch => ch.el.classList.contains('rm-chip-local') && ch.mx === p.x && ch.my === p.y);
      return {x: p.x, y: p.y, g: p.g, name: currentLang() === 'en' && p.en ? p.en : p.name, shown: () => c && c.el.style.opacity === '1'};
    }),
  ];
  let screenScale = 1, screenCentre = [0, 0];
  const ringDistance = (px, py) => {
    let best = Infinity;
    for (let i = 0; i < screenRing.length; i++) {
      const [ax, ay] = screenRing[i], [bx, by] = screenRing[(i + 1) % screenRing.length];
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
      best = Math.min(best, Math.hypot(ax + t * dx - px, ay + t * dy - py));
    }
    return best;
  };
  const insideRing = (px, py) => { let inside = false; for (let i = 0, j = screenRing.length - 1; i < screenRing.length; j = i++) { const [xi, yi] = screenRing[i], [xj, yj] = screenRing[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside; } return inside; };
  // Çizginin üstüne gelince açılır; imleç sitenin içinde ya da çizgiye
  // yakın kaldıkça açık kalır, dışarı uzaklaşınca kapanır.
  el.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    const r = el.getBoundingClientRect(), px = event.clientX - r.left, py = event.clientY - r.top;
    // en yakın, katmanı açık ve adı görünmeyen nokta (10 px içinde)
    const cosB = Math.cos(bearing * Math.PI / 180), sinB = Math.sin(bearing * Math.PI / 180);
    let near = null, nearD = 10;
    for (const h of hoverables) {
      if (off.has(h.g)) continue;
      const sx = screenCentre[0] + (h.x * cosB - h.y * sinB) * screenScale, sy = screenCentre[1] + (h.x * sinB + h.y * cosB) * screenScale;
      const d = Math.hypot(sx - px, sy - py);
      if (d < nearD) { nearD = d; near = {h, sx, sy}; }
    }
    if (near && !near.h.shown()) {
      tip.textContent = near.h.name; tip.hidden = false;
      tip.style.transform = `translate(-50%, -100%) translate(${near.sx.toFixed(1)}px, ${(near.sy - 8).toFixed(1)}px)`;
    } else tip.hidden = true;
    if (!screenRing.length) return;
    const d = ringDistance(px, py);
    const next = d < 10 || (hoverOn && (d < 36 || insideRing(px, py)));
    if (next !== hoverOn) { hoverOn = next; siteOn(); }
  });
  el.addEventListener('pointerleave', () => { tip.hidden = true; if (hoverOn) { hoverOn = false; siteOn(); } });
  let radius = 1000;
  // The map is north-up at rest. The narrated tour turns it slowly about
  // the villa - its own centre - while the opening sentences place the
  // district, because a still map for thirty-eight seconds reads as a
  // picture rather than as a place. Everything that carries words is
  // counter-turned so the drawing moves and the reading does not.
  let bearing = 0;
  const layout = () => {
    const vw = el.clientWidth || innerWidth, vh = el.clientHeight || innerHeight;
    const pad = Math.min(vw, vh) < 560 ? 46 : 72;
    const s = (Math.min(vw, vh) / 2 - pad) / radius;
    const phone = Math.min(vw, vh) < 560;
    const cx = vw / 2, cy = vh / 2;
    world.style.transform = `translate(${cx}px, ${cy}px) rotate(${bearing}deg) scale(${s})`;
    screenScale = s; screenCentre = [cx, cy]; tip.hidden = true;
    // The same turn, applied to the metre coordinates the chips are placed
    // from, so screen-space labels and the drawing under them stay agreed.
    const cosB = Math.cos(bearing * Math.PI / 180), sinB = Math.sin(bearing * Math.PI / 180);
    const turn = (x, y) => [x * cosB - y * sinB, x * sinB + y * cosB];
    compass.style.setProperty('--rm-bearing', `${bearing}deg`);
    if (ring) {
      screenRing = ring.map(([x, y]) => { const [tx, ty] = turn(x, y); return [cx + tx * s, cy + ty * s]; });
      outside.style.clipPath = `path(evenodd, 'M0 0H${vw}V${vh}H0Z M${screenRing.map(([x, y]) => x.toFixed(1) + ' ' + y.toFixed(1)).join(' L')}Z')`;
    }
    let clampRank = 0;
    // occupied label space: the villa chip and the radius panel are seeded as
    // blockers, then place chips nearest-first, nudging any collision away
    // from the centre in 15 px steps until it sits free.
    const taken = [
      { x: cx - 60, y: cy - 32, w: 120, h: 58 },                    // villa chip + pulse heart
      // region panel + scale picker + filter row: bottom centre on wide
      // screens, the whole bottom band on phones where they span edge to edge
      vw < 560 ? { x: 8, y: vh - 276, w: vw - 16, h: 276 } : { x: cx - 170, y: vh - 190, w: 340, h: 190 },
    ];
    // the intro card, the filter chips and the standing chrome (top bar, the
    // view description) are laid out elsewhere; whatever space they actually
    // hold is blocked for the landmark chips
    const er = el.getBoundingClientRect();
    for (const fixed of [info, filters, document.querySelector('.topbar'), document.querySelector('.view-description')]) {
      const r = fixed?.getBoundingClientRect();
      if (r?.width) taken.push({ x: r.left - er.left - 6, y: r.top - er.top - 6, w: r.width + 12, h: r.height + 12 });
    }
    const hits = (r) => taken.some((t) => r.x < t.x + t.w && r.x + r.w > t.x && r.y < t.y + t.h && r.y + r.h > t.y);
    const order = [...chips].sort((a, b) => (Number(a.el.dataset.distance) || 0) - (Number(b.el.dataset.distance) || 0));
    for (const m of mentionMarks) {
      const on = mentionState.has(m.id);
      m.glow.classList.toggle('rm-on', on);
      m.glow.setAttribute('r', (phone ? 26 : 34) / s);
    }
    const localChips = [];
    for (const c of order) {
      // Çevrede katmanı ayrı yerleşir (aşağıda): konum doğruluğu önce gelir,
      // uzak kaydırma yok
      if (c.el.classList.contains('rm-chip-local')) { localChips.push(c); continue; }
      const mention = c.el.dataset.mention;
      if (mention && !mentionState.has(mention)) { c.el.style.opacity = 0; c.el.classList.remove('rm-on'); continue; }
      if (mention) c.el.classList.add('rm-on');
      let { mx, my } = c;
      if (c.clamp) {
        const d = Math.hypot(mx, my) || 1;
        // stagger the edge chips so near-parallel bearings do not stack
        const lim = radius * (0.94 - (clampRank++ % 3) * 0.085);
        if (d > lim) { mx = (mx / d) * lim; my = (my / d) * lim; }
      }
      [mx, my] = turn(mx, my);
      let px = cx + mx * s, py = cy + my * s;
      if (c.el.classList.contains('rm-chip-poi')) {
        // keep landmark chips readable inside narrow viewports; a true-position
        // chip beyond the chosen radius, or one whose group is filtered off,
        // fades out instead of hiding under chrome
        const faded = off.has(Number(c.el.dataset.g)) ||
          (!c.clamp && Number(c.el.dataset.distance) > radius * 1.12);
        c.el.style.opacity = faded ? 0 : 1;
        const w = (c.el.offsetWidth || 168) + 10, h = (c.el.offsetHeight || 26) + 6;
        px = Math.max(w / 2, Math.min(vw - w / 2, px));
        py = Math.max(96, Math.min(vh - 110, py));
        if (!faded) {
          // nudge away from the centre; if that lane is blocked all the way
          // (the bottom panel), walk the other way instead
          const start = py;
          const attempt = (step) => {
            let y = start;
            let rect = { x: px - w / 2, y: y - h / 2, w, h };
            for (let tries = 0; tries < 60 && hits(rect); tries++) { y += step; rect.y = y - h / 2; }
            return { y, ok: !hits({ x: px - w / 2, y: y - h / 2, w, h }) && y > 90 && y < vh - 104 };
          };
          const first = attempt(py >= cy ? 15 : -15);
          const pick = first.ok ? first : attempt(py >= cy ? -15 : 15);
          // No free lane at all - a phone's bottom band swallowing the walk -
          // means this chip yields rather than parking over the controls:
          // "hiçbir yerde çakışma olmayacak" outranks one more label.
          if (!pick.ok) { c.el.style.opacity = 0; }
          else {
            py = Math.max(96, Math.min(vh - 110, pick.y));
            taken.push({ x: px - w / 2, y: py - h / 2, w, h });
          }
        }
      }
      // ring, area and villa chips block label space exactly like the
      // placed landmark chips do - nothing may sit under them either
      if (!c.el.classList.contains('rm-chip-poi')) {
        const w = (c.el.offsetWidth || 60) + 8, h = (c.el.offsetHeight || 22) + 6;
        taken.push({ x: px - w / 2, y: py - h / 2, w, h });
      }
      const road = c.el.classList.contains('rm-chip-road') ? roadNames.find(r => r.el === c.el) : null;
      if (road) {
        let a = road.a + bearing; a = ((a + 90) % 180 + 180) % 180 - 90;   // hep okunur yönde
        c.el.style.opacity = road.d > radius * 1.08 ? 0 : 1;
        c.el.style.transform = `translate(-50%, -50%) translate(${px}px, ${py}px) rotate(${a.toFixed(1)}deg)`;
        continue;
      }
      c.el.style.transform = `translate(-50%, -50%) translate(${px}px, ${py}px)`;
    }
    // Çevrede: etiket noktasının hemen üstünde, sığmazsa altında, sağında,
    // solunda; hiçbiri boş değilse etiket gizlenir, nokta kalır. Kapılar önce.
    localChips.sort((a, b) => (Number(a.el.dataset.rank) - Number(b.el.dataset.rank)) ||
      (Number(a.el.dataset.distance) - Number(b.el.dataset.distance)));
    for (const c of localChips) {
      if (off.has(Number(c.el.dataset.g))) { c.el.style.opacity = 0; continue; }
      const [mx, my] = turn(c.mx, c.my), x = cx + mx * s, y = cy + my * s;
      const w = (c.el.offsetWidth || 120) + 6, h = (c.el.offsetHeight || 22) + 4;
      let placed = null;
      if (Number(c.el.dataset.distance) <= radius * 1.15 && x > 0 && x < vw && y > 60 && y < vh - 40) {
        for (const [ox, oy] of [[0, -h / 2 - 6], [0, h / 2 + 6], [w / 2 + 7, 0], [-w / 2 - 7, 0]]) {
          const r = {x: x + ox - w / 2, y: y + oy - h / 2, w, h};
          if (r.y < 90 || r.y + r.h > vh - 100 || r.x < 4 || r.x + r.w > vw - 4) continue;
          if (!hits(r)) { placed = r; break; }
        }
      }
      if (!placed) { c.el.style.opacity = 0; continue; }
      taken.push(placed);
      c.el.style.opacity = 1;
      c.el.style.transform = `translate(${(placed.x + 3).toFixed(1)}px, ${(placed.y + 2).toFixed(1)}px)`;
    }
    // dot titles, nearest first: a title prints only where it overlaps
    // nothing - no chip, no panel, no other title. What cannot sit clear
    // at this radius waits for a closer one; the 500 m view seats them all.
    // The rounded card behind each title is sized here, since the type
    // size changes with the radius.
    // EKRAN PİKSELİNE SABİT: yazı, nokta ve etiket kartı harita birimiyle
    // verilince ekrana sığdırma ölçeğiyle büyüyüp küçülüyordu (aynı başlık
    // masaüstünde ~10 px, telefonda ~4 px). Hedef boyut sabit, harita birimi
    // ondan türetilir - her yarıçapta, her ekranda aynı okunaklılık.
    const fsU = (phone ? 10.5 : 11.5) / s;
    for (const m of dotMarks) m.setAttribute('r', (phone ? 3.2 : 3.8) / s);
    {
      const [px, py] = turn(villaAt[0], villaAt[1]);
      pulse.style.left = `${(cx + px * s).toFixed(1)}px`; pulse.style.top = `${(cy + py * s).toFixed(1)}px`;
    }
    // Kalabalık olmasın: yakından uzağa en çok bu kadar başlık.
    const maxTitles = phone ? 6 : 12;
    const kept = [];
    for (const l of dotLabels) {
      l.text.style.fontSize = `${fsU}px`;
      if (off.has(l.g) || kept.length >= maxTitles) { l.el.setAttribute('visibility', 'hidden'); continue; }
      const gapU = 6 / s, wU = l.name.length * fsU * 0.58 + 2 * gapU, hU = fsU * 1.6;
      l.text.setAttribute('x', l.x + gapU * 1.6); l.text.setAttribute('y', l.y + fsU * 0.38);
      l.bg.setAttribute('x', l.x + gapU * 0.6); l.bg.setAttribute('y', l.y + fsU * 0.38 - fsU * 1.12);
      l.bg.setAttribute('width', wU); l.bg.setAttribute('height', hU);
      l.bg.setAttribute('rx', hU / 2);
      const [tx, ty] = turn(l.x + gapU * 0.6, l.y + fsU * 0.38 - fsU * 1.12);
      const rect = { x: cx + tx * s - 2, y: cy + ty * s - 2, w: wU * s + 4, h: hU * s + 4 };
      l.el.setAttribute('transform', bearing ? `rotate(${-bearing} ${l.x} ${l.y})` : '');
      const visible = rect.x > 0 && rect.y > 0 && rect.x + rect.w < vw && rect.y + rect.h < vh &&
        !hits(rect) && !kept.some((t) => rect.x < t.x + t.w && rect.x + rect.w > t.x && rect.y < t.y + t.h && rect.y + rect.h > t.y);
      l.el.setAttribute('visibility', visible ? 'visible' : 'hidden');
      if (visible) kept.push(rect);
    }
    el.dataset.radius = radius;
  };

  let raf = 0;
  const onResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); };

  host.append(el);
  // The reveal proper, kept apart from show() so a queued one can be dropped.
  let pendingShow = null;
  const reveal = () => {
    if (!el.hidden) return;
    el.hidden = false;
    el.setAttribute('aria-hidden', 'false');
    // İlk yerleşim animasyonsuz: dünya grubunun 950 ms'lik transform geçişi
    // açılışta bütün planı ~57 kare boyunca yeniden boyatıyordu.
    el.classList.add('rm-instant');
    layout();
    void el.offsetWidth;
    el.classList.remove('rm-instant');
    addEventListener('resize', onResize);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('rm-active')));
    // Harita opak zeminiyle ekranı tamamen örttüğünde 3B sahnenin çizilmesi
    // gereksiz: main.js bu bayrağa bakıp alttaki kareyi çizmez.
    clearTimeout(coverTimer);
    coverTimer = setTimeout(() => { covering = !el.hidden && el.classList.contains('rm-active'); }, 420);
  };
  let covering = false, coverTimer = 0;
  return {
    element: el,
    get radius() { return radius; },
    setRadius(r) { radius = r; layout(); },
    // Degrees clockwise about the villa. Cheap enough to call at a few hertz:
    // with every family filtered off there is almost nothing left to place.
    setBearing(deg) { if (deg === bearing) return; bearing = deg; layout(); },
    // Everything outside the settlement goes dark, along its own outline.
    // 28.09: karartma yerine sınır vurgusu - dışarısı %20 beyaz + 8 px bulanık.
    setHighlight(on) { tourOn = Boolean(on); siteOn(); },
    // Sol alttaki "Angora Evleri" paneli açıkken de sınır vurgusu
    setPanelOpen(on) { panelOn = Boolean(on); siteOn(); },
    // Sesli rehberin o cümlede andığı yerler; [] hepsini söndürür.
    setMentions(ids = []) {
      // 'angora-evleri': sitenin kendisi - halka değil, sınır vurgusu
      tourOn = ids.includes('angora-evleri'); siteOn();
      const next = new Set(ids.filter(id => id in MENTIONS));
      if (next.size === mentionState.size && [...next].every(id => mentionState.has(id))) return;
      mentionState.clear(); for (const id of next) mentionState.add(id);
      layout();
    },
    get bearing() { return bearing; },
    // The amenity family on show, by the same one-at-a-time rule the chips
    // follow; null puts them all away. This is what a filter press does, so a
    // visitor who presses one afterwards finds the buttons telling the truth.
    setGroup(g) { if (g !== activeGroup) filterButtons[g ?? activeGroup]?.click(); },
    get group() { return activeGroup; },
    // The reveal waits for the 3D frame to pull out beneath it, and that wait
    // is held HERE rather than in a caller's setTimeout: a scrub can leave the
    // map again inside those 180 ms, and a hide() that ran while the map was
    // still hidden used to return early and let the queued show() fire anyway
    // - which is how the region map ended up sitting over the first floor.
    show(delay = 0) {
      clearTimeout(pendingShow); pendingShow = null;
      if (delay > 0) {pendingShow = setTimeout(() => {pendingShow = null; reveal();}, delay); return;}
      reveal();
    },
    get covering() { return covering; },
    hide() {
      clearTimeout(pendingShow); pendingShow = null;
      clearTimeout(coverTimer); covering = false;
      if (el.hidden) return;
      el.classList.remove('rm-active');
      el.setAttribute('aria-hidden', 'true');
      removeEventListener('resize', onResize);
      const done = () => { el.hidden = true; el.removeEventListener('transitionend', done); };
      el.addEventListener('transitionend', done);
      setTimeout(done, 900);
    },
  };
}
