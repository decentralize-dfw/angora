import * as THREE from 'three';
import {createHatchMaterial, SECTION_POCHE} from './section.js';
import {isGlazing} from './lighting.js';

// The authored cap atlas draws the walls the drawing already knew about; the
// re-exported building brings faces the atlas never saw - bldg-3's modelled
// roof tiles, door frames, jambs - and they were showing their hollow backs
// at the cut ("bunlar bu kadar boktan olmamalı"). This closes them all at
// once with the classic stencil trick: everything the section plane can open
// inverts one stencil bit (clipped by the same plane), and one plane at the
// cut height inks the SAME wall poché wherever that bit is odd - which is
// exactly the material the plane passes through. The authored caps stay on
// top of it, 4 mm above, so nothing fights: the atlas draws what it knows,
// the stencil catches the rest.
//
// The first pass took whole material families as a proxy for "solid", and
// that is what turned the f1 plan pitch black: `floor`, `soffit` and the
// asphalt inside `masonry` arrive as SINGLE horizontal sheets. A vertical ray
// crosses a sheet once - odd - so the hatch flooded each room's whole
// footprint instead of its walls. Parity is a statement about closed
// surfaces, so the gate is now the geometry itself: a mesh joins the count
// only if its triangles leave no boundary edge. That admits every closed
// solid the deliveries contain, whatever the exporter renamed its material
// to, and it cannot admit a sheet - so the flood stops being a tuning
// question.
const TRIANGLE_BUDGET = 400000;
// 0.1 mm. Exporters split vertices at UV and normal seams, so the test welds
// by position before it looks for boundaries - otherwise every seam would
// read as a hole and no delivered solid would ever qualify.
const WELD = 1e4;
const POINT_SEED_A = 0x811c9dc5 | 0, POINT_SEED_B = 0x27d4eb2f | 0;
const EDGE_SEED_A = 0x9e3779b1 | 0, EDGE_SEED_B = 0x85ebca77 | 0;

// Sequential mixing, not `x*p1 ^ y*p2 ^ z*p3`: that classic spatial hash
// collapses on a symmetric body, and a unit cube's eight corners came out as
// two values - so an open box read as closed and the whole gate was void.
function mix(h, v) {
  h ^= v | 0;
  h = Math.imul(h, 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return h | 0;
}

// An edge shared by an even number of triangles cancels under XOR, so a
// boundary-free surface accumulates exactly zero. Everything is carried as
// two independent hashes: a weld collision or a chance cancellation - either
// of which would read as closed - then needs both to agree at once, which is
// a 2^-64 event. Nothing is allocated per edge; the test is integer
// arithmetic over the index buffer.
function measureClosed(geometry) {
  const position = geometry.attributes?.position;
  if (!position) return false;
  const index = geometry.index;
  const count = index ? index.count : position.count;
  const triangles = Math.floor(count / 3);
  // Four is the smallest closed surface there is. Past the budget the test
  // would cost more at load than the cut is worth, and a mesh that large is a
  // merged ground or lawn sheet in every delivery so far.
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
    // canonical, so the two triangles sharing an edge hash it identically
    const flip = weldA[i] > weldA[j] || (weldA[i] === weldA[j] && weldB[i] > weldB[j]);
    const p = flip ? j : i, q = flip ? i : j;
    accA ^= mix(mix(mix(mix(EDGE_SEED_A, weldA[p]), weldB[p]), weldA[q]), weldB[q]) || EDGE_SEED_A;
    accB ^= mix(mix(mix(mix(EDGE_SEED_B, weldA[p]), weldB[p]), weldA[q]), weldB[q]) || EDGE_SEED_B;
  };
  for (let t = 0; t < triangles; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
    // A triangle whose corners weld together has no area and no edge worth
    // counting; leaving its self-edges in would read as a hole.
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

// Glazing and the furniture part stay out whatever their geometry says: a
// window's cut belongs to the frame around it, and the furniture poché is a
// layer of its own so the furniture toggle can take that cut away with the
// bodies that cast it. The lift cabin travels, and a baked twin would lag it.
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
  // One double-sided writer per mesh instead of a front/back pair: inverting a
  // single bit on every crossing counts the same parity without trusting the
  // winding the exporter happened to leave, and it halves the draw calls.
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
  // It reads the bit the writers set and never touches it, so drawing the
  // plane cannot disturb the count that decided it.
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
    // a hair under the authored caps, which keep the last word where both exist
    cap.position.y = height - 0.004;
  }};
}
