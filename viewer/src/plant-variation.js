import {BufferAttribute} from 'three';

// Task 2.3 (runtime half). Same green times four hundred trees is what the
// plan calls plastic. The delivery bakes every plant into one buffer with
// no instance identity, but separate plants never share vertices - so a
// union-find over the index recovers each plant as a connected component,
// and one byte of per-vertex seed lets the shader drift hue (±6°) and
// value (±12%) per PLANT, not per pixel. Rotation/scale jitter would move
// authored geometry from the runtime and waits for the build side (H6).

export function segmentConnectedComponents(geometry) {
  const index = geometry.index;
  const count = geometry.attributes.position.count;
  if (!index || !count) return null;
  const parent = new Uint32Array(count);
  for (let i = 0; i < count; i++) parent[i] = i;
  const find = i => {
    let root = i;
    while (parent[root] !== root) root = parent[root];
    while (parent[i] !== root) {const next = parent[i]; parent[i] = root; i = next;}
    return root;
  };
  for (let i = 0; i < index.count; i += 3) {
    const a = find(index.getX(i)), b = find(index.getX(i + 1)), c = find(index.getX(i + 2));
    if (b !== a) parent[b] = a;
    if (c !== a) parent[c] = a;
  }
  const seeds = new Float32Array(count);
  const componentSeed = new Map();
  for (let i = 0; i < count; i++) {
    const root = find(i);
    let seed = componentSeed.get(root);
    if (seed === undefined) {
      // Deterministic per component, decorrelated between neighbours in
      // creation order: the golden-ratio walk never repeats early.
      seed = (componentSeed.size * 0.61803398875) % 1;
      componentSeed.set(root, seed);
    }
    seeds[i] = seed;
  }
  return {seeds, components: componentSeed.size};
}

export function applyPlantVariation(mesh) {
  const geometry = mesh.geometry;
  if (!geometry || geometry.attributes._plantSeed) return 0;
  const segmented = segmentConnectedComponents(geometry);
  if (!segmented || segmented.components < 2) return 0;
  geometry.setAttribute('_plantSeed', new BufferAttribute(segmented.seeds, 1));
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const material of materials) {
    if (!material || material.userData.plantVariation) continue;
    material.userData.plantVariation = true;
    const previous = material.onBeforeCompile, key = material.customProgramCacheKey();
    material.onBeforeCompile = (shader, renderer) => {
      previous.call(material, shader, renderer);
      shader.vertexShader = 'attribute float _plantSeed;\nvarying float vPlantSeed;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPlantSeed=_plantSeed;');
      shader.fragmentShader = `varying float vPlantSeed;
// ±6° hue as a cheap RGB rotation around the grey axis, ±12% value.
vec3 plantDrift(vec3 c, float seed) {
  float hue = (seed - 0.5) * 0.2094;   // ±6° in radians
  float value = 1.0 + (fract(seed * 7.13) - 0.5) * 0.24;
  const vec3 axis = vec3(0.57735);
  vec3 rotated = c * cos(hue) + cross(axis, c) * sin(hue) + axis * dot(axis, c) * (1.0 - cos(hue));
  return rotated * value;
}
` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\ndiffuseColor.rgb = clamp(plantDrift(diffuseColor.rgb, vPlantSeed), 0.0, 1.0);');
    };
    material.customProgramCacheKey = () => key + '|plant-variation-v1';
    material.needsUpdate = true;
  }
  return segmented.components;
}
