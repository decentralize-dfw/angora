// R44 | A delivery a phone can actually open.
//
// "mobilde 10 kere denedim crash oluyor açılmıyor! ... hem yüklenip hem
//  hızlı hem de kaliteli olması gerekiyor."
//
// The full delivery is 4.1 M triangles and ~175 MB of decoded texture -
// a desktop budget; iOS WebKit gives up during upload. The mobile set is
// derived, never re-authored, from the same three files:
//
//   villa-m    geometry simplified per material class (architecture is
//              bounded at ~1.5 cm error, foliage and fabric looser),
//              normal/occlusion maps dropped, textures capped at 512 px
//              and re-encoded webp;
//   garden-m   the 144 k-triangle grass-blade field is left out (the
//              lawns keep their ground green), everything else
//              simplified and recompressed the same way;
//   context-m  the 510 k-triangle 'CAD curb edges' mesh is left out
//              (curbs read at neighbourhood scale as part of the road
//              raster), neighbour families simplified hardest - they are
//              setting, not subject.
//
// manifest-mobile.json mirrors manifest.json with the -m files; the
// viewer picks it by device (viewer/src/main.js), and ?model=full /
// ?model=lite override it either way. Navigation, rooms, sections and
// caps are shared - the walk is the same walk.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, weld, simplifyPrimitive, dedup } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const FULL = ROOT + '/build/web/full';
const TEX_MAX = 512;
const DROP_NODES = {
  garden: [/^R33 \| Natural bent garden grass\.001$/],
  context: [/^CAD curb edges$/],
  villa: [],
};
// simplification budget per material class
const CLASSES = [
  // organic mass: silhouettes forgive, borders may move
  { match: /foliage|Thuja|leaf|leaves|needle|grass|Bedspread|Quilted|drape|sheer|curtain|linen|damask|pillow/i, ratio: 0.22, error: 0.008, lockBorder: false },
  { match: /^Clay tile|^roof|soil|terrain|Terrain|ground/i, ratio: 0.4, error: 0.002, lockBorder: true },
  // architecture: ~3-4 cm bound on the villa's span; material seams stay pinned
  { match: /./, ratio: 0.35, error: 0.0015, lockBorder: true },
];

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
await MeshoptSimplifier.ready;

const countTris = (root) => {
  let tris = 0;
  const seen = new Set();
  for (const n of root.listNodes()) {
    const m = n.getMesh();
    if (m && !seen.has(m)) { seen.add(m); for (const p of m.listPrimitives()) tris += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3; }
  }
  return Math.round(tris);
};

const report = {};
for (const id of ['villa', 'garden', 'context']) {
  const doc = await io.read(`${FULL}/${id}.glb`);
  const root = doc.getRoot();
  const before = { tris: countTris(root) };

  // drop the named heavyweights
  for (const node of [...root.listNodes()]) {
    const clean = node.getName().replace(/_/g, ' ');
    if (DROP_NODES[id].some((re) => re.test(clean))) {
      const mesh = node.getMesh();
      node.dispose();
      if (mesh && mesh.listParents().every((p) => p.propertyType !== 'Node')) mesh.dispose();
    }
  }

  // per-primitive simplification, bounded by class error
  await doc.transform(weld());
  let simplified = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      if (prim.getMode() !== 4) continue;
      const tris = (prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION').getCount()) / 3;
      if (tris < 64) continue;                        // small fittings keep their exact shape
      const matName = prim.getMaterial()?.getName() ?? '';
      const cls = CLASSES.find((c) => c.match.test(matName));
      try {
        simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: cls.ratio, error: cls.error, lockBorder: cls.lockBorder });
        simplified++;
      } catch (error) {
        console.warn(`  simplify skipped ${id}/${matName}: ${String(error).slice(0, 80)}`);
      }
    }
  }

  // textures: drop relief maps, cap size, webp
  let texIn = 0, texOut = 0;
  for (const material of root.listMaterials()) {
    material.setNormalTexture(null);
    material.setOcclusionTexture(null);
  }
  await doc.transform(prune());
  for (const texture of root.listTextures()) {
    const image = texture.getImage();
    if (!image) continue;
    texIn += image.byteLength;
    const size = texture.getSize() ?? [0, 0];
    const scale = Math.min(1, TEX_MAX / Math.max(...size, 1));
    const pipeline = sharp(Buffer.from(image));
    const out = await (scale < 1 ? pipeline.resize(Math.round(size[0] * scale), Math.round(size[1] * scale)) : pipeline)
      .webp({ quality: 80 }).toBuffer();
    if (out.byteLength < image.byteLength) {
      texture.setImage(new Uint8Array(out)).setMimeType('image/webp');
      texOut += out.byteLength;
    } else texOut += image.byteLength;
  }
  await doc.transform(dedup(), prune());

  for (const ext of root.listExtensionsUsed())
    if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
  const plain = `${FULL}/${id}-m.plain.glb`;
  writeFileSync(plain, await io.writeBinary(doc));
  execFileSync('/tmp/node_modules/.bin/gltf-transform', ['draco', plain, `${FULL}/${id}-m.glb`,
    '--quantize-position', '14', '--quantize-normal', '8', '--quantize-texcoord', '12'], { stdio: 'pipe' });
  unlinkSync(plain);

  const raw = readFileSync(`${FULL}/${id}-m.glb`);
  const reread = await io.read(`${FULL}/${id}-m.glb`);
  report[id] = {
    triangles: { full: before.tris, mobile: countTris(reread.getRoot()) },
    bytes: raw.length,
    textures_bytes: { full: texIn, mobile: texOut },
    simplified_prims: simplified,
  };
  console.log(`${id}-m.glb: ${report[id].triangles.full} -> ${report[id].triangles.mobile} tris, ${(raw.length / 1e6).toFixed(1)} MB`);
}

// ---------------------------------------------------------- manifest
for (const dir of [FULL, ROOT + '/viewer/public/models/full']) {
  const manifestPath = `${dir}/manifest.json`;
  if (!existsSync(manifestPath)) continue;
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.profile = 'full';
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  const mobile = JSON.parse(JSON.stringify(manifest));
  mobile.profile = 'mobile';
  mobile.derived_from = 'manifest.json by tools/build_mobile_delivery_r44.mjs';
  for (const asset of mobile.assets) {
    const raw = readFileSync(`${FULL}/${asset.id}-m.glb`);
    asset.file = `${asset.id}-m.glb`;
    asset.bytes = raw.length;
    asset.sha256 = createHash('sha256').update(raw).digest('hex');
    asset.triangles = report[asset.id].triangles.mobile;
  }
  writeFileSync(`${dir}/manifest-mobile.json`, JSON.stringify(mobile, null, 2));
  if (dir !== FULL) for (const id of ['villa', 'garden', 'context'])
    writeFileSync(`${dir}/${id}-m.glb`, readFileSync(`${FULL}/${id}-m.glb`));
}
writeFileSync(ROOT + '/build/mobile-delivery-r44.json', JSON.stringify(report, null, 2));
console.log('manifest-mobile.json written; totals:',
  Object.values(report).reduce((s, r) => s + r.triangles.mobile, 0), 'tris,',
  (Object.values(report).reduce((s, r) => s + r.bytes, 0) / 1e6).toFixed(1), 'MB');
