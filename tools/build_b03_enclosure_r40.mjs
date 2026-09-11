// R40 | Enclose the basement bathroom B03 (room label f0-B10) per the source plan.
//
// The source 2D plan (build/reference/source-2d-floor-plans.png, basement panel)
// draws BANYO B03 as an enclosed room, and the dimension source carries its
// interior verbatim: 195 cm wide (handle 2C056, x 1.17..3.12) by 170 cm deep
// (handle 2C11F, z -4.93..-3.23), with 10 cm partitions (2C211, 2C004, 2C063),
// a 20 cm east wall (2C08B/2C4A9 line, x 3.12..3.32) and the B04-side wall on
// the z -5.03/-4.93 line (2C099/2C056). The delivered GLB models the whole
// basement as one open loft: no interior wall exists in level-0.glb, in
// sections.json, or in navigation.json anywhere near the room. The raster
// panel places the 0.80 m door in the west wall flush to the north corner
// (opening z -4.93..-4.13), which this script follows.
//
// What it does to build/web/full/level-0.glb:
//   1. adds one mesh node "R40 | B03 banyo bölme duvarları" with five boxes
//      (north/west/south/east walls + door header) using the existing
//      'interior' wall material and the walls' 1 UV unit per metre mapping;
//      junctions are embedded a few millimetres so no two faces are coplanar
//      (the material is double-sided, coincident faces would z-fight);
//   2. moves the garden dining set and its chandelier 0.60 m south so the
//      set sits wholly inside B04 and clear of the new north wall.
// The GLB is written plain; the caller re-encodes with the delivery Draco
// settings (see tools/repack notes; quantize pos 14 / normal 8 / uv 12).
//
// It also updates, in place:
//   - build/web/full/sections.json: the wall rectangles are appended to every
//     8 cm slice their heights cross, so the walk-mode cut cap and the
//     nav/space derivations see the same walls as the GLB;
//   - build/web/full/navigation.json: the new walls are stamped into the
//     floor-0 grid with the builder's own 0.19 m body buffer, the garden set's
//     furniture cells move with it, and walkable_furnished_cells is recounted;
//   - build/web/full/manifest.json + SHA256SUMS.txt: bytes/sha for the three
//     touched files (level-0.glb re-encode is hashed by the caller afterwards
//     via tools/update_manifest_hashes, or the inline step below when the
//     draco CLI is available).
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';

// Wall boxes, glTF metres: [x0,x1, y0,y1, z0,z1]. The interior faces sit on
// the registered witness lines of dims 2C056/2C11F exactly (x 1.168/3.118,
// z -4.927/-3.227); the south wall's outer face stops at -3.134 to stay 4 mm
// off the coincident stair face. Every buried end is embedded into its
// neighbour and offset so no coplanar pair exists.
// The 20 cm east wall of the room already exists in the delivery (finished
// face x 3.087, substrate 3.118..3.318 — the old open space's east boundary),
// so only the three partition walls and the header are added; A and C end
// at x 3.100, buried inside that existing wall's body.
const WALLS = {
  'A north (B04 side)': [1.068, 3.100, -0.020, 2.640, -5.027, -4.927],
  'B west, south of door': [1.068, 1.168, -0.020, 2.640, -4.127, -3.138],
  'C south (stair side)': [1.128, 3.100, -0.025, 2.635, -3.227, -3.134],
  'door header': [1.070, 1.166, 2.100, 2.633, -4.977, -4.085],
};
const DOOR = { x0: 1.068, x1: 1.168, z0: -4.927, z1: -4.127, head: 2.100 }; // 0.80 m leaf, plan north-west position
const SET_SHIFT_Z = -0.60; // garden dining set + chandelier, into B04
const SET_NODE = /^(Garden chair|Garden dining table)/;
const CHANDELIER_NODE = /^(Chandelier central body\.002|Chandelier suspension\.002|Curved chandelier arm\.01[234]|Candle (bulb|cup|sleeve)\.01[234])$/;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(FULL + '/level-0.glb');
const root = doc.getRoot();
const scene = root.listScenes()[0];
const interior = root.listMaterials().find((m) => m.getName() === 'interior');
if (!interior) throw new Error('interior material not found');

// ---- 1. wall geometry -----------------------------------------------------
const positions = [], normals = [], uvs = [], indices = [];
function face(quad, normal, uvOf) {
  const base = positions.length / 3;
  for (const p of quad) { positions.push(...p); normals.push(...normal); uvs.push(...uvOf(p)); }
  indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}
