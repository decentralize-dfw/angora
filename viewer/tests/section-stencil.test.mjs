import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {isClosedSolid, stencilEligible, createStencilCaps} from '../src/section-stencil.js';

const named = (geometry, name, extra = {}) => {
  const material = new THREE.MeshStandardMaterial({name});
  Object.assign(material, extra);
  return new THREE.Mesh(geometry, material);
};

// Open the box by dropping one of its six quads, which leaves a rim of
// boundary edges exactly the way a missing face does in a delivery.
function openBox() {
  const box = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
  const position = box.attributes.position.array;
  const kept = position.slice(0, position.length - 6 * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(kept, 3));
  return geometry;
}

test('A single sheet is never a closed solid - this is the black f1 plan', () => {
  // The first pass admitted whole material families, and `floor`, `soffit`
  // and the asphalt inside `masonry` arrive as one horizontal sheet each: a
  // vertical ray crosses them once, the parity reads odd, and the hatch
  // flooded every room's footprint instead of its walls.
  assert.equal(isClosedSolid(new THREE.PlaneGeometry(8, 6)), false);
  assert.equal(isClosedSolid(new THREE.PlaneGeometry(8, 6, 12, 9)), false);
  assert.equal(isClosedSolid(new THREE.PlaneGeometry(8, 6).toNonIndexed()), false);
  assert.equal(isClosedSolid(openBox()), false);
  // A capless cylinder is the case a volume heuristic gets wrong: every point
  // faces away from the axis, so the divergence integral reads like a solid.
  // Boundary edges do not care - it has two open rims.
  assert.equal(isClosedSolid(new THREE.CylinderGeometry(0.3, 0.3, 2, 16, 1, true)), false);
});

test('Closed solids qualify whether or not the exporter shared their corners', () => {
  // BoxGeometry already splits its corners per face - 24 vertices for 8
  // corners - so this only passes because the test welds by position first.
  assert.equal(isClosedSolid(new THREE.BoxGeometry(1, 1, 1)), true);
  assert.equal(isClosedSolid(new THREE.BoxGeometry(1, 1, 1).toNonIndexed()), true);
  assert.equal(isClosedSolid(new THREE.SphereGeometry(1, 16, 12)), true);
  assert.equal(isClosedSolid(new THREE.CylinderGeometry(0.3, 0.3, 2, 16)), true);
  assert.equal(isClosedSolid(new THREE.TorusGeometry(1, 0.3, 12, 16)), true);
});

test('A tile-thin slab still reads closed, and a 0.1 mm weld does not merge it shut', () => {
  // A modelled clay tile is a very flat solid; welding at 0.1 mm must not
  // collapse its two faces into one sheet.
  assert.equal(isClosedSolid(new THREE.BoxGeometry(0.4, 0.015, 0.25)), true);
});

test('Only closed geometry joins the count, and never glass, furniture or the cabin', () => {
  const solid = new THREE.BoxGeometry(0.2, 3, 4);
  assert.equal(stencilEligible(named(solid, 'STRUCCO')), true);
  assert.equal(stencilEligible(named(solid, 'Clay tile')), true);
  assert.equal(stencilEligible(named(solid, 'WOOD-FL')), true);

  // A sheet is out however it is named - the gate is the geometry.
  assert.equal(stencilEligible(named(new THREE.PlaneGeometry(6, 5), 'wood_floor')), false);
  assert.equal(stencilEligible(named(new THREE.PlaneGeometry(6, 5), 'ceiling')), false);
  assert.equal(stencilEligible(named(new THREE.PlaneGeometry(40, 40), 'asphalt')), false);

  const glass = named(solid, 'Lift glass leaf');
  glass.material.transmission = 0.9;
  assert.equal(stencilEligible(glass), false);
  assert.equal(stencilEligible(named(solid, 'glass')), false);

  const cabin = named(solid, 'STRUCCO');
  cabin.name = 'Lift cabin';
  assert.equal(stencilEligible(cabin), false);

  const chair = named(solid, 'STRUCCO');
  chair.userData.category = 'furniture';
  assert.equal(stencilEligible(chair), false);
});

