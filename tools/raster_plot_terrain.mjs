// Give the walking surface the rest of the garden.
//
// The R44 outdoor pass laid ground over what the visitor was expected to use -
// the pool surround, the paths, the drive, the strips beside the house - and
// left the planted borders along the west, east and rear boundaries with no
// walking surface at all: about 413 m² of the plot that a visitor walked up to
// and stopped at. The owner's answer to that was short: the whole garden should
// be walkable, and the side steps should connect.
//
// So the plot's own grass is rasterised straight out of the delivery the
// viewer draws. plot-grass.gpu.gltf is one mesh, one material, and it IS the
// lawn: not a wall, not the pool, not a roof. Rasterising that and nothing else
// is what keeps this honest - no cell can land on top of the boundary wall or
// on the water, because neither is in the mesh being read.
//
// Three rules bound what it may add:
//   * only where the surface knows nothing. A cell that already carries a
//     height on any storey keeps it. The interior, the terraces, the drive and
//     the stair shaft are all untouched by definition.
//   * only inside the plot, tested against the delivery's own registered
//     boundary polygon, so the neighbours' land stays theirs.
//   * only where the ground is not a cliff. A triangle steeper than 40° is a
//     bank to look at, not to walk up; and the surface's own 24 cm step rule
//     then decides at walk time whether two neighbouring cells connect, which
//     is what stops a visitor strolling up a retaining wall one cell at a time.
//
// The height taken per cell is the highest the lawn reaches there, and the
// storey it is filed under is the one whose datum it stands on.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DELIVERY = path.join(ROOT, 'build/web/native-current');
const NAV = path.join(DELIVERY, 'native-navigation.json');
const REPORT = path.join(ROOT, 'build/plot-terrain-native.json');
const SOURCE = 'plot-grass.gpu.gltf';
const MAX_SLOPE_DEG = 40;
const DATUMS = [0, 3.0996, 6.3714, 9.4705];
const UNSUPPORTED = -32768;

// The pure-JS Draco decoder, in a browser-shaped sandbox: shown a process
// object it takes the CommonJS path and trips over its own require().
async function draco() {
  const source = fs.readFileSync(path.join(ROOT, 'viewer/node_modules/three/examples/jsm/libs/draco/draco_decoder.js'), 'utf8');
  const sandbox = {console, TextDecoder, TextEncoder, URL, performance, setTimeout, clearTimeout,
    document: {currentScript: {src: ''}}, location: {href: ''}, navigator: {userAgent: 'node'},
    Uint8Array, Int8Array, Int32Array, Uint32Array, Float32Array, Float64Array, Uint16Array, Int16Array,
    ArrayBuffer, DataView, Math, Date, JSON, Object, Array, Error, String, Number, Boolean, Function,
    Promise, RegExp, Map, Set, WebAssembly};
  sandbox.window = sandbox; sandbox.self = sandbox; sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.DracoDecoderModule();
}

// glTF node transform, TRS or matrix, as a flat 4x4 in column-major order.
function nodeMatrix(node) {
  if (node.matrix) return node.matrix;
  const [tx, ty, tz] = node.translation ?? [0, 0, 0];
  const [qx, qy, qz, qw] = node.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale ?? [1, 1, 1];
  const x2 = qx + qx, y2 = qy + qy, z2 = qz + qz;
  const xx = qx * x2, xy = qx * y2, xz = qx * z2;
  const yy = qy * y2, yz = qy * z2, zz = qz * z2;
  const wx = qw * x2, wy = qw * y2, wz = qw * z2;
  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
}
const apply = (m, x, y, z) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
];

async function triangles() {
  const decoder = await draco();
  const gltf = JSON.parse(fs.readFileSync(path.join(DELIVERY, SOURCE), 'utf8'));
  const buffer = fs.readFileSync(path.join(DELIVERY, gltf.buffers[0].uri));
  const out = [];
  for (const node of gltf.nodes ?? []) {
    if (node.mesh === undefined) continue;
    const matrix = nodeMatrix(node);
    for (const primitive of gltf.meshes[node.mesh].primitives) {
      const compressed = primitive.extensions?.KHR_draco_mesh_compression;
      if (!compressed) throw Error('Only the Draco path is implemented; this primitive is not compressed');
      const view = gltf.bufferViews[compressed.bufferView];
      const start = view.byteOffset ?? 0;
      const bytes = buffer.subarray(start, start + view.byteLength);
      const input = new decoder.DecoderBuffer();
      input.Init(new Int8Array(bytes), bytes.length);
      const reader = new decoder.Decoder();
      const mesh = new decoder.Mesh();
      const status = reader.DecodeBufferToMesh(input, mesh);
      if (!status.ok()) throw Error('Draco: ' + status.error_msg());
      const attribute = reader.GetAttributeByUniqueId(mesh, compressed.attributes.POSITION);
      const positions = new decoder.DracoFloat32Array();
      reader.GetAttributeFloatForAllPoints(mesh, attribute, positions);
      const face = new decoder.DracoInt32Array();
      for (let f = 0; f < mesh.num_faces(); f++) {
        reader.GetFaceFromMesh(mesh, f, face);
        const corners = [0, 1, 2].map(i => {
          const p = face.GetValue(i) * 3;
          return apply(matrix, positions.GetValue(p), positions.GetValue(p + 1), positions.GetValue(p + 2));
        });
        out.push(corners);
      }
      decoder.destroy(face); decoder.destroy(positions); decoder.destroy(mesh);
      decoder.destroy(reader); decoder.destroy(input);
    }
  }
  return out;
}

