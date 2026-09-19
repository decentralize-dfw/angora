import {ShaderChunk} from 'three';

// The bake contains bounced daylight only; it does not replace the first
// diffuse environment term. The outdoor probe's artificial grass hemisphere
// is inappropriate for interior plaster. Use a neutral indoor diffuse probe
// at the same luminance, retaining directional response, the bake and specular.
export function prepareBakedLighting(material){
 if(!material.lightMap||! /^(ceiling|INTERIOR)$/.test(material.name)||material.userData.bakedDiffusePrepared)return;
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 const maps=ShaderChunk.lights_fragment_maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );',
  'vec3 interiorProbe = getIBLIrradiance( geometryNormal );\niblIrradiance += vec3(dot(interiorProbe, vec3(0.2126, 0.7152, 0.0722)));');
 material.onBeforeCompile=(shader,renderer)=>{
  previous.call(material,shader,renderer);
  shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_maps>',maps);
 };
 material.customProgramCacheKey=()=>key+'|neutral-interior-diffuse-probe';
 material.userData.bakedDiffusePrepared=true;material.needsUpdate=true;
}
