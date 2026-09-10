import {ACESFilmicToneMapping,SRGBColorSpace,PCFSoftShadowMap} from 'three';

// Active production baseline read from EDETRI, not its opt-in experiments.
// Scene lighting remains architectural: a studio's lamps/ground are not a site.
//
// Occlusion is the one place this parts company with the reference's switches.
// EDETRI ships GTAO off because screen-space occlusion read as dirt on its
// white cyclorama - a room with no crevices to describe. Its own pipeline notes
// call the absence of occlusion "the single largest tell", the reason an
// image-based light fills every crease and gap with exactly as much light as
// the open ground beside it. A villa is all crevices: eaves, reveals, soffits,
// balconies, stair treads. Here the reason the reference turned it off does not
// hold, and the reason it called it the largest tell does.
export const referenceProfile=Object.freeze({name:'edetri-production-baseline',
  exposure:.75,bloomStrength:.1,bloomThreshold:.06,bloomKnee:.036,bloomClamp:64,
  aoEnabled:true,msaaSamples:0,refinement:false,pathTracing:false});

export function applyRenderProfile(renderer) {
  renderer.toneMapping=ACESFilmicToneMapping;
  renderer.toneMappingExposure=referenceProfile.exposure;
  renderer.outputColorSpace=SRGBColorSpace;
  renderer.transmissionResolutionScale=1;
  renderer.shadowMap.type=PCFSoftShadowMap;
}
