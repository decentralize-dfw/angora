import * as THREE from 'three';
import {PHOTO_POINTS, FLOOR_DATUMS, photoCaption} from './photo-points.js';
import {currentLang} from './i18n.js';
import {collectUIObstacles, rectanglesOverlap} from './screen-layout.js';

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
// The mark's screen angle is measured, not assumed: the camera point and a
// point one metre along its look direction are both projected and the mark
// follows the line between them, so it stays right in plan, in the tilted
// floor view and at every orbit angle.

// The mark's own box, and where inside it the camera point sits. Everything
// else - the rays and the leader - is drawn from that apex.
const MARK = {w: 36, h: 28, apexX: 6, apexY: 14};
// Two marks closer than this read as one smudge, which is what the numbered
// badges used to do. Crowded marks step aside and keep a leader home. It is
// also wider than the 34 px circle each mark offers as a press target, so two
// targets can never overlap and a press can never land on the wrong camera.
const CLEAR = 36, RING = 24, RINGS = 5;
// A storey view frames that storey, not the plot: the drawing is fitted to
// the floor's own outline, so a camera that stood twenty metres out in the
// garden projects clean off the screen and its photograph becomes unreachable
// on every floor but the plan. A mark the frame cannot hold is therefore
// pulled back to the edge it left through, along the line from the middle of
// the view to its true place, and keeps its leader pointing out after it:
// the viewpoint is past that edge, and it can still be pressed. The inset is
// the chrome's own room - the top bar, the floor row and the gear - so a held
// mark never lands under a control.
export const HOLD = {top: 92, bottom: 146, side: 30};

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

