// R41 | One door, on every interior doorway.
//
// The twelve interior doors were the CAD recovery's worst survivals: a flat
// 0.82 x 2.00 m slab per opening with no frame, no panels, no hardware and no
// thickness worth the name, standing open at whatever angle the drawing's
// block happened to carry - and, welded into the same mesh, the plan's swing
// arcs flattened into horizontal sheets floating at mid-storey.
//
// The photographs show one door repeated through the whole house: a dark
// walnut six-panel door - two columns of raised panels, short over tall over
// tall - with a round brass knob, hung in a deep walnut lining behind a wide
// walnut architrave. So that is what is built here, once, and hung in all
// twelve openings from build/cad/door-schedule-r41.json.
//
// The leaf is sized to the hole rather than to itself: the schedule measures
// the clear width out of the wall at waist height, and one of the twelve
// turned out to be a 0.70 m opening carrying a 0.82 m leaf. Where a delivered
// leaf existed its hinge side and swing angle are kept, so no door that used
// to open into a room now opens into a wall; the two openings that never had a
// leaf take the house's average swing, opening to whichever side has the room.
//
// Everything lands in two nodes per storey, one walnut and one brass, and the
// old KAPI IC layer meshes are removed outright.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, statSync, unlinkSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const schedule = JSON.parse(readFileSync(ROOT + '/build/cad/door-schedule-r41.json', 'utf8'));

// The leaf, in metres. Stile and rail widths are the joinery in the photographs
// measured against the 0.82 m leaf beside them; the three panel rows are what
// is left over, and they sum to the leaf height exactly.
const LEAF = {
  height: 2.000, thickness: 0.042,
  stile: 0.115, muntin: 0.090,
  rails: { top: 0.110, frieze: 0.105, lock: 0.150, bottom: 0.195 },
  panels: { top: 0.255, middle: 0.535, bottom: 0.650 },
  // how far a panel field sits below the face, and the bevel that gets it there
  recess: 0.009, bevel: 0.024,
  gap: 0.012,              // leaf to jamb
  knobHeight: 1.020, knobInset: 0.068,
};
const CASING = { face: 0.075, proud: 0.020, lining: 0.020, head: 2.060, outer: 2.100 };
// The timber is the delivery's own dark wood: it is what the recovered
// interior doors already carried, what the lift's joinery and the roof fascia
// carry, and - unlike the R33 external-door pair - it exists on all four
// storeys. An earlier cut cloned the R33 walnut onto the attic instead and
// those doors came out pale grey; the clone was structurally valid but not the
// same material, and chasing the difference was worth less than not needing
// one.
const WALNUT = 'wood_dark';
// The hardware cannot take the same treatment. The house's plain `brass` is
// fully metallic, so it has no colour of its own - it mirrors whatever is
// around it, and under a bright sky every knob came out chrome. The authored
// door brass is 0.85 metallic over a warm base and reads as brass, and it
// carries no texture at all, so where a storey lacks it the same material can
// simply be written out again rather than copied: there is nothing in it but
// four numbers.
const BRASS = 'R31 | R35 door brass';
const BRASS_FACTORS = {
  baseColor: [0.3762621283531189, 0.2541520893573761, 0.09084171056747437, 1],
  metallic: 0.8500000238418579, roughness: 0.23000000417232513,
};

