import test from 'node:test';
import assert from 'node:assert/strict';
import {GRADE,GradeShader} from '../src/grade-pass.js';
import {referenceProfile} from '../src/render-profile.js';

test('Grade and vignette happen before the curve, in linear',()=>{
  // Only the body: the uniform declarations list these names in their own
  // order and would otherwise decide the answer.
  const source=GradeShader.fragmentShader.slice(GradeShader.fragmentShader.indexOf('void main'));
  // The order is the whole point. Exposure, then grade, then saturation, then
  // vignette, and only then the curve and the transfer function - the earlier
  // build ran these after its output pass and had to add a second shoulder to
  // stop the result clipping. Ahead of the curve there is still no top.
  const stage=name=>source.indexOf(name);
  assert.ok(stage('uExposure')<stage('uGain'),'exposure before grade');
  assert.ok(stage('uGain')<stage('uSat'),'grade before saturation');
  assert.ok(stage('uSat')<stage('uVig'),'saturation before vignette');
  assert.ok(stage('uVig')<stage('acesToneMap'),'vignette before the curve');
  assert.ok(stage('acesToneMap')<stage('linearToSRGB'),'curve before the transfer');
  // The vignette may only ever multiply down, so it cannot brighten anything.
  assert.match(source,/c\*=1\.0-smoothstep/);
});

test('The grade stays inside the range the reference rigs demonstrate',()=>{
  // saturation 0.94-1.06, gain 0.90-1.05, lift up to 0.014 across its six rigs.
  assert.ok(GRADE.saturation>=0.94&&GRADE.saturation<=1.06,`${GRADE.saturation}`);
  for(const value of GRADE.gain)assert.ok(value>=0.90&&value<=1.05,`gain ${value}`);
  for(const value of GRADE.lift)assert.ok(value>=0&&value<=0.014,`lift ${value}`);
  // Shipped restrained: the reference itself defaults the vignette off, so a
  // tenth of its range is a nudge, not a look.
  assert.ok(GRADE.vignette[1]>0&&GRADE.vignette[1]<=0.2);
  assert.equal(GRADE.grain,0,'grain is a taste call and stays off');
});

test('This pass owns exposure and the curve now that the output pass is gone',()=>{
  assert.equal(GradeShader.uniforms.uExposure.value,referenceProfile.exposure);
  assert.deepEqual(GradeShader.uniforms.uLift.value.toArray(),[...GRADE.lift]);
  assert.deepEqual(GradeShader.uniforms.uGain.value.toArray(),[...GRADE.gain]);
  assert.equal(GradeShader.uniforms.uSat.value,GRADE.saturation);
  assert.deepEqual(GradeShader.uniforms.uVig.value.toArray(),[...GRADE.vignette]);
  // Written out rather than left to the renderer, because the renderer's own
  // ACES setting now only serves the XR path, which bypasses this chain.
  assert.match(GradeShader.fragmentShader,/ACESInputMat/);
  assert.match(GradeShader.fragmentShader,/1\.055\*pow/);
});
