import test from 'node:test';
import assert from 'node:assert/strict';
import {LinearBloomPass,FINITE_RGB} from '../src/linear-bloom.js';
import {referenceProfile} from '../src/render-profile.js';

// The scene renders into a half-float buffer, so a highlight above 65504 is
// stored as Inf. The soft-knee weight divides by the luminance, Inf/Inf is NaN,
// and the separable blur spreads that single sample along a row and then down a
// column. On screen that reached the viewer as a solid axis-aligned dark block
// over the terrain. Every buffer sample in the chain is now made finite first.
const finiteRgb=(c,limit)=>c.map(v=>Math.min(Number.isNaN(v)?0:v,limit));

test('Non-finite samples are dropped before they can be blurred into a block',()=>{
  const pass=new LinearBloomPass();
  const limit=referenceProfile.bloomClamp;
  assert.ok(Number.isFinite(limit)&&limit>0,'clamp must be a finite positive level');
  // Above the range ordinary highlights occupy after exposure, so real glare is
  // untouched, yet low enough that one hot sample cannot saturate the frame.
  assert.ok(limit>=16&&limit<65504);

  assert.equal(pass.extract.uniforms.clampMax.value,limit);
  assert.equal(pass.combine.uniforms.clampMax.value,limit);

  // Both shaders that read a buffer must route the sample through the guard.
  for(const material of [pass.extract,pass.combine])assert.ok(material.fragmentShader.includes(FINITE_RGB));
  assert.ok(pass.extract.fragmentShader.includes('finiteRgb(texture2D(source,vUv).rgb,clampMax)'));
  assert.ok(pass.combine.fragmentShader.includes('finiteRgb(texture2D(glare,vUv).rgb,clampMax)'));
  assert.ok(pass.combine.fragmentShader.includes('finiteRgb(c.rgb,clampMax)'));
  // The raw, unguarded reads that produced the block must not come back.
  assert.ok(!pass.extract.fragmentShader.includes('c=texture2D(source,vUv).rgb'));

  // Intent of the GLSL helper: NaN collapses to zero, Inf lands on the clamp,
  // and an ordinary highlight passes through unchanged.
  assert.deepEqual(finiteRgb([NaN,NaN,NaN],limit),[0,0,0]);
  assert.deepEqual(finiteRgb([Infinity,Infinity,Infinity],limit),[limit,limit,limit]);
  assert.deepEqual(finiteRgb([0,.5,12],limit),[0,.5,12]);
  pass.dispose();
});
