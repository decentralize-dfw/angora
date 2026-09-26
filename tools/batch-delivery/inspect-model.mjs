// Bir GLB'yi dosyadan ölçer: malzeme, üçgen, dünya sınırı, doku boyutları ve
// VRAM tahmini, ana geçiş çizim sayısı. Tarayıcı gerekmez.
//
//   node --max-old-space-size=8192 inspect-model.mjs <dosya.glb> [...]
//
// NEDEN VAR: 26.09.2026'da yeni villa modelleri değerlendirilirken tarayıcı
// harness'ının `renderer.info` sayıları yanlış yorumlandı ve ürün sahibine
// "draw call 141 -> 395" diye bildirildi. Yanlıştı.
//
//   BİRİM UYARISI - üç.js'in renderer.info.render.drawCalls değeri bir KAREDE
//   YAPILAN BÜTÜN ÇİZİMLERİ toplar: ana geçiş + gölge haritası geçişi + GTAO
//   + SSR + postfx. 58 mesh dört geçişte çizilince ~230 okunur. Modelin
//   kendi çizim sayısı DEĞİLDİR. Sahnenin "kaç draw call" sorusu sorulduğunda
//   kastedilen ana geçiştir; bu araç onu (mesh primitifi sayısı) basar.
//
//   Aynı şekilde renderer.info.render.triangles da kare toplamıdır ve iki
//   koşum arasında hangi parçaların yüklü olduğu (ertelenen interior!)
//   değişirse kıyas bozulur. Dosyadan ölçmek bu tuzakların ikisini de keser.
//
// VRAM tahmini: genişlik x yükseklik x 4 bayt x 4/3 (mipmap zinciri). Diskteki
// WebP/PNG boyutu ALAKASIZ - 5,3 MB'lık dosya bellekte 369 MiB açabilir.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import sharp from 'sharp';
import path from 'node:path';

const MiB = b => b / 1048576;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'meshopt.decoder': await MeshoptDecoder.ready.then(() => MeshoptDecoder),
});

// TRS -> matris. Nicemlenmiş (KHR_mesh_quantization) modelde int16
// pozisyonları metreye çeviren ölçek düğümde durur; atlanırsa sınırlar
// ±32767 gibi saçma çıkar.
function nodeMatrix(node) {
  const [tx, ty, tz] = node.getTranslation();
  const [x, y, z, w] = node.getRotation();
  const s = node.getScale();
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  return [(1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0,
    (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0,
    (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0, tx, ty, tz, 1];
}
const mul = (m, v) => [
  m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
  m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
  m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]];
function mm(a, b) {
  const o = new Array(16).fill(0);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
}

export async function inspectModel(file) {
  const doc = await io.read(file);
  const root = doc.getRoot();

  let triangles = 0, vertices = 0, primitives = 0;
  for (const mesh of root.listMeshes()) for (const prim of mesh.listPrimitives()) {
    primitives++;
    const position = prim.getAttribute('POSITION');
    if (!position) continue;
    vertices += position.getCount();
    const index = prim.getIndices();
    triangles += (index ? index.getCount() : position.getCount()) / 3;
  }

  // Dünya sınırı: attribute min/max DEĞİL getElement - nicemlenmiş veride
  // min/max ham tamsayıdır. Örnekleyerek okur (2000 vertex/primitif yeter).
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const walk = (node, parent) => {
    const world = mm(parent, nodeMatrix(node));
    const mesh = node.getMesh();
    if (mesh) for (const prim of mesh.listPrimitives()) {
      const position = prim.getAttribute('POSITION');
      if (!position) continue;
      const step = Math.max(1, Math.floor(position.getCount() / 2000)), element = [];
      for (let i = 0; i < position.getCount(); i += step) {
        const w = mul(world, position.getElement(i, element));
        for (let k = 0; k < 3; k++) { if (w[k] < mn[k]) mn[k] = w[k]; if (w[k] > mx[k]) mx[k] = w[k]; }
      }
    }
    for (const child of node.listChildren()) walk(child, world);
  };
  for (const scene of root.listScenes()) for (const node of scene.listChildren()) walk(node, I);

  let disk = 0, vram = 0;
  const sizes = {};
  for (const texture of root.listTextures()) {
    const image = texture.getImage();
    if (!image) continue;
    disk += image.byteLength;
    try {
      const {width, height} = await sharp(Buffer.from(image)).metadata();
      if (width && height) { vram += width * height * 4 * 4 / 3; sizes[`${width}x${height}`] = (sizes[`${width}x${height}`] ?? 0) + 1; }
    } catch { /* çözülemeyen görüntü VRAM'e sayılmaz */ }
  }

  return {file: path.basename(file), materials: root.listMaterials().length,
    meshes: root.listMeshes().length, drawsMainPass: primitives,
    triangles: Math.round(triangles), vertices,
    textures: root.listTextures().length, textureDiskMiB: +MiB(disk).toFixed(1),
    textureVramMiB: Math.round(MiB(vram)), textureSizes: sizes,
    bounds: {min: mn.map(v => +v.toFixed(1)), max: mx.map(v => +v.toFixed(1))}};
}

const files = process.argv.slice(2);
if (files.length) {
  let vram = 0, draws = 0, tris = 0;
  for (const file of files) {
    const r = await inspectModel(file);
    vram += r.textureVramMiB; draws += r.drawsMainPass; tris += r.triangles;
    console.log(`\n=== ${r.file} ===`);
    console.log(' malzeme / mesh / ANA GEÇİŞ ÇİZİMİ :', r.materials, '/', r.meshes, '/', r.drawsMainPass);
    console.log(' üçgen / vertex                    :', r.triangles.toLocaleString(), '/', r.vertices.toLocaleString());
    console.log(' doku: adet', r.textures, ' disk', r.textureDiskMiB, 'MiB  VRAM~', r.textureVramMiB, 'MiB');
    console.log(' doku boyutları                    :', Object.entries(r.textureSizes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}x${v}`).join('  ') || '(yok)');
    console.log(' dünya sınırı (m)                  : X', r.bounds.min[0], '->', r.bounds.max[0],
      ' Y', r.bounds.min[1], '->', r.bounds.max[1], ' Z', r.bounds.min[2], '->', r.bounds.max[2]);
  }
  if (files.length > 1) console.log(`\nTOPLAM: ana geçiş çizimi ${draws}  üçgen ${tris.toLocaleString()}  doku VRAM~ ${vram} MiB`);
}
