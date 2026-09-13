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

test('The map module projects landmarks within honest bounds', async () => {
  const source = readFileSync(new URL('../src/region-map.js', import.meta.url), 'utf8');
  // approximate landmarks stay declared as data, and the missing source file
  // stays named so the replacement duty is visible in review
  assert.match(source, /uzakolcek\.html/);
  assert.match(source, /LANDMARKS/);
  const lat = [...source.matchAll(/lat:\s*([\d.]+)/g)].map((m) => Number(m[1]));
  const lng = [...source.matchAll(/lng:\s*([\d.]+)/g)].map((m) => Number(m[1]));
  for (const v of lat) assert.ok(v > 39.7 && v < 40.1, `lat ${v} near Ankara`);
  for (const v of lng) assert.ok(v > 32.5 && v < 33.0, `lng ${v} near Ankara`);
});
