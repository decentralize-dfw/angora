import {MeshPhysicalMaterial,MeshStandardMaterial,Vector4} from 'three';

// Restore scalar glTF optical properties lost during material consolidation.
// Lookup happens per vertex using the existing material ID, not another map.
export function restoreBatchSurface(material,source={}){
 const batch=material.userData.angoraBatch;if(!batch)return material;
 const values=batch.materials.map(name=>source[name]??{f0:[.04,.04,.04],coat:0,coatRoughness:.2});
 const coated=values.some(v=>v.coat>0);
 if(coated&&!material.isMeshPhysicalMaterial){
  const replacement=new MeshPhysicalMaterial();
  MeshStandardMaterial.prototype.copy.call(replacement,material);
  replacement.defines={STANDARD:'',PHYSICAL:''};
  material=replacement;material.clearcoat=1;
 }
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=(shader,renderer)=>{
  previous.call(material,shader,renderer);
  shader.uniforms.surfaceOptics={value:values.map(v=>new Vector4(...v.f0,v.coat))};
  shader.uniforms.surfaceCoatRoughness={value:values.map(v=>v.coatRoughness)};
  shader.vertexShader=`uniform vec4 surfaceOptics[${values.length}];
uniform float surfaceCoatRoughness[${values.length}];
varying vec4 opticalResponse;varying float opticalCoatRoughness;
`+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
int opticalIndex=int(clamp(floor(_batchid+.5),0.0,${(values.length-1).toFixed(1)}));
opticalResponse=surfaceOptics[opticalIndex];opticalCoatRoughness=surfaceCoatRoughness[opticalIndex];`);
  shader.fragmentShader='varying vec4 opticalResponse;varying float opticalCoatRoughness;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_fragment>',`#include <lights_physical_fragment>
material.specularColor=mix(opticalResponse.rgb,diffuseColor.rgb,metalnessFactor);
${coated?'material.clearcoat=opticalResponse.a;material.clearcoatRoughness=clamp(opticalCoatRoughness+geometryRoughness,.0525,1.0);':''}`);
 };
 material.customProgramCacheKey=()=>key+'|source-optics-v1|'+JSON.stringify(values);
 return material;
}
