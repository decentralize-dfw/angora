import assert from 'node:assert/strict';
import {test} from 'node:test';
import {DEFAULT_FEATURES, resolveFeatures} from '../src/features.js';
import {effectiveQuality} from '../src/quality-profile.js';

test('?features= flips known flags and ignores strangers and garbage', () => {
  const value = resolveFeatures('?features=hybridSunShadow:1,ktx2Delivery:1,unknown:1,postfxV2:2');
  assert.equal(value.hybridSunShadow, true);
  assert.equal(value.ktx2Delivery, true);
  assert.equal(value.postfxV2, DEFAULT_FEATURES.postfxV2);   // '2' is not a state
  assert.equal('unknown' in value, false);
  assert.deepEqual(resolveFeatures(''), {...DEFAULT_FEATURES});
});

test('singleSided ships on, every unshipped task ships off', () => {
  assert.equal(DEFAULT_FEATURES.singleSided, true);
  for (const flag of ['authoredMaterialsV2', 'progressiveLoaderV2', 'ktx2Delivery', 'contextLodV2', 'cinemaStill']) {
    assert.equal(DEFAULT_FEATURES[flag], false, flag);
  }
});

// ⭐ Task 1.1 acceptance: with the FAZ 1 flags off, the effective profile
// must reproduce the pre-surgery pipeline exactly:
//   shadowMap = !baked · composer = !baked && desktop ·
//   compactOutput = baked && desktop · probe-at-boot = !baked ·
//   fixture shadows = !baked && desktop · anisotropy = mobile?8:16
test('Legacy equivalence: batched production delivery', () => {
  const off = {};
  for (const tier of ['mobile-low', 'mobile-high', 'desktop-balanced', 'desktop-high']) {
    const mobile = tier.startsWith('mobile');
    const q = effectiveQuality(tier, 'villa', {batched: true, features: off});
    assert.equal(q.dynamicSunShadow, false, tier + ' shadow');
    assert.equal(q.postProcessing, false, tier + ' composer');
    assert.equal(q.compactOutput, !mobile, tier + ' compact output');
    assert.equal(q.buildProbeAtBoot, false, tier + ' probe');
    assert.equal(q.fixtureShadows, false, tier + ' fixture shadows');
    assert.equal(q.anisotropy, mobile ? 8 : 16, tier + ' anisotropy');
    assert.equal(q.antialiasing, mobile ? 'canvas-msaa' : 'fxaa', tier + ' aa');
  }
});

test('Legacy equivalence: classic (non-batched) delivery', () => {
  const off = {};
  const desktop = effectiveQuality('desktop-high', 'villa', {batched: false, features: off});
  assert.equal(desktop.dynamicSunShadow, true);
  assert.equal(desktop.shadowMapSize, 4096);
  assert.equal(desktop.postProcessing, true);
  assert.equal(desktop.gtao, true);
  assert.equal(desktop.gtaoResolutionScale, 1);
  assert.equal(desktop.compactOutput, false);
  assert.equal(desktop.buildProbeAtBoot, true);
  assert.equal(desktop.fixtureShadows, true);
  const phone = effectiveQuality('mobile-high', 'villa', {batched: false, features: off});
  assert.equal(phone.dynamicSunShadow, true);       // legacy: shadowMap = !baked, phones included
  assert.equal(phone.shadowMapSize, 1024);
  assert.equal(phone.postProcessing, false);
  assert.equal(phone.compactOutput, false);
  assert.equal(phone.fixtureShadows, false);
});

test('Feature flags hand control to the matrix, mobile red lines hold', () => {
  const on = {hybridSunShadow: true, postfxV2: true, atlasAnisotropyFix: true};
  const desktop = effectiveQuality('desktop-high', 'villa', {batched: true, features: on});
  assert.equal(desktop.dynamicSunShadow, true);
  assert.equal(desktop.shadowMapSize, 2048);
  assert.equal(desktop.postProcessing, true);
  assert.equal(desktop.compactOutput, false);
  const phone = effectiveQuality('mobile-high', 'villa', {batched: true, features: on});
  assert.equal(phone.dynamicSunShadow, true);
  assert.equal(phone.shadowMapSize, 1024);
  assert.equal(phone.postProcessing, false);        // Bölüm 0.6.4: no postfx on mobile, ever
  assert.equal(phone.compactOutput, false);
  const low = effectiveQuality('mobile-low', 'villa', {batched: true, features: on});
  assert.equal(low.dynamicSunShadow, false);
  assert.equal(low.shadowMapSize, 0);
});
