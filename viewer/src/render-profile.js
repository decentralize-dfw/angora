import {ACESFilmicToneMapping,SRGBColorSpace,PCFSoftShadowMap} from 'three';

// Active production baseline read from EDETRI, not its opt-in experiments.
// Scene lighting remains architectural: a studio's lamps/ground are not a site.
export const referenceProfile=Object.freeze({name:'edetri-production-baseline',
  exposure:.75,bloomStrength:.1,bloomThreshold:.06,bloomKnee:.036,bloomClamp:64,
  aoEnabled:false,msaaSamples:0,refinement:false,pathTracing:false});

export function applyRenderProfile(renderer) {
  renderer.toneMapping=ACESFilmicToneMapping;
  renderer.toneMappingExposure=referenceProfile.exposure;
  renderer.outputColorSpace=SRGBColorSpace;
  renderer.transmissionResolutionScale=1;
  renderer.shadowMap.type=PCFSoftShadowMap;
}
