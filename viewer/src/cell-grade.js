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

// Every rule projects from WORLD SPACE, in metres. Authored UVs were tried
// for the roofs with the villa's own repeat and came out as giant blobby
// tiles: that repeat is calibrated to the villa mesh's UV density (1 unit =
// 1/0.64 m) and the neighbours' meshes are scaled differently, so the same
// number means a different tile size on every roof. World space is the only
// figure that reads the same everywhere - a 0.9 m course is 0.9 m on any
// mesh, whatever its UVs.
//
// `blend` mixes the sheet INTO the delivered colour rather than replacing
// it. At 1.0 the sheet wins outright, which is right for a roof; the ground
// keeps most of its own green and takes the sheet as texture, so it reads
// as grass rather than as a bitmap tiled across a field.
export const CELL_RULES = [
  {match: /^R31 \| R39 continuous grass ground$/i,
    upOnly: true, map: 'grassMap', normal: 'grassNormal', orm: 'grassOrm', world: 4.5, blend: 1, normalScale: 0.6},
  {match: /^R31 \| R37 fine asphalt aggregate$/i,
    upOnly: true, map: 'asphaltMap', normal: 'asphaltNormal', orm: 'asphaltOrm', world: 5, blend: 1, normalScale: 0.8},
  // Komşu çatıları + villanın ikinci çatısı. 0.9 m = bir kiremit sırası.
  {match: /^(roof\.004|Neighbor 20 green tiles|roof-7)$/i,
    map: 'clayTileMap', normal: 'clayTileNormal', orm: 'clayTileOrm',
    world: 2.4, normalScale: 1.0, blend: 0.9},
  {match: /^Entrance coursed limestone(\.\d{3})?$/i,
    upOnly: true, map: 'travertineMap', normal: 'travertineNormal', orm: 'travertineOrm', world: 2.0, blend: 1},
  // Bahçe ve çevrenin kesme taşı: istinat duvarları, sınır harpuştası.
  {match: /^(Retaining wall rough limestone \(1\)|R31 \| R39 surrounding retaining stone|R31 \| R39 boundary limestone top)$/i,
    map: 'limestoneMap', normal: 'limestoneNormal', orm: 'limestoneOrm',
    world: 2.5, normalScale: 0.9, blend: 0.85},
  // Sundurma kirişi ve komşu ahşabı.
  {match: /^(Garden \| Dark stained canopy timber|wood_dark \(3\)|wood_dark\.001)$/i,
    map: 'timberMap', normal: 'timberNormal', orm: 'timberOrm', world: 1.2, normalScale: 0.7, blend: 0.9},
  // Bahçe metali: renk teslimatın, kazandığı şey cevap. Albedo YOK.
  {match: /^(chrome|metal) \(\d+\)$/i,
    normal: 'metalNormal', orm: 'metalOrm', world: 0.6, normalScale: 0.5},
  // Beyaz denizlik: hücre range=0. Sıvanın yumuşak seti, rengi korunarak.
  {match: /^white_trim \(\d+\)$/i,
    map: 'stuccoMapSoft', normal: 'stuccoNormal', orm: 'stuccoOrm',
    world: 1.2, normalScale: 0.3, blend: 0.5},
  // Çakıl ve sundurma sacı.
  {match: /^gravel( \[imported\])?$/i,
    map: 'limestoneMap', normal: 'limestoneNormal', orm: 'limestoneOrm',
    world: 0.5, normalScale: 1.1, blend: 0.8},
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
  const normals = [];   // [normalSlot, normalScale, ormSlot, 0]         // per member: [normalSlot+1, normalScale]
  const slotFor = name => {
    if (!sets?.[name]) return 0;
    let at = slots.indexOf(name);
    if (at < 0) { slots.push(name); at = slots.length - 1; }
    return at + 1;
  };
  let active = 0;
  for (const name of members) {
    const rule = cellRuleFor(name);
    if (!rule) { params.push([0, 0, 1, 1]); normals.push([0, 1, 0, 0]); continue; }
    const map = slotFor(rule.map);
    const normal = rule.normal ? slotFor(rule.normal) : 0;
    const ormSlot = rule.orm ? slotFor(rule.orm) : 0;
    // p.zw carries the authored-UV repeat only when world is 0; for a
    // world-projected cell p.z is free, so the blend factor rides there.
    const world = rule.world ?? 0;
    params.push([map, world,
      world > 0 ? (rule.blend ?? 1) : (rule.repeat?.[0] ?? 1),
      world > 0 ? (rule.upOnly ? 1 : 0) : (rule.repeat?.[1] ?? 1)]);
    normals.push([normal, rule.normalScale ?? 1, ormSlot, 0]);
    if (map || ormSlot) active++;
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
    shader.uniforms.uCellN = {value: normals.map(v => new THREE.Vector4(...v))};
    for (const [i, texture] of textures.entries()) shader.uniforms['uCellTex' + i] = {value: texture};
    shader.vertexShader = 'varying vec3 vCellWorld;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvCellWorld=(modelMatrix*vec4(position,1.0)).xyz;');
    // Declarations go to the top; the HELPER cannot. vMapUv is declared by
    // three's own uv_pars_fragment further down the file, so a function
    // prepended above it referenced an identifier that did not exist yet -
    // USE_MAP is a preprocessor define and passes the #ifdef regardless,
    // which is why this failed at link time and not at parse time. The
    // helper is injected right after the varyings it reads.
    shader.fragmentShader = `varying vec3 vCellWorld;
uniform vec4 uCellP[${count}];
uniform vec4 uCellN[${count}];
${samplerDecl}
` + shader.fragmentShader;
    const helper = `
vec2 angoraCellUv(vec4 p){
  // Dünya-uzayı projeksiyonu, BASKIN EKSENE göre. Yalnız XZ kullanmak
  // istinat duvarı gibi dikey yüzeyleri dikey şeritlere çeviriyordu - ve
  // cgUp kapısı onları zaten tamamen atlıyordu, yani o duvarlar hiç doku
  // almıyordu. Tam triplanar üç örnek demek; tek düzlem yeter.
  if(p.y>0.0){
    vec3 an=abs(cross(dFdx(vCellWorld),dFdy(vCellWorld)));
    vec2 pp=(an.y>=max(an.x,an.z))?vCellWorld.xz
           :(an.x>an.z?vCellWorld.zy:vCellWorld.xy);
    return pp/p.y;
  }
#ifdef USE_MAP
  return vMapUv*p.zw;                        // authored UV, villa ölçeğiyle
#else
  return vCellWorld.xz*p.zw;
#endif
}
`;
    shader.fragmentShader = shader.fragmentShader.includes('#include <uv_pars_fragment>')
      ? shader.fragmentShader.replace('#include <uv_pars_fragment>', '#include <uv_pars_fragment>\n' + helper)
      : shader.fragmentShader.replace('void main() {', helper + '\nvoid main() {');
    // Albedo: the placeholder cell colour is REPLACED by the photo-hue
    // sheet. Ground cells only take it on up-facing pixels (the
    // horizontalShare rule, per pixel: no grass down a retaining wall).
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
{
  int cgSlot=int(uCellP[${cell}].x+0.5);
  if(cgSlot>0){
    vec4 cgP=uCellP[${cell}];
    // Yukarı-bakan kapısı YALNIZ zemin malzemeleri için: çimin istinat
    // duvarından aşağı akmasını engeller. Duvar ve çatı malzemeleri bu
    // kapıdan geçemezdi, o yüzden hiç görünmüyorlardı.
    bool cgUp=true;
    if(cgP.y>0.0&&cgP.w>0.5){vec3 cgFn=abs(cross(dFdx(vCellWorld),dFdy(vCellWorld)));cgUp=cgFn.y>=max(cgFn.x,cgFn.z);}
    if(cgUp){
      vec2 cgUv=angoraCellUv(cgP);
      vec3 cgSheet=(${pick('texture2D(%T%,cgUv)', 'vec4(1.0)')}).rgb;
      diffuseColor.rgb=mix(diffuseColor.rgb,cgSheet,cgP.y>0.0?clamp(cgP.z,0.0,1.0):1.0);
    }
  }
}
#include <color_fragment>`);
    // Normal: only where the batch material compiled a tangent-space
    // normal path (getTangentFrame lives behind USE_NORMALMAP); roofs get
    // the villa's clay relief, ground cells stay geometry-lit.
    // Roughness and metalness: glTF packs them in G and B. This is the flat
    // response fix - 164 of 177 source materials measured NO within-cell
    // roughness variation, and one uniform gloss over a whole facade is a
    // stronger "this is CG" signal than flat colour is. Injected at
    // emissivemap_fragment, which still precedes lights_physical_fragment,
    // so the factors are overridden before anything reads them.
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
{
  int cgSlot=int(uCellN[${cell}].z+0.5);
  if(cgSlot>0){
    vec4 cgP=uCellP[${cell}];
    vec2 cgUv=angoraCellUv(cgP);
    vec3 cgOrm=(${pick('texture2D(%T%,cgUv)', 'vec4(0.0,1.0,0.0,1.0)')}).rgb;
    roughnessFactor=clamp(cgOrm.g,0.04,1.0);
    metalnessFactor=cgOrm.b;
  }
}
#include <emissivemap_fragment>`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
// getTangentFrame is declared by normal_pars_fragment only for the
// TANGENTSPACE path and only when the geometry ships NO tangent attribute
// (with USE_TANGENT three uses vTangent/vBitangent instead and the helper
// does not exist). Guarding on USE_NORMALMAP alone asked for an identifier
// the program had not declared, and the whole material failed to compile.
#if defined( USE_NORMALMAP_TANGENTSPACE ) && !defined( USE_TANGENT )
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
