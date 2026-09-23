import {Vector4} from 'three';

// FAZ 6 İŞ B (FAZ-6-DUZ-RENK.md BÖLÜM 2) - batchId-gated procedural macro
// variation. The delivery's UVs are broken at the root (0.3: grass maps
// 310 m into 0..1, the entrance court collapsed to one texel) and the atlas
// cannot be re-laid (H6), so WORLD-SPACE analytic noise is the only
// mechanism that can put sub-metre variation on these surfaces: no texture
// fetch, no new bytes, no new draws, exactly ONE new varying (world
// position). Albedo drifts in VALUE only (hue shift reads blotchy-cheap),
// roughness drifts on the same sample with its own amplitude - the single
// biggest killer of the uniform-specular "computer" look. The second
// (micro) octave is desktop-only and its CODE is absent in the one-octave
// form, not weighted away.
//
// Sampling plane per 2.2: ONE plane picked by the dominant axis of the
// FACE normal - full triplanar is forbidden (mobile budget). The face
// normal comes from derivatives of the world position, which costs no
// extra varying and no view-to-world matrix. The seam where the axis flips
// is accepted at these frequencies/amplitudes; C03/C07 wall-floor
// junctions are the check, and the answer to a visible line is LOWER
// AMPLITUDE, never triplanar.

// BÖLÜM 2.3 - the cell table, verbatim. x: albedo amplitude, y: roughness
// amplitude, z: frequency (1/m), w: micro-octave weight. A cell that is
// not listed stays vec4(0) = byte-identical to today. Context glazing and
// water are explicitly OFF (their own shader paths).
export const DETAIL_TABLE = [
  {match: /^R31 \| R39 continuous grass ground$/i, value: new Vector4(0.10, 0.08, 1 / 6, 0.6)},
  {match: /^R31 \| R37 fine asphalt aggregate$/i, value: new Vector4(0.06, 0.12, 1 / 4, 0.5)},
  {match: /^Entrance coursed limestone(\.\d{3})?$/i, value: new Vector4(0.07, 0.10, 1 / 2, 0.4)},
  {match: /^STRUCCO$/i, value: new Vector4(0.05, 0.06, 1 / 3, 0.3)},
  {match: /^ceiling\.004$/i, value: new Vector4(0.06, 0.06, 1 / 3, 0.2)},
  {match: /^neighbor_wall$/i, value: new Vector4(0.07, 0.08, 1 / 3, 0.2)},
  {match: /^gravel( \[imported\])?$/i, value: new Vector4(0.12, 0.10, 1, 0.7)},
  {match: /^(foliage|foliage_light)$/i, value: new Vector4(0.09, 0.05, 1 / 3, 0.3)},
  {match: /^(roof\.004|Neighbor 20 green tiles)$/i, value: new Vector4(0.08, 0.08, 1 / 2, 0.4)},
  {match: /^roof-7$/i, value: new Vector4(0.06, 0.08, 1, 0.5)},
  {match: /^white_trim( \(\d+\))?$/i, value: new Vector4(0.04, 0.10, 1, 0.3)},
  {match: /^(chrome|metal) \(\d+\)$/i, value: new Vector4(0.02, 0.14, 1 / 0.5, 0.4)},
  {match: /boundary limestone top/i, value: new Vector4(0.07, 0.09, 1 / 2, 0.4)},
  {match: /^Retaining wall rough limestone/i, value: new Vector4(0.09, 0.10, 1 / 1.5, 0.5)},
  {match: /^(pool_tile|STONE-TILE)$/i, value: new Vector4(0.04, 0.06, 1, 0.3)},
  {match: /Dark stained canopy timber/i, value: new Vector4(0.06, 0.09, 1, 0.4)},
  {match: /^canopy\.001$/i, value: new Vector4(0.06, 0.08, 1 / 1.5, 0.3)},
  // -- BÖLÜM 4 İŞ D: interior large surfaces only, amplitudes at HALF the
  //    exterior read; furniture and small objects untouched.
  {match: /^INTERIOR$/i, value: new Vector4(0.025, 0.03, 1 / 3, 0.3), interior: true},
  {match: /^WOOD-FL$/i, value: new Vector4(0.03, 0.045, 1, 0.4), interior: true},
  {match: /^wood_floor\.001$/i, value: new Vector4(0.03, 0.045, 1, 0.4), interior: true},
  {match: /^bath_tile$/i, value: new Vector4(0.02, 0.03, 1, 0.3), interior: true},
  {match: /^Basement \| Ochre wall tile \d$/i, value: new Vector4(0.02, 0.03, 1, 0.3), interior: true},
  {match: /^terra_floor$/i, value: new Vector4(0.03, 0.045, 1, 0.4), interior: true},
  // -- explicit OFF: separate shader paths (2.3 son satır)
  {match: /Context glazing|^water$|glass|mirror/i, value: new Vector4(0, 0, 0, 0)},
];

