import * as THREE from 'three';
import {createHatchMaterial, SECTION_POCHE} from './section.js';
import {isGlazing} from './lighting.js';
import {materialFamily} from './material-response.js';

const TRIANGLE_BUDGET = 400000;
const WELD = 1e4;
const POINT_SEED_A = 0x811c9dc5 | 0, POINT_SEED_B = 0x27d4eb2f | 0;
const EDGE_SEED_A = 0x9e3779b1 | 0, EDGE_SEED_B = 0x85ebca77 | 0;

function mix(h, v) {
  h ^= v | 0;
  h = Math.imul(h, 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return h | 0;
}

function measureClosed(geometry) {
  const position = geometry.attributes?.position;
  if (!position) return false;
  const index = geometry.index;
  const count = index ? index.count : position.count;
  const triangles = Math.floor(count / 3);
  if (triangles < 4 || triangles > TRIANGLE_BUDGET) return false;
  const weldA = new Int32Array(position.count), weldB = new Int32Array(position.count);
  for (let v = 0; v < position.count; v++) {
    const qx = Math.round(position.getX(v) * WELD) | 0;
    const qy = Math.round(position.getY(v) * WELD) | 0;
    const qz = Math.round(position.getZ(v) * WELD) | 0;
    weldA[v] = mix(mix(mix(POINT_SEED_A, qx), qy), qz);
    weldB[v] = mix(mix(mix(POINT_SEED_B, qx), qy), qz);
  }
  let accA = 0, accB = 0;
  const edge = (i, j) => {
    const flip = weldA[i] > weldA[j] || (weldA[i] === weldA[j] && weldB[i] > weldB[j]);
    const p = flip ? j : i, q = flip ? i : j;
    accA ^= mix(mix(mix(mix(EDGE_SEED_A, weldA[p]), weldB[p]), weldA[q]), weldB[q]) || EDGE_SEED_A;
    accB ^= mix(mix(mix(mix(EDGE_SEED_B, weldA[p]), weldB[p]), weldA[q]), weldB[q]) || EDGE_SEED_B;
  };
  for (let t = 0; t < triangles; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
    const same = (i, j) => weldA[i] === weldA[j] && weldB[i] === weldB[j];
    if (same(i0, i1) || same(i1, i2) || same(i2, i0)) continue;
    edge(i0, i1); edge(i1, i2); edge(i2, i0);
  }
  return accA === 0 && accB === 0;
}

export function isClosedSolid(geometry) {
  if (!geometry?.isBufferGeometry) return false;
  if ('angoraClosedSolid' in geometry.userData) return geometry.userData.angoraClosedSolid;
  const closed = measureClosed(geometry);
  geometry.userData.angoraClosedSolid = closed;
  return closed;
}

export function stencilEligible(object) {
  if (!object?.isMesh) return false;
  if (object.userData.category === 'furniture') return false;
  if (/lift|asans/i.test(object.name)) return false;
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  if (!materials.length || !materials.every(m => m && !isGlazing(m))) return false;
  return isClosedSolid(object.geometry);
}

export function createStencilCaps(villaGroup, clip, bounds) {
  const group = new THREE.Group(); group.name = 'Stencil section caps';
  const writer = new THREE.MeshBasicMaterial({
    colorWrite: false, depthWrite: false, depthTest: false, side: THREE.DoubleSide});
  writer.stencilWrite = true;
  writer.stencilFunc = THREE.AlwaysStencilFunc;
  writer.stencilWriteMask = 0x01;
  writer.stencilFail = writer.stencilZFail = writer.stencilZPass = THREE.InvertStencilOp;
  writer.clippingPlanes = [clip];
  villaGroup.updateMatrixWorld(true);
  let twins = 0;
  villaGroup.traverse(o => {
    if (!o.isMesh || !stencilEligible(o)) return;
    const twin = new THREE.Mesh(o.geometry, writer);
    twin.matrixAutoUpdate = false; twin.matrix.copy(o.matrixWorld);
    twin.renderOrder = 1; twin.frustumCulled = false;
    twin.userData.aoExcluded = true; twin.castShadow = twin.receiveShadow = false;
    group.add(twin); twins++;
  });
  const cap = new THREE.Mesh(
    new THREE.PlaneGeometry(bounds.max.x - bounds.min.x + 6, bounds.max.z - bounds.min.z + 6),
    createHatchMaterial(SECTION_POCHE));
  cap.rotation.x = -Math.PI / 2;
  cap.position.set((bounds.min.x + bounds.max.x) / 2, 0, (bounds.min.z + bounds.max.z) / 2);
  cap.renderOrder = 1.5;
  cap.material.stencilWrite = true;
  cap.material.stencilWriteMask = 0x00;
  cap.material.stencilRef = 0;
  cap.material.stencilFuncMask = 0x01;
  cap.material.stencilFunc = THREE.NotEqualStencilFunc;
  cap.material.stencilFail = THREE.KeepStencilOp;
  cap.material.stencilZFail = THREE.KeepStencilOp;
  cap.material.stencilZPass = THREE.KeepStencilOp;
  cap.userData.aoExcluded = true; cap.castShadow = cap.receiveShadow = false;
  cap.frustumCulled = false;
  group.add(cap);
  return {group, twins, update(height, visible) {
    group.visible = visible;
    cap.position.y = height - 0.004;
  }};
}

const SHELL_RATIO = 0.002;
const POCHE_FAMILY = new Set(['roof', 'plaster', 'masonry', 'soffit', 'floor', 'other']);

function measureShell(geometry) {
  const position = geometry.attributes?.position;
  if (!position) return 0;
  const index = geometry.index;
  const triangles = Math.floor((index ? index.count : position.count) / 3);
  if (triangles < 2) return 0;
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const cx = (box.min.x + box.max.x) / 2, cy = (box.min.y + box.max.y) / 2, cz = (box.min.z + box.max.z) / 2;
  const span = Math.max(box.max.x - box.min.x, 1e-4) * Math.max(box.max.y - box.min.y, 1e-4) *
    Math.max(box.max.z - box.min.z, 1e-4);
  let volume = 0;
  for (let t = 0; t < triangles; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
    const ax = position.getX(i0) - cx, ay = position.getY(i0) - cy, az = position.getZ(i0) - cz;
    const bx = position.getX(i1) - cx, by = position.getY(i1) - cy, bz = position.getZ(i1) - cz;
    const gx = position.getX(i2) - cx, gy = position.getY(i2) - cy, gz = position.getZ(i2) - cz;
    volume += (ax * (by * gz - bz * gy) + ay * (bz * gx - bx * gz) + az * (bx * gy - by * gx)) / 6;
  }
  return volume / span;
}

export function shellSide(geometry) {
  if (!geometry?.isBufferGeometry) return 0;
  if (!('angoraShellRatio' in geometry.userData)) geometry.userData.angoraShellRatio = measureShell(geometry);
  const ratio = geometry.userData.angoraShellRatio;
  return ratio > SHELL_RATIO ? 1 : ratio < -SHELL_RATIO ? -1 : 0;
}

export function pocheEligible(object) {
  if (!object?.isMesh) return false;
  if (object.userData.sectionPoche) return false;
  if (!object.userData.sectionClipped) return false;
  if (/lift|asans/i.test(object.name)) return false;
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  if (!materials.length || !materials.every(m => m && !isGlazing(m))) return false;
  if (!materials.every(m => POCHE_FAMILY.has(materialFamily(m.name)))) return false;
  return shellSide(object.geometry) > 0;
}

export function createInteriorPoche(villaGroup, clip) {
  const group = new THREE.Group(); group.name = 'Interior section poché';
  const sides = new Map();
  const materialFor = side => {
    if (!sides.has(side)) {
      const material = createHatchMaterial(SECTION_POCHE, {cut: true, side});
      material.polygonOffset = true;
      material.polygonOffsetFactor = -2;
      material.polygonOffsetUnits = -4;
      sides.set(side, material);
    }
    return sides.get(side);
  };
  const sources = [];
  villaGroup.updateMatrixWorld(true);
  villaGroup.traverse(o => { if (pocheEligible(o)) sources.push(o); });
  const twins = [];
  for (const source of sources) {
    const twin = new THREE.Mesh(source.geometry, materialFor(THREE.BackSide));
    twin.matrixAutoUpdate = false; twin.matrix.copy(source.matrixWorld);
    twin.renderOrder = 6;
    twin.userData.sectionPoche = true; twin.userData.aoExcluded = true;
    twin.castShadow = twin.receiveShadow = false;
    twin.frustumCulled = false;
    group.add(twin); twins.push({twin, source});
  }
  return {group, count: twins.length, update(height, visible) {
    group.visible = visible;
    if (!visible) return;
    for (const material of sides.values()) material.uniforms.uCut.value = height;
    for (const {twin, source} of twins) twin.visible = source.visible;
  }};
}
