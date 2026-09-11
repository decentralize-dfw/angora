// R39 delivers the lift car operating panel as 15 nodes parented to the
// animated cabin but parked at the world origin - the stainless strip stands
// half-buried in the basement floor at (0,0,0), and once the cabin animates it
// rides through the entrance hall. Each mesh is centred on its own origin, so
// this step reconstructs the panel on the cabin's west wall (x = -2.636, the
// wall the owner photograph asansor_1.jpg shows the strip on): indicator with
// its display digit at the top, floor buttons 2 / 1 / 0 descending, the alarm
// at the bottom, everything raised above the handrail that crosses that wall
// at y 0.95. Placement is a reconstruction from the photograph's topology and
// the parts' own measured sizes, not a source-verified layout; the hard
// invariant - every panel node fully inside the cabin volume - is asserted
// here and again in viewer/tests/lift.test.mjs.
//
// Usage: node tools/fit_lift_panel_r39.mjs <in.glb> <out.glb>
// The output is written uncompressed; re-encode with the delivery settings:
// gltf-transform draco out.glb out.glb --quantize-position 14 --quantize-normal 8 --quantize-texcoord 12
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw Error('usage: fit_lift_panel_r39.mjs <in.glb> <out.glb>');

// Plates keep their authored upright pose turned onto the west wall (+90 deg
// about Y: plate normal +z becomes +x). The engraved glyphs were authored
// flat on the ground in the Blender text convention (normal +y, text height
// along -z after the axis swap), so they take the composed rotation that
// stands them upright on the same wall: y->x, -z->y, x->-z.
const PLATE = [0, 0.7071067811865476, 0, 0.7071067811865476];
const GLYPH = [0.5, 0.5, -0.5, 0.5];
const Z = -0.750;
const LAYOUT = {
  'R33 | Cabin stainless control strip': {t: [-2.632, 1.30, Z], r: PLATE},
  'R33 | Cabin floor indicator':         {t: [-2.6245, 1.83, Z], r: PLATE},
  'R38 panel marking 0':                 {t: [-2.6209, 1.83, Z], r: GLYPH}, // display digit
  'R33 | Cabin floor button bezel.002':  {t: [-2.623, 1.62, Z], r: PLATE},
  'R33 | Cabin raised floor button.002': {t: [-2.6145, 1.62, Z], r: PLATE},
  'R38 panel marking 2':                 {t: [-2.6109, 1.62, Z], r: GLYPH},
  'R33 | Cabin floor button bezel.001':  {t: [-2.623, 1.48, Z], r: PLATE},
  'R33 | Cabin raised floor button.001': {t: [-2.6145, 1.48, Z], r: PLATE},
  'R38 panel marking 1':                 {t: [-2.6109, 1.48, Z], r: GLYPH},
  'R33 | Cabin floor button bezel':      {t: [-2.623, 1.34, Z], r: PLATE},
  'R33 | Cabin raised floor button':     {t: [-2.6145, 1.34, Z], r: PLATE},
  'R38 panel marking 0.001':             {t: [-2.6109, 1.34, Z], r: GLYPH}, // button label 0
  'R33 | Alarm safety surround':         {t: [-2.623, 1.13, Z], r: PLATE},
  'R33 | Cabin alarm button':            {t: [-2.6135, 1.13, Z], r: PLATE},
  'R38 panel marking !':                 {t: [-2.6089, 1.13, Z], r: GLYPH},
};
// Cabin interior, measured from the delivered shell (granite floor to ceiling
// soffit, steel side to steel side, open face to rear wall).
const CABIN = {min: [-2.656, 0.085, -1.135], max: [-1.404, 2.205, -0.244]};

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const document = await io.read(input);
const root = document.getRoot();

const pending = new Map(Object.entries(LAYOUT));
let cabin = null;
for (const node of root.listNodes()) {
  if (node.getName() === 'R39 lift cabin travel') cabin = node;
  const fix = pending.get(node.getName());
  if (!fix) continue;
  const before = node.getTranslation();
  if (Math.hypot(...before) > 1e-6) throw Error(`${node.getName()} is no longer at the origin (${before}) - the delivery changed; re-measure before applying this layout`);
  node.setTranslation(fix.t);
  node.setRotation(fix.r);
  pending.delete(node.getName());
}
if (pending.size) throw Error('Panel nodes missing from the delivery: ' + [...pending.keys()].join(', '));
if (!cabin) throw Error('Cabin node missing');

// The invariant: every placed part, at its measured local extent, sits inside
// the cabin volume in the cabin's own frame (the cabin parks at y=0, so this
// is also the world frame of the delivered file).
for (const node of root.listNodes()) {
  const fix = LAYOUT[node.getName()];
  if (!fix) continue;
  const mesh = node.getMesh();
  let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const primitive of mesh.listPrimitives()) {
    const position = primitive.getAttribute('POSITION');
    const a = position.getMin([]), b = position.getMax([]);
    for (let i = 0; i < 3; i++) {lo[i] = Math.min(lo[i], a[i]); hi[i] = Math.max(hi[i], b[i]);}
  }
  // rotate the local box by the assigned quaternion, then translate
  const q = fix.r, rot = v => {
    const [x, y, z] = v, [qx, qy, qz, qw] = q;
    const ux = qw * x + qy * z - qz * y, uy = qw * y + qz * x - qx * z, uz = qw * z + qx * y - qy * x, uw = -qx * x - qy * y - qz * z;
    return [ux * qw + uw * -qx + uy * -qz - uz * -qy, uy * qw + uw * -qy + uz * -qx - ux * -qz, uz * qw + uw * -qz + ux * -qy - uy * -qx];
  };
  let wlo = [1e9, 1e9, 1e9], whi = [-1e9, -1e9, -1e9];
  for (const corner of [[lo[0],lo[1],lo[2]],[lo[0],lo[1],hi[2]],[lo[0],hi[1],lo[2]],[lo[0],hi[1],hi[2]],[hi[0],lo[1],lo[2]],[hi[0],lo[1],hi[2]],[hi[0],hi[1],lo[2]],[hi[0],hi[1],hi[2]]]) {
    const w = rot(corner).map((v, i) => v + fix.t[i]);
    for (let i = 0; i < 3; i++) {wlo[i] = Math.min(wlo[i], w[i]); whi[i] = Math.max(whi[i], w[i]);}
  }
  for (let i = 0; i < 3; i++) if (wlo[i] < CABIN.min[i] - 1e-4 || whi[i] > CABIN.max[i] + 1e-4)
    throw Error(`${node.getName()} leaves the cabin on axis ${i}: [${wlo[i].toFixed(4)}, ${whi[i].toFixed(4)}]`);
  console.log(node.getName().padEnd(40), 'x', wlo[0].toFixed(4) + '..' + whi[0].toFixed(4), 'y', wlo[1].toFixed(3) + '..' + whi[1].toFixed(3), 'z', wlo[2].toFixed(3) + '..' + whi[2].toFixed(3));
}

// write uncompressed; the caller re-applies the delivery's Draco settings
for (const extension of root.listExtensionsUsed()) if (extension.extensionName === 'KHR_draco_mesh_compression') extension.dispose();
await io.write(output, document);
console.log('written', output);
