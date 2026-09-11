// R40 | Open the doorway the drawing puts between Giriş (RÜZGARLIK Z01) and
// the Antre, and which the delivery walled up.
//
// Registering the plan raster against the model - the storey panels sit side
// by side in one model space, and the ground floor's transform is the one the
// verified dimensions already carry (x: 0.01*dwg_x - 11.4680, z: -(0.01*dwg_y
// + 73.3634)) - puts the drawing's north wall of RÜZGARLIK running from the
// west up to x = 1.30 and stopping there, with the door leaf hinged at x =
// 2.55 and swinging into the Antre. Between those two the drawing has no wall
// at all. The delivered mesh is solid across the whole span at every height
// from 3.15 m to 5.70 m, so the lobby has no way into the house.
//
// The opening is cut through both the wall and its lining, from the floor to
// the 2.10 m head every other interior door in the model uses (frames run
// y 3.10..5.20), and the three reveals - two jambs and the soffit - are
// rebuilt so the opening reads as an opening rather than as a hole with the
// wall's hollow behind it.
//
// The cut is a real subtraction, not a delete: each triangle is split against
// the six faces of the opening box and only the parts outside it are kept, so
// a wall face that runs past the opening keeps the part that runs past it.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const WALLS = /KAT 1\$DUVAR( KAPLAMA)?$/;
const OPENING = { x0: 1.300, x1: 2.550, y0: 3.0996, y1: 5.200 };   // floor to a 2.10 m head
const PROBE = { z0: 1.60, z1: 2.15 };                              // where to look for the wall body

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(FULL + '/level-1.glb');
const root = doc.getRoot();
const nodes = root.listNodes().filter((n) => WALLS.test(n.getName()) && n.getMesh());
if (nodes.length !== 2) throw new Error('expected the wall and its lining, got ' + nodes.length);

// ---- measure the wall's own faces across the opening --------------------
// The wall's faces are long quads whose corners sit well outside the opening,
// so the thickness is read the way a tape would read it: shoot a line across
// the wall at three points inside the opening and take where it enters and
// leaves.
let zMin = 1e9, zMax = -1e9;
for (const node of nodes) {
  const wm = node.getWorldMatrix();
  for (const prim of node.getMesh().listPrimitives()) {
    const pos = prim.getAttribute('POSITION'); if (!pos) continue;
    const idx = prim.getIndices(); const a = pos.getArray();
    const I = idx ? idx.getArray() : null, count = I ? I.length : pos.getCount();
    const at = (i) => [wm[0]*a[i*3]+wm[4]*a[i*3+1]+wm[8]*a[i*3+2]+wm[12],
                       wm[1]*a[i*3]+wm[5]*a[i*3+1]+wm[9]*a[i*3+2]+wm[13],
                       wm[2]*a[i*3]+wm[6]*a[i*3+1]+wm[10]*a[i*3+2]+wm[14]];
    for (let t = 0; t + 2 < count; t += 3) {
      const v = [at(I ? I[t] : t), at(I ? I[t+1] : t+1), at(I ? I[t+2] : t+2)];
      for (const [px, py] of [[1.45, 3.6], [1.925, 4.1], [2.40, 4.9]]) {
        // barycentric of (px,py) in the triangle's xy projection
        const [p0, p1, p2] = v;
        const det = (p1[0]-p0[0])*(p2[1]-p0[1]) - (p2[0]-p0[0])*(p1[1]-p0[1]);
        if (Math.abs(det) < 1e-12) continue;
        const b = ((px-p0[0])*(p2[1]-p0[1]) - (p2[0]-p0[0])*(py-p0[1])) / det;
        const c = ((p1[0]-p0[0])*(py-p0[1]) - (px-p0[0])*(p1[1]-p0[1])) / det;
        if (b < -1e-6 || c < -1e-6 || b + c > 1 + 1e-6) continue;
        const z = p0[2] + b*(p1[2]-p0[2]) + c*(p2[2]-p0[2]);
        if (z < PROBE.z0 || z > PROBE.z1) continue;
        zMin = Math.min(zMin, z); zMax = Math.max(zMax, z);
      }
    }
  }
}
if (!(zMax > zMin)) throw new Error('no wall found across the opening');
console.log('wall body across the opening: z', zMin.toFixed(4), '..', zMax.toFixed(4),
  `(${(zMax - zMin).toFixed(3)} m thick)`);
