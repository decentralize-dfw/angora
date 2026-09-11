import * as THREE from 'three';

// Two readings of the same neighbourhood geometry. Far out the context keeps
// its photographic materials; once the camera settles on the villa the same
// buildings fade to a white massing model so the property reads as the subject
// and the neighbours as its setting. Nothing here edits the delivered model:
// the split, the merge and the fade are all engine state, so a re-exported
// model inherits them untouched.
export const MASSING_ALBEDO = '#f4f3f0';
export const MASSING_ROUGHNESS = .86;
export const MASSING_SPAN = 900;
export const VEHICLE_ALBEDO = '#9ea3a8';

// Neighbour blocks arrive as `B10 | KAT 0$DUVAR`, their footings as
// `B10 foundation below BK`. Everything else in the file — terrain, roads,
// curbs, retaining walls, planting — is site, and site never turns white.
const BUILDING_NODE = /^B\d+(\s|$)/;
const VEHICLE_NODE = /^R35 \| Garage vehicle(\s|$)/;

// GLTFLoader renames every node on the way in: whitespace becomes `_`, the
// track-binding characters []./: are dropped, and a repeated name picks up a
// `_2` tail. Read the authored name back before matching it, or `B10 | KAT
// 0$DUVAR` arrives as `B10_|_KAT_0$DUVAR` and no prefix ever matches.
export const authoredNodeName = (name = '') => name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

const textureId = value => (value?.isTexture ? value.uuid : value === undefined ? '-' : String(value));

// Two materials are the same material when every value that reaches a shader
// matches. Names are deliberately excluded: the export splits one authored
// surface across several numbered copies, and those are exactly the ones worth
// collapsing.
export function materialSignature(material) {
  return JSON.stringify([
    material.type, material.color?.getHex(), material.roughness, material.metalness,
    material.emissive?.getHex(), material.emissiveIntensity, material.opacity, material.transparent,
    material.alphaTest, material.side, material.flatShading, material.vertexColors, material.transmission,
    material.clearcoat, material.clearcoatRoughness, material.ior, material.sheen, material.specularIntensity,
    material.normalScale?.toArray(), material.aoMapIntensity, material.envMapIntensity, material.displacementScale,
    ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'bumpMap']
      .map(key => textureId(material[key])),
  ]);
}

// Collapse duplicates onto one shared instance so the batcher, the shader cache
// and every later pass see a single surface where the model carried several.
export function mergeEqualMaterials(root) {
  const canonical = new Map(), signatures = new WeakMap();
  let merged = 0;
  root.traverse(object => {
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const resolved = materials.map(material => {
      if (!material) return material;
      // A model file reaches this with thousands of nodes and dozens of
      // surfaces; sign each surface once rather than once per node.
      let key = signatures.get(material);
      if (key === undefined) signatures.set(material, key = materialSignature(material));
      const first = canonical.get(key);
      if (!first) {canonical.set(key, material); return material;}
      if (first !== material) merged++;
      return first;
    });
    object.material = Array.isArray(object.material) ? resolved : resolved[0];
  });
  return merged;
}

// The garage car ships with seventeen authored surfaces — two paints, rims,
// brakes, tyres, glass, trim. As a staged prop it only has to read as a car, so
// it becomes one abstract base and stops competing with the architecture.
export function abstractVehicle(root) {
  let base = null, count = 0;
  root.traverse(object => {
    if (!object.isMesh || !VEHICLE_NODE.test(authoredNodeName(object.name))) return;
    base ??= new THREE.MeshStandardMaterial({
      name: 'R35 | Garage vehicle abstract base', color: new THREE.Color(VEHICLE_ALBEDO),
      roughness: .45, metalness: .12,
    });
    object.material = base;
    count++;
  });
  return count;
}

// The plot's own earth is one node that shares two of its three surfaces with
// geometry that must never be cut - the neighbourhood terrain and 42 block
// foundations - so cutting the excavation open at the basement view needs the
// soil to hold private material instances first. Runs before the building
// split, which then still sees the original site materials.
export const PLOT_SOIL_NODE = /^R32 \| Continuous local soil volume\b/;

