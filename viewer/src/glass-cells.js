// FAZ 6 İŞ E.1 (FAZ-6-DUZ-RENK.md BÖLÜM 4.5). glassTiersV2 shipped DEAD:
// build.mjs stamps angoraAuthoredPBR:true on all 37 batched materials
// (verified 37/37 in the brief), so `!angoraAuthoredPBR` never held and
// the exterior-glass polish never ran. The field is not a discriminator on
// the batched path; the batch MEMBER NAMES are. And the polish cannot be
// per-material either: architecture-glass-3 carries the lift's
// photographed rose glass (cell range=255, a real photo) in the same
// material as the clear panes - clamp the material and the rose window
// turns into a mirror. So the clamp is per CELL, gated by _batchid, the
// same mechanism İŞ B uses.

// The cells that ARE exterior clear glazing. The frosted interior set
// (shower/etched/satin, interior-glass-9) is not matched and additionally
// never reaches here (part filter); the rose glass is explicitly not
// matched.
const POLISH = /^(glass|R31 \| R35 clear door glass|Context glazing)$/i;

export function glassPolishMask(batch) {
  const mask = batch.materials.map(name => POLISH.test(name) ? 1 : 0);
  return mask.some(v => v) ? mask : null;
}

// Per-cell roughness ceiling: the pane goes near-mirror so the probe's
// settlement silhouette (3.4f) actually shows; every other cell of the
// material keeps its authored response byte-for-byte.
export function applyGlassCellPolish(material, {ceiling = 0.12} = {}) {
  const batch = material.userData.angoraBatch;
  if (!batch || material.userData.glassCellPolish) return false;
  const mask = glassPolishMask(batch);
  if (!mask) return false;
  material.userData.glassCellPolish = true;
  const previous = material.onBeforeCompile, key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms.uGlassPolish = {value: mask};
    shader.fragmentShader = `uniform float uGlassPolish[${mask.length}];\n` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
if(uGlassPolish[int(clamp(floor(batchId+0.5),0.0,${(mask.length - 1).toFixed(1)}))]>0.5)roughnessFactor=min(roughnessFactor,${ceiling.toFixed(2)});`);
  };
  material.customProgramCacheKey = () => key + '|glass-cells-v1:' + mask.join('');
  material.needsUpdate = true;
  return true;
}