const BOX = { ...OPENING, z0: zMin - 0.02, z1: zMax + 0.02 };

// ---- subtract the box from every wall triangle ---------------------------
const KEY = ['x', 'y', 'z'];
function clipPolygon(poly, axis, sign, value) {
  // returns [outside (sign*(v-value) >= 0), inside]
  const d = poly.map((v) => sign * (v.p[axis] - value));
  const outside = [], inside = [];
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length, a = poly[i], b = poly[j], da = d[i], db = d[j];
    if (da >= 0) outside.push(a); if (da <= 0) inside.push(a);
    if ((da > 0 && db < 0) || (da < 0 && db > 0)) {
      const t = da / (da - db);
      const mid = {
        p: a.p.map((v, k) => v + t * (b.p[k] - v)),
        n: a.n.map((v, k) => v + t * (b.n[k] - v)),
        u: a.u.map((v, k) => v + t * (b.u[k] - v)),
      };
      outside.push(mid); inside.push(mid);
    }
  }
  return [outside, inside];
}
function subtract(tri) {
  const planes = [[0, -1, BOX.x0], [0, 1, BOX.x1], [1, -1, BOX.y0], [1, 1, BOX.y1],
                  [2, -1, BOX.z0], [2, 1, BOX.z1]];
  let remaining = [tri]; const kept = [];
  for (const [axis, sign, value] of planes) {
    const next = [];
    for (const poly of remaining) {
      const [outside, inside] = clipPolygon(poly, axis, sign, value);
      if (outside.length >= 3) kept.push(outside);
      if (inside.length >= 3) next.push(inside);
    }
    remaining = next;
    if (!remaining.length) break;
  }
  return kept;
}
let before = 0, after = 0, removed = 0;
for (const node of nodes) {
  const wm = node.getWorldMatrix();
  // the wall nodes sit at the scene root with an identity transform; anything
  // else would make world-space box arithmetic wrong
  const identity = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
  if (Array.from(wm).some((v, i) => Math.abs(v - identity[i]) > 1e-9))
    throw new Error('wall node is not at the scene root identity: ' + node.getName());
  for (const prim of node.getMesh().listPrimitives()) {
    const pos = prim.getAttribute('POSITION'), nor = prim.getAttribute('NORMAL');
    const uv = prim.getAttribute('TEXCOORD_0'), idx = prim.getIndices();
    const P = pos.getArray(), N = nor?.getArray(), U = uv?.getArray();
    const I = idx ? idx.getArray() : null;
    const count = I ? I.length : pos.getCount();
    const out = [];
    for (let t = 0; t + 2 < count; t += 3) {
      const ids = [I ? I[t] : t, I ? I[t+1] : t+1, I ? I[t+2] : t+2];
      const poly = ids.map((i) => ({
        p: [P[i*3], P[i*3+1], P[i*3+2]],
        n: N ? [N[i*3], N[i*3+1], N[i*3+2]] : [0, 1, 0],
        u: U ? [U[i*2], U[i*2+1]] : [0, 0],
      }));
      before++;
      const lo = poly.reduce((m, v) => m.map((q, k) => Math.min(q, v.p[k])), [1e9,1e9,1e9]);
      const hi = poly.reduce((m, v) => m.map((q, k) => Math.max(q, v.p[k])), [-1e9,-1e9,-1e9]);
      const touches = KEY.every((_, k) => hi[k] > [BOX.x0,BOX.y0,BOX.z0][k] && lo[k] < [BOX.x1,BOX.y1,BOX.z1][k]);
      if (!touches) { out.push(poly); after++; continue; }
      const pieces = subtract(poly);
      removed++;
      for (const piece of pieces) for (let k = 1; k + 1 < piece.length; k++) {
        out.push([piece[0], piece[k], piece[k+1]]); after++;
      }
    }
    writePrimitive(prim, out);
  }
}
function writePrimitive(prim, tris) {
  const buffer = root.listBuffers()[0];
  const position = new Float32Array(tris.length * 9), normal = new Float32Array(tris.length * 9);
  const texcoord = new Float32Array(tris.length * 6);
  tris.forEach((tri, t) => tri.forEach((v, k) => {
    position.set(v.p, t*9 + k*3); normal.set(v.n, t*9 + k*3); texcoord.set(v.u, t*6 + k*2);
  }));
  prim.setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(position).setBuffer(buffer));
  prim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(normal).setBuffer(buffer));
  if (prim.getAttribute('TEXCOORD_0'))
    prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(texcoord).setBuffer(buffer));
  prim.setIndices(null);
}
console.log('wall triangles', before, '->', after, `(${removed} met the opening and were re-cut)`);

