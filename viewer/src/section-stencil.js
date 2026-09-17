import * as THREE from 'three';
import {createHatchMaterial, SECTION_POCHE} from './section.js';
import {materialFamily} from './material-response.js';
import {isGlazing} from './lighting.js';

// The authored cap atlas draws the walls the drawing already knew about; the
// re-exported building brings faces the atlas never saw - bldg-3's modelled
// roof tiles, door frames, jambs - and they were showing their hollow backs
// at the cut ("bunlar bu kadar boktan olmamalı"). This closes them all at
// once with the classic stencil trick: every closed architectural solid
// writes front/back parity into the stencil (clipped by the same section
// plane), and one plane at the cut height inks the SAME wall poché wherever
// the parity is odd - which is exactly the material the plane passes
// through. The authored caps stay on top of it, 4 mm above, so nothing
// fights: the atlas draws what it knows, the stencil catches the rest.
//
// Parity needs closed volumes, so the writers take only the families that
// arrive as solids - masonry, roof, plaster, soffit, floors, joinery. An
// open sheet (glazing, a curtain, upholstery) would smear ink across the
// cap, so glass and the furniture part stay out; they keep their
// double-sided clip as before.
const SOLID_FAMILY = new Set(['masonry', 'roof', 'plaster', 'soffit', 'floor']);
const JOINERY = /wood|walnut|door|kapı/i;

export function stencilEligible(object) {
  if (object.userData.category === 'furniture') return false;
  if (/lift|asans/i.test(object.name)) return false;  // the cabin travels; a baked twin would lag it
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  return materials.every(m => m && !isGlazing(m) &&
    (SOLID_FAMILY.has(materialFamily(m.name)) || JOINERY.test(m.name)));
}

export function createStencilCaps(villaGroup, clip, bounds) {
  const group = new THREE.Group(); group.name = 'Stencil section caps';
  const writer = (side, op) => {
    const material = new THREE.MeshBasicMaterial({colorWrite: false, depthWrite: false, depthTest: false, side});
    material.stencilWrite = true;
    material.stencilFunc = THREE.AlwaysStencilFunc;
    material.stencilFail = op; material.stencilZFail = op; material.stencilZPass = op;
    material.clippingPlanes = [clip];
    return material;
  };
  const backMaterial = writer(THREE.BackSide, THREE.IncrementWrapStencilOp);
  const frontMaterial = writer(THREE.FrontSide, THREE.DecrementWrapStencilOp);
  villaGroup.updateMatrixWorld(true);
  let twins = 0;
  villaGroup.traverse(o => {
    if (!o.isMesh || !stencilEligible(o)) return;
    for (const material of [backMaterial, frontMaterial]) {
      const twin = new THREE.Mesh(o.geometry, material);
      twin.matrixAutoUpdate = false; twin.matrix.copy(o.matrixWorld);
      twin.renderOrder = 1; twin.frustumCulled = false;
      twin.userData.aoExcluded = true; twin.castShadow = twin.receiveShadow = false;
      group.add(twin); twins++;
    }
  });
  const cap = new THREE.Mesh(
    new THREE.PlaneGeometry(bounds.max.x - bounds.min.x + 6, bounds.max.z - bounds.min.z + 6),
    createHatchMaterial(SECTION_POCHE));
  cap.rotation.x = -Math.PI / 2;
  cap.position.set((bounds.min.x + bounds.max.x) / 2, 0, (bounds.min.z + bounds.max.z) / 2);
  cap.renderOrder = 1.5;
  cap.material.stencilWrite = true;
  cap.material.stencilRef = 0;
  cap.material.stencilFunc = THREE.NotEqualStencilFunc;
  cap.material.stencilFail = THREE.ReplaceStencilOp;
  cap.material.stencilZFail = THREE.ReplaceStencilOp;
  cap.material.stencilZPass = THREE.ReplaceStencilOp;
  cap.userData.aoExcluded = true; cap.castShadow = cap.receiveShadow = false;
  cap.frustumCulled = false;
  group.add(cap);
  return {group, twins, update(height, visible) {
    group.visible = visible;
    // a hair under the authored caps, which keep the last word where both exist
    cap.position.y = height - 0.004;
  }};
}
