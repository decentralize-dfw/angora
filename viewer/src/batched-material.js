import {ShaderChunk} from 'three';

// Keep repeating source UVs. Wrapping vertex UVs into an atlas would smear
// triangles crossing a repeat boundary; wrap only the fragment lookup.
export function prepareBatchedMaterial(material){
 const batch=material.userData.angoraBatch;if(!batch)return;
 if(batch.light&&material.emissiveMap){
  material.lightMap=material.emissiveMap;material.emissiveMap=null;
  material.lightMapIntensity=batch.light;material.userData.indirectDaylightIntensity=batch.light;
 }
 material.forceSinglePass=true;
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=(shader,renderer)=>{
  previous.call(material,shader,renderer);
  shader.vertexShader='attribute float _batchid;\nvarying float batchId;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nbatchId=_batchid;');
  shader.fragmentShader=`varying float batchId;
   vec2 atlasUV(vec2 uv){float id=floor(batchId+0.5);return vec2(mod(id,${batch.grid}.0),floor(id/${batch.grid}.0))/${batch.grid}.0+vec2(${batch.pad})+fract(uv)*${batch.inner};}
   vec4 atlasSample(sampler2D tex,vec2 uv){vec2 dx=dFdx(uv)*512.0*${batch.inner},dy=dFdy(uv)*512.0*${batch.inner};float lod=clamp(log2(max(max(length(dx),length(dy)),1.0)),0.0,2.0);return textureLod(tex,atlasUV(uv),lod);}
   `+shader.fragmentShader;
  for(const chunk of ['map_fragment','normal_fragment_maps','roughnessmap_fragment','metalnessmap_fragment']){
   const code=ShaderChunk[chunk].replace(/texture2D\( (map|normalMap|roughnessMap|metalnessMap), (v\w+Uv) \)/g,'atlasSample( $1, $2 )');
   shader.fragmentShader=shader.fragmentShader.replace('#include <'+chunk+'>',code);
  }
 };
 material.customProgramCacheKey=()=>key+'|atlas512-v2|'+batch.grid;material.needsUpdate=true;
}
