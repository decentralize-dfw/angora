import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {glassPolishMask, applyGlassCellPolish} from '../src/glass-cells.js';

// FAZ 6 İŞ E.1 - kabul E.5 + 6.10: the repaired exterior-glass polish is
// CELL-gated. The lift's photographed rose glass shares a material with
// the clear panes and must not turn into a mirror; the frosted interior
// set must never match at all.

test('the mask polishes clear panes and Context glazing, never the rose or frosted set', () => {
  const arch = glassPolishMask({materials: ['glass', 'Lift | Photographed rose glass 80 percent', 'R31 | R35 clear door glass']});
  assert.deepEqual(arch, [1, 0, 1]);
  const context = glassPolishMask({materials: ['Context glazing', 'R31 | R39 boundary limestone top']});
  assert.deepEqual(context, [1, 0]);
  assert.equal(glassPolishMask({materials: ['R31 | R33 shower frosted glass', 'R31 | Shower satin glass',
    'R31 | Bathroom etched green glass']}), null);
  assert.equal(glassPolishMask({materials: ['FINISH | Silver mirror']}), null);
});

test('the injection clamps roughness per cell and keys the program by mask', () => {
  const material = new THREE.MeshStandardMaterial();
  material.userData.angoraBatch = {grid: 2, materials: ['glass', 'Lift | Photographed rose glass 80 percent', 'R31 | R35 clear door glass']};
  assert.equal(applyGlassCellPolish(material), true);
  assert.equal(applyGlassCellPolish(material), false, 'idempotent');
  const shader = {uniforms: {}, vertexShader: '', fragmentShader: '#include <roughnessmap_fragment>'};
  material.onBeforeCompile(shader, null);
  assert.deepEqual(shader.uniforms.uGlassPolish.value, [1, 0, 1]);
  assert.match(shader.fragmentShader, /roughnessFactor=min\(roughnessFactor,0\.12\)/);
  assert.match(material.customProgramCacheKey(), /\|glass-cells-v1:101/);
});

test('a batch without polish targets is untouched - no uniform, no key suffix', () => {
  const material = new THREE.MeshStandardMaterial();
  material.userData.angoraBatch = {grid: 1, materials: ['STRUCCO']};
  const key = material.customProgramCacheKey();
  assert.equal(applyGlassCellPolish(material), false);
  assert.equal(material.customProgramCacheKey(), key);
});
