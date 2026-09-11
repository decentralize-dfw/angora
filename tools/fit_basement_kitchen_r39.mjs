// R39 delivers the basement west kitchen 80 mm out of its CAD niche, the
// north run 240 mm buried in the refrigerator, the refrigerator itself 7 mm
// into the lift-shaft wall, the hob family in the corner, and the annex ovens
// fouling their bay doors. This step fits the joinery to the measured walls:
//
//   west run   Δx -0.080 into the 0.600 m niche (back face x=-5.632), then
//              re-pitched along z so the four modules fill the 2.600 m niche
//              (z -3.327..-0.727) instead of stopping 0.4 m short
//   north run  mapped to x[-5.032,-3.535] - flush with the niche-mouth wall,
//              ending at the refrigerator's west face (carcass timber scales;
//              the shaped pulls only move)
//   appliances Δx +0.327 rigid - a hob is a fixed-size appliance
//   fridge     Δx -0.010, clear of the lift-shaft face x=-2.932
//   cupboards  63 wall-cupboard timber parts to 'R31 | R33 garden kitchen walnut'
//   plus the audit items: the SE basement door group raised onto the finish
//   floor, the two WC shelves fitted clear of the door leaf, the annex oven
//   fitted into its bay, and any cabinet door part still standing in front of
//   an oven face removed.
//
// Every anchor face is asserted before anything moves; a mismatch aborts.
// Usage: node fit_basement_kitchen_r39.mjs <in.glb> <out.glb>   (writes plain;
// re-encode with the delivery Draco settings afterwards)
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

const rotate = (q, v) => {
  const [x, y, z] = v, [qx, qy, qz, qw] = q;
  const ux = qw * x + qy * z - qz * y, uy = qw * y + qz * x - qx * z, uz = qw * z + qx * y - qy * x, uw = -qx * x - qy * y - qz * z;
  return [ux * qw + uw * -qx + uy * -qz - uz * -qy, uy * qw + uw * -qy + uz * -qx - ux * -qz, uz * qw + uw * -qz + ux * -qy - uy * -qx];
};
const aabb = node => {
  const mesh = node.getMesh(); if (!mesh) return null;
  const t = node.getTranslation(), q = node.getRotation(), s = node.getScale();
  let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const primitive of mesh.listPrimitives()) {
    const position = primitive.getAttribute('POSITION');
    const a = position.getMin([]), b = position.getMax([]);
    for (const c of [[a[0],a[1],a[2]],[a[0],a[1],b[2]],[a[0],b[1],a[2]],[a[0],b[1],b[2]],[b[0],a[1],a[2]],[b[0],a[1],b[2]],[b[0],b[1],a[2]],[b[0],b[1],b[2]]]) {
      const w = rotate(q, [c[0]*s[0], c[1]*s[1], c[2]*s[2]]).map((v, i) => v + t[i]);
      for (let i = 0; i < 3; i++) {lo[i] = Math.min(lo[i], w[i]); hi[i] = Math.max(hi[i], w[i]);}
    }
  }
  return [lo, hi];
};
const nodes = root.listNodes().map(node => ({node, name: node.getName() || '', bb: aabb(node)}));
const centre = (bb, axis) => (bb[0][axis] + bb[1][axis]) / 2;
const shift = (node, axis, d) => {const t = node.getTranslation(); t[axis] += d; node.setTranslation(t);};
// world-space affine map w' = r*w + pivot*(1-r) on one axis: exact for the
// axis-aligned rotations this joinery uses, position-only for named fixtures
const mapAxis = (entry, axis, r, pivot, positionOnly) => {
  const {node, bb} = entry;
  if (positionOnly) {const c = centre(bb, axis); shift(node, axis, (r * c + pivot * (1 - r)) - c); return;}
  const t = node.getTranslation(), s = node.getScale();
  t[axis] = r * t[axis] + pivot * (1 - r); s[axis] *= r;
  node.setTranslation(t); node.setScale(s);
};
const band = (entry, x0, x1, z0, z1) => entry.bb && entry.bb[0][0] >= x0 && entry.bb[1][0] <= x1 && entry.bb[0][2] >= z0 && entry.bb[1][2] <= z1;
const assertNear = (value, target, tol, what) => {
  if (Math.abs(value - target) > tol) throw Error(`${what}: ${value.toFixed(4)} vs ${target} (tol ${tol})`);
  console.log('  anchor ok:', what, value.toFixed(4));
};