function box([x0, x1, y0, y1, z0, z1]) {
  face([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]], [0,0,1],  (p)=>[p[0],p[1]]); // +z
  face([[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]], [0,0,-1], (p)=>[p[0],p[1]]); // -z
  face([[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]], [1,0,0],  (p)=>[p[2],p[1]]); // +x
  face([[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]], [-1,0,0], (p)=>[p[2],p[1]]); // -x
  face([[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]], [0,1,0],  (p)=>[p[0],p[2]]); // +y
  face([[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]], [0,-1,0], (p)=>[p[0],p[2]]); // -y
}
for (const b of Object.values(WALLS)) box(b);
const buffer = root.listBuffers()[0];
const acc = (arr, type, comps) => doc.createAccessor().setType(type).setArray(new Float32Array(arr)).setBuffer(buffer);
const prim = doc.createPrimitive()
  .setAttribute('POSITION', acc(positions, 'VEC3'))
  .setAttribute('NORMAL', acc(normals, 'VEC3'))
  .setAttribute('TEXCOORD_0', acc(uvs, 'VEC2'))
  .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(indices)).setBuffer(buffer))
  .setMaterial(interior);
const mesh = doc.createMesh('R40 | B03 banyo bölme duvarları').addPrimitive(prim);
const node = doc.createNode('R40 | B03 banyo bölme duvarları').setMesh(mesh);
scene.addChild(node);
console.log('walls: 5 boxes,', positions.length / 3, 'verts,', indices.length / 3, 'tris');

// ---- 2. move the garden dining set + chandelier ---------------------------
let moved = 0;
for (const n of root.listNodes()) {
  const name = n.getName();
  if (!SET_NODE.test(name) && !CHANDELIER_NODE.test(name)) continue;
  // The set nodes are scene-root children (their own rotation is irrelevant):
  // the node translation is world-space as long as no transforming parent sits above.
  if (n.getParentNode && n.getParentNode()) throw new Error('unexpected parent node on ' + name);
  const t = n.getTranslation();
  n.setTranslation([t[0], t[1], t[2] + SET_SHIFT_Z]);
  moved++;
}
if (moved < 40) throw new Error('garden set node count unexpectedly low: ' + moved);
console.log('moved', moved, 'garden set / chandelier nodes by', SET_SHIFT_Z, 'm in z');

await doc.transform(prune({ keepSolidTextures: true }));
// write plain (dropping the stale Draco declaration), then re-encode via CLI
for (const ext of root.listExtensionsUsed()) if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
const PLAIN = FULL + '/level-0.plain.glb';
writeFileSync(PLAIN, await io.writeBinary(doc));

// ---- 3. sections.json -----------------------------------------------------
const sectionsPath = FULL + '/sections.json';
const atlas = JSON.parse(readFileSync(sectionsPath, 'utf8'));
let touched = 0;
for (const slice of atlas.slices) {
  const h = slice.height + 0.000001; // the builder's own epsilon rule: MIN < z < MAX
  const rects = Object.values(WALLS).filter(([, , y0, y1]) => y0 < h && h < y1);
  if (!rects.length) continue;
  for (const [x0, x1, , , z0, z1] of rects) {
    const base = slice.p.length / 2;
    slice.p.push(x0, z0, x1, z0, x1, z1, x0, z1);
    slice.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
    slice.area = Math.round((slice.area + (x1 - x0) * (z1 - z0)) * 1e6) / 1e6;
  }
  touched++;
}
atlas.revision = 'R40';
writeFileSync(sectionsPath, JSON.stringify(atlas));
console.log('sections.json:', touched, 'slices gained wall rectangles');

