// One quality decision for the whole pipeline (Bölüm 2 of the upgrade plan).
//
// FAZ 0 ships this file inert: detectTier() and the matrix exist and are
// unit-tested, but nothing in the render path reads them yet. Task 1.1 is the
// cut-over. The four capabilities stay independent of each other and of the
// URL: batchedGeometry says how meshes are packed, bakedIndirectLighting and
// bakedReceiverVisibility say what light is precomputed, dynamicSunShadow and
// postProcessing say what is spent per frame.

export const TIERS = ['mobile-low', 'mobile-high', 'desktop-balanced', 'desktop-high'];
export const VIEWS = ['region', 'neighborhood', 'villa', 'floor', 'interior', 'plan'];

// Tier detection is pure: the caller hands in the signals, the function only
// ranks them, so the iPhone 13 case is a unit test instead of a hope.
//
// Safari never exposes navigator.deviceMemory, so an UNKNOWN memory reading
// must not read as "low" - under the naive `?? 4` default every iPhone ever
// made lands in mobile-low, and the reference device (iPhone 13: no
// deviceMemory, 6 cores, min screen 390, pointer coarse) is required to land
// in mobile-high. Only an EXPLICIT low signal demotes.
export function detectTier({
  forced = null,          // ?quality= override
  stored = null,          // user preference from localStorage
  coarse = false,         // matchMedia('(pointer: coarse)')
  deviceMemory = undefined,
  hardwareConcurrency = undefined,
  maxSamples = 4,         // gl.getParameter(gl.MAX_SAMPLES)
  maxTextureSize = 8192,  // gl.getParameter(gl.MAX_TEXTURE_SIZE)
} = {}) {
  if (TIERS.includes(forced)) return forced;
  if (TIERS.includes(stored)) return stored;
  const cores = hardwareConcurrency ?? 4;
  if (coarse) {
    const lowMemory = deviceMemory !== undefined && deviceMemory <= 3;
    return (lowMemory || cores <= 4 || maxSamples < 4) ? 'mobile-low' : 'mobile-high';
  }
  // navigator.deviceMemory is spec-capped at 8: a 64 GB workstation reports
  // 8, so 8 is the HIGH end of the scale, not a small machine. Only an
  // explicit 4 or less marks a desktop as memory-constrained.
  const smallMemory = deviceMemory !== undefined && deviceMemory <= 4;
  return (smallMemory || cores <= 4 || maxTextureSize < 8192) ? 'desktop-balanced' : 'desktop-high';
}

// Browser wrapper: gathers the real signals. The only two places the whole
// codebase may consult pointer-coarseness or URL for QUALITY are here.
export function detectTierFromEnvironment({search = '', probe = null} = {}) {
  const forced = new URLSearchParams(search).get('quality');
  let stored = null;
  try { stored = localStorage.getItem('angora-quality'); } catch { /* private mode */ }
  return detectTier({
    forced,
    stored: stored === 'auto' ? null : stored,
    coarse: typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches,
    deviceMemory: typeof navigator !== 'undefined' ? navigator.deviceMemory : undefined,
    hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined,
    maxSamples: probe?.maxSamples ?? 4,
    maxTextureSize: probe?.maxTextureSize ?? 8192,
  });
}

