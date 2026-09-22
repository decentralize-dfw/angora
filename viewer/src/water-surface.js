import {Vector4} from 'three';

// Task 3.5 - the pool. The delivered water is 504 flat triangles of #b8e3e6
// inside the garden batch, addressed per vertex by _batchid like every other
// consolidated surface. No SSR and no second scene pass: two analytic wave
// layers perturb the normal (different scale and drift), three's own PBR
// supplies the Fresnel and the environment reflection - which, after 3.4f,
// carries the settlement silhouette - and an edge-to-centre absorption term
// replaces the flat tint. The drift phase follows the DAYLIGHT HOUR, not the
// wall clock: the viewer renders on demand, so clock-driven water would make
// two captures of the same state disagree while never actually animating in
// the product; the hour is the one time axis the product moves.

// Deep after ~2.4 m of water, the plan's own constant.
export const WATER_DEPTH_SPAN = 2.4;
export const WATER_SHALLOW = [0.72, 0.89, 0.9];   // the authored #b8e3e6 kept at the rim
export const WATER_DEEP = [0.11, 0.31, 0.36];

// The batch interleaves every surface into one geometry, so the water's own
// rectangle is recovered once, on the CPU, from the vertices whose batch id
// matches - the shader then measures edge distance against it.
export function waterBoundsFrom(geometry, index) {
  const id = geometry.getAttribute('_batchid');
  const position = geometry.getAttribute('position');
  if (!id || !position) return null;
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity, seen = 0;
  for (let i = 0; i < id.count; i++) {
    if (Math.round(id.getX(i)) !== index) continue;
    seen++;
    const x = position.getX(i), z = position.getZ(i);
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  return seen ? new Vector4(minX, minZ, maxX, maxZ) : null;
}

export function applyWaterSurface(material, {bounds, phase}) {
  const batch = material.userData.angoraBatch;
  if (!batch || !bounds) return false;
  const index = batch.materials.indexOf('water');
  if (index < 0) return false;
  const previous = material.onBeforeCompile, key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms.waterBounds = {value: bounds};
    shader.uniforms.waterPhase = phase;
    shader.vertexShader = 'varying float vWaterMask;\nvarying vec3 vWaterWorld;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
vWaterMask = abs(_batchid - ${index.toFixed(1)}) < .5 ? 1.0 : 0.0;
vWaterWorld = (modelMatrix * vec4(position, 1.0)).xyz;`);
    shader.fragmentShader = `varying float vWaterMask;
varying vec3 vWaterWorld;
uniform vec4 waterBounds;
uniform float waterPhase;
// Two wave layers as analytic gradients: layer one at ~1.8 m ripple scale,
// layer two at ~0.55 m chop, drifting on different headings.
vec3 waterWaveNormal(vec2 p, float t) {
  vec2 g = vec2(0.0);
  g += 0.030 * cos(dot(p, vec2(2.1, 1.4)) + t * 0.9) * vec2(2.1, 1.4);
  g += 0.024 * cos(dot(p, vec2(-1.6, 2.3)) - t * 0.7) * vec2(-1.6, 2.3);
  g += 0.014 * cos(dot(p, vec2(7.3, 5.1)) + t * 1.7) * vec2(7.3, 5.1);
  g += 0.011 * cos(dot(p, vec2(-5.7, 8.2)) - t * 1.3) * vec2(-5.7, 8.2);
  return normalize(vec3(-g.x, 1.0, -g.y));
}
` + shader.fragmentShader;
    // The perturbed water normal replaces the flat one in view space, so the
    // Fresnel term and the environment lookup ripple together.
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
if (vWaterMask > .5) {
  vec3 waveWorld = waterWaveNormal(vWaterWorld.xz, waterPhase);
  normal = normalize((viewMatrix * vec4(waveWorld, 0.0)).xyz);
}`);
    // Edge-to-centre absorption stands in for real depth: shallow keeps the
    // authored tint, the middle drops toward the deep term.
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
if (vWaterMask > .5) {
  vec2 rim = min(vWaterWorld.xz - waterBounds.xy, waterBounds.zw - vWaterWorld.xz);
  float depth = clamp(min(rim.x, rim.y) / ${WATER_DEPTH_SPAN.toFixed(1)}, 0.0, 1.0);
  diffuseColor.rgb = mix(vec3(${WATER_SHALLOW.map(v => v.toFixed(3)).join(', ')}),
                         vec3(${WATER_DEEP.map(v => v.toFixed(3)).join(', ')}), depth);
}`);
    // Water is a dielectric mirror at grazing angles: low roughness so the
    // probe reflection stays legible, zero metalness so Fresnel does the work.
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
if (vWaterMask > .5) roughnessFactor = 0.07;`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
if (vWaterMask > .5) metalnessFactor = 0.0;`);
  };
  material.customProgramCacheKey = () => key + '|water-v1|' + index;
  material.needsUpdate = true;
  return true;
}
