// R44 | The kitchen bay's planter reads as ground, not as a shaft.
//
// "girişte şuranın zemini çok aşağıda kalıyor boş gibi gözüküyor onu düzelt."
//
// West of the dining deck the kitchen bay projects into a walled planter bed:
// its rim stands at 2.70, the side-garden stair passes at 2.24-2.58 beside
// it, and the ground inside the bed is the context soil at 2.07 - a metre
// below the deck - with a 30 cm slot of nothing at all along the bay's own
// wall, straight down into the basement's dark. Measured on the delivery:
// rays at x -5.30, z 0.20..-0.40 pass 4.4 m without meeting geometry.
//
// The bed is filled the way the east side fills the gaps beside its stair
// ('Garden east | Stair side stone infill N'): a solid body inside the bay's
// cheeks, its top one course under the rim so the rim still reads, its skirt
// dropping past the old soil so the slot cannot be seen into from any angle
// the plan or the walk allows. Grass top, limestone sides - the planter is a
// planter, and the stone is the stone the stair already wears.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const FILE = FULL + '/garden.glb';
const NODE = 'Garden west | R44 kitchen bay planter fill';
const GRASS = 'R44 | planter lawn';        // built here: the garden's own grass green, as a lawn plane
const STONE = 'R31 | R37 garden cream limestone';
// The bed, inside its own cheek walls (rim top 2.70 at z 0.50 and z -0.55,
// inner wall face x -5.16), reaching west past the old sunken soil to the
// stair's flank.
const X = [-5.86, -5.155], Z = [-0.53, 0.44];
const TOP = 2.58;                    // one course under the 2.70 rim
const BOTTOM = 1.8;                  // past the old soil, past the slot
const GRASS_INSET = 0.05;            // the stone shows as a thin border

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(FILE);
const root = doc.getRoot();

for (const node of root.listNodes()) {
  if (node.getName() !== NODE) continue;
  const mesh = node.getMesh(); node.dispose(); mesh?.dispose();     // idempotent
}
const material = (name) => {
  const m = root.listMaterials().find((m) => m.getName() === name);
  if (m) return m;
  if (name !== GRASS) throw new Error(`garden.glb carries no ${name}`);
  // the fresh-blade green the garden's own grass tufts wear, laid flat
  return doc.createMaterial(GRASS).setBaseColorFactor([0.178, 0.25, 0.067, 1])
    .setRoughnessFactor(0.95).setMetallicFactor(0);
};

const position = [], normal = [], uv = [], index = [];
const quad = (a, b, c, d, n) => {
  const base = position.length / 3;
  for (const p of [a, b, c, d]) { position.push(...p); normal.push(...n); uv.push(p[0] + p[1], p[2] + p[1]); }
  index.push(base, base + 1, base + 2, base, base + 2, base + 3);
};
// stone border ring at TOP, stone skirt to BOTTOM
const [x0, x1] = X, [z0, z1] = Z;
const gx0 = x0 + GRASS_INSET, gx1 = x1 - GRASS_INSET, gz0 = z0 + GRASS_INSET, gz1 = z1 - GRASS_INSET;
quad([x0, TOP, z0], [x0, TOP, gz0], [x1, TOP, gz0], [x1, TOP, z0], [0, 1, 0]);           // south border
quad([x0, TOP, gz1], [x0, TOP, z1], [x1, TOP, z1], [x1, TOP, gz1], [0, 1, 0]);           // north border
quad([x0, TOP, gz0], [x0, TOP, gz1], [gx0, TOP, gz1], [gx0, TOP, gz0], [0, 1, 0]);       // west border
quad([gx1, TOP, gz0], [gx1, TOP, gz1], [x1, TOP, gz1], [x1, TOP, gz0], [0, 1, 0]);       // east border
quad([x0, TOP, z0], [x0, BOTTOM, z0], [x0, BOTTOM, z1], [x0, TOP, z1], [-1, 0, 0]);      // west skirt
quad([x1, TOP, z1], [x1, BOTTOM, z1], [x1, BOTTOM, z0], [x1, TOP, z0], [1, 0, 0]);       // east skirt
quad([x1, TOP, z0], [x1, BOTTOM, z0], [x0, BOTTOM, z0], [x0, TOP, z0], [0, 0, -1]);      // south skirt
quad([x0, TOP, z1], [x0, BOTTOM, z1], [x1, BOTTOM, z1], [x1, TOP, z1], [0, 0, 1]);       // north skirt
const stoneTriangles = index.length / 3;
const grassStart = index.length;
const GRASS_TOP = TOP + 0.012;                                                            // a soft lawn proud of its border
quad([gx0, GRASS_TOP, gz0], [gx0, GRASS_TOP, gz1], [gx1, GRASS_TOP, gz1], [gx1, GRASS_TOP, gz0], [0, 1, 0]);