// Starting values from the plan's matrix (Bölüm 2.3). Numbers move only with
// measurements; the ratchet file is the gate.
const TIER_MATRIX = {
  'mobile-low': {
    // pixel budget/ratio deliberately match mobile-high (the legacy phone
    // budget) until a REAL low-end device measurement justifies tightening
    // to the plan's 1.0 M / 1.5 - a change here must not ride flag surgery.
    textureProfile: 'mobile', maxPixelRatio: 2.0, pixelBudget: 1_500_000,
    bakedIndirectLighting: true, bakedReceiverVisibility: true,
    dynamicSunShadow: false, shadowMapSize: 0, shadowCameraMode: 'disabled', shadowType: 'pcfsoft',
    postProcessing: false, gtao: false, gtaoResolutionScale: 0.5,
    antialiasing: 'canvas-msaa', msaaSamples: 0, bloom: false, grade: false, dither: false,
    physicalGlass: 'none', planarPoolReflection: false, anisotropy: 4,
  },
  'mobile-high': {
    textureProfile: 'mobile', maxPixelRatio: 2.0, pixelBudget: 1_500_000,
    bakedIndirectLighting: true, bakedReceiverVisibility: true,
    dynamicSunShadow: true, shadowMapSize: 1024, shadowCameraMode: 'villa-local', shadowType: 'pcfsoft',
    postProcessing: false, gtao: false, gtaoResolutionScale: 0.5,
    antialiasing: 'canvas-msaa', msaaSamples: 0, bloom: false, grade: false, dither: false,
    physicalGlass: 'hero-only', planarPoolReflection: false, anisotropy: 8,
  },
  'desktop-balanced': {
    textureProfile: 'desktop', maxPixelRatio: 2.0, pixelBudget: 3_500_000,
    bakedIndirectLighting: true, bakedReceiverVisibility: true,
    dynamicSunShadow: true, shadowMapSize: 2048, shadowCameraMode: 'villa-local', shadowType: 'pcfsoft',
    postProcessing: true, gtao: true, gtaoResolutionScale: 0.5,
    antialiasing: 'smaa', msaaSamples: 0, bloom: true, grade: true, dither: true,
    physicalGlass: 'hero-only', planarPoolReflection: 0.25, anisotropy: 16,
  },
  'desktop-high': {
    textureProfile: 'desktop', maxPixelRatio: 2.0, pixelBudget: 5_000_000,
    bakedIndirectLighting: true, bakedReceiverVisibility: true,
    dynamicSunShadow: true, shadowMapSize: 2048, shadowCameraMode: 'villa-local', shadowType: 'pcfsoft',
    postProcessing: true, gtao: true, gtaoResolutionScale: 0.65,
    antialiasing: 'smaa', msaaSamples: 0, bloom: true, grade: true, dither: true,
    physicalGlass: 'hero-only', planarPoolReflection: 0.5, anisotropy: 16,
  },
};

// Per-view overrides on top of the tier (Bölüm 2.3). A view never RAISES a
// capability the tier denies; it only narrows where the money is spent.
const VIEW_OVERRIDES = {
  region: {dynamicSunShadow: false, shadowCameraMode: 'disabled', gtao: false, bloom: false},
  neighborhood: {shadowCameraMode: 'wide-proxy', gtao: false, bloom: false,
    desktopOnlyShadow: true},
  villa: {shadowCameraMode: 'villa-local'},
  floor: {shadowCameraMode: 'floor-local'},
  interior: {shadowCameraMode: 'floor-local'},
  plan: {dynamicSunShadow: false, shadowCameraMode: 'disabled', gtao: false, bloom: false},
};

// The interface's storey ids collapse onto the plan's view vocabulary.
export function viewIdFor(selected, {plan = false, walking = false} = {}) {
  if (walking) return 'interior';
  if (plan) return 'plan';
  if (/^f[0-3]$/.test(selected)) return 'floor';
  if (selected === 'building' || selected === 'villa') return 'villa';
  if (selected === 'region') return 'region';
  return 'neighborhood';
}

export function resolveQuality(tier, view = 'villa') {
  const base = TIER_MATRIX[tier];
  if (!base) throw new Error('Unknown quality tier ' + tier);
  const overrides = {...(VIEW_OVERRIDES[view] ?? {})};
  const desktopOnlyShadow = overrides.desktopOnlyShadow;
  delete overrides.desktopOnlyShadow;
  const profile = {tier, view, batchedGeometry: true, ...base, ...overrides};
  // The neighbourhood shadow is a desktop spend only.
  if (desktopOnlyShadow && !tier.startsWith('desktop')) {
    profile.dynamicSunShadow = false;
    profile.shadowCameraMode = 'disabled';
  }
  // A view cannot re-enable what the tier turned off.
  if (!base.dynamicSunShadow) { profile.dynamicSunShadow = false; profile.shadowCameraMode = 'disabled'; }
  if (!base.postProcessing) { profile.postProcessing = false; profile.gtao = false; profile.bloom = false; profile.grade = false; profile.dither = false; }
  if (!base.gtao) profile.gtao = false;
  if (!base.bloom) profile.bloom = false;
  if (!profile.dynamicSunShadow) profile.shadowMapSize = 0;
  return Object.freeze(profile);
}

