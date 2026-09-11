// Delivery-step texture repack, exact-equivalence transforms only:
//
//  1. A texture whose every pixel decodes to one constant value is replaced by
//     the material factor it encodes (baseColorFactor / roughness / metalness
//     / emissive), and unbound. A factor is a float, so this also removes the
//     WebP quantisation drift the constant maps carried. Occlusion constants
//     unbind only when the constant is full white (no occlusion).
//  2. A normal map that is exactly the flat normal everywhere (128,128,255,
//     +/-1 LSB uniformly) is unbound - it perturbs nothing.
//  3. Byte-identical image payloads within a file collapse onto one image, so
//     the GPU uploads each map once instead of once per material.
//
// Anything not provably identical is left alone. Run per GLB:
//   node tools/repack_web_textures.mjs <in.glb> <out.glb>
// then re-encode Draco (position 14 / normal 8 / texcoord 12) as usual.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import crypto from 'node:crypto';
import sharp from 'sharp';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw Error('usage: repack_web_textures.mjs <in.glb> <out.glb>');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const document = await io.read(input);
const root = document.getRoot();
const stats = {constant_to_factor: 0, flat_normal_unbound: 0, deduped: 0, kept: 0};

const analysis = new Map(); // texture -> {constant:[r,g,b,a]|null, flatNormal:bool}
for (const texture of root.listTextures()) {
  const image = texture.getImage();
  if (!image) {analysis.set(texture, {constant: null, flatNormal: false}); continue;}
  const {data, info} = await sharp(Buffer.from(image)).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  let constant = [data[0], data[1], data[2], data[3]];
  let flatNormal = true;
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 4; c++) if (constant && data[i + c] !== constant[c]) constant = null;
    // flat normal: r,g within 1 LSB of 128, b >= 254 - everywhere
    if (flatNormal && (Math.abs(data[i] - 128) > 1 || Math.abs(data[i + 1] - 128) > 1 || data[i + 2] < 254)) flatNormal = false;
    if (!constant && !flatNormal) break;
  }
  analysis.set(texture, {constant, flatNormal, size: `${info.width}x${info.height}`});
}

const srgbToLinear = v => {const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;};
for (const material of root.listMaterials()) {
  const base = material.getBaseColorTexture();
  if (base && analysis.get(base).constant) {
    const [r, g, b, a] = analysis.get(base).constant;
    const factor = material.getBaseColorFactor();
    material.setBaseColorFactor([factor[0] * srgbToLinear(r), factor[1] * srgbToLinear(g), factor[2] * srgbToLinear(b), factor[3] * (a / 255)]);
    material.setBaseColorTexture(null); stats.constant_to_factor++;
  }
  const mr = material.getMetallicRoughnessTexture();
  if (mr && analysis.get(mr).constant) {
    const [, g, b] = analysis.get(mr).constant; // G roughness, B metallic - linear
    material.setRoughnessFactor(material.getRoughnessFactor() * (g / 255));
    material.setMetallicFactor(material.getMetallicFactor() * (b / 255));
    material.setMetallicRoughnessTexture(null); stats.constant_to_factor++;
  }
  const occlusion = material.getOcclusionTexture();
  if (occlusion && analysis.get(occlusion).constant?.[0] === 255) {
    material.setOcclusionTexture(null); stats.constant_to_factor++;
  }
  const emissive = material.getEmissiveTexture();
  if (emissive && analysis.get(emissive).constant) {
    const [r, g, b] = analysis.get(emissive).constant;
    const factor = material.getEmissiveFactor();
    material.setEmissiveFactor([factor[0] * srgbToLinear(r), factor[1] * srgbToLinear(g), factor[2] * srgbToLinear(b)]);
    material.setEmissiveTexture(null); stats.constant_to_factor++;
  }
  const normal = material.getNormalTexture();
  if (normal && (analysis.get(normal).flatNormal || analysis.get(normal).constant)) {
    const {constant} = analysis.get(normal);
    if (analysis.get(normal).flatNormal || (constant && Math.abs(constant[0] - 128) <= 1 && Math.abs(constant[1] - 128) <= 1 && constant[2] >= 254)) {
      material.setNormalTexture(null); stats.flat_normal_unbound++;
    }
  }
}

// collapse byte-identical payloads
const byHash = new Map();
for (const texture of root.listTextures()) {
  const image = texture.getImage();
  if (!image) continue;
  const hash = crypto.createHash('sha256').update(image).digest('hex');
  const first = byHash.get(hash);
  if (!first) {byHash.set(hash, texture); continue;}
  for (const parent of [...texture.listParents()]) {
    if (parent.propertyType !== 'Material') continue;
    for (const slot of ['BaseColor', 'MetallicRoughness', 'Normal', 'Occlusion', 'Emissive'])
      if (parent[`get${slot}Texture`]?.() === texture) parent[`set${slot}Texture`](first);
  }
  stats.deduped++;
}
// drop now-orphaned textures
for (const texture of root.listTextures()) {
  const users = texture.listParents().filter(p => p.propertyType === 'Material');
  if (!users.length) texture.dispose(); else stats.kept++;
}

for (const extension of root.listExtensionsUsed()) if (extension.extensionName === 'KHR_draco_mesh_compression') extension.dispose();
await io.write(output, document);
console.log(JSON.stringify(stats));
