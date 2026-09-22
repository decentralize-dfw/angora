// Task 1.4 — turn unconditional doubleSided off where it is actually safe.
//
// build.mjs stamps every batched material setDoubleSided(true). The A/B on
// the gate frames showed how much of this delivery is single-surface
// authored: the context "additions" are MIRRORED copies of the B4 objects
// (mirroring reverses winding - their walls vanish when culled), the
// interior linings and ceilings are single planes seen from their back
// side, and the garden's retaining walls shard the pool side. Only the
// villa's exterior shell (architecture.glb) is closed, consistently wound
// volume - so only it flips. The rest keeps its authored sides until the
// source is repaired in Blender (BLOCKED H4), and each skipped part carries
// its measured reason in the report.
//
//   node tools/batch-delivery/patch-single-sided.mjs [--dry]
//
// GLB surgery via patch-glb.mjs (Draco BIN byte-guarded); every touched
// manifest part gets a fresh gpu_sha256 - the ?v= cache-buster that would
// otherwise serve stale bytes and fake a null result. Runtime valve:
// ?features=singleSided:0 puts DoubleSide back per material.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {patchGlbJson} from './patch-glb.mjs';

// Parts the flip is allowed to touch. The villa is OUT: its walls are a
// two-skin shell (STRUCCO facing the street, INTERIOR facing the room), and
// the storey-cut views look at the INTERIOR skin's face - flipping the
// shell deleted the walls from every cut view (owner-reported, C07).
// The neighbourhood is where the triangles are anyway: context-buildings
// (1.02 M) + context-ground (0.31 M) beat the shell's 842 k, and neither is
// ever seen from inside. Mirrored materials that lose faces are pulled back
// individually via KEEP_NAMED with the gate's numbers as evidence.
const FLIP_PARTS = new Set(['context-buildings', 'context-ground']);
// Why the rest stays authored (gate A/B evidence, desktop frames):
const SKIP_REASONS = {
  architecture: 'two-skin shell - cut views face the INTERIOR skin; flipping deleted walls (C07, owner)',
  interior: 'linings and ceilings are single planes - the salon ceiling vanished from below',
  garden: 'retaining walls and pool surrounds shard when back faces cull',
  'context-plants': 'planting is cutout single-surface foliage by design',
};
// Within a flipped part: alpha-blended/masked surfaces and single-surface
// growth or drapery keep both faces; names added here after review carry
// their reason.
const PRESERVE = /foliage|leaf|leaves|needle|hedge|curtain|sheer|fabric|blind|grass/i;
const KEEP_NAMED = new Map([
  // (architecture findings from the withdrawn shell flip stay recorded in
  // git history and H4; the shell no longer flips at all.)
]);

const dry = process.argv.includes('--dry');
const base = path.join(fileURLToPath(new URL('../../', import.meta.url)), 'build/web/batched');
const report = [];

for (const profile of ['desktop', 'mobile']) {
  const manifestPath = path.join(base, profile, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  for (const part of manifest.parts) {
    if (!FLIP_PARTS.has(part.name)) {
      report.push({profile, part: part.name, skipped: SKIP_REASONS[part.name] ?? 'not in FLIP_PARTS'});
      console.log(`${profile}/${part.name}: kept authored (${SKIP_REASONS[part.name] ?? 'not in FLIP_PARTS'})`);
      continue;
    }
    const file = path.join(base, profile, part.file);
    const flipped = [], kept = [];
    // The foliage regex protects cutout CARDS; the terrain's 'grass' is a
    // ground skin seen from above and must not hide behind the same word.
    const preserveApplies = part.name !== 'context-ground';
    const out = await patchGlbJson(file, doc => {
      for (const material of doc.materials ?? []) {
        const names = material.extras?.angoraBatch?.materials ?? [material.name];
        const namedKeep = names.find(name => KEEP_NAMED.has(name));
        const needs = material.alphaMode === 'BLEND' || material.alphaMode === 'MASK'
          || (preserveApplies && names.some(name => PRESERVE.test(name))) || Boolean(namedKeep);
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
