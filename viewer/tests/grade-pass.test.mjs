import test from 'node:test';
import assert from 'node:assert/strict';
import {GRADE,GradeShader} from '../src/grade-pass.js';
import {referenceProfile} from '../src/render-profile.js';

test('Grade and vignette happen before the curve, in linear',()=>{
  const source=GradeShader.fragmentShader.slice(GradeShader.fragmentShader.indexOf('void main'));
  const stage=name=>source.indexOf(name);
  assert.ok(stage('uExposure')<stage('uGain'),'exposure before grade');
  assert.ok(stage('uGain')<stage('uSat'),'grade before saturation');
  assert.ok(stage('uSat')<stage('uVig'),'saturation before vignette');
  assert.ok(stage('uVig')<stage('agxToneMap'),'vignette before the curve');
  assert.ok(stage('agxToneMap')<stage('linearToSRGB'),'curve before the transfer');
  assert.match(source,/c\*=1\.0-smoothstep/);
});

test('The grade stays inside the range the reference rigs demonstrate',()=>{
  assert.ok(GRADE.saturation>=0.94&&GRADE.saturation<=1.10,`${GRADE.saturation}`);
  for(const value of GRADE.gain)assert.ok(value>=0.90&&value<=1.05,`gain ${value}`);
  for(const value of GRADE.lift)assert.ok(value>=0&&value<=0.014,`lift ${value}`);
  assert.ok(GRADE.vignette[1]>0&&GRADE.vignette[1]<=0.2);
  assert.equal(GRADE.grain,0,'grain is a taste call and stays off');
});

test('This pass owns exposure and the curve now that the output pass is gone',()=>{
  assert.equal(GradeShader.uniforms.uExposure.value,referenceProfile.exposure);
  assert.deepEqual(GradeShader.uniforms.uLift.value.toArray(),[...GRADE.lift]);
  assert.deepEqual(GradeShader.uniforms.uGain.value.toArray(),[...GRADE.gain]);
  assert.equal(GradeShader.uniforms.uSat.value,GRADE.saturation);
  assert.deepEqual(GradeShader.uniforms.uVig.value.toArray(),[...GRADE.vignette]);
  assert.match(GradeShader.fragmentShader,/AgXInsetMatrix/);
  assert.match(GradeShader.fragmentShader,/1\.055\*pow/);
});
