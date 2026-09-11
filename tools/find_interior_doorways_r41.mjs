// R41 | Find every interior doorway in the model.
//
// The delivery carries ten interior door leaves for a four-storey house. The
// rest of the doorways are holes in a wall with nothing hung in them, because
// the CAD recovery only ever traced the handful of 3D door blocks the drawing
// happened to carry. "Put the same door on all of them" first needs the list
// of all of them, and no such list exists in the source.
//
// So the openings are read back out of the walls themselves, from the section
// atlas that already carries the wall cross-section at 8 cm through the whole
// building. A doorway is the one shape that is
//
//   * empty at shin height (0.30 m over the floor),
//   * empty at waist height (1.00 m),
//   * solid overhead (2.25 m) - the lintel, and
//   * standing on habitable floor on both sides.
//
// A window fails the first test (it has a sill), a passage or an arch fails
// the third (nothing over it), and a low-silled window, an external door and a
// balcony door all fail the fourth: a quarter of a metre past the jamb they
// are outdoors. What is left is an interior door opening, and its own
// footprint gives the jamb line, the clear width and the wall to line.
//
// The ankle is deliberately not probed. Several of these openings carry a
// threshold strip, and a 0.15 m probe threw those doorways away.
//
// Writes build/cad/interior-doorways-r41.json.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const atlas = JSON.parse(readFileSync(FULL + '/sections.json', 'utf8'));
const rooms = JSON.parse(readFileSync(FULL + '/rooms.json', 'utf8'));
const DATUMS = atlas.exact_floor_heights_m ?? [0, 3.0996, 6.3714, 9.4705];
const PROBES = { shin: 0.30, waist: 1.0, head: 2.25 };
const CELL = 0.04;

const nearest = (height) => {
  let best = 0;
  for (let i = 1; i < atlas.slices.length; i++)
    if (Math.abs(atlas.slices[i].height - height) < Math.abs(atlas.slices[best].height - height)) best = i;
  return atlas.slices[best];
};

// footprint of the whole atlas, so every probe shares one grid
let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
for (const slice of atlas.slices)
  for (let k = 0; k < (slice.p?.length ?? 0); k += 2) {
    x0 = Math.min(x0, slice.p[k]); x1 = Math.max(x1, slice.p[k]);
    z0 = Math.min(z0, slice.p[k + 1]); z1 = Math.max(z1, slice.p[k + 1]);
  }
x0 -= 0.2; z0 -= 0.2; x1 += 0.2; z1 += 0.2;
const nx = Math.ceil((x1 - x0) / CELL), nz = Math.ceil((z1 - z0) / CELL);

// half-open scanline fill, so triangles that share an edge do not leave a seam
function raster(slice) {
  const mask = new Uint8Array(nx * nz);
  const p = slice.p, idx = slice.i;
  if (!p?.length || !idx?.length) return mask;
  for (let t = 0; t < idx.length; t += 3) {
    const ax = p[idx[t] * 2], az = p[idx[t] * 2 + 1];
    const bx = p[idx[t + 1] * 2], bz = p[idx[t + 1] * 2 + 1];
    const cx = p[idx[t + 2] * 2], cz = p[idx[t + 2] * 2 + 1];
    const i0 = Math.max(0, Math.floor((Math.min(ax, bx, cx) - x0) / CELL));
    const i1 = Math.min(nx - 1, Math.ceil((Math.max(ax, bx, cx) - x0) / CELL));
    const j0 = Math.max(0, Math.floor((Math.min(az, bz, cz) - z0) / CELL));
    const j1 = Math.min(nz - 1, Math.ceil((Math.max(az, bz, cz) - z0) / CELL));
    const area = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
    if (Math.abs(area) < 1e-12) continue;
    for (let j = j0; j <= j1; j++) {
      const pz = z0 + (j + 0.5) * CELL;
      for (let i = i0; i <= i1; i++) {
        const px = x0 + (i + 0.5) * CELL;
        const w0 = ((bx - ax) * (pz - az) - (bz - az) * (px - ax)) / area;
        const w1 = ((cx - bx) * (pz - bz) - (cz - bz) * (px - bx)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 >= 0 && w1 >= 0 && w2 >= 0) mask[j * nx + i] = 1;
      }
    }
  }
  return mask;
}

