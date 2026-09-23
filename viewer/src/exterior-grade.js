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

// İŞ E.3 (FAZ-6-DUZ-RENK.md 0.1): BU TABLO ÜRETİMDE ÇALIŞMAZ. The TABLE
// path below runs only for manifest entries flagged `exterior_grade`, and
// the production batched manifest carries `parts` with no such flag - so
// none of these ten grades has ever reached the shipped viewer. It stays
// because the CLASSIC delivery (viewer/public/models, dev server and
// ?model= previews) still walks it. Production repair lives in
// BATCHED_TABLE / reviveBatchedGrade further down. Do not base coverage
// claims on this table.
//
// One entry per exterior family that needs help. `assets` gates application
// (Stage A) so a same-named material in another delivery part is never hit;
// gradeKey() itself stays asset-free because it also serves as a merge
// discriminator inside one file.
const TABLE = [
  {key: 'clay-tile', match: /^clay tile/i, assets: ['building'],
   set: {map: 'clayTileMap', normalMap: 'clayTileNormal'},
   // audited UV density: 1 uv unit = 1/0.64 m; the tile sheet spans 0.8x1.0 m
   repeat: [1.5625 / 0.8, 1.5625 / 1.0], normalScale: 1.2},
  {key: 'villa-roof', match: /^roof(-\d+)?$/i, assets: ['building'],
   set: {map: 'clayTileMap', normalMap: 'clayTileNormal'},
   repeat: [1 / 0.8, 1 / 1.0], normalScale: 1.2},
  // bldg-3 spells it STRUCCO and ships no facade normal at all; the authored
  // colour already sits on the photo hue, so it keeps the base and gains the
  // sand-float relief.
  {key: 'stucco', match: /^st?rucco( \[imported\])?$/i, assets: ['building'],
   set: {normalMap: 'stuccoNormal'}, repeat: [1, 1], normalScale: 0.55},
  {key: 'iron', match: /^metal( \(\d+\))?$/i, assets: ['building', 'garden'],
   color: '#212326', roughness: 0.58, metalness: 0.22},
  {key: 'gravel', match: /^gravel( \[imported\])?$/i, assets: ['building'],
   color: '#B49E87', roughness: 0.95, normalScale: 1},
  {key: 'canopy', match: /^canopy$/i, assets: ['building'], color: '#728279', roughness: 0.6},
  {key: 'grass', match: /^grass( \(\d+\))?$/i, assets: ['context-ground'],
   set: {map: 'grassMap'}, groundUV: {module: 2}},
  {key: 'asphalt', match: /^asphalt$/i, assets: ['context-ground'],
   set: {map: 'asphaltMap'}, groundUV: {module: 3}},
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
    one('clay-tile-basecolor.png', true), one('clay-tile-normal.png', false),
    one('grass-basecolor.png', true), one('asphalt-basecolor.png', true),
    one('travertine-basecolor.png', true), one('travertine-normal.png', false),
    one('stucco-normal.png', false),
  ]).then(([clayTileMap, clayTileNormal, grassMap, asphaltMap, travertineMap, travertineNormal, stuccoNormal]) =>
    ({clayTileMap, clayTileNormal, grassMap, asphaltMap, travertineMap, travertineNormal, stuccoNormal}));
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

// Task 1.3 - the same revival for the BATCHED delivery, where materials are
// consolidated and the source names live in userData.angoraBatch.materials.
// Only grid=1 batches (one source material, the whole atlas its cell) can
// take a tileable detail map directly: their UVs are the authored UVs, and
// batched-material.js skips its atlasSample injection per bound slot so the
// hardware mip chain and anisotropy come back for exactly these textures.
// Everything here is measured against the R48 audit: the doc's grid=1 hero
// list, with the repeats the legacy TABLE already carries.
const BATCHED_TABLE = [
  {name: 'Clay tile', set: {map: 'clayTileMap', normalMap: 'clayTileNormal'},
   repeat: [1.5625 / 0.8, 1.5625 / 1.0], normalScale: 1.2},
  {name: 'STRUCCO', set: {normalMap: 'stuccoNormal'}, repeat: [1, 1], normalScale: 0.55},
  {name: 'stone_tile', set: {map: 'travertineMap', normalMap: 'travertineNormal'},
   groundUV: {module: 0.8, diagonal: true}},
  // The neighbours' plaster: same sand-float relief as the villa's stucco,
  // fainter - context is setting, not subject.
  {name: 'ceiling.004', set: {normalMap: 'stuccoNormal'}, repeat: [1, 1], normalScale: 0.3},
  // FAZ 6 İŞ A (FAZ-6-DUZ-RENK.md BÖLÜM 1) - the five idle grid=1
  // surfaces, from the SAME shipped texture set. No new bytes, no new
  // mechanism; water is poolWaterV2's and stays untouched; STRUCCO /
  // ceiling.004 keep normal-only (İŞ B's macro variation owns their
  // albedo - two mechanisms stacked would blotch).
  {name: 'neighbor_wall', set: {normalMap: 'stuccoNormal'}, repeat: [1, 1], normalScale: 0.35},
  {name: 'Retaining wall rough limestone.001', set: {normalMap: 'travertineNormal'},
   repeat: [1 / 1.5, 1 / 1.5], normalScale: 0.8},
  // The villa ironwork: cell range=0, dead flat. The dead TABLE's iron
  // grade moves here as scalars; the 4x4 placeholder map is NULLED or it
  // multiplies its own stub pixel into the colour.
  {name: 'metal', color: '#212326', roughness: 0.58, metalness: 0.22, dropMap: true},
  // Neighbour timber: not a texture problem, a sheen problem.
  {name: 'wood_dark.002', roughness: 0.82},
];

