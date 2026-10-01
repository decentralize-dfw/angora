import {ACESFilmicToneMapping,AgXToneMapping,SRGBColorSpace,PCFSoftShadowMap} from 'three';
import {FEATURES} from './features.js';

// Started from EDETRI's production baseline, and departs from it where the
// departure is the point. Scene lighting remains architectural: a studio's
// lamps/ground are not a site.
//
// Occlusion is the one place this parts company with the reference's switches.
// EDETRI ships GTAO off because screen-space occlusion read as dirt on its
// white cyclorama - a room with no crevices to describe. Its own pipeline notes
// call the absence of occlusion "the single largest tell", the reason an
// image-based light fills every crease and gap with exactly as much light as
// the open ground beside it. A villa is all crevices: eaves, reveals, soffits,
// balconies, stair treads. Here the reason the reference turned it off does not
// hold, and the reason it called it the largest tell does.
//
// The curve is AgX rather than the reference's ACES: ACES skews saturated hues
// (sky drifts cyan, warm sun goes orange-red) and crushes bright stucco into a
// hard shoulder, where AgX rolls highlights off without the hue skew. AgX sits
// darker at the same exposure, so the exposure moves up with it - the pair is
// tuned together, in the GradeShader for the desktop chain and on the renderer
// for the phone/XR path. MSAA 4x under SMAA kills the sub-pixel crawl on
// mullions and railings that SMAA alone leaves behind.
export const referenceProfile=Object.freeze({name:'edetri-production-baseline-agx',
  exposure:1.1,bloomStrength:.1,bloomThreshold:1.6,bloomKnee:.5,bloomClamp:64, // 01.10: eşik .06 -> 1.6 (güneşteki her beyaz söve hâle veriyordu)
  aoEnabled:true,msaaSamples:4,refinement:false,pathTracing:false});

// ADIM 2 (daylightV2): both reference projects the owner is happy with end
// on ACES near exposure 0.75 (three's ACES divides by 0.6, so ~1.25 into the
// curve) - contrast with a real toe, where AgX at 1.1 left the whole frame on
// its flat mid-slope. The key light rises with it (lighting.js), so the scene
// is not simply darker: the sun carries more, the fill carries less.
export const DAYLIGHT_EXPOSURE=0.8;
export const daylightCurve=()=>Boolean(FEATURES.daylightV2);
export const baseExposure=()=>daylightCurve()?DAYLIGHT_EXPOSURE:referenceProfile.exposure;

export function applyRenderProfile(renderer) {
  renderer.toneMapping=daylightCurve()?ACESFilmicToneMapping:AgXToneMapping;
  renderer.toneMappingExposure=baseExposure();
  renderer.outputColorSpace=SRGBColorSpace;
  renderer.transmissionResolutionScale=1;
  renderer.shadowMap.type=PCFSoftShadowMap;
}
