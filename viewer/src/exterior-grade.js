import * as THREE from 'three';

// The optimised delivery arrived with its hero exterior surfaces stripped to
// 4x4 placeholder textures (roof clay tile, facade metal, pool, grass,
// asphalt), broken KHR_texture_transforms (stucco baseColor at one repeat per
// 10 m) and degenerate UVs (the whole 310 m terrain mapped 0..1, the entrance
// court collapsed to a single texel) - the Rhino->Blender->optimiser chain's
// cost, measured surface by surface in the R48 audit. The delivery itself is
// the owner's and is not edited; this module restores the LOOK at load time,
// against the listing photographs: per-name colour/roughness grades, seamless
// project-authored detail maps, and fresh ground UVs projected from world
// space where the authored ones are unusable.
//
// It only runs for manifest assets flagged `exterior_grade` - the classic
// delivery keeps its authored materials untouched.

// Matching mirrors materialFamily: the numbered-copy tail never matters.
const baseName = (name = '') => name.replace(/\.\d{3}$/, '');

// One entry per exterior family that needs help. `assets` gates application
// (Stage A) so a same-named material in another delivery part is never hit;
// gradeKey() itself stays asset-free because it also serves as a merge
// discriminator inside one file.
const TABLE = [
  // "her bir kiremit modelli zaten": the roof's tiles are individual solids,
  // so a painted tile sheet fights the geometry ("hatch'i çok kötü olmuş").
  // Each modelled tile instead draws its OWN colour from the photo lottery,
  // assigned per connected component at load - texture-free and exactly
  // aligned with the clay underfoot.
  {key: 'clay-tile', match: /^clay tile/i, assets: ['building'], lottery: true},
  // roof-7 is the covering UNDER the tiles, not the tiles: 695 triangles in 26
  // connected components against Clay tile's 2 855. Running a per-component
  // lottery over it gave whole roof planes one random tone each, which is half
  // of why the new roof read as blocks. It gets a single weathered tone.
  {key: 'villa-roof', match: /^roof(-\d+)?$/i, assets: ['building'],
   color: '#8E5A40', roughness: 0.88},
  // bldg-3 spells it STRUCCO and ships no facade normal at all; the authored
  // colour already sits on the photo hue, so it keeps the base (keepTint) and
  // gains sand-float relief plus a breathing near-white mottle.
  {key: 'stucco', match: /^st?rucco( \[imported\])?$/i, assets: ['building'],
   set: {map: 'stuccoMottle', normalMap: 'stuccoNormal'}, keepTint: true,
   repeat: [1, 1], normalScale: 0.7},
  // "tavan, zemin... hiçbir dokusu yok, çok dijital": the white finishes get
  // the same quiet plaster grain, at a scale the eye reads as trowel work.
  {key: 'plaster-grain', match: /^interior$/i, assets: ['building', 'interior'],
   set: {normalMap: 'stuccoNormal'}, keepTint: true, repeat: [2, 2], normalScale: 0.35},
  {key: 'soffit-grain', match: /^ceiling$/i, assets: ['building', 'interior'],
   set: {normalMap: 'stuccoNormal'}, keepTint: true, repeat: [2, 2], normalScale: 0.3},
  {key: 'iron', match: /^metal( \(\d+\))?$/i, assets: ['building', 'garden'],
   color: '#212326', roughness: 0.58, metalness: 0.22},
  {key: 'gravel', match: /^gravel( \[imported\])?$/i, assets: ['building'],
   color: '#B49E87', roughness: 0.95, normalScale: 1},
  {key: 'canopy', match: /^canopy$/i, assets: ['building'], color: '#728279', roughness: 0.6},
  {key: 'grass', match: /^grass( \(\d+\))?$/i, assets: ['context-ground'],
   set: {map: 'grassMap'}, groundUV: {module: 3}, antiTile: true},
  {key: 'asphalt', match: /^asphalt$/i, assets: ['context-ground'],
   set: {map: 'asphaltMap'}, groundUV: {module: 3}, antiTile: true},
  // No colour on map-bound stone: the sheet carries the photo hue and the
  // base colour would tint it a second time.
  {key: 'terrace', match: /^stone_tile \(\d+\)$/i, assets: ['garden'],
   set: {map: 'travertineMap', normalMap: 'travertineNormal'},
   // the pool terrace is laid on the diagonal in the photographs
   groundUV: {module: 0.8, diagonal: true}},
  {key: 'entrance-court', match: /^Entrance coursed limestone$/i, assets: ['garden'],
   set: {map: 'travertineMap', normalMap: 'travertineNormal'},
   groundUV: {module: 0.8}},
];

export function gradeKey(name) {
  const base = baseName(name);
  for (const entry of TABLE) if (entry.match.test(base)) return entry.key;
  return '';
}

const entryFor = (name, asset) => {
  const base = baseName(name);
  return TABLE.find(e => e.match.test(base) && e.assets.includes(asset)) ?? null;
};

