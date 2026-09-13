// R44 | The front garden reads the way the kat_2_on_giris photos read.
//
// Four faults, marked on the user's screenshot of the forecourt:
//
//  1  "bu hatta mazı hattı yok?" - the thuja row along the east retaining
//     wall stops at z 2.3 while the wall runs on to z -5.5. Seven more
//     screens continue the row down the wall, each on its own terrace
//     height, reusing the three authored screen meshes.
//  2  "bu iki alan arası bağlantı sağla havada uçmasın" - between the
//     garage driveway's east edge and the east stair's head deck lies a
//     30 cm slot of bare lawn. A stone band pinned to the drive surface on
//     one side and the 3.099 deck on the other closes it; the authored
//     5 cm skirting curb stays as its border.
//  3  "burada böyle yokuşumsu kot farklı olmasın" - between the entry
//     path and the diagonal driveway the lawn wedge sits half a metre
//     below both, so their flanks read as ramps. The wedge is paved as a
//     ruled surface pinned to the path/porch-approach east edge and to the
//     driveway's west edge - seamless with both, no scarp left.
//  4  "kırmızı ile çizilen alan sert zemin. zemin girişte de burası bağlı"
//     - the strip between the street hedge row and the house front is a
//     walkway at entry level in the photos (kat_2_on_giris: coursed slabs
//     against the facade). A flat limestone terrace at 3.08 - two
//     centimetres under the porch approach's 3.10 - fills the strip from
//     the facade line (measured off villa.glb per column) to the hedge
//     row, butted against the entry path.
//
// The grass-blade mesh loses its blades under every new slab. The tool is
// idempotent by archive: the pre-fix garden.glb is kept at
// build/garden-pre-frontfix-r44.glb and re-runs start from it, so regions
// can be re-tuned. The archive is not committed - it is byte-identical to
// `git show 94fc012:build/web/full/garden.glb` and can be restored from
// there. (Any later tool that edits garden.glb must re-archive.)
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, copyFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const FILE = FULL + '/garden.glb';
const ARCHIVE = ROOT + '/build/garden-pre-frontfix-r44.glb';
const STONE_CREAM = 'R31 | R37 garden cream limestone';
const STONE_COURSED = 'R31 | R37 entry coursed limestone';

// Measured off the authored slabs (their exact top-face corners):
const driveWestX = (z) => 3.09 + (10.058 - z) * ((4.418 - 3.09) / (10.058 - 1.43));
const driveWestY = (z) => 3.888 - (10.058 - z) * ((3.888 - 3.10) / (10.058 - 1.43));
const driveEastX = (z) => 6.97 + (10.058 - z) * ((7.218 - 6.97) / (10.058 - 1.43));
const driveEastY = (z) => 4.151 - (10.058 - z) * ((4.151 - 3.10) / (10.058 - 1.43));
const walkEastY = (z) => (z <= 5.14 ? 3.10 : 3.10 + (z - 5.14) * ((3.829 - 3.10) / (10.058 - 5.14)));
const DECK = 3.099;            // both side-stair head decks, measured
const TERRACE = 3.08;          // facade walk: 2 cm under the 3.10 entry level

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
if (!existsSync(ARCHIVE)) copyFileSync(FILE, ARCHIVE);
const doc = await io.read(ARCHIVE);
const root = doc.getRoot();
const scene = root.listScenes()[0];

