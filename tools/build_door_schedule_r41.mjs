// R41 | The interior door schedule.
//
// Pairs what the CAD recovery left behind - the door-frame layer
// (`F* | KAPI İÇ$ÇERÇEVE`) and the leaf layer (`F* | KAPI İÇ$KAPI`) - into one
// doorway per frame, and works out for each what a rebuilt door has to know:
// where the jamb line runs, how wide the opening is, how thick the wall is,
// which side the leaf is hinged on and how far it stands open.
//
// The frames are the authority for where a door is. They come off the drawing
// axis-aligned (every one lands on 0, +/-45 or +/-90 degrees) and every one is
// 2.100 m tall, so they read cleanly. The leaves are the authority for how a
// door is hung: each is a 0.82 x 2.00 m slab standing open at whatever angle
// the drawing's block was rotated to, and the end of the slab that is nearest
// its frame is the hinge.
//
// Three of the thirteen frames never got a leaf at all. They are scheduled
// with the swing left at the house default, so the rebuild hangs a door in
// them like every other.
//
// Writes build/cad/door-schedule-r41.json.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const DATUMS = [0, 3.0996, 6.3714, 9.4705];
// A cluster shorter than this is the plan's swing arc flattened into the
// model, not a door.
const MIN_HEIGHT = 0.5;
// Doors that were never given a leaf open into the room at this angle, which
// is what the photographs show and what the fitted leaves average.
const DEFAULT_SWING_DEG = 78;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
});

// The frame curves say where a door is; the wall says how wide the hole in it
// actually is, and the two do not always agree - one frame came back off the
// recovery 0.12 m narrower than the leaf that hangs in it. So the clear width
// is measured: walk out along the jamb line at waist height until the wall
// closes in on both sides.
const atlas = JSON.parse(readFileSync(FULL + '/sections.json', 'utf8'));
const sliceAt = (height) => {
  let best = 0;
  for (let i = 1; i < atlas.slices.length; i++)
    if (Math.abs(atlas.slices[i].height - height) < Math.abs(atlas.slices[best].height - height)) best = i;
  return atlas.slices[best];
};
function solid(slice, x, z) {
  const p = slice.p, I = slice.i;
  if (!p?.length || !I?.length) return false;
  for (let t = 0; t < I.length; t += 3) {
    const ax = p[I[t] * 2], az = p[I[t] * 2 + 1];
    const bx = p[I[t + 1] * 2], bz = p[I[t + 1] * 2 + 1];
    const cx = p[I[t + 2] * 2], cz = p[I[t + 2] * 2 + 1];
    const area = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
    if (Math.abs(area) < 1e-12) continue;
    const w0 = ((bx - ax) * (z - az) - (bz - az) * (x - ax)) / area;
    const w1 = ((cx - bx) * (z - bz) - (cz - bz) * (x - bx)) / area;
    if (w0 >= -1e-9 && w1 >= -1e-9 && 1 - w0 - w1 >= -1e-9) return true;
  }
  return false;
}
function clearRun(slice, centre, dir, limit = 1.2) {
  for (let d = 0.01; d <= limit; d += 0.005)
    if (solid(slice, centre[0] + dir[0] * d, centre[1] + dir[1] * d)) return d;
  return null;
}

