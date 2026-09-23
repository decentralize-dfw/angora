import * as THREE from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';

// FAZ 7 İŞ 1 - screen-space reflection. The "şıkır şıkır" the audit named
// first: probe reflection alone smears; a mirrored villa silhouette on
// the terrace and the salon floor is what reads as a render engine.
//
// Scope, on purpose:
// - UP-FACING surfaces only (world normal.y >= NORMAL_GATE): terrace,
//   interior floors, pool deck - the order's own target list. Facade
//   glass keeps its probe+polish path (İŞ E.1); marching every vertical
//   pane would double-pay what the envmap already tells.
// - The POOL RECT is excluded by world-space bounds (uPoolRect, from
//   waterBoundsFrom): poolWaterV2 drives its own reflection and stacking
//   SSR on it would double-reflect (the order's explicit trap).
// - No per-pixel roughness G-buffer exists in this composer; floors get
//   a fresnel-weighted constant reflectivity with distance fade instead.
//   Measured limitation, written here, not hidden.
//
// Depth+normals are REUSED from the GTAO pass (uEnabled drops to 0 when
// AO is off rather than re-rendering a G-buffer - SSR rides where the
// buffers already exist).

export const SsrShader = {
  name: 'AngoraSSR',
  uniforms: {
    tDiffuse: {value: null},
    tDepth: {value: null},
    tNormal: {value: null},
    uEnabled: {value: 0},
    uStrength: {value: 0.5},
    uProjection: {value: new THREE.Matrix4()},
    uInverseProjection: {value: new THREE.Matrix4()},
    uCameraWorld: {value: new THREE.Matrix4()},
    uPoolRect: {value: new THREE.Vector4(1, 1, -1, -1)},   // empty rect
    uResolution: {value: new THREE.Vector2(1, 1)},
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: /* glsl */`
    varying vec2 vUv;
    uniform sampler2D tDiffuse, tNormal;
    uniform highp sampler2D tDepth;
    uniform float uEnabled, uStrength;
    uniform mat4 uProjection, uInverseProjection, uCameraWorld;
    uniform vec4 uPoolRect;
    uniform vec2 uResolution;
    // KAPANIŞ İŞ 1: ölçüm sonrası ucuzlatma - 28 adım/32 m yerine
    // 12 adım/10 m (+4 ikili arama). Teras/zemin yansıması 10 m'de
    // fazlasıyla dolu; maliyet ~5x düşer, görünürlük aynı sınıf.
    #define STEPS 12
    #define REFINE 4
    #define MAX_DISTANCE 10.0
    #define THICKNESS 0.4
    #define NORMAL_GATE 0.64
    vec3 viewPosition(vec2 uv, float depth) {
      vec4 clip = vec4(vec3(uv, depth) * 2.0 - 1.0, 1.0);
      vec4 view = uInverseProjection * clip;
      return view.xyz / view.w;
    }
    vec2 toUv(vec3 view) {
      vec4 clip = uProjection * vec4(view, 1.0);
      return clip.xy / clip.w * 0.5 + 0.5;
    }
    void main() {
      vec4 source = texture2D(tDiffuse, vUv);
      gl_FragColor = source;
      if (uEnabled < 0.5) return;
      float depth = texture2D(tDepth, vUv).x;
      if (depth >= 1.0) return;                               // sky
      vec3 viewPos = viewPosition(vUv, depth);
      vec3 viewNormal = normalize(texture2D(tNormal, vUv).xyz * 2.0 - 1.0);
      vec3 worldNormal = mat3(uCameraWorld) * viewNormal;
      if (worldNormal.y < NORMAL_GATE) return;                // floors only
      vec3 worldPos = (uCameraWorld * vec4(viewPos, 1.0)).xyz;
      if (worldPos.x > uPoolRect.x && worldPos.z > uPoolRect.y &&
          worldPos.x < uPoolRect.z && worldPos.z < uPoolRect.w) return;  // pool water owns itself
      vec3 viewDir = normalize(viewPos);
      vec3 rayDir = normalize(reflect(viewDir, viewNormal));
      if (rayDir.z > 0.35) return;                            // toward camera = nothing to hit
      float stride = MAX_DISTANCE / float(STEPS);
      vec3 ray = viewPos;
      vec3 hit = vec3(0.0);
      float found = 0.0;
      for (int i = 0; i < STEPS; i ++) {
        ray += rayDir * stride;
        vec2 uv = toUv(ray);
        if (uv.x <= 0.0 || uv.x >= 1.0 || uv.y <= 0.0 || uv.y >= 1.0) break;
        float sceneZ = viewPosition(uv, texture2D(tDepth, uv).x).z;
        float delta = sceneZ - ray.z;                        // both negative forward
        if (delta > 0.0 && delta < THICKNESS + stride) {
          // binary refine toward the surface
          vec3 lo = ray - rayDir * stride, hi = ray;
          for (int j = 0; j < REFINE; j ++) {
            vec3 mid = (lo + hi) * 0.5;
            vec2 midUv = toUv(mid);
            float midZ = viewPosition(midUv, texture2D(tDepth, midUv).x).z;
            if (midZ - mid.z > 0.0) hi = mid; else lo = mid;
          }
          hit = hi;
          found = 1.0;
          break;
        }
      }
      if (found < 0.5) return;
      vec2 hitUv = toUv(hit);
      float edge = smoothstep(0.0, 0.08, min(min(hitUv.x, 1.0 - hitUv.x), min(hitUv.y, 1.0 - hitUv.y)));
      float travel = 1.0 - clamp(distance(hit, viewPos) / MAX_DISTANCE, 0.0, 1.0);
      float fresnel = pow(1.0 - clamp(dot(-viewDir, viewNormal), 0.0, 1.0), 5.0);
      float weight = uStrength * edge * travel * (0.18 + 0.82 * fresnel);
      vec3 reflection = texture2D(tDiffuse, hitUv).rgb;
      gl_FragColor = vec4(mix(source.rgb, reflection, clamp(weight, 0.0, 0.85)), source.a);
    }`,
};

export class SsrPass extends ShaderPass {
  constructor(ao, camera) {
    super(SsrShader);
    this.ao = ao;
    this.camera = camera;
  }
  setCamera(camera) { this.camera = camera; }
  setPoolRect(rect) { if (rect) this.uniforms.uPoolRect.value.copy(rect); }
  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    const usable = Boolean(this.ao?.enabled && this.ao.depthTexture && this.ao.normalRenderTarget);
    this.uniforms.uEnabled.value = usable ? 1 : 0;
    if (usable) {
      this.uniforms.tDepth.value = this.ao.depthTexture;
      this.uniforms.tNormal.value = this.ao.normalRenderTarget.texture;
      this.uniforms.uProjection.value.copy(this.camera.projectionMatrix);
      this.uniforms.uInverseProjection.value.copy(this.camera.projectionMatrixInverse);
      this.uniforms.uCameraWorld.value.copy(this.camera.matrixWorld);
    }
    super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
  }
}
