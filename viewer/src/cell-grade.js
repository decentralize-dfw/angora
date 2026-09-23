import * as THREE from 'three';

// MALZEME İŞ 2 (gradeAnyGridV1) - real detail maps for the cells the
// grid===1 rule could never reach. The owner's first complaint was this
// line made visible: the villa roof (its own batch) got real clay tile,
// the neighbours' roofs (grid=2, shared batch) got nothing.
//
// The two halves already existed apart: procedural-detail gates per cell
// on batchId, exterior-grade projects world-space UVs for the terrace.
// This joins them: per-cell samplers, gated by batchId, sampled with
// their OWN UVs (authored for the roofs, world-space for the ground
// where the authored UVs are 1.25 m/texel garbage) - full hardware mip
// chain and tier anisotropy, because these are plain repeat-wrapped
// textures, not atlas walks.
//
// Yol seçimi (PROGRESS'e de yazıldı): sampler-per-slot, doku dizisi
// DEĞİL - bir materyalde en çok 3 farklı detay dokusu var (çatı map+
// normal, ya da zemin map), 16'lık dizi kurmanın karmaşıklığı bedava
// mip/aniso kazancını riske ederdi.
//
// water (poolWaterV2) ve cam hücreleri (glassTiersV2) bu tabloya
// GİRMEZ - kurallar bölümünün açık şartı.

export const CELL_RULES = [
  {match: /^R31 \| R39 continuous grass ground$/i, map: 'grassMap', world: 2},
  {match: /^R31 \| R37 fine asphalt aggregate$/i, map: 'asphaltMap', world: 4},
  // Komşu çatıları + villanın ikinci çatısı: villa kiremidiyle AYNI doku,
  // AYNI ölçek (1/0.8, 1/1.0) - sahibinin ilk şikâyeti bu tutarsızlıktı.
  {match: /^(roof\.004|Neighbor 20 green tiles|roof-7)$/i,
    map: 'clayTileMap', normal: 'clayTileNormal', repeat: [1 / 0.8, 1 / 1.0], normalScale: 1.2},
  {match: /^Entrance coursed limestone(\.\d{3})?$/i,
    map: 'travertineMap', normal: 'travertineNormal', world: 0.8},
];

export function cellRuleFor(name) {
  return CELL_RULES.find(rule => rule.match.test(name)) ?? null;
}

// One material: build the per-cell slot table and inject the override.
// Anchors survive the batched-material chain on purpose: color_fragment
// and emissivemap_fragment are chunks nothing else in this pipeline
// expands, so the include markers are still present when this wrapper
// (appended AFTER prepareBatchedMaterial) runs.
export function applyCellGrade(material, sets, {anisotropy = 8} = {}) {
  const batch = material.userData.angoraBatch;
  if (!batch || material.userData.cellGrade) return 0;
  const members = batch.materials;
  const slots = [];           // unique texture bindings
  const params = [];          // per member: [slot+1, worldModule, repU, repV]
  const normals = [];         // per member: [normalSlot+1, normalScale]
  const slotFor = name => {
    if (!sets?.[name]) return 0;
    let at = slots.indexOf(name);
    if (at < 0) { slots.push(name); at = slots.length - 1; }
    return at + 1;
  };
  let active = 0;
  for (const name of members) {
    const rule = cellRuleFor(name);
    if (!rule) { params.push([0, 0, 1, 1]); normals.push([0, 1]); continue; }
    const map = slotFor(rule.map);
    const normal = rule.normal ? slotFor(rule.normal) : 0;
    params.push([map, rule.world ?? 0, rule.repeat?.[0] ?? 1, rule.repeat?.[1] ?? 1]);
    normals.push([normal, rule.normalScale ?? 1]);
    if (map) active++;
  }
  if (!active) return 0;
  material.userData.cellGrade = true;
  const textures = slots.map(name => {
    const texture = sets[name];
    texture.anisotropy = Math.max(texture.anisotropy ?? 1, anisotropy);
    return texture;
  });
  const count = members.length;
  const cell = `int(clamp(floor(batchId+0.5),0.0,${(count - 1).toFixed(1)}))`;
  const samplerDecl = slots.map((_, i) => `uniform sampler2D uCellTex${i};`).join('\n');
  const pick = (expr, fallback) => slots.map((_, i) =>
    `cgSlot==${i + 1}?${expr.replace('%T%', 'uCellTex' + i)}:`).join('') + fallback;
  const previous = material.onBeforeCompile, key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms.uCellP = {value: params.map(v => new THREE.Vector4(...v))};
    shader.uniforms.uCellN = {value: normals.map(v => new THREE.Vector2(...v))};
    for (const [i, texture] of textures.entries()) shader.uniforms['uCellTex' + i] = {value: texture};
    shader.vertexShader = 'varying vec3 vCellWorld;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvCellWorld=(modelMatrix*vec4(position,1.0)).xyz;');
    shader.fragmentShader = `varying vec3 vCellWorld;
uniform vec4 uCellP[${count}];
uniform vec2 uCellN[${count}];
${samplerDecl}
vec2 angoraCellUv(vec4 p){
  if(p.y>0.0)return vCellWorld.xz/p.y;      // dünya-uzayı: bozuk UV'yi tamamen atlar
#ifdef USE_MAP
  return vMapUv*p.zw;                        // authored UV, villa ölçeğiyle
#else
  return vCellWorld.xz*p.zw;
#endif
}
` + shader.fragmentShader;
    // Albedo: the placeholder cell colour is REPLACED by the photo-hue
    // sheet. Ground cells only take it on up-facing pixels (the
    // horizontalShare rule, per pixel: no grass down a retaining wall).
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
{
  int cgSlot=int(uCellP[${cell}].x+0.5);
  if(cgSlot>0){
    vec4 cgP=uCellP[${cell}];
    bool cgUp=true;
    if(cgP.y>0.0){vec3 cgFn=abs(cross(dFdx(vCellWorld),dFdy(vCellWorld)));cgUp=cgFn.y>=max(cgFn.x,cgFn.z);}
    if(cgUp){
      vec2 cgUv=angoraCellUv(cgP);
      diffuseColor.rgb=(${pick('texture2D(%T%,cgUv)', 'vec4(1.0)')}).rgb;
    }
  }
}
#include <color_fragment>`);
    // Normal: only where the batch material compiled a tangent-space
    // normal path (getTangentFrame lives behind USE_NORMALMAP); roofs get
    // the villa's clay relief, ground cells stay geometry-lit.
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
#ifdef USE_NORMALMAP
{
  int cgSlot=int(uCellN[${cell}].x+0.5);
  if(cgSlot>0){
    vec4 cgP=uCellP[${cell}];
    vec2 cgUv=angoraCellUv(cgP);
    vec3 cgMapN=(${pick('texture2D(%T%,cgUv)', 'vec4(0.5,0.5,1.0,1.0)')}).xyz*2.0-1.0;
    cgMapN.xy*=uCellN[${cell}].y;
    // slot pick yukarıdaki cgSlot ile - normal slotu da aynı listede
    normal=normalize(getTangentFrame(-vViewPosition,normal,cgUv)*cgMapN);
  }
}
#endif
#include <emissivemap_fragment>`);
  };
  material.customProgramCacheKey = () => key + '|cell-grade-v1:' +
    params.map(p => p[0]).join('') + ':' + normals.map(n => n[0]).join('');
  material.needsUpdate = true;
  return active;
}