export function reviveBatchedGrade(models, sets, {anisotropy = 8} = {}) {
  if (!sets) return 0;
  const clones = new Map();
  const textureFor = (name, repeat) => {
    const key = name + '|' + (repeat ? repeat.join(',') : '1');
    if (!clones.has(key)) {
      const texture = repeat ? sets[name].clone() : sets[name];
      if (repeat) texture.repeat.set(repeat[0], repeat[1]);
      texture.anisotropy = anisotropy;
      clones.set(key, texture);
    }
    return clones.get(key);
  };
  let applied = 0;
  for (const model of models.values()) {
    model.updateMatrixWorld(true);
    model.traverse(object => {
      if (!object.isMesh) return;
      const material = Array.isArray(object.material) ? null : object.material;
      if (!material) return;
      const batch = material.userData.angoraBatch;
      if (!batch || batch.grid !== 1 || batch.materials.length !== 1) return;
      const entry = BATCHED_TABLE.find(e => e.name === batch.materials[0]);
      if (!entry) return;
      if (entry.groundUV && !object.userData.exteriorGradeUV) {
        object.userData.exteriorGradeUV = true;
        if (horizontalShare(object.geometry, object.matrixWorld) > 0.5) projectGroundUV(object, entry.groundUV);
      }
      if (material.userData.exteriorGradeDetail) return;   // one binding per material
      // İŞ A: scalar-only rows (no texture) grade in place and still count -
      // the iron railings go from placeholder grey to the audited iron.
      if (!entry.set) {
        if (material.userData.exteriorGradeScalar) return;
        material.userData.exteriorGradeScalar = true;
        if (entry.color) material.color?.set(entry.color);
        if (entry.roughness !== undefined) material.roughness = entry.roughness;
        if (entry.metalness !== undefined) material.metalness = entry.metalness;
        if (entry.dropMap && material.map) {material.map.dispose(); material.map = null;}
        material.needsUpdate = true;
        applied++;
        return;
      }
      const slots = [];
      if (entry.set.map) {
        material.map = textureFor(entry.set.map, entry.groundUV ? null : entry.repeat);
        material.color?.setRGB(1, 1, 1);   // the sheet carries the photo hue
        slots.push('map');
      }
      if (entry.set.normalMap) {
        material.normalMap = textureFor(entry.set.normalMap, entry.groundUV ? null : entry.repeat);
        material.normalScale?.setScalar(entry.normalScale ?? 1);
        slots.push('normalMap');
      }
      material.userData.exteriorGradeDetail = slots;
      material.needsUpdate = true;
      applied++;
    });
  }
  return applied;
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
        if (entry.groundUV && !object.userData.exteriorGradeUV) {
          object.userData.exteriorGradeUV = true;
          if (horizontalShare(object.geometry, object.matrixWorld) > 0.5) projectGroundUV(object, entry.groundUV);
        }
        if (!sets || !entry.set || material.userData.exteriorGradeBound) continue;
        material.userData.exteriorGradeBound = true;
        if (entry.set.map) {
          material.map = textureFor(entry.set.map, entry.repeat);
          // The sheet carries the photo hue; an authored tint factor (bldg-3
          // ships 'Clay tile' as a bare dark-rust colour) must not restain it.
          material.color?.setRGB(1, 1, 1);
        }
        if (entry.set.normalMap) {
          material.normalMap = textureFor(entry.set.normalMap, entry.repeat);
          material.normalScale ??= new THREE.Vector2(1, 1);
        }
        material.needsUpdate = true;
      }
    });
  }
}
