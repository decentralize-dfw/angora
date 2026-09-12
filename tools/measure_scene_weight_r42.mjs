// R42 | What the scene actually costs, then and now.
//
// "ve yavaşlamış bu? sebebi nedir??" deserves a measurement rather than an
// opinion. This counts what the renderer pays for every frame - triangles,
// draw calls, vertices, materials - across a whole delivery, and compares two
// of them. Pass a git revision to have the older delivery extracted and
// counted beside the working tree's.
//
//   node tools/measure_scene_weight_r42.mjs 6688871
//
// 6688871 is the last build before the review rounds began.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const ASSETS = ['level-0', 'level-1', 'level-2', 'level-3', 'envelope', 'garden', 'context'];
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
});

async function weigh(dir) {
  const per = {}, heaviest = [];
  let triangles = 0, draws = 0, vertices = 0, materials = 0, bytes = 0;
  for (const id of ASSETS) {
    const file = `${dir}/${id}.glb`;
    const doc = await io.read(file);
    let t = 0, d = 0, v = 0;
    for (const node of doc.getRoot().listNodes()) {
      const mesh = node.getMesh(); if (!mesh) continue;
      for (const prim of mesh.listPrimitives()) {
        const n = (prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION').getCount()) / 3;
        t += n; d++; v += prim.getAttribute('POSITION').getCount();
        heaviest.push({ asset: id, node: node.getName(), triangles: n });
      }
    }
    const size = statSync(file).size;
    per[id] = { triangles: t, draws: d, vertices: v, bytes: size };
    triangles += t; draws += d; vertices += v; bytes += size;
    materials += doc.getRoot().listMaterials().length;
  }
  heaviest.sort((a, b) => b.triangles - a.triangles);
  return { triangles, draws, vertices, materials, bytes, per, heaviest: heaviest.slice(0, 10) };
}

const now = await weigh(`${ROOT}/build/web/full`);
const revision = process.argv[2];
let then = null;
if (revision) {
  const work = mkdtempSync(join(tmpdir(), 'weigh-'));
  for (const id of ASSETS)
    writeFileSync(`${work}/${id}.glb`,
      execFileSync('git', ['-C', ROOT, 'show', `${revision}:build/web/full/${id}.glb`], { maxBuffer: 1 << 30, encoding: 'buffer' }));
  then = await weigh(work);
}

const line = (label, w) => `${label.padEnd(18)} ${String(w.triangles).padStart(9)} tris  ${String(w.draws).padStart(5)} draws  ` +
  `${String(w.vertices).padStart(9)} verts  ${(w.bytes / 1e6).toFixed(1).padStart(5)} MB`;
if (then) console.log(line(revision, then));
console.log(line('working tree', now));
if (then) {
  const pct = (a, b) => `${a > b ? '+' : ''}${(100 * (a - b) / b).toFixed(1)}%`;
  console.log(`change             ${pct(now.triangles, then.triangles)} triangles, ` +
    `${pct(now.draws, then.draws)} draws, ${pct(now.vertices, then.vertices)} vertices, ${pct(now.bytes, then.bytes)} bytes`);
}
console.log('\nheaviest nodes now:');
for (const h of now.heaviest) console.log(`  ${String(h.triangles).padStart(8)}  ${h.asset}  ${h.node}`);

writeFileSync(`${ROOT}/build/scene-weight-r42.json`, JSON.stringify({
  generated_for: 'R42', compared_against: revision ?? null, then, now,
}, null, 2));
