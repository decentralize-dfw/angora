// R44 | The region map's plan layer, extracted from the delivery itself.
//
// The Bölge view draws a clean north-up map around the villa. Its plan
// data is not drawn by hand and not fetched from anywhere: the roads are
// the context model's own 'CAD roads' asphalt surface rasterised top-down,
// the neighbour houses are convex hulls of the B-numbered context
// families, the plot is the R32 soil volume's hull, and the villa is the
// merged villa.glb's own footprint. Model axes: +x east, +z south
// (daylight.js, northRotation 0), so map coordinates are just (x, z) with
// north up. Output: viewer/src/region-plan.json, bundled by vite.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
});

const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function eachWorldVertex(doc, visit) {
  const walk = (node, mat, chain) => {
    const local = node.getMatrix();
    const m = new Array(16).fill(0);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0; for (let k = 0; k < 4; k++) s += mat[k * 4 + r] * local[c * 4 + k];
      m[c * 4 + r] = s;
    }
    const name = chain || node.getName();
    const mesh = node.getMesh();
    if (mesh) {
      const mul = (v) => [
        m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
        m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
        m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]];
      visit(name, node.getName(), mesh, mul);
    }
    for (const c of node.listChildren()) walk(c, m, name);
  };
  for (const s of doc.getRoot().listScenes()) for (const c of s.listChildren()) walk(c, I, null);
}

// Andrew monotone chain, on [x, z] points.
function hull(points) {
  const pts = [...new Map(points.map((p) => [p[0].toFixed(1) + ',' + p[1].toFixed(1), p])).values()]
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  for (const p of [...pts].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)].map((p) => [+p[0].toFixed(1), +p[1].toFixed(1)]);
}

// ------------------------------------------------------------- context
const context = await io.read(FULL + '/context.glb');
const buildings = new Map();   // B<n> -> [x,z][]
const roadTris = [];
let plotPoints = [];
eachWorldVertex(context, (rootName, nodeName, mesh, mul) => {
  const clean = rootName.replace(/_/g, ' ');
  const family = /^B(\d+)\b/.exec(clean);
  const isRoad = /^CAD roads /.test(clean) || /^CAD roads /.test(nodeName.replace(/_/g, ' '));
  const isPlot = /^R32 \| Continuous local soil volume/.test(clean);
  if (!family && !isRoad && !isPlot) return;
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION'); if (!pos) continue;
    const el = [0, 0, 0];
    if (isRoad) {
      const idx = prim.getIndices();
      const count = idx ? idx.getCount() : pos.getCount();
      for (let i = 0; i < count; i += 3) {
        const t = [];
        for (let k = 0; k < 3; k++) { pos.getElement(idx ? idx.getScalar(i + k) : i + k, el); t.push([el && mul(el)[0], mul(el)[2]]); }
        roadTris.push(t.map((p) => [p[0], p[1]]));
      }
    } else {
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, el);
        const w = mul(el);
        if (family) {
          if (!buildings.has(family[1])) buildings.set(family[1], []);
          buildings.get(family[1]).push([w[0], w[2]]);
        } else plotPoints.push([w[0], w[2]]);
      }
    }
  }
});

// ------------------------------------------------------------- villa
const villaDoc = await io.read(FULL + '/villa.glb');
const villaPoints = [];
eachWorldVertex(villaDoc, (rootName, nodeName, mesh, mul) => {
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION'); if (!pos) continue;
    const el = [0, 0, 0];
    for (let i = 0; i < pos.getCount(); i += 7) {   // sparse sampling is plenty for a hull
      pos.getElement(i, el);
      const w = mul(el);
      if (w[1] < 6.2) villaPoints.push([w[0], w[2]]);
    }
  }
});
const villaHull = hull(villaPoints);
const center = villaHull.reduce((a, p) => [a[0] + p[0] / villaHull.length, a[1] + p[1] / villaHull.length], [0, 0])
  .map((v) => +v.toFixed(1));

// ------------------------------------------------------- road raster png
const PPM = 2;                 // 0.5 m per pixel
let rx0 = Infinity, rz0 = Infinity, rx1 = -Infinity, rz1 = -Infinity;
for (const t of roadTris) for (const [x, z] of t) {
  if (x < rx0) rx0 = x; if (x > rx1) rx1 = x;
  if (z < rz0) rz0 = z; if (z > rz1) rz1 = z;
}
rx0 = Math.floor(rx0) - 2; rz0 = Math.floor(rz0) - 2; rx1 = Math.ceil(rx1) + 2; rz1 = Math.ceil(rz1) + 2;
const W = Math.ceil((rx1 - rx0) * PPM) | 0, H = Math.ceil((rz1 - rz0) * PPM) | 0;
const mask = new Uint8Array(W * H);
for (const [a, b, c] of roadTris) {
  const xs = [a[0], b[0], c[0]].map((x) => (x - rx0) * PPM);
  const zs = [a[1], b[1], c[1]].map((z) => (z - rz0) * PPM);
  const minX = Math.max(0, Math.floor(Math.min(...xs))), maxX = Math.min(W - 1, Math.ceil(Math.max(...xs)));
  const minZ = Math.max(0, Math.floor(Math.min(...zs))), maxZ = Math.min(H - 1, Math.ceil(Math.max(...zs)));
  const d = (zs[1] - zs[2]) * (xs[0] - xs[2]) + (xs[2] - xs[1]) * (zs[0] - zs[2]);
  if (Math.abs(d) < 1e-9) continue;
  for (let py = minZ; py <= maxZ; py++) for (let px = minX; px <= maxX; px++) {
    const l1 = ((zs[1] - zs[2]) * (px + 0.5 - xs[2]) + (xs[2] - xs[1]) * (py + 0.5 - zs[2])) / d;
    const l2 = ((zs[2] - zs[0]) * (px + 0.5 - xs[2]) + (xs[0] - xs[2]) * (py + 0.5 - zs[2])) / d;
    if (l1 >= -0.001 && l2 >= -0.001 && 1 - l1 - l2 >= -0.001) mask[py * W + px] = 1;
  }
}
// asphalt tone baked in; everything else transparent
const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 4 + 1)] = 0;
  for (let x = 0; x < W; x++) {
    const o = y * (W * 4 + 1) + 1 + x * 4;
    if (mask[y * W + x]) { raw[o] = 0xb6; raw[o + 1] = 0xbf; raw[o + 2] = 0xba; raw[o + 3] = 255; }
  }
}
function crc32(buf) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

// ------------------------------------------------------------- output
const rel = (pts) => pts.map(([x, z]) => [+(x - center[0]).toFixed(1), +(z - center[1]).toFixed(1)]);
const plan = {
  generated_for: 'R44 region map',
  source: 'context.glb CAD roads + B-family massings + R32 plot; villa.glb footprint',
  north: 'model -z (daylight.js northRotation 0); map x=east, y=south',
  villa: rel(villaHull),
  plot: rel(hull(plotPoints)),
  buildings: [...buildings.values()].map((pts) => rel(hull(pts))).filter((h) => h.length >= 3),
  roads: {
    png: 'data:image/png;base64,' + png.toString('base64'),
    x: +(rx0 - center[0]).toFixed(1), y: +(rz0 - center[1]).toFixed(1),
    w: +(rx1 - rx0).toFixed(1), h: +(rz1 - rz0).toFixed(1),
  },
};
writeFileSync(ROOT + '/viewer/src/region-plan.json', JSON.stringify(plan));
console.log(`region-plan.json: ${plan.buildings.length} buildings, roads png ${W}x${H} (${(png.length / 1024).toFixed(0)} KB), villa center [${center}]`);