// ---- rebuild the reveals -------------------------------------------------
const reveals = [];
const quad = (corners, normal) => {
  const uvOf = (p) => normal[1] ? [p[0], p[2]] : normal[0] ? [p[2], p[1]] : [p[0], p[1]];
  const v = corners.map((p) => ({ p, n: normal, u: uvOf(p) }));
  reveals.push([v[0], v[1], v[2]], [v[0], v[2], v[3]]);
};
const { x0, x1, y0, y1 } = OPENING;
// west jamb, facing east into the opening
quad([[x0, y0, zMin], [x0, y0, zMax], [x0, y1, zMax], [x0, y1, zMin]], [1, 0, 0]);
// east jamb, facing west
quad([[x1, y0, zMax], [x1, y0, zMin], [x1, y1, zMin], [x1, y1, zMax]], [-1, 0, 0]);
// soffit, facing down
quad([[x0, y1, zMin], [x0, y1, zMax], [x1, y1, zMax], [x1, y1, zMin]], [0, -1, 0]);
const wall = nodes.find((n) => /DUVAR$/.test(n.getName()));
const interior = wall.getMesh().listPrimitives().find((p) => p.getMaterial()?.getName() === 'interior');
if (!interior) throw new Error('interior primitive not found on the wall');
const existing = [];
{
  const pos = interior.getAttribute('POSITION'), nor = interior.getAttribute('NORMAL');
  const uv = interior.getAttribute('TEXCOORD_0');
  const P = pos.getArray(), N = nor.getArray(), U = uv?.getArray();
  for (let i = 0; i + 2 < pos.getCount(); i += 3)
    existing.push([0, 1, 2].map((k) => ({
      p: [P[(i+k)*3], P[(i+k)*3+1], P[(i+k)*3+2]],
      n: [N[(i+k)*3], N[(i+k)*3+1], N[(i+k)*3+2]],
      u: U ? [U[(i+k)*2], U[(i+k)*2+1]] : [0, 0],
    })));
}
writePrimitive(interior, existing.concat(reveals));
console.log('reveals added: 2 jambs + soffit,', reveals.length, 'triangles, spanning z',
  zMin.toFixed(3), '..', zMax.toFixed(3));

for (const ext of root.listExtensionsUsed())
  if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
const plain = FULL + '/level-1.plain.glb';
writeFileSync(plain, await io.writeBinary(doc));
execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, FULL + '/level-1.glb',
  '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
execFileSync('rm', [plain]);
const manifest = JSON.parse(readFileSync(FULL + '/manifest.json', 'utf8'));
const asset = manifest.assets.find((a) => a.id === 'level-1');
asset.bytes = statSync(FULL + '/level-1.glb').size;
asset.sha256 = createHash('sha256').update(readFileSync(FULL + '/level-1.glb')).digest('hex');
writeFileSync(FULL + '/manifest.json', JSON.stringify(manifest, null, 2));
writeFileSync(ROOT + '/build/entrance-doorway-r40.json', JSON.stringify({
  revision: 'R40', room_pair: ['f1-Z01', 'f1-Z02'],
  source: 'build/reference/source-2d-floor-plans.png, ground floor panel, registered by the verified R39 ground-floor transform',
  opening_m: { x: [OPENING.x0, OPENING.x1], y: [OPENING.y0, OPENING.y1], z: [zMin, zMax] },
  head_height_above_floor_m: +(OPENING.y1 - OPENING.y0).toFixed(3),
  triangles: { before, after, recut: removed }, reveals: 'two jambs and a soffit, interior finish',
}, null, 1));
console.log('level-1.glb re-encoded:', asset.bytes, 'bytes');
