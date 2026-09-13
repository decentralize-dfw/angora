// R44 | The Bölge scale is a map, not a model. North-up, villa-centred,
// 1 km / 2 km radius; the plan layer under it is the delivery's own data
// (region-plan.json: context roads rasterised, B-family hulls, the villa's
// footprint), and the far landmarks are approximate - the panel says so.
// One design language with the rest of the chrome: paper, hairline rings,
// glass chips, ink for the subject.
//
// uzakolcek.html was named as the information source for this view but is
// not in the repository; when it lands, its figures replace LANDMARKS.
import plan from './region-plan.json';

const ORIGIN = { lat: 39.88, lng: 32.73 };            // daylight.js site coordinate
const M_PER_DEG_LAT = 111132;
const M_PER_DEG_LNG = 111320 * Math.cos((ORIGIN.lat * Math.PI) / 180);
// Named places around Beysukent, positioned from their public map
// coordinates; distances are rounded and marked approximate in the panel.
const LANDMARKS = [
  { name: 'Hacettepe Beytepe', note: 'kampüs', lat: 39.867, lng: 32.735 },
  { name: 'Bilkent Üniversitesi', note: 'kampüs', lat: 39.868, lng: 32.75 },
  { name: 'Bilkent Center', note: 'AVM', lat: 39.87, lng: 32.757 },
  { name: 'Eskişehir Yolu', note: 'E-90', lat: 39.903, lng: 32.745 },
  { name: 'ODTÜ', note: 'kampüs', lat: 39.891, lng: 32.78 },
  { name: 'Ankara Şehir Hastanesi', note: '', lat: 39.897, lng: 32.772 },
  { name: 'Kızılay', note: 'şehir merkezi', lat: 39.921, lng: 32.854 },
];
const AREAS = [
  { name: 'Angora Evleri', x: 40, y: -195 },
  { name: 'Beysukent', x: -640, y: -430 },
];
const svgNS = 'http://www.w3.org/2000/svg';

const toMap = (l) => ({
  x: (l.lng - ORIGIN.lng) * M_PER_DEG_LNG,
  y: -(l.lat - ORIGIN.lat) * M_PER_DEG_LAT,           // map y grows southward
});
const km = (m) => (m < 950 ? `~${Math.round(m / 50) * 50} m` : `~${(m / 1000).toFixed(1).replace('.', ',')} km`);

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

  // plan layers, meter units
  shape('image', 'rm-roads', { href: plan.roads.png, x: plan.roads.x, y: plan.roads.y,
    width: plan.roads.w, height: plan.roads.h, preserveAspectRatio: 'none' });
  shape('polygon', 'rm-plot', { points: poly(plan.plot) });
  for (const b of plan.buildings) shape('polygon', 'rm-building', { points: poly(b) });
  for (const r of [500, 1000, 2000]) shape('circle', 'rm-ring', { cx: 0, cy: 0, r, 'vector-effect': 'non-scaling-stroke' });
  shape('circle', 'rm-pulse', { cx: 0, cy: 0, r: 26 });
  shape('polygon', 'rm-villa', { points: poly(plan.villa) });
  for (const l of LANDMARKS) {
    const p = toMap(l);
    if (Math.hypot(p.x, p.y) < 1960) shape('circle', 'rm-poi', { cx: p.x, cy: p.y, r: 4, 'vector-effect': 'non-scaling-stroke' });
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
  chip('rm-chip-villa', '<strong>Villa 21</strong>', plan.villa[0] ? 4 : 0, -16);
  for (const r of [500, 1000, 2000]) chip('rm-chip-ring', r < 1000 ? '500 m' : `${r / 1000} km`, 0, -r);
  for (const a of AREAS) chip('rm-chip-area', a.name, a.x, a.y);
  for (const l of LANDMARKS) {
    const p = toMap(l);
    const d = Math.hypot(p.x, p.y);
    const bearing = Math.atan2(p.y, p.x) * 180 / Math.PI;
    const c = chip('rm-chip-poi', `${l.name}${l.note ? ` <i>${l.note}</i>` : ''} <b>${km(d)}</b>` +
      (d > 1960 ? ` <em style="transform:rotate(${bearing.toFixed(0)}deg)">→</em>` : ''), p.x, p.y, d > 1960);
    c.dataset.distance = Math.round(d);
  }
  const compass = document.createElement('span');
  compass.className = 'rm-compass';
  compass.innerHTML = '<i>↑</i>K';
  labels.append(compass);

  let radius = 1000;
  const layout = () => {
    const vw = el.clientWidth || innerWidth, vh = el.clientHeight || innerHeight;
    const pad = Math.min(vw, vh) < 560 ? 46 : 72;
    const s = (Math.min(vw, vh) / 2 - pad) / radius;
    const cx = vw / 2, cy = vh / 2;
    world.style.transform = `translate(${cx}px, ${cy}px) scale(${s})`;
    let clampRank = 0;
    for (const c of chips) {
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
        // chip beyond the chosen radius fades out instead of hiding under chrome
        const half = (c.el.offsetWidth || 168) / 2 + 8;
        px = Math.max(half, Math.min(vw - half, px));
        py = Math.max(96, Math.min(vh - 110, py));
        c.el.style.opacity = !c.clamp && Number(c.el.dataset.distance) > radius * 1.12 ? 0 : 1;
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
