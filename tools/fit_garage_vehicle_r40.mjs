// R40 | Put a car-sized car in the garage.
//
// The bay is 3.939 m wide and 5.939 m deep (space f1-S5 in room-spaces.json).
// The delivered vehicle measures 4.450 m nose to tail and 2.030 m across the
// mirrors, and it was parked 0.55 m off the east wall against 1.36 m on the
// west - so in plan it read as a limousine shoved into one side of the bay
// rather than as a car parked in it.
//
// It is scaled to SCALE about the bay floor and centred between the four
// walls. 0.88 takes it to 3.92 x 1.79 x 1.03 m, which is a supermini with its
// mirrors out - a real car, not a shrunken prop - and leaves a 1.07 m door
// swing on each side and a metre of walking space front and back.
//
// The 97 parts are scene-root children sharing one rotation and one scale, so
// scaling about a pivot is done on the nodes: T' = P + (T - P) * k, S' = S * k.
// The wheels keep contact because the pivot sits on the garage floor.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const VEHICLE = /^R35 \| Garage vehicle/;
const SCALE = 0.88;
const BAY = { x0: 3.348, x1: 7.287, z0: -4.772, z1: 1.167 };   // f1-S5 finished faces
const FLOOR_Y = 3.104;                                          // delivered wheel contact

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(FULL + '/level-1.glb');
const root = doc.getRoot();

const parts = root.listNodes().filter((n) => VEHICLE.test(n.getName()) && n.getMesh());
if (parts.length < 90) throw new Error('vehicle parts not found: ' + parts.length);

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
  return { mn, mx, size: mx.map((v, k) => v - mn[k]) };
}

const before = bounds(parts);
console.log('before:', before.size.map((v) => +v.toFixed(3)).join(' x '),
  'at x', before.mn[0].toFixed(2), '..', before.mx[0].toFixed(2),
  'z', before.mn[2].toFixed(2), '..', before.mx[2].toFixed(2));

// scale about the car's own footprint centre on the garage floor, then slide
// the shrunken car to the middle of the bay
const pivot = [(before.mn[0] + before.mx[0]) / 2, FLOOR_Y, (before.mn[2] + before.mx[2]) / 2];
for (const node of parts) {
  if (node.getParentNode && node.getParentNode()) throw new Error('unexpected parent on ' + node.getName());
  const t = node.getTranslation(), s = node.getScale();
  node.setTranslation([pivot[0] + (t[0] - pivot[0]) * SCALE,
                       pivot[1] + (t[1] - pivot[1]) * SCALE,
                       pivot[2] + (t[2] - pivot[2]) * SCALE]);
  node.setScale([s[0] * SCALE, s[1] * SCALE, s[2] * SCALE]);
}
const scaled = bounds(parts);
const shift = [((BAY.x0 + BAY.x1) / 2) - (scaled.mn[0] + scaled.mx[0]) / 2, 0,
               ((BAY.z0 + BAY.z1) / 2) - (scaled.mn[2] + scaled.mx[2]) / 2];
for (const node of parts) {
  const t = node.getTranslation();
  node.setTranslation([t[0] + shift[0], t[1], t[2] + shift[2]]);
}
const after = bounds(parts);
console.log('after: ', after.size.map((v) => +v.toFixed(3)).join(' x '),
  'at x', after.mn[0].toFixed(2), '..', after.mx[0].toFixed(2),
  'z', after.mn[2].toFixed(2), '..', after.mx[2].toFixed(2));
const clearance = { west: after.mn[0] - BAY.x0, east: BAY.x1 - after.mx[0],
                    back: after.mn[2] - BAY.z0, front: BAY.z1 - after.mx[2] };
console.log('clearances (m):', Object.fromEntries(Object.entries(clearance).map(([k, v]) => [k, +v.toFixed(3)])));
for (const [side, value] of Object.entries(clearance))
  if (value < 0.6) throw new Error(`vehicle leaves only ${value.toFixed(3)} m ${side} of the bay`);
if (Math.abs(after.mn[1] - FLOOR_Y) > 0.005) throw new Error('wheels left the floor: ' + after.mn[1]);

for (const ext of root.listExtensionsUsed()) if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
const PLAIN = FULL + '/level-1.plain.glb';
writeFileSync(PLAIN, await io.writeBinary(doc));
execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', PLAIN, FULL + '/level-1.glb',
  '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
execFileSync('rm', [PLAIN]);
const manifest = JSON.parse(readFileSync(FULL + '/manifest.json', 'utf8'));
const asset = manifest.assets.find((a) => a.id === 'level-1');
asset.bytes = statSync(FULL + '/level-1.glb').size;
asset.sha256 = createHash('sha256').update(readFileSync(FULL + '/level-1.glb')).digest('hex');
writeFileSync(FULL + '/manifest.json', JSON.stringify(manifest, null, 2));
console.log('level-1.glb re-encoded:', asset.bytes, 'bytes');
