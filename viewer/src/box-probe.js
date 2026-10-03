import * as THREE from 'three';

// V-RAY B1: kutu izdüşümlü oda sondası. Kat sondası (room-probes, odanın
// ortasından 512 px HDR) şimdiye kadar SONSUZ UZAKTAYMIŞ gibi örneklendi:
// parkede, metalde, camda yansıma bakış açısıyla "kayıyordu" - pencere
// yansıması zeminde kameraya göre yer değiştiriyordu. Burada yansıma ışını
// katın kutusuna (sonda o kutunun içinde çekildi) çarptırılır ve sonda o çarpma
// noktasından örneklenir (paralaks düzeltmesi). Tek ek iş: piksel başına bir
// kutu kesişimi; döngü yok, yeni doku yok.

export const BOX_PROBE = {
  min: {value: new THREE.Vector3(-1, -1, -1)},
  max: {value: new THREE.Vector3(1, 1, 1)},
  pos: {value: new THREE.Vector3()},
  on: {value: 0},
};

const CORRECTION = `
      #ifdef ANGORA_BOX_PROBE
      if (uProbeOn > 0.5 && all(greaterThan(vBoxWorld, uProbeMin)) && all(lessThan(vBoxWorld, uProbeMax))) {
        vec3 safe = reflectVec + vec3(lessThan(abs(reflectVec), vec3(1e-4))) * 1e-4;
        vec3 far = mix(uProbeMin, uProbeMax, step(0.0, safe));
        vec3 t = (far - vBoxWorld) / safe;
        float hit = min(min(t.x, t.y), t.z);
        reflectVec = normalize(vBoxWorld + reflectVec * hit - uProbePos);
      }
      #endif`;

function patchedChunk() {
  const chunk = THREE.ShaderChunk.envmap_physical_pars_fragment;
  const anchor = 'reflectVec = inverseTransformDirection( reflectVec, viewMatrix );';
  if (!chunk.includes(anchor)) return null;   // three değiştiyse sessizce eski davranış
  return chunk.replace(anchor, anchor + CORRECTION);
}

export function applyBoxProjection(material) {
  if (material.userData.boxProbe) return;
  const chunk = patchedChunk();
  if (!chunk) return;
  material.userData.boxProbe = true;
  const previous = material.onBeforeCompile;
  material.onBeforeCompile = function (shader, renderer) {
    previous?.call(this, shader, renderer);
    shader.uniforms.uProbeMin = BOX_PROBE.min;
    shader.uniforms.uProbeMax = BOX_PROBE.max;
    shader.uniforms.uProbePos = BOX_PROBE.pos;
    shader.uniforms.uProbeOn = BOX_PROBE.on;
    shader.vertexShader = 'varying vec3 vBoxWorld;\n' + shader.vertexShader.replace('#include <worldpos_vertex>',
      '#include <worldpos_vertex>\n#ifdef USE_ENVMAP\n  vBoxWorld = worldPosition.xyz;\n#else\n  vBoxWorld = vec3(0.0);\n#endif');
    shader.fragmentShader = '#define ANGORA_BOX_PROBE\nvarying vec3 vBoxWorld;\nuniform vec3 uProbeMin, uProbeMax, uProbePos;\nuniform float uProbeOn;\n' +
      shader.fragmentShader.replace('#include <envmap_physical_pars_fragment>', chunk);
  };
  const previousKey = material.customProgramCacheKey?.bind(material);
  material.customProgramCacheKey = () => (previousKey ? previousKey() : '') + '|boxprobe';
  material.needsUpdate = true;
}

// Kat kutusu: binanın XZ sınırı, katın döşemesinden bir kat yüksekliği.
export function setBoxProbe(box) {
  if (!box) {BOX_PROBE.on.value = 0; return;}
  BOX_PROBE.min.value.copy(box.min); BOX_PROBE.max.value.copy(box.max); BOX_PROBE.pos.value.copy(box.probe);
  BOX_PROBE.on.value = 1;
}
