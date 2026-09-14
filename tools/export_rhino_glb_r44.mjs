// R44 | The latest villa as a GLB Rhino 8 can actually open.
//
// Rhino errors on every delivery file because their headers declare
// extensionsRequired: [EXT_texture_webp, KHR_draco_mesh_compression] -
// two extensions Rhino's glTF importer cannot satisfy, so per spec it
// must refuse the file (Blender opens them because it decodes both).
//
// This export takes build/web/full/villa.glb (the CURRENT villa, with
// every fix), decodes the draco geometry to plain accessors, re-encodes
// every webp image as png, and writes two same-origin files so Rhino
// users can bring in the building without the furniture:
//   build/rhino/villa-rhino-architecture.glb
//   build/rhino/villa-rhino-furniture.glb
// Units are metres, Y up. The optional KHR_materials_* extensions stay -
// importers may ignore those freely.
import { mkdirSync, writeFileSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import sharp from 'sharp';
import draco3d from 'draco3dgltf';

const ROOT = '/home/user/angora';
const OUT = ROOT + '/build/rhino';
mkdirSync(OUT, { recursive: true });

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
});

for (const part of ['architecture', 'furniture']) {
  const doc = await io.read(ROOT + '/build/web/full/villa.glb');
  const root = doc.getRoot();
  for (const node of [...root.listNodes()]) {
    const isFurniture = node.getExtras()?.category === 'furniture';
    if ((part === 'furniture') !== isFurniture) {
      const mesh = node.getMesh();
      node.dispose();
      if (mesh && mesh.listParents().every((p) => p.propertyType !== 'Node')) mesh.dispose();
    }
  }
  for (const texture of root.listTextures()) {
    if (texture.getMimeType() !== 'image/webp') continue;
    const png = await sharp(Buffer.from(texture.getImage())).png().toBuffer();
    texture.setImage(new Uint8Array(png)).setMimeType('image/png');
  }
  await doc.transform(prune());
  // reading decoded the geometry; dropping the extension writes it plain
  for (const ext of root.listExtensionsUsed())
    if (ext.extensionName === 'KHR_draco_mesh_compression' || ext.extensionName === 'EXT_texture_webp') ext.dispose();
  const bytes = await io.writeBinary(doc);
  writeFileSync(`${OUT}/villa-rhino-${part}.glb`, bytes);
  console.log(`villa-rhino-${part}.glb: ${(bytes.length / 1e6).toFixed(1)} MB, nodes ${root.listNodes().length}`);
}
