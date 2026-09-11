// The whole-scene intersection and clearance audits (690M exact tri-tri
// tests; headroom/clearance re-verification) left five incidents in the
// upper level files. All are node-TRS moves except the attic door, which is
// a bounded vertex rotation inside a merged mesh:
//   level-1: the salon radiator fins sit 10 mm inside their casing; the WC
//            cistern lid cuts the garage-side trim by 8 mm
//   level-2: the master-bath radiator stands in the door swing (slides east
//            onto the measured empty wall run); the blue bathmat pokes under
//            the door leaf edge (slides along the wall - the mat is authored
//            flush to the z=-7.925 wall face, so depth is not an option)
//   level-3: the shower enclosure pierces the sloping roof by up to 9 mm
//            (uniform 2% height scale about the tray, measured limit 1.74%
//            spare); the ajar bathroom door leaf crosses the tray lip
//            (rotated 1.5 deg toward closed about its hinge line)
// Usage: node fix_audit_clashes_r39.mjs <level-1> <level-2> <level-3> <outdir>
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const [level1, level2, level3, outDir] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const shift = (node, axis, d) => {const t = node.getTranslation(); t[axis] += d; node.setTranslation(t);};
const strip = root => {for (const e of root.listExtensionsUsed()) if (e.extensionName === 'KHR_draco_mesh_compression') e.dispose();};

// ---- level-1 ----
{
  const document = await io.read(level1);
  const root = document.getRoot();
  const fins = root.listNodes().filter(n => /^Salon radiator fin(\.\d+)?$/.test(n.getName() || ''));
  if (fins.length !== 12) throw Error('salon fins: ' + fins.length);
  for (const fin of fins) shift(fin, 2, 0.010);
  const cistern = root.listNodes().filter(n => /^R33 \| WC cistern(\.001| lid\.001)$/.test(n.getName() || ''));
  if (cistern.length !== 2) throw Error('cistern pair: ' + cistern.length);
  for (const node of cistern) shift(node, 0, -0.010);
  console.log('level-1: 12 fins dz+0.010, cistern pair dx-0.010');
  strip(root); await io.write(outDir + '/level-1.glb', document);
}

// ---- level-2 ----
{
  const document = await io.read(level2);
  const root = document.getRoot();
  const radiator = root.listNodes().filter(n => /^R31 \| Radiator (cast column(\.\d+)?|manifold(\.\d+)?|valve(\.\d+)?)$/.test(n.getName() || ''));
  if (radiator.length !== 13) throw Error('radiator assembly: ' + radiator.length);
  for (const node of radiator) shift(node, 0, 0.386);
  const mat = root.listNodes().find(n => n.getName() === 'Master blue bathmat');
  shift(mat, 0, 0.125);
  console.log('level-2: radiator x+0.386 (13 nodes), bathmat x+0.125');
  strip(root); await io.write(outDir + '/level-2.glb', document);
}

// ---- level-3 ----
{
  const document = await io.read(level3);
  const root = document.getRoot();
  const SHOWER = ['R33 | Fixed curved shower glazing', 'R33 | Fixed curved shower glazing.001',
    'R33 | Open sliding shower leaf', 'R33 | Open sliding shower leaf.001', 'R33 | Shower handset',
    'R33 | Shower curved track.002', 'R33 | Shower curved track.003',
    'R33 | Shower upright', 'R33 | Shower upright.001', 'R33 | Shower upright.002', 'R33 | Shower upright.003',
    'R33 | Shower sliding pull.002', 'R33 | Shower sliding pull.003', 'R33 | Shower riser.001', 'R33 | Shower hose'];
  const shower = root.listNodes().filter(n => SHOWER.includes(n.getName() || ''));
  if (shower.length !== 15) throw Error('shower assembly: ' + shower.length + ' of 15');
  for (const node of shower) {
    const t = node.getTranslation(), s = node.getScale();
    t[1] = 9.6505 + 0.98 * (t[1] - 9.6505); s[1] *= 0.98;
    node.setTranslation(t); node.setScale(s);
  }
  // the ajar bathroom door leaf, inside the merged door mesh
  const door = root.listNodes().find(n => n.getName() === 'F3 | KAPI İÇ$KAPI');
  const c = Math.cos(1.5 * Math.PI / 180), s = Math.sin(1.5 * Math.PI / 180);
  let moved = 0;
  for (const primitive of door.getMesh().listPrimitives()) {
    const position = primitive.getAttribute('POSITION');
    const array = position.getArray().slice();
    const count = position.getCount();
    const selected = new Uint8Array(count);
    for (let i = 0; i < count; i++) {
      const x = array[i * 3], y = array[i * 3 + 1], z = array[i * 3 + 2];
      selected[i] = (x >= -0.08 && x <= 0.10 && z >= -6.09 && z <= -5.26 && y >= 9.47 && y <= 11.471
        && Math.abs(0.9795 * (x + 0.0715) - 0.2016 * (z + 6.0731)) <= 0.065) ? 1 : 0;
    }
    const indices = primitive.getIndices();
    const move = new Uint8Array(count);
    if (indices) {
      const idx = indices.getArray();
      for (let i = 0; i + 2 < idx.length; i += 3)
        if (selected[idx[i]] && selected[idx[i + 1]] && selected[idx[i + 2]])
          {move[idx[i]] = move[idx[i + 1]] = move[idx[i + 2]] = 1;}
    }
    for (let i = 0; i < count; i++) {
      if (!move[i]) continue;
      const x = array[i * 3], z = array[i * 3 + 2];
      array[i * 3] = -0.0715 + c * (x + 0.0715) + s * (z + 6.0731);
      array[i * 3 + 2] = -6.0731 - s * (x + 0.0715) + c * (z + 6.0731);
      moved++;
    }
    position.setArray(array);
  }
  console.log('level-3: shower scaled 0.98 about the tray; door-leaf vertices rotated:', moved);
  if (!moved) throw Error('door leaf selection found nothing');
  strip(root); await io.write(outDir + '/level-3.glb', document);
}