// ---------------------------------------------------------------- geometry --
// A tiny accumulator. Everything is authored in the door's own frame - x along
// the jamb line from the hinge, y up from the floor, z out the way it opens -
// and placed into the world by one basis per door.
class Builder {
  constructor() { this.position = []; this.normal = []; this.uv = []; this.index = []; }
  get count() { return this.position.length / 3; }
  // a planar quad, wound a-b-c-d
  quad(a, b, c, d) {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const len = Math.hypot(...n) || 1;
    n = n.map((c) => c / len);
    const base = this.count;
    for (const p of [a, b, c, d]) { this.position.push(...p); this.normal.push(...n); }
    this.index.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  // an axis-aligned box in the local frame
  box(x0, x1, y0, y1, z0, z1) {
    const p = (x, y, z) => [x, y, z];
    this.quad(p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1));   // +z
    this.quad(p(x1, y0, z0), p(x0, y0, z0), p(x0, y1, z0), p(x1, y1, z0));   // -z
    this.quad(p(x1, y0, z1), p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1));   // +x
    this.quad(p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1), p(x0, y1, z0));   // -x
    this.quad(p(x0, y1, z1), p(x1, y1, z1), p(x1, y1, z0), p(x0, y1, z0));   // +y
    this.quad(p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1));   // -y
  }
  // a lathed body about the z axis at (cx, cy): rings of [radius, z]
  lathe(cx, cy, rings, segments = 10) {
    for (let i = 0; i < rings.length - 1; i++) {
      const [r0, z0] = rings[i], [r1, z1] = rings[i + 1];
      for (let s = 0; s < segments; s++) {
        const a0 = (s / segments) * Math.PI * 2, a1 = ((s + 1) / segments) * Math.PI * 2;
        const p = (r, z, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z];
        if (r0 < 1e-6) this.tri(p(r1, z1, a0), p(r1, z1, a1), [cx, cy, z0]);
        else if (r1 < 1e-6) this.tri(p(r0, z0, a1), p(r0, z0, a0), [cx, cy, z1]);
        else this.quad(p(r0, z0, a0), p(r0, z0, a1), p(r1, z1, a1), p(r1, z1, a0));
      }
    }
  }
  tri(a, b, c) {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const len = Math.hypot(...n) || 1;
    n = n.map((k) => k / len);
    const base = this.count;
    for (const p of [a, b, c]) { this.position.push(...p); this.normal.push(...n); }
    this.index.push(base, base + 1, base + 2);
  }
  // Fold this builder into a target, placing every point with `place`, and
  // give it the texture coordinates the delivery's own joinery uses: one unit
  // to the metre, taken off the world axes the face is squarest to. Without
  // them the walnut map samples a single texel and every door in the house
  // comes out the flat colour of that one pixel.
  emitInto(target, place, rotate) {
    const base = target.count;
    for (let i = 0; i < this.count; i++) {
      const point = place([this.position[i * 3], this.position[i * 3 + 1], this.position[i * 3 + 2]]);
      const normal = rotate([this.normal[i * 3], this.normal[i * 3 + 1], this.normal[i * 3 + 2]]);
      target.position.push(...point);
      target.normal.push(...normal);
      const [ax, ay, az] = normal.map(Math.abs);
      if (ay >= ax && ay >= az) target.uv.push(point[0], point[2]);
      else if (ax >= az) target.uv.push(point[2], point[1]);
      else target.uv.push(point[0], point[1]);
    }
    for (const i of this.index) target.index.push(base + i);
  }
}