test('The writers invert one bit double-sided and the cap only reads it', () => {
  const villa = new THREE.Group();
  villa.add(named(new THREE.BoxGeometry(0.2, 3, 4), 'STRUCCO'));
  villa.add(named(new THREE.BoxGeometry(0.4, 0.015, 0.25), 'Clay tile'));
  villa.add(named(new THREE.PlaneGeometry(6, 5), 'wood_floor'));   // sheet: out
  villa.add(named(new THREE.PlaneGeometry(6, 5), 'ceiling'));      // sheet: out
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 4.6996);
  const bounds = new THREE.Box3(new THREE.Vector3(-8, 0, -8), new THREE.Vector3(8, 11, 8));
  const caps = createStencilCaps(villa, clip, bounds);

  // One writer per closed mesh, not the front/back pair: inverting a bit does
  // not care which way the exporter wound the triangles.
  assert.equal(caps.twins, 2);

  const writers = caps.group.children.filter(child => child.material.isMeshBasicMaterial);
  assert.equal(writers.length, 2);
  for (const writer of writers) {
    assert.equal(writer.material.side, THREE.DoubleSide);
    assert.equal(writer.material.colorWrite, false);
    assert.equal(writer.material.depthTest, false);
    assert.equal(writer.material.stencilWrite, true);
    assert.equal(writer.material.stencilWriteMask, 0x01);
    assert.equal(writer.material.stencilZPass, THREE.InvertStencilOp);
    assert.equal(writer.material.stencilFail, THREE.InvertStencilOp);
    assert.equal(writer.material.stencilZFail, THREE.InvertStencilOp);
    // clipped by the same plane the section uses, or the count would include
    // storeys the cut has already taken away
    assert.deepEqual(writer.material.clippingPlanes, [clip]);
  }

  const cap = caps.group.children.at(-1);
  assert.equal(cap.material.stencilWrite, true);
  assert.equal(cap.material.stencilWriteMask, 0x00);
  assert.equal(cap.material.stencilFunc, THREE.NotEqualStencilFunc);
  assert.equal(cap.material.stencilRef, 0);
  assert.equal(cap.material.stencilFuncMask, 0x01);
  assert.equal(cap.material.stencilZPass, THREE.KeepStencilOp);

  // and it rides just under the authored atlas, which keeps the last word
  caps.update(7.9714, true);
  assert.equal(caps.group.visible, true);
  assert.ok(Math.abs(cap.position.y - (7.9714 - 0.004)) < 1e-9);
  caps.update(7.9714, false);
  assert.equal(caps.group.visible, false);
});

