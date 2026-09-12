// R41 | Lift the dark timber off black.
//
// build/renders/r41-app/"02 attic-walk.png" is the shipped page, walk mode, the
// attic bedroom station: the door is a silhouette. The six-panel design reads
// only as faintly darker lines and the brass knob as a dark smudge. That is not
// the lighting - `wood_dark`'s base colour map averages sRGB 48,37,31, a linear
// 0.029, and no lighting recovers panel relief from a surface that near black.
//
// build/timber-colour-r41.json measured the photographs and could settle the
// hue but not the level: the delivery sits at red/blue 2.09 and both estimators
// put the real timber well past it, while their levels disagree by an order of
// magnitude because in these photographs a door is never lit as the wall beside
// it is. So the hue comes from that measurement and the level comes from the
// requirement the render exposes - the joinery has to be legible as joinery.
//
// TARGET is a lit walnut face read off the hall photographs (hol-door-a, the
// door leaf in daylight measures around sRGB 110,70,55 lit and 70,45,38 in its
// own shade). It sits between the two estimators, it triples the red the hue
// measurement says is missing, and it leaves the timber clearly darker than the
// plaster around it - which the photographs also show.
//
// The map is scaled in linear light so the grain survives; only its level and
// balance move. Every asset that uses the material is re-encoded.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const MATERIAL = 'wood_dark';
// what a lit walnut face measures in the photographs
const TARGET_SRGB = [74, 45, 31];
// a sanity bound: this is a re-tone, not a repaint
const MAX_GAIN = 4.0;

const toLinear = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

// Work out the gain once, from whichever asset carries the map first.
const manifest = JSON.parse(readFileSync(FULL + '/manifest.json', 'utf8'));
const work = mkdtempSync(join(tmpdir(), 'retone-'));
let gain = null, before = null, after = null;
const changed = [];

for (const asset of manifest.assets) {
  const file = `${FULL}/${asset.file}`;
  const doc = await io.read(file);
  const root = doc.getRoot();
  const material = root.listMaterials().find((m) => m.getName() === MATERIAL);
  const texture = material?.getBaseColorTexture();
  if (!texture) continue;

  const source = join(work, 'in.webp'), target = join(work, 'out.png'), encoded = join(work, 'out.webp');
  writeFileSync(source, texture.getImage());
  const report = JSON.parse(execFileSync('python3', ['-c', `
import json, sys
import numpy as np
from PIL import Image
image = Image.open(${JSON.stringify(source)}).convert('RGB')
pixels = np.asarray(image, float) / 255.0
linear = np.where(pixels <= 0.04045, pixels / 12.92, ((pixels + 0.055) / 1.055) ** 2.4)
mean = linear.reshape(-1, 3).mean(0)
target = np.array(${JSON.stringify(TARGET_SRGB.map(toLinear))})
gain = target / mean
scaled = np.clip(linear * gain, 0, 1)
out = np.where(scaled <= 0.0031308, scaled * 12.92, 1.055 * scaled ** (1 / 2.4) - 0.055)
Image.fromarray(np.clip(out * 255, 0, 255).astype('uint8')).save(${JSON.stringify(target)})
print(json.dumps({'gain': gain.tolist(), 'before': mean.tolist(),
                  'after': scaled.reshape(-1, 3).mean(0).tolist()}))
`], { encoding: 'utf8' }).trim());

  if (gain === null) {
    gain = report.gain; before = report.before; after = report.after;
    if (Math.max(...gain) > MAX_GAIN)
      throw new Error(`gain ${gain.map((g) => g.toFixed(2)).join(', ')} exceeds ${MAX_GAIN}; that is a repaint, not a re-tone`);
    console.log('map mean linear', before.map((v) => v.toFixed(4)).join(', '),
      '-> gain', gain.map((v) => v.toFixed(2)).join(', '),
      '-> ', after.map((v) => v.toFixed(4)).join(', '));
  }
  execFileSync('python3', ['-c', `
from PIL import Image
Image.open(${JSON.stringify(target)}).save(${JSON.stringify(encoded)}, 'WEBP', quality=92, method=6)
`]);
  texture.setImage(readFileSync(encoded)).setMimeType('image/webp');

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
  changed.push(asset.id);
  console.log(`${asset.id}: timber re-toned, ${raw.length} bytes`);
}

if (!changed.length) throw new Error(`no asset carries a ${MATERIAL} base colour map`);
writeFileSync(FULL + '/manifest.json', JSON.stringify(manifest, null, 2));
writeFileSync(ROOT + '/build/timber-retone-r41.json', JSON.stringify({
  generated_for: 'R41', material: MATERIAL, target_srgb: TARGET_SRGB,
  map_mean_linear_before: before.map((v) => +v.toFixed(5)),
  map_mean_linear_after: after.map((v) => +v.toFixed(5)),
  gain: gain.map((v) => +v.toFixed(4)),
  red_over_blue_before: +(before[0] / before[2]).toFixed(2),
  red_over_blue_after: +(after[0] / after[2]).toFixed(2),
  assets: changed,
}, null, 2));
console.log(`${changed.join(', ')} re-toned; red/blue ${(before[0] / before[2]).toFixed(2)} -> ${(after[0] / after[2]).toFixed(2)}`);
