// R41 | Put the measured plaster colour on the delivery.
//
// tools/sample_plaster_colour_r41.py reads the house's own photographs and
// reports what the walls and ceilings are painted. This writes that onto the
// two materials that carry it, on every asset that uses them, and refuses to
// run on a measurement taken from too few photographs or one that has drifted
// off neutral - a sample that came back strongly coloured would mean the
// luminance-and-saturation filter had caught something other than plaster.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const measurement = JSON.parse(readFileSync(ROOT + '/build/plaster-colour-r41.json', 'utf8'));
const WANT = { interior: measurement.interior_base_color_factor, ceiling: measurement.ceiling_base_color_factor };

if (measurement.photographs < 20) throw new Error('measurement rests on too few photographs');
for (const [name, colour] of Object.entries(WANT)) {
  const [r, g, b] = colour;
  if (Math.max(r, g, b) / Math.min(r, g, b) > 1.25)
    throw new Error(`${name} came back coloured (${colour.join(', ')}); the sample is not plaster`);
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

const manifest = JSON.parse(readFileSync(FULL + '/manifest.json', 'utf8'));
const changes = [];
for (const asset of manifest.assets) {
  const file = `${FULL}/${asset.file}`;
  if (!existsSync(file)) continue;
  const doc = await io.read(file);
  const root = doc.getRoot();
  let touched = 0;
  for (const material of root.listMaterials()) {
    const want = WANT[material.getName()];
    if (!want) continue;
    const had = material.getBaseColorFactor();
    if (had.every((v, i) => Math.abs(v - want[i]) < 1e-4)) continue;
    material.setBaseColorFactor(want);
    changes.push({ asset: asset.id, material: material.getName(),
      from: had.map((v) => +v.toFixed(4)), to: want });
    touched++;
  }
  if (!touched) continue;
  await doc.transform(prune());
  for (const ext of root.listExtensionsUsed())
    if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
  const plain = `${file}.plain.glb`;
  writeFileSync(plain, await io.writeBinary(doc));
  execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, file,
    '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
  unlinkSync(plain);
  const raw = readFileSync(file);
  asset.bytes = raw.length;
  asset.sha256 = createHash('sha256').update(raw).digest('hex');
  console.log(`${asset.id}: ${touched} finish${touched > 1 ? 'es' : ''} repainted, ${raw.length} bytes`);
}
writeFileSync(FULL + '/manifest.json', JSON.stringify(manifest, null, 2));
writeFileSync(ROOT + '/build/plaster-applied-r41.json', JSON.stringify({
  generated_for: 'R41', photographs: measurement.photographs,
  median_srgb: measurement.median_srgb, changes,
}, null, 2));
console.log(`${changes.length} material assignments updated from ${measurement.photographs} photographs`);
