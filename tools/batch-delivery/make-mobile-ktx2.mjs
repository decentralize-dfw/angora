// MOBİL İŞ EMRİ İŞ 2 - mobil için 256 px KTX2 doku seti.
//
//   node make-mobile-ktx2.mjs            # üç modeli üretir
//   node make-mobile-ktx2.mjs <a.glb> …  # yalnız verilenleri
//
// Kaynaklara DOKUNMAZ: build/web/26092026/ altındaki üç model ürün
// sahibinin malzeme yazarlığı - bu betik yalnız dokuları ≤256 px'e indirip
// ETC1S KTX2'ye çevirir ve SONUCU build/web/26092026/mobile/<ad>.ktx2.glb
// olarak AYRI yazar. Malzeme grafiği, geometri, uzantı listesi (draco /
// meshopt / quantization) olduğu gibi kalır; yalnız EXT_texture_webp'in
// yerini KHR_texture_basisu alır (ikisi de extensionsRequired'da doğru
// şekilde). İdempotent: aynı girdiden hep aynı çıktı, tekrar koşmak
// güvenli.
//
// ENCODER GEREKSİNİMİ: KTX-Software'in `toktx` ikilisi (v4.3+). Depoda
// yok; şu iki yoldan biriyle sağla (README'de de yazar):
//   TOKTX=/path/to/toktx [TOKTX_LIB=/path/to/lib] node make-mobile-ktx2.mjs
// ya da toktx PATH'te olsun. Kurulum (root gerekmez):
//   curl -fL -o /tmp/ktx.deb https://github.com/KhronosGroup/KTX-Software/releases/download/v4.3.2/KTX-Software-4.3.2-Linux-x86_64.deb
//   dpkg -x /tmp/ktx.deb ~/ktxsw   # TOKTX=~/ktxsw/usr/bin/toktx TOKTX_LIB=~/ktxsw/usr/lib
//
// Renk uzayı: baseColor/emissive sRGB, normal/ORM/diğerleri linear
// (getTextureColorSpace karar verir). --normal_mode KULLANILMIYOR: üç.js
// KTX2Loader'ı ETC1S RG normalini Z-yeniden-kurmadan geçirir, yeşil-mor
// yüzey çıkar; normal haritalar düz linear RGBA ETC1S kalır.
//
// VRAM aritmetiği (rapor için): kaynak = w*h*4B*1,33 (RGBA8+mip);
// KTX2 = w*h*(RGB 0,5 / RGBA 1,0 B)*1,33 (ETC1S -> ETC2 transkodu).
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS, KHRTextureBasisu} from '@gltf-transform/extensions';
import {getTextureColorSpace, listTextureChannels} from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import {MeshoptDecoder, MeshoptEncoder} from 'meshoptimizer';
import sharp from 'sharp';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync, statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.resolve(here, '../../build/web/26092026');
const OUT_DIR = path.join(SOURCE_DIR, 'mobile');
const MAX_EDGE = 256;
const MiB = b => b / 1048576;

const TOKTX = process.env.TOKTX || 'toktx';
const toktxEnv = process.env.TOKTX_LIB
  ? {...process.env, LD_LIBRARY_PATH: process.env.TOKTX_LIB + ':' + (process.env.LD_LIBRARY_PATH ?? '')}
  : process.env;
try {
  execFileSync(TOKTX, ['--version'], {env: toktxEnv, stdio: 'pipe'});
} catch {
  console.error('toktx bulunamadı. TOKTX=/path/to/toktx (gerekirse TOKTX_LIB=lib dizini) ver ya da PATH\'e koy.');
  console.error('Kurulum satırı bu dosyanın başında ve README\'de.');
  process.exit(1);
}

const files = process.argv.length > 2
  ? process.argv.slice(2)
  : ['BUILDING-opt-v3.glb', 'GARDEN-opt-v2.glb', 'INTERIOR-opt-v2.glb']
      .map(f => path.join(SOURCE_DIR, f));

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'meshopt.decoder': await MeshoptDecoder.ready.then(() => MeshoptDecoder),
  'meshopt.encoder': await MeshoptEncoder.ready.then(() => MeshoptEncoder),
});

// 4'ün katına yuvarla (ETC1S blok boyutu), en az 4.
const snap4 = v => Math.max(4, Math.floor(v / 4) * 4);

mkdirSync(OUT_DIR, {recursive: true});
const work = mkdtempSync(path.join(tmpdir(), 'ktx2-'));
const summary = [];
try {
  for (const file of files) {
    const document = await io.read(file);
    const root = document.getRoot();
    const basisu = document.createExtension(KHRTextureBasisu).setRequired(true);
    let srcVram = 0, outVram = 0, srcWire = 0, outWire = 0, count = 0;
    for (const texture of root.listTextures()) {
      const image = texture.getImage();
      if (!image) continue;
      const srgb = getTextureColorSpace(texture) === 'srgb';
      const alpha = listTextureChannels(texture).includes(3); // A kanalı gerçekten okunuyor mu
      const meta = await sharp(Buffer.from(image)).metadata();
      const scale = Math.min(1, MAX_EDGE / Math.max(meta.width, meta.height));
      const w = snap4(Math.round(meta.width * scale));
      const h = snap4(Math.round(meta.height * scale));
      const png = path.join(work, `t${count}.png`);
      const ktx = path.join(work, `t${count}.ktx2`);
      writeFileSync(png, await sharp(Buffer.from(image))
        .resize(w, h, {fit: 'fill', kernel: 'lanczos3'}).png().toBuffer());
      execFileSync(TOKTX, [
        '--t2', '--encode', 'etc1s', '--clevel', '2', '--qlevel', '128',
        '--genmipmap', '--assign_oetf', srgb ? 'srgb' : 'linear',
        // --zcmp ETC1S ile GEÇERSİZ (BasisLZ zaten süper-sıkıştırma); denendi, toktx reddediyor.
        ktx, png,
      ], {env: toktxEnv, stdio: 'pipe'});
      const bytes = readFileSync(ktx);
      srcWire += image.byteLength;
      outWire += bytes.byteLength;
      srcVram += meta.width * meta.height * 4 * 4 / 3;
      outVram += w * h * (alpha ? 1 : 0.5) * 4 / 3;
      texture.setImage(bytes).setMimeType('image/ktx2');
      if (texture.getURI()) texture.setURI(texture.getURI().replace(/\.\w+$/, '.ktx2'));
      count++;
    }
    // Bütün görüntüler KTX2 oldu; webp uzantısı artık kullanılmıyor.
    for (const ext of root.listExtensionsUsed()) {
      if (ext.extensionName === 'EXT_texture_webp') ext.dispose();
    }
    void basisu; // required listesinde kalır
    const outFile = path.join(OUT_DIR, path.basename(file, '.glb') + '.ktx2.glb');
    await io.write(outFile, document);
    const row = {
      file: path.basename(outFile), textures: count,
      wireMB: {src: +(srcWire / 1e6).toFixed(2), out: +(statSync(outFile).size / 1e6).toFixed(2)},
      textureVramMiB: {src: +MiB(srcVram).toFixed(1), out: +MiB(outVram).toFixed(1)},
    };
    summary.push(row);
    console.log(JSON.stringify(row));
  }
} finally {
  rmSync(work, {recursive: true, force: true});
}
console.log('TOPLAM doku-VRAM MiB:',
  summary.reduce((a, r) => a + r.textureVramMiB.src, 0).toFixed(1), '->',
  summary.reduce((a, r) => a + r.textureVramMiB.out, 0).toFixed(1));
