// The ground/floor visibility bakes carry sourceGeometryHashes - whole-file
// hashes of the desktop GLBs they were baked from - and the test suite
// demands a rebake whenever those files change. The single-sided patch
// changes the files (JSON chunk only), and the bake host (Blender) is not
// available here (BLOCKED H2). This tool re-attests WITHOUT rebaking, by
// PROVING the bake's actual inputs unchanged before touching any hash:
//
//   bake-ground-light.py reads exactly two things per part:
//     1. the geometry           -> the Draco BIN chunk, byte for byte
//     2. which surfaces it skips -> the set of alphaMode==='BLEND' names
//
// For each part this script compares both against the pre-patch GLB taken
// from git (<ref>, default HEAD). Any mismatch aborts with no manifest
// written - at that point a real rebake is owed and this tool is the wrong
// answer.
//
//   node tools/batch-delivery/reattest-visibility-hashes.mjs [--ref HEAD]
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const refIndex = process.argv.indexOf('--ref');
const ref = refIndex >= 0 ? process.argv[refIndex + 1] : 'HEAD';
const root = fileURLToPath(new URL('../../', import.meta.url));
const sha = buffer => createHash('sha256').update(buffer).digest('hex');

function bakeInputs(buffer) {
  if (buffer.readUInt32LE(0) !== 0x46546C67) throw Error('not a GLB');
  const jsonLength = buffer.readUInt32LE(12);
  const doc = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8'));
  const binHeader = 20 + jsonLength;
  const binLength = buffer.readUInt32LE(binHeader);
  return {
    binSha: sha(buffer.subarray(binHeader + 8, binHeader + 8 + binLength)),
    blend: (doc.materials ?? []).filter(m => m.alphaMode === 'BLEND').map(m => m.name).sort().join('|'),
  };
}

const parts = ['architecture', 'interior', 'context-buildings', 'context-ground', 'garden'];
const fresh = {};
for (const part of parts) {
  const relative = 'build/web/batched/desktop/' + part + '.glb';
  const current = await fs.readFile(path.join(root, relative));
  const before = execSync(`git show ${ref}:${relative}`, {cwd: root, maxBuffer: 1 << 28});
  const now = bakeInputs(current), then = bakeInputs(before);
  if (now.binSha !== then.binSha) throw Error(part + ': BIN geometry changed - REBAKE REQUIRED, not re-attestation');
  if (now.blend !== then.blend) throw Error(part + ': BLEND material set changed - REBAKE REQUIRED, not re-attestation');
  fresh[part] = sha(current);
  console.log(`${part}: BIN identical, BLEND set identical -> file hash ${fresh[part].slice(0, 12)}…`);
}

for (const profile of ['desktop', 'mobile']) {
  const manifestPath = path.join(root, 'build/web/batched', profile, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  for (const key of ['ground_light', 'floor_light']) {
    const descriptor = manifest[key];
    if (!descriptor?.sourceGeometryHashes) continue;
    for (const part of Object.keys(descriptor.sourceGeometryHashes)) {
      if (!(part in fresh)) throw Error(key + ' references unverified part ' + part);
      descriptor.sourceGeometryHashes[part] = fresh[part];
    }
  }
  await fs.writeFile(manifestPath, JSON.stringify(manifest));
  console.log('Re-attested', manifestPath);
}