export function splitContextSoil(root) {
  const clones = new Map();
  root.traverse(object => {
    if (!object.isMesh || !PLOT_SOIL_NODE.test(authoredNodeName(object.name))) return;
    const swap = material => {
      if (!material) return material;
      let clone = clones.get(material);
      if (!clone) {
        clone = material.clone();
        clone.name = material.name + ' · plot section';
        clone.userData = {...material.userData, plotSoil: true};
        clones.set(material, clone);
      }
      return clone;
    };
    object.material = Array.isArray(object.material) ? object.material.map(swap) : swap(object.material);
  });
  return root;
}

// Give the neighbour blocks their own material instances wherever they share one
// with the site, so whitening the buildings cannot reach the curbs that happen to
// use the same paving surface.
export function splitContextBuildings(root) {
  const usage = new Map();
  root.traverse(object => {
    if (!object.isMesh) return;
    const building = BUILDING_NODE.test(authoredNodeName(object.name));
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material) continue;
      const seen = usage.get(material) ?? {building: false, site: false};
      seen[building ? 'building' : 'site'] = true;
      usage.set(material, seen);
    }
  });
  const clones = new Map();
  for (const [material, seen] of usage) {
    if (!seen.building) continue;
    if (!seen.site) {material.userData.contextBuilding = true; continue;}
    const clone = material.clone();
    clone.userData = {...material.userData, contextBuilding: true};
    clones.set(material, clone);
  }
  if (clones.size) root.traverse(object => {
    if (!object.isMesh || !BUILDING_NODE.test(authoredNodeName(object.name))) return;
    const swap = material => clones.get(material) ?? material;
    object.material = Array.isArray(object.material) ? object.material.map(swap) : swap(object.material);
  });
  return root;
}

// One shared uniform drives every whitened surface, so the fade costs a single
// float per frame and the buildings cross over together instead of in bands.
export function createContextMassing(root) {
  const blend = {value: 0}, colour = {value: new THREE.Color(MASSING_ALBEDO)};
  const attached = new Set();
  root.traverse(object => {
    if (!object.isMesh) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material?.userData?.contextBuilding || attached.has(material)) continue;
      attached.add(material);
      const previous = material.onBeforeCompile, previousKey = material.customProgramCacheKey();
      material.onBeforeCompile = (shader, renderer) => {
        previous.call(material, shader, renderer);
        shader.uniforms.massingBlend = blend;
        shader.uniforms.massingColour = colour;
        shader.fragmentShader = 'uniform float massingBlend;\nuniform vec3 massingColour;\n' + shader.fragmentShader;
        // Albedo first, so the sun, the sky probe and the occlusion pass all keep
        // describing the same solid rather than a flat white silhouette.
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>',
          '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, massingColour, massingBlend);');
        shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>',
          `#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, ${MASSING_ROUGHNESS.toFixed(2)}, massingBlend);`);
        shader.fragmentShader = shader.fragmentShader.replace('#include <metalnessmap_fragment>',
          '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 0.0, massingBlend);');
        // Roof tile and render relief belong to the photographic reading; a
        // massing model is smooth, so the perturbation eases out with the colour.
        if (material.normalMap) shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>',
          '#include <normal_fragment_maps>\nnormal = normalize(mix(normal, nonPerturbedNormal, massingBlend));');
      };
      material.customProgramCacheKey = () => previousKey + '|massing-r39';
      material.needsUpdate = true;
    }
  });
  let from = 0, to = 0, start = 0;
  const ease = t => t * t * (3 - 2 * t);
  return {
    surfaces: attached.size,
    get value() {return blend.value;},
    // Villa and the floor cuts are the close reading; neighbourhood and region
    // stay photographic.
    set(view, immediate = false) {
      const target = view === 'building' || /^f\d$/.test(view) ? 1 : 0;
      if (target === to) return;
      to = target;
      const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (immediate || reduced) {blend.value = from = to; return;}
      from = blend.value; start = performance.now();
    },
    update(time) {
      if (blend.value === to) return false;
      const t = Math.min(1, (time - start) / MASSING_SPAN);
      blend.value = THREE.MathUtils.lerp(from, to, ease(t));
      if (t >= 1) blend.value = to;
      return true;
    },
  };
}