// ---------------------------------------------------------------- ground
// The plot soil lives in context.glb; the hedge terraces come off it.
const soilTris = [];
{
  const context = await io.read(FULL + '/context.glb');
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const walk = (node, mat, inSoil) => {
    const local = node.getMatrix();
    const m = new Array(16).fill(0);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0; for (let k = 0; k < 4; k++) s += mat[k * 4 + r] * local[c * 4 + k];
      m[c * 4 + r] = s;
    }
    const soil = inSoil || /^R32 \| Continuous local soil volume\b/.test(node.getName().replace(/_/g, ' '));
    const mesh = node.getMesh();
    if (mesh && soil) {
      const mul = (v) => [
        m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
        m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
        m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]];
      for (const prim of mesh.listPrimitives()) {
        const pos = prim.getAttribute('POSITION'); if (!pos) continue;
        const idx = prim.getIndices();
        const count = idx ? idx.getCount() : pos.getCount();
        const el = [0, 0, 0];
        for (let i = 0; i < count; i += 3) {
          const t = [];
          for (let k = 0; k < 3; k++) { pos.getElement(idx ? idx.getScalar(i + k) : i + k, el); t.push(mul(el)); }
          soilTris.push(t);
        }
      }
    }
    for (const c of node.listChildren()) walk(c, m, soil);
  };
  for (const s of context.getRoot().listScenes()) for (const c of s.listChildren()) walk(c, I, false);
}
function groundAt(x, z) {
  let best = -Infinity;
  for (const [a, b, c] of soilTris) {
    const d1 = (b[0] - a[0]) * (z - a[2]) - (b[2] - a[2]) * (x - a[0]);
    const d2 = (c[0] - b[0]) * (z - b[2]) - (c[2] - b[2]) * (x - b[0]);
    const d3 = (a[0] - c[0]) * (z - c[2]) - (a[2] - c[2]) * (x - c[0]);
    if (((d1 < 0) || (d2 < 0) || (d3 < 0)) && ((d1 > 0) || (d2 > 0) || (d3 > 0))) continue;
    const det = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]);
    if (Math.abs(det) < 1e-12) continue;
    const l1 = ((b[2] - c[2]) * (x - c[0]) + (c[0] - b[0]) * (z - c[2])) / det;
    const l2 = ((c[2] - a[2]) * (x - c[0]) + (a[0] - c[0]) * (z - c[2])) / det;
    const y = l1 * a[1] + l2 * b[1] + (1 - l1 - l2) * c[1];
    if (y > best) best = y;
  }
  return best;
}

// -------------------------------------------------- villa facade line
// For the facade terrace: per x column, how far the street-side face of
// the house reaches (max z of any villa point in the door/window band).
const faceZ = new Map();
const FACE_STEP = 0.15;
{
  const villa = await io.read(FULL + '/villa.glb');
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const walk = (node, mat) => {
    const local = node.getMatrix();
    const m = new Array(16).fill(0);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0; for (let k = 0; k < 4; k++) s += mat[k * 4 + r] * local[c * 4 + k];
      m[c * 4 + r] = s;
    }
    const mesh = node.getMesh();
    if (mesh) {
      const mul = (v) => [
        m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
        m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
        m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]];
      for (const prim of mesh.listPrimitives()) {
        const pos = prim.getAttribute('POSITION'); if (!pos) continue;
        const el = [0, 0, 0];
        for (let i = 0; i < pos.getCount(); i++) {
          pos.getElement(i, el);
          const w = mul(el);
          if (w[1] < 3.0 || w[1] > 5.4 || w[2] < 2.5 || w[2] > 8.0 || w[0] < -8.2 || w[0] > 0.6) continue;
          const xi = Math.round(w[0] / FACE_STEP);
          if (!faceZ.has(xi) || w[2] > faceZ.get(xi)) faceZ.set(xi, w[2]);
        }
      }
    }
    for (const c of node.listChildren()) walk(c, m);
  };
  for (const s of villa.getRoot().listScenes()) for (const c of s.listChildren()) walk(c, I);
}
// South bound of the facade terrace at x: the villa face where there is
// one, the west stair-head line (3.18) past the kitchen bay's west corner.
function terraceSouthZ(x) {
  const xi = Math.round(x / FACE_STEP);
  let face = -Infinity;
  for (let d = 0; d <= 3; d++) {                     // window mullion gaps: borrow neighbours
    for (const j of d === 0 ? [xi] : [xi - d, xi + d]) if (faceZ.has(j)) face = Math.max(face, faceZ.get(j));
    if (face > -Infinity) break;
  }
  if (face === -Infinity) return 3.18;               // west of the kitchen bay
  return Math.min(5.60, Math.max(2.95, x < -5.8 ? Math.max(face, 3.18) : face)) - 0.02;
}

