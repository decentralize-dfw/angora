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
// The curve is AgX - the same transform three's own AgXToneMapping runs,
// written out because this shader is now the last thing between the scene and
// the screen. It replaced the Stephen Hill ACES fit: ACES pushed saturated
// hues around (sky toward cyan, low sun toward orange-red) and clipped bright
// render-white walls to a hard shoulder, where AgX rolls off without the hue
// skew. The renderer keeps its own matching AgX setting for the phone and XR
// paths, which bypass this chain.
import {Vector3} from 'three';
import {FINITE_RGB} from './linear-bloom.js';
import {baseExposure,curveId} from './render-profile.js';

// Restrained, and inside the range the reference's own lighting rigs use
// (saturation 0.94-1.06, gain 0.90-1.05, lift up to 0.014), except saturation,
// which sits a step higher because AgX itself desaturates toward the ends of
// its range where ACES oversaturated: a little cool in the shadows where open
// sky fills them, a little warm in the highlights where the sun is. This is
// the dial, not a law - it is one place, and every value here is separable.
export const GRADE = Object.freeze({
  lift: Object.freeze([0.004, 0.005, 0.007]),
  gain: Object.freeze([1.010, 1.000, 0.985]),
  saturation: 1.08,
  grain: 0,
  // inner radius, strength, vertical centre - the reference's own geometry.
  vignette: Object.freeze([0.55, 0.10, 0.46]),
});

