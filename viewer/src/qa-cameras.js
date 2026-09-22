// FAZ 0 · Task 0.2 — twelve deterministic QA cameras.
//
// Every number here is FROZEN. The capture harness compares builds across
// weeks, so a camera that drifts with the code invalidates every diff taken
// through it. Orbit cameras are stored in the flight's own vocabulary
// (target / polar / azimuth / span / zoom / fov) and applied through
// CameraFlight.go(spec, true) - the production path, instantly, no easing.
// Walk cameras are a station id plus a fixed gaze. The daylight state is
// pinned for all twelve: hour 16.5, 21 June, direct sun.
//
// Serialisation: `search(camera, profile)` emits exactly the query string
// share-state.js reads (view/hour/season/light) plus the qa-only parameters
// (camera/profile/stats) that main.js hands to qa-harness.js. Opening the
// URL twice must produce the same pixels twice.
//
// NOTE: selectView('building') maps to 'f3' in the current product - there is
// no uncut whole-villa view. C03/C04 therefore live on the 'neighborhood'
// view (the one view that shows the villa whole) with the camera brought in
// close to the house: front facade from the approach (+Z), pool side from -Z.

export const QA_HOUR = 16.5;
export const QA_SEASON = '172';
export const QA_STYLE = 'sun';

export const VIEWPORTS = {
  desktop: {width: 1600, height: 900},
  mobile: {width: 393, height: 852},
};

// Orbit values were read back from the running viewer (frame()'s own output,
// commit of FAZ 0) and then frozen here as absolute numbers.
// Orbit values C01/C02/C05-C08 are the app's own framing at FAZ 0, read back
// from a live desktop session (1600x900) and frozen. C03/C04 are QA-authored
// villa hero framings; C09 is f1's framing straight down.
export const CAMERAS = [
  {id: 'C01', label: 'region', view: 'region',
   orbit: {target: [16.95, 5.76, 9.92], polar: 0.58, azimuth: 0, span: 407.1, zoom: 1, fov: 16}},
  {id: 'C02', label: 'neighborhood', view: 'neighborhood',
   orbit: {target: [0, 3, -5], polar: 0.78, azimuth: 0.804, span: 73.6, zoom: 1, fov: 16}},
  {id: 'C03', label: 'villa-front', view: 'neighborhood',
   orbit: {target: [0.15, 4.5, -3.0], polar: 1.18, azimuth: 0.85, span: 26, zoom: 1, fov: 16}},
  {id: 'C04', label: 'villa-pool', view: 'neighborhood',
   orbit: {target: [0.6, 3.6, -8.5], polar: 1.18, azimuth: Math.PI - 0.55, span: 30, zoom: 1, fov: 16}},
  {id: 'C05', label: 'floor-f0', view: 'f0',
   orbit: {target: [0.87, 0.00, -5.31], polar: 0.56, azimuth: 0.804, span: 16.9, zoom: 1, fov: 16}},
  {id: 'C06', label: 'floor-f1', view: 'f1',
   orbit: {target: [0.78, 3.10, -1.96], polar: 0.56, azimuth: 0.804, span: 20.7, zoom: 1, fov: 16}},
  {id: 'C07', label: 'floor-f2', view: 'f2',
   orbit: {target: [-1.03, 6.37, -1.96], polar: 0.56, azimuth: 0.804, span: 20.7, zoom: 1, fov: 16}},
  {id: 'C08', label: 'floor-f3', view: 'f3',
   orbit: {target: [-0.75, 9.47, -2.04], polar: 0.56, azimuth: 0.804, span: 18.9, zoom: 1, fov: 16}},
  {id: 'C09', label: 'plan-f1', view: 'f1', plan: true,
   orbit: {target: [0.78, 3.10, -1.96], polar: 0.0001, azimuth: 0, span: 20.7, zoom: 1, fov: 16}},
  {id: 'C10', label: 'interior-salon', view: 'f1',
   walk: {room: 'f1-Z06', yaw: 2.35, pitch: -0.02}},
  {id: 'C11', label: 'interior-master-bedroom', view: 'f2',
   walk: {room: 'f2-102', yaw: -0.08, pitch: -0.02}},
  {id: 'C12', label: 'interior-basement-kitchen', view: 'f0',
   walk: {room: 'f0-B05', yaw: 1.15, pitch: -0.02}},
];

export const cameraById = id => CAMERAS.find(c => c.id === id) ?? null;

// The share-state part of the address plus the qa-only keys. share-state's
// own reader validates view/hour/season/light; camera/profile/stats are read
// only by main.js and qa-harness.js.
export function search(camera, profile = 'desktop', extra = {}) {
  const params = new URLSearchParams();
  params.set('view', camera.view);
  params.set('hour', String(QA_HOUR));
  params.set('season', QA_SEASON);
  params.set('light', QA_STYLE);
  params.set('profile', profile);
  params.set('camera', camera.id);
  params.set('stats', '1');
  for (const [key, value] of Object.entries(extra)) params.set(key, String(value));
  return '?' + params.toString();
}