const buffer = root.listBuffers()[0] ?? doc.createBuffer();
const mesh = doc.createMesh(NODE);
const accessor = (array, type) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
const build = (from, to, mat) => {
  const ids = index.slice(from, to);
  const used = [...new Set(ids)].sort((a, b) => a - b);
  const remap = new Map(used.map((v, i) => [v, i]));
  const pos = new Float32Array(used.length * 3), nrm = new Float32Array(used.length * 3), tex = new Float32Array(used.length * 2);
  used.forEach((v, i) => {
    pos.set(position.slice(v * 3, v * 3 + 3), i * 3);
    nrm.set(normal.slice(v * 3, v * 3 + 3), i * 3);
    tex.set(uv.slice(v * 2, v * 2 + 2), i * 2);
  });
  mesh.addPrimitive(doc.createPrimitive()
    .setAttribute('POSITION', accessor(pos, 'VEC3'))
    .setAttribute('NORMAL', accessor(nrm, 'VEC3'))
    .setAttribute('TEXCOORD_0', accessor(tex, 'VEC2'))
    .setIndices(accessor(new Uint32Array(ids.map((v) => remap.get(v))), 'SCALAR'))
    .setMaterial(mat));
};
build(0, grassStart, material(STONE));
build(grassStart, index.length, material(GRASS));
root.listScenes()[0].addChild(doc.createNode(NODE).setMesh(mesh)
  .setExtras({ category: 'fixed', note: 'R44: west kitchen-bay planter filled; the sunken soil and the open slot lie under it' }));

await doc.transform(prune());
for (const ext of root.listExtensionsUsed())
  if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
const { execFileSync } = await import('node:child_process');
const { unlinkSync } = await import('node:fs');
const plain = `${FULL}/garden.plain.glb`;
writeFileSync(plain, await io.writeBinary(doc));
execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, FILE,
  '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'inherit' });
unlinkSync(plain);

const raw = readFileSync(FILE);
// the manifest counts each shared mesh once, the way the exporter did
let triangles = 0;
{
  const meshes = new Set();
  for (const n of (await io.read(FILE)).getRoot().listNodes()) if (n.getMesh()) meshes.add(n.getMesh());
  for (const m of meshes) for (const p of m.listPrimitives())
    triangles += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
}
for (const path of [FULL + '/manifest.json', ROOT + '/viewer/public/models/full/manifest.json']) {
  if (!existsSync(path)) continue;
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  const asset = manifest.assets.find((a) => a.id === 'garden');
  asset.bytes = raw.length;
  asset.sha256 = createHash('sha256').update(raw).digest('hex');
  asset.triangles = triangles;
  writeFileSync(path, JSON.stringify(manifest, null, 2));
}
const mirror = ROOT + '/viewer/public/models/full/garden.glb';
if (existsSync(mirror)) writeFileSync(mirror, raw);
writeFileSync(ROOT + '/build/west-planter-fill-r44.json', JSON.stringify({
  generated_for: 'R44', node: NODE, x: X, z: Z, top_m: TOP, grass_top_m: GRASS_TOP,
  bottom_m: BOTTOM, stone_triangles: stoneTriangles, grass_triangles: 2,
  measured_hole: 'rays at x -5.30, z 0.20..-0.40 met no geometry above 1.8 m before the fill',
  asset_bytes: raw.length, asset_triangles: triangles,
}, null, 2));
console.log(`garden.glb: ${triangles} triangles, ${raw.length} bytes`);
