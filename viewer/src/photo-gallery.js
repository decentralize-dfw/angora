import * as THREE from 'three';
import {PHOTO_POINTS, FLOOR_DATUMS, photoCaption} from './photo-points.js';
import {currentLang} from './i18n.js';

// R47 | The owner's photographs, put back where they were taken.
//
// A pin is the CAMERA, not the picture: the dot is the tripod, the two rays
// are the lens's angle, and the line dropping away from the dot lands on the
// floor the photographer stood on. No thumbnail and no number - fifty-six
// little pictures or fifty-six badges over a storey plan is a contact sheet,
// not a drawing - so the frame itself only appears once a pin is pressed, in
// one place, and pressing another replaces it rather than stacking a second.
//
// Most marks belong to one storey and are drawn only while it is open. The
// frames taken from outside belong to the house rather than to a floor: they
// are drawn on every storey they take in, and each time at that storey's own
// level, so the viewpoint rises with the visitor instead of staying pinned to
// the garden. Nothing about them moves in plan - only their height, and the
// height of the leader's foot with it.
//
// A mark's place on the screen is its camera's place in the model and nothing
// else. It is never nudged aside to clear another mark or a control, and
// never dragged back into the frame when the view pans past it: marks that
// rearrange themselves as the drawing moves read as a scatter of insects
// rather than as fifty-six fixed points, which is exactly how the owner saw
// them. Two that overlap overlap; depth decides which one a press reaches,
// and panning a little separates them again.
//
// The mark's screen angle is measured, not assumed: the camera point and a
// point one metre along its look direction are both projected and the mark
// follows the line between them, so it stays right in plan, in the tilted
// floor view and at every orbit angle.

// The mark's own box, and where inside it the camera point sits. Everything
// else - the rays and the leader - is drawn from that apex.
const MARK = {w: 36, h: 28, apexX: 6, apexY: 14};
// How far past the frame a mark may still be drawn. Its centre is allowed
// outside; the overlay clips what hangs over, so a camera at the edge of the
// view fades off it rather than popping out of existence a mark early.
const EDGE = 40;

function mark(document) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${MARK.w} ${MARK.h}`);
  svg.setAttribute('aria-hidden', 'true');
  // The tripod and the angle it opens through, and nothing between them: an
  // eye drawn inside the two rays reads as a second thing to press at this
  // size, and a fifty-six-times-repeated one is noise over the plan.
  svg.innerHTML =
    '<path class="pin-ray" d="M6 14 L33.5 3.6 M6 14 L33.5 24.4"/>' +
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
    // Where the frame is marked, and how high the eye stood over the ground it
    // was taken from. A following mark carries that height onto whichever
    // storey is open; everything else keeps its own storey's datum.
    return {point, el,
      floors: point.floors ?? [point.floor],
      eyeH: point.y - point.floorY};
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
      const datum = FLOOR_DATUMS[floor] ?? 0;
      for (const entry of entries) {
        if (!entry.floors.includes(floor)) {entry.el.hidden = true; continue;}
        const point = entry.point;
        const ground = point.follow ? datum : point.floorY, level = ground + entry.eyeH;
        eye.set(point.x, level, point.z).project(camera);
        const x = (eye.x + 1) * w / 2, y = (1 - eye.y) * h / 2;
        // Behind the camera, past the far plane, or panned off the side: the
        // mark is simply not drawn. It is not brought to an edge it never
        // stood on - it comes back when the view comes back to it.
        const off = eye.z <= -1 || eye.z >= 1 ||
          x < -EDGE || x > w + EDGE || y < -EDGE || y > h + EDGE;
        entry.el.hidden = off;
        if (off) continue;
        foot.set(point.x, ground, point.z).project(camera);
        ahead.set(point.x + point.dx, level, point.z + point.dz).project(camera);
        visible.push({entry, x, y,
          footX: (foot.x + 1) * w / 2, footY: (1 - foot.y) * h / 2,
          aheadX: (ahead.x + 1) * w / 2, aheadY: (1 - ahead.y) * h / 2});
      }
      // The only thing decided here is stacking, never position: furthest
      // down the screen is nearest the viewer, so it is drawn highest and
      // takes the press when two marks land on one another.
      visible.sort((a, b) => b.y - a.y);
      leaders.replaceChildren();
      occupied = [];
      let above = 0;
      for (const item of visible) {
        const {entry, x, y} = item;
        // Measured between the two projected points, so the mark opens
        // through the angle the lens opened through in plan, in the tilted
        // floor view and at every orbit angle.
        const angle = Math.atan2(item.aheadY - y, item.aheadX - x) * 180 / Math.PI;
        entry.el.style.left = `${x.toFixed(1)}px`;
        entry.el.style.top = `${y.toFixed(1)}px`;
        entry.el.style.zIndex = String(300 + (above++));
        entry.el.style.setProperty('--pin-angle', `${angle.toFixed(1)}deg`);
        // The thin line home: from the camera down to the floor it stood on.
        if (Number.isFinite(item.footX) && Number.isFinite(item.footY)) {
          const line = document.createElementNS(leaders.namespaceURI, 'line');
          for (const [key, value] of Object.entries({x1: x, y1: y, x2: item.footX, y2: item.footY}))
            line.setAttribute(key, value.toFixed(1));
          line.classList.add('photo-leader');
          const dot = document.createElementNS(leaders.namespaceURI, 'circle');
          for (const [key, value] of Object.entries({cx: item.footX, cy: item.footY, r: 2.1}))
            dot.setAttribute(key, value.toFixed(1));
          dot.classList.add('photo-foot');
          leaders.append(line, dot);
        }
        // The mark is not a disc: it runs from the dot along the look
        // direction, so what the plan's dimension tags have to avoid is that
        // swept box, not a circle around the apex.
        const rad = angle * Math.PI / 180;
        const ex = x + Math.cos(rad) * 30, ey = y + Math.sin(rad) * 30;
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
