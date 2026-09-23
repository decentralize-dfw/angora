import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SMAAPass} from 'three/addons/postprocessing/SMAAPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {SectionGTAOPass} from './section-gtao.js';
import {SsrPass} from './ssr-pass.js';
import {LinearBloomPass} from './linear-bloom.js';
import {GradeShader} from './grade-pass.js';
import {DisplayDitherShader} from './display-dither.js';
import {configurePostprocessing} from './postprocessing.js';
import {referenceProfile} from './render-profile.js';
import {FEATURES} from './features.js';

// Task 4.2: the whole desktop composer - passes, their shaders, GTAO's
// tables - lives behind this dynamic seam. A phone's quality row never asks
// for it, so a phone never downloads it; desktop pays it after boot, off
// the critical path. The build stays exactly the chain 1.1b shipped.
export function buildPostfxChain({renderer, scene, camera, clip, quality, postfxV2}) {
  const target = new THREE.WebGLRenderTarget(1, 1, {type: THREE.HalfFloatType, samples: referenceProfile.msaaSamples});
  const composer = new EffectComposer(renderer, target);
  const beauty = new RenderPass(scene, camera);
  // Full-resolution occlusion: at .85 the denoiser smeared contact shading
  // off thin rails and window reveals - the pass is the pipeline's own
  // stated "largest tell", so it gets its headroom.
  const ao = new SectionGTAOPass(scene, camera, clip, quality.gtaoResolutionScale ?? 1);
  const smaa = new SMAAPass(), bloom = new LinearBloomPass();
  const grade = new ShaderPass(GradeShader);
  ao.enabled = postfxV2 ? Boolean(quality.gtao) : referenceProfile.aoEnabled;
  bloom.enabled = postfxV2 ? Boolean(quality.bloom) : true;
  // FAZ 7 İŞ 1: SSR reuses the GTAO pass's depth+normal buffers; the pass
  // exists only when the quality row resolved ssr (desktop, flag'lı) and
  // self-disables per frame when AO is off, so the flag-off chain is the
  // FAZ 6 chain object for object.
  // AYDINLIK İŞ 4: yüksek anahtar - siyah nokta yukarı (dipler
  // yapışmasın), orta tonlara hafif amber, kontrast aşağı. Emlak
  // fotoğrafı referansı; gotik değil. Değerler uniform - bayrak
  // kapalıyken shader'a tek byte dokunulmaz.
  if (FEATURES.warmGradeV1) {
    grade.material.uniforms.uLift.value.set(0.016, 0.015, 0.012);
    grade.material.uniforms.uWarm.value.set(1.045, 1.005, 0.94);
    grade.material.uniforms.uContrast.value = 0.92;
    grade.material.uniforms.uVig.value.y = 0.05;   // vinyet de yarı - kasvet kalemi
  }
  const ssr = quality.ssr ? new SsrPass(ao, camera) : null;
  configurePostprocessing(composer, {beauty, ao, ssr, smaa, bloom, output: grade,
    dither: new ShaderPass(DisplayDitherShader)});
  return {composer, beauty, ao, ssr, bloom, grade};
}
