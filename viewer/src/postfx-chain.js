import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SMAAPass} from 'three/addons/postprocessing/SMAAPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {SectionGTAOPass} from './section-gtao.js';
import {SsrPass} from './ssr-pass.js';
import {LinearBloomPass} from './linear-bloom.js';
import {GradeShader, GRADE} from './grade-pass.js';
// display-dither: İŞ 3.4 ile grade'e katlandı; shader referans olarak duruyor.
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
  const smaa = new SMAAPass();
  // MALZEME İŞ 3.4: bloom yalnız piramit üretir; birleşim + dither grade
  // içinde - tam çözünürlük geçişleri 3 -> 1.
  const bloom = new LinearBloomPass(referenceProfile, {composite: false});
  const grade = new ShaderPass(GradeShader);
  ao.enabled = postfxV2 ? Boolean(quality.gtao) : referenceProfile.aoEnabled;
  bloom.enabled = postfxV2 ? Boolean(quality.bloom) : true;
  grade.material.uniforms.uGlare.value = bloom.glareTexture;
  grade.material.uniforms.uBloomStrength.value = bloom.enabled ? referenceProfile.bloomStrength : 0;
  grade.material.uniforms.uBloomClamp.value = referenceProfile.bloomClamp;
  // FAZ 7 İŞ 1: SSR reuses the GTAO pass's depth+normal buffers; the pass
  // exists only when the quality row resolved ssr (desktop, flag'lı) and
  // self-disables per frame when AO is off, so the flag-off chain is the
  // FAZ 6 chain object for object.
  // AYDINLIK İŞ 4: yüksek anahtar - siyah nokta yukarı (dipler
  // yapışmasın), orta tonlara hafif amber, kontrast aşağı. Emlak
  // fotoğrafı referansı; gotik değil. Değerler uniform - bayrak
  // kapalıyken shader'a tek byte dokunulmaz.
  // ADIM 2 (daylightV2): nötr. Referansların ikisi de hiç renklendirmiyor -
  // "altı küçük sıcak sapma bir sarı filtredir" (edetri). Siyah nokta sıfır
  // (gölgeler grileşmez), amber yok, ek doygunluk yok; kontrastı ACES'in
  // kendi eğrisi verir. Hafif vinyet göze merkezi gösterir.
  if (FEATURES.daylightV2) {
    grade.material.uniforms.uLift.value.set(0, 0, 0);
    grade.material.uniforms.uGain.value.set(1, 1, 1);
    grade.material.uniforms.uWarm.value.set(1, 1, 1);
    // ACES itself pushes mid-saturated hues (grass, tile) up; the lower end of
    // the references' own saturation range (0.94-1.06) takes that back.
    grade.material.uniforms.uSat.value = 0.88;   // ürün sahibi: 0.94 hâlâ fazla doygun
    grade.material.uniforms.uContrast.value = 0.96; // ve fazla kontrastlı
    grade.material.uniforms.uVig.value.y = 0.08;
  } else if (FEATURES.warmGradeV1) {
    // Ürün sahibi ilk turda "renkler çok depresif" dedi: kontrast 0.92 ile
    // düşürülmüş, doygunluk taban değerinde ve sis rengi emiyordu. Sis
    // kalktı; kontrast nötre döndü (düşük kontrast davetkâr değil, CANSIZ
    // yapar) ve doygunluk yukarı alındı. Amber orta tonlarda kaldı.
    grade.material.uniforms.uLift.value.set(0.014, 0.013, 0.010);
    grade.material.uniforms.uWarm.value.set(1.055, 1.010, 0.930);
    grade.material.uniforms.uContrast.value = 1.02;
    grade.material.uniforms.uSat.value = GRADE.saturation * 1.18;
    grade.material.uniforms.uVig.value.y = 0.03;
  }
  const ssr = quality.ssr ? new SsrPass(ao, camera) : null;
  configurePostprocessing(composer, {beauty, ao, ssr, smaa, bloom, output: grade});
  return {composer, beauty, ao, ssr, bloom, grade};
}
