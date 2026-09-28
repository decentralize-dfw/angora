// Pişmiş ışık haritalarının web teslimatı (28.09.2026).
//
//   TOKTX=... TOKTX_LIB=... node make-lightmaps-web.mjs
//
// Girdi : build/bake/web-isik/*.png + lightmaps.json   (tools/blender/03_web_isik.py)
//         build/bake/BUILDING-opt-v4-lm.glb, GARDEN-opt-v2-lm.glb
// Çıktı : build/web/26092026/lightmaps/<atlas>_<durum>.ktx2   UASTC + zstd, mipmap'li
//         build/web/26092026/BUILDING-opt-v5.glb, GARDEN-opt-v3.glb
//         viewer/src/villa-lightmaps.json   (ölçekler, boyutlar, bayt)
//
// v5/v3 = v4/v2 + lightmap UV kanalı (extras.lightmap) + ters dönük yüzlerin
// düzeltilmiş normali. Geometri Draco (konum 14, normal 10, UV 14 bit - lightmap
// UV'si 2048'lik haritada piksel altı kalsın), dokular kaynaktaki WebP aynen.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = '/home/user/angora';
const SRC = `${REPO}/build/bake/web-isik`;
const WEB = `${REPO}/build/web/26092026`;
const TOKTX = process.env.TOKTX || 'toktx';
const env = process.env.TOKTX_LIB ? {...process.env, LD_LIBRARY_PATH: process.env.TOKTX_LIB} : process.env;
const spec = JSON.parse(fs.readFileSync(`${SRC}/lightmaps.json`, 'utf8'));
const uv = JSON.parse(fs.readFileSync(`${REPO}/build/bake/lightmap-uv.json`, 'utf8'));

fs.mkdirSync(`${WEB}/lightmaps`, {recursive: true});
const out = {uretim: 'tools/batch-delivery/make-lightmaps-web.mjs', kok: 'lightmaps/',
  kodlama: 'x = (v*v) * olcek (doğrusal UASTC, sRGB değil)', atlaslar: {}};
for (const [atlas, entry] of Object.entries(spec.atlaslar)) {
  out.atlaslar[atlas] = {dosya: uv.atlaslar[atlas].dosya, haritalar: {}};
  for (const [state, map] of Object.entries(entry.haritalar)) {
    const file = `${atlas}_${state}.ktx2`;
    execFileSync(TOKTX, ['--t2', '--encode', 'uastc', '--uastc_quality', '2', '--uastc_rdo_l', '1.0', '--zcmp', '19',
      '--genmipmap', '--assign_oetf', 'linear', '--assign_primaries', 'none', '--target_type', 'RGB',
      `${WEB}/lightmaps/${file}`, `${SRC}/${atlas}_${state}.png`], {env, stdio: 'pipe'});
    const bytes = fs.statSync(`${WEB}/lightmaps/${file}`).size;
    out.atlaslar[atlas].haritalar[state] = {dosya: file, boyut: map.boyut, olcek: map.olcek, bytes};
    console.log(file, map.boyut, bytes);
  }
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule()});
out.modeller = {};
for (const [src, dst] of [['BUILDING-opt-v4-lm.glb', 'BUILDING-opt-v5.glb'], ['GARDEN-opt-v2-lm.glb', 'GARDEN-opt-v3.glb']]) {
  const doc = await io.read(`${REPO}/build/bake/${src}`);
  const draco = doc.createExtension(ALL_EXTENSIONS.find(e => e.EXTENSION_NAME === 'KHR_draco_mesh_compression')).setRequired(true);
  draco.setEncoderOptions({method: draco.constructor.EncoderMethod.EDGEBREAKER, encodeSpeed: 5, decodeSpeed: 5,
    quantizationBits: {POSITION: 14, NORMAL: 10, TEX_COORD: 14, COLOR: 8, GENERIC: 12}});
  await io.write(`${WEB}/${dst}`, doc);
  const bytes = fs.statSync(`${WEB}/${dst}`).size;
  out.modeller[dst] = {kaynak: src, bytes};
  console.log(dst, bytes);
}
fs.writeFileSync(`${REPO}/viewer/src/villa-lightmaps.json`, JSON.stringify(out, null, 1) + '\n');
