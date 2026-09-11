// R41 | Inventory of the interior door leaves, before they are rebuilt.
//
// The interior doors came out of the CAD recovery as one mesh per storey
// (`F* | KAPI İÇ$KAPI`) holding every leaf on that floor welded into a single
// primitive: no per-door node, no frame, no hardware, and - because the
// recovery traced the plan symbol rather than a solid - a scatter of
// zero-height horizontal planes at mid-storey where the swing arc used to be.
//
// This walks each storey mesh, welds at 1 mm, union-finds the triangles into
// connected leaves, and fits each leaf an oriented rectangle in plan so the
// rebuild knows the hinge edge, the leaf width and the angle it stands open
// at. The degenerate clusters - the ones with no height - are reported but
// not fitted; they are the plan symbol, not a door.
//
// Writes build/cad/interior-doors-r41.json.
import { mkdirSync, writeFileSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
});

// A leaf shorter than this is the swing arc or a stray sliver, not a door.
const MIN_HEIGHT = 0.5;

function transform(wm, a, i) {
  const x = a[i * 3], y = a[i * 3 + 1], z = a[i * 3 + 2];
  return [wm[0] * x + wm[4] * y + wm[8] * z + wm[12],
          wm[1] * x + wm[5] * y + wm[9] * z + wm[13],
          wm[2] * x + wm[6] * y + wm[10] * z + wm[14]];
}

// Smallest-area enclosing rectangle over the plan footprint, swept at 0.5
// degrees. The leaves stand open at arbitrary angles, so an axis-aligned box
// would report the diagonal of the swing as the door's width.
function fitRectangle(points) {
  let best = null;
  for (let step = 0; step < 360; step++) {
    const angle = (step * Math.PI) / 360;         // 0 .. 180 deg in 0.5 deg steps
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
  const du = u1 - u0, dv = v1 - v0;
  // the long side is the leaf, the short side its thickness
  const long = du >= dv;
  const width = long ? du : dv, thickness = long ? dv : du;
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
    yaw,
    width, thickness,
  };
}

const report = { generated_for: 'R41', levels: {} };
for (const level of [0, 1, 2, 3]) {
  const doc = await io.read(`${FULL}/level-${level}.glb`);
  const node = doc.getRoot().listNodes().find((n) => n.getName() === `F${level} | KAPI İÇ$KAPI`);
  if (!node) { console.log(`level-${level}: no interior door mesh`); continue; }
  const wm = node.getWorldMatrix();
  const prim = node.getMesh().listPrimitives()[0];
  const pos = prim.getAttribute('POSITION'), idx = prim.getIndices();
  const a = pos.getArray();
  const world = [];
  for (let i = 0; i < pos.getCount(); i++) world.push(transform(wm, a, i));

  const weld = new Map(), rep = [];
  for (const p of world) {
    const key = p.map((v) => Math.round(v * 1000)).join(',');
    if (!weld.has(key)) weld.set(key, weld.size);
    rep.push(weld.get(key));
  }
  const parent = [...Array(weld.size).keys()];
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const join = (x, y) => { x = find(x); y = find(y); if (x !== y) parent[y] = x; };
  const I = idx ? idx.getArray() : null;
  const count = I ? I.length : pos.getCount();
  const tri = (t) => (I ? [I[t], I[t + 1], I[t + 2]] : [t, t + 1, t + 2]);
  for (let t = 0; t < count; t += 3) {
    const [p, q, r] = tri(t).map((i) => rep[i]);
    join(p, q); join(q, r);
  }
  const groups = new Map();
  for (let t = 0; t < count; t += 3) {
    const v = tri(t), g = find(rep[v[0]]);
    if (!groups.has(g)) groups.set(g, { tris: 0, points: [], y0: Infinity, y1: -Infinity });
    const entry = groups.get(g); entry.tris++;
    for (const i of v) {
      const p = world[i];
      entry.points.push([p[0], p[2]]);
      entry.y0 = Math.min(entry.y0, p[1]); entry.y1 = Math.max(entry.y1, p[1]);
    }
  }
  const leaves = [], symbols = [];
  for (const entry of groups.values()) {
    const height = entry.y1 - entry.y0;
    const record = { tris: entry.tris, y0: +entry.y0.toFixed(4), height: +height.toFixed(4) };
    if (height < MIN_HEIGHT) { symbols.push(record); continue; }
    const rect = fitRectangle(entry.points);
    leaves.push({
      ...record,
      centre: rect.centre.map((v) => +v.toFixed(4)),
      yaw_deg: +((rect.yaw * 180) / Math.PI).toFixed(2),
      width: +rect.width.toFixed(4),
      thickness: +rect.thickness.toFixed(4),
    });
  }
  leaves.sort((p, q) => p.centre[0] - q.centre[0] || p.centre[1] - q.centre[1]);
  report.levels[`level-${level}`] = {
    node: node.getName(),
    material: prim.getMaterial()?.getName() ?? null,
    vertices: pos.getCount(), triangles: count / 3,
    leaves, discarded_symbol_clusters: symbols.length,
    symbol_triangles: symbols.reduce((n, s) => n + s.tris, 0),
  };
  console.log(`level-${level}: ${leaves.length} leaves, ${symbols.length} symbol clusters (${symbols.reduce((n, s) => n + s.tris, 0)} tris)`);
  for (const leaf of leaves)
    console.log(`   w ${leaf.width.toFixed(3)} t ${leaf.thickness.toFixed(3)} h ${leaf.height.toFixed(3)}` +
      ` @ ${leaf.centre[0].toFixed(2)},${leaf.centre[1].toFixed(2)} yaw ${leaf.yaw_deg.toFixed(1)} tris ${leaf.tris}`);
}
mkdirSync(ROOT + '/build/cad', { recursive: true });
writeFileSync(ROOT + '/build/cad/interior-doors-r41.json', JSON.stringify(report, null, 2));
const total = Object.values(report.levels).reduce((n, l) => n + l.leaves.length, 0);
console.log('total interior leaves:', total);
