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

export function createIdleRefine({renderer, samples = 24}) {
  const accum = new THREE.WebGLRenderTarget(1, 1, {type: THREE.HalfFloatType, depthBuffer: false});
  const blend = new FullScreenQuad(new THREE.ShaderMaterial(BLEND));
  const show = new FullScreenQuad(new THREE.ShaderMaterial({...BLEND, transparent: false,
    fragmentShader: 'varying vec2 vUv;uniform sampler2D tDiffuse;void main(){gl_FragColor=texture2D(tDiffuse,vUv);}'}));
  let index = 0;
  return {
    samples,
    get index() {return index;},
    reset() {index = 0;},
    // sample: the composer has just rendered into `source` (renderToScreen
    // false). Blend it into the accumulation at 1/(n+1) and present.
    accumulate(source) {
      const {width, height} = renderer.getDrawingBufferSize(new THREE.Vector2());
      if (accum.width !== width || accum.height !== height) {accum.setSize(width, height); index = 0;}
      const previous = renderer.getRenderTarget();
      renderer.setRenderTarget(accum);
      if (index === 0) renderer.clear();
      blend.material.uniforms.tDiffuse.value = source.texture;
      blend.material.uniforms.weight.value = 1 / (index + 1);
      blend.render(renderer);
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
    dispose() {accum.dispose(); blend.dispose(); show.dispose();},
  };
}
