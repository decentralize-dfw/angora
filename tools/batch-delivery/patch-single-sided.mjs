// Task 1.4 — turn the delivery's unconditional doubleSided off, in place.
//
// build.mjs:~84 stamps every batched material setDoubleSided(true), so all
// ~3.1 M triangles pay backface shading in closed volumes. The source scene
// is not available to rebuild from (BLOCKED H6); this patches the published
// GLBs' JSON chunks directly via patch-glb.mjs, keeps every material that
// genuinely needs both faces (blend/mask alpha, foliage-like names), and
// re-stamps each part's gpu_sha256 in the manifest - native-delivery.js uses
// that hash as the ?v= cache-buster, so a stale hash would silently serve
// the OLD file and fake a null result.
//
//   node tools/batch-delivery/patch-single-sided.mjs [--dry]
//
// Report: build/web/batched/single-sided-report.json (per material, with
// the reason a side was kept). Runtime valve: ?features=singleSided:0
// forces DoubleSide back per material without re-patching.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {patchGlbJson} from './patch-glb.mjs';

// Thin or cutout growth and drapery is modelled as single surfaces on
// purpose; culling them would delete their far side. Named materials added
// here after A/B review carry their reason in KEEP_NAMED.
const PRESERVE = /foliage|leaf|leaves|needle|hedge|curtain|sheer|fabric|blind|grass/i;
const KEEP_NAMED = new Map([
  // 'material name' -> 'reason recorded by A/B review'
]);

const dry = process.argv.includes('--dry');
const base = path.join(fileURLToPath(new URL('../../', import.meta.url)), 'build/web/batched');
const report = [];

for (const profile of ['desktop', 'mobile']) {
  const manifestPath = path.join(base, profile, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  for (const part of manifest.parts) {
    const file = path.join(base, profile, part.file);
    const flipped = [], kept = [];
    const out = await patchGlbJson(file, doc => {
      for (const material of doc.materials ?? []) {
        const names = material.extras?.angoraBatch?.materials ?? [material.name];
        const namedKeep = names.find(name => KEEP_NAMED.has(name));
        const needs = material.alphaMode === 'BLEND' || material.alphaMode === 'MASK'
          || names.some(name => PRESERVE.test(name)) || Boolean(namedKeep);
        if (material.doubleSided && !needs) { material.doubleSided = false; flipped.push(material.name); }
        else kept.push(material.name + (material.doubleSided
          ? ' (kept: ' + (namedKeep ? KEEP_NAMED.get(namedKeep)
            : material.alphaMode === 'BLEND' || material.alphaMode === 'MASK' ? material.alphaMode
            : 'preserve-name') + ')'
          : ' (already single-sided)'));
      }
    });
    if (!dry) {
      await fs.writeFile(file, out);
      part.gpu_sha256 = createHash('sha256').update(out).digest('hex');
      part.bytes = out.length;
    }
    report.push({profile, part: part.name, bytes: out.length, flipped, kept});
    console.log(`${profile}/${part.name}: ${flipped.length} flipped, ${kept.length} kept${dry ? ' (dry)' : ''}`);
  }
  if (!dry) await fs.writeFile(manifestPath, JSON.stringify(manifest));
}

await fs.writeFile(path.join(base, 'single-sided-report.json'), JSON.stringify(report, null, 2));
console.log('Wrote', path.join(base, 'single-sided-report.json'));