export const GradeShader = {
  uniforms: {
    tDiffuse: {value: null},
    uExposure: {value: baseExposure()},
    // ADIM 2: 1 = ACES (daylightV2), 0 = AgX, 2 = PBR Neutral (V-RAY C2).
    // A uniform, not a define, so one program serves all and a flag flip
    // never recompiles.
    uCurve: {value: curveId()},
    // V-RAY C3: eye adaptation multiplier (auto-exposure.js). 1 = off.
    uAuto: {value: 1},
    uLift: {value: new Vector3(...GRADE.lift)},
    uGain: {value: new Vector3(...GRADE.gain)},
    uSat: {value: GRADE.saturation},
    uGrain: {value: GRADE.grain},
    uVig: {value: new Vector3(...GRADE.vignette)},
    // AYDINLIK İŞ 4 (warmGradeV1 chain'de ayarlar; varsayılanlar no-op):
    // uWarm orta tonlara amber (gölgelere değil), uContrast 1'in altında
    // davetkar - orta gri (0.18) pivotlu.
    uWarm: {value: new Vector3(1, 1, 1)},
    uContrast: {value: 1},
    // 04.10 iç mekân beyaz dengesi (lighting.js interiorGrade): 1 = dokunulmaz
    uWB: {value: new Vector3(1, 1, 1)},
    // MALZEME İŞ 3.4: parlama (bloom piramidinin çeyrek hedefi) ve dither
    // artık burada toplanır - bloom.combine + dither geçişleri kalktı.
    uGlare: {value: null},
    uBloomStrength: {value: 0},
    uBloomClamp: {value: 8},
  },
  vertexShader: `varying vec2 vUv;
    void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uExposure,uSat,uGrain,uContrast,uBloomStrength,uBloomClamp,uCurve,uAuto;
    uniform vec3 uLift,uGain,uVig,uWarm,uWB;
    uniform sampler2D uGlare;
    ${FINITE_RGB}

    // three r180's AgX: rec709 -> rec2020, Filament inset, log2 encode over
    // [-12.474, 4.026] EV, 6th-order sigmoid, outset, back to linear rec709.
    // Exposure is NOT applied here - it already happened at the top of main().
    vec3 angoraAgxContrast(vec3 x){
      vec3 x2=x*x;
      vec3 x4=x2*x2;
      return +15.5*x4*x2
        -40.14*x4*x
        +31.96*x4
        -6.868*x2*x
        +0.4298*x2
        +0.1191*x
        -0.00232;
    }
    vec3 agxToneMap(vec3 color){
      const mat3 AgXInsetMatrix=mat3(
        vec3(0.856627153315983,0.137318972929847,0.11189821299995),
        vec3(0.0951212405381588,0.761241990602591,0.0767994186031903),
        vec3(0.0482516061458583,0.101439036467562,0.811302368396859));
      const mat3 AgXOutsetMatrix=mat3(
        vec3(1.1271005818144368,-0.1413297634984383,-0.14132976349843826),
        vec3(-0.11060664309660323,1.157823702216272,-0.11060664309660294),
        vec3(-0.016493938717834573,-0.016493938717834257,1.2519364065950405));
      const mat3 LINEAR_SRGB_TO_LINEAR_REC2020=mat3(
        vec3(0.6274,0.0691,0.0164),
        vec3(0.3293,0.9195,0.0880),
        vec3(0.0433,0.0113,0.8956));
      const mat3 LINEAR_REC2020_TO_LINEAR_SRGB=mat3(
        vec3(1.6605,-0.1246,-0.0182),
        vec3(-0.5876,1.1329,-0.1006),
        vec3(-0.0728,-0.0083,1.1187));
      const float AgxMinEv=-12.47393;
      const float AgxMaxEv=4.026069;
      color=LINEAR_SRGB_TO_LINEAR_REC2020*color;
      color=AgXInsetMatrix*color;
      color=max(color,vec3(1e-10));
      color=log2(color);
      color=(color-AgxMinEv)/(AgxMaxEv-AgxMinEv);
      color=clamp(color,0.0,1.0);
      color=angoraAgxContrast(color);
      color=AgXOutsetMatrix*color;
      color=pow(max(vec3(0.0),color),vec3(2.2));
      color=LINEAR_REC2020_TO_LINEAR_SRGB*color;
      return clamp(color,0.0,1.0);
    }
    // three's ACESFilmic (Hill fit, RRT+ODT), exposure already applied above;
    // the /0.6 is three's own pre-scale. Named apart from three's chunk, which
    // the ShaderMaterial prefix may also carry.
    vec3 gradeAcesFit(vec3 v){
      vec3 a=v*(v+0.0245786)-0.000090537;
      vec3 b=v*(0.983729*v+0.4329510)+0.238081;
      return a/b;
    }
    vec3 gradeAces(vec3 color){
      const mat3 inM=mat3(vec3(0.59719,0.07600,0.02840),vec3(0.35458,0.90834,0.13383),vec3(0.04823,0.01566,0.83777));
      const mat3 outM=mat3(vec3(1.60475,-0.10208,-0.00327),vec3(-0.53108,1.10813,-0.07276),vec3(-0.07367,-0.00605,1.07602));
      color/=0.6;
      color=outM*gradeAcesFit(inM*color);
      return clamp(color,0.0,1.0);
    }
    // Khronos PBR Neutral (three r180's NeutralToneMapping), exposure applied above.
    vec3 gradeNeutral(vec3 color){
      const float StartCompression=0.8-0.04;
      const float Desaturation=0.15;
      float x=min(color.r,min(color.g,color.b));
      float offset=x<0.08?x-6.25*x*x:0.04;
      color-=offset;
      float peak=max(color.r,max(color.g,color.b));
      if(peak<StartCompression)return color;
      float d=1.0-StartCompression;
      float newPeak=1.0-d*d/(peak+d-StartCompression);
      color*=newPeak/peak;
      float g=1.0-1.0/(Desaturation*(peak-newPeak)+1.0);
      return mix(color,vec3(newPeak),g);
    }
    vec3 linearToSRGB(vec3 c){
      return mix(c*12.92,1.055*pow(max(c,vec3(0.0)),vec3(0.41666))-0.055,step(vec3(0.0031308),c));
    }

    void main(){
      vec3 c=texture2D(tDiffuse,vUv).rgb;
      if(uBloomStrength>0.0)c=finiteRgb(c,uBloomClamp)+finiteRgb(texture2D(uGlare,vUv).rgb,uBloomClamp)*uBloomStrength;
      c*=uExposure*uAuto*uWB;
      c=uLift+c*(uGain-uLift);
      float lum=dot(c,vec3(0.2126,0.7152,0.0722));
      c=mix(vec3(lum),c,uSat);
      // İŞ 4: amber yalnız orta bantta (gölge ve parlak uçlar maskeli),
      // kontrast orta-gri pivotla iner - dramatik değil davetkar.
      float midBand=smoothstep(0.03,0.25,lum)*(1.0-smoothstep(0.65,0.95,lum));
      c*=mix(vec3(1.0),uWarm,midBand);
      c=(c-0.18)*uContrast+0.18;
      float n=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(0.06711056,0.00583715))))-0.5;
      c+=n*uGrain;
      float dv=distance(vUv,vec2(0.5,uVig.z));
      c*=1.0-smoothstep(uVig.x,0.92,dv)*uVig.y;
      c=uCurve>1.5?clamp(gradeNeutral(max(c,vec3(0.0))),0.0,1.0):uCurve>0.5?gradeAces(max(c,vec3(0.0))):agxToneMap(max(c,vec3(0.0)));
      vec3 srgb=linearToSRGB(c);
      // display-dither buraya katlandı: yalnız ÇIKARIR, eğrinin üst sınırı
      // dokunulmaz (display-dither.js'in ölçülmüş gerekçesi aynen).
      float dd=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
      gl_FragColor=vec4(srgb-dd/255.0,1.0);
    }`
};
