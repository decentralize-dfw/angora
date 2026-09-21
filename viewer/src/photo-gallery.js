import * as THREE from 'three';
import {PHOTO_POINTS, photoCaption} from './photo-points.js';
import {currentLang} from './i18n.js';

// R47 | The owner's photographs, put back where they were taken.
//
// A pin is the CAMERA, not the picture: a dot at the tripod and a wedge for
// the direction it looked. No thumbnail is drawn on the model - fifty-five
// little pictures scattered over a storey plan is a contact sheet, not a
// drawing - so the frame itself only appears once a pin is pressed, in one
// place, and pressing another pin replaces it rather than stacking a second.
//
// The wedge's screen angle is measured, not assumed: the pin and a point one
// metre along its look direction are both projected, and the wedge follows
// the line between them. So it stays right in plan, in the tilted floor view
// and at every orbit angle.
export function createPhotoPins(host, root, {onOpen}) {
  const overlay = document.createElement('div');
  overlay.className = 'photo-overlay';
  overlay.setAttribute('aria-label', 'Fotoğraf çekim noktaları');
  host.append(overlay);
  const here = new THREE.Vector3(), ahead = new THREE.Vector3();
  const entries = PHOTO_POINTS.map(point => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'photo-pin';
    el.hidden = true;           // nothing is placed until the first update
    el.dataset.photo = String(point.id);
    const wedge = document.createElement('i'), number = document.createElement('b');
    number.textContent = String(point.id);
    el.append(wedge, number);
    el.onclick = event => {event.stopPropagation(); onOpen(point.id);};
    overlay.append(el);
    return {point, el, position: new THREE.Vector3(point.x, point.y, point.z),
      target: new THREE.Vector3(point.x + point.dx, point.y, point.z + point.dz)};
  });
  function labels() {
    const lang = currentLang();
    for (const entry of entries) entry.el.setAttribute('aria-label', `${entry.point.id} · ${photoCaption(entry.point, lang)}`);
  }
  labels();
  let current = null;
  return {
    count: entries.length,
    point: id => entries.find(e => e.point.id === id)?.point ?? null,
    file: id => new URL(entries.find(e => e.point.id === id)?.point.file ?? '', root).href,
    refreshLabels: labels,
    // Which pin reads as open. Kept on the pin itself so a floor change or a
    // hidden overlay cannot leave a stale highlight behind.
    select(id) {
      current = id;
      for (const entry of entries) entry.el.setAttribute('aria-pressed', String(entry.point.id === id));
    },
    update(view, show, transitioning, walking, camera) {
      const floor = /^f[0-3]$/.test(view) ? Number(view[1]) : -1;
      const active = show && floor >= 0 && !transitioning && !walking;
      overlay.hidden = !active;
      if (!active) return;
      camera.updateMatrixWorld();
      const w = host.clientWidth, h = host.clientHeight;
      for (const entry of entries) {
        if (entry.point.floor !== floor) {entry.el.hidden = true; continue;}
        here.copy(entry.position).project(camera);
        const off = here.z <= -1 || here.z >= 1 || Math.abs(here.x) > .98 || Math.abs(here.y) > .96;
        entry.el.hidden = off;
        if (off) continue;
        const x = (here.x + 1) * w / 2, y = (1 - here.y) * h / 2;
        ahead.copy(entry.target).project(camera);
        const ax = (ahead.x + 1) * w / 2, ay = (1 - ahead.y) * h / 2;
        // Screen angle measured from "up", clockwise, which is what the CSS
        // rotation of the wedge expects.
        const angle = Math.atan2(ax - x, y - ay) * 180 / Math.PI;
        entry.el.style.left = `${x}px`;
        entry.el.style.top = `${y}px`;
        entry.el.style.setProperty('--pin-angle', `${angle.toFixed(1)}deg`);
      }
    },
    get current() {return current;},
    dispose() {overlay.remove();},
  };
}

// The frame itself: one at a time, named underneath, closed by its own cross
// or by switching the photographs off again in the view options.
export function createPhotoViewer({figure, image, caption, close, backdrop, pins, onClose}) {
  let open = null;
  function show(id) {
    const point = pins.point(id);
    if (!point) return;
    open = id;
    image.src = pins.file(id);
    image.alt = photoCaption(point, currentLang());
    caption.textContent = `${photoCaption(point, currentLang())} · ${id}`;
    figure.hidden = false;
    if (backdrop) backdrop.hidden = false;
    pins.select(id);
    close.focus({preventScroll: true});
  }
  function hide() {
    if (open === null) return;
    open = null;
    figure.hidden = true;
    if (backdrop) backdrop.hidden = true;
    // Release the decoded frame; a phone holding a dozen 4000 px JPEGs from a
    // browsing session is the same memory peak the model set is budgeted for.
    image.removeAttribute('src');
    pins.select(null);
    onClose?.();
  }
  close.onclick = hide;
  backdrop?.addEventListener('click', hide);
  return {
    show, hide,
    get open() {return open;},
    // Language switches while a frame is up: the caption follows immediately.
    refresh() {
      if (open === null) return;
      const point = pins.point(open);
      caption.textContent = `${photoCaption(point, currentLang())} · ${open}`;
      image.alt = photoCaption(point, currentLang());
    },
  };
}