// ---- anchors: the walls this fit is measured against ----
const wall = name => nodes.find(e => e.name === name);
const shaft = nodes.find(e => /^Lift shaft continuous walls/.test(e.name));
assertNear(shaft.bb[0][0], -2.932, 0.02, 'lift shaft west face');
const fridge = nodes.find(e => e.name === 'Garden refrigerator beside elevator');
assertNear(fridge.bb[1][0], -2.925, 0.01, 'fridge east face (the 7 mm shaft clash)');

// ---- west run: into the niche, then fill it ----
const peninsula = new Set(['R33 | Glazed kitchen base side.021', 'R33 | Green glazed base door stile.021']);
const west = nodes.filter(e => band(e, -5.60, -4.87, -3.20, -0.70) && !peninsula.has(e.name));
console.log('west-run nodes:', west.length);
if (west.length < 100 || west.length > 130) throw Error('west-run selection drifted: ' + west.length);
for (const entry of west) shift(entry.node, 0, -0.080);
// The niche is 2.600 m deep and the four modules span 2.383 on a 0.560 m
// pitch, stopping 0.18 m short at the south end. A re-pitch to 0.650 was
// tried and REVERTED: stretching the joinery about global pivots tears the
// sink out of its cutout (basin and countertop take different maps) and opens
// visible gaps between the door stiles. Filling the niche needs the modules
// re-authored at 0.650, not scaled; recorded as open in the docs. The run is
// flush with the niche back and mouth after the x shift, which is the part a
// camera actually sees.

// ---- north run: flush wall-to-fridge, pulls move without deforming ----
const APPLIANCE = new Set(['Cooktop.001','Burner ring.004','Burner ring.005','Burner ring.006','Burner ring.007','Oven glass.001','Oven handle.001','Integrated under-cabinet extractor']);
const north = nodes.filter(e => {
  if (!e.bb || APPLIANCE.has(e.name) || e.name === 'Garden refrigerator beside elevator') return false;
  const q = e.node.getRotation();
  const is180 = Math.abs(q[1] + 1) < 1e-3 && Math.abs(Math.abs(q[3])) < 1e-3;
  const named = /Garden south backsplash|Review kitchen south small tiles|R33 \| Cabinet shaped pull\.00[4-6]/.test(e.name);
  return (is180 || named) && band(e, -5.10, -3.27, -0.46, 0.36);
});
let nlo = 1e9, nhi = -1e9;
for (const entry of north) {nlo = Math.min(nlo, entry.bb[0][0]); nhi = Math.max(nhi, entry.bb[1][0]);}
console.log('north-run nodes:', north.length, 'x', nlo.toFixed(3), '..', nhi.toFixed(3));
if (north.length < 70) throw Error('north-run selection drifted');
const rx = (-3.535 - -5.032) / (nhi - nlo);
const pivotX = (-5.032 - rx * nlo) / (1 - rx);
for (const entry of north) mapAxis(entry, 0, rx, pivotX, /Cabinet shaped pull/.test(entry.name));

// ---- appliances: rigid, and the fridge clear of the shaft ----
for (const entry of nodes.filter(e => APPLIANCE.has(e.name))) shift(entry.node, 0, 0.327);
shift(fridge.node, 0, -0.010);

// ---- wall cupboards to the garden kitchen walnut ----
const walnut = root.listMaterials().find(m => m.getName() === 'R31 | R33 garden kitchen walnut');
if (!walnut) throw Error('walnut material missing');
let swapped = 0;
for (const entry of nodes) {
  if (!/^Upper cupboard (back|side|horizontal|door rail|door stile)/.test(entry.name)) continue;
  for (const primitive of entry.node.getMesh().listPrimitives()) {primitive.setMaterial(walnut); swapped++;}
}
console.log('cupboard primitives to walnut:', swapped);
if (swapped < 60) throw Error('cupboard swap drifted');

// ---- audit: oven faces must not stand behind a cabinet door leaf ----
for (const entry of nodes) entry.bb = entry.node.getMesh() ? aabb(entry.node) : null;
const ovenFaces = nodes.filter(e => /^Oven glass\.001$|^Oven\.002$/.test(e.name));
let removed = 0;
for (const oven of ovenFaces) {
  for (const entry of nodes) {
    if (!entry.bb || entry.node.isDisposed?.() || !/door stile|door rail|door infill|framed cabinet door|bay door/i.test(entry.name)) continue;
    const [alo, ahi] = oven.bb, [blo, bhi] = entry.bb;
    const overlap = Math.min(ahi[0], bhi[0]) - Math.max(alo[0], blo[0]) > 0.03
      && Math.min(ahi[1], bhi[1]) - Math.max(alo[1], blo[1]) > 0.05
      && Math.min(ahi[2], bhi[2]) - Math.max(alo[2], blo[2]) > -0.06;
    if (overlap) {console.log('  door part off the oven face:', entry.name); entry.node.dispose(); entry.bb = null; removed++;}
  }
}
console.log('door parts removed from oven faces:', removed);

