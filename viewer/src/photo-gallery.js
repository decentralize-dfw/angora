import * as THREE from 'three';
import {PHOTO_POINTS, photoCaption} from './photo-points.js';
import {currentLang} from './i18n.js';

// R47 | The owner's photographs, put back where they were taken.
//
// A pin is the CAMERA, not the picture: the dot is the tripod, the two rays
// are the lens's angle, and the line dropping away from the dot lands on the
// floor the photographer stood on. No thumbnail and no number - fifty-five
// little pictures or fifty-five badges over a storey plan is a contact sheet,
// not a drawing - so the frame itself only appears once a pin is pressed, in
// one place, and pressing another replaces it rather than stacking a second.
//
// The mark's screen angle is measured, not assumed: the camera point and a
// point one metre along its look direction are both projected and the mark
// follows the line between them, so it stays right in plan, in the tilted
// floor view and at every orbit angle.

// The mark's own box, and where inside it the camera point sits. Everything
// else - the rays, the lens, the leader - is drawn from that apex.
const MARK = {w: 36, h: 28, apexX: 6, apexY: 14};
// Two marks closer than this read as one smudge, which is what the numbered
// badges used to do. Crowded marks step aside and keep a leader home. It is
// also wider than the 34 px circle each mark offers as a press target, so two
// targets can never overlap and a press can never land on the wrong camera.
const CLEAR = 36, RING = 24, RINGS = 5;

