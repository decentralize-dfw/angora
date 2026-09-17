import test from 'node:test';
import assert from 'node:assert/strict';
import {LinearBloomPass,FINITE_RGB} from '../src/linear-bloom.js';
import {referenceProfile} from '../src/render-profile.js';

const finiteRgb=(c,limit)=>c.map(v=>Math.min(Number.isNaN(v)?0:v,limit));

test('Non-finite samples are dropped before they can be blurred into a block',()=>{
  const pass=new LinearBloomPass();
  const limit=referenceProfile.bloomClamp;
  assert.ok(Number.isFinite(limit)&&limit>0,'clamp must be a finite positive level');
  assert.ok(limit>=16&&limit<65504);

  assert.equal(pass.extract.uniforms.clampMax.value,limit);
  assert.equal(pass.combine.uniforms.clampMax.value,limit);

  for(const material of [pass.extract,pass.combine])assert.ok(material.fragmentShader.includes(FINITE_RGB));
  assert.ok(pass.extract.fragmentShader.includes('finiteRgb(texture2D(source,vUv).rgb,clampMax)'));
  assert.ok(pass.combine.fragmentShader.includes('finiteRgb(texture2D(glare,vUv).rgb,clampMax)'));
  assert.ok(pass.combine.fragmentShader.includes('finiteRgb(c.rgb,clampMax)'));
  assert.ok(!pass.extract.fragmentShader.includes('c=texture2D(source,vUv).rgb'));

  assert.deepEqual(finiteRgb([NaN,NaN,NaN],limit),[0,0,0]);
  assert.deepEqual(finiteRgb([Infinity,Infinity,Infinity],limit),[limit,limit,limit]);
  assert.deepEqual(finiteRgb([0,.5,12],limit),[0,.5,12]);
  pass.dispose();
});
