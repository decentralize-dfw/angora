// R42 | Finish the lift door glass: milky, not merely blurred.
//
// R41 gave the landing panel a frosted material at transmission 0.22 and
// roughness 0.62. Photographed through the shipped viewer from the Yemek
// alanı, the shaft still reads through it - the stair soffit and the guide are
// plainly visible - which is the thing the review asked to be rid of: "arkasını
// böyle gösteriyor. güzel buzlu cam kullan bunda."
//
// Acid-etched glass of this kind passes light and no image at all. Any
// transmission at all in three is a refraction of the scene behind, so the
// honest way to render "you cannot see the shaft" is to stop transmitting: an
// opaque warm off-white dielectric, rough enough to scatter, with the
// specular and the index of refraction left in place so it still takes a
// glassy highlight. The rose, the leaves and the amber ribbon are separate
// solids leaded in front of it and they are untouched.
//
// It also takes the panel out of three's transmission pass, which re-renders
// the opaque scene into a target before drawing it.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const FROSTED = 'R31 | R41 lift door frosted glass';
const ETCHED = { base: [0.918, 0.903, 0.858, 1], roughness: 0.58 };

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

let touched = 0;
for (const level of [0, 1, 2, 3]) {
  const file = `${FULL}/level-${level}.glb`;
  const doc = await io.read(file);
  const root = doc.getRoot();
  const material = root.listMaterials().find((m) => m.getName() === FROSTED);
  if (!material) { console.log(`level-${level}: no frosted panel`); continue; }
  const transmission = material.getExtension('KHR_materials_transmission');
  const before = transmission?.getTransmissionFactor() ?? 0;
  // Every physical extension goes, not just the transmission factor. While the
  // material still declares an index of refraction or a specular tint the
  // loader builds a MeshPhysicalMaterial, and the panel keeps a mirror-sharp
  // reflection of the stair behind the camera that reads exactly like seeing
  // through it. A rough dielectric is what etched glass is; a standard
  // material at roughness 0.58 renders one and cannot be seen through.
  for (const name of ['KHR_materials_transmission', 'KHR_materials_ior', 'KHR_materials_specular']) {
    const extension = material.getExtension(name);
    if (!extension) continue;
    material.setExtension(name, null); extension.dispose();
  }
  material.setBaseColorFactor(ETCHED.base).setRoughnessFactor(ETCHED.roughness)
    .setMetallicFactor(0).setAlphaMode('OPAQUE');
  console.log(`level-${level}: transmission ${before} -> 0, physical extensions dropped`);
  touched++;

  await doc.transform(prune());
  for (const ext of root.listExtensionsUsed())
    if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
  const plain = `${file}.plain.glb`;
  writeFileSync(plain, await io.writeBinary(doc));
  execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, file,
    '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
  unlinkSync(plain);

  const manifest = JSON.parse(readFileSync(FULL + '/manifest.json', 'utf8'));
  const asset = manifest.assets.find((a) => a.id === `level-${level}`);
  const raw = readFileSync(file);
  asset.bytes = raw.length;
  asset.sha256 = createHash('sha256').update(raw).digest('hex');
  writeFileSync(FULL + '/manifest.json', JSON.stringify(manifest, null, 2));
}
if (!touched) throw new Error(`no storey carries ${FROSTED}`);
writeFileSync(ROOT + '/build/lift-glass-r42.json', JSON.stringify({
  generated_for: 'R42', material: FROSTED, transmission: 0,
  base_color_factor: ETCHED.base, roughness: ETCHED.roughness, storeys: touched,
  note: 'etched glass passes light and no image; transmission is a refraction of the scene behind',
}, null, 2));
console.log(`${touched} storeys re-encoded`);
