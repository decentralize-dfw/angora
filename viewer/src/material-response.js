import {MeshPhysicalMaterial, MeshStandardMaterial, ShaderChunk} from 'three';

// FAZ 7 İŞ 6 - clearcoat & sheen, family-picked from the batch's own
// member names (the same discrimination İŞ E.1 uses; angoraAuthoredPBR
// discriminates nothing on the batched path). The goal is not shine but
// DIFFERENT responses: a lacquered floor and a velvet sofa must not
// answer the same light the same way. Kept to few families, cell-gated
// where a batch mixes them (the lift's rose glass lesson generalizes:
// never clamp a whole material for one cell's look).
//
// Mirrors/chrome are metals - metalness already answers for them; glass
// has its own path. Both stay out of these regexes on purpose.
const COAT = /wood_floor|WOOD-FL|bath_tile|Ochre wall tile|terra_floor|granite floor|porcelain|STONE-TILE|pool_tile/i;
const SHEEN = /fabric|velvet|pillow|drape|curtain|rug|runner|bedspread|sling chair|recliner|blind|sofa(?! feet)/i;

export function responseMasksFor(batch) {
  const coat = batch.materials.map(name => COAT.test(name) ? 1 : 0);
  const sheen = batch.materials.map(name => SHEEN.test(name) ? 1 : 0);
  return {
    coat: coat.some(v => v) ? coat : null,
    sheen: sheen.some(v => v) ? sheen : null,
  };
}

// A batched material arrives as MeshStandardMaterial; clearcoat/sheen live
// on MeshPhysicalMaterial only. copy() carries the standard fields and
// JSON-clones userData (angoraBatch is plain data, so it survives); the
// physical-only fields are then seeded from a pristine instance because
// copy() from a Standard source leaves them undefined.
export function upgradeToPhysical(material) {
  const physical = new MeshPhysicalMaterial();
  // Copy through the STANDARD prototype: Physical.copy would read
  // physical-only fields off a Standard source (undefined -> crash or
  // NaN uniforms); the physical lobes keep their pristine defaults and
  // only the ones we set below ever turn on.
  MeshStandardMaterial.prototype.copy.call(physical, material);
  return physical;
}

// Returns the material to USE (the original, or a physical upgrade with
// the response wired). Call BEFORE prepareBatchedMaterial so the shader
// chains and cache keys stack in one order everywhere.
export function applyMaterialResponse(material) {
  const batch = material.userData.angoraBatch;
  if (!batch || material.userData.materialResponseV2) return material;
  const masks = responseMasksFor(batch);
  if (!masks.coat && !masks.sheen) return material;
  const physical = material.isMeshPhysicalMaterial ? material : upgradeToPhysical(material);
  physical.userData.materialResponseV2 = true;
  // Non-zero scalars make three compile the lobes; the per-cell mask then
  // zeroes them where the batch member is not in the family.
  if (masks.coat) { physical.clearcoat = 0.4; physical.clearcoatRoughness = 0.18; }
  if (masks.sheen) { physical.sheen = 0.55; physical.sheenRoughness = 0.6; }
  const previous = physical.onBeforeCompile, key = physical.customProgramCacheKey();
  const cell = `int(clamp(floor(batchId+0.5),0.0,${(batch.materials.length - 1).toFixed(1)}))`;
  physical.onBeforeCompile = (shader, renderer) => {
    previous.call(physical, shader, renderer);
    let head = '';
    let tail = '';
    if (masks.coat) {
      shader.uniforms.uCoatCell = {value: masks.coat};
      head += `uniform float uCoatCell[${masks.coat.length}];\n`;
      tail += `\n#ifdef USE_CLEARCOAT\nmaterial.clearcoat*=uCoatCell[${cell}];\n#endif`;
    }
    if (masks.sheen) {
      shader.uniforms.uSheenCell = {value: masks.sheen};
      head += `uniform float uSheenCell[${masks.sheen.length}];\n`;
      tail += `\n#ifdef USE_SHEEN\nmaterial.sheenColor*=uSheenCell[${cell}];\n#endif`;
    }
    shader.fragmentShader = head + shader.fragmentShader.replace(
      '#include <lights_physical_fragment>',
      ShaderChunk.lights_physical_fragment + tail);
  };
  physical.customProgramCacheKey = () => key + '|mrv2:' +
    (masks.coat ?? []).join('') + '.' + (masks.sheen ?? []).join('');
  physical.needsUpdate = true;
  return physical;
}