const inside = (polygon, x, y) => {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};

const nav = JSON.parse(fs.readFileSync(NAV, 'utf8'));
const grid = nav.grid, count = grid.width * grid.height;
// The plot as the delivery registered it, in (x, -z).
const boundary = JSON.parse(fs.readFileSync(path.join(DELIVERY, 'plot-boundary.json'), 'utf8')).polygon_native_xy;

// What the surface already knows: any storey with a height at this cell.
const known = new Uint8Array(count);
const layers = nav.layers.map(layer => {
  const heights = new Int16Array(count).fill(UNSUPPORTED), masks = new Uint8Array(count).fill(1);
  for (const [row, runs] of layer.rows.entries()) {
    for (const [start, length, height, mask] of runs) {
      for (let col = start; col < start + length; col++) {
        const index = row * grid.width + col;
        heights[index] = height; masks[index] = mask; known[index] = 1;
      }
    }
  }
  return {heights, masks};
});

const faces = await triangles();
const top = new Float32Array(count).fill(-Infinity);
const steepLimit = Math.cos(MAX_SLOPE_DEG * Math.PI / 180);
let steep = 0;
for (const [a, b, c] of faces) {
  // Upward component of the face normal: a lawn laid over a cliff is scenery.
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const length = Math.hypot(nx, ny, nz);
  if (!length) continue;
  if (Math.abs(ny) / length < steepLimit) {steep++; continue;}
  const minX = Math.min(a[0], b[0], c[0]), maxX = Math.max(a[0], b[0], c[0]);
  const minZ = Math.min(a[2], b[2], c[2]), maxZ = Math.max(a[2], b[2], c[2]);
  const c0 = Math.max(0, Math.floor((minX - grid.x) / grid.step));
  const c1 = Math.min(grid.width - 1, Math.ceil((maxX - grid.x) / grid.step));
  const r0 = Math.max(0, Math.floor((minZ - grid.z) / grid.step));
  const r1 = Math.min(grid.height - 1, Math.ceil((maxZ - grid.z) / grid.step));
  const det = ux * vz - uz * vx;
  if (Math.abs(det) < 1e-12) continue;
  for (let row = r0; row <= r1; row++) {
    for (let col = c0; col <= c1; col++) {
      const x = grid.x + (col + 0.5) * grid.step, z = grid.z + (row + 0.5) * grid.step;
      const qx = x - a[0], qz = z - a[2];
      const s = (qx * vz - qz * vx) / det, t = (ux * qz - uz * qx) / det;
      if (s < -1e-6 || t < -1e-6 || s + t > 1 + 1e-6) continue;
      const y = a[1] + s * uy + t * vy;
      const index = row * grid.width + col;
      if (y > top[index]) top[index] = y;
    }
  }
}

const added = [0, 0, 0, 0];
let outsidePlot = 0, alreadyKnown = 0;
for (let row = 0; row < grid.height; row++) {
  for (let col = 0; col < grid.width; col++) {
    const index = row * grid.width + col;
    if (top[index] === -Infinity) continue;
    if (known[index]) {alreadyKnown++; continue;}
    const x = grid.x + (col + 0.5) * grid.step, z = grid.z + (row + 0.5) * grid.step;
    if (!inside(boundary, x, -z)) {outsidePlot++; continue;}
    const height = top[index];
    // Filed under the storey whose datum this piece of ground stands on.
    let floor = 0;
    for (let f = 0; f < DATUMS.length; f++) if (height >= DATUMS[f] - 0.6) floor = f;
    layers[floor].heights[index] = Math.round(height * 1000);
    layers[floor].masks[index] = 0;
    added[floor]++;
  }
}

function encode(layer) {
  const rows = [];
  for (let row = 0; row < grid.height; row++) {
    const runs = [];
    let run = null;
    for (let col = 0; col < grid.width; col++) {
      const index = row * grid.width + col;
      if (layer.heights[index] === UNSUPPORTED && layer.masks[index] === 1) {run = null; continue;}
      const height = layer.heights[index], mask = layer.masks[index];
      if (run && run[2] === height && run[3] === mask && run[0] + run[1] === col) run[1]++;
      else {run = [col, 1, height, mask]; runs.push(run);}
    }
    rows.push(runs);
  }
  return rows;
}

for (const [floor, layer] of nav.layers.entries()) {
  layer.rows = encode(layers[floor]);
  layer.supported_cells = [...layers[floor].heights].filter(h => h !== UNSUPPORTED).length;
  layer.walkable_furnished_cells = layers[floor].heights.reduce((total, height, index) =>
    total + (height !== UNSUPPORTED && !(layers[floor].masks[index] & 3) ? 1 : 0), 0);
}
nav.plot_terrain = {from: SOURCE, max_slope_deg: MAX_SLOPE_DEG, added_cells: added,
  rule: 'the plot\'s own grass, only where no storey already carries a height and only inside the registered boundary'};
fs.writeFileSync(NAV, JSON.stringify(nav));
const report = {source: SOURCE, faces: faces.length, refused_steeper_than_deg: MAX_SLOPE_DEG,
  steep_faces: steep, added_cells: added, cells_already_known: alreadyKnown, cells_outside_plot: outsidePlot,
  walkable_furnished_cells: nav.layers.map(l => l.walkable_furnished_cells)};
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