// The six-panel leaf, hinged on x=0 and lying in the z=0 plane, faces at
// +/- thickness/2. Built once per width, since the widths differ.
function buildLeaf(width) {
  const b = new Builder();
  const { height, thickness, stile, muntin, rails, panels, recess, bevel } = LEAF;
  const half = thickness / 2;
  // the two panel columns, left to right
  const columnWidth = (width - 2 * stile - muntin) / 2;
  const columns = [[stile, stile + columnWidth], [stile + columnWidth + muntin, width - stile]];
  // the three panel rows, bottom to top
  const y = {};
  y.bottomRail = [0, rails.bottom];
  y.bottomPanel = [rails.bottom, rails.bottom + panels.bottom];
  y.lockRail = [y.bottomPanel[1], y.bottomPanel[1] + rails.lock];
  y.middlePanel = [y.lockRail[1], y.lockRail[1] + panels.middle];
  y.friezeRail = [y.middlePanel[1], y.middlePanel[1] + rails.frieze];
  y.topPanel = [y.friezeRail[1], y.friezeRail[1] + panels.top];
  y.topRail = [y.topPanel[1], height];
  if (Math.abs(y.topRail[1] - y.topRail[0] - rails.top) > 1e-9) throw new Error('leaf rails do not sum to its height');

  for (const face of [1, -1]) {
    const z = half * face;
    const quad = (x0, x1, y0, y1) => face > 0
      ? b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z])
      : b.quad([x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z]);
    // the four rails run the full width
    for (const rail of [y.bottomRail, y.lockRail, y.friezeRail, y.topRail]) quad(0, width, rail[0], rail[1]);
    // the panel rows are stile, muntin, stile
    for (const row of [y.bottomPanel, y.middlePanel, y.topPanel]) {
      quad(0, stile, row[0], row[1]);
      quad(columns[0][1], columns[1][0], row[0], row[1]);
      quad(width - stile, width, row[0], row[1]);
    }
    // and the six panels themselves: a bevel down to a sunken field
    for (const row of [y.bottomPanel, y.middlePanel, y.topPanel]) {
      for (const column of columns) {
        const [x0, x1] = column, [v0, v1] = row;
        const i0 = x0 + bevel, i1 = x1 - bevel, j0 = v0 + bevel, j1 = v1 - bevel;
        const zi = z - recess * face;
        const o = (x, v) => [x, v, z], n = (x, v) => [x, v, zi];
        if (face > 0) {
          b.quad(o(x0, v0), o(x1, v0), n(i1, j0), n(i0, j0));
          b.quad(o(x1, v0), o(x1, v1), n(i1, j1), n(i1, j0));
          b.quad(o(x1, v1), o(x0, v1), n(i0, j1), n(i1, j1));
          b.quad(o(x0, v1), o(x0, v0), n(i0, j0), n(i0, j1));
          b.quad(n(i0, j0), n(i1, j0), n(i1, j1), n(i0, j1));
        } else {
          b.quad(o(x1, v0), o(x0, v0), n(i0, j0), n(i1, j0));
          b.quad(o(x1, v1), o(x1, v0), n(i1, j0), n(i1, j1));
          b.quad(o(x0, v1), o(x1, v1), n(i1, j1), n(i0, j1));
          b.quad(o(x0, v0), o(x0, v1), n(i0, j1), n(i0, j0));
          b.quad(n(i1, j0), n(i0, j0), n(i0, j1), n(i1, j1));
        }
      }
    }
  }
  // the four edges of the slab
  b.quad([0, 0, -half], [width, 0, -half], [width, 0, half], [0, 0, half]);
  b.quad([0, height, half], [width, height, half], [width, height, -half], [0, height, -half]);
  b.quad([0, 0, half], [0, height, half], [0, height, -half], [0, 0, -half]);
  b.quad([width, 0, -half], [width, height, -half], [width, height, half], [width, 0, half]);
  return b;
}

// A round knob on a rose, on both faces, plus the spindle between them.
function buildKnob(width) {
  const b = new Builder();
  const x = width - LEAF.knobInset, y = LEAF.knobHeight, half = LEAF.thickness / 2;
  for (const face of [1, -1]) {
    const z = (d) => (half + d) * face;
    // rose
    b.lathe(x, y, [[0, z(0)], [0.030, z(0)], [0.030, z(0.005)], [0.022, z(0.008)]]);
    // neck and ball
    b.lathe(x, y, [[0.022, z(0.008)], [0.013, z(0.016)], [0.013, z(0.028)],
      [0.024, z(0.038)], [0.027, z(0.050)], [0.021, z(0.062)], [0, z(0.068)]]);
  }
  return b;
}

// Three barrels on the hinge stile.
function buildHinges() {
  const b = new Builder();
  const half = LEAF.thickness / 2;
  for (const y of [0.220, 1.000, 1.790]) {
    // the barrel lies along y, so it is lathed about z and then laid down by
    // authoring the rings as a short cylinder built from quads instead
    const r = 0.014, h = 0.085, segments = 8;
    for (let s = 0; s < segments; s++) {
      const a0 = (s / segments) * Math.PI * 2, a1 = ((s + 1) / segments) * Math.PI * 2;
      const p = (a, v) => [Math.cos(a) * r, v, Math.sin(a) * r];
      b.quad(p(a0, y - h / 2), p(a1, y - h / 2), p(a1, y + h / 2), p(a0, y + h / 2));
      b.tri(p(a1, y + h / 2), p(a0, y + h / 2), [0, y + h / 2, 0]);
      b.tri(p(a0, y - h / 2), p(a1, y - h / 2), [0, y - h / 2, 0]);
    }
    // and a knuckle plate back onto the leaf edge
    b.box(0, 0.004, y - h / 2, y + h / 2, -half, half);
  }
  return b;
}