test('The canvas asks for a stencil buffer, or a phone has nowhere to count', () => {
  // three defaults the canvas stencil attribute to false and the compact path
  // renders straight to the canvas with no composer, so the attribute is the
  // only thing that makes the cut faces close on a phone.
  const source = new URL('../src/main.js', import.meta.url);
  const main = fs.readFileSync(source, 'utf8');
  assert.match(main, /new THREE\.WebGLRenderer\(\{[^}]*stencil:\s*true/);
});

// --- the interior poché, which is what actually closes bldg-3's cut --------

import {shellSide, pocheEligible, createInteriorPoche} from '../src/section-stencil.js';

const clipped = (geometry, name) => {
  const mesh = named(geometry, name);
  mesh.userData.sectionClipped = true;
  return mesh;
};

// Reverse every triangle's winding, which is what the optimiser did to
// roof.003, white_trim, wood_floor, ceiling and terra_floor.
function insideOut(geometry) {
  const flipped = geometry.toNonIndexed();
  const p = flipped.attributes.position.array;
  for (let t = 0; t < p.length / 9; t++) {
    for (let k = 0; k < 3; k++) {
      const a = t * 9 + k, b = t * 9 + 6 + k;
      const swap = p[a]; p[a] = p[b]; p[b] = swap;
    }
  }
  return flipped;
}

test('A shell knows which of its sides faces in, and a sheet has no inside', () => {
  assert.equal(shellSide(new THREE.BoxGeometry(0.2, 3, 4)), 1);
  assert.equal(shellSide(new THREE.BoxGeometry(0.4, 0.015, 0.25)), 1);   // a tile slab
  assert.equal(shellSide(insideOut(new THREE.BoxGeometry(0.2, 3, 4))), -1);
  assert.equal(shellSide(new THREE.PlaneGeometry(8, 6)), 0);
  assert.equal(shellSide(new THREE.PlaneGeometry(8, 6, 12, 9)), 0);
  // A wall with no thickness is the STRUCCO case: nothing to ink.
  assert.equal(shellSide(new THREE.PlaneGeometry(12, 9, 20, 16).rotateX(Math.PI / 2)), 0);
});

test('Only the roof the plane cuts gets a poché, measured outward', () => {
  const solid = new THREE.BoxGeometry(0.4, 0.015, 0.25);
  assert.equal(pocheEligible(clipped(solid, 'Clay tile')), true);
  assert.equal(pocheEligible(clipped(solid, 'roof-7')), true);

  // Photographed at ?view=f3, trusting a negative sign inked every visible
  // floor: on an unclosed body the divergence integral's sign means nothing.
  assert.equal(pocheEligible(clipped(insideOut(solid), 'roof-7')), false);
  // and nothing outside the family the review names and the delivery gets
  // right, whatever its geometry says
  assert.equal(pocheEligible(clipped(new THREE.BoxGeometry(0.2, 3, 4), 'STRUCCO')), false);
  assert.equal(pocheEligible(clipped(new THREE.BoxGeometry(2, 0.2, 3), 'WOOD-FL')), false);
  assert.equal(pocheEligible(clipped(new THREE.BoxGeometry(2, 0.2, 3), 'ceiling')), false);

  // The neighbourhood is setting, not subject: it is never clipped, so it is
  // never hatched.
  assert.equal(pocheEligible(named(solid, 'Clay tile')), false);
  assert.equal(pocheEligible(clipped(new THREE.PlaneGeometry(6, 5), 'wood_floor')), false);
  const glass = clipped(solid, 'Context glazing');
  glass.material.transmission = 0.9;
  assert.equal(pocheEligible(glass), false);
});

test('The poché inks the roof underside only, and rides the cut height', () => {
  const villa = new THREE.Group();
  const tiles = clipped(new THREE.BoxGeometry(0.4, 0.015, 0.25), 'Clay tile');
  villa.add(tiles);
  villa.add(clipped(new THREE.BoxGeometry(0.2, 3, 4), 'STRUCCO'));                 // not the family
  villa.add(clipped(insideOut(new THREE.BoxGeometry(0.4, 0.015, 0.25)), 'roof-7')); // sign not believed
  villa.add(clipped(new THREE.PlaneGeometry(6, 5), 'ceiling'));                    // sheet
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 7.9714);
  const poche = createInteriorPoche(villa, clip);
  assert.equal(poche.count, 1);

  // The tiles' top face stays tiles; only the underside the cut exposes inks.
  assert.deepEqual(poche.group.children.map(child => child.material.side), [THREE.BackSide]);
  for (const child of poche.group.children) {
    assert.equal(child.userData.sectionPoche, true);
    assert.equal(child.castShadow, false);
    assert.equal(child.material.polygonOffset, true);   // it must win the tie
    assert.ok(child.material.uniforms.uCut, 'the poché carries its own cut');
  }

  // The same ruling as the authored wall caps, or the two would not read as
  // one drawing.
  const hatch = poche.group.children[0].material.fragmentShader;
  assert.match(hatch, /0\.140/);
  assert.match(hatch, /if \(worldPosition\.y > uCut\) discard;/);

  poche.update(7.9714, true);
  assert.equal(poche.group.visible, true);
  for (const child of poche.group.children) assert.equal(child.material.uniforms.uCut.value, 7.9714);

  // A hidden body's cut goes with it, the way the authored furniture layer does
  tiles.visible = false;
  poche.update(7.9714, true);
  const twin = poche.group.children.find(child => child.geometry === tiles.geometry);
  assert.equal(twin.visible, false);
  tiles.visible = true;
  poche.update(7.9714, true);
  assert.equal(twin.visible, true);

  poche.update(7.9714, false);
  assert.equal(poche.group.visible, false);
});

test('The viewer builds the poché beside the stencil and drives both per frame', () => {
  const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(main, /createInteriorPoche\(groups\.get\('villa'\),clip\)/);
  assert.match(main, /interiorPoche\?\.update\(clip\.constant/);
});
