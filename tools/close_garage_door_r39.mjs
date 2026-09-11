// R39 delivers the garage sectional door fully open - five panels parked
// horizontally under the garage ceiling - leaving a 3.05 x 2.50 m hole in the
// front facade, while every exterior and approach photograph shows the door
// closed. This step closes it: each panel turns upright (the delivered pose is
// the closed pose rotated -90 deg about X), stacks on the 0.500 m pitch that
// fills sill 3.025 to head 5.525, and the whole leaf recentres and widens
// from its authored 2.80 m to the measured 3.05 m trim opening (a 1.089 width
// scale on a flat sectional leaf; mouldings and recesses ride along at their
// in-panel offsets). The open state was the authored delivery; this is a
// photo-supported correction, recorded in the review register.
//
// Usage: node close_garage_door_r39.mjs <in.glb> <out.glb>  (plain output;
// re-encode with the delivery Draco settings)
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const [input, output] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const document = await io.read(input);
const root = document.getRoot();
const byName = new Map(root.listNodes().map(node => [node.getName(), node]));

// measured anchors
const near = (value, target, tolerance, what) => {
  if (Math.abs(value - target) > tolerance) throw Error(`${what}: ${value} vs ${target}`);
};
const side0 = byName.get('Garage door side trim'), side1 = byName.get('Garage door side trim.001');
near(side0.getTranslation()[0], 4.100, 0.005, 'left trim');
near(side1.getTranslation()[0], 7.250, 0.005, 'right trim');
const OPEN_ROT = q => Math.abs(q[0] + 0.7071) < 0.001 && Math.abs(q[3] - 0.7071) < 0.001;

// the five panels, front-of-stack first: the panel nearest the opening parks
// last on the way up, so it is the TOP panel when closed
const PANEL_Z = [0.6085, 0.1255, -0.3575, -0.8405, -1.3235];
// Panel centres fill sill 3.025 to head 5.525 exactly; the 0.474 m panel
// bodies stretch to the 0.500 m pitch so the joints close instead of reading
// as 26 mm open slots (the mouldings and recesses keep their authored size).
const PANEL_Y = [5.275, 4.775, 4.275, 3.775, 3.275];
const PANEL_HEIGHT_SCALE = 0.500 / 0.474;
const WIDTH_SCALE = 3.05 / 2.80; // measured opening / authored leaf
const CENTRE_OLD = 5.818, CENTRE_NEW = 5.675; // leaf centre onto the opening centre
const mapX = x => CENTRE_NEW + (x - CENTRE_OLD) * WIDTH_SCALE;

let panels = 0, riders = 0;
for (const node of root.listNodes()) {
  const name = node.getName() || '';
  const isPanel = /^Garage sectional panel(\.\d+)?$/.test(name);
  const isRider = /^Garage panel (moulding|recess)(\.\d+)?$/.test(name);
  if (!isPanel && !isRider) continue;
  const t = node.getTranslation(), q = node.getRotation(), s = node.getScale();
  if (!OPEN_ROT(q)) throw Error(name + ' is not in the delivered open pose');
  const k = PANEL_Z.reduce((best, z, i) => Math.abs(t[2] - z) < Math.abs(t[2] - PANEL_Z[best]) ? i : best, 0);
  // in the parked pose, +z runs down the stack (local +y -> world -z) and
  // world y carries the leaf depth (local +z -> world +y)
  const inPanelDrop = t[2] - PANEL_Z[k];   // becomes -y in the closed pose
  const depth = t[1] - 5.500;              // becomes +z proud of the leaf plane
  node.setRotation([0, 0, 0, 1]);
  node.setTranslation([mapX(t[0]), PANEL_Y[k] - inPanelDrop, 1.450 + depth]);
  node.setScale([s[0] * WIDTH_SCALE, isPanel ? s[1] * PANEL_HEIGHT_SCALE : s[1], s[2]]);
  if (isPanel) panels++; else riders++;
}
if (panels !== 5 || riders !== 60) throw Error(`membership drifted: ${panels} panels, ${riders} riders`);

// verify the closed leaf against the opening
const rotate = (q, v) => {
  const [x, y, z] = v, [qx, qy, qz, qw] = q;
  const ux = qw * x + qy * z - qz * y, uy = qw * y + qz * x - qx * z, uz = qw * z + qx * y - qy * x, uw = -qx * x - qy * y - qz * z;
  return [ux * qw + uw * -qx + uy * -qz - uz * -qy, uy * qw + uw * -qy + uz * -qx - ux * -qz, uz * qw + uw * -qz + ux * -qy - uy * -qx];
};
let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
for (const node of root.listNodes()) {
  if (!/^Garage sectional panel(\.\d+)?$/.test(node.getName() || '')) continue;
  const t = node.getTranslation(), q = node.getRotation(), s = node.getScale();
  for (const primitive of node.getMesh().listPrimitives()) {
    const position = primitive.getAttribute('POSITION');
    const a = position.getMin([]), b = position.getMax([]);
    for (const c of [[a[0],a[1],a[2]],[b[0],b[1],b[2]],[a[0],b[1],a[2]],[b[0],a[1],b[2]],[a[0],a[1],b[2]],[b[0],b[1],a[2]],[a[0],b[1],b[2]],[b[0],a[1],a[2]]]) {
      const w = rotate(q, [c[0]*s[0], c[1]*s[1], c[2]*s[2]]).map((v, i) => v + t[i]);
      for (let i = 0; i < 3; i++) {lo[i] = Math.min(lo[i], w[i]); hi[i] = Math.max(hi[i], w[i]);}
    }
  }
}
console.log(`closed leaf x ${lo[0].toFixed(3)}..${hi[0].toFixed(3)} y ${lo[1].toFixed(3)}..${hi[1].toFixed(3)} z ${lo[2].toFixed(3)}..${hi[2].toFixed(3)}`);
near(lo[0], 4.150, 0.005, 'leaf left edge on the trim');
near(hi[0], 7.200, 0.005, 'leaf right edge on the trim');
near(lo[1], 3.025, 0.005, 'leaf on the sill');
near(hi[1], 5.525, 0.005, 'leaf at the head');
if (lo[2] < 1.400 || hi[2] > 1.500) throw Error('leaf leaves the trim depth');

for (const extension of root.listExtensionsUsed()) if (extension.extensionName === 'KHR_draco_mesh_compression') extension.dispose();
await io.write(output, document);
console.log('written', output);