// STAGE A - scalar grades, per file, BEFORE mergeEqualMaterials so numbered
// copies still collapse and the signature sees graded values. Stamps
// userData.exteriorGrade for Stage B; never touches other userData markers.
export function applyGradeValues(root, asset) {
  let graded = 0;
  root.traverse(object => {
    if (!object.isMesh) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material || material.userData.exteriorGrade !== undefined) continue;
      const entry = entryFor(material.name, asset);
      material.userData.exteriorGrade = entry ? entry.key : '';
      if (!entry) continue;
      if (entry.color) {
        material.color?.set(entry.color);
        // A colour grade must actually show: a leftover 4x4 placeholder
        // baseColor would multiply its own stub pixels into it.
        if (material.map && (material.map.image?.width ?? 0) <= 8) material.map = null;
      }
      if (entry.roughness !== undefined) material.roughness = entry.roughness;
      if (entry.metalness !== undefined) material.metalness = entry.metalness;
      // prepareMaterialResponse snapshots normalScale before the family
      // multipliers, so a grade set here becomes the base every per-view
      // rescale works from.
      if (entry.normalScale !== undefined) material.normalScale?.setScalar(entry.normalScale);
      material.needsUpdate = true;
      graded++;
    }
  });
  return graded;
}

// The photo-spec detail maps. glTF samples with flipY=false; these images are
// authored for that orientation. Anisotropy is set later by prepareMesh, and
// baseColor is the only sRGB slot.
export function loadGradeTextures(rootURL) {
  const loader = new THREE.TextureLoader();
  const one = (file, srgb) => loader.loadAsync(new URL(file, rootURL).href).then(texture => {
    texture.flipY = false;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  });
  return Promise.all([
    one('grass-basecolor.png', true), one('asphalt-basecolor.png', true),
    one('travertine-basecolor.png', true), one('travertine-normal.png', false),
    one('stucco-normal.png', false), one('stucco-mottle.png', true),
  ]).then(([grassMap, asphaltMap, travertineMap, travertineNormal, stuccoNormal, stuccoMottle]) =>
    ({grassMap, asphaltMap, travertineMap, travertineNormal, stuccoNormal, stuccoMottle}));
}

// Area-weighted share of up-facing surface, in world space: the planar ground
// projection must never stretch down a wall.
function horizontalShare(geometry, matrixWorld) {
  const position = geometry.attributes.position, index = geometry.index;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  const count = index ? index.count : position.count;
  let up = 0, total = 0;
  for (let i = 0; i < count; i += 3) {
    const read = (v, j) => v.fromBufferAttribute(position, index ? index.getX(i + j) : i + j).applyMatrix4(matrixWorld);
    read(a, 0); read(b, 1); read(c, 2);
    n.copy(b).sub(a).cross(c.sub(a));
    const area = n.length();
    total += area;
    if (area > 0 && Math.abs(n.y / area) > 0.7) up += area;
  }
  return total ? up / total : 0;
}

// The listing roof's per-tile firing lottery. Measured: `Clay tile` resolves to
// 2 855 components at a median 18 vertices - one modelled tile each - so the
// blockiness photographed at ?view=f3 was never the components, it was the
// spread. The first palette ran from #D08A55 to #5E3F2C: a 3.4:1 luminance
// range with ±14% on top, which on individual tiles reads as scattered dark
// blotches rather than a fired roof. A real clay field varies in hue much more
// than in value, so the range is now 1.5:1, the darkest tone is a weathered
// minority, and the jitter is a third of what it was.
const TILE_PALETTE = ['#C5825A', '#BE7851', '#B66E4A', '#AE6644', '#A55F40', '#98573C']
  .map(c => new THREE.Color(c).convertSRGBToLinear());
const TILE_WEIGHTS = [.22, .26, .22, .15, .10, .05];
const TILE_JITTER = .05;

