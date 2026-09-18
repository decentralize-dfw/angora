import * as THREE from 'three';

const FOLIAGE = /foliage|leaf|leaves|needle|hedge|shrub/i;
const PAD = 1.5;

function components(position, index, triangles) {
  const weld = new Map(), parent = new Int32Array(position.count);
  for (let v = 0; v < position.count; v++) {
    const key = `${Math.round(position.getX(v) * 500)},${Math.round(position.getY(v) * 500)},${Math.round(position.getZ(v) * 500)}`;
    const seen = weld.get(key);
    if (seen === undefined) { weld.set(key, v); parent[v] = v; } else parent[v] = seen;
  }
  const find = i => { let r = i; while (parent[r] !== r) r = parent[r]; while (parent[i] !== r) { const n = parent[i]; parent[i] = r; i = n; } return r; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };
  const corner = (t, k) => index ? index.getX(t * 3 + k) : t * 3 + k;
  for (let t = 0; t < triangles; t++) { union(corner(t, 0), corner(t, 1)); union(corner(t, 1), corner(t, 2)); }
  return { find, corner };
}

export function splitPlotFoliage(root, plotRect) {
  if (!plotRect) return null;
  const outside = [];
  const sources = [];
  root.traverse(object => {
    if (!object.isMesh || object.userData.plotFoliage) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (!materials.length || !materials.every(m => m && FOLIAGE.test(m.name))) return;
    if (object.geometry?.attributes?.position) sources.push(object);
  });
  for (const source of sources) {
    const position = source.geometry.attributes.position;
    const index = source.geometry.index;
    const triangles = Math.floor((index ? index.count : position.count) / 3);
    if (triangles < 12) continue;
    const { find, corner } = components(position, index, triangles);
    const extent = new Map();
    for (let t = 0; t < triangles; t++) {
      const root_ = find(corner(t, 0));
      let box = extent.get(root_);
      if (!box) { box = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity }; extent.set(root_, box); }
      for (let k = 0; k < 3; k++) {
        const i = corner(t, k), x = position.getX(i), z = position.getZ(i);
        if (x < box.minX) box.minX = x; if (x > box.maxX) box.maxX = x;
        if (z < box.minZ) box.minZ = z; if (z > box.maxZ) box.maxZ = z;
      }
    }
    const beyond = new Set();
    for (const [key, box] of extent) {
      const cx = (box.minX + box.maxX) / 2, cz = (box.minZ + box.maxZ) / 2;
      if (cx < plotRect.minX - PAD || cx > plotRect.maxX + PAD ||
          cz < plotRect.minZ - PAD || cz > plotRect.maxZ + PAD) beyond.add(key);
    }
    if (!beyond.size || beyond.size === extent.size) {
      if (beyond.size === extent.size) { source.userData.plotFoliage = 'beyond'; outside.push(source); }
      continue;
    }
    const keep = [], drop = [];
    for (let t = 0; t < triangles; t++) (beyond.has(find(corner(t, 0))) ? drop : keep).push(t);
    const build = list => {
      const attributes = source.geometry.attributes;
      const out = new THREE.BufferGeometry();
      for (const name of Object.keys(attributes)) {
        const src = attributes[name], size = src.itemSize;
        const array = new Float32Array(list.length * 3 * size);
        let w = 0;
        for (const t of list) for (let k = 0; k < 3; k++) {
          const i = corner(t, k);
          for (let c = 0; c < size; c++) array[w++] = src.getComponent(i, c);
        }
        out.setAttribute(name, new THREE.BufferAttribute(array, size));
      }
      return out;
    };
    const near = build(keep), far = build(drop);
    source.geometry.dispose();
    source.geometry = near;
    const twin = new THREE.Mesh(far, source.material);
    twin.name = source.name + ' · beyond the plot';
    twin.matrixAutoUpdate = false; twin.matrix.copy(source.matrix);
    twin.renderOrder = source.renderOrder;
    twin.castShadow = source.castShadow; twin.receiveShadow = source.receiveShadow;
    twin.userData = { ...source.userData, plotFoliage: 'beyond' };
    source.parent.add(twin);
    outside.push(twin);
  }
  if (!outside.length) return null;
  let hidden = false;
  return {
    count: outside.length,
    setMassed(on) {
      if (on === hidden) return false;
      hidden = on;
      for (const mesh of outside) mesh.visible = !on;
      return true;
    },
  };
}
