// FAZ 1 feature flags (upgrade plan, Bölüm 4). Every render-path change of
// the quality upgrade sits behind one of these; with a flag OFF the pipeline
// must behave byte-for-byte as it did before the change landed. The address
// bar can flip any flag for A/B: ?features=hybridSunShadow:0,ktx2Delivery:1.
//
// Flags flip to true only in the task that ships their behavior, after the
// task's own measurement - never in bulk.
export const DEFAULT_FEATURES = Object.freeze({
  hybridSunShadow: true,       // Task 1.2 ACTIVE - villa-local dynamic sun (desktop; phones wait on H1)
  mobileSunShadow: false,      // Task 1.2 - phones join ONLY after H1 measures the ratchet green
  exteriorGradeRevival: true,  // Task 1.3 ACTIVE - tileable detail maps on the grid=1 heroes, idle-loaded
  // Task 1.4 is SHELVED (BLOCKED H8): the shell walls are two skins, the
  // context additions are mirrored copies whose winding build.mjs never
  // corrects, and the honest fix needs a Draco re-encode this environment
  // must not do. The delivery ships authored double-sided; the valve stays
  // inert until H8 reopens the task.
  singleSided: true,           // inert - no patched GLBs ship; 0 still forces DoubleSide back
  viewCulling: false,          // hiding planting seen through walk glazing is a quality call, deferred
  plantsChunking: true,        // pure culling win: shared attributes, off-screen cells only
  cameraRigsV2: true,          // Task 1.5 ACTIVE - per-view lenses, 16:30 sun opening, horizon fog
  gardenSpotStrip: true,       // Task 1.6 ACTIVE - strip fixture loops from garden shaders
  atlasAnisotropyFix: true,    // Task 1.6 ACTIVE - anisotropy only where texture2D samples
  postfxV2: true,              // Task 1.1b ACTIVE - composer per matrix, desktop tiers only
  pixelBudgetV2: false,        // matrix pixel budgets; off = legacy mobile 1.5M / desktop 5M, cap 2
  probeMassing: true,          // Task 3.4f ACTIVE - context mass in the PMREM probe, one-time rebuild
  poolWaterV2: true,           // Task 3.5 ACTIVE - analytic wave pool: fresnel + probe reflection + absorption
  glassTiersV2: true,          // Task 3.5 ACTIVE - exterior glazing polished to reflect the probe silhouette
  authoredMaterialsV2: false,  // Faz 3
  progressiveLoaderV2: false,  // Faz 2
  ktx2Delivery: false,         // Faz 4.1
  contextLodV2: false,         // Faz 2
  cinemaStill: false,          // Faz 5
});

// '?features=a:0,b:1' - unknown names are ignored so a stale link cannot
// invent a switch; values are strictly 0/1.
export function resolveFeatures(search = '', defaults = DEFAULT_FEATURES) {
  const value = {...defaults};
  const raw = new URLSearchParams(search).get('features');
  if (!raw) return Object.freeze(value);
  for (const entry of raw.split(',')) {
    const [name, state] = entry.split(':');
    if (name in value && (state === '0' || state === '1')) value[name] = state === '1';
  }
  return Object.freeze(value);
}

export const FEATURES = resolveFeatures(typeof location === 'undefined' ? '' : location.search);
