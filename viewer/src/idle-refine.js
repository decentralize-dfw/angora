import * as THREE from 'three';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';

// FAZ 5 - the cinema still. render-profile's pathTracing/refinement fields
// were always just profile fields; the real implementation is this: once
// the camera has been still for 400 ms on desktop-high, up to 24 extra
// frames accumulate with a sub-pixel projection jitter and a slightly
// different sun angle per sample. The average is what a renderer with soft
// shadows and clean AO would have drawn: soft shadow edges, settled
// occlusion, no speckle. Any input cancels instantly and the raster frame
// is back. Never on a phone, never in the walk - the caller gates that.

const BLEND = {
  uniforms: {tDiffuse: {value: null}, weight: {value: 1}},
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader: `varying vec2 vUv;uniform sampler2D tDiffuse;uniform float weight;
    void main(){gl_FragColor=vec4(texture2D(tDiffuse,vUv).rgb,weight);}`,
  transparent: true, depthTest: false, depthWrite: false,
  blending: THREE.NormalBlending,
};

// Halton pairs: a low-discrepancy walk over the pixel.
const halton = (index, base) => {
  let f = 1, r = 0, i = index;
  while (i > 0) {f /= base; r += f * (i % base); i = Math.floor(i / base);}
  return r;
};

// V-RAY C1 (04.10): siyah ekranın en olası kaynağı yarım-float hedefe
// KARIŞTIRMA (blending) idi - bazı GPU/sürücüler (EXT_float_blend yok,
// ANGLE/Metal) bunu sessizce siyah yazar; yazılım rasterizer'da hata
// çıkmaması da bundandı. Artık karıştırma yok: iki hedef arasında
// "ping-pong", ortalama shader'da alınır; kaynakta NaN/Inf olan piksel bir
// önceki ortalamayı korur. Üstüne bir öz-denetim: birikim, normal karenin
// yanında küçük bir ölçümle karşılaştırılır; kararıyorsa özellik bu oturumda
// kendini kapatır ve normal kare geri gelir.
const ACCUM = {
  uniforms: {tPrev: {value: null}, tSrc: {value: null}, weight: {value: 1}},
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader: `varying vec2 vUv;uniform sampler2D tPrev,tSrc;uniform float weight;
    void main(){
      vec4 src=texture2D(tSrc,vUv);
      bool bad=any(isnan(src.rgb))||any(isinf(src.rgb));
      if(weight>=0.999){gl_FragColor=vec4(bad?vec3(0.0):src.rgb,1.0);return;}
      vec3 prev=texture2D(tPrev,vUv).rgb;
      gl_FragColor=vec4(bad?prev:mix(prev,src.rgb,weight),1.0);
    }`,
  depthTest: false, depthWrite: false,
};
// 8x1 ölçüm: sol dört piksel birikimin, sağ dört kaynağın ortalama parlaklığı.
const PROBE = {
  uniforms: {tA: {value: null}, tB: {value: null}},
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader: `varying vec2 vUv;uniform sampler2D tA,tB;
    void main(){
      bool left=vUv.x<0.5; float s=0.0; bool bad=false;
      for(int y=0;y<6;y++)for(int x=0;x<6;x++){
        vec2 uv=vec2((float(x)+.5)/6.,(float(y)+.5)/6.);
        vec3 c=left?texture2D(tA,uv).rgb:texture2D(tB,uv).rgb;
        if(any(isnan(c)))bad=true;
        s+=dot(clamp(c,0.,1.),vec3(.2126,.7152,.0722));
      }
      gl_FragColor=vec4(s/36.0,bad?1.0:0.0,0.0,1.0);
    }`,
  depthTest: false, depthWrite: false,
};