function mark(document) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${MARK.w} ${MARK.h}`);
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML =
    '<path class="pin-ray" d="M6 14 L33.5 3.6 M6 14 L33.5 24.4"/>' +
    '<path class="pin-lens" d="M11.4 14C14.9 9.3 21.5 9.3 25 14 21.5 18.7 14.9 18.7 11.4 14Z"/>' +
    '<circle class="pin-pupil" cx="18.2" cy="14" r="2.4"/>' +
    '<circle class="pin-dot" cx="6" cy="14" r="2.9"/>';
  return svg;
}

export function createPhotoPins(host, root, {onOpen}) {
  const overlay = document.createElement('div');
  overlay.className = 'photo-overlay';
  overlay.setAttribute('aria-label', 'Fotoğraf çekim noktaları');
  const leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  leaders.classList.add('photo-leaders');
  overlay.append(leaders);
  host.append(overlay);
  const eye = new THREE.Vector3(), foot = new THREE.Vector3(), ahead = new THREE.Vector3();
  const entries = PHOTO_POINTS.map(point => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'photo-pin';
    el.hidden = true;                       // nothing is placed until the first update
    el.dataset.photo = String(point.id);
    el.append(mark(document));
    // A press opens the frame, not a click. The mark is repositioned on every
    // rendered frame, so while the camera is still settling the element under
    // the finger at pointerup is no longer the one it went down on and the
    // browser never synthesises a click at all - which is exactly the "opens
    // sometimes, ignores five presses other times" the owner hit. pointerdown
    // is also simply faster: the frame opens on the press.
    el.addEventListener('pointerdown', event => {
      event.preventDefault(); event.stopPropagation();
      onOpen(point.id);
    });
    // Keyboard activation still arrives as a click with no pointer behind it.
    el.addEventListener('click', event => {
      event.preventDefault(); event.stopPropagation();
      if (event.detail === 0) onOpen(point.id);
    });
    overlay.append(el);
    return {point, el,
      eye: new THREE.Vector3(point.x, point.y, point.z),
      foot: new THREE.Vector3(point.x, point.floorY, point.z),
      target: new THREE.Vector3(point.x + point.dx, point.y, point.z + point.dz)};
  });
  function labels() {
    const lang = currentLang();
    for (const entry of entries) entry.el.setAttribute('aria-label', photoCaption(entry.point, lang));
  }
  labels();
  let current = null, occupied = [];
  return {
    count: entries.length,
    point: id => entries.find(e => e.point.id === id)?.point ?? null,
    file: id => new URL(entries.find(e => e.point.id === id)?.point.file ?? '', root).href,
    refreshLabels: labels,
    // What the marks are standing on this frame, so the plan's own dimension
    // tags can step around them instead of landing under one.
    obstacles: () => occupied,
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
      if (!active) {occupied = []; return;}
      camera.updateMatrixWorld();
      const w = host.clientWidth, h = host.clientHeight;
      leaders.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const visible = [];
      for (const entry of entries) {
        if (entry.point.floor !== floor) {entry.el.hidden = true; continue;}
        eye.copy(entry.eye).project(camera);
        const off = eye.z <= -1 || eye.z >= 1 || Math.abs(eye.x) > .98 || Math.abs(eye.y) > .96;
        entry.el.hidden = off;
        if (off) continue;
        foot.copy(entry.foot).project(camera);
        ahead.copy(entry.target).project(camera);
        visible.push({entry,
          x: (eye.x + 1) * w / 2, y: (1 - eye.y) * h / 2,
          footX: (foot.x + 1) * w / 2, footY: (1 - foot.y) * h / 2,
          aheadX: (ahead.x + 1) * w / 2, aheadY: (1 - ahead.y) * h / 2});
      }
      // Nearest the viewer keeps its true place; whatever would land on top of
      // an already-placed mark steps outward on a widening ring and keeps a
      // leader back to the floor point, so no camera position is ever lost.
      visible.sort((a, b) => b.y - a.y);
      const taken = [];
      const free = (x, y) => !taken.some(p => Math.hypot(p.x - x, p.y - y) < CLEAR);
      leaders.replaceChildren();
      occupied = [];
      for (const item of visible) {
        let x = item.x, y = item.y;
        if (!free(x, y)) {
          search: for (let ring = 1; ring <= RINGS; ring++) {
            for (let step = 0; step < 8; step++) {
              const angle = step * Math.PI / 4 + (ring % 2 ? Math.PI / 8 : 0);
              const cx = item.x + Math.cos(angle) * ring * RING;
              const cy = item.y + Math.sin(angle) * ring * RING;
              if (cx < 16 || cy < 16 || cx > w - 16 || cy > h - 16) continue;
              if (free(cx, cy)) {x = cx; y = cy; break search;}
            }
          }
        }
        taken.push({x, y});
        const angle = Math.atan2(item.aheadY - item.y, item.aheadX - item.x) * 180 / Math.PI;
        item.entry.el.style.left = `${x}px`;
        item.entry.el.style.top = `${y}px`;
        // Nearest first in this loop, so nearest highest: a mark behind can
        // never take a press aimed at the one standing in front of it.
        item.entry.el.style.zIndex = String(400 - taken.length);
        item.entry.el.style.setProperty('--pin-angle', `${angle.toFixed(1)}deg`);
        // The thin line home: down to the floor the photographer stood on, and
        // across to the true point when the mark had to step aside.
        const line = document.createElementNS(leaders.namespaceURI, 'line');
        for (const [key, value] of Object.entries({x1: x, y1: y, x2: item.footX, y2: item.footY}))
          line.setAttribute(key, value.toFixed(1));
        line.classList.add('photo-leader');
        const dot = document.createElementNS(leaders.namespaceURI, 'circle');
        for (const [key, value] of Object.entries({cx: item.footX, cy: item.footY, r: 2.1}))
          dot.setAttribute(key, value.toFixed(1));
        dot.classList.add('photo-foot');
        leaders.append(line, dot);
        // The mark is not a disc: it runs from the dot along the look
        // direction, so what the plan's dimensions have to avoid is that
        // swept box, not a circle around the apex.
        const reach = 30, rad = angle * Math.PI / 180;
        const ex = x + Math.cos(rad) * reach, ey = y + Math.sin(rad) * reach;
        occupied.push({left: Math.min(x, ex) - 13, right: Math.max(x, ex) + 13,
          top: Math.min(y, ey) - 13, bottom: Math.max(y, ey) + 13});
      }
    },
    get current() {return current;},
    dispose() {overlay.remove();},
  };
}

// The frame itself: one at a time, named underneath, closed by its own cross
// or by switching the photographs off again in the view options.
export function createPhotoViewer({dock, figure, image, caption, close, backdrop, pins, onClose, onShow}) {
  let open = null;
  // A listing frame is half a megabyte, and on a phone that is a second of
  // nothing. The frame therefore opens at a readable size straight away and
  // says it is working; the picture fades in over it. A token guards against
  // a slow frame landing after the visitor has moved to the next pin.
  image.onload = () => {if (image.dataset.token === String(open)) figure.dataset.state = 'ready';};
  image.onerror = () => {if (image.dataset.token === String(open)) figure.dataset.state = 'error';};
  function show(id) {
    const point = pins.point(id);
    if (!point || open === id) return;
    open = id;
    figure.dataset.state = 'loading';
    image.dataset.token = String(id);
    image.src = pins.file(id);
    image.alt = photoCaption(point, currentLang());
    caption.textContent = photoCaption(point, currentLang());
    dock.hidden = false;
    if (backdrop) backdrop.hidden = false;
    pins.select(id);
    onShow?.();
    close.focus({preventScroll: true});
  }
  function hide() {
    if (open === null) return;
    open = null;
    dock.hidden = true;
    if (backdrop) backdrop.hidden = true;
    // Release the decoded frame; a phone holding a dozen 4000 px JPEGs from a
    // browsing session is the same memory peak the model set is budgeted for.
    image.removeAttribute('src');
    delete figure.dataset.state;
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
      caption.textContent = photoCaption(point, currentLang());
      image.alt = photoCaption(point, currentLang());
    },
  };
}
