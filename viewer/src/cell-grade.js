import * as THREE from 'three';

// MALZEME İŞ 2 + KAPANIŞ İŞ 4 (gradeAnyGridV1) - real PBR sheets for the
// cells the grid===1 rule could never reach, SECOND attempt. The first
// bound colour+normal+ORM as per-cell sampler2Ds: context-ground-other-0
// carries four graded cells, and with the material's own atlas maps, the
// lightmap, AO and the environment the unit list ran past
// MAX_TEXTURE_IMAGE_UNITS(16) - the program never validated and the
// ground drew broken ("FRAGMENT shader texture image units count
// exceeds", the console said, and nobody looked).
//
// KAPANIS 4.1: the whole family set now rides THREE texture arrays -
// uCellColor / uCellNormal / uCellOrm, one unit each, indexed per cell by
// layer number (the same mechanism atlasArrayV2 uses). Whatever the batch
// carries, cell-grade costs exactly 3 units; atlas-array additionally
// SKIPS cellGrade materials so the two mechanisms never stack units.
//
// Layer order is fixed by CELL_RULES first-use; the cell -> layer map
// travels in uCellP/uCellN. Everything projects from WORLD SPACE in
// metres (dominant axis - walls stripe under a bare XZ), authored UVs
// only where a repeat is given. water (poolWaterV2) and glass cells
// (glassTiersV2) never match.

export const CELL_RULES = [
  {match: /^R31 \| R39 continuous grass ground$/i,
    upOnly: true, map: 'grassMap', normal: 'grassNormal', orm: 'grassOrm', world: 4.5, blend: 1, normalScale: 0.6},
  {match: /^R31 \| R37 fine asphalt aggregate$/i,
    upOnly: true, map: 'asphaltMap', normal: 'asphaltNormal', orm: 'asphaltOrm', world: 5, blend: 1, normalScale: 0.8},
  // Komşu çatıları + villanın ikinci çatısı. 2.4 m sayfada 0.9 m ≈ bir sıra.
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
  // Çakıl.
  {match: /^gravel( \[imported\])?$/i,
    map: 'limestoneMap', normal: 'limestoneNormal', orm: 'limestoneOrm',
    world: 0.5, normalScale: 1.1, blend: 0.8},
];

export function cellRuleFor(name) {
  return CELL_RULES.find(rule => rule.match.test(name)) ?? null;
}

// Fixed layer rosters per channel (first-use order over CELL_RULES) - the
// SAME JS table on every load, so layer indices are deterministic.
const roster = key => {
  const names = [];
  for (const rule of CELL_RULES) if (rule[key] && !names.includes(rule[key])) names.push(rule[key]);
  return names;
};
export const FAMILY_LAYERS = {
  color: roster('map'),     // 512 px, sRGB
  normal: roster('normal'), // 512 px, linear
  orm: roster('orm'),       // 256 px, linear (G roughness, B metalness)
};
const FAMILY_SIZE = {color: 512, normal: 512, orm: 256};

// Browser-side: pack the already-loaded sheet textures (loadGradeTextures'
// images) into the three arrays. A missing sheet leaves a neutral layer -
// one 404 cannot take the family down. Returns null where canvas is
// unavailable (node tests mock the families instead).
export function buildCellFamilies(sets, {anisotropy = 8} = {}) {
  if (typeof document === 'undefined' || !sets) return null;
  const families = {};
  for (const [channel, names] of Object.entries(FAMILY_LAYERS)) {
    const size = FAMILY_SIZE[channel];
    const data = new Uint8Array(size * size * 4 * names.length);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d', {willReadFrequently: true});
    const layers = new Map();
    names.forEach((name, layer) => {
      layers.set(name, layer);
      const image = sets[name]?.image;
      context.clearRect(0, 0, size, size);
      if (image) context.drawImage(image, 0, 0, size, size);
      else {                                   // neutral: grey / flat normal / rough 1
        context.fillStyle = channel === 'normal' ? 'rgb(128,128,255)'
          : channel === 'orm' ? 'rgb(0,255,0)' : 'rgb(128,128,128)';
        context.fillRect(0, 0, size, size);
      }
      data.set(context.getImageData(0, 0, size, size).data, size * size * 4 * layer);
    });
    const texture = new THREE.DataArrayTexture(data, size, size, names.length);
    texture.format = THREE.RGBAFormat;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = anisotropy;
    if (channel === 'color') texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    families[channel] = {texture, layers};
  }
  return families;
}

