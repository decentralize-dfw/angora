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
  // Task 2.1 shipped progressiveLoaderV2; the still-unshipped set keeps
  // shrinking. cinemaStill went back OFF: its idle accumulation starts from
  // black and restarts on every input, which the owner saw as the viewport
  // dropping to black whenever they stopped moving. It ships again once the
  // refinement starts from the resolved frame instead of from zero.
  assert.equal(DEFAULT_FEATURES.progressiveLoaderV2, true);
  assert.equal(DEFAULT_FEATURES.cinemaStill, true);   // KAPANIŞ İŞ 3: seed'li birikimle geri açıldı
  for (const flag of ['authoredMaterialsV2', 'ktx2Delivery', 'contextLodV2']) {
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

// P1: the legacy drawing buffer was one budget per pointer class (mobile
// 1.5 M / desktop 5 M, ratio cap 2). The matrix's tiered budgets - notably
// desktop-balanced's 3.5 M - must stay behind pixelBudgetV2, or flag surgery
// alone would shrink a desktop-balanced machine's buffer.
test('Pixel budget stays legacy until pixelBudgetV2 ships', () => {
  const off = {};
  for (const tier of ['desktop-balanced', 'desktop-high']) {
    const q = effectiveQuality(tier, 'villa', {batched: true, features: off});
    assert.equal(q.pixelBudget, 5_000_000, tier);
    assert.equal(q.maxPixelRatio, 2, tier);
  }
  for (const tier of ['mobile-low', 'mobile-high']) {
    const q = effectiveQuality(tier, 'villa', {batched: true, features: off});
    assert.equal(q.pixelBudget, 1_500_000, tier);
    assert.equal(q.maxPixelRatio, 2, tier);
  }
  const tiered = effectiveQuality('desktop-balanced', 'villa', {batched: true, features: {pixelBudgetV2: true}});
  assert.equal(tiered.pixelBudget, 3_500_000);
});

test('Feature flags hand control to the matrix, mobile red lines hold', () => {
  const on = {hybridSunShadow: true, postfxV2: true, atlasAnisotropyFix: true};
  const desktop = effectiveQuality('desktop-high', 'villa', {batched: true, features: on});
  assert.equal(desktop.dynamicSunShadow, true);
  assert.equal(desktop.shadowMapSize, 4096);   // MALZEME İŞ 1: mahalle gölgesi
  assert.equal(desktop.postProcessing, true);
  assert.equal(desktop.compactOutput, false);
  // Task 1.2 / Bölüm 0.6.2: a phone joins the shadow only after the H1
  // device measurement flips mobileSunShadow - the matrix alone is not
  // permission to spend an iPhone's frame budget.
  const phone = effectiveQuality('mobile-high', 'villa', {batched: true, features: on});
  assert.equal(phone.dynamicSunShadow, false);
  assert.equal(phone.shadowMapSize, 0);
  assert.equal(phone.postProcessing, false);        // Bölüm 0.6.4: no postfx on mobile, ever
  assert.equal(phone.compactOutput, false);
  const measuredPhone = effectiveQuality('mobile-high', 'villa',
    {batched: true, features: {...on, mobileSunShadow: true}});
  assert.equal(measuredPhone.dynamicSunShadow, true);
  assert.equal(measuredPhone.shadowMapSize, 512);   // KAPANIŞ İŞ 2.4
  assert.equal(measuredPhone.postProcessing, false);
  const low = effectiveQuality('mobile-low', 'villa', {batched: true, features: on});
  assert.equal(low.dynamicSunShadow, false);
  assert.equal(low.shadowMapSize, 0);
});
