// R41 | Rebuild the gallery balustrade as one balustrade.
//
// R20 laid the gallery rail out correctly - five nodes round the stairwell and
// down the flight, from the CAD rim and the raycast treads - and then built
// its three parts against three different runs of it. The scrollwork came out
// as a single flat sheet 10 mm thick on the far side (z +0.43); the timber
// handrail came out on the near side and down the flight (z -0.96) with
// nothing under it; and the brass fixings were scattered across the whole
// 2.9 x 2.4 x 1.4 m box the three of them span. So the balls hang in the air
// over the stair with no iron behind them, which is what the review saw.
//
// This builds the four runs the layout describes as one assembly: a newel at
// every node, a flat bottom rail, a profiled timber handrail on top following
// the rake, and between them the scroll panels from the photographs - a lyre
// of two opposed C-scrolls with a volute in each lower corner, and the brass
// fixings on the scrolls where the photographs put them, at the crossings.
//
// Nothing about the layout is re-derived. The nodes, their heights and the
// 1.0 m rail height are R20's; the drawing's plan y is the model's -z, which
// is why the old scrollwork sat on the opposite side of the well from the
// handrail.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const LEVEL = 2;
const OLD = /^Gallery R20 \| /;
const layout = JSON.parse(readFileSync(ROOT + '/build/cad/gallery-railing-layout.json', 'utf8'));

const RAIL = {
  height: layout.height_m,          // 1.000 m to the top of the handrail
  bottomRail: [0.050, 0.090],       // flat bar, bottom of the infill
  infillTop: 0.865,                 // where the timber sits on the iron
  handrail: { width: 0.088, depth: 0.052 },
  newel: 0.042,                     // square iron standard at each node
  bar: { width: 0.015, depth: 0.008 },  // the scrollwork's flat bar
  panel: 0.78,                      // nominal panel width; runs divide evenly
  ball: 0.017,                      // brass fixing
};
const IRON = 'metal', TIMBER = 'antique_wood', BRASS = 'brass';

class Builder {
  constructor() { this.position = []; this.normal = []; this.index = []; }
  get count() { return this.position.length / 3; }
  quad(a, b, c, d) {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const len = Math.hypot(...n) || 1; n = n.map((k) => k / len);
    const base = this.count;
    for (const p of [a, b, c, d]) { this.position.push(...p); this.normal.push(...n); }
    this.index.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  tri(a, b, c) {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const len = Math.hypot(...n) || 1; n = n.map((k) => k / len);
    const base = this.count;
    for (const p of [a, b, c]) { this.position.push(...p); this.normal.push(...n); }
    this.index.push(base, base + 1, base + 2);
  }
  box(x0, x1, y0, y1, z0, z1) {
    const p = (x, y, z) => [x, y, z];
    this.quad(p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1));
    this.quad(p(x1, y0, z0), p(x0, y0, z0), p(x0, y1, z0), p(x1, y1, z0));
    this.quad(p(x1, y0, z1), p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1));
    this.quad(p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1), p(x0, y1, z0));
    this.quad(p(x0, y1, z1), p(x1, y1, z1), p(x1, y1, z0), p(x0, y1, z0));
    this.quad(p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1));
  }
  // Sweep the flat bar along a polyline drawn in the panel's own plane. The
  // bar keeps its face to the viewer, the way forged flat bar is set, so the
  // section stays (width in plane, depth across it) all the way round.
  //
  // Vertices are shared along the bar's length and split only between its four
  // faces, so a 19-ring scroll costs 152 vertices rather than the 288 that
  // emitting each quad on its own would: the whole balustrade is a hundred of
  // these, and the first cut of it put 1.1 MB on the storey.
  sweep(points, width = RAIL.bar.width, depth = RAIL.bar.depth) {
    const half = width / 2, thick = depth / 2;
    const rings = [];
    for (let i = 0; i < points.length; i++) {
      const previous = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
      let tx = next[0] - previous[0], ty = next[1] - previous[1];
      const len = Math.hypot(tx, ty) || 1; tx /= len; ty /= len;
      const nx = -ty, ny = tx;                       // in-plane normal
      const [px, py] = points[i];
      const corner = [
        [px + nx * half, py + ny * half, thick], [px - nx * half, py - ny * half, thick],
        [px - nx * half, py - ny * half, -thick], [px + nx * half, py + ny * half, -thick],
      ];
      // one normal per face, the two corners of that face carrying it
      const normal = [[0, 0, 1], [-nx, -ny, 0], [0, 0, -1], [nx, ny, 0]];
      const base = this.count;
      for (let k = 0; k < 4; k++)
        for (const c of [corner[k], corner[(k + 1) % 4]]) {
          this.position.push(...c); this.normal.push(...normal[k]);
        }
      rings.push({ base, corner });
    }
    for (let i = 0; i < rings.length - 1; i++)
      for (let k = 0; k < 4; k++) {
        const a = rings[i].base + k * 2, b = rings[i + 1].base + k * 2;
        this.index.push(a, a + 1, b + 1, a, b + 1, b);
      }
    const [first, last] = [rings[0].corner, rings.at(-1).corner];
    this.tri(first[0], first[2], first[1]); this.tri(first[0], first[3], first[2]);
    this.tri(last[0], last[1], last[2]); this.tri(last[0], last[2], last[3]);
  }
  ball(cx, cy, cz, r, segments = 6, rings = 4) {
    for (let i = 0; i < rings; i++) {
      const t0 = (i / rings) * Math.PI, t1 = ((i + 1) / rings) * Math.PI;
      for (let s = 0; s < segments; s++) {
        const a0 = (s / segments) * Math.PI * 2, a1 = ((s + 1) / segments) * Math.PI * 2;
        const p = (t, a) => [cx + r * Math.sin(t) * Math.cos(a), cy + r * Math.cos(t), cz + r * Math.sin(t) * Math.sin(a)];
        if (i === 0) this.tri(p(t1, a1), p(t1, a0), p(t0, a0));
        else if (i === rings - 1) this.tri(p(t0, a0), p(t0, a1), p(t1, a0));
        else this.quad(p(t0, a0), p(t0, a1), p(t1, a1), p(t1, a0));
      }
    }
  }
}