function clusters(node) {
  const wm = node.getWorldMatrix();
  const prim = node.getMesh().listPrimitives()[0];
  const pos = prim.getAttribute('POSITION'), idx = prim.getIndices();
  const a = pos.getArray(), world = [];
  for (let i = 0; i < pos.getCount(); i++) {
    const x = a[i * 3], y = a[i * 3 + 1], z = a[i * 3 + 2];
    world.push([wm[0] * x + wm[4] * y + wm[8] * z + wm[12],
                wm[1] * x + wm[5] * y + wm[9] * z + wm[13],
                wm[2] * x + wm[6] * y + wm[10] * z + wm[14]]);
  }
  const weld = new Map(), rep = [];
  for (const p of world) {
    const key = p.map((v) => Math.round(v * 1000)).join(',');
    if (!weld.has(key)) weld.set(key, weld.size);
    rep.push(weld.get(key));
  }
  const parent = [...Array(weld.size).keys()];
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const join = (x, y) => { x = find(x); y = find(y); if (x !== y) parent[y] = x; };
  const I = idx ? idx.getArray() : null, count = I ? I.length : pos.getCount();
  const tri = (t) => (I ? [I[t], I[t + 1], I[t + 2]] : [t, t + 1, t + 2]);
  for (let t = 0; t < count; t += 3) { const [p, q, r] = tri(t).map((i) => rep[i]); join(p, q); join(q, r); }
  const groups = new Map();
  for (let t = 0; t < count; t += 3) {
    const g = find(rep[tri(t)[0]]);
    if (!groups.has(g)) groups.set(g, { tris: 0, points: [], y0: Infinity, y1: -Infinity });
    const entry = groups.get(g); entry.tris++;
    for (const i of tri(t)) {
      const p = world[i];
      entry.points.push([p[0], p[2]]);
      entry.y0 = Math.min(entry.y0, p[1]); entry.y1 = Math.max(entry.y1, p[1]);
    }
  }
  const out = [];
  for (const entry of groups.values()) {
    if (entry.y1 - entry.y0 < MIN_HEIGHT) continue;
    const rect = fitRectangle(entry.points);
    // A two-triangle sliver is a face of some other body that happens to touch
    // the layer, not a leaf or a frame.
    if (entry.tris < 8 || rect.thickness < 0.01) continue;
    out.push({ ...rect, tris: entry.tris, y0: entry.y0, y1: entry.y1 });
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
  // The two ends of the long axis, in world. Everything else is read back off
  // these rather than off the sweep angle: the fit rotates the points by
  // -angle to measure them, so the angle that comes out of the sweep is the
  // negative of the axis's bearing, and deriving the yaw from it separately
  // put the jamb line and the leaf 90 degrees apart on the doors whose frame
  // does not sit square to the plan.
  const ends = [-1, 1].map((sign) => {
    const u = cu + (long ? (sign * du) / 2 : 0), v = cv + (long ? 0 : (sign * dv) / 2);
    return [u * c - v * s, v * c + u * s];
  });
  return {
    centre: [cu * c - cv * s, cv * c + cu * s],
    yaw: Math.atan2(ends[1][1] - ends[0][1], ends[1][0] - ends[0][0]),
    width: long ? du : dv, thickness: long ? dv : du, ends,
  };
}

const schedule = { generated_for: 'R41', default_swing_deg: DEFAULT_SWING_DEG, doors: [] };
for (let level = 0; level < 4; level++) {
  const doc = await io.read(`${FULL}/level-${level}.glb`);
  const nodes = doc.getRoot().listNodes();
  const frameNode = nodes.find((n) => n.getName() === `F${level} | KAPI İÇ$ÇERÇEVE`);
  const leafNode = nodes.find((n) => n.getName() === `F${level} | KAPI İÇ$KAPI`);
  if (!frameNode) { console.log(`level-${level}: no door frames`); continue; }
  const frames = clusters(frameNode), leaves = leafNode ? clusters(leafNode) : [];

  // One frame can come back as two concentric clusters - the lining and the
  // architrave were separate curves in the drawing. Merge anything closer than
  // a quarter of a metre, keeping the widest.
  const merged = [];
  for (const frame of frames.sort((p, q) => q.width - p.width)) {
    if (merged.some((m) => Math.hypot(m.centre[0] - frame.centre[0], m.centre[1] - frame.centre[1]) < 0.25)) continue;
    merged.push(frame);
  }

  const taken = new Set();
  for (const frame of merged) {
    // the leaf whose nearer end is closest to this frame's centre
    let pick = null;
    leaves.forEach((leaf, i) => {
      if (taken.has(i)) return;
      const d = Math.min(...leaf.ends.map((e) => Math.hypot(e[0] - frame.centre[0], e[1] - frame.centre[1])));
      if (d < 0.7 && (!pick || d < pick.d)) pick = { i, leaf, d };
    });
    let swing = DEFAULT_SWING_DEG, hinge = null, source = 'house default';
    if (pick) {
      taken.add(pick.i);
      // the leaf end nearest the frame is the hinge; the angle between the
      // jamb line and the leaf is how far it stands open
      const [near, far] = [...pick.leaf.ends].sort((p, q) =>
        Math.hypot(p[0] - frame.centre[0], p[1] - frame.centre[1]) -
        Math.hypot(q[0] - frame.centre[0], q[1] - frame.centre[1]));
      hinge = near;
      const leafDir = Math.atan2(far[1] - near[1], far[0] - near[0]);
      let delta = ((leafDir - frame.yaw) * 180) / Math.PI;
      while (delta <= -180) delta += 360; while (delta > 180) delta -= 360;
      swing = Math.abs(delta) > 90 ? 180 - Math.abs(delta) : Math.abs(delta);
      // which end of the jamb line the hinge sits on
      const [a, b] = frame.ends;
      const toA = Math.hypot(hinge[0] - a[0], hinge[1] - a[1]);
      const toB = Math.hypot(hinge[0] - b[0], hinge[1] - b[1]);
      hinge = toA <= toB ? a : b;
      source = 'delivered leaf';
    } else {
      hinge = frame.ends[0];
    }
    const other = frame.ends[0] === hinge ? frame.ends[1] : frame.ends[0];
    // Which way the leaf opens, as a world direction rather than a sign, so
    // the rebuild never has to work out whose normal the sign belonged to.
    const normal = [-Math.sin(frame.yaw), Math.cos(frame.yaw)];
    const waist = sliceAt(DATUMS[level] + 1.0);
    let side = 1, sideSource = 'delivered leaf';
    if (pick) {
      const mid = [(pick.leaf.ends[0][0] + pick.leaf.ends[1][0]) / 2, (pick.leaf.ends[0][1] + pick.leaf.ends[1][1]) / 2];
      side = Math.sign((mid[0] - frame.centre[0]) * normal[0] + (mid[1] - frame.centre[1]) * normal[1]) || 1;
    } else {
      // no leaf to copy: open into whichever side has the room for it
      const reach = (sign) => clearRun(waist, frame.centre, [normal[0] * sign, normal[1] * sign], 1.1) ?? 1.1;
      side = reach(1) >= reach(-1) ? 1 : -1;
      sideSource = 'clearer side of the opening';
    }
    // the hole in the wall, measured out from the frame centre along the jambs
    const jaw = [Math.cos(frame.yaw), Math.sin(frame.yaw)];
    const half = [1, -1].map((sign) => clearRun(waist, frame.centre, [jaw[0] * sign, jaw[1] * sign]));
    const measuredClear = half[0] !== null && half[1] !== null ? half[0] + half[1] : null;
    schedule.doors.push({
      id: `f${level}-D${String(schedule.doors.length + 1).padStart(2, '0')}`,
      level, floor_y: +DATUMS[level].toFixed(4), sill_y: +frame.y0.toFixed(4),
      frame_centre: frame.centre.map((v) => +v.toFixed(4)),
      frame_yaw_deg: +((frame.yaw * 180) / Math.PI).toFixed(2),
      frame_width: +frame.width.toFixed(4),
      wall_depth: +frame.thickness.toFixed(4),
      frame_height: +(frame.y1 - frame.y0).toFixed(4),
      hinge: hinge.map((v) => +v.toFixed(4)),
      latch: other.map((v) => +v.toFixed(4)),
      clear_width: measuredClear === null ? null : +measuredClear.toFixed(4),
      swing_deg: +swing.toFixed(1), swing_source: source,
      open_normal: [+(normal[0] * side).toFixed(6), +(normal[1] * side).toFixed(6)],
      open_normal_source: sideSource,
      leaf_width: pick ? +pick.leaf.width.toFixed(4) : null,
      leaf_height: pick ? +(pick.leaf.y1 - pick.leaf.y0).toFixed(4) : null,
    });
  }
  console.log(`level-${level}: ${merged.length} frames, ${leaves.length} leaves, ` +
    `${merged.length - taken.size} frames with no leaf`);
}
for (const door of schedule.doors)
  console.log(`  ${door.id} w ${door.frame_width.toFixed(2)} wall ${door.wall_depth.toFixed(2)} ` +
    `@ ${door.frame_centre[0].toFixed(2)},${door.frame_centre[1].toFixed(2)} yaw ${door.frame_yaw_deg.toFixed(0)} ` +
    `clear ${door.clear_width === null ? '  ? ' : door.clear_width.toFixed(2)} ` +
    `swing ${door.swing_deg.toFixed(0)} (${door.swing_source})` +
    (door.leaf_width ? ` leaf ${door.leaf_width.toFixed(2)}` : ''));
schedule.total = schedule.doors.length;
mkdirSync(ROOT + '/build/cad', { recursive: true });
writeFileSync(ROOT + '/build/cad/door-schedule-r41.json', JSON.stringify(schedule, null, 2));
console.log('scheduled interior doors:', schedule.total);