// The lining that faces the reveal and the architrave over the wall on both
// sides. Authored about the centre of the opening: x across the jamb line, y
// up from the floor, z across the wall.
function buildCasing(clear, depth) {
  const b = new Builder();
  const { face, proud, lining, head, outer } = CASING;
  const half = clear / 2, back = depth / 2;
  // reveal lining: two jambs and a head, set inside the hole
  b.box(-half, -half + lining, 0, head, -back, back);
  b.box(half - lining, half, 0, head, -back, back);
  b.box(-half, half, head - lining, head, -back, back);
  // architrave on both wall faces
  for (const side of [1, -1]) {
    const z0 = back * side, z1 = (back + proud) * side;
    const [a, c] = side > 0 ? [z0, z1] : [z1, z0];
    b.box(-half - face, -half, 0, outer, a, c);
    b.box(half, half + face, 0, outer, a, c);
    b.box(-half - face, half + face, outer - face, outer, a, c);
  }
  return b;
}

// ------------------------------------------------------------------ place --
function basis(door) {
  const [hx, hz] = door.hinge, [lx, lz] = door.latch;
  const len = Math.hypot(lx - hx, lz - hz) || 1;
  const jaw = [(lx - hx) / len, (lz - hz) / len];
  const open = door.open_normal;
  return { jaw, open };
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

let totalDoors = 0, totalTriangles = 0;
const report = { generated_for: 'R41', leaf: LEAF, casing: CASING, doors: [] };
for (const level of [0, 1, 2, 3]) {
  const doors = schedule.doors.filter((d) => d.level === level);
  if (!doors.length) continue;
  const doc = await io.read(`${FULL}/level-${level}.glb`);
  const root = doc.getRoot();

  // Out with the recovered layer - the slabs, the frames and the swing arcs -
  // and with any doors this tool hung on an earlier run, so running it twice
  // rebuilds the doors rather than hanging a second set inside the first.
  let removed = 0;
  for (const node of root.listNodes()) {
    if (!/^F\d \| (KAPI İÇ\$(KAPI|ÇERÇEVE)|Interior door (joinery|hardware))$/.test(node.getName())) continue;
    const mesh = node.getMesh();
    removed += mesh?.listPrimitives().reduce((n, p) => {
      const i = p.getIndices();
      return n + (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3;
    }, 0) ?? 0;
    node.dispose(); mesh?.dispose();
  }

  const walnut = new Builder(), brass = new Builder();
  for (const door of doors) {
    // the hole decides the leaf; the delivered leaf is the fallback and the
    // frame curve the last resort
    const clear = door.clear_width ?? door.leaf_width ?? door.frame_width;
    const width = Math.max(0.55, clear - LEAF.gap);
    const { jaw, open } = basis(door);
    const y0 = door.sill_y;
    // hinge -> world. x runs along the jamb, z out the opening side.
    const place = ([x, y, z]) => [
      door.hinge[0] + jaw[0] * x + open[0] * z,
      y0 + y,
      door.hinge[1] + jaw[1] * x + open[1] * z,
    ];
    const rotate = ([x, y, z]) => [jaw[0] * x + open[0] * z, y, jaw[1] * x + open[1] * z];
    // the leaf swings about the hinge, so its own x/z are turned first
    const swing = (door.swing_deg * Math.PI) / 180;
    const cs = Math.cos(swing), sn = Math.sin(swing);
    const swung = ([x, y, z]) => [x * cs - z * sn, y, x * sn + z * cs];
    const placeLeaf = (p) => place(swung(p));
    const rotateLeaf = (p) => rotate(swung(p));

    buildLeaf(width).emitInto(walnut, placeLeaf, rotateLeaf);
    buildKnob(width).emitInto(brass, placeLeaf, rotateLeaf);
    buildHinges().emitInto(brass, placeLeaf, rotateLeaf);
    // The casing is authored about the centre of the opening. That centre is
    // the frame's, not half the clear width out from the hinge: on the doors
    // where the recovered frame curve and the measured hole disagree the two
    // are up to 50 mm apart, and the architrave has to sit on the hole.
    const centreOffset = (door.frame_centre[0] - door.hinge[0]) * jaw[0] +
      (door.frame_centre[1] - door.hinge[1]) * jaw[1];
    buildCasing(clear, door.wall_depth).emitInto(walnut,
      ([x, y, z]) => place([centreOffset + x, y, z]), rotate);

    report.doors.push({ id: door.id, leaf_width: +width.toFixed(4), clear_width: +clear.toFixed(4),
      swing_deg: door.swing_deg, wall_depth: door.wall_depth });
    totalDoors++;
  }

  const materials = new Map();
  const timber = root.listMaterials().find((m) => m.getName() === WALNUT);
  if (!timber) throw new Error(`level-${level} has no ${WALNUT} to finish its doors in`);
  materials.set(WALNUT, timber);
  materials.set(BRASS, root.listMaterials().find((m) => m.getName() === BRASS)
    ?? doc.createMaterial(BRASS)
      .setBaseColorFactor(BRASS_FACTORS.baseColor)
      .setMetallicFactor(BRASS_FACTORS.metallic)
      .setRoughnessFactor(BRASS_FACTORS.roughness)
      .setDoubleSided(true));

  const buffer = root.listBuffers()[0] ?? doc.createBuffer();
  for (const [name, builder, material] of [
    [`F${level} | Interior door joinery`, walnut, materials.get(WALNUT)],
    [`F${level} | Interior door hardware`, brass, materials.get(BRASS)]]) {
    if (!builder.count) continue;
    const prim = doc.createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(builder.position)).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(builder.normal)).setBuffer(buffer))
      .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(builder.uv)).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(builder.index)).setBuffer(buffer))
      .setMaterial(material);
    const mesh = doc.createMesh(name).addPrimitive(prim);
    root.listScenes()[0].addChild(doc.createNode(name).setMesh(mesh));
    totalTriangles += builder.index.length / 3;
  }
  console.log(`level-${level}: ${doors.length} doors rebuilt, ${removed} recovered triangles removed, ` +
    `${(walnut.index.length + brass.index.length) / 3} authored`);

  // Disposing a node and its mesh leaves the accessors behind, and their

  // bytes stay in the buffer - re-running this tool grew the storey by a

  // megabyte a time until the orphans were swept.

  await doc.transform(prune());

  for (const ext of root.listExtensionsUsed())
    if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
  const plain = `${FULL}/level-${level}.plain.glb`;
  writeFileSync(plain, await io.writeBinary(doc));
  execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, `${FULL}/level-${level}.glb`,
    '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
  unlinkSync(plain);
}

const manifest = JSON.parse(readFileSync(FULL + '/manifest.json', 'utf8'));
for (const level of [0, 1, 2, 3]) {
  const asset = manifest.assets.find((a) => a.id === `level-${level}`);
  if (!asset) continue;
  const raw = readFileSync(`${FULL}/level-${level}.glb`);
  asset.bytes = raw.length;
  asset.sha256 = createHash('sha256').update(raw).digest('hex');
}
writeFileSync(FULL + '/manifest.json', JSON.stringify(manifest, null, 2));
report.total_doors = totalDoors; report.total_triangles = totalTriangles;
writeFileSync(ROOT + '/build/interior-doors-r41.json', JSON.stringify(report, null, 2));
console.log(`${totalDoors} interior doors rebuilt, ${totalTriangles} triangles`);
