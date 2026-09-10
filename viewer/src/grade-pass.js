// The last stage before the screen: exposure, grade, vignette, then the curve.
//
// The chain used to end at a bare output pass, which applies exposure and the
// curve and nothing else - so there was no point at which the image could be
// shaped, and no place to put one that would not be wrong. The reference is
// explicit about where this belongs: grade and vignette happen HERE, before the
// tone curve and still in linear. Its own earlier build ran them after the
// output pass, in screen space, and had to bolt a second soft shoulder on
// afterwards to stop the result clipping. Ahead of the curve none of that is
// needed - whatever these do to a value, the curve still has no top.
//
// The vignette only ever multiplies down, so it cannot brighten anything.
//
// ACES is the Stephen Hill fit, the same curve three's own ACESFilmicToneMapping
// runs and the same one the reference tone-maps with, written out because this
// shader is now the last thing between the scene and the screen. The renderer
// keeps its own ACES setting for the XR path, which bypasses this chain.
import {Vector3} from 'three';
import {referenceProfile} from './render-profile.js';

// Restrained, and inside the range the reference's own lighting rigs use
// (saturation 0.94-1.06, gain 0.90-1.05, lift up to 0.014): a little cool in
// the shadows where open sky fills them, a little warm in the highlights where
// the sun is, and enough saturation to stop the render reading as washed. This
// is the dial, not a law - it is one place, and every value here is separable.
export const GRADE = Object.freeze({
  lift: Object.freeze([0.004, 0.005, 0.007]),
  gain: Object.freeze([1.010, 1.000, 0.985]),
  saturation: 1.04,
  grain: 0,
  // inner radius, strength, vertical centre - the reference's own geometry.
  vignette: Object.freeze([0.55, 0.10, 0.46]),
});

export const GradeShader = {
  uniforms: {
    tDiffuse: {value: null},
    uExposure: {value: referenceProfile.exposure},
    uLift: {value: new Vector3(...GRADE.lift)},
    uGain: {value: new Vector3(...GRADE.gain)},
    uSat: {value: GRADE.saturation},
    uGrain: {value: GRADE.grain},
    uVig: {value: new Vector3(...GRADE.vignette)},
  },
  vertexShader: `varying vec2 vUv;
    void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uExposure,uSat,uGrain;
    uniform vec3 uLift,uGain,uVig;

    vec3 RRTAndODTFit(vec3 v){
      vec3 a=v*(v+0.0245786)-0.000090537;
      vec3 b=v*(0.983729*v+0.4329510)+0.238081;
      return a/b;
    }
    vec3 acesToneMap(vec3 color){
      const mat3 ACESInputMat=mat3(
        vec3(0.59719,0.07600,0.02840),
        vec3(0.35458,0.90834,0.13383),
        vec3(0.04823,0.01566,0.83777));
      const mat3 ACESOutputMat=mat3(
        vec3(1.60475,-0.10208,-0.00327),
        vec3(-0.53108,1.10813,-0.07276),
        vec3(-0.07367,-0.00605,1.07602));
      color*=1.0/0.6;
      color=ACESInputMat*color;
      color=RRTAndODTFit(color);
      color=ACESOutputMat*color;
      return clamp(color,0.0,1.0);
    }
    vec3 linearToSRGB(vec3 c){
      return mix(c*12.92,1.055*pow(max(c,vec3(0.0)),vec3(0.41666))-0.055,step(vec3(0.0031308),c));
    }

    void main(){
      vec3 c=texture2D(tDiffuse,vUv).rgb*uExposure;
      c=uLift+c*(uGain-uLift);
      float lum=dot(c,vec3(0.2126,0.7152,0.0722));
      c=mix(vec3(lum),c,uSat);
      float n=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(0.06711056,0.00583715))))-0.5;
      c+=n*uGrain;
      float dv=distance(vUv,vec2(0.5,uVig.z));
      c*=1.0-smoothstep(uVig.x,0.92,dv)*uVig.y;
      c=acesToneMap(max(c,vec3(0.0)));
      gl_FragColor=vec4(linearToSRGB(c),1.0);
    }`
};
