import * as THREE from 'three';
// The narrated tour's light: everything the sentence is not about goes dark,
// and what it IS about stays lit and gains a warm pool of its own.
//
// The dimming is done in screen space rather than in the material graph. The
// delivery is batched - one draw call carries a whole storey's walls - so
// there is no per-room material to turn down, and nothing in the scene knows
// which triangle belongs to which room. A mask over the viewport needs none
// of that, works the same over the 3D scene and over the Bölge map (which is
// SVG, not scene), and costs one composited rectangle.
const NS = 'http://www.w3.org/2000/svg';
const FEATHER = 30;          // px of soft edge on the hole
const FADE_S = 0.55;         // how long a room takes to come up, and to go
const PAD = 26;              // px the hole stands off the lit box
const SHADE = '#070d0c';

// A glowing floor for the lit room, drawn once and re-used.
function poolTexture() {
  if (typeof document === 'undefined') return null;
  const size = 128, canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,244,226,1)');
  g.addColorStop(.55, 'rgba(255,233,198,.42)');
  g.addColorStop(1, 'rgba(255,228,190,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
// The screen rectangle a world box occupies. Corners behind the camera are
// dropped rather than projected, which would fold them to the far side of the
// screen and blow the rectangle out to the whole viewport.
export function projectBox(box, camera, width, height) {
  const point = new THREE.Vector3(), view = new THREE.Vector3();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, seen = 0;
  for (let i = 0; i < 8; i++) {
    point.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
    view.copy(point).applyMatrix4(camera.matrixWorldInverse);
    // Only a perspective camera has a corner that can be BEHIND it; an
    // orthographic one projects points behind its own plane correctly, and
    // dropping them there would shrink the hole to the room's front half.
    if (camera.isPerspectiveCamera && view.z > -camera.near) continue;
    point.project(camera); seen++;
    const x = (point.x + 1) * width / 2, y = (1 - point.y) * height / 2;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  if (seen < 4) return null;
  return {x: minX, y: minY, w: maxX - minX, h: maxY - minY};
}
// A box's identity, so the same room asked for twice is the same light.
export const boxKey = box =>
  box.min.toArray().concat(box.max.toArray()).map(v => v.toFixed(2)).join(',');
// What is lit after this call. A room already up stays up at whatever level it
// reached - a reveal ADDS the next room rather than restarting the ones beside
// it - and a room no longer wanted is kept, aimed at zero, so it goes down
// rather than vanishing.
export function mergeEntries(previous, boxes) {
  const kept = new Map(previous.map(entry => [entry.key, entry]));
  const entries = boxes.map(box => {
    const key = boxKey(box);
    const had = kept.get(key);
    kept.delete(key);
    if (had) {had.to = 1; return had;}
    return {key, box, t: 0, to: 1};
  });
  for (const gone of kept.values()) if (gone.t > 0.01) {gone.to = 0; entries.push(gone);}
  return entries;
}
// One step of the fade, and the ones that have finished going down are done.
export function advanceEntries(entries, dt, fade = FADE_S) {
  const step = dt / fade;
  for (const entry of entries)
    entry.t = entry.to > entry.t ? Math.min(entry.to, entry.t + step) : Math.max(entry.to, entry.t - step);
  return entries.filter(entry => entry.to > 0 || entry.t > 0.01);
}
export function createSpotlight(app) {
  // Built as nodes rather than from a markup string: innerHTML on an SVG
  // element is not something to rely on, and a pool of rectangles whose
  // attributes are rewritten costs far less per frame than re-parsing the
  // holes on every one of them.
  const make = (tag, attrs = {}) => {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  };
  const svg = make('svg', {class: 'tour-spot', 'aria-hidden': 'true'});
  const blur = make('feGaussianBlur', {stdDeviation: FEATHER});
  const filter = make('filter', {id: 'tour-feather', x: '-40%', y: '-40%', width: '180%', height: '180%'});
  filter.append(blur);
  const lit = make('rect', {fill: '#fff'});
  const holes = make('g', {class: 'tour-holes', filter: 'url(#tour-feather)'});
  const mask = make('mask', {id: 'tour-mask', maskUnits: 'userSpaceOnUse'});
  mask.append(lit, holes);
  const defs = make('defs');
  defs.append(filter, mask);
  const shade = make('rect', {fill: SHADE, mask: 'url(#tour-mask)', 'fill-opacity': '0'});
  svg.append(defs, shade);
  app.append(svg);
  const circle = make('circle', {fill: '#000', r: 0});
  const rects = [];
  // Where each photograph in the side gallery was taken from, numbered to
  // match its card. Drawn over the shade rather than through it.
  const marksLayer = make('g', {class: 'tour-marks'});
  svg.append(marksLayer);
  const marks = [];

  const group = new THREE.Group();
  group.name = 'Guided tour light';
  group.userData.aoExcluded = true;
  const texture = poolTexture();
  const pools = [], rings = [];
  const poolMaterial = new THREE.MeshBasicMaterial({map: texture, transparent: true, opacity: .5,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide});
  const ringMaterial = new THREE.LineBasicMaterial({color: 0xffd9a0, transparent: true, opacity: .75,
    depthTest: false, depthWrite: false, toneMapped: false});

  let entries = [], centre = false, level = 0, glow = true, shots = [], last = 0;
  function shape(index) {
    while (pools.length <= index) {
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), poolMaterial.clone());
      pool.rotation.x = -Math.PI / 2; pool.renderOrder = 60; pool.userData.aoExcluded = true;
      const ring = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(
        [[-.5, 0, -.5], [.5, 0, -.5], [.5, 0, -.5], [.5, 0, .5], [.5, 0, .5], [-.5, 0, .5], [-.5, 0, .5], [-.5, 0, -.5]]
          .map(p => new THREE.Vector3(...p))), ringMaterial.clone());
      ring.renderOrder = 61; ring.userData.aoExcluded = true;
      group.add(pool, ring); pools.push(pool); rings.push(ring);
    }
    return [pools[index], rings[index]];
  }
  // A numbered chip where a photograph in the side gallery was taken from, so
  // "this is that corner" is answered in the scene rather than left to the
  // caption. Hidden when the viewpoint is behind the camera.
  function placeShots(camera, width, height) {
    while (marks.length < shots.length) {
      const group = make('g', {class: 'tour-mark'});
      const ring = make('circle', {r: 11});
      const dot = make('circle', {r: 2.6, class: 'tour-mark-dot'});
      const label = make('text', {'text-anchor': 'middle', dy: '4.2'});
      group.append(ring, dot, label); marksLayer.append(group); marks.push({group, ring, dot, label});
    }
    const point = new THREE.Vector3(), view = new THREE.Vector3();
    marks.forEach((mark, i) => {
      const shot = shots[i];
      if (!shot) {mark.group.setAttribute('visibility', 'hidden'); return;}
      point.set(shot.position[0], shot.position[1], shot.position[2]);
      view.copy(point).applyMatrix4(camera.matrixWorldInverse);
      if (camera.isPerspectiveCamera && view.z > -camera.near) {mark.group.setAttribute('visibility', 'hidden'); return;}
      point.project(camera);
      const x = (point.x + 1) * width / 2, y = (1 - point.y) * height / 2;
      if (x < 8 || y < 8 || x > width - 8 || y > height - 8) {mark.group.setAttribute('visibility', 'hidden'); return;}
      mark.group.setAttribute('visibility', 'visible');
      for (const node of [mark.ring, mark.dot]) {node.setAttribute('cx', x.toFixed(1)); node.setAttribute('cy', y.toFixed(1));}
      mark.label.setAttribute('x', x.toFixed(1)); mark.label.setAttribute('y', y.toFixed(1));
      mark.label.textContent = String(shot.n);
    });
  }
  function place() {
    for (let i = 0; i < pools.length; i++) pools[i].visible = rings[i].visible = false;
    entries.forEach((entry, i) => {
      const [pool, ring] = shape(i);
      const box = entry.box;
      const size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
      // The pool spreads a little past the walls so the room's own floor is
      // lit to its edges rather than fading out short of them.
      pool.scale.set(size.x * 1.35, size.z * 1.35, 1);
      pool.position.set(mid.x, box.min.y + .035, mid.z);
      ring.scale.set(size.x, 1, size.z);
      ring.position.set(mid.x, box.min.y + .05, mid.z);
      const lit = glow && level > .02 && entry.t > .01;
      pool.visible = ring.visible = lit;
      pool.material.opacity = .5 * level * entry.t;
      ring.material.opacity = .75 * level * entry.t;
    });
  }
  return {
    group,
    // World boxes (THREE.Box3) to keep lit; an empty list lifts the shade.
    // A mark over the whole plot is a region rather than a room, and four
    // glowing rectangles the size of a garden read as stage lighting, so the
    // pool and its ring can be left off and the shade left to do the work.
    setBoxes(next, {glow: wantGlow = true} = {}) {
      glow = wantGlow;
      entries = mergeEntries(entries, next ?? []);
      place();
    },
    // What the side gallery is showing, so the scene can say where each of
    // those frames was taken from. Plain {n, position} in world metres.
    setShots(next) {shots = next ?? [];},
    setCentre(on) {centre = on;},
    // 0 lifts the shade entirely, 1 is the tour's full darkness.
    setLevel(value) {
      level = value; svg.style.opacity = String(value);
      svg.hidden = value <= .01;
      place();
    },
    get level() {return level;},
    get fading() {return entries.some(entry => Math.abs(entry.t - entry.to) > .01);},
    update(camera, width, height) {
      if (svg.hidden) return false;
      const now = performance.now();
      const dt = Math.min(.25, (now - (last || now)) / 1000); last = now;
      // "şak diye değil, fade in fade out": a room comes up and goes down over
      // half a second rather than being switched.
      entries = advanceEntries(entries, dt);
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      for (const el of [lit, shade]) {
        el.setAttribute('x', 0); el.setAttribute('y', 0);
        el.setAttribute('width', width); el.setAttribute('height', height);
      }
      // The renderer refreshes these during its own pass, which has not run
      // for this frame yet - without it the hole trails the camera by a frame
      // and visibly lags behind a flight.
      camera.updateMatrixWorld();
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      let cut = 0;
      if (centre) {
        circle.setAttribute('cx', (width / 2).toFixed(1));
        circle.setAttribute('cy', (height / 2).toFixed(1));
        circle.setAttribute('r', (Math.min(width, height) * .21).toFixed(1));
        if (!circle.parentNode) holes.append(circle);
        cut++;
      } else circle.remove();
      let used = 0;
      for (const entry of entries) {
        const rect = projectBox(entry.box, camera, width, height);
        if (!rect) continue;
        while (rects.length <= used) {const node = make('rect', {fill: '#000'}); rects.push(node);}
        const node = rects[used++];
        const x = rect.x - PAD, y = rect.y - PAD, w = rect.w + PAD * 2, h = rect.h + PAD * 2;
        node.setAttribute('x', x.toFixed(1)); node.setAttribute('y', y.toFixed(1));
        node.setAttribute('width', w.toFixed(1)); node.setAttribute('height', h.toFixed(1));
        node.setAttribute('rx', Math.min(46, Math.min(w, h) / 2.4).toFixed(1));
        // A hole at half strength half-lifts the shade over it, which is the
        // fade: the room arrives out of the dark rather than snapping open.
        node.setAttribute('fill-opacity', entry.t.toFixed(3));
        if (!node.parentNode) holes.append(node);
        cut++;
      }
      for (let i = used; i < rects.length; i++) rects[i].remove();
      // Nothing lit means nothing to darken: an all-white mask would paint
      // the whole viewport black rather than leaving the view alone.
      shade.setAttribute('fill-opacity', cut ? '.68' : '0');
      placeShots(camera, width, height);
      place();
      return entries.some(entry => Math.abs(entry.t - entry.to) > .01);
    },
    dispose() {
      svg.remove(); group.removeFromParent();
      for (const rect of rects) rect.remove();
      for (const mark of marks) mark.group.remove();
      for (const pool of pools) {pool.geometry.dispose(); pool.material.dispose();}
      for (const ring of rings) {ring.geometry.dispose(); ring.material.dispose();}
      poolMaterial.dispose(); ringMaterial.dispose(); texture?.dispose();
    },
  };
}