// ------------------------------------------------------------- idempotent
for (const node of [...root.listNodes()]) {
  if (/^Garden east \| R44 thuja hedge continuation |^Front garden \| R44 /.test(node.getName())) {
    const mesh = node.getMesh(); node.dispose();
    if (mesh && mesh.listParents().every((p) => p.propertyType !== 'Node')) mesh.dispose();
  }
}

const material = (name) => {
  const m = root.listMaterials().find((mm) => mm.getName() === name);
  if (m) return m;
  if (name !== 'R44 | planter lawn') throw new Error(`garden.glb carries no ${name}`);
  // same lawn plane the round-1 kitchen-bay planter wears
  return doc.createMaterial(name).setBaseColorFactor([0.178, 0.25, 0.067, 1])
    .setRoughnessFactor(0.95).setMetallicFactor(0);
};

// --------------------------------------------------------- mesh building
const buffer = root.listBuffers()[0] ?? doc.createBuffer();
function builder(nodeName, matName, extras) {
  const position = [], normal = [], uv = [], index = [];
  const quad = (a, b, c, d) => {
    // normal off the first triangle; quads here are near-planar
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(...n) || 1; n = n.map((s) => s / l);
    const base = position.length / 3;
    for (const p of [a, b, c, d]) { position.push(...p); normal.push(...n); uv.push(p[0] + p[1], p[2] + p[1]); }
    index.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const commit = () => {
    if (!index.length) return 0;
    const mesh = doc.createMesh(nodeName);
    const accessor = (array, type) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
    mesh.addPrimitive(doc.createPrimitive()
      .setAttribute('POSITION', accessor(new Float32Array(position), 'VEC3'))
      .setAttribute('NORMAL', accessor(new Float32Array(normal), 'VEC3'))
      .setAttribute('TEXCOORD_0', accessor(new Float32Array(uv), 'VEC2'))
      .setIndices(accessor(new Uint32Array(index), 'SCALAR'))
      .setMaterial(material(matName)));
    scene.addChild(doc.createNode(nodeName).setMesh(mesh).setExtras({ category: 'fixed', ...extras }));
    return index.length / 3;
  };
  return { quad, commit };
}

const report = { generated_for: 'R44 front garden', marks: {} };

// ---- 3 | forecourt wedge: ruled between walk edge and drive west edge.
// Its street end is not paving: photo 6 of kat_2_on_giris shows a planted
// bed with the small court tree there, level with the walks around it. So
// the ruled surface carries a 12 cm stone border and, inside it, a lawn
// bed 6 cm down; the tree (trunk at 2.44, 7.58) rises from the bed.
{
  const surf = (x, z, westX) => {
    const t = (x - westX) / (driveWestX(z) - westX);
    return walkEastY(z) + (driveWestY(z) - walkEastY(z)) * t;
  };
  const { quad, commit } = builder('Front garden | R44 forecourt wedge paving', STONE_COURSED,
    { note: 'mark 3: the sunken lawn wedge between entry path and driveway, paved flush with both edges; tree bed inset at the street end' });
  const patch = (z0, z1, westX, rows, cols) => {
    for (let r = 0; r < rows; r++) {
      const za = z0 + (z1 - z0) * (r / rows), zb = z0 + (z1 - z0) * ((r + 1) / rows);
      for (let c = 0; c < cols; c++) {
        const p = (z, t) => {
          const x = westX + (driveWestX(z) - westX) * t;
          return [x, walkEastY(z) + (driveWestY(z) - walkEastY(z)) * t, z];
        };
        quad(p(za, c / cols), p(za, (c + 1) / cols), p(zb, (c + 1) / cols), p(zb, c / cols));
      }
    }
    // end skirts
    for (const [z, lo] of [[z0, z0 < 5 ? 2.7 : null], [z1, z1 > 9.5 ? 3.0 : null]]) {
      if (lo === null) continue;
      const a = [westX, walkEastY(z), z], b = [driveWestX(z), driveWestY(z), z];
      quad(a, b, [b[0], lo, z], [a[0], lo, z]);
    }
  };
  const BED = { z0: 7.00, z1: 9.79, inset: 0.12, drop: 0.06, westX: 1.8 };
  patch(4.163, 6.05, 2.99, 6, 3);      // beside the porch turning approach
  patch(6.05, BED.z0, 1.8, 3, 4);      // stone apron south of the bed
  patch(BED.z1, 9.91, 1.8, 1, 4);      // stone course against the plinth
  const bedRows = 10;
  for (let r = 0; r < bedRows; r++) {
    const za = BED.z0 + (BED.z1 - BED.z0) * (r / bedRows), zb = BED.z0 + (BED.z1 - BED.z0) * ((r + 1) / bedRows);
    const strip = (xa, xb, z) => [[xa(z), surf(xa(z), z, BED.westX), z], [xb(z), surf(xb(z), z, BED.westX), z]];
    // west and east stone strips at the paving surface
    const wIn = () => BED.westX + BED.inset, eOut = (z) => driveWestX(z), eIn = (z) => driveWestX(z) - BED.inset;
    let [a, b] = strip(() => BED.westX, wIn, za); let [d, c] = strip(() => BED.westX, wIn, zb);
    quad(a, b, c, d);
    [a, b] = strip(eIn, eOut, za); [d, c] = strip(eIn, eOut, zb);
    quad(a, b, c, d);
    // rim faces down to the bed, then the lawn floor
    const drop = (p) => [p[0], p[1] - BED.drop, p[2]];
    const wA = [wIn(), surf(wIn(), za, BED.westX), za], wB = [wIn(), surf(wIn(), zb, BED.westX), zb];
    quad(wA, wB, drop(wB), drop(wA));
    const eA = [eIn(za), surf(eIn(za), za, BED.westX), za], eB = [eIn(zb), surf(eIn(zb), zb, BED.westX), zb];
    quad(eB, eA, drop(eA), drop(eB));
  }
  for (const z of [BED.z0, BED.z1]) {                     // north and south rim faces
    const a = [BED.westX + BED.inset, surf(BED.westX + BED.inset, z, BED.westX), z];
    const b = [driveWestX(z) - BED.inset, surf(driveWestX(z) - BED.inset, z, BED.westX), z];
    if (z === BED.z0) quad(b, a, [a[0], a[1] - BED.drop, z], [b[0], b[1] - BED.drop, z]);
    else quad(a, b, [b[0], b[1] - BED.drop, z], [a[0], a[1] - BED.drop, z]);
  }
  report.marks[3] = { node: 'Front garden | R44 forecourt wedge paving', triangles: commit(), tree_bed: BED };
  const lawn = builder('Front garden | R44 court tree bed lawn', 'R44 | planter lawn',
    { note: 'photo 6: the court tree stands in a level bed inside the paving, not in a sunken wedge' });
  for (let r = 0; r < bedRows; r++) {
    const za = BED.z0 + (BED.z1 - BED.z0) * (r / bedRows), zb = BED.z0 + (BED.z1 - BED.z0) * ((r + 1) / bedRows);
    const xa0 = BED.westX + BED.inset, xa1 = driveWestX(za) - BED.inset, xb1 = driveWestX(zb) - BED.inset;
    const y = (x, z) => surf(x, z, BED.westX) - BED.drop;
    lawn.quad([xa0, y(xa0, za), za], [xa1, y(xa1, za), za], [xb1, y(xb1, zb), zb], [xa0, y(xa0, zb), zb]);
  }
  report.marks[3].bed_triangles = lawn.commit();
}

// ---- 2 | court link band: drive east edge to the stair-head deck
{
  const { quad, commit } = builder('Front garden | R44 court link band', STONE_CREAM,
    { note: 'mark 2: the slot between driveway and east stair deck, closed at deck level' });
  const rows = 8, z0 = 1.43, z1 = 3.16, xe = 7.51;
  for (let r = 0; r < rows; r++) {
    const za = z0 + (z1 - z0) * (r / rows), zb = z0 + (z1 - z0) * ((r + 1) / rows);
    quad([driveEastX(za), driveEastY(za), za], [xe, DECK, za], [xe, DECK, zb], [driveEastX(zb), driveEastY(zb), zb]);
  }
  quad([driveEastX(z1), driveEastY(z1), z1], [xe, DECK, z1], [xe, 2.45, z1], [driveEastX(z1), 2.45, z1]); // north face
  quad([xe, DECK, z0], [driveEastX(z0), driveEastY(z0), z0], [driveEastX(z0), 2.85, z0], [xe, 2.85, z0]); // south face
  report.marks[2] = { node: 'Front garden | R44 court link band', triangles: commit() };
}

// ---- 4 | facade walk terrace: hedge row back to the house face, flat 3.08
{
  const { quad, commit } = builder('Front garden | R44 facade walk terrace', STONE_COURSED,
    { note: 'photo kat_2_on_giris: coursed walkway against the street facade, level with the entry, hedge row as its parapet' });
  const X0 = -7.80, X1 = 0.35, ZN = 8.10, LO = 2.45, COL = 0.35;
  const cols = Math.round((X1 - X0) / COL);
  let area = 0;
  let prevS = null;
  for (let c = 0; c < cols; c++) {
    const xa = X0 + c * COL, xb = Math.min(X1, xa + COL);
    const zS = Math.min(terraceSouthZ(xa + 0.02), terraceSouthZ(xb - 0.02), terraceSouthZ((xa + xb) / 2));
    if (zS >= ZN) { prevS = null; continue; }
    quad([xa, TERRACE, zS], [xb, TERRACE, zS], [xb, TERRACE, ZN], [xa, TERRACE, ZN]);
    area += (xb - xa) * (ZN - zS);
    quad([xa, TERRACE, zS], [xa, LO, zS], [xb, LO, zS], [xb, TERRACE, zS]);         // south skirt (under the face)
    if (prevS !== null && Math.abs(prevS - zS) > 0.01) {                             // step between columns
      const lo = Math.min(prevS, zS), hi = Math.max(prevS, zS);
      quad([xa, TERRACE, lo], [xa, TERRACE, hi], [xa, LO, hi], [xa, LO, lo]);
    }
    prevS = zS;
  }
  quad([X0, TERRACE, terraceSouthZ(X0 + 0.02)], [X0, TERRACE, ZN], [X0, LO, ZN], [X0, LO, terraceSouthZ(X0 + 0.02)]); // west skirt
  quad([X0, TERRACE, ZN], [X1, TERRACE, ZN], [X1, LO, ZN], [X0, LO, ZN]);           // north skirt, behind the hedges
  quad([X1, TERRACE, ZN], [X1, TERRACE, terraceSouthZ(X1 - 0.02)], [X1, LO, terraceSouthZ(X1 - 0.02)], [X1, LO, ZN]); // east, against the path
  report.marks[4] = { node: 'Front garden | R44 facade walk terrace', triangles: commit(), area_m2: +area.toFixed(1), top: TERRACE };
}

// ---- 1 | thuja hedge continuation along the east retaining wall
{
  const templates = [];
  for (const name of ['Garden | High thuja privacy screen.004', 'Garden | High thuja privacy screen.006',
    'Garden | High thuja privacy screen.008', 'Garden | High thuja privacy screen', 'Garden | High thuja privacy screen variant 1']) {
    const n = root.listNodes().find((nn) => nn.getName() === name);
    if (!n) throw new Error(`template node missing: ${name}`);
    templates.push({ rotation: n.getRotation(), scale: n.getScale(), mesh: n.getMesh() });
  }
  const rows = [];
  let i = 0;
  for (let zc = 1.95; zc > -5.4; zc -= 1.15, i++) {
    let base = Infinity;
    for (let dz = -0.55; dz <= 0.55; dz += 0.1) {
      const g = groundAt(9.85, zc + dz);
      if (Number.isFinite(g)) base = Math.min(base, g);
    }
    if (!Number.isFinite(base)) throw new Error(`no soil under thuja at z ${zc}`);
    const t = templates[i % templates.length];
    const name = `Garden east | R44 thuja hedge continuation ${i + 1}`;
    scene.addChild(doc.createNode(name)
      .setMesh(templates[(i * 2 + 1) % templates.length].mesh)
      .setTranslation([9.85, base - 0.05, zc])
      .setRotation(t.rotation).setScale(t.scale)
      .setExtras({ source: 'kat_2_on_giris photo: the hedge line continues along the east retaining wall', walk_role: 'solid' }));
    rows.push({ name, z: +zc.toFixed(2), base_y: +(base - 0.05).toFixed(2) });
  }
  report.marks[1] = { screens: rows };
}

// ---- grass blades out from under every new slab
{
  const node = root.listNodes().find((n) => n.getName() === 'R33 | Natural bent garden grass.001');
  const inRegions = (x, z) => {
    if (x > 7.15 && x < 7.58 && z > 1.4 && z < 3.2) return true;                                    // band
    if (z > 6.03 && z < 9.93 && x > 1.78 && x < driveWestX(z) + 0.05) return true;                  // wedge P1
    if (z > 4.15 && z < 6.05 && x > 2.97 && x < driveWestX(z) + 0.05) return true;                  // wedge P2
    if (x > -7.83 && x < 0.38 && z < 8.13 && z > terraceSouthZ(x) - 0.1) return true;               // terrace
    return false;
  };
  let removed = 0;
  if (node?.getMesh()) {
    for (const prim of node.getMesh().listPrimitives()) {
      const pos = prim.getAttribute('POSITION'); const idx = prim.getIndices();
      if (!pos || !idx) continue;
      const keep = [];
      const el = [0, 0, 0];
      for (let i = 0; i < idx.getCount(); i += 3) {
        let cx = 0, cz = 0;
        const tri = [idx.getScalar(i), idx.getScalar(i + 1), idx.getScalar(i + 2)];
        for (const vi of tri) { pos.getElement(vi, el); cx += el[0] / 3; cz += el[2] / 3; }
        if (inRegions(cx, cz)) { removed++; continue; }
        keep.push(...tri);
      }
      const fresh = doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(keep)).setBuffer(buffer);
      const old = prim.getIndices(); prim.setIndices(fresh);
      if (old.listParents().every((p) => p.propertyType !== 'Primitive')) old.dispose();
    }
  }
  report.grass_blades_removed = removed;
}

