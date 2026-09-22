// Task 1.2-b — a shadow-only stand-in for the sun's depth pass.
//
// The dynamic sun never renders the real 3.1 M-triangle scene into its
// shadow map; it renders THIS: architecture + garden welded and simplified
// to a few tens of thousands of triangles, glass and blend surfaces dropped
// (glass must not block sun - lighting.js already keeps castShadow off the
// real panes). Runs from the published batched GLBs, so no source scene is
// needed (BLOCKED H6). Output: build/web/batched/{profile}/shadow-proxy.glb
// plus a manifest entry with bytes + gpu_sha256 for the ?v= cache-buster.
//
//   node tools/batch-delivery/build-shadow-proxy.mjs [--ratio 0.06] [--dry]
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {weld, simplify, prune, dedup, draco} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import draco3d from 'draco3dgltf';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf('--' + name);
  return at >= 0 ? args[at + 1] : fallback;
};
const dry = args.includes('--dry');
const ratio = Number(option('ratio', '0.06'));
const error = Number(option('error', '0.01'));
const base = path.join(fileURLToPath(new URL('../../', import.meta.url)), 'build/web/batched');

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

const report = [];
for (const profile of ['desktop', 'mobile']) {
  const root = path.join(base, profile);
  const manifestPath = path.join(root, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const document = await io.read(path.join(root, 'architecture.glb'));
  const garden = await io.read(path.join(root, 'garden.glb'));
  document.merge(garden);
  // One scene; merge() leaves each file's scene separate.
  const rootScene = document.getRoot().listScenes()[0];
  for (const scene of document.getRoot().listScenes().slice(1)) {
    for (const child of scene.listChildren()) rootScene.addChild(child);
    scene.dispose();
  }
  let dropped = 0, before = 0;
  for (const mesh of document.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      before += (primitive.getIndices()?.getCount() ?? primitive.getAttribute('POSITION').getCount()) / 3;
      const material = primitive.getMaterial();
      // Glass and cutout foliage must not block the sun; the beauty scene
      // keeps castShadow=false on them too. MASK stays (a hedge still shades).
      if (material && material.getAlphaMode() === 'BLEND') { mesh.removePrimitive(primitive); dropped++; continue; }
      // The depth pass reads position only.
      for (const semantic of primitive.listSemantics()) {
        if (semantic !== 'POSITION') primitive.setAttribute(semantic, null);
      }
      primitive.setMaterial(null);
    }
  }
  await document.transform(
    dedup(),
    weld(),
    simplify({simplifier: MeshoptSimplifier, ratio, error}),
    prune(),
    draco(),
  );
  let after = 0;
  for (const mesh of document.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      after += (primitive.getIndices()?.getCount() ?? primitive.getAttribute('POSITION').getCount()) / 3;
    }
  }
  const bytes = await io.writeBinary(document);
  const entry = {profile, triangles: {before: Math.round(before), after: Math.round(after)},
    droppedBlendPrimitives: dropped, bytes: bytes.length};
  report.push(entry);
  console.log(`${profile}: ${entry.triangles.before} → ${entry.triangles.after} tris, ` +
    `${dropped} blend primitives dropped, ${(bytes.length / 1024).toFixed(0)} KB${dry ? ' (dry)' : ''}`);
  if (after > 80_000) throw Error(profile + ' proxy exceeds the 80k triangle budget: ' + after);
  if (!dry) {
    await fs.writeFile(path.join(root, 'shadow-proxy.glb'), bytes);
    manifest.shadow_proxy = {file: 'shadow-proxy.glb', bytes: bytes.length,
      triangles: Math.round(after), gpu_sha256: createHash('sha256').update(bytes).digest('hex')};
    await fs.writeFile(manifestPath, JSON.stringify(manifest));
  }
}
await fs.writeFile(path.join(base, 'shadow-proxy-report.json'), JSON.stringify(report, null, 2));
console.log('Wrote', path.join(base, 'shadow-proxy-report.json'));
