import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {applyBoxProjection, setBoxProbe, BOX_PROBE} from '../src/box-probe.js';

test('box projection finds its anchor in three\'s IBL chunk and patches the shader', () => {
  assert.ok(THREE.ShaderChunk.envmap_physical_pars_fragment.includes('reflectVec = inverseTransformDirection( reflectVec, viewMatrix );'));
  const m = new THREE.MeshStandardMaterial();
  applyBoxProjection(m);
  assert.equal(m.userData.boxProbe, true);
  const shader = {uniforms: {}, vertexShader: THREE.ShaderLib.standard.vertexShader, fragmentShader: THREE.ShaderLib.standard.fragmentShader};
  m.onBeforeCompile(shader);
  assert.match(shader.vertexShader, /vBoxWorld = worldPosition\.xyz/);
  assert.match(shader.fragmentShader, /#define ANGORA_BOX_PROBE/);
  assert.equal(shader.uniforms.uProbeOn, BOX_PROBE.on);
  assert.match(m.customProgramCacheKey(), /boxprobe/);
});

test('box probe switches off without a box', () => {
  setBoxProbe({min: new THREE.Vector3(-1, 0, -1), max: new THREE.Vector3(1, 3, 1), probe: new THREE.Vector3(0, 1.6, 0)});
  assert.equal(BOX_PROBE.on.value, 1);
  setBoxProbe(null);
  assert.equal(BOX_PROBE.on.value, 0);
});