// ------------------------------------------------------------ write out
await doc.transform(prune());
for (const ext of root.listExtensionsUsed())
  if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
const plain = `${FULL}/garden.plain.glb`;
writeFileSync(plain, await io.writeBinary(doc));
execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, FILE,
  '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
unlinkSync(plain);

const raw = readFileSync(FILE);
let triangles = 0;
{
  const meshes = new Set();
  for (const n of (await io.read(FILE)).getRoot().listNodes()) if (n.getMesh()) meshes.add(n.getMesh());
  for (const m of meshes) for (const p of m.listPrimitives())
    triangles += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
}
for (const path of [FULL + '/manifest.json', ROOT + '/viewer/public/models/full/manifest.json']) {
  if (!existsSync(path)) continue;
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  const asset = manifest.assets.find((a) => a.id === 'garden');
  asset.bytes = raw.length;
  asset.sha256 = createHash('sha256').update(raw).digest('hex');
  asset.triangles = triangles;
  writeFileSync(path, JSON.stringify(manifest, null, 2));
}
const mirror = ROOT + '/viewer/public/models/full/garden.glb';
if (existsSync(mirror)) writeFileSync(mirror, raw);
report.asset_bytes = raw.length;
report.asset_triangles = triangles;
writeFileSync(ROOT + '/build/front-garden-r44.json', JSON.stringify(report, null, 2));
console.log(`garden.glb: ${triangles} triangles, ${raw.length} bytes; blades removed: ${report.grass_blades_removed}`);
console.log('terrace south line sample:', [-7.5, -6.5, -6, -5, -4, -3, -2, -1, 0].map((x) => `${x}:${terraceSouthZ(x).toFixed(2)}`).join(' '));
