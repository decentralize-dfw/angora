import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildOccupancy, bakeMeshContactOcclusion, applyContactShading,
  bakeContactOcclusion, SKIP_TRIANGLES} from '../src/vertex-ao.js';

// FAZ 6 İŞ C - contact darkening. A floor vertex against a wall must read
// occluded; a lone plane in the open must not; a mesh past the triangle
// cap is skipped; the shader multiplies INDIRECT terms only and encodes
// occlusion (missing attribute = zero = untouched).

function room() {
  // a floor with a wall standing on its edge
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8, 8, 8), new THREE.MeshStandardMaterial({name: 'floor'}));
  floor.rotation.x = -Math.PI / 2;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 4, 8, 4), new THREE.MeshStandardMaterial({name: 'wall'}));
  wall.position.set(0, 2, -4);
  const group = new THREE.Group();
  group.add(floor, wall);
  group.updateMatrixWorld(true);
  return {group, floor, wall};
}

test('a vertex at the wall junction shades, one in the open stays near zero', () => {
  const {group, floor} = room();
  const models = new Map([['a', group]]);
  const grid = buildOccupancy(models);
  assert.ok(grid);
  assert.ok(bakeMeshContactOcclusion(floor, grid) > 0);
  const occ = floor.geometry.attributes._contactOcc;
  const position = floor.geometry.attributes.position;
  let nearWall = 0, open = 0, nWall = 0, nOpen = 0;
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i).applyMatrix4(floor.matrixWorld);
    if (v.z < -3.4) {nearWall += occ.getX(i); nWall++;}
    if (v.z > 3.4) {open += occ.getX(i); nOpen++;}
  }
  assert.ok(nearWall / nWall > 0.12, `junction ${nearWall / nWall}`);
  assert.ok(open / nOpen < (nearWall / nWall) / 2, `open ${open / nOpen} vs junction ${nearWall / nWall}`);
});

test('a mesh past the triangle cap is skipped, logged, and left clean', () => {
  const {group} = room();
  const big = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 400, 260), new THREE.MeshStandardMaterial());
  assert.ok(big.geometry.index.count / 3 > SKIP_TRIANGLES);
  group.add(big); group.updateMatrixWorld(true);
  const grid = buildOccupancy(new Map([['a', group]]));
  assert.equal(bakeMeshContactOcclusion(big, grid), 0);
  assert.equal(big.geometry.attributes._contactOcc, undefined);
});

test('the shader touches indirect terms only and keys the program', () => {
  const material = new THREE.MeshStandardMaterial();
  assert.equal(applyContactShading(material), true);
  assert.equal(applyContactShading(material), false, 'idempotent');
  const shader = {uniforms: {}, vertexShader: '#include <begin_vertex>',
    fragmentShader: '#include <aomap_fragment>\ndirectLight.color;'};
  material.onBeforeCompile(shader, null);
  assert.match(shader.fragmentShader, /reflectedLight\.indirectDiffuse\*=contactShade/);
  assert.match(shader.fragmentShader, /indirectSpecular\*=mix/);
  assert.ok(!shader.fragmentShader.includes('directLight.color*'), 'the sun stays crisp');
  assert.match(material.customProgramCacheKey(), /contact-ao-v1/);
});

test('the idle driver resolves with counts and a late-bake hook for the deferred interior', async () => {
  const {group} = room();
  const result = await bakeContactOcclusion(new Map([['a', group]]),
    {idle: fn => fn({timeRemaining: () => 50})});
  assert.ok(result.vertices > 0);
  assert.equal(result.meshes, 2);
  const late = new THREE.Group();
  late.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshStandardMaterial({name: 'late floor'})));
  late.updateMatrixWorld(true);
  assert.ok(result.bakeLate(late) > 0);
  assert.ok(late.children[0].geometry.attributes._contactOcc);
});
