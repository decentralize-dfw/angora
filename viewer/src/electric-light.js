import {SRGBColorSpace} from 'three';

// The offline map contains direct and bounced fixture light, added after the
// ambient-occlusion term. Reapplying AO would darken already occluded light.
export function createElectricLighting(entries){
 const enabled={value:1},seen=new WeakSet();
 for(const entry of entries){entry.texture.colorSpace=SRGBColorSpace;entry.texture.flipY=false;}
 return {
  textures:entries.map(entry=>entry.texture),
  setEnabled(value){enabled.value=value?1:0;},
  apply(material){
   const batch=material.userData.angoraBatch;
   if(!batch?.light||seen.has(material))return;
   const entry=entries.find(e=>batch.materials.every(n=>e.materials.includes(n)));
   if(!entry)return;seen.add(material);material.userData.hasElectricBake=true;
   const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
   material.onBeforeCompile=(shader,renderer)=>{
    previous.call(material,shader,renderer);
    Object.assign(shader.uniforms,{electricBake:{value:entry.texture},electricIntensity:{value:entry.intensity},electricEnabled:enabled});
    shader.fragmentShader='uniform sampler2D electricBake;uniform float electricIntensity,electricEnabled;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <aomap_fragment>',`#include <aomap_fragment>
reflectedLight.indirectDiffuse+=material.diffuseColor*RECIPROCAL_PI*texture2D(electricBake,vLightMapUv).rgb*electricIntensity*electricEnabled;`);
   };
   material.customProgramCacheKey=()=>key+'|fixture-bounce-v1';
  }
 };
}