// dilate the lintel mask by one cell: the head slice is 8 cm off the probe
// height and the two contours need not agree cell for cell
function dilate(mask) {
  const out = new Uint8Array(mask.length);
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      if (!mask[j * nx + i]) continue;
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          const q = j + dj, r = i + di;
          if (q >= 0 && q < nz && r >= 0 && r < nx) out[q * nx + r] = 1;
        }
    }
  return out;
}

function fitRectangle(points) {
  let best = null;
  for (let step = 0; step < 360; step++) {
    const angle = (step * Math.PI) / 360;
    const c = Math.cos(angle), s = Math.sin(angle);
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (const [x, z] of points) {
      const u = x * c + z * s, v = -x * s + z * c;
      if (u < u0) u0 = u; if (u > u1) u1 = u;
      if (v < v0) v0 = v; if (v > v1) v1 = v;
    }
    const area = (u1 - u0) * (v1 - v0);
    if (!best || area < best.area) best = { angle, area, u0, u1, v0, v1, c, s };
  }
  const { u0, u1, v0, v1, c, s } = best;
  const du = u1 - u0, dv = v1 - v0, long = du >= dv;
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  // read the bearing off the fitted corners: the sweep measures the points
  // rotated by -angle, so `angle` is the negative of the axis's bearing
  const corner = (sign) => {
    const u = cu + (long ? (sign * du) / 2 : 0), v = cv + (long ? 0 : (sign * dv) / 2);
    return [u * c - v * s, v * c + u * s];
  };
  const [tail, head] = [corner(-1), corner(1)];
  const yaw = Math.atan2(head[1] - tail[1], head[0] - tail[0]);
  return {
    centre: [cu * c - cv * s, cv * c + cu * s],
    // the long side spans the opening; the short side crosses the wall
    yaw,
    span: long ? du : dv, depth: long ? dv : du,
  };
}

// Indoors, per storey. rooms.json's space polygons would be the obvious test
// and are the wrong one: only 20 of them exist for the whole house, several
// rooms are inside a shared volume that carries no polygon of its own, and the
// test threw away real doorways on that account. So indoors is taken from the
// walls instead - the air that cannot be reached from outside the building
// without crossing one. That covers every room whether or not it was ever
// given a boundary, and a balcony, a terrace and the garden all stay outdoors.
function interiorAir(wallMask) {
  const outside = new Uint8Array(wallMask.length);
  const stack = [];
  const push = (i, j) => {
    const k = j * nx + i;
    if (i < 0 || i >= nx || j < 0 || j >= nz || wallMask[k] || outside[k]) return;
    outside[k] = 1; stack.push(k);
  };
  for (let i = 0; i < nx; i++) { push(i, 0); push(i, nz - 1); }
  for (let j = 0; j < nz; j++) { push(0, j); push(nx - 1, j); }
  while (stack.length) {
    const k = stack.pop(), i = k % nx, j = (k - i) / nx;
    push(i + 1, j); push(i - 1, j); push(i, j + 1); push(i, j - 1);
  }
  const inside = new Uint8Array(wallMask.length);
  for (let k = 0; k < inside.length; k++) inside[k] = !wallMask[k] && !outside[k] ? 1 : 0;
  return inside;
}

const roomsByFloor = [0, 1, 2, 3].map((f) => rooms.rooms.filter((r) => r.floor_index === f && !r.label_only));
function nearestRooms(x, z, floor) {
  return roomsByFloor[floor]
    .map((r) => ({ name: r.name, id: r.id, d: Math.hypot(r.position[0] - x, r.position[2] - z) }))
    .sort((a, b) => a.d - b.d).slice(0, 2).map((r) => `${r.name} (${r.d.toFixed(1)} m)`);
}

