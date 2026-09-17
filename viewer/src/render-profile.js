import {AgXToneMapping,SRGBColorSpace,PCFSoftShadowMap} from 'three';

export const referenceProfile=Object.freeze({name:'edetri-production-baseline-agx',
  exposure:1.1,bloomStrength:.1,bloomThreshold:.06,bloomKnee:.036,bloomClamp:64,
  aoEnabled:true,msaaSamples:4,refinement:false,pathTracing:false});

export function applyRenderProfile(renderer) {
  renderer.toneMapping=AgXToneMapping;
  renderer.toneMappingExposure=referenceProfile.exposure;
  renderer.outputColorSpace=SRGBColorSpace;
  renderer.transmissionResolutionScale=1;
  renderer.shadowMap.type=PCFSoftShadowMap;
}
