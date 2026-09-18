import * as THREE from 'three';

export const floorDatums = [0, 3.0996, 6.3714, 9.4705];
export function sectionHeight(view, top) {
  return /^f[0-3]$/.test(view) ? floorDatums[Number(view[1])] + (view==='f3'?1.3:1.6) : top;
}
export function smoothStep(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

export const SECTION_FILL = [0.086, 0.098, 0.105];
export const FURNITURE_FILL = [0.706, 0.725, 0.729];
export const SOIL_FILL = [0.352, 0.325, 0.286];
export function createFillMaterial(rgb) {
  return new THREE.MeshBasicMaterial({color:new THREE.Color(rgb[0],rgb[1],rgb[2]),
    side:THREE.DoubleSide, toneMapped:false});
}

export function createWallCaps(atlas) {
  const group = new THREE.Group(); group.name = 'Geometric wall sections';
  const slices = atlas.slices;
  if (!slices?.length || atlas.coordinate_system !== 'glTF_XZ') throw Error('Invalid section atlas');
  const wallFill = createFillMaterial(SECTION_FILL);
  const furnitureFill = createFillMaterial(FURNITURE_FILL);
  const build = (name, fill) => {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), fill);
    mesh.name = name; mesh.renderOrder = 2; group.add(mesh); return mesh;
  };
  const layers = [
    {mesh: build('Solid wall cross section', wallFill), p: 'p', i: 'i'},
    {mesh: build('Solid fixture cross section', wallFill), p: 'q', i: 'j'},
    {mesh: build('Solid furniture cross section', furnitureFill), p: 'fq', i: 'fj', furniture: true},
  ];
  let current = -1, furnitureVisible = true;
  function rebuild(index) {
    const data = slices[index];
    for (const layer of layers) {
      const p = data[layer.p], i = data[layer.i];
      const geometry = new THREE.BufferGeometry();
      if (p?.length && i?.length) {
        const positions = new Float32Array(p.length / 2 * 3);
        for (let k = 0; k < p.length / 2; k++) {
          positions[k * 3] = p[k * 2]; positions[k * 3 + 2] = p[k * 2 + 1];
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(i); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
      }
      layer.mesh.geometry.dispose(); layer.mesh.geometry = geometry;
    }
  }
  return {group, update(height, visible) {
    group.visible = visible && height <= slices.at(-1).height;
    if (!group.visible) return;
    let low = 0, high = slices.length - 1;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (slices[mid].height < height) low = mid + 1; else high = mid;
    }
    if (low > 0 && height - slices[low - 1].height < slices[low].height - height) low--;
    if (low !== current) {current = low; rebuild(low);}
    for (const layer of layers) {
      layer.mesh.visible = !layer.furniture || furnitureVisible;
      layer.mesh.position.y = height;
    }
  }, setFurnitureVisible(value) {furnitureVisible = value;}};
}

export const SOIL_CUT_HEIGHT = 1.6;
export function createSoilCap(capScene) {
  const group = new THREE.Group(); group.name = 'Authored soil section';
  const sources = [];
  capScene.updateMatrixWorld(true);
  capScene.traverse(object => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (object.isMesh && materials.some(m => m?.name === 'R32 | soil section hatch') &&
        !/^R42[_ ]F0[_ ]site[_ ]section[_ ]field$/i.test(object.name)) sources.push(object);
  });
  if (!sources.length) return null;
  const material = createFillMaterial(SOIL_FILL);
  for (const source of sources) {
    const mesh = new THREE.Mesh(source.geometry, material);
    mesh.name = 'Solid soil cross section';
    mesh.applyMatrix4(source.matrixWorld);
    mesh.renderOrder = 2; mesh.castShadow = mesh.receiveShadow = false;
    source.geometry = null;
    group.add(mesh);
  }
  capScene.traverse(object => {
    if (object.isMesh && object.geometry) object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material) continue;
      for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
      material.dispose();
    }
  });
  return {group, update(height, visible) {
    group.visible = visible && Math.abs(height - SOIL_CUT_HEIGHT) < 0.001;
  }};
}