const report = { generated_for: 'R41', cell_m: CELL, probes_m: PROBES, floors: {} };
let total = 0;
for (let floor = 0; floor < 4; floor++) {
  const datum = DATUMS[floor];
  const shin = raster(nearest(datum + PROBES.shin));
  const waist = raster(nearest(datum + PROBES.waist));
  const head = dilate(raster(nearest(datum + PROBES.head)));
  const indoors = interiorAir(waist);
  const open = new Uint8Array(nx * nz);
  for (let k = 0; k < open.length; k++) open[k] = head[k] && !shin[k] && !waist[k] ? 1 : 0;
  const at = (x, z) => {
    const i = Math.round((x - x0) / CELL - 0.5), j = Math.round((z - z0) / CELL - 0.5);
    return i >= 0 && i < nx && j >= 0 && j < nz ? indoors[j * nx + i] : 0;
  };

  const seen = new Uint8Array(nx * nz), openings = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i;
    if (!open[k] || seen[k]) continue;
    const stack = [k], cells = []; seen[k] = 1;
    while (stack.length) {
      const c = stack.pop(); cells.push(c);
      const ci = c % nx, cj = (c - ci) / nx;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const r = ci + di, q = cj + dj;
        if (r < 0 || r >= nx || q < 0 || q >= nz) continue;
        const n = q * nx + r;
        if (open[n] && !seen[n]) { seen[n] = 1; stack.push(n); }
      }
    }
    // a door opening is at least a third of a square metre of plan; anything
    // smaller is a notch where two wall contours failed to meet
    if (cells.length * CELL * CELL < 0.06) continue;
    const points = cells.map((c) => {
      const ci = c % nx, cj = (c - ci) / nx;
      return [x0 + (ci + 0.5) * CELL, z0 + (cj + 0.5) * CELL];
    });
    const rect = fitRectangle(points);
    // a door is 0.60 - 1.45 m clear through a 0.06 - 0.65 m wall
    if (rect.span < 0.6 || rect.span > 1.45 || rect.depth < 0.06 || rect.depth > 0.65) continue;
    // indoors on both sides, or it is a window, an external door or a balcony
    // door rather than an interior one. Two reaches are tried: a deep reveal
    // can put the near probe back inside the jamb rather than out in the room.
    const normal = [-Math.sin(rect.yaw), Math.cos(rect.yaw)];
    const indoorsBothSides = [rect.depth / 2 + 0.25, rect.depth / 2 + 0.45].some((reach) =>
      [1, -1].every((sign) =>
        at(rect.centre[0] + normal[0] * reach * sign, rect.centre[1] + normal[1] * reach * sign)));
    if (!indoorsBothSides) continue;
    openings.push({
      centre: rect.centre.map((v) => +v.toFixed(4)),
      yaw_deg: +((rect.yaw * 180) / Math.PI).toFixed(2),
      clear_width: +rect.span.toFixed(4),
      wall_depth: +rect.depth.toFixed(4),
      floor_y: +datum.toFixed(4),
      cells: cells.length,
      near: nearestRooms(rect.centre[0], rect.centre[1], floor),
    });
  }
  openings.sort((a, b) => a.centre[0] - b.centre[0] || a.centre[1] - b.centre[1]);
  report.floors[`f${floor}`] = { datum_m: datum, openings };
  total += openings.length;
  console.log(`f${floor}: ${openings.length} doorways`);
  for (const o of openings)
    console.log(`   ${o.clear_width.toFixed(2)} m clear x ${o.wall_depth.toFixed(2)} wall @ ` +
      `${o.centre[0].toFixed(2)},${o.centre[1].toFixed(2)} yaw ${o.yaw_deg.toFixed(0)}  ${o.near.join(' / ')}`);
}
report.total = total;
mkdirSync(ROOT + '/build/cad', { recursive: true });
writeFileSync(ROOT + '/build/cad/interior-doorways-r41.json', JSON.stringify(report, null, 2));
console.log('total doorways:', total);
