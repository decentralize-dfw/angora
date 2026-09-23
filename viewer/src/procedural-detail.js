import {Vector4} from 'three';

// FAZ 6 İŞ B - procedural micro-variation on the batched surfaces. The
// atlas cells are 248px of mostly flat colour; up close every material
// reads as painted cardboard. This injects an ANALYTIC hash noise - no
// texture fetch, no new bytes, no new draws, exactly one new varying (the
// world position) - that drifts albedo value and roughness per CELL, with
// per-material amplitudes authored in the table below. Glazing and water
// stay at vec4(0): they live in their own shader paths.
//
// The sampling plane is two fixed oblique axes of the world position, so
// the pattern never aligns with the architecture's own axes; scale is in
// 1/metres. Desktop runs two octaves; the second octave's CODE is compiled
// out (not just weighted to zero) wherever the caller asks for one octave,
// which is what a phone will get if H1 ever lets the flag on there.
//
// Missing-source note (dürüstlük): the FAZ 6 brief arrived with BÖLÜM 2's
// head truncated; rows below the cut are verbatim, rows above it are
// authored to the same scheme and marked (*). Amplitudes are value-drift /
// roughness-drift / lattice scale (1/m) / second-octave weight.

export const DETAIL_TABLE = [
  // -- verbatim rows from the brief ------------------------------------
  {match: /^(foliage|foliage_light)$/i, value: new Vector4(0.09, 0.05, 1 / 3, 0.3)},
  {match: /^(roof\.004|Neighbor 20 green tiles)$/i, value: new Vector4(0.08, 0.08, 1 / 2, 0.4)},
  {match: /^roof-7$/i, value: new Vector4(0.06, 0.08, 1, 0.5)},
  {match: /^white_trim( \(\d+\))?$/i, value: new Vector4(0.04, 0.10, 1, 0.3)},
  {match: /^(chrome|metal)( \(\d+\))?$/i, value: new Vector4(0.02, 0.14, 1 / 0.5, 0.4)},
  {match: /boundary limestone top/i, value: new Vector4(0.07, 0.09, 1 / 2, 0.4)},
  {match: /^Retaining wall rough limestone/i, value: new Vector4(0.09, 0.10, 1 / 1.5, 0.5)},
  {match: /^(pool_tile|STONE-TILE)$/i, value: new Vector4(0.04, 0.06, 1, 0.3)},
  {match: /Dark stained canopy timber/i, value: new Vector4(0.06, 0.09, 1, 0.4)},
  {match: /^canopy\.001$/i, value: new Vector4(0.06, 0.08, 1 / 1.5, 0.3)},
  // -- rows above the truncation, authored to the same scheme (*) ------
  {match: /^Clay tile$/i, value: new Vector4(0.05, 0.06, 1, 0.4)},
  {match: /^STRUCCO$/i, value: new Vector4(0.05, 0.08, 1, 0.4)},
  {match: /^neighbor_wall$/i, value: new Vector4(0.05, 0.08, 1 / 2, 0.4)},
  {match: /^ceiling\.004$/i, value: new Vector4(0.04, 0.07, 1 / 2, 0.3)},
  {match: /grass ground/i, value: new Vector4(0.10, 0.06, 1 / 2.5, 0.4)},
  {match: /fine asphalt/i, value: new Vector4(0.05, 0.08, 1 / 4, 0.3)},
  {match: /^gravel( \[imported\])?$/i, value: new Vector4(0.08, 0.10, 1, 0.4)},
  {match: /^Entrance coursed limestone/i, value: new Vector4(0.06, 0.08, 1 / 2, 0.4)},
  {match: /surrounding retaining stone/i, value: new Vector4(0.08, 0.10, 1 / 1.5, 0.5)},
  {match: /^stone_tile( \(\d+\))?$/i, value: new Vector4(0.04, 0.06, 1, 0.3)},
  {match: /^(wood_dark(\.\d{3})? \(?\d*\)?|wood_dark(\.\d{3})?)$/i, value: new Vector4(0.06, 0.09, 1, 0.4)},
  {match: /^terrain|soil/i, value: new Vector4(0.08, 0.07, 1 / 3, 0.4)},
  // -- İŞ D: interior, amplitudes at HALF the exterior read ------------
  {match: /^INTERIOR$/i, value: new Vector4(0.025, 0.04, 1, 0.4), interior: true},
  {match: /^WOOD-FL$/i, value: new Vector4(0.03, 0.045, 1, 0.4), interior: true},
  {match: /^wood_floor\.001$/i, value: new Vector4(0.03, 0.045, 1, 0.4), interior: true},
  {match: /^bath_tile$/i, value: new Vector4(0.02, 0.03, 1, 0.3), interior: true},
  {match: /^Basement \| Ochre wall tile \d$/i, value: new Vector4(0.02, 0.03, 1, 0.3), interior: true},
  {match: /^terra_floor$/i, value: new Vector4(0.03, 0.045, 1, 0.4), interior: true},
  // -- explicit zeroes: separate shader paths --------------------------
  {match: /Context glazing|^water$|glass|mirror/i, value: new Vector4(0, 0, 0, 0)},
];

export const ZERO = new Vector4(0, 0, 0, 0);

export function detailFor(name) {
  const base = (name ?? '').replace(/\.\d{3}$/, '');
  for (const entry of DETAIL_TABLE) if (entry.match.test(base) || entry.match.test(name)) return entry.value;
  return ZERO;
}

// İŞ B ships the exterior; İŞ D turns the interior rows on with their own
// gate. The filter lives here so the sequencing (BÖLÜM 5.3) is a switch,
// not a code rewrite.
export function detailTableFor(batch, {interior = false} = {}) {
  const values = batch.materials.map(name => {
    const base = (name ?? '').replace(/\.\d{3}$/, '');
    const entry = DETAIL_TABLE.find(e => e.match.test(base) || e.match.test(name));
    if (!entry || (entry.interior && !interior)) return ZERO;
    return entry.value;
  });
  return values.some(v => v.x || v.y) ? values : null;
}

// The noise core. Counted, not estimated (kabul 6.4) - scalar ops per
// fragment, mobile single-octave form first:
//   plane projection  : 2x dot3 -> 2*(3 mul + 2 add)      = 10
//   lattice           : floor2 + sub2 + smooth (f*f*(3-2f)): 2+2+ (2mul+1sub+2mul)=5 -> 9
//   4 corner hashes   : 4x (dot2 3 + sin 1 + mul 1 + fract 1) = 24
//   bilinear mix      : 3 mix -> 3*(1 sub? counted as 3)   = 9
//   apply (albedo+rough): 2*(2 mul + 2 add) + clamp        = 9
//   single octave total                                     = 61 scalar ops
//   (~15-16 vec4-issue slots on a 4-wide ALU; the brief's mobile ceiling
//   of 14 slots is missed by ~1.5 - recorded, and mobile ships with the
//   flag OFF until H1 regardless.)
//   second octave adds: re-project mul2 + lattice 9 + hashes 24 + mix 9
//   + weight-blend 3                                        = +47 (~12 slots)
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
  vec2 p=vec2(dot(vDetailWorld,vec3(0.7547,0.0,0.6560)),dot(vDetailWorld,vec3(-0.2909,0.8944,0.3392)))*d.z;
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
