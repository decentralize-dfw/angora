// KAPANIS.md md. 5/8/9 - coverage COUNTED against the delivery's own batch
// member names, read straight out of the shipped GLB JSON chunks (no
// hardcoded lists, no hopes).
//
//   node tools/qa/coverage-count.mjs [build/web/batched/desktop]
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {detailFor} from '../../viewer/src/procedural-detail.js';
import {glassPolishMask} from '../../viewer/src/glass-cells.js';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const root = path.resolve(repo, process.argv[2] ?? 'build/web/batched/desktop');
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));

const gltfJson = buffer => {
  const jsonLength = buffer.readUInt32LE(12);
  return JSON.parse(buffer.subarray(20, 20 + jsonLength).toString());
};

let members = 0;
const uDetail = {exterior: [], interior: []};
const glass = [];
for (const part of manifest.parts) {
  const json = gltfJson(await readFile(path.join(root, part.file)));
  for (const material of json.materials ?? []) {
    const batch = material.extras?.angoraBatch;
    if (!batch) continue;
    members += batch.materials.length;
    for (const name of batch.materials) {
      const value = detailFor(name, {interior: true});
      if (!(value.x || value.y)) continue;
      const entry = `${part.name}::${name}`;
      // interior rows are the ones detailFor zeroes when the switch is off
      const off = detailFor(name, {interior: false});
      (off.x || off.y ? uDetail.exterior : uDetail.interior).push(entry);
    }
    const mask = glassPolishMask(batch);
    if (mask) for (const [i, hit] of mask.entries()) {
      if (hit) glass.push(`${part.name}::${material.name}[${i}]=${batch.materials[i]}`);
    }
  }
}

console.log(`batch member cells total: ${members}`);
console.log(`uDetail exterior non-zero: ${uDetail.exterior.length}  (kabul >= 20)`);
for (const row of uDetail.exterior) console.log('  dış  ' + row);
console.log(`uDetail interior non-zero: ${uDetail.interior.length}  (kabul >= 6)`);
for (const row of uDetail.interior) console.log('  iç   ' + row);
console.log(`glassTiersV2 polish cells: ${glass.length}  (kabul > 0)`);
for (const row of glass) console.log('  cam  ' + row);
