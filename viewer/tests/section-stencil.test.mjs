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

function openBox() {
  const box = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
  const position = box.attributes.position.array;
  const kept = position.slice(0, position.length - 6 * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(kept, 3));
  return geometry;
}

test('A single sheet is never a closed solid - this is the black f1 plan', () => {
  assert.equal(isClosedSolid(new THREE.PlaneGeometry(8, 6)), false);
  assert.equal(isClosedSolid(new THREE.PlaneGeometry(8, 6, 12, 9)), false);
  assert.equal(isClosedSolid(new THREE.PlaneGeometry(8, 6).toNonIndexed()), false);
  assert.equal(isClosedSolid(openBox()), false);
  assert.equal(isClosedSolid(new THREE.CylinderGeometry(0.3, 0.3, 2, 16, 1, true)), false);
});

test('Closed solids qualify whether or not the exporter shared their corners', () => {
  assert.equal(isClosedSolid(new THREE.BoxGeometry(1, 1, 1)), true);
  assert.equal(isClosedSolid(new THREE.BoxGeometry(1, 1, 1).toNonIndexed()), true);
  assert.equal(isClosedSolid(new THREE.SphereGeometry(1, 16, 12)), true);
  assert.equal(isClosedSolid(new THREE.CylinderGeometry(0.3, 0.3, 2, 16)), true);
  assert.equal(isClosedSolid(new THREE.TorusGeometry(1, 0.3, 12, 16)), true);
});

test('A tile-thin slab still reads closed, and a 0.1 mm weld does not merge it shut', () => {
  assert.equal(isClosedSolid(new THREE.BoxGeometry(0.4, 0.015, 0.25)), true);
});

test('Only closed geometry joins the count, and never glass, furniture or the cabin', () => {
  const solid = new THREE.BoxGeometry(0.2, 3, 4);
  assert.equal(stencilEligible(named(solid, 'STRUCCO')), true);
  assert.equal(stencilEligible(named(solid, 'Clay tile')), true);
  assert.equal(stencilEligible(named(solid, 'WOOD-FL')), true);

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
  villa.add(named(new THREE.PlaneGeometry(6, 5), 'wood_floor'));
  villa.add(named(new THREE.PlaneGeometry(6, 5), 'ceiling'));
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 4.6996);
  const bounds = new THREE.Box3(new THREE.Vector3(-8, 0, -8), new THREE.Vector3(8, 11, 8));
  const caps = createStencilCaps(villa, clip, bounds);

  assert.equal(caps.twins, 2);

  const writers = caps.group.children.filter(child => child.material.stencilZPass === THREE.InvertStencilOp);
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
    assert.deepEqual(writer.material.clippingPlanes, [clip]);
  }

  const cap = caps.group.children.at(-1);
  assert.equal(cap.material.stencilWrite, true);
  assert.equal(cap.material.stencilWriteMask, 0x00);
  assert.equal(cap.material.stencilFunc, THREE.NotEqualStencilFunc);
  assert.equal(cap.material.stencilRef, 0);
  assert.equal(cap.material.stencilFuncMask, 0x01);
  assert.equal(cap.material.stencilZPass, THREE.KeepStencilOp);

  caps.update(7.9714, true);
  assert.equal(caps.group.visible, true);
  assert.ok(Math.abs(cap.position.y - (7.9714 - 0.004)) < 1e-9);
  caps.update(7.9714, false);
  assert.equal(caps.group.visible, false);
});

test('The canvas asks for a stencil buffer, or a phone has nowhere to count', () => {
  const source = new URL('../src/main.js', import.meta.url);
  const main = fs.readFileSync(source, 'utf8');
  assert.match(main, /new THREE\.WebGLRenderer\(\{[^}]*stencil:\s*true/);
});
