// FAZ 1 feature flags (upgrade plan, Bölüm 4). Every render-path change of
// the quality upgrade sits behind one of these; with a flag OFF the pipeline
// must behave byte-for-byte as it did before the change landed. The address
// bar can flip any flag for A/B: ?features=hybridSunShadow:0,ktx2Delivery:1.
//
// Flags flip to true only in the task that ships their behavior, after the
// task's own measurement - never in bulk.
export const DEFAULT_FEATURES = Object.freeze({
  hybridSunShadow: false,      // Task 1.2 - villa-local dynamic sun shadow
  exteriorGradeRevival: false, // Task 1.3 - detail maps on batched materials
  singleSided: true,           // Task 1.4 - honor patched GLBs; 0 forces DoubleSide back
  viewCulling: false,          // Task 1.4 - walk hides the neighbourhood planting
  plantsChunking: false,       // Task 1.4 - split context-plants into 48 m culling cells
  cameraRigsV2: false,         // Task 1.5 - per-view FOV / golden hour
  gardenSpotStrip: false,      // Task 1.6 - strip fixture loops from garden shaders
  atlasAnisotropyFix: false,   // Task 1.6 - anisotropy only where texture2D samples
  postfxV2: false,             // Task 1.1b - composer per quality matrix
  pixelBudgetV2: false,        // matrix pixel budgets; off = legacy mobile 1.5M / desktop 5M, cap 2
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