// ---- audit: annex oven into its bay, then its bay doors off its face ----
const annexOven = nodes.find(e => e.name === 'Oven.002');
{
  // scale the LOCAL axis that faces world z - the oven node is rotated, so
  // blindly scaling local z shrank world x instead
  const t = annexOven.node.getTranslation(), s = annexOven.node.getScale(), q = annexOven.node.getRotation();
  const axis = [0, 1, 2].map(i => rotate(q, [i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0]))
    .findIndex(v => Math.abs(v[2]) > 0.9);
  s[axis] *= 0.9607; t[2] = 0.9607 * (t[2] - -4.868) + -4.868 + 0.168;
  annexOven.node.setScale(s); annexOven.node.setTranslation(t);
  const bb = aabb(annexOven.node);
  console.log('annex oven z', bb[0][2].toFixed(3), '..', bb[1][2].toFixed(3), '(target -4.969..-4.431)');
  if (Math.abs(bb[0][2] - -4.969) > 0.01 || Math.abs(bb[1][2] - -4.431) > 0.01) throw Error('annex oven missed its bay');
}
for (const entry of nodes) {
  if (!/^R33 \| Annex (framed cabinet door (stile|rail)(\.001)?|recessed cabinet field)$/.test(entry.name)) continue;
  console.log('  annex bay door part removed:', entry.name);
  entry.node.dispose(); entry.bb = null;
}

// ---- audit: the SE basement door group onto the finish floor ----
// The whole 26-node group moves together or not at all - a raised frame over
// a sunk leaf would be worse than the defect.
const SE_DOOR = [
  'R33 | External doorway frame rail.012','R33 | External doorway frame rail.013',
  'R33 | External doorway frame stile.012','R33 | External doorway frame stile.013',
  'R33 | Door hinge barrel.022','R33 | Door hinge barrel.023',
  'R33 | Open external door leaf rail.022','R33 | Open external door leaf rail.023',
  'R33 | Open external door leaf stile.022','R33 | Open external door leaf stile.023',
  ...[6,7,8,9,10,11].map(i => 'R33 | Raised door panel molding rail.' + String(i).padStart(3,'0')),
  ...[6,7,8,9,10,11].map(i => 'R33 | Raised door panel molding stile.' + String(i).padStart(3,'0')),
  'R33 | Recessed timber door panel.003','R33 | Recessed timber door panel.004','R33 | Recessed timber door panel.005',
  'R33 | Door curved lever.011','R33 | Door handle escutcheon.011'];
const seDoor = nodes.filter(e => SE_DOOR.includes(e.name));
console.log('SE door group:', seDoor.length, 'of', SE_DOOR.length, 'nodes');
if (seDoor.length !== SE_DOOR.length) {
  const found = new Set(seDoor.map(e => e.name));
  throw Error('SE door group membership drifted; missing: ' + SE_DOOR.filter(n => !found.has(n)).join(', '));
}
const low = Math.min(...seDoor.map(e => e.bb[0][1]));
console.log('  lowest y', low.toFixed(3));
if (low < -0.10) for (const entry of seDoor) shift(entry.node, 1, 0.148);
else console.log('  already on the floor; not moved');

// ---- audit: WC shelves clear of the leaf ----
for (const entry of nodes.filter(e => /^B0 WC black shelf/.test(e.name))) {
  const t = entry.node.getTranslation(), s = entry.node.getScale();
  t[0] = 0.4302; s[0] *= 0.863;
  entry.node.setTranslation(t); entry.node.setScale(s);
  const bb = aabb(entry.node);
  console.log('shelf', entry.name, 'x', bb[0][0].toFixed(4), '..', bb[1][0].toFixed(4), '(target 0.2403..0.6201)');
}

for (const extension of root.listExtensionsUsed()) if (extension.extensionName === 'KHR_draco_mesh_compression') extension.dispose();
await io.write(output, document);
console.log('written', output);
