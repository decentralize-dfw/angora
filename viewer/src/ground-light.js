import {ShaderChunk,Vector3,Vector4,NoColorSpace} from 'three';

// Offline visibility on outdoor receivers. One filtered texture lookup in
// their existing beauty draw; no shadow scene, render target or extra pass.
export function createGroundLight(texture,descriptor){
 texture.colorSpace=NoColorSpace;
 const bounds={value:new Vector4(...descriptor.boundsXZ)},strength={value:1};
 const direction=new Vector3(...descriptor.sunDirection).normalize(),seen=new WeakSet();
 const floors=descriptor.floorDatums;
 return {
  setSun(sun){const alignment=direction.dot(sun);strength.value=Math.max(0,Math.min(1,(alignment-.985)/.014));},
  apply(material){
   if(seen.has(material))return;seen.add(material);
   const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
   material.onBeforeCompile=(shader,renderer)=>{
    previous.call(material,shader,renderer);
    Object.assign(shader.uniforms,{groundLight:{value:texture},groundBounds:bounds,groundSunStrength:strength});
    shader.vertexShader='varying vec3 bakedReceiver;\nuniform vec4 groundBounds;\n'+shader.vertexShader;
    const coordinates=`
     vec3 groundWorldPosition=(modelMatrix*vec4(transformed,1.0)).xyz;
     vec2 groundUV=(groundWorldPosition.xz-groundBounds.xy)/(groundBounds.zw-groundBounds.xy);
     vec2 groundBorder=min(groundUV,1.0-groundUV)*(groundBounds.zw-groundBounds.xy);
     float groundWeight=smoothstep(0.0,2.0,min(groundBorder.x,groundBorder.y))*smoothstep(.35,.85,normalize(mat3(modelMatrix)*normal).y);
     ${floors?`float floorIndex=groundWorldPosition.y<${(floors[0]+floors[1])/2}?0.0:groundWorldPosition.y<${(floors[1]+floors[2])/2}?1.0:groundWorldPosition.y<${(floors[2]+floors[3])/2}?2.0:3.0;
     float floorDatum=floorIndex<.5?${floors[0].toFixed(5)}:floorIndex<1.5?${floors[1].toFixed(5)}:floorIndex<2.5?${floors[2].toFixed(5)}:${floors[3].toFixed(5)};
     groundWeight*=1.0-smoothstep(.15,.35,abs(groundWorldPosition.y-floorDatum));
     groundUV=clamp(groundUV,vec2(.001953125),vec2(.998046875))*.5+vec2(mod(floorIndex,2.0),floor(floorIndex/2.0))*.5;`:''}
     bakedReceiver=vec3(groundUV,groundWeight);
    `;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n'+coordinates);
    shader.fragmentShader='varying vec3 bakedReceiver;\nuniform sampler2D groundLight;\nuniform float groundSunStrength;\n'+shader.fragmentShader;
    const sample='vec2 groundVisibility=mix(vec2(1.0),texture2D(groundLight,bakedReceiver.xy).rg,bakedReceiver.z);\n';
    const lights=ShaderChunk.lights_fragment_begin.replace('getDirectionalLightInfo( directionalLight, directLight );',
     'getDirectionalLightInfo( directionalLight, directLight );\ndirectLight.color *= mix(1.0,groundVisibility.r,groundSunStrength);');
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_begin>',sample+lights);
    shader.fragmentShader=shader.fragmentShader.replace('#include <aomap_fragment>','#include <aomap_fragment>\nreflectedLight.indirectDiffuse*=mix(.65,1.0,groundVisibility.g);');
   };
   material.customProgramCacheKey=()=>key+'|baked-visibility-v3|'+Boolean(floors);material.needsUpdate=true;
  }
 };
}