// A scroll: a bar curling in to a tight eye, as a flat spiral.
function scroll(cx, cy, startAngle, sweep, outer, inner, steps = 15) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = startAngle + sweep * t;
    const radius = outer * Math.pow(inner / outer, t);
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  return points;
}

// One panel of the photographed pattern, drawn on a normalised field - u
// across the panel, v up from the bottom rail - so the same composition holds
// whatever width a run divides into.
//
// The photographs show a lyre springing off the bottom rail at the centre of
// each panel, opening out to the corners and curling in under the handrail,
// with two courses of C-scrolls interlocking inside it, a volute rising off
// the rail at each end, and small brass fixings at the eyes and crossings.
function panelPattern(width, height) {
  const bars = [], balls = [];
  const U = (u) => u * width, V = (v) => v * height, S = (v) => v * height;
  const spiral = (u, v, startAngle, sweep, outer, inner = 0.016) =>
    scroll(U(u), V(v), startAngle, sweep, S(outer), inner);

  for (const side of [1, -1]) {
    const spine = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      spine.push([U(0.5 + side * 0.42 * Math.pow(Math.sin(t * Math.PI * 0.5), 1.25)),
                  V(0.90 * (1 - Math.cos(t * Math.PI * 0.5)))]);
    }
    bars.push(spine);
    const tip = spine.at(-1);
    bars.push(scroll(tip[0] - side * 0.048, tip[1] + 0.012,
      side > 0 ? -1.25 : Math.PI + 1.25, side * 4.8, S(0.13), 0.010));
    balls.push(tip);
  }
  // the upper course, filling the body of the lyre
  bars.push(spiral(0.31, 0.60, Math.PI * 0.30, -5.0, 0.25));
  bars.push(spiral(0.69, 0.60, Math.PI * 0.70, 5.0, 0.25));
  balls.push([U(0.31), V(0.60)], [U(0.69), V(0.60)]);
  // the lower course, turned the other way so the two interlock
  bars.push(spiral(0.29, 0.31, -Math.PI * 0.30, 5.2, 0.20));
  bars.push(spiral(0.71, 0.31, Math.PI * 1.30, -5.2, 0.20));
  // the centre post, tying the lyre's feet to the rail, curled at its head
  bars.push([[U(0.5), V(0.02)], [U(0.5), V(0.30)]]);
  for (const side of [1, -1])
    bars.push(scroll(U(0.5) + side * S(0.10), V(0.34), Math.PI * 0.5, -side * 3.6, S(0.11), 0.010));
  balls.push([U(0.5), V(0.32)]);
  // the volutes at the panel ends
  for (const side of [1, -1]) {
    bars.push(spiral(0.5 + side * 0.40, 0.14, side > 0 ? 2.7 : Math.PI - 2.7, -side * 5.4, 0.17));
    balls.push([U(0.5 + side * 0.40), V(0.14)]);
  }
  return { bars, balls };
}