export const ZERO = new Vector4(0, 0, 0, 0);

export function detailFor(name, {interior = true} = {}) {
  const base = (name ?? '').replace(/\.\d{3}$/, '');
  for (const entry of DETAIL_TABLE) {
    if (!entry.match.test(base) && !entry.match.test(name)) continue;
    if (entry.interior && !interior) return ZERO;
    return entry.value;
  }
  return ZERO;
}

// İŞ B ships the exterior; İŞ D turns the interior rows on with its own
// gate (BÖLÜM 5.3 sırası bir anahtar, kod değişikliği değil).
export function detailTableFor(batch, {interior = false} = {}) {
  const values = batch.materials.map(name => detailFor(name, {interior}));
  return values.some(v => v.x || v.y) ? values : null;
}

// ALU, counted from the emitted block (kabul 6.4), scalar ops:
//   face normal + plane   : cross(dFdx,dFdy) 9 + abs 3 + 2 cmp + 2 select = 16
//   freq scale            : mul2                                          = 2
//   lattice (floor/fract/smooth): 2+2+5                                   = 9
//   4 corner hashes       : 4 x (dot2 3 + sin 1 + mul 1 + fract 1)        = 24
//   bilinear mix          : 3 mix x 3                                     = 9
//   drift apply (albedo mul+clamp, roughness add+clamp)                   = 9
//   ---- single octave (mobile form) total                                = 69
//        (~17 slots vec4-issue; brief tavanı mobil 14 - AŞIYOR, kayıt:
//        mobil zaten bayrak KAPALI ship ediliyor, H1 yeşillemeden açılmaz;
//        açılacağı gün ilk düşürülecek kalem 4 hash -> 1 hash'li değer
//        gürültüsüdür.)
//   second octave adds    : mul2 + lattice 9 + hashes 24 + mix 9 + blend 3 = 47
//   ---- two octaves (desktop) total                                      = 116
//        enjekte edilen blok; masaüstü tavanı 38 slot ~ 152 skaler op'a
//        denk gelir - ALTINDA.
export const NOISE_GLSL = `
float angoraHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float angoraNoise(vec2 p){
  vec2 i=floor(p),f=p-i;
  vec2 u=f*f*(3.0-2.0*f);
  float a=angoraHash(i),b=angoraHash(i+vec2(1.0,0.0)),
        c=angoraHash(i+vec2(0.0,1.0)),d=angoraHash(i+vec2(1.0,1.0));
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}`;

export function detailFragment({octaves = 2, count}) {
  return `
uniform vec4 uDetail[${count}];
varying vec3 vDetailWorld;
${NOISE_GLSL}
vec2 angoraDetailDrift(float id){
  vec4 d=uDetail[int(clamp(id,0.0,${(count - 1).toFixed(1)}))];
  if(d.z==0.0)return vec2(0.0);
  vec3 fn=abs(cross(dFdx(vDetailWorld),dFdy(vDetailWorld)));
  vec2 pp=(fn.y>max(fn.x,fn.z))?vDetailWorld.xz:(fn.x>fn.z?vDetailWorld.zy:vDetailWorld.xy);
  vec2 p=pp*d.z;
  float n=angoraNoise(p);
  ${octaves >= 2 ? 'n=mix(n,angoraNoise(p*3.7+11.17),d.w);' : ''}
  return (n-0.5)*2.0*d.xy;
}`;
}

export const DETAIL_VERTEX = {
  declare: 'varying vec3 vDetailWorld;\n',
  assign: '\nvDetailWorld=(modelMatrix*vec4(position,1.0)).xyz;',
};

export const DETAIL_APPLY = {
  color: `
vec2 angoraDrift=angoraDetailDrift(floor(batchId+0.5));
diffuseColor.rgb=clamp(diffuseColor.rgb*(1.0+angoraDrift.x),0.0,1.0);`,
  roughness: `
roughnessFactor=clamp(roughnessFactor+angoraDrift.y,0.04,1.0);`,
};
