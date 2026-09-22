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
  const smallMemory = deviceMemory !== undefined && deviceMemory <= 8;
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
    textureProfile: 'mobile', maxPixelRatio: 1.5, pixelBudget: 1_000_000,
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

export function createQualityProfile({tier, view = 'neighborhood'} = {}) {
  let current = resolveQuality(tier, view);
  const listeners = new Set();
  return {
    get tier() { return current.tier; },
    get view() { return current.view; },
    get value() { return current; },
    applyView(nextView, options) {
      const id = VIEWS.includes(nextView) ? nextView : viewIdFor(nextView, options);
      if (id === current.view) return current;
      current = resolveQuality(current.tier, id);
      for (const listener of listeners) listener(current);
      return current;
    },
    setTier(nextTier) {
      current = resolveQuality(nextTier, current.view);
      for (const listener of listeners) listener(current);
      return current;
    },
    onChange(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}