export function createIdleRefine({renderer, samples = 24}) {
  const targets = [0, 1].map(() => new THREE.WebGLRenderTarget(1, 1, {type: THREE.HalfFloatType, depthBuffer: false}));
  let accum = targets[0];
  const blend = new FullScreenQuad(new THREE.ShaderMaterial(ACCUM));
  const probeTarget = new THREE.WebGLRenderTarget(8, 1, {depthBuffer: false});
  const probe = new FullScreenQuad(new THREE.ShaderMaterial(PROBE));
  const probePixels = new Uint8Array(8 * 4);
  let broken = false, probing = false;
  const show = new FullScreenQuad(new THREE.ShaderMaterial({...BLEND, transparent: false,
    fragmentShader: 'varying vec2 vUv;uniform sampler2D tDiffuse;void main(){gl_FragColor=texture2D(tDiffuse,vUv);}'}));
  let index = 0;
  // FAZ 7 İŞ 7: thin-lens DOF for free - each accumulation sample shifts
  // the camera across the aperture disc and shears the projection so the
  // FOCUS plane stays pixel-fixed; everything off-plane walks a disc whose
  // radius grows with |1/z - 1/focus|. The average of 24 such frames IS
  // depth of field - no extra pass, no depth-blur artifacts.
  let dof = null;
  return {
    samples,
    get broken() {return broken;},
    get index() {return index;},
    reset() {index = 0;},
    setDof(next) {dof = next && next.aperture > 0 && next.focus > 0 ? next : null;},
    dofShift(camera) {
      if (!dof) return null;
      const radius = Math.sqrt(halton(index + 1, 11)) * dof.aperture;
      const theta = halton(index + 1, 13) * 2 * Math.PI;
      const dx = Math.cos(theta) * radius, dy = Math.sin(theta) * radius;
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      camera.position.addScaledVector(right, dx).addScaledVector(up, dy);
      camera.updateMatrixWorld();
      const proj = camera.projectionMatrix.elements;
      // m00/m11 already hold 1/tan (with aspect); the constant NDC shear
      // that re-pins the focus plane is shift * m/focus on the z column.
      const cx = -dx * proj[0] / dof.focus, cy = -dy * proj[5] / dof.focus;
      proj[8] += cx; proj[9] += cy;
      return {right, up, dx, dy, cx, cy};
    },
    undoDofShift(camera, shift) {
      if (!shift) return;
      camera.position.addScaledVector(shift.right, -shift.dx).addScaledVector(shift.up, -shift.dy);
      camera.updateMatrixWorld();
      camera.projectionMatrix.elements[8] -= shift.cx;
      camera.projectionMatrix.elements[9] -= shift.cy;
    },
    // sample: the composer has just rendered into `source` (renderToScreen
    // false). Blend it into the accumulation at 1/(n+1) and present.
    accumulate(source) {
      if (broken) return false;
      const {width, height} = renderer.getDrawingBufferSize(new THREE.Vector2());
      for (const t of targets) if (t.width !== width || t.height !== height) {t.setSize(width, height); index = 0;}
      const previous = renderer.getRenderTarget();
      const prev = accum, next = targets[(targets.indexOf(accum) + 1) % 2];
      blend.material.uniforms.tPrev.value = prev.texture;
      blend.material.uniforms.tSrc.value = source.texture;
      blend.material.uniforms.weight.value = 1 / (index + 1);
      renderer.setRenderTarget(next);
      blend.render(renderer);
      accum = next;
      // öz-denetim: 2. örnekte birikim ile kaynağı karşılaştır (asenkron okuma)
      if (index === 2 && !probing && renderer.readRenderTargetPixelsAsync) {
        probing = true;
        probe.material.uniforms.tA.value = accum.texture; probe.material.uniforms.tB.value = source.texture;
        renderer.setRenderTarget(probeTarget); probe.render(renderer);
        renderer.readRenderTargetPixelsAsync(probeTarget, 0, 0, 8, 1, probePixels).then(() => {
          probing = false;
          const a = probePixels[0] / 255, b = probePixels[16] / 255, nan = probePixels[1] > 128;
          if (nan || (b > .03 && a < b * .45)) {broken = true; this.onBroken?.({accum: a, source: b, nan});}
        }, () => {probing = false;});
      }
      renderer.setRenderTarget(null);
      show.material.uniforms.tDiffuse.value = accum.texture;
      show.render(renderer);
      renderer.setRenderTarget(previous);
      index++;
      return index < samples;
    },
    // Sub-pixel projection offset for this sample; caller applies to the
    // projection matrix and restores it after the render.
    jitter(camera) {
      const {width, height} = renderer.getDrawingBufferSize(new THREE.Vector2());
      const jx = (halton(index + 1, 2) - .5) * 2 / width;
      const jy = (halton(index + 1, 3) - .5) * 2 / height;
      camera.projectionMatrix.elements[8] += jx;
      camera.projectionMatrix.elements[9] += jy;
      return [jx, jy];
    },
    unjitter(camera, [jx, jy]) {
      camera.projectionMatrix.elements[8] -= jx;
      camera.projectionMatrix.elements[9] -= jy;
    },
    // Deterministic sun sway per sample: ±0.2° around the target keeps the
    // penumbra believable without moving the light's story.
    sunSway() {
      const a = (halton(index + 1, 5) - .5) * (Math.PI / 900);
      const b = (halton(index + 1, 7) - .5) * (Math.PI / 900);
      return [a, b];
    },
    dispose() {for (const t of targets) t.dispose(); probeTarget.dispose(); blend.dispose(); probe.dispose(); show.dispose();},
  };
}
