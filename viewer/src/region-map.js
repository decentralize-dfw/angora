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

const AREAS = [
  { name: 'Angora Evleri', x: 40, y: -195 },
  { name: 'Beysukent', x: -640, y: -430 },
];
// one label per amenity group, in places.groups order (see the extractor)
const GROUP_LABELS = ['Eğitim', 'Sağlık', 'Yeme içme', 'Alışveriş', 'Spor · Park', 'Hizmet'];
const svgNS = 'http://www.w3.org/2000/svg';
const km = (m) => (m < 950 ? `${m} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`);

export const atlasMeta = `${places.total} donatı · Atlas ${places.atlas_generated_at} (OSM)`;

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
  el.append(svg, labels);

  const shape = (tag, cls, attrs = {}) => {
    const n = document.createElementNS(svgNS, tag);
    if (cls) n.setAttribute('class', cls);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    world.append(n);
    return n;
  };
  const poly = (pts) => pts.map(([x, y]) => `${x},${y}`).join(' ');

  // plan layers, meter units. Underneath everything: the derived monochrome
  // wash of the whole district ("az opasiteli monokrom"), then the
  // settlement's own drawing on top of it.
  shape('image', 'rm-base', { href: places.base.png, x: places.base.x, y: places.base.y,
    width: places.base.w, height: places.base.h, preserveAspectRatio: 'none' });
  shape('image', 'rm-roads', { href: plan.roads.png, x: plan.roads.x, y: plan.roads.y,
    width: plan.roads.w, height: plan.roads.h, preserveAspectRatio: 'none' });
  shape('polygon', 'rm-plot', { points: poly(plan.plot) });
  for (const b of plan.buildings) shape('polygon', 'rm-building', { points: poly(b) });
  // the atlas's named amenities as a quiet field under the rings
  for (const [x, y, g] of places.dots)
    shape('circle', `rm-dot rm-g${g}`, { cx: x, cy: y, r: 9, fill: places.groups[g] });
  for (const r of [500, 1000, 2000]) shape('circle', 'rm-ring', { cx: 0, cy: 0, r, 'vector-effect': 'non-scaling-stroke' });
  shape('circle', 'rm-pulse', { cx: 0, cy: 0, r: 26 });
  shape('polygon', 'rm-villa', { points: poly(plan.villa) });
  for (const p of places.curated) {
    if (p.d <= 2000) shape('circle', `rm-poi rm-g${p.g}`, { cx: p.x, cy: p.y, r: 4, 'vector-effect': 'non-scaling-stroke' });
  }

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
  chip('rm-chip-villa', '<strong>Villa 21</strong>', 4, -16);
  for (const r of [500, 1000, 2000]) chip('rm-chip-ring', r < 1000 ? '500 m' : `${r / 1000} km`, 0, -r);
  for (const a of AREAS) chip('rm-chip-area', a.name, a.x, a.y);
  for (const p of places.curated) {
    const bearing = Math.atan2(p.y, p.x) * 180 / Math.PI;
    const c = chip('rm-chip-poi', `${p.name} <b>${km(p.d)}</b>` +
      (p.d > 2000 ? ` <em style="transform:rotate(${bearing.toFixed(0)}deg)">→</em>` : ''), p.x, p.y, p.d > 2000);
    c.dataset.distance = p.d;
    c.dataset.g = p.g;
  }
  const compass = document.createElement('span');
  compass.className = 'rm-compass';
  compass.innerHTML = '<i>↑</i>K';
  labels.append(compass);

  // The settlement, introduced once and properly, when the Bölge scale opens.
  // Every distance in it is the atlas's own measurement, not sales copy.
  const near = Object.fromEntries(places.curated.map((p) => [p.kind, p]));
  const fact = (label, p) => (p ? `<li><b>${km(p.d)}</b><span>${label}</span></li>` : '');
  const info = document.createElement('aside');
  info.className = 'rm-info';
  info.setAttribute('aria-label', 'Angora Evleri hakkında');
  info.innerHTML =
    '<h3>Angora Evleri</h3><p class="rm-info-set">Beysukent · Çankaya, Ankara</p>' +
    '<p class="rm-info-body">Ankara’nın batı yakasında, Hacettepe Beytepe kampüsünün ' +
    'yeşiline komşu, alçak yoğunluklu bir villa yerleşkesi. Planlı sokak dokusu ve olgun ' +
    'bahçeleri gündelik hayatı yerleşke içinde tutar; Eskişehir Yolu ve Bilkent bağlantısı ' +
    'kenti dakikalar uzağında bırakır.</p>' +
    '<ul class="rm-info-facts">' + fact('park', near.park) + fact('okul', near.lise) +
    fact('market', near.market) + fact('eczane', near.eczane) + '</ul>';
  // Every amenity family is filterable: the chips toggle their group's dots,
  // accents and labels together ("tüm market avm... hepsinin filtresi").
  const filters = document.createElement('div');
  filters.className = 'rm-filters';
  filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', 'Donatı filtreleri');
  const off = new Set();
  places.groups.forEach((color, g) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-pressed', 'true');
    b.innerHTML = `<i style="background:${color}"></i>${GROUP_LABELS[g] ?? 'Diğer'}`;
    b.onclick = () => {
      const wasOff = off.has(g);
      if (wasOff) off.delete(g); else off.add(g);
      b.setAttribute('aria-pressed', String(wasOff));
      el.classList.toggle(`rm-off-${g}`, !wasOff);
      layout();
    };
    filters.append(b);
  });
  el.append(info, filters);

  let radius = 1000;
  const layout = () => {
    const vw = el.clientWidth || innerWidth, vh = el.clientHeight || innerHeight;
    const pad = Math.min(vw, vh) < 560 ? 46 : 72;
    const s = (Math.min(vw, vh) / 2 - pad) / radius;
    const cx = vw / 2, cy = vh / 2;
    world.style.transform = `translate(${cx}px, ${cy}px) scale(${s})`;
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
    for (const c of order) {
      let { mx, my } = c;
      if (c.clamp) {
        const d = Math.hypot(mx, my) || 1;
        // stagger the edge chips so near-parallel bearings do not stack
        const lim = radius * (0.94 - (clampRank++ % 3) * 0.085);
        if (d > lim) { mx = (mx / d) * lim; my = (my / d) * lim; }
      }
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
      c.el.style.transform = `translate(-50%, -50%) translate(${px}px, ${py}px)`;
    }
    el.dataset.radius = radius;
  };

  let raf = 0;
  const onResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); };

  host.append(el);
  return {
    element: el,
    get radius() { return radius; },
    setRadius(r) { radius = r; layout(); },
    show() {
      if (!el.hidden) return;
      el.hidden = false;
      el.setAttribute('aria-hidden', 'false');
      layout();
      addEventListener('resize', onResize);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('rm-active')));
    },
    hide() {
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
