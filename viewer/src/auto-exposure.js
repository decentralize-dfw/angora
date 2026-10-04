import * as THREE from 'three';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';

// V-RAY C3: eye adaptation. Step inside and the frame went murky; look out
// of a window and it burst. A camera (and an eye) meters the scene and
// opens or stops down - this does the same, inside narrow limits so it never
// "pumps" like a game effect.
//
// Cost: every few frames the HDR frame (the grade pass's input) is reduced
// to a 32x18 grid of log-luminance (16 taps a cell, 8-bit encoded), and the
// grid is read back with an async read (fence + PBO): the frame never waits
// for the GPU. Nothing runs when the camera is still and adapted.
const W = 32, H = 18, MIN_EV = -10, MAX_EV = 6;

// Scene log2-luminance (centre weighted) that maps to "no correction".
// Measured 03.10 at 13:00 on the walk frames the owner already approved:
// baked rooms (salon -2.74, kitchen -2.60, master bedroom -2.37), the sunny
// garden (-1.99) and the garden seen from the basement door (-1.97). The
// reference sits among them, so those stay within a fraction of a stop and
// only the outliers - a shaded facade (-3.9), a window wall - are pulled in.
export const REFERENCE_EV = -2.3;
// Cells this far above the reference are sun/sky. When they fill part of
// the frame (standing under the eaves looking out), lifting the dark part
// would burn them out - the measured case went +0.9 EV and washed the
// garden white - so their share cancels the lift.
const BRIGHT_EV = 1.0;

const meterShader = {
  uniforms: {tSrc: {value: null}},
  vertexShader: `varying vec2 vUv;
    void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tSrc;
    void main(){
      vec2 cell=vec2(${(1 / W).toFixed(8)},${(1 / H).toFixed(8)});
      vec2 base=vUv-cell*0.5;
      float s=0.0;
      for(int y=0;y<4;y++)for(int x=0;x<4;x++){
        vec3 c=texture2D(tSrc,base+cell*(vec2(float(x),float(y))+0.5)*0.25).rgb;
        float l=dot(c,vec3(0.2126,0.7152,0.0722));
        if(!(l>=0.0)||l>65000.0)l=0.0; // NaN/Inf guard: one bad pixel must not blind the meter
        s+=log2(max(l,1e-3));
      }
      gl_FragColor=vec4(clamp((s/16.0-(${MIN_EV.toFixed(1)}))/${(MAX_EV - MIN_EV).toFixed(1)},0.0,1.0),0.0,0.0,1.0);
    }`,
};

// Centre-weighted: the middle of the frame is what the viewer looks at.
const WEIGHTS = (() => {
  const w = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = (x + .5) / W - .5, v = (y + .5) / H - .5;
    w[y * W + x] = 1 - .65 * Math.min(1, Math.hypot(u * 1.6, v * 2) / .9);
  }
  return w;
})();

export function meterStats(pixels, reference = REFERENCE_EV) {
  let sum = 0, weight = 0, bright = 0;
  for (let i = 0; i < W * H; i++) {
    const ev = MIN_EV + pixels[i * 4] / 255 * (MAX_EV - MIN_EV);
    sum += ev * WEIGHTS[i]; weight += WEIGHTS[i];
    if (ev > reference + BRIGHT_EV) bright += WEIGHTS[i];
  }
  return {ev: sum / weight, bright: bright / weight};
}
export const meteredEv = pixels => meterStats(pixels).ev;

// Correction in EV for a metered scene: partial (strength) so a dark room
// still reads darker than the garden. Stopping down reaches -1 EV (a glare
// wall); opening up stops at +0.5 EV, shrinks with the frame's sunlit share,
// and with daylight, so night stays night.
export function correctionEv(ev, {reference = REFERENCE_EV, strength = .5, down = 1, up = .5, bright = 0, daylight = 1} = {}) {
  const raw = (reference - ev) * strength;
  const lift = up * Math.min(1, Math.max(0, (daylight - .15) / .6)) * Math.max(0, 1 - bright * 4);
  return Math.max(-down, Math.min(lift, raw));
}

export function createAutoExposure(renderer, {tau = .6, every = 4, daylight = () => 1} = {}) {
  const target = new THREE.WebGLRenderTarget(W, H, {depthBuffer: false, generateMipmaps: false});
  const quad = new FullScreenQuad(new THREE.ShaderMaterial(meterShader));
  const pixels = new Uint8Array(W * H * 4);
  let frame = 0, pending = false, targetEv = 0, currentEv = 0, last = 0, failed = false;
  const state = {
    value: 1,
    adapting: false,
    // Only the first-person walk adapts. Orbit, plan and neighbourhood frames
    // are composed pictures the owner approved as they are; a white plan
    // metered "too bright" would turn grey. Off = ease back to 1.
    active: false,
    // yürüme: yarım düzeltme, en çok +0,5 EV. Oda kameraları (main.js interiorExposure) fotoğrafçı gibi daha çok açar.
    up: .5, strength: .5,
    onChange: null,
    reset() {targetEv = currentEv = 0; state.value = 1; state.adapting = false;},
    // Called by the grade pass with its HDR input, once per composed frame.
    update(texture) {
      const now = performance.now(), dt = last ? Math.min(.1, (now - last) / 1000) : 0;
      last = now;
      if (!state.active) targetEv = 0;
      else if (!failed && !pending && frame++ % every === 0 && renderer.readRenderTargetPixelsAsync) {
        const previous = renderer.getRenderTarget();
        quad.material.uniforms.tSrc.value = texture;
        renderer.setRenderTarget(target);
        quad.render(renderer);
        renderer.setRenderTarget(previous);
        pending = true;
        renderer.readRenderTargetPixelsAsync(target, 0, 0, W, H, pixels).then(() => {
          pending = false;
          if (!state.active) return;
          const {ev, bright} = meterStats(pixels);
          const next = correctionEv(ev, {bright, daylight: daylight(), up: state.up, strength: state.strength});
          if (Math.abs(next - targetEv) > .02) {targetEv = next; if (Math.abs(targetEv - currentEv) > .02) state.onChange?.();}
        }, () => {pending = false; failed = true; state.reset();});
      }
      currentEv += (targetEv - currentEv) * (1 - Math.exp(-dt / tau));
      state.adapting = Math.abs(targetEv - currentEv) > .02;
      if (!state.adapting) currentEv = targetEv;
      state.value = 2 ** currentEv;
      return state.value;
    },
    debug() {return {targetEv, currentEv, value: state.value, ...meterStats(pixels)};},
    dispose() {target.dispose(); quad.dispose(); quad.material.dispose();},
  };
  return state;
}
