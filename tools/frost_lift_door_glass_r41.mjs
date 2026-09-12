// R41 | Frost the lift landing door glazing.
//
// The stained-glass panel in the lift door was sharing `cabinet_glass` with
// every vitrine and shelf in the house: transmission 1.00 at roughness 0.04,
// which is optically clear. So the landing door showed the lift shaft straight
// through it, and the rose and leaves that are supposed to sit on a milky
// ground floated on a window.
//
// The photograph (asansor, frame 01) shows the opposite: a deeply textured
// near-white ground that carries no image at all - you cannot tell there is a
// shaft behind it - with the red rose, the green leaves and the amber ribbon
// leaded into it. So the panel gets a material of its own, warm off-white,
// rough enough to scatter what little it passes.
//
// Only the lift's own panel is moved. `cabinet_glass` keeps its clear setting
// for the vitrines, the coffee table and the glass shelves that rightly show
// what is behind them.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { KHRMaterialsTransmission, KHRMaterialsIOR, KHRMaterialsSpecular } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const PANEL = /^Lift floral textured glass/;
const FROSTED = 'R31 | R41 lift door frosted glass';
// Acid-etched glass: it still passes light, it just passes no image. A little
// transmission keeps the panel from going dead against a lit landing; the
// roughness is what stops the shaft showing through.
const FROST = { base: [0.925, 0.911, 0.868, 1], roughness: 0.62, transmission: 0.22, ior: 1.46 };

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

let touched = 0;
for (const level of [0, 1, 2, 3]) {
  const file = `${FULL}/level-${level}.glb`;
  const doc = await io.read(file);
  const root = doc.getRoot();
  const panels = root.listNodes().filter((n) => PANEL.test(n.getName()) && n.getMesh());
  if (!panels.length) { console.log(`level-${level}: no lift panel`); continue; }

  let material = root.listMaterials().find((m) => m.getName() === FROSTED);
  if (!material) {
    const transmission = doc.createExtension(KHRMaterialsTransmission);
    const ior = doc.createExtension(KHRMaterialsIOR);
    const specular = doc.createExtension(KHRMaterialsSpecular);
    material = doc.createMaterial(FROSTED)
      .setBaseColorFactor(FROST.base)
      .setRoughnessFactor(FROST.roughness)
      .setMetallicFactor(0)
      .setDoubleSided(true)
      .setExtension('KHR_materials_transmission',
        transmission.createTransmission().setTransmissionFactor(FROST.transmission))
      .setExtension('KHR_materials_ior', ior.createIOR().setIOR(FROST.ior))
      .setExtension('KHR_materials_specular',
        specular.createSpecular().setSpecularFactor(0.55));
  }
  let moved = 0;
  for (const node of panels)
    for (const prim of node.getMesh().listPrimitives()) {
      if (prim.getMaterial()?.getName() === FROSTED) continue;
      prim.setMaterial(material); moved++;
    }
  console.log(`level-${level}: ${panels.length} lift panels, ${moved} primitives frosted`);
  touched += moved;
  if (!moved) continue;

  // Disposing a node and its mesh leaves the accessors behind, and their

  // bytes stay in the buffer - re-running this tool grew the storey by a

  // megabyte a time until the orphans were swept.

  await doc.transform(prune());

  for (const ext of root.listExtensionsUsed())
    if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
  const plain = `${FULL}/level-${level}.plain.glb`;
  writeFileSync(plain, await io.writeBinary(doc));
  execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, file,
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
console.log('lift glazing primitives frosted:', touched);
