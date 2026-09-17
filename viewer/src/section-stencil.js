import * as THREE from 'three';
import {createHatchMaterial, SECTION_POCHE} from './section.js';
import {isGlazing} from './lighting.js';
import {materialFamily} from './material-response.js';

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

// ---------------------------------------------------------------------------
// The interior poché: what actually closes bldg-3's cut.
//
// Parity is exact but it needs a closed surface, and the optimised delivery is
// not one. Measured over build/web: of bldg-3's 32 primitives only two leave
// no boundary edge - `Clay tile`, `roof-7`, `STRUCCO`, `WHT`, `WOOD-FL`,
// `ceiling` and `terra_floor` all have holes - so the stencil can never reach
// the surfaces the review is about ("çatının kestiği yerleri kontrol et!
// bunlar bu kadar boktan olmamalı").
//
// What the delivery does have is orientation. Every clipped material is drawn
// DoubleSide, so where the plane opens a solid the renderer cheerfully draws
// its INSIDE with the tile material - that is the look being complained
// about. Painting those inward faces with the same wall poché turns the same
// pixels into a drawn cut, and it needs no watertightness at all: only which
// side of each mesh faces in.
//
// bldg-3 answers that badly too - roof.003, white_trim, wood_floor, ceiling
// and terra_floor all measure a NEGATIVE signed volume about their own centre.
// The first attempt read that as "inside-out" and painted their front faces
// instead; photographed at ?view=f3 it had inked every visible floor, because
// on a body that is not closed the divergence integral's SIGN means nothing -
// it is dominated by wherever the surface is missing.
//
// So orientation is trusted only where it is corroborated: a mesh joins the
// poché when it measures outward AND belongs to the roof family, which is the
// one the review names and the one the delivery gets right (`Clay tile`
// +0.1246 over its bbox). Its top face is a front face and stays tiles; the
// underside the cut exposes is a back face and becomes hatch. Everything
// else - the sheets with no interior, the bodies whose sign cannot be
// believed - waits for the section atlas to be regenerated against bldg-3.
const SHELL_RATIO = 0.002;
const POCHE_FAMILY = new Set(['roof']);

// Signed volume about the geometry's own bbox centre, over its bbox volume.
// Taken about the centre so an open sheet reads ~0 wherever it sits in world
// space, which is the whole point: a sheet has no interior to ink.
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

// > 0 outward shell (its inside is the back face), < 0 inside-out (its inside
// is the front face), 0 a sheet with no interior.
export function shellSide(geometry) {
  if (!geometry?.isBufferGeometry) return 0;
  if (!('angoraShellRatio' in geometry.userData)) geometry.userData.angoraShellRatio = measureShell(geometry);
  const ratio = geometry.userData.angoraShellRatio;
  return ratio > SHELL_RATIO ? 1 : ratio < -SHELL_RATIO ? -1 : 0;
}

export function pocheEligible(object) {
  if (!object?.isMesh) return false;
  if (object.userData.sectionPoche) return false;   // never twin a twin
  if (!object.userData.sectionClipped) return false; // only what the plane cuts
  if (/lift|asans/i.test(object.name)) return false;
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  // See-through glass has no poché: a window's cut belongs to its frame.
  if (!materials.length || !materials.every(m => m && !isGlazing(m))) return false;
  if (!materials.every(m => POCHE_FAMILY.has(materialFamily(m.name)))) return false;
  // Outward only. A negative sign on an unclosed body is not evidence of an
  // inverted one, and acting on it inked the floors.
  return shellSide(object.geometry) > 0;
}

export function createInteriorPoche(villaGroup, clip) {
  const group = new THREE.Group(); group.name = 'Interior section poché';
  const sides = new Map();
  const materialFor = side => {
    if (!sides.has(side)) {
      const material = createHatchMaterial(SECTION_POCHE, {cut: true, side});
      // The source draws this very triangle with its own material, so the
      // poché has to win the tie rather than fight it.
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
    twin.renderOrder = 6;   // after the content that drew the same face
    twin.userData.sectionPoche = true; twin.userData.aoExcluded = true;
    twin.castShadow = twin.receiveShadow = false;
    twin.frustumCulled = false;
    group.add(twin); twins.push({twin, source});
  }
  return {group, count: twins.length, update(height, visible) {
    group.visible = visible;
    if (!visible) return;
    for (const material of sides.values()) material.uniforms.uCut.value = height;
    // The furniture toggle hides its bodies; their cut has to go with them,
    // the way the authored furniture poché layer already does.
    for (const {twin, source} of twins) twin.visible = source.visible;
  }};
}