// The renderer-facing profile: the matrix above, feature-gated back to the
// EXACT pre-surgery behavior wherever a task has not shipped yet. With every
// feature flag off this must reproduce the legacy pipeline bit for bit:
//   shadowMap.enabled = !baked      composer  = !baked && !coarse
//   compact output    = baked && !coarse      probe-at-boot = !baked
//   fixture shadows   = !baked && !coarse     anisotropy    = coarse ? 8 : 16
// where baked meant "model root under /batched/" and coarse meant a mobile
// pointer. Those two reads now live here and nowhere else.
export function effectiveQuality(tier, view, {batched = true, features = {}} = {}) {
  const matrix = resolveQuality(tier, view);
  const mobile = tier.startsWith('mobile');
  const value = {...matrix, batchedGeometry: batched,
    buildProbeAtBoot: !batched, fixtureShadows: false, compactOutput: false};
  if (!features.hybridSunShadow) {
    value.dynamicSunShadow = !batched;
    value.shadowMapSize = value.dynamicSunShadow ? (mobile ? 1024 : 4096) : 0;
    value.shadowCameraMode = 'legacy-frame';
    value.fixtureShadows = !mobile && !batched;
  }
  if (!features.postfxV2) {
    value.postProcessing = !batched && !mobile;
    value.gtao = value.postProcessing;
    value.gtaoResolutionScale = 1;
    value.antialiasing = mobile ? 'canvas-msaa' : value.postProcessing ? 'smaa' : 'fxaa';
    value.bloom = value.postProcessing;
    value.grade = value.postProcessing;
    value.dither = value.postProcessing;
  }
  value.compactOutput = !mobile && !value.postProcessing;
  if (!features.atlasAnisotropyFix) value.anisotropy = mobile ? 8 : 16;
  // Legacy drawing-buffer budget was one number per pointer class, capped at
  // 2x - render-quality.js's own constants. The matrix's tiered budgets
  // (desktop-balanced 3.5 M) only take effect behind their own flag; without
  // this a desktop-balanced machine would silently render at a smaller
  // buffer than the pipeline it must match pixel for pixel.
  if (!features.pixelBudgetV2) {
    value.pixelBudget = mobile ? 1_500_000 : 5_000_000;
    value.maxPixelRatio = 2;
  }
  return Object.freeze(value);
}

export function createQualityProfile({tier, view = 'neighborhood', deliveryPath = '/batched/', features = {}} = {}) {
  // The ONE place delivery packing may be read off the model root, kept for
  // exact legacy equivalence (production always resolves batched).
  const batched = deliveryPath.includes('/batched/');
  const state = {tier, view: VIEWS.includes(view) ? view : viewIdFor(view)};
  let current = effectiveQuality(state.tier, state.view, {batched, features});
  const listeners = new Set();
  const refresh = () => {
    current = effectiveQuality(state.tier, state.view, {batched, features});
    for (const listener of listeners) listener(current);
    return current;
  };
  return {
    get tier() { return current.tier; },
    get view() { return current.view; },
    get value() { return current; },
    applyView(nextView, options) {
      const id = VIEWS.includes(nextView) ? nextView : viewIdFor(nextView, options);
      if (id === state.view) return current;
      state.view = id;
      return refresh();
    },
    setTier(nextTier) { state.tier = nextTier; return refresh(); },
    onChange(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}
