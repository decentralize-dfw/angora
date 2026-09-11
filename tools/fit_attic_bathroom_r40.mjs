// R40 | Get the attic shower out of its own doorway.
//
// Attic bathroom C03 is 1.99 x 2.74 m with its door in the south wall at
// x 0.45..0.80, and the leaf swings inward along the west wall
// (x -0.07..0.11, z -6.08..-5.28). The quadrant shower was standing in the
// south-WEST corner, x 0.08..0.99 by z -6.25..-5.35 - across the opening and
// inside the swing, so the plan showed you walking into the enclosure.
//
// The photographs (build/reference/kat_3_banyok_1.jpg) show the arrangement
// the room actually has: a quadrant enclosure in a corner, the vanity along
// the wall beside it and the wc next to the shower. The basin (north-west) and
// the wc (north-east) are already where the photographs put them; only the
// shower is in the wrong corner, so it moves to the free one - south-east -
// and the towel rack goes to the west wall north of the door swing.
//
// A quadrant is not symmetric about a vertical axis: its two straight sides
// have to meet the two walls of its corner. Moving south-west to south-east
// therefore mirrors it in x rather than sliding it, about the plane that lands
// its straight sides on z = -5.35 and x = 1.895. The mirror is applied to each
// node's matrix (glTF permits a negative determinant and three flips the front
// face for it), which keeps every part's own rotation intact.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const SHOWER = /^R33 \| (Quadrant molded shower tray|Shower curved track|Shower upright|Fixed curved shower glazing|Open sliding shower leaf|Shower sliding pull|Shower drain|Shower handset|Shower hose|Shower riser)/;
const RACK = /^R33 \| Rack (round upright|shelf)/;
const MIRROR_X = 0.9875;          // lands x 0.08..0.99 on 0.985..1.895
const RACK_SHIFT = [-1.08, 0, -1.21];
const ROOM = { x0: -0.0949, x1: 1.8945, z0: -8.046, z1: -5.3073 };   // space f3-S3
const DOOR_SWING = { x0: -0.12, x1: 0.16, z0: -6.13, z1: -5.23 };    // leaf + clearance
const WC = { x0: 1.16, x1: 1.54, z0: -7.99, z1: -7.29 };
const BASIN = { x0: 0.07, x1: 0.63, z0: -7.99, z1: -7.55 };

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(FULL + '/level-3.glb');
const root = doc.getRoot();
const inRoom = (n) => {
  const wm = n.getWorldMatrix(), mesh = n.getMesh(); if (!mesh) return false;
  const pos = mesh.listPrimitives()[0]?.getAttribute('POSITION'); if (!pos) return false;
  const a = pos.getArray();
  const x = wm[0]*a[0]+wm[4]*a[1]+wm[8]*a[2]+wm[12], z = wm[2]*a[0]+wm[6]*a[1]+wm[10]*a[2]+wm[14];
  return x > ROOM.x0 - 0.3 && x < ROOM.x1 + 0.3 && z > ROOM.z0 - 0.3 && z < ROOM.z1 + 0.3;
};
const shower = root.listNodes().filter((n) => SHOWER.test(n.getName()) && inRoom(n));
const rack = root.listNodes().filter((n) => RACK.test(n.getName()) && inRoom(n));
if (shower.length < 12) throw new Error('shower parts not found: ' + shower.length);
if (!rack.length) throw new Error('rack parts not found');

function bounds(nodes) {
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const node of nodes) {
    const wm = node.getWorldMatrix();
    for (const prim of node.getMesh().listPrimitives()) {
      const pos = prim.getAttribute('POSITION'); if (!pos) continue;
      const a = pos.getArray();
      for (let i = 0; i < a.length; i += 3) {
        const w = [wm[0]*a[i]+wm[4]*a[i+1]+wm[8]*a[i+2]+wm[12],
                   wm[1]*a[i]+wm[5]*a[i+1]+wm[9]*a[i+2]+wm[13],
                   wm[2]*a[i]+wm[6]*a[i+1]+wm[10]*a[i+2]+wm[14]];
        for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], w[k]); mx[k] = Math.max(mx[k], w[k]); }
      }
    }
  }
  return { mn, mx };
}
const show = (label, b) => console.log(label,
  'x', b.mn[0].toFixed(3), '..', b.mx[0].toFixed(3), ' z', b.mn[2].toFixed(3), '..', b.mx[2].toFixed(3));
show('shower before:', bounds(shower));
show('rack before:  ', bounds(rack));

// column-major 4x4: Mirror(x about MIRROR_X) * M
for (const node of shower) {
  if (node.getParentNode && node.getParentNode()) throw new Error('unexpected parent on ' + node.getName());
  const m = Array.from(node.getWorldMatrix());
  for (const column of [0, 4, 8, 12]) m[column] = -m[column];
  m[12] += 2 * MIRROR_X;
  node.setMatrix(m);
}
for (const node of rack) {
  const t = node.getTranslation();
  node.setTranslation([t[0] + RACK_SHIFT[0], t[1] + RACK_SHIFT[1], t[2] + RACK_SHIFT[2]]);
}
const after = bounds(shower), rackAfter = bounds(rack);
show('shower after: ', after);
show('rack after:   ', rackAfter);

const overlaps = (b, box) => b.mx[0] > box.x0 && b.mn[0] < box.x1 && b.mx[2] > box.z0 && b.mn[2] < box.z1;
for (const [name, box] of [['the door swing', DOOR_SWING], ['the wc', WC], ['the basin', BASIN]]) {
  if (overlaps(after, box)) throw new Error('shower still overlaps ' + name);
  if (overlaps(rackAfter, box)) throw new Error('rack overlaps ' + name);
}
if (overlaps(after, {x0: rackAfter.mn[0], x1: rackAfter.mx[0], z0: rackAfter.mn[2], z1: rackAfter.mx[2]}))
  throw new Error('shower overlaps the rack');
for (const b of [after, rackAfter])
  if (b.mn[0] < ROOM.x0 - 0.01 || b.mx[0] > ROOM.x1 + 0.01 || b.mn[2] < ROOM.z0 - 0.01 || b.mx[2] > ROOM.z1 + 0.01)
    throw new Error('a moved fitting left the room');
console.log('clear of the door swing, the wc, the basin and each other, inside the room');

for (const ext of root.listExtensionsUsed())
  if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
const plain = FULL + '/level-3.plain.glb';
writeFileSync(plain, await io.writeBinary(doc));
execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, FULL + '/level-3.glb',
  '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
execFileSync('rm', [plain]);
const manifest = JSON.parse(readFileSync(FULL + '/manifest.json', 'utf8'));
const asset = manifest.assets.find((a) => a.id === 'level-3');
asset.bytes = statSync(FULL + '/level-3.glb').size;
asset.sha256 = createHash('sha256').update(readFileSync(FULL + '/level-3.glb')).digest('hex');
writeFileSync(FULL + '/manifest.json', JSON.stringify(manifest, null, 2));
console.log('level-3.glb re-encoded:', asset.bytes, 'bytes');