const builders = { iron: new Builder(), timber: new Builder(), brass: new Builder() };
// the drawing's plan y is the model's -z
const nodes = layout.nodes.map((n) => ({ x: n.xy[0], z: -n.xy[1], y: n.rail_base_z_m }));
let panels = 0;
for (let i = 0; i < nodes.length - 1; i++) {
  const a = nodes[i], b = nodes[i + 1];
  const run = Math.hypot(b.x - a.x, b.z - a.z);
  if (run < 0.05) continue;
  const dir = [(b.x - a.x) / run, (b.z - a.z) / run];
  const side = [-dir[1], dir[0]];                  // across the rail, in plan
  const rake = (b.y - a.y) / run;                  // how the run falls
  // u along the run, v vertical from that point's own base height
  const place = ([u, v, w]) => [
    a.x + dir[0] * u + side[0] * w,
    a.y + rake * u + v,
    a.z + dir[1] * u + side[1] * w,
  ];
  const emit = (builder, source) => {
    const base = builder.count;
    for (let k = 0; k < source.count; k++) {
      const p = place([source.position[k * 3], source.position[k * 3 + 1], source.position[k * 3 + 2]]);
      builder.position.push(...p);
      const n = source.normal.slice(k * 3, k * 3 + 3);
      // rotate the normal with the run; the rake is shallow enough that the
      // vertical component carries unchanged
      builder.normal.push(dir[0] * n[0] + side[0] * n[2], n[1], dir[1] * n[0] + side[1] * n[2]);
    }
    for (const index of source.index) builder.index.push(base + index);
  };

  // handrail and bottom rail, run end to run end
  const local = { iron: new Builder(), timber: new Builder(), brass: new Builder() };
  const halfWidth = RAIL.handrail.width / 2, top = RAIL.height, thick = RAIL.handrail.depth;
  local.timber.box(0, run, top - thick, top, -halfWidth, halfWidth);
  local.iron.box(0, run, RAIL.bottomRail[0], RAIL.bottomRail[1], -RAIL.bar.depth, RAIL.bar.depth);
  // a second flat bar just under the timber, which is what the scrolls tie into
  local.iron.box(0, run, RAIL.infillTop - RAIL.bar.width, RAIL.infillTop, -RAIL.bar.depth, RAIL.bar.depth);
  // newels: one at the start of every run, and one at the very end
  const post = RAIL.newel / 2;
  for (const u of i === nodes.length - 2 ? [0, run] : [0])
    local.iron.box(u - post, u + post, 0, top - thick, -post, post);

  const count = Math.max(1, Math.round(run / RAIL.panel));
  const width = run / count;
  const height = RAIL.infillTop - RAIL.bottomRail[1];
  for (let k = 0; k < count; k++) {
    const { bars, balls } = panelPattern(width, height);
    const offset = k * width;
    for (const bar of bars) {
      const moved = bar.map(([u, v]) => [offset + u, RAIL.bottomRail[1] + v]);
      local.iron.sweep(moved);
    }
    for (const [u, v] of balls)
      local.brass.ball(offset + u, RAIL.bottomRail[1] + v, 0, RAIL.ball);
    panels++;
  }
  for (const key of ['iron', 'timber', 'brass']) emit(builders[key], local[key]);
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const file = `${FULL}/level-${LEVEL}.glb`;
const doc = await io.read(file);
const root = doc.getRoot();

let removed = 0;
for (const node of root.listNodes()) {
  if (!OLD.test(node.getName()) && !/^Gallery R41 \| /.test(node.getName())) continue;
  const mesh = node.getMesh();
  removed += mesh?.listPrimitives().reduce((n, p) => {
    const i = p.getIndices();
    return n + (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3;
  }, 0) ?? 0;
  node.dispose(); mesh?.dispose();
}

const buffer = root.listBuffers()[0] ?? doc.createBuffer();
let authored = 0;
for (const [name, key, materialName] of [
  ['Gallery R41 | forged scroll balustrade', 'iron', IRON],
  ['Gallery R41 | profiled timber handrail', 'timber', TIMBER],
  ['Gallery R41 | brass scroll fixings', 'brass', BRASS]]) {
  const builder = builders[key];
  if (!builder.count) continue;
  const material = root.listMaterials().find((m) => m.getName() === materialName);
  if (!material) throw new Error('material missing: ' + materialName);
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(builder.position)).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(builder.normal)).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(builder.index)).setBuffer(buffer))
    .setMaterial(material);
  root.listScenes()[0].addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)));
  authored += builder.index.length / 3;
  console.log(`${name}: ${builder.index.length / 3} triangles`);
}
console.log(`${panels} scroll panels over ${nodes.length - 1} runs; ${removed} R20 triangles removed, ${authored} authored`);

// Disposing a node and its mesh leaves the accessors behind, and their

// bytes stay in the buffer - re-running this tool grew the storey by a

// megabyte a time until the orphans were swept.

await doc.transform(prune());

for (const ext of root.listExtensionsUsed())
  if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
const plain = `${FULL}/level-${LEVEL}.plain.glb`;
writeFileSync(plain, await io.writeBinary(doc));
execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, file,
  '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
unlinkSync(plain);

const manifest = JSON.parse(readFileSync(FULL + '/manifest.json', 'utf8'));
const asset = manifest.assets.find((a) => a.id === `level-${LEVEL}`);
const raw = readFileSync(file);
asset.bytes = raw.length;
asset.sha256 = createHash('sha256').update(raw).digest('hex');
writeFileSync(FULL + '/manifest.json', JSON.stringify(manifest, null, 2));
writeFileSync(ROOT + '/build/gallery-balustrade-r41.json', JSON.stringify({
  generated_for: 'R41', runs: nodes.length - 1, panels, removed_triangles: removed,
  authored_triangles: authored, rail: RAIL, layout_revision: layout.revision,
}, null, 2));
console.log('level-2.glb re-encoded:', asset.bytes, 'bytes');
