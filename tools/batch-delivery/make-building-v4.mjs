// BUILDING-opt-v4 = BUILDING-opt-v3 + ürün sahibinin 27.09.2026 yüklemesi
// (build/web/26092026/source/lift-door-simple-wood.glb).
//
//   node make-building-v4.mjs
//
// Yükleme iki parça taşıyor:
//   * "Lift | Photographed walnut door finish (4).001" - asansör kapısı,
//     "Simple wood" malzemesiyle (wood12: diffuse / normal / glossiness).
//     v3'teki "Procedural Wood" kapının yerine geçer: o malzeme Blender'da
//     prosedürel dokuyla yazılmıştı ve glTF'e dokusuz (beyaz) çıkıyordu.
//   * "interior.004" - merdiven altı. Ürün sahibi: "Simple White Wall
//     malzemesi yap, o draw call'a ekle" -> interior.002 ile TEK primitive.
// v3'teki eski kapı mesh'i (kapı + merdiven altı birlikte) kaldırılır.
//
// Protokol v3 ile aynı: Draco geometri, EXT_texture_webp, doku kenarı en çok
// 1024 (kaynak dokular 2048 JPEG/PNG). v3 ve yükleme SİLİNMEZ, yeni dosya
// yazılır. Mobil 256 px KTX2 kopyası make-mobile-ktx2.mjs ile üretilir.
// Parlaklık haritası Blender'da nasıl bağlandıysa öyle kalır (glTF'e o
// görüntü roughness olarak çıkmış; Blender'daki görünüm budur).
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {mergeDocuments, unpartition, joinPrimitives, prune} from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(here, '../../build/web/26092026');
const SOURCE = path.join(DIR, 'BUILDING-opt-v3.glb');
const UPLOAD = path.join(DIR, 'source/lift-door-simple-wood.glb');
const OUT = path.join(DIR, 'BUILDING-opt-v4.glb');
const MAX_EDGE = 1024;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(SOURCE);
const upload = await io.read(UPLOAD);
const root = doc.getRoot();
const byName = name => root.listNodes().find(n => n.getName() === name);

const oldDoor = byName('Lift | Photographed walnut door finish (4)');
const wall = byName('interior.002');
if (!oldDoor || !wall) throw Error('v3 düğümleri bulunamadı');
const wallMaterial = wall.getMesh().listPrimitives()[0].getMaterial();
if (wallMaterial?.getName() !== 'Simple White Wall') throw Error('interior.002 Simple White Wall değil');

const map = mergeDocuments(doc, upload);
const scene = root.listScenes()[0];
const incoming = upload.getRoot().listNodes().map(n => map.get(n));
for (const s of root.listScenes()) if (s !== scene) {for (const n of s.listChildren()) s.removeChild(n); s.dispose();}
const newDoor = incoming.find(n => n.getName() === 'Lift | Photographed walnut door finish (4).001');
const under = incoming.find(n => n.getName() === 'interior.004');
if (!newDoor || !under) throw Error('yükleme düğümleri bulunamadı');

// Kapı: yeni mesh sahneye, eskisi çıkar.
scene.addChild(newDoor);
scene.removeChild(oldDoor); oldDoor.getMesh()?.dispose(); oldDoor.dispose();

// Merdiven altı: Simple White Wall, interior.002 ile aynı primitive. Birleşme
// için öznitelik kümeleri eşit olmalı - eksik UV kanalları sıfırla doldurulur
// (malzemenin dokusu yok, UV'ler görüntüyü etkilemez).
const target = wall.getMesh().listPrimitives()[0];
const piece = under.getMesh().listPrimitives()[0];
piece.setMaterial(wallMaterial);
const count = piece.getAttribute('POSITION').getCount();
for (const semantic of target.listSemantics()) {
  if (piece.getAttribute(semantic)) continue;
  const like = target.getAttribute(semantic);
  const array = new (like.getArray().constructor)(count * like.getElementSize());
  piece.setAttribute(semantic, doc.createAccessor().setType(like.getType()).setArray(array)
    .setNormalized(like.getNormalized()).setBuffer(like.getBuffer()));
}
for (const semantic of piece.listSemantics()) if (!target.getAttribute(semantic)) piece.setAttribute(semantic, null);
const joined = joinPrimitives([target, piece]);
const wallMesh = wall.getMesh();
wallMesh.removePrimitive(target); wallMesh.addPrimitive(joined);
under.getMesh().dispose(); under.dispose();

// Dokular: v3 protokolü - WebP, kenar <= 1024.
for (const texture of root.listTextures()) {
  const image = texture.getImage(); if (!image) continue;
  if (texture.getMimeType() === 'image/webp') continue; // v3'ün kendi dokuları zaten işlenmiş
  const meta = await sharp(Buffer.from(image)).metadata();
  const edge = Math.max(meta.width, meta.height);
  const pipeline = sharp(Buffer.from(image)).resize(edge > MAX_EDGE ? {width: Math.round(meta.width * MAX_EDGE / edge), height: Math.round(meta.height * MAX_EDGE / edge)} : undefined);
  texture.setImage(new Uint8Array(await pipeline.webp({quality: 88}).toBuffer())).setMimeType('image/webp');
  if (texture.getURI()) texture.setURI(texture.getURI().replace(/\.(jpe?g|png)$/i, '.webp'));
}
await doc.transform(unpartition(), prune({keepAttributes: true, keepLeaves: true}));
await io.write(OUT, doc);
const check = await io.read(OUT);
const nodes = check.getRoot().listNodes().map(n => n.getName());
console.log('yazıldı', OUT, 'malzeme', check.getRoot().listMaterials().length,
  'kapı', nodes.includes('Lift | Photographed walnut door finish (4).001'),
  'eski kapı', nodes.includes('Lift | Photographed walnut door finish (4)'),
  'interior.004 ayrı', nodes.includes('interior.004'));
