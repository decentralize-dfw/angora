// R40 | Export the triangles the section plane can cut, other than the walls.
//
// The wall cap has always come from build/intermediate/wall-triangles.json, so
// a plan cut through a wardrobe, a door leaf or a kitchen tall unit showed the
// inside of the object rather than a cut through it. This dumps every other
// body the plane can meet, in world space, so tools/build_object_caps_r40.py
// can section them the same way.
//
// Left out on purpose:
//   * category 'wall' - already in the atlas, and cutting it twice would
//     double-draw the poché;
//   * floor and ceiling slabs - horizontal, never met by a horizontal plane
//     at a storey's viewing height, and a waste of triangles if they were;
//   * glazing and mirrors - a section draws cut glass as a line, not as a
//     poché, and filling a window with black would close the elevation;
//   * anything with no triangle in the atlas's height range at all.
//
// Output per level: <out>/caps-<id>.bin — a float32 triangle soup, and
// <out>/caps-<id>.json — the byte counts and the furniture split, so the
// python side can keep the two apart for the furniture toggle.
import { mkdirSync, writeFileSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const FULL = '/home/user/angora/build/web/full';
const OUT = process.argv[2] || '/home/user/angora/build/intermediate/object-caps-r40';
const LEVELS = ['level-0', 'level-1', 'level-2', 'level-3'];
const SLAB = /\$(ZEMİN|TAVAN)( KAPLAMA)?$/;
const GLAZING = /glass|mirror|cam yüzey/i;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
});
mkdirSync(OUT, { recursive: true });

for (const id of LEVELS) {
  const doc = await io.read(`${FULL}/${id}.glb`);
  const fixed = [], furniture = [];
  let skippedSlab = 0, skippedGlass = 0, skippedWall = 0;
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh(); if (!mesh) continue;
    const extras = node.getExtras() || {};
    if (extras.category === 'wall') { skippedWall++; continue; }
    if (SLAB.test(extras.source_layer || node.getName())) { skippedSlab++; continue; }
    const sink = extras.category === 'furniture' ? furniture : fixed;
    const wm = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const name = prim.getMaterial()?.getName() || '';
      if (GLAZING.test(name)) { skippedGlass++; continue; }
      const pos = prim.getAttribute('POSITION'); if (!pos) continue;
      const a = pos.getArray(), idx = prim.getIndices()?.getArray();
      const count = idx ? idx.length : pos.getCount();
      const at = (i) => {
        const o = i * 3, x = a[o], y = a[o + 1], z = a[o + 2];
        return [wm[0] * x + wm[4] * y + wm[8] * z + wm[12],
                wm[1] * x + wm[5] * y + wm[9] * z + wm[13],
                wm[2] * x + wm[6] * y + wm[10] * z + wm[14]];
      };
      for (let t = 0; t + 2 < count; t += 3) {
        const v = [at(idx ? idx[t] : t), at(idx ? idx[t + 1] : t + 1), at(idx ? idx[t + 2] : t + 2)];
        // a triangle the plane can never meet is a triangle we never ship
        const lo = Math.min(v[0][1], v[1][1], v[2][1]), hi = Math.max(v[0][1], v[1][1], v[2][1]);
        if (hi - lo < 1e-7) continue;
        sink.push(v[0][0], v[0][1], v[0][2], v[1][0], v[1][1], v[1][2], v[2][0], v[2][1], v[2][2]);
      }
    }
  }
  const bytes = Float32Array.from(fixed.concat(furniture));
  writeFileSync(`${OUT}/caps-${id}.bin`, Buffer.from(bytes.buffer));
  writeFileSync(`${OUT}/caps-${id}.json`, JSON.stringify({
    level: id, fixed_triangles: fixed.length / 9, furniture_triangles: furniture.length / 9,
    skipped: { wall: skippedWall, slab: skippedSlab, glazing_primitives: skippedGlass },
  }, null, 1));
  console.log(id, 'fixed', fixed.length / 9, 'furniture', furniture.length / 9,
    '| skipped wall', skippedWall, 'slab', skippedSlab, 'glazing prims', skippedGlass);
}
