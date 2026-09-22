import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// The Bölge map draws only what the delivery itself asserts: the plan layer
// is extracted from context.glb/villa.glb by tools/extract_region_plan_r44.mjs.
// These checks catch a silently broken extraction, not cartography.
const plan = JSON.parse(readFileSync(new URL('../src/region-plan.json', import.meta.url), 'utf8'));

test('The region plan carries the settlement, the plot and the villa at plausible scale', () => {
  assert.ok(plan.buildings.length >= 30, `${plan.buildings.length} neighbour hulls`);
  for (const hull of plan.buildings) assert.ok(hull.length >= 3);
  assert.ok(plan.villa.length >= 4, 'villa footprint hull');
  assert.ok(plan.plot.length >= 4, 'plot hull');
  // villa-centred: its own hull must straddle the origin
  const xs = plan.villa.map((p) => p[0]), ys = plan.villa.map((p) => p[1]);
  assert.ok(Math.min(...xs) < 0 && Math.max(...xs) > 0, 'villa hull straddles x origin');
  assert.ok(Math.min(...ys) < 0 && Math.max(...ys) > 0, 'villa hull straddles y origin');
  const span = Math.max(...xs) - Math.min(...xs);
  assert.ok(span > 10 && span < 40, `villa spans ${span.toFixed(1)} m`);
  // the settlement fits comfortably inside the 1 km ring
  for (const hull of plan.buildings) for (const [x, y] of hull)
    assert.ok(Math.hypot(x, y) < 600, 'neighbour within the settlement');
});

test('The road layer is a real PNG raster registered in metres', () => {
  assert.match(plan.roads.png, /^data:image\/png;base64,iVBOR/);
  assert.ok(plan.roads.w > 200 && plan.roads.w < 500, `roads span ${plan.roads.w} m`);
  assert.ok(plan.roads.h > 200 && plan.roads.h < 500);
  assert.ok(plan.roads.x < 0 && plan.roads.x + plan.roads.w > 0, 'raster covers the villa');
  assert.ok(plan.roads.png.length < 200000, 'raster stays a small bundle cost');
});

test('The places layer is the uzakolcek.html atlas, centred on the address point', () => {
  const places = JSON.parse(readFileSync(new URL('../src/region-places.json', import.meta.url), 'utf8'));
  // the atlas's own centre - Hatırlı Sokak No:10 - anchors every distance
  assert.ok(Math.abs(places.center.lat - 39.87021694) < 1e-6, `centre lat ${places.center.lat}`);
  assert.ok(Math.abs(places.center.lon - 32.71868652) < 1e-6, `centre lon ${places.center.lon}`);
  assert.match(places.source, /uzakolcek\.html/);
  assert.match(places.source, /OSM/);
  assert.ok(places.total >= 1000, `${places.total} amenities in the atlas`);
  assert.ok(places.curated.length >= 10 && places.curated.length <= 20, `${places.curated.length} curated chips`);
  for (const p of places.curated) {
    assert.ok(p.name && p.d > 0 && p.d <= places.radius_m, `${p.name} at ${p.d} m inside the atlas radius`);
    // chip position agrees with its atlas distance (equirectangular rounding)
    assert.ok(Math.abs(Math.hypot(p.x, p.y) - p.d) < 25, `${p.name} projected ${Math.hypot(p.x, p.y).toFixed(0)} m vs ${p.d} m`);
  }
  assert.ok(places.dots.length >= 150 && places.dots.length <= 1500, `${places.dots.length} dots`);
  for (const [x, y, g, name] of places.dots) {
    assert.ok(Math.hypot(x, y) <= 2700, 'dot within the 2 km view margin');
    assert.ok(g >= 0 && g < places.groups.length, 'dot group indexed');
    // "hepsinin başlığı gözükmek zorundadır": every dot carries its title
    assert.ok(typeof name === 'string' && name.length > 0, 'dot carries its name');
  }
  const source = readFileSync(new URL('../src/region-map.js', import.meta.url), 'utf8');
  assert.match(source, /region-places\.json/);
  assert.doesNotMatch(source, /LANDMARKS/, 'the hand-guessed landmark list is gone');
});

test('The street plan layer is OSM-backed once fetched, and villa-centred', () => {
  const streets = JSON.parse(readFileSync(new URL('../src/region-streets.json', import.meta.url), 'utf8'));
  if (!streets.roads.length) return;   // stub until the workflow's extract lands
  assert.match(streets.source, /OpenStreetMap/);
  assert.ok(streets.roads.length >= 100, `${streets.roads.length} roads`);
  assert.ok(streets.buildings.length >= 200, `${streets.buildings.length} buildings`);
  let near = 0;
  for (const [cls, , pts] of streets.roads) {
    assert.ok(cls >= 0 && cls <= 3);
    assert.ok(pts.length >= 4 && pts.length % 2 === 0);
    for (let i = 0; i < pts.length; i += 2) if (Math.hypot(pts[i], pts[i + 1]) < 400) { near++; break; }
  }
  assert.ok(near >= 5, 'streets pass near the villa - the projection is centred');
});

// The narrated tour's light on the settlement. This one was shipped wrong
// twice - first as a circle about the villa, which lit a disc of Beysukent
// and cut the estate's east half off, then as a hole cut from region-plan's
// `plot`, which is the VILLA's own 22 x 35 m plot: a mark the size of one
// house on a two-kilometre map. Angora Evleri has an outline of its own, the
// same one the dashed boundary is drawn from, and the lit area is that shape
// or it is wrong.
test('The settlement light is cut from the settlement, not from the villa plot', () => {
  const streets = JSON.parse(readFileSync(new URL('../src/region-streets.json', import.meta.url), 'utf8'));
  const source = readFileSync(new URL('../src/region-map.js', import.meta.url), 'utf8');
  const hole = source.match(/dimHole\.setAttribute\('points',([\s\S]{0,140}?)\);/);
  assert.ok(hole, 'the dim mask no longer cuts a hole');
  assert.match(hole[1], /streets\.boundary\.ring/, 'the hole is not cut from the settlement boundary');
  assert.doesNotMatch(source, /rm-plot-mask[\s\S]*?createElementNS\(svgNS, 'circle'\)/,
    'the light is a disc about the villa again');
  if (!streets.roads.length) return;   // stub until the workflow's extract lands
  assert.ok(streets.boundary, 'region-streets carries no settlement boundary to cut from');
  assert.match(streets.boundary.name, /Angora/i);
  // The dashed line and the lit area are the same ring, so they cannot drift.
  assert.match(source, /shape\('polygon', 'rm-bound', \{ points: flatPoints\(streets\.boundary\.ring\)/);
  const ring = streets.boundary.ring;
  assert.ok(ring.length >= 40 && ring.length % 2 === 0, `${ring.length} boundary ordinates`);
  const span = axis => {
    const v = ring.filter((_, i) => i % 2 === axis);
    return Math.max(...v) - Math.min(...v);
  };
  // Hundreds of metres across, not the tens of metres a single plot spans.
  assert.ok(span(0) > 800 && span(1) > 800,
    `the boundary is ${span(0).toFixed(0)} x ${span(1).toFixed(0)} m - that is a plot, not a settlement`);
  const plotSpan = axis => {
    const v = plan.plot.map(p => p[axis]);
    return Math.max(...v) - Math.min(...v);
  };
  assert.ok(plotSpan(0) < 100 && plotSpan(1) < 100,
    'region-plan.plot is no longer the villa plot - the comment in region-map.js needs rewriting');
});
