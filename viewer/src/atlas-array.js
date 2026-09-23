import * as THREE from 'three';

// Task 3.3, runtime half. The consolidated materials sample their maps out
// of a grid atlas through textureLod with a clamped maxLod - the clamp is
// the far-surface shimmer, and it also forfeits anisotropy and hardware
// wrapping. Rebuilt as a texture array (one layer per cell) the same texels
// get the full mip chain, true RepeatWrapping and the tier's anisotropy,
// with continuous UVs so the derivatives are honest. The 248px cells stay
// 248px: raising them to 512/1024 needs the atlas re-laid at build time,
// which H6 blocks until the source directory exists.
//
// The originals keep their texture OBJECTS - three's USE_* defines and UV
// varyings hang off material.map & co - but their images shrink to one
// texel, so the VRAM moves to the array instead of doubling.

const SLOTS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap'];

export function buildAtlasArray(texture, batch) {
  const image = texture?.image;
  if (!image?.width) return null;
  const grid = batch.grid, layers = grid * grid;
  const size = Math.max(1, Math.round(image.width * batch.inner));
  const canvas = typeof OffscreenCanvas === 'undefined'
    ? Object.assign(document.createElement('canvas'), {width: size, height: size})
    : new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  const data = new Uint8Array(size * size * 4 * layers);
  for (let i = 0; i < layers; i++) {
    const ox = ((i % grid) / grid + batch.pad) * image.width;
    const oy = (Math.floor(i / grid) / grid + batch.pad) * image.height;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(image, ox, oy, image.width * batch.inner, image.height * batch.inner, 0, 0, size, size);
    data.set(ctx.getImageData(0, 0, size, size).data, i * size * size * 4);
  }
  const array = new THREE.DataArrayTexture(data, size, size, layers);
  array.format = THREE.RGBAFormat;
  array.type = THREE.UnsignedByteType;
  array.wrapS = array.wrapT = THREE.RepeatWrapping;
  array.minFilter = THREE.LinearMipmapLinearFilter;
  array.magFilter = THREE.LinearFilter;
  array.generateMipmaps = true;
  array.colorSpace = texture.colorSpace;
  array.anisotropy = texture.anisotropy;
  array.needsUpdate = true;
  return array;
}

// One texel keeps the texture object - and every define that hangs off it -
// alive while the array carries the actual texels.
function shrinkToPlaceholder(texture) {
  if (!texture?.image?.width || texture.image.width === 1) return;
  const canvas = typeof OffscreenCanvas === 'undefined'
    ? Object.assign(document.createElement('canvas'), {width: 1, height: 1})
    : new OffscreenCanvas(1, 1);
  canvas.getContext('2d').drawImage(texture.image, 0, 0, 1, 1);
  texture.image = canvas;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
}

// Idle upgrade pass: every atlased material (grid>1) gets its arrays, keyed
// by SOURCE texture so an ORM shared between roughness and metalness builds
// once. Returns how many materials switched; each recompiles exactly once.
export function upgradeAtlasToArrays(models) {
  const arrays = new Map();   // source texture -> DataArrayTexture
  let applied = 0;
  const seen = new Set();
  for (const model of models.values()) {
    model.traverse(object => {
      if (!object.isMesh) return;
      const material = Array.isArray(object.material) ? null : object.material;
      const batch = material?.userData.angoraBatch;
      // KAPANIŞ İŞ 4.1: cellGrade'li materyal 3 aile dizisini zaten
      // taşıyor; üstüne 4 atlas dizisi daha bindirmek 16 birim tavanını
      // yeniden zorlar. O materyaller temel atlas sampler'larında kalır.
      if (!batch || batch.grid <= 1 || seen.has(material) || material.userData.atlasArrays || material.userData.cellGrade) return;
      seen.add(material);
      const bound = {};
      for (const slot of SLOTS) {
        const texture = material[slot];
        if (!texture || material.userData.exteriorGradeDetail?.includes(slot)) continue;
        if (!arrays.has(texture)) arrays.set(texture, buildAtlasArray(texture, batch));
        const array = arrays.get(texture);
        if (array) bound[slot] = array;
      }
      if (!Object.keys(bound).length) return;
      material.userData.atlasArrays = bound;
      for (const slot of Object.keys(bound)) shrinkToPlaceholder(material[slot]);
      material.needsUpdate = true;
      applied++;
    });
  }
  return applied;
}