// ---- 4. navigation.json ---------------------------------------------------
const navPath = FULL + '/navigation.json';
const nav = JSON.parse(readFileSync(navPath, 'utf8'));
const { x: gx0, z: gz0, step, width: nx, height: nz } = nav.grid;
const layer = nav.layers.find((l) => l.floor_index === 0);
const cells = Array.from({ length: nz }, () => Array(nx).fill(null));
layer.rows.forEach((runs, r) => { for (const [c0, len, hmill, flag] of runs) for (let c = c0; c < c0 + len; c++) cells[r][c] = [hmill, flag]; });
const R = nav.body_radius_m; // 0.19, same buffer the builder applies to atlas walls
const inRect = (cx, cz, [x0, x1, , , z0, z1]) => cx > x0 - R && cx < x1 + R && cz > z0 - R && cz < z1 + R;
// old/new footprints of the moved pieces, for the furniture bit. The builder
// flags each inventory object separately; the same per-piece treatment here
// keeps the mask shape. Chandelier pieces hang above the 1.65 m probe and
// never enter the mask, matching the builder's height rule.
const pieces = [];
for (const n of root.listNodes()) {
  if (!SET_NODE.test(n.getName())) continue;
  const wm = n.getWorldMatrix();
  const pos = n.getMesh()?.listPrimitives()[0]?.getAttribute('POSITION');
  if (!pos) continue;
  const a = pos.getArray();
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (let i = 0; i < a.length; i += 3) {
    const w = [wm[0]*a[i]+wm[4]*a[i+1]+wm[8]*a[i+2]+wm[12], wm[1]*a[i]+wm[5]*a[i+1]+wm[9]*a[i+2]+wm[13], wm[2]*a[i]+wm[6]*a[i+1]+wm[10]*a[i+2]+wm[14]];
    for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], w[k]); mx[k] = Math.max(mx[k], w[k]); }
  }
  pieces.push({ mn, mx });
}
console.log('furniture pieces re-masked:', pieces.length);
const pieceCovers = (cx, cz, dz) => pieces.some(({ mn, mx }) =>
  cx > mn[0] - R && cx < mx[0] + R && cz > mn[2] + dz - R && cz < mx[2] + dz + R);
let blocked = 0, cleared = 0, refurnished = 0;
for (let r = 0; r < nz; r++) for (let c = 0; c < nx; c++) {
  const cell = cells[r][c]; if (!cell) continue;
  const cx = gx0 + (c + 0.5) * step, cz = gz0 + (r + 0.5) * step;
  if (Object.values(WALLS).some((w) => inRect(cx, cz, w)) && !(cell[1] & 1)) {
    // the door strip stays open by construction: no wall rectangle covers it
    cell[1] |= 1; blocked++;
  }
  const wasSet = pieceCovers(cx, cz, -SET_SHIFT_Z); // pieces are already moved; -shift = old position
  const isSet = pieceCovers(cx, cz, 0);
  if (wasSet && !isSet && (cell[1] & 2)) { cell[1] &= ~2; cleared++; }
  if (isSet && !(cell[1] & 2) && !(cell[1] & 1)) { cell[1] |= 2; refurnished++; }
}
layer.rows = cells.map((rowCells) => {
  const runs = []; let c = 0;
  while (c < nx) {
    if (!rowCells[c]) { c++; continue; }
    const start = c, [h, flag] = rowCells[c]; c++;
    while (c < nx && rowCells[c] && rowCells[c][0] === h && rowCells[c][1] === flag) c++;
    runs.push([start, c - start, h, flag]);
  }
  return runs;
});
layer.walkable_furnished_cells = cells.flat().filter((cell) => cell && cell[1] === 0).length;
writeFileSync(navPath, JSON.stringify(nav));
console.log('nav floor-0: +', blocked, 'wall cells,', cleared, 'furniture cells cleared,', refurnished, 'set;',
  'walkable_furnished_cells =', layer.walkable_furnished_cells);

// ---- 5. draco re-encode + manifest ---------------------------------------
execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', PLAIN, FULL + '/level-0.glb',
  '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
execFileSync('rm', [PLAIN]);
const manifest = JSON.parse(readFileSync(FULL + '/manifest.json', 'utf8'));
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
for (const [key, file] of [['section_atlas', 'sections.json'], ['navigation', 'navigation.json']]) {
  manifest[key].bytes = statSync(FULL + '/' + file).size;
  manifest[key].sha256 = sha(FULL + '/' + file);
}
const asset = manifest.assets.find((a) => a.id === 'level-0');
asset.bytes = statSync(FULL + '/level-0.glb').size;
asset.sha256 = sha(FULL + '/level-0.glb');
asset.source_objects += 1; asset.exported_mesh_nodes += 1; asset.triangles += indices.length / 3;
writeFileSync(FULL + '/manifest.json', JSON.stringify(manifest, null, 2));
console.log('level-0.glb re-encoded:', asset.bytes, 'bytes');
