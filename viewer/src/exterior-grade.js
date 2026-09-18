import * as THREE from 'three';

const baseName = (name = '') => name.replace(/\.\d{3}$/, '');

const TABLE = [
  {key: 'clay-tile', match: /^clay tile/i, assets: ['building'], lottery: true},
  {key: 'villa-roof', match: /^roof(-\d+)?$/i, assets: ['building'],
   color: '#8E5A40', roughness: 0.88},
  {key: 'stucco', match: /^st?rucco( \[imported\])?$/i, assets: ['building'],
   set: {map: 'stuccoMottle', normalMap: 'stuccoNormal'}, keepTint: true,
   repeat: [1, 1], normalScale: 0.7},
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
  {key: 'terrace', match: /^stone_tile \(\d+\)$/i, assets: ['garden'],
   set: {map: 'travertineMap', normalMap: 'travertineNormal'},
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
        if (material.map && (material.map.image?.width ?? 0) <= 8) material.map = null;
      }
      if (entry.roughness !== undefined) material.roughness = entry.roughness;
      if (entry.metalness !== undefined) material.metalness = entry.metalness;
      if (entry.normalScale !== undefined) material.normalScale?.setScalar(entry.normalScale);
      material.needsUpdate = true;
      graded++;
    }
  });
  return graded;
}

export function loadGradeTextures(rootURL) {
  const loader = new THREE.TextureLoader();
  const one = (file, srgb) => loader.loadAsync(new URL(file, rootURL).href).then(texture => {
    texture.flipY = false;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  });
  const keys = ['grassMap', 'asphaltMap', 'travertineMap', 'travertineNormal', 'stuccoNormal', 'stuccoMottle'];
  const files = [['grass-basecolor.png', true], ['asphalt-basecolor.png', true],
    ['travertine-basecolor.png', true], ['travertine-normal.png', false],
    ['stucco-normal.png', false], ['stucco-mottle.png', true]];
  return Promise.allSettled(files.map(([file, srgb]) => one(file, srgb))).then(results => {
    const sets = {};
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') sets[keys[i]] = result.value;
      else console.warn('Exterior detail map missing: ' + files[i][0], result.reason);
    });
    return sets;
  });
}

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

const TILE_PALETTE = ['#C5825A', '#BE7851', '#B66E4A', '#AE6644', '#A55F40', '#98573C']
  .map(c => new THREE.Color(c).convertSRGBToLinear());
const TILE_WEIGHTS = [.22, .26, .22, .15, .10, .05];
const TILE_JITTER = .05;

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
        if (entry.set.map && sets[entry.set.map]) {
          material.map = textureFor(entry.set.map, entry.repeat);
          if (!entry.keepTint) material.color?.setRGB(1, 1, 1);
        }
        if (entry.set.normalMap && sets[entry.set.normalMap]) {
          material.normalMap = textureFor(entry.set.normalMap, entry.repeat);
          material.normalScale ??= new THREE.Vector2(1, 1);
        }
        if (entry.antiTile && !material.userData.exteriorGradeAnti) {
          material.userData.exteriorGradeAnti = true;
          const previous = material.onBeforeCompile, previousKey = material.customProgramCacheKey();
          material.onBeforeCompile = (shader, renderer) => {
            previous.call(material, shader, renderer);
            shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>',
              `#include <map_fragment>
              #ifdef USE_MAP
                vec4 tileB = texture2D( map, vMapUv * -0.531 + vec2(0.172, 0.683) );
                diffuseColor.rgb = mix( diffuseColor.rgb, diffuse.rgb * tileB.rgb, 0.5 );
              #endif`);
          };
          material.customProgramCacheKey = () => previousKey + '|anti-tile-r49';
        }
        material.needsUpdate = true;
      }
    });
  }
}
