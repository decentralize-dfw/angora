// Task 1.5 — the lens follows the subject (upgrade plan, Bölüm 4).
//
// One 16° telephoto for every view is the single biggest "cardboard model"
// tell: an aerial orthographic-feeling compression that no photographer
// would choose for a house. Each view now names its own lens. The numbers
// start from the plan's table and stand until a measurement moves them;
// plan mode stays orthographic and the walk keeps its own 46-82° dynamic
// lens (walk.js), so neither appears here.
export const VIEW_CAMERA = Object.freeze({
  region: Object.freeze({fov: 20}),
  neighborhood: Object.freeze({fov: 26}),
  // The storey cut is read like a drawing: mild perspective, not street view.
  floor: Object.freeze({fov: 28}),
});

export const LEGACY_FOV = 16;

// The interface's ids collapse to a rig: f0..f3 are floor, everything else
// falls back to the legacy lens so an unknown view can never change look.
export function rigFovFor(selected, {enabled = true} = {}) {
  if (!enabled) return LEGACY_FOV;
  if (/^f[0-3]$/.test(selected)) return VIEW_CAMERA.floor.fov;
  return VIEW_CAMERA[selected]?.fov ?? LEGACY_FOV;
}
