import test from 'node:test';
import assert from 'node:assert/strict';
import {effectiveQuality} from '../src/quality-profile.js';
import {GradeShader} from '../src/grade-pass.js';
import {DisplayDitherShader} from '../src/display-dither.js';

// Task 1.1b - postfxV2. The composer is a desktop spend; a phone must never
// see it, and the chain must tone-map EXACTLY once (the grade pass owns the
// curve; r180 skips the canvas tone map whenever a pass renders to a target,
// and the grade/dither shaders carry no tonemapping chunk of their own).

const ON = {hybridSunShadow: true, postfxV2: true};

test('postfxV2 lights the composer on both desktop tiers, per the matrix', () => {
  for (const tier of ['desktop-balanced', 'desktop-high']) {
    const q = effectiveQuality(tier, 'villa', {batched: true, features: ON});
    assert.equal(q.postProcessing, true, tier);
    assert.equal(q.gtao, true, tier);
    assert.equal(q.bloom, true, tier);
    assert.equal(q.grade, true, tier);
    assert.equal(q.dither, true, tier);
    assert.equal(q.antialiasing, 'smaa', tier);
    assert.equal(q.compactOutput, false, tier);
  }
});

test('a phone never sees a composer pass, whatever the flags say', () => {
  for (const tier of ['mobile-low', 'mobile-high']) {
    for (const features of [ON, {...ON, mobileSunShadow: true}]) {
      const q = effectiveQuality(tier, 'villa', {batched: true, features});
      assert.equal(q.postProcessing, false, tier);
      assert.equal(q.gtao, false, tier);
      assert.equal(q.bloom, false, tier);
      assert.equal(q.grade, false, tier);
      assert.equal(q.dither, false, tier);
    }
  }
});

test('the view rows rest gtao/bloom where the matrix spends them', () => {
  const region = effectiveQuality('desktop-high', 'region', {batched: true, features: ON});
  assert.equal(region.gtao, false);
  assert.equal(region.bloom, false);
  const neighborhood = effectiveQuality('desktop-high', 'neighborhood', {batched: true, features: ON});
  assert.equal(neighborhood.gtao, false);
  assert.equal(neighborhood.bloom, false);
  const villa = effectiveQuality('desktop-high', 'villa', {batched: true, features: ON});
  assert.equal(villa.gtao, true);
  assert.equal(villa.bloom, true);
});

test('the chain tone-maps exactly once: grade owns the curve, dither stays linear-through', () => {
  // Neither post shader includes three's canvas tone-map chunk; the grade
  // fragment applies its own AgX once and converts to sRGB once.
  assert.ok(!GradeShader.fragmentShader.includes('tonemapping_fragment'));
  assert.ok(!DisplayDitherShader.fragmentShader.includes('tonemapping_fragment'));
  const body = GradeShader.fragmentShader.slice(GradeShader.fragmentShader.indexOf('void main'));
  assert.equal(body.split('agxToneMap(').length - 1, 1, 'one curve application');
  assert.equal(body.split('linearToSRGB(').length - 1, 1, 'one transfer');
  assert.ok(!DisplayDitherShader.fragmentShader.includes('agxToneMap'));
});

test('flag off keeps the legacy batched-desktop behavior: no composer, compact output', () => {
  const q = effectiveQuality('desktop-high', 'villa', {batched: true, features: {hybridSunShadow: true}});
  assert.equal(q.postProcessing, false);
  assert.equal(q.compactOutput, true);
});
