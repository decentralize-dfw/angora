import assert from 'node:assert/strict';
import {test} from 'node:test';
import {detectTier, resolveQuality, createQualityProfile, viewIdFor, TIERS} from '../src/quality-profile.js';

// ⭐ The reference device (Bölüm 0.6.2). Safari exposes no deviceMemory, so
// the naive `?? 4` default would demote every iPhone to mobile-low; the plan
// requires iPhone 13 in mobile-high, and this test is the gate.
test('iPhone 13 / Safari profile lands in mobile-high', () => {
  assert.equal(detectTier({
    coarse: true,
    deviceMemory: undefined,     // Safari never reports it
    hardwareConcurrency: 6,
    maxSamples: 4,
  }), 'mobile-high');
});

test('Explicitly weak phones land in mobile-low', () => {
  assert.equal(detectTier({coarse: true, deviceMemory: 2, hardwareConcurrency: 8}), 'mobile-low');
  assert.equal(detectTier({coarse: true, hardwareConcurrency: 4}), 'mobile-low');
  assert.equal(detectTier({coarse: true, hardwareConcurrency: 8, maxSamples: 0}), 'mobile-low');
});

test('Desktop splits on memory, cores and texture size', () => {
  assert.equal(detectTier({coarse: false, deviceMemory: 4, hardwareConcurrency: 12}), 'desktop-balanced');
  assert.equal(detectTier({coarse: false, hardwareConcurrency: 4}), 'desktop-balanced');
  assert.equal(detectTier({coarse: false, hardwareConcurrency: 12, maxTextureSize: 4096}), 'desktop-balanced');
  // Unknown memory on a desktop is not a downgrade signal either.
  assert.equal(detectTier({coarse: false, hardwareConcurrency: 12}), 'desktop-high');
});

// navigator.deviceMemory is capped at 8 by specification: every healthy
// Chrome desktop - a 64 GB workstation included - reports exactly 8. Reading
// 8 as "small" made desktop-high unreachable anywhere Chrome runs.
test('A 64 GB machine reports deviceMemory 8 and still reaches desktop-high', () => {
  assert.equal(detectTier({coarse: false, deviceMemory: 8, hardwareConcurrency: 24}), 'desktop-high');
  assert.equal(detectTier({coarse: false, deviceMemory: 8, hardwareConcurrency: 12, maxSamples: 4}), 'desktop-high');
});

test('Forced and stored tiers win, garbage is ignored', () => {
  assert.equal(detectTier({forced: 'mobile-low', coarse: false, hardwareConcurrency: 16}), 'mobile-low');
  assert.equal(detectTier({stored: 'desktop-high', coarse: true, hardwareConcurrency: 2}), 'desktop-high');
  assert.equal(detectTier({forced: 'ultra-mega', coarse: true, hardwareConcurrency: 6}), 'mobile-high');
});

test('Every tier resolves for every view, and a view never raises a denied capability', () => {
  for (const tier of TIERS) {
    for (const view of ['region', 'neighborhood', 'villa', 'floor', 'interior', 'plan']) {
      const profile = resolveQuality(tier, view);
      assert.equal(profile.tier, tier);
      assert.equal(profile.view, view);
      if (tier.startsWith('mobile')) {
        // Bölüm 0.6.4 red lines: no postfx chain on either mobile tier.
        assert.equal(profile.postProcessing, false, tier + '/' + view);
        assert.equal(profile.gtao, false);
        assert.equal(profile.bloom, false);
      }
      if (!profile.dynamicSunShadow) assert.equal(profile.shadowMapSize, 0);
    }
  }
});

test('mobile-low never gains a sun shadow from any view', () => {
  for (const view of ['villa', 'floor', 'interior']) {
    assert.equal(resolveQuality('mobile-low', view).dynamicSunShadow, false);
  }
});

test('Region and plan turn dynamic shadow and postfx extras off everywhere', () => {
  for (const tier of TIERS) {
    for (const view of ['region', 'plan']) {
      const profile = resolveQuality(tier, view);
      assert.equal(profile.dynamicSunShadow, false);
      assert.equal(profile.gtao, false);
      assert.equal(profile.bloom, false);
    }
  }
});

test('Neighbourhood shadow is a desktop-only spend', () => {
  assert.equal(resolveQuality('desktop-high', 'neighborhood').dynamicSunShadow, true);
  assert.equal(resolveQuality('mobile-high', 'neighborhood').dynamicSunShadow, false);
});

test('createQualityProfile follows view changes and notifies once per change', () => {
  const quality = createQualityProfile({tier: 'desktop-high', view: 'neighborhood'});
  let notified = 0;
  quality.onChange(() => notified++);
  quality.applyView('f2', {});
  assert.equal(quality.view, 'floor');
  assert.equal(notified, 1);
  quality.applyView('f1', {});          // still 'floor' - no change, no event
  assert.equal(notified, 1);
  quality.applyView('f1', {walking: true});
  assert.equal(quality.view, 'interior');
  assert.equal(notified, 2);
});

test('viewIdFor maps the interface vocabulary onto the plan vocabulary', () => {
  assert.equal(viewIdFor('region'), 'region');
  assert.equal(viewIdFor('neighborhood'), 'neighborhood');
  assert.equal(viewIdFor('f0'), 'floor');
  assert.equal(viewIdFor('f2', {plan: true}), 'plan');
  assert.equal(viewIdFor('f2', {walking: true}), 'interior');
  assert.equal(viewIdFor('building'), 'villa');
});

// FAZ 6 İŞ F (EK Bölüm 2): exteriorGtao lifts the neighbourhood view's GTAO
// narrowing — and ONLY that. Region keeps it off, mobile keeps everything
// off, and the resolution scale stays the tier's own number.
test('İŞ F: exteriorGtao opens GTAO on neighborhood, desktop tiers only', async () => {
  const {effectiveQuality} = await import('../src/quality-profile.js');
  const on = {postfxV2: true, exteriorGtao: true, hybridSunShadow: true};
  const off = {postfxV2: true, hybridSunShadow: true};
  for (const tier of ['desktop-balanced', 'desktop-high']) {
    assert.equal(effectiveQuality(tier, 'neighborhood', {features: off}).gtao, false,
      tier + ' flag off = today');
    const q = effectiveQuality(tier, 'neighborhood', {features: on});
    assert.equal(q.gtao, true, tier + ' flag on');
    assert.equal(q.gtaoResolutionScale, resolveQuality(tier, 'villa').gtaoResolutionScale,
      tier + ' resolution scale untouched');
  }
  assert.equal(effectiveQuality('desktop-high', 'region', {features: on}).gtao, false,
    'region NEVER');
  for (const tier of ['mobile-high', 'mobile-low']) {
    const q = effectiveQuality(tier, 'neighborhood', {features: on});
    assert.equal(q.gtao, false, tier + ' untouched');
    assert.equal(q.postProcessing, false, tier + ' still no postfx');
  }
});
