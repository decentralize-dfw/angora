import * as THREE from 'three';
import {gradeKey} from './exterior-grade.js';

export const MASSING_ALBEDO = '#f4f3f0';
export const MASSING_ROUGHNESS = .86;
export const MASSING_SPAN = 900;
export const VEHICLE_ALBEDO = '#9ea3a8';

const BUILDING_NODE = /^B\d+(\s|$)/;
const VEHICLE_NODE = /^R35 \| Garage vehicle(\s|$)/;

export const authoredNodeName = (name = '') => name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

const textureId = value => (value?.isTexture ? value.uuid : value === undefined ? '-' : String(value));
const semanticMaterialClass = (name='') => {
  const base=name.replace(/\.\d{3}$/,'');
  if(/^ceiling$/i.test(base))return 'ceiling';
  if(/^interior$/i.test(base))return 'interior';
  if(/clay tile|^roof$|green tiles/i.test(base))return 'roof';
  return '';
};

export function materialSignature(material) {
  return JSON.stringify([
    material.type, semanticMaterialClass(material.name), gradeKey(material.name),
    material.color?.getHex(), material.roughness, material.metalness,
    material.emissive?.getHex(), material.emissiveIntensity, material.opacity, material.transparent,
    material.alphaTest, material.side, material.flatShading, material.vertexColors, material.transmission,
    material.clearcoat, material.clearcoatRoughness, material.ior, material.sheen, material.specularIntensity,
    material.anisotropy, material.anisotropyRotation, material.thickness, material.attenuationDistance,
    material.attenuationColor?.getHex?.(),
    material.normalScale?.toArray(), material.aoMapIntensity, material.envMapIntensity, material.displacementScale,
    ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'bumpMap']
      .map(key => textureId(material[key])),
  ]);
}

export function mergeEqualMaterials(root) {
  const canonical = new Map(), signatures = new WeakMap();
  let merged = 0;
  root.traverse(object => {
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const resolved = materials.map(material => {
      if (!material) return material;
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

export const PLOT_SOIL_NODE = /^R32 \| Continuous local soil volume\b/;

const inPlotSoilNode = object => {
  for (let o = object; o; o = o.parent)
    if (PLOT_SOIL_NODE.test(authoredNodeName(o.name))) return true;
  return false;
};

export function splitContextSoil(root) {
  const clones = new Map();
  root.traverse(object => {
    if (!object.isMesh || !inPlotSoilNode(object)) return;
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

const ROLE_SITE_NODE = /foliage|leaves|leaf|hedge|shrub|tree|grass|boundary limestone|surrounding retaining/i;

export function splitContextBuildings(root, {role} = {}) {
  const isBuilding = object => role === 'buildings'
    ? !ROLE_SITE_NODE.test(authoredNodeName(object.name))
    : BUILDING_NODE.test(authoredNodeName(object.name));
  const usage = new Map();
  root.traverse(object => {
    if (!object.isMesh) return;
    const building = isBuilding(object);
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
    if (!object.isMesh || !isBuilding(object)) return;
    const swap = material => clones.get(material) ?? material;
    object.material = Array.isArray(object.material) ? object.material.map(swap) : swap(object.material);
  });
  return root;
}

export function createContextMassing(root, plotRect = null) {
  const blend = {value: 0}, colour = {value: new THREE.Color(MASSING_ALBEDO)};
  const rect = {value: new THREE.Vector4(plotRect?.minX ?? 0, plotRect?.minZ ?? 0, plotRect?.maxX ?? 0, plotRect?.maxZ ?? 0)};
  const attached = new Set();
  const attach = (material, site) => {
    attached.add(material);
    const previous = material.onBeforeCompile, previousKey = material.customProgramCacheKey();
    material.onBeforeCompile = (shader, renderer) => {
      previous.call(material, shader, renderer);
      shader.uniforms.massingBlend = blend;
      shader.uniforms.massingColour = colour;
      shader.uniforms.massingPlot = rect;
      shader.fragmentShader = 'uniform float massingBlend;\nuniform vec3 massingColour;\nuniform vec4 massingPlot;\n' + shader.fragmentShader;
      let weight = 'massingBlend';
      if (site) {
        shader.vertexShader = 'varying vec3 massingWorld;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>',
          '#include <project_vertex>\nmassingWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        shader.fragmentShader = 'varying vec3 massingWorld;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>',
          `#include <color_fragment>
          vec2 massingOut = max(massingPlot.xy - massingWorld.xz, massingWorld.xz - massingPlot.zw);
          float massingW = massingBlend * smoothstep(0.0, 0.6, max(massingOut.x, massingOut.y));
          diffuseColor.rgb = mix(diffuseColor.rgb, massingColour, massingW);`);
        weight = 'massingW';
      } else {
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>',
          '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, massingColour, massingBlend);');
      }
      shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, ${MASSING_ROUGHNESS.toFixed(2)}, ${weight});`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 0.0, ${weight});`);
      if (material.normalMap) shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>\nnormal = normalize(mix(normal, nonPerturbedNormal, ${weight}));`);
    };
    material.customProgramCacheKey = () => previousKey + (site ? '|massing-site-r49' : '|massing-r39');
    material.needsUpdate = true;
  };
  root.traverse(object => {
    if (!object.isMesh) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material || attached.has(material)) continue;
      if (material.userData.contextBuilding) attach(material, false);
      else if (plotRect) attach(material, true);
    }
  });
  let from = 0, to = 0, start = 0;
  const ease = t => t * t * (3 - 2 * t);
  return {
    surfaces: attached.size,
    get value() {return blend.value;},
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