// One material: cell -> layer table + the injection. Anchors survive the
// batched-material chain on purpose: color_fragment and
// emissivemap_fragment are chunks nothing else in this pipeline expands.
export function applyCellGrade(material, families, {anisotropy = 8} = {}) {
  const batch = material.userData.angoraBatch;
  if (!batch || material.userData.cellGrade || !families) return 0;
  const members = batch.materials;
  const params = [];   // [colorLayer+1, worldModule, blend|repU, upOnly|repV]
  const normals = [];  // [normalLayer+1, normalScale, ormLayer+1, 0]
  const layer = (channel, name) => name && families[channel].layers.has(name)
    ? families[channel].layers.get(name) + 1 : 0;
  let active = 0;
  for (const name of members) {
    const rule = cellRuleFor(name);
    if (!rule) { params.push([0, 0, 1, 1]); normals.push([0, 1, 0, 0]); continue; }
    const color = layer('color', rule.map);
    const normal = layer('normal', rule.normal);
    const orm = layer('orm', rule.orm);
    const world = rule.world ?? 0;
    params.push([color, world,
      world > 0 ? (rule.blend ?? 1) : (rule.repeat?.[0] ?? 1),
      world > 0 ? (rule.upOnly ? 1 : 0) : (rule.repeat?.[1] ?? 1)]);
    normals.push([normal, rule.normalScale ?? 1, orm, 0]);
    if (color || orm) active++;
  }
  if (!active) return 0;
  material.userData.cellGrade = true;
  for (const family of Object.values(families)) {
    family.texture.anisotropy = Math.max(family.texture.anisotropy ?? 1, anisotropy);
  }
  const count = members.length;
  const cell = `int(clamp(floor(batchId+0.5),0.0,${(count - 1).toFixed(1)}))`;
  const previous = material.onBeforeCompile, key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms.uCellP = {value: params.map(v => new THREE.Vector4(...v))};
    shader.uniforms.uCellN = {value: normals.map(v => new THREE.Vector4(...v))};
    shader.uniforms.uCellColor = {value: families.color.texture};
    shader.uniforms.uCellNormal = {value: families.normal.texture};
    shader.uniforms.uCellOrm = {value: families.orm.texture};
    shader.vertexShader = 'varying vec3 vCellWorld;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvCellWorld=(modelMatrix*vec4(position,1.0)).xyz;');
    // Declarations to the top; the HELPER after three's own varyings
    // (vMapUv is declared by uv_pars_fragment - a helper prepended above
    // it failed at link time, USE_MAP passes the #ifdef regardless).
    shader.fragmentShader = `varying vec3 vCellWorld;
uniform vec4 uCellP[${count}];
uniform vec4 uCellN[${count}];
uniform highp sampler2DArray uCellColor;
uniform highp sampler2DArray uCellNormal;
uniform highp sampler2DArray uCellOrm;
` + shader.fragmentShader;
    const helper = `
vec2 angoraCellUv(vec4 p){
  // Dünya-uzayı projeksiyonu, BASKIN EKSENE göre. Yalnız XZ kullanmak
  // istinat duvarı gibi dikey yüzeyleri dikey şeritlere çeviriyordu.
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
    // Albedo: mix by rule.blend - a roof takes the sheet outright, the
    // ground keeps its own green under the texture. Up-facing gate ONLY
    // where the rule asks (ground) - walls and roofs pass freely.
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
{
  int cgL=int(uCellP[${cell}].x+0.5);
  if(cgL>0){
    vec4 cgP=uCellP[${cell}];
    bool cgUp=true;
    if(cgP.y>0.0&&cgP.w>0.5){vec3 cgFn=abs(cross(dFdx(vCellWorld),dFdy(vCellWorld)));cgUp=cgFn.y>=max(cgFn.x,cgFn.z);}
    if(cgUp){
      vec3 cgSheet=texture(uCellColor,vec3(angoraCellUv(cgP),float(cgL-1))).rgb;
      diffuseColor.rgb=mix(diffuseColor.rgb,cgSheet,cgP.y>0.0?clamp(cgP.z,0.0,1.0):1.0);
    }
  }
}
#include <color_fragment>`);
    // ORM: G roughness, B metalness - the flat-response fix (164/177
    // cells measured NO within-cell roughness variation). Overrides the
    // factors before lights_physical_fragment reads them.
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
{
  int cgL=int(uCellN[${cell}].z+0.5);
  if(cgL>0){
    vec3 cgOrm=texture(uCellOrm,vec3(angoraCellUv(uCellP[${cell}]),float(cgL-1))).rgb;
    roughnessFactor=clamp(cgOrm.g,0.04,1.0);
    metalnessFactor=cgOrm.b;
  }
}
#include <emissivemap_fragment>`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
// getTangentFrame exists only on the TANGENTSPACE path WITHOUT a tangent
// attribute (with USE_TANGENT three uses vTangent instead).
#if defined( USE_NORMALMAP_TANGENTSPACE ) && !defined( USE_TANGENT )
{
  int cgL=int(uCellN[${cell}].x+0.5);
  if(cgL>0){
    vec2 cgUv=angoraCellUv(uCellP[${cell}]);
    vec3 cgMapN=texture(uCellNormal,vec3(cgUv,float(cgL-1))).xyz*2.0-1.0;
    cgMapN.xy*=uCellN[${cell}].y;
    normal=normalize(getTangentFrame(-vViewPosition,normal,cgUv)*cgMapN);
  }
}
#endif
#include <emissivemap_fragment>`);
  };
  material.customProgramCacheKey = () => key + '|cell-grade-v2:' +
    params.map(p => p[0]).join('') + ':' + normals.map(n => n[0] + '' + n[2]).join('');
  material.needsUpdate = true;
  return active;
}