// Union-find over welded vertices: every modelled tile is one connected
// component, and gets one colour of the lottery via vertex colours.
export function applyTileLottery(mesh) {
  const geometry = mesh.geometry, position = geometry.attributes.position, index = geometry.index;
  const weld = new Map(), vertexIsland = new Int32Array(position.count);
  for (let i = 0; i < position.count; i++) {
    const key = `${Math.round(position.getX(i) * 5000)},${Math.round(position.getY(i) * 5000)},${Math.round(position.getZ(i) * 5000)}`;
    const seen = weld.get(key);
    if (seen === undefined) {weld.set(key, i); vertexIsland[i] = i;}
    else vertexIsland[i] = seen;
  }
  const parent = new Int32Array(position.count);
  for (let i = 0; i < position.count; i++) parent[i] = vertexIsland[i];
  const find = i => {let r = i; while (parent[r] !== r) r = parent[r]; while (parent[i] !== r) {const next = parent[i]; parent[i] = r; i = next;} return r;};
  const union = (a, b) => {const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb;};
  const count = index ? index.count : position.count;
  for (let i = 0; i < count; i += 3) {
    const a = index ? index.getX(i) : i, b = index ? index.getX(i + 1) : i + 1, c = index ? index.getX(i + 2) : i + 2;
    union(a, b); union(b, c);
  }
  const colours = new Float32Array(position.count * 3);
  const rootColour = new Map();
  for (let i = 0; i < position.count; i++) {
    const root = find(i);
    let colour = rootColour.get(root);
    if (!colour) {
      // deterministic per component so reloads look identical
      let r = ((root * 2654435761) >>> 0) / 4294967296, pick = 0;
      while (pick < TILE_WEIGHTS.length - 1 && r > TILE_WEIGHTS[pick]) r -= TILE_WEIGHTS[pick++];
      const jitter = 1 + ((((root * 40503) >>> 0) % 1000) / 1000 - .5) * TILE_JITTER;
      colour = TILE_PALETTE[pick].clone().multiplyScalar(jitter);
      rootColour.set(root, colour);
    }
    colours[i * 3] = colour.r; colours[i * 3 + 1] = colour.g; colours[i * 3 + 2] = colour.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  return rootColour.size;
}

// Fresh UVs from world XZ so one repeat spans `module` metres. Optionally
// rotated 45 degrees for pavers laid on the diagonal.
function projectGroundUV(mesh, {module, diagonal}) {
  const geometry = mesh.geometry, position = geometry.attributes.position;
  const uv = new Float32Array(position.count * 2);
  const p = new THREE.Vector3();
  const s = Math.SQRT1_2;
  for (let i = 0; i < position.count; i++) {
    p.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
    let u = p.x / module, v = p.z / module;
    if (diagonal) {const r = (u - v) * s; v = (u + v) * s; u = r;}
    uv[i * 2] = u; uv[i * 2 + 1] = v;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

// STAGE B - after every part is decoded and merged, before staging/compile:
// bind the detail maps onto the canonical materials and rebuild ground UVs.
// `sets` may be null (texture fetch failed) - the scalar grades stand alone.
export function bindGradeTextures(parts, sets) {
  const clones = new Map();
  const textureFor = (name, repeat) => {
    const key = name + '|' + (repeat ? repeat.join(',') : '1');
    if (!clones.has(key)) {
      const texture = repeat ? sets[name].clone() : sets[name];
      if (repeat) texture.repeat.set(repeat[0], repeat[1]);
      clones.set(key, texture);
    }
    return clones.get(key);
  };
  for (const {scene} of parts) {
    scene.updateMatrixWorld(true);
    scene.traverse(object => {
      if (!object.isMesh) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        const entry = TABLE.find(e => e.key === material?.userData.exteriorGrade);
        if (!entry) continue;
        if (entry.lottery && !object.userData.exteriorGradeLottery) {
          object.userData.exteriorGradeLottery = true;
          applyTileLottery(object);
          material.vertexColors = true;
          material.map = null;
          material.color?.setRGB(1, 1, 1);
          material.needsUpdate = true;
        }
        if (entry.groundUV && !object.userData.exteriorGradeUV) {
          object.userData.exteriorGradeUV = true;
          if (horizontalShare(object.geometry, object.matrixWorld) > 0.5) projectGroundUV(object, entry.groundUV);
        }
        if (!sets || !entry.set || material.userData.exteriorGradeBound) continue;
        material.userData.exteriorGradeBound = true;
        if (entry.set.map) {
          material.map = textureFor(entry.set.map, entry.repeat);
          // A colour-carrying sheet must not be restained by an authored tint
          // (bldg-3 ships 'Clay tile' as bare dark rust); a keepTint entry's
          // sheet is a near-white multiplier and the tint IS the material.
          if (!entry.keepTint) material.color?.setRGB(1, 1, 1);
        }
        if (entry.set.normalMap) {
          material.normalMap = textureFor(entry.set.normalMap, entry.repeat);
          material.normalScale ??= new THREE.Vector2(1, 1);
        }
        // A single repeated sheet over 300 m of ground reads as wallpaper
        // ("çok tekrar ediyor"): blending the same sheet with itself at an
        // uncorrelated second scale erases the period without a second file.
        if (entry.antiTile && !material.userData.exteriorGradeAnti) {
          material.userData.exteriorGradeAnti = true;
          const previous = material.onBeforeCompile, previousKey = material.customProgramCacheKey();
          material.onBeforeCompile = (shader, renderer) => {
            previous.call(material, shader, renderer);
            shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>',
              `#ifdef USE_MAP
                vec4 tileA = texture2D( map, vMapUv );
                vec4 tileB = texture2D( map, vMapUv * -0.531 + vec2(0.172, 0.683) );
                diffuseColor *= mix( tileA, tileB, 0.5 );
              #endif`);
          };
          material.customProgramCacheKey = () => previousKey + '|anti-tile-r49';
        }
        material.needsUpdate = true;
      }
    });
  }
}
