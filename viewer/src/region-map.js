import plan from './region-plan.json';
import places from './region-places.json';
import streets from './region-streets.json';
import { t } from './i18n.js';

const AREAS = [
  { name: 'Angora Evleri', x: 40, y: -195 },
  { name: 'Beysukent', x: -640, y: -430 },
];
const GROUP_KEYS = ['groupEdu', 'groupHealth', 'groupFood', 'groupShop', 'groupSport', 'groupService'];
const svgNS = 'http://www.w3.org/2000/svg';
const km = (m) => (m < 950 ? `${m} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`);

export const atlasMeta = () => `${places.total} ${t('amenities')} · Atlas ${places.atlas_generated_at}` +
  (streets.roads.length ? ' · Plan © OpenStreetMap' : ' (OSM)');

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

  const flatPoints = (pts) => {
    let s = '';
    for (let i = 0; i < pts.length; i += 2) s += `${pts[i]},${pts[i + 1]} `;
    return s.trim();
  };
  if (streets.roads.length) {
    for (const g of streets.green) shape('polygon', 'rm-green', { points: flatPoints(g) });
    for (const b of streets.buildings) shape('polygon', 'rm-bldg', { points: flatPoints(b) });
    for (const cls of [3, 2, 1, 0]) for (const [c, , pts] of streets.roads) {
      if (c !== cls) continue;
      shape('polyline', `rm-road rm-road-${c}`, { points: flatPoints(pts) });
    }
    if (streets.boundary) shape('polygon', 'rm-bound', { points: flatPoints(streets.boundary.ring) });
  } else {
    shape('image', 'rm-base', { href: places.base.png, x: places.base.x, y: places.base.y,
      width: places.base.w, height: places.base.h, preserveAspectRatio: 'none' });
  }
  shape('image', 'rm-roads', { href: plan.roads.png, x: plan.roads.x, y: plan.roads.y,
    width: plan.roads.w, height: plan.roads.h, preserveAspectRatio: 'none' });
  shape('polygon', 'rm-plot', { points: poly(plan.plot) });
  for (const b of plan.buildings) shape('polygon', 'rm-building', { points: poly(b) });
  const dotLabels = [];
  for (const [x, y, g, name] of places.dots) {
    shape('circle', `rm-dot rm-g${g}`, { cx: x, cy: y, r: 9, fill: places.groups[g] });
    if (name) {
      const tag = document.createElementNS(svgNS, 'g');
      tag.setAttribute('class', `rm-dot-tag rm-g${g}`);
      const bg = document.createElementNS(svgNS, 'rect');
      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', x + 14); text.setAttribute('y', y + 10);
      text.textContent = name;
      tag.append(bg, text); world.append(tag);
      dotLabels.push({ el: tag, bg, x, y, g, name, d: Math.hypot(x, y) });
    }
  }
  dotLabels.sort((a, b) => a.d - b.d);
  for (const r of [500, 1000, 2000]) shape('circle', 'rm-ring', { cx: 0, cy: 0, r, 'vector-effect': 'non-scaling-stroke' });
  shape('circle', 'rm-pulse', { cx: 0, cy: 0, r: 26 });
  shape('polygon', 'rm-villa', { points: poly(plan.villa) });
  for (const p of places.curated) {
    if (p.d <= 2000) shape('circle', `rm-poi rm-g${p.g}`, { cx: p.x, cy: p.y, r: 4, 'vector-effect': 'non-scaling-stroke' });
  }

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

  const near = Object.fromEntries(places.curated.map((p) => [p.kind, p]));
  const fact = (label, p) => (p ? `<li><b>${km(p.d)}</b><span>${label}</span></li>` : '');
  const info = document.createElement('aside');
  info.className = 'rm-info';
  info.setAttribute('aria-label', 'Angora Evleri hakkında');
  info.innerHTML =
    '<button class="rm-info-head" aria-expanded="false"><span><h3>Angora Evleri</h3>' +
    '<p class="rm-info-set">Beysukent · Çankaya, Ankara</p></span><i aria-hidden="true">⌄</i></button>' +
    '<div class="rm-info-more">' +
    `<p class="rm-info-body">${t('regionIntro')}</p>` +
    '<ul class="rm-info-facts">' + fact(t('lblPark'), near.park) + fact(t('lblSchool'), near.lise) +
    fact(t('lblMarket'), near.market) + fact(t('lblPharmacy'), near.eczane) + '</ul>' +
    `<p class="rm-info-dist">${t('distNote')}</p></div>`;
  const infoHead = info.querySelector('.rm-info-head');
  const setInfoOpen = (open) => {
    info.classList.toggle('rm-open', open);
    infoHead.setAttribute('aria-expanded', String(open));
  };
  infoHead.addEventListener('click', () => setInfoOpen(!info.classList.contains('rm-open')));
  setInfoOpen(!matchMedia('(max-width: 720px)').matches);
  const filters = document.createElement('div');
  filters.className = 'rm-filters';
  filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', 'Donatı filtreleri');
  const off = new Set(places.groups.map((_, i) => i));
  for (const g of off) el.classList.add(`rm-off-${g}`);
  let activeGroup = null;
  const filterButtons = places.groups.map((color, g) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<i style="background:${color}"></i>${t(GROUP_KEYS[g])}`;
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
  el.append(info, filters);

  let radius = 1000;
  const layout = () => {
    const vw = el.clientWidth || innerWidth, vh = el.clientHeight || innerHeight;
    const pad = Math.min(vw, vh) < 560 ? 46 : 72;
    const s = (Math.min(vw, vh) / 2 - pad) / radius;
    const cx = vw / 2, cy = vh / 2;
    world.style.transform = `translate(${cx}px, ${cy}px) scale(${s})`;
    let clampRank = 0;
    const taken = [
      { x: cx - 60, y: cy - 32, w: 120, h: 58 },
      vw < 560 ? { x: 8, y: vh - 276, w: vw - 16, h: 276 } : { x: cx - 170, y: vh - 190, w: 340, h: 190 },
    ];
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
        const lim = radius * (0.94 - (clampRank++ % 3) * 0.085);
        if (d > lim) { mx = (mx / d) * lim; my = (my / d) * lim; }
      }
      let px = cx + mx * s, py = cy + my * s;
      if (c.el.classList.contains('rm-chip-poi')) {
        const faded = off.has(Number(c.el.dataset.g)) ||
          (!c.clamp && Number(c.el.dataset.distance) > radius * 1.12);
        c.el.style.opacity = faded ? 0 : 1;
        const w = (c.el.offsetWidth || 168) + 10, h = (c.el.offsetHeight || 26) + 6;
        px = Math.max(w / 2, Math.min(vw - w / 2, px));
        py = Math.max(96, Math.min(vh - 110, py));
        if (!faded) {
          const start = py;
          const attempt = (step) => {
            let y = start;
            let rect = { x: px - w / 2, y: y - h / 2, w, h };
            for (let tries = 0; tries < 60 && hits(rect); tries++) { y += step; rect.y = y - h / 2; }
            return { y, ok: !hits({ x: px - w / 2, y: y - h / 2, w, h }) && y > 90 && y < vh - 104 };
          };
          const first = attempt(py >= cy ? 15 : -15);
          const pick = first.ok ? first : attempt(py >= cy ? -15 : 15);
          if (!pick.ok) { c.el.style.opacity = 0; }
          else {
            py = Math.max(96, Math.min(vh - 110, pick.y));
            taken.push({ x: px - w / 2, y: py - h / 2, w, h });
          }
        }
      }
      if (!c.el.classList.contains('rm-chip-poi')) {
        const w = (c.el.offsetWidth || 60) + 8, h = (c.el.offsetHeight || 22) + 6;
        taken.push({ x: px - w / 2, y: py - h / 2, w, h });
      }
      c.el.style.transform = `translate(-50%, -50%) translate(${px}px, ${py}px)`;
    }
    const fsU = radius === 2000 ? 46 : radius === 500 ? 14 : 26;
    const kept = [];
    for (const l of dotLabels) {
      if (off.has(l.g)) { l.el.setAttribute('visibility', 'hidden'); continue; }
      const wU = l.name.length * fsU * 0.58 + 14, hU = fsU * 1.6;
      l.bg.setAttribute('x', l.x + 7); l.bg.setAttribute('y', l.y + 10 - fsU * 1.12);
      l.bg.setAttribute('width', wU); l.bg.setAttribute('height', hU);
      l.bg.setAttribute('rx', hU / 2);
      const rect = { x: cx + (l.x + 7) * s - 2, y: cy + (l.y + 10 - fsU * 1.12) * s - 2, w: wU * s + 4, h: hU * s + 4 };
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
