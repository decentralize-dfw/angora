import {ShaderChunk} from 'three';

// Keep repeating source UVs. Wrapping vertex UVs into an atlas would smear
// triangles crossing a repeat boundary; wrap only the fragment lookup.
export function prepareBatchedMaterial(material,{exterior=false}={}){
 const batch=material.userData.angoraBatch;if(!batch||material.userData.batchPrepared)return;
 material.userData.batchPrepared=true;
 if(batch.light&&material.emissiveMap){
  material.lightMap=material.emissiveMap;material.emissiveMap=null;
  material.lightMapIntensity=batch.light;material.userData.indirectDaylightIntensity=batch.light;
 }
 material.forceSinglePass=true;
 if(material.transparent)material.depthWrite=false;
 const neutralInterior=material.userData.angoraUniformPlaster||batch.materials.every(name=>/^(ceiling|INTERIOR)(\.\d+)?$/i.test(name));
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=(shader,renderer)=>{
  previous.call(material,shader,renderer);
  shader.vertexShader='attribute float _batchid;\nvarying float batchId;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nbatchId=_batchid;');
  // Task 3.3 (runtime half): once the idle pass has rebuilt the atlas as a
  // texture array, each cell is a layer with true wrapping, the full mip
  // chain and the tier's anisotropy - and the UVs stay CONTINUOUS, so the
  // derivatives are honest and the maxLod clamp (the far shimmer) is gone.
  const arrays=material.userData.atlasArrays??null;
  shader.fragmentShader=`varying float batchId;
   vec2 atlasUV(vec2 uv){float id=floor(batchId+0.5);return vec2(mod(id,${batch.grid}.0),floor(id/${batch.grid}.0))/${batch.grid}.0+vec2(${batch.pad})+fract(uv)*${batch.inner};}
   vec4 atlasSample(sampler2D tex,vec2 uv,float width,float maxLod){vec2 dx=dFdx(uv)*width*${batch.inner},dy=dFdy(uv)*width*${batch.inner};float lod=clamp(log2(max(max(length(dx),length(dy)),1.0)),0.0,maxLod);return textureLod(tex,atlasUV(uv),lod);}
   `+shader.fragmentShader;
  if(arrays){
   for(const slot of Object.keys(arrays)){
    shader.uniforms['atlasArray_'+slot]={value:arrays[slot]};
    shader.fragmentShader=`uniform highp sampler2DArray atlasArray_${slot};\n`+shader.fragmentShader;
   }
  }
  for(const chunk of ['map_fragment','normal_fragment_maps','roughnessmap_fragment','metalnessmap_fragment']){
   const code=ShaderChunk[chunk].replace(/texture2D\( (map|normalMap|roughnessMap|metalnessMap), (v\w+Uv) \)/g,(match,map,uv)=>{
    // Task 1.3: a slot bound to a tileable detail map (grid=1 heroes) keeps
    // three's own texture2D - full hardware mip chain and anisotropy - while
    // its siblings stay on the atlas path. maxLod 2-3 was the shimmer.
    if(material.userData.exteriorGradeDetail?.includes(map))return match;
    if(arrays?.[map])return `texture( atlasArray_${map}, vec3( ${uv}, floor(batchId+0.5) ) )`;
    const width=material[map]?.image?.width??512;return `atlasSample( ${map}, ${uv}, ${width.toFixed(1)}, ${Math.log2(Math.max(1,width*batch.pad)).toFixed(1)} )`;});
   shader.fragmentShader=shader.fragmentShader.replace('#include <'+chunk+'>',code);
  }
  if(neutralInterior){
   const maps=ShaderChunk.lights_fragment_maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );',
    'vec3 roomProbe=getIBLIrradiance(geometryNormal);\niblIrradiance+=vec3(dot(roomProbe,vec3(.2126,.7152,.0722)));');
   shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_maps>',maps);
  }
  if(exterior||material.userData.vertexFixtures){
   // Room fixture lights must not illuminate distant context through walls.
   // Remove their loops instead of computing zero attenuation per fragment.
   shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_begin>',ShaderChunk.lights_fragment_begin);
   shader.fragmentShader=shader.fragmentShader.replaceAll('NUM_SPOT_LIGHTS','0').replaceAll('NUM_POINT_LIGHTS','0');
  }
  if(material.transparent){
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
    'float glazingGrazing=pow(1.0-saturate(dot(normal,geometryViewDir)),5.0);\ndiffuseColor.a=mix(diffuseColor.a,max(diffuseColor.a,.75),glazingGrazing);\n#include <opaque_fragment>');
  }
 };
 material.customProgramCacheKey=()=>key+'|atlas-scaled-v6|'+batch.grid+'|'+neutralInterior+'|'+material.transparent+'|'+exterior+'|'+['map','normalMap','roughnessMap','metalnessMap'].map(name=>material[name]?.image?.width??512).join(',')+'|detail:'+(material.userData.exteriorGradeDetail??[]).join('.')+'|array:'+Object.keys(material.userData.atlasArrays??{}).join('.');material.needsUpdate=true;
}
