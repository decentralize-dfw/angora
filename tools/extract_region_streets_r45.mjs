// R45 | The Bölge plan's streets, buildings and boundary, from OpenStreetMap.
//
// tools/osm-region.json.gz is fetched by .github/workflows/fetch-osm-region.yml
// on a GitHub runner (this environment cannot reach the OSM servers). This
// tool projects it onto the villa-centred metre grid the region map already
// uses and writes viewer/src/region-streets.json:
//   roads     [class, name, [x0,y0,x1,y1,...]]  class 0 major .. 3 service
//   buildings [x0,y0,...] closed rings
//   green     [x0,y0,...] parks, grass, forest
//   boundary  {name, ring:[x0,y0,...]} - the Angora Evleri polygon around
//             the villa, when OSM carries one
// © OpenStreetMap contributors, ODbL - credited in the map's meta line.
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const ROOT = '/home/user/angora';
const raw = JSON.parse(gunzipSync(readFileSync(ROOT + '/tools/osm-region.json.gz')).toString());
const CENTER = { lat: 39.87021694, lon: 32.71868652 };   // the atlas's address point
const M_LAT = 111132;
const M_LON = 111320 * Math.cos((CENTER.lat * Math.PI) / 180);
const toXY = (p) => [
  Math.round((p.lon - CENTER.lon) * M_LON),
  Math.round(-(p.lat - CENTER.lat) * M_LAT),
];
const flat = (geometry) => {
  const out = [];
  let px = null, py = null;
  for (const p of geometry) {
    const [x, y] = toXY(p);
    if (x === px && y === py) continue;
    out.push(x, y); px = x; py = y;
  }
  return out;
};
const within = (pts, r) => {
  for (let i = 0; i < pts.length; i += 2) if (Math.hypot(pts[i], pts[i + 1]) <= r) return true;
  return false;
};
const CLASSES = [
  /^(motorway|trunk|primary)/,
  /^(secondary|tertiary)/,
  /^(unclassified|residential|living_street|pedestrian)/,
  /^(service|track)/,
];

const roads = [], buildings = [], green = [];
let boundary = null;
const ringArea = (pts) => {
  let a = 0;
  for (let i = 0; i < pts.length; i += 2) {
    const j = (i + 2) % pts.length;
    a += pts[i] * pts[j + 1] - pts[j] * pts[i + 1];
  }
  return Math.abs(a / 2);
};
const containsOrigin = (pts) => {
  let inside = false;
  for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
    const xi = pts[i], yi = pts[i + 1], xj = pts[j], yj = pts[j + 1];
    if ((yi > 0) !== (yj > 0) && 0 < ((xj - xi) * (0 - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

for (const e of raw.elements) {
  const tags = e.tags ?? {};
  // the settlement's own OSM polygon: named Angora, drawn around the villa
  if (/angora/i.test(tags.name ?? '') && (tags.landuse || tags.place || tags.boundary)) {
    const rings = e.geometry ? [e.geometry]
      : (e.members ?? []).filter((m) => m.role === 'outer' && m.geometry).map((m) => m.geometry);
    for (const ring of rings) {
      const pts = flat(ring);
      if (pts.length >= 8 && containsOrigin(pts) && (!boundary || ringArea(pts) < ringArea(boundary.ring)))
        boundary = { name: tags.name, ring: pts };
    }
  }
  if (!e.geometry) continue;
  const pts = flat(e.geometry);
  if (pts.length < 4 || !within(pts, 2700)) continue;
  if (tags.highway) {
    const cls = CLASSES.findIndex((rx) => rx.test(tags.highway));
    if (cls >= 0) roads.push([cls, tags.name ?? '', pts]);
  } else if (tags.building) {
    if (pts.length >= 8 && ringArea(pts) >= 25) buildings.push(pts);
  } else if (/^(park|pitch|garden|playground)$/.test(tags.leisure ?? '') ||
             /^(grass|forest|meadow|village_green|recreation_ground)$/.test(tags.landuse ?? '')) {
    if (pts.length >= 8) green.push(pts);
  }
}

const out = {
  generated_for: 'R45 region plan',
  source: 'OpenStreetMap via Overpass (© OpenStreetMap contributors, ODbL)',
  fetched: raw.fetched,
  roads, buildings, green, boundary,
};
writeFileSync(ROOT + '/viewer/src/region-streets.json', JSON.stringify(out));
const kb = (JSON.stringify(out).length / 1024).toFixed(0);
console.log(`region-streets.json: ${roads.length} roads, ${buildings.length} buildings, ${green.length} green, boundary ${boundary ? `"${boundary.name}" (${boundary.ring.length / 2} pts)` : 'NONE'}, ${kb} KB`);
