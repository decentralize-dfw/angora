// R44 | Where the house already opens to the outside, measured off its frames.
//
// Every external doorway in the delivery stands open - the R33 pass parked
// the leaves against the jambs - so nothing needs to move for "balkonlara ve
// bahçelere çıkabilmeliyiz"; what was missing was the walking surface beyond
// the sill and the sill cells themselves, which the original grid masked
// under its wall buffer. Each doorway is found from its own fabric - the two
// `External doorway frame rail` bars that span an opening - and written to
// build/door-open-r44.json as a walk passage: the opening's clear width,
// carried 45 cm to both sides of the wall, at the storey's own datum. The
// navigation pass clears exactly these sills and nothing else.
//
// (A first version also gathered the `SHUTTER AİM` louvres to the head, on
// the reading that they were roller blinds hanging across the openings. They
// are the slat infill of the shutter leaves themselves, parked open beside
// the doorways - the edit visibly creased them and moved nothing that
// blocked, so it is gone. The louvres stay passable in the walk instead.)
import { writeFileSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const DATUMS = [0, 3.0996, 6.3714, 9.4705];
const RAIL = /^R33 \| External doorway frame rail/;
const SILL_REACH = 0.45;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

const worldBounds = (node) => {
  const m = node.getWorldMatrix();
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const prim of node.getMesh().listPrimitives()) {
    const pos = prim.getAttribute('POSITION').getArray();
    for (let i = 0; i < pos.length; i += 3) {
      const w = [m[0] * pos[i] + m[4] * pos[i + 1] + m[8] * pos[i + 2] + m[12],
                 m[1] * pos[i] + m[5] * pos[i + 1] + m[9] * pos[i + 2] + m[13],
                 m[2] * pos[i] + m[6] * pos[i + 1] + m[10] * pos[i + 2] + m[14]];
      for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], w[a]); hi[a] = Math.max(hi[a], w[a]); }
    }
  }
  return { lo, hi };
};

const passages = [];
const report = [];
for (const id of ['level-0', 'level-1', 'level-2']) {
  const doc = await io.read(`${FULL}/${id}.glb`);
  const rails = doc.getRoot().listNodes()
    .filter((n) => n.getMesh() && RAIL.test(n.getName().replace(/_/g, ' ')))
    .map((n) => ({ n, ...worldBounds(n) }));
  const doorways = [];
  for (const rail of rails) {
    const along = (rail.hi[0] - rail.lo[0]) > (rail.hi[2] - rail.lo[2]) ? 0 : 2;
    const across = along === 0 ? 2 : 0;
    const match = doorways.find((d) => d.along === along &&
      Math.abs(d.lo[along] - rail.lo[along]) < 0.05 && Math.abs(d.hi[along] - rail.hi[along]) < 0.05 &&
      Math.abs((d.lo[across] + d.hi[across]) / 2 - (rail.lo[across] + rail.hi[across]) / 2) < 0.10);
    if (match) {
      match.headY = Math.max(match.headY, rail.lo[1]);
      match.floorY = Math.min(match.floorY, rail.hi[1]);
      match.rails++;
    } else {
      doorways.push({ along, across, lo: rail.lo, hi: rail.hi,
        headY: rail.lo[1], floorY: rail.hi[1], rails: 1 });
    }
  }
  const complete = doorways.filter((d) => d.rails >= 2 && d.headY - d.floorY > 1.6);
  console.log(id, `${complete.length} open doorway(s)`);
  for (const d of complete) {
    const floor = DATUMS.reduce((best, v, f) => Math.abs(v - d.floorY) < Math.abs(DATUMS[best] - d.floorY) ? f : best, 0);
    const wallMid = (d.lo[d.across] + d.hi[d.across]) / 2;
    const rect = { x: [0, 0], z: [0, 0] };
    const alongKey = d.along === 0 ? 'x' : 'z', acrossKey = d.along === 0 ? 'z' : 'x';
    rect[alongKey] = [d.lo[d.along] + 0.06, d.hi[d.along] - 0.06];
    rect[acrossKey] = [wallMid - SILL_REACH, wallMid + SILL_REACH];
    passages.push({ floor, x: rect.x.map((v) => +v.toFixed(3)), z: rect.z.map((v) => +v.toFixed(3)), deck: DATUMS[floor] });
    report.push({ level: id, floor, opening: { [alongKey]: rect[alongKey].map((v) => +v.toFixed(3)), wall_mid: +wallMid.toFixed(3) },
      head_y: +d.headY.toFixed(3), floor_y: +d.floorY.toFixed(3) });
  }
}
writeFileSync(ROOT + '/build/door-open-r44.json', JSON.stringify({
  generated_for: 'R44', sill_reach_m: SILL_REACH, doorways: report, passages,
}, null, 2));
console.log('door-open-r44.json:', passages.length, 'passages');