// Where a mark goes when the view cannot contain it: the point where the line
// from the middle of the frame out to its true place crosses the safe edge.
// Direction is kept exactly, distance is not - which is the whole claim the
// held mark makes. A frame too small to have an inside holds nothing.
export function holdToFrame(x, y, w, h) {
  const left = HOLD.side, right = w - HOLD.side, top = HOLD.top, bottom = h - HOLD.bottom;
  if (right <= left || bottom <= top) return {x, y, held: false};
  if (x >= left && x <= right && y >= top && y <= bottom) return {x, y, held: false};
  const cx = (left + right) / 2, cy = (top + bottom) / 2, dx = x - cx, dy = y - cy;
  let scale = 1;
  if (dx > 0) scale = Math.min(scale, (right - cx) / dx);
  else if (dx < 0) scale = Math.min(scale, (left - cx) / dx);
  if (dy > 0) scale = Math.min(scale, (bottom - cy) / dy);
  else if (dy < 0) scale = Math.min(scale, (top - cy) / dy);
  return {x: cx + dx * scale, y: cy + dy * scale, held: true};
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
        // Behind the camera or past the far plane there is no direction to
        // hold towards, and the projection is mirrored nonsense; that is the
        // one case a mark is dropped.
        if (eye.z <= -1 || eye.z >= 1) {entry.el.hidden = true; continue;}
        entry.el.hidden = false;
        foot.set(point.x, ground, point.z).project(camera);
        ahead.set(point.x + point.dx, level, point.z + point.dz).project(camera);
        const eyeX = (eye.x + 1) * w / 2, eyeY = (1 - eye.y) * h / 2;
        const at = holdToFrame(eyeX, eyeY, w, h);
        visible.push({entry, x: at.x, y: at.y, held: at.held, eyeX, eyeY,
          footX: (foot.x + 1) * w / 2, footY: (1 - foot.y) * h / 2,
          aheadX: (ahead.x + 1) * w / 2, aheadY: (1 - ahead.y) * h / 2});
      }
      // Nearest the viewer keeps its true place; whatever would land on top of
      // an already-placed mark steps outward on a widening ring and keeps a
      // leader back to the floor point, so no camera position is ever lost.
      // A mark held at the edge is already away from where it belongs, so it
      // goes last and never pushes one that is standing in its own place.
      visible.sort((a, b) => (a.held ? 1 : 0) - (b.held ? 1 : 0) || b.y - a.y);
      const taken = [];
      // The interface measures its own controls for the plan's labels; the
      // marks read the same list. A mark under the floor row or the gear is a
      // photograph that cannot be opened, which is the same fault as two
      // marks on one pixel - so both push a mark aside, by the same search.
      const chrome = collectUIObstacles(host);
      // The mark is not a disc: it runs from the dot along the look direction,
      // so what has to stay clear - of a control, of the plan's own dimension
      // tags - is that swept box, not a circle around the apex.
      const swept = (x, y, angle) => {
        const rad = angle * Math.PI / 180, ex = x + Math.cos(rad) * 30, ey = y + Math.sin(rad) * 30;
        return {left: Math.min(x, ex) - 13, right: Math.max(x, ex) + 13,
          top: Math.min(y, ey) - 13, bottom: Math.max(y, ey) + 13};
      };
      const free = (x, y, angle) => !taken.some(p => Math.hypot(p.x - x, p.y - y) < CLEAR)
        && !chrome.some(rect => rectanglesOverlap(swept(x, y, angle), rect, 4));
      leaders.replaceChildren();
      occupied = [];
      for (const item of visible) {
        // Measured between the two projected points themselves, never from
        // wherever the mark ends up: a mark stepped aside or held at the edge
        // must still open through the angle the lens opened through.
        const angle = Math.atan2(item.aheadY - item.eyeY, item.aheadX - item.eyeX) * 180 / Math.PI;
        let x = item.x, y = item.y;
        if (!free(x, y, angle)) {
          search: for (let ring = 1; ring <= RINGS; ring++) {
            for (let step = 0; step < 8; step++) {
              const around = step * Math.PI / 4 + (ring % 2 ? Math.PI / 8 : 0);
              const cx = item.x + Math.cos(around) * ring * RING;
              const cy = item.y + Math.sin(around) * ring * RING;
              // The same room the chrome keeps for itself: a mark stepping
              // aside may not step under the top bar or the floor row.
              if (cx < HOLD.side || cy < HOLD.top || cx > w - HOLD.side || cy > h - HOLD.bottom) continue;
              if (free(cx, cy, angle)) {x = cx; y = cy; break search;}
            }
          }
        }
        taken.push({x, y});
        item.entry.el.style.left = `${x}px`;
        item.entry.el.style.top = `${y}px`;
        // Nearest first in this loop, so nearest highest: a mark behind can
        // never take a press aimed at the one standing in front of it.
        item.entry.el.style.zIndex = String(400 - taken.length);
        item.entry.el.style.setProperty('--pin-angle', `${angle.toFixed(1)}deg`);
        // The thin line home: down to the floor the photographer stood on, and
        // across to the true point when the mark had to step aside. When that
        // point is off the screen - a mark held at the edge - there is no dot
        // to land on, so the line becomes a short stub pointing the way out.
        let footX = item.footX, footY = item.footY;
        const drawn = Number.isFinite(footX) && Number.isFinite(footY);
        const away = drawn && (footX < 0 || footX > w || footY < 0 || footY > h);
        if (away) {
          const dx = footX - x, dy = footY - y, len = Math.hypot(dx, dy) || 1;
          footX = x + dx / len * 18; footY = y + dy / len * 18;
        }
        if (drawn) {
          const line = document.createElementNS(leaders.namespaceURI, 'line');
          for (const [key, value] of Object.entries({x1: x, y1: y, x2: footX, y2: footY}))
            line.setAttribute(key, value.toFixed(1));
          line.classList.add('photo-leader');
          leaders.append(line);
        }
        if (drawn && !away) {
          const dot = document.createElementNS(leaders.namespaceURI, 'circle');
          for (const [key, value] of Object.entries({cx: footX, cy: footY, r: 2.1}))
            dot.setAttribute(key, value.toFixed(1));
          dot.classList.add('photo-foot');
          leaders.append(dot);
        }
        occupied.push(swept(x, y, angle));
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
