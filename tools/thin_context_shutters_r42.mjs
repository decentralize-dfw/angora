// R42 | Take the louvre blades off the neighbours' shutters.
//
// "ve yavaşlamış bu? sebebi nedir??" - measured against the build before the
// two review rounds the delivery is not heavier: 9.276 M triangles then,
// 9.297 M now, 6311 draws then, 6312 now, and 4 MB smaller on the wire. What
// the reviews did add is an up-to-8 s shader pre-compile before the first
// frame, and R42 now holds the opening until the whole scene is in, which is
// what was asked for. So the honest answer is to make the scene itself
// lighter, and there is one place where that is free.
//
// `B## | PENCERE_KAPI$SHUTTER AİM` is the louvre blade stack inside the
// neighbours' shutters: 1,250,130 triangles across 40 nodes, 27.7% of
// context.glb and 13.5% of the whole scene. Those buildings are drawn as white
// massing the moment the camera settles on the villa, and even in the region
// view they are tens of metres away - a 20 mm blade is far under a pixel. The
// shutter panel, its frame, the window frame and the glazing all stay, so the
// façades keep their rhythm; only the blades inside go.
//
// The villa's own shutters are untouched. They live in level-*/envelope, and
// the match here is the viewer's own neighbour-block prefix.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const FILE = FULL + '/context.glb';
// the viewer's own neighbour-block test, and the louvre layer inside it
const BLOCK = /^B\d+(\s|$)/;
const LOUVRE = /\$SHUTTER AİM(\.\d+)?$/;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(FILE);
const root = doc.getRoot();

const count = (mesh) => mesh.listPrimitives()
  .reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0);

let before = 0, draws = 0;
for (const node of root.listNodes()) { const mesh = node.getMesh(); if (mesh) { before += count(mesh); draws += mesh.listPrimitives().length; } }

const dropped = [];
for (const node of root.listNodes()) {
  const mesh = node.getMesh(); if (!mesh) continue;
  const name = node.getName().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  if (!BLOCK.test(name) || !LOUVRE.test(name)) continue;
  dropped.push({ node: name, triangles: count(mesh) });
  node.dispose(); mesh.dispose();
}
if (!dropped.length) throw new Error('no neighbour shutter louvres found; already thinned?');

await doc.transform(prune());
let after = 0, afterDraws = 0;
for (const node of root.listNodes()) { const mesh = node.getMesh(); if (mesh) { after += count(mesh); afterDraws += mesh.listPrimitives().length; } }
console.log(`${dropped.length} louvre nodes removed: ${before} -> ${after} triangles ` +
  `(${(100 * (before - after) / before).toFixed(1)}% of the neighbourhood), ${draws} -> ${afterDraws} draws`);

for (const ext of root.listExtensionsUsed())
  if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
const plain = FILE + '.plain.glb';
writeFileSync(plain, await io.writeBinary(doc));
execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, FILE,
  '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
unlinkSync(plain);

const manifest = JSON.parse(readFileSync(FULL + '/manifest.json', 'utf8'));
const asset = manifest.assets.find((a) => a.id === 'context');
const wasBytes = asset.bytes;
const raw = readFileSync(FILE);
asset.bytes = raw.length;
asset.sha256 = createHash('sha256').update(raw).digest('hex');
writeFileSync(FULL + '/manifest.json', JSON.stringify(manifest, null, 2));
writeFileSync(ROOT + '/build/context-shutter-thinning-r42.json', JSON.stringify({
  generated_for: 'R42', nodes_removed: dropped.length,
  triangles_before: before, triangles_after: after,
  draws_before: draws, draws_after: afterDraws,
  bytes_before: wasBytes, bytes_after: raw.length,
  dropped,
}, null, 2));
console.log(`context.glb ${wasBytes} -> ${raw.length} bytes`);
