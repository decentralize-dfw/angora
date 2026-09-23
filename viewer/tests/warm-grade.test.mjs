import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GradeShader, GRADE} from '../src/grade-pass.js';
import {CONTACT_FRAGMENT_WARM, applyContactShading} from '../src/vertex-ao.js';

// AYDINLIK emniyet kemeri: warm modun kancaları var ve KAPALIYKEN no-op.

test('grade: warm uniforms default to identity - flag off changes nothing', () => {
  assert.deepEqual(GradeShader.uniforms.uWarm.value.toArray(), [1, 1, 1]);
  assert.equal(GradeShader.uniforms.uContrast.value, 1);
  assert.ok(GradeShader.fragmentShader.includes('uWarm') &&
            GradeShader.fragmentShader.includes('uContrast'));
  assert.deepEqual([...GRADE.lift], [0.004, 0.005, 0.007], 'authored grade untouched');
});

test('contact: warm form takes the DARKEST of aoMap and contact, not the product', () => {
  assert.match(CONTACT_FRAGMENT_WARM, /min\(ambientOcclusion,contactShade\)/);
  assert.match(CONTACT_FRAGMENT_WARM, /USE_AOMAP/);
  const plain = new THREE.MeshStandardMaterial();
  plain.geometry = null;
  applyContactShading(plain);
  const warm = new THREE.MeshStandardMaterial();
  applyContactShading(warm, {warm: true});
  assert.match(plain.customProgramCacheKey(), /\|contact-ao-v1$/);
  assert.match(warm.customProgramCacheKey(), /\|contact-ao-v1w$/);
  const shader = {uniforms: {}, vertexShader: '#include <begin_vertex>',
    fragmentShader: '#include <aomap_fragment>'};
  warm.onBeforeCompile(shader, null);
  assert.ok(shader.fragmentShader.includes('contactFloor'));
});
