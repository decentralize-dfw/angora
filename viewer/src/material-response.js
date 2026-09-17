import * as THREE from 'three';

export function materialFamily(name='') {
  name=name.replace(/\.\d{3}$/,'');
  if (/clay tile|^roof(-\d+)?$|green tiles/i.test(name)) return 'roof';
  if (/glass|mirror/i.test(name)) return 'other';
  if (/st?rucco|neighbor_wall|white_trim|^wht$|limestone|stone_tile|retaining stone|asphalt/i.test(name)) return 'masonry';
  if (/grass|foliage|hedge|needle|leaf/i.test(name)) return 'landscape';
  if (/wood_floor|^wood-?fl$|terra_floor/i.test(name)) return 'floor';
  if (/^ceiling$/i.test(name)) return 'soffit';
  if (/^interior$/i.test(name)) return 'plaster';
  return 'other';
}

export function prepareMaterialResponse(material, {context=false}={}) {
  if (!material?.isMeshStandardMaterial || material.userData.presentationR27) return;
  const family=materialFamily(material.name);
  material.userData.presentationR27={family,context,normal:material.normalScale?.clone()};
  if (['roof','masonry','landscape','floor','plaster','soffit'].includes(family)) material.metalness=0;
  const roughnessFloor={roof:.8,masonry:.72,landscape:.88,floor:.58}[family];
  if(roughnessFloor){
    const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey();
    material.onBeforeCompile=(shader,renderer)=>{
      previous.call(material,shader,renderer);
      shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>\nroughnessFactor = max(roughnessFactor, ${roughnessFloor.toFixed(2)});`);
    };
    material.customProgramCacheKey=()=>previousKey+'|angora-r27-'+family;
  }
  if (family==='roof') {
    material.normalScale?.multiplyScalar(context?.18:.3);
    material.envMapIntensity=.65;
    if(!context){material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-2;}
  } else if (family==='masonry') {
    material.normalScale?.multiplyScalar(context?.3:.55);
    material.envMapIntensity=.8;
  } else if (family==='landscape') {
    material.normalScale?.multiplyScalar(.25);
  } else if (family==='plaster') {
    material.envMapIntensity=0;
    if(!material.userData.exteriorGradeBound){material.normalMap=null;}
    material.bumpMap=null;
    material.color.setRGB(.94,.94,.94);
    material.vertexColors=false;
    material.emissive?.setRGB(.22,.22,.22);material.emissiveIntensity=1;
  } else if (family==='soffit') {
    if(!material.userData.exteriorGradeBound){material.normalMap=null;}
    material.bumpMap=null;
    material.map=null;
    material.color.setRGB(.94,.94,.94);
    material.vertexColors=false;
    material.envMapIntensity=0;
    material.emissive?.setRGB(.35,.35,.35);material.emissiveIntensity=1;
    const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey();
    material.onBeforeCompile=(shader,renderer)=>{
      previous.call(material,shader,renderer);
      const neutral=THREE.ShaderChunk.envmap_physical_pars_fragment.replaceAll('envMapColor.rgb','vec3(dot(envMapColor.rgb, vec3(0.2126, 0.7152, 0.0722)))');
      shader.fragmentShader=shader.fragmentShader.replace('#include <envmap_physical_pars_fragment>',neutral);
    };
    material.customProgramCacheKey=()=>previousKey+'|neutral-ceiling-probe';
  } else if (family==='floor') {
    material.normalScale?.multiplyScalar(.3);
    material.envMapIntensity=.75;
    if(material.isMeshPhysicalMaterial){
      material.clearcoat=Math.min(material.clearcoat,.35);
      material.clearcoatRoughness=Math.max(material.clearcoatRoughness??.65,.35);
    }
  }
  material.needsUpdate=true;
}

export function neutraliseTransmission(root) {
  let converted=0;
  root.traverse(object=>{
    if(!object.isMesh)return;
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      if(!material||!(material.transmission>0))continue;
      material.opacity=Math.min(material.opacity,THREE.MathUtils.clamp(1-.72*material.transmission,.22,.9));
      material.transmission=0;
      material.transparent=true;
      if(material.thickness)material.thickness=0;
      material.depthWrite=false;
      material.needsUpdate=true;converted++;
    }
  });
  return converted;
}

export function setMaterialScale(material, view) {
  const state=material.userData.presentationR27;
  if(state?.family!=='roof'||!state.normal)return;
  const scale=view==='region'?.06:view==='neighborhood'?.14:state.context?.18:.3;
  material.normalScale.copy(state.normal).multiplyScalar(scale);
}

export function setInteriorMode(material, active) {
  const state=material?.userData?.presentationR27;
  if(state?.family!=='soffit')return;
  if(!state.walk)state.walk={
    color:material.color.clone(),map:material.map,normalMap:material.normalMap,
    bumpMap:material.bumpMap,envMapIntensity:material.envMapIntensity,
    vertexColors:material.vertexColors,emissive:material.emissive?.clone(),
    emissiveIntensity:material.emissiveIntensity
  };
  if(active){
    material.color.setRGB(.94,.94,.94);
    material.map=null;material.bumpMap=null;
    if(!material.userData.exteriorGradeBound)material.normalMap=null;
    material.envMapIntensity=0;material.vertexColors=false;
    material.emissive?.setRGB(.35,.35,.35);material.emissiveIntensity=1;
  }else{
    material.color.copy(state.walk.color);
    material.map=state.walk.map;material.normalMap=state.walk.normalMap;
    material.bumpMap=state.walk.bumpMap;material.envMapIntensity=state.walk.envMapIntensity;
    material.vertexColors=state.walk.vertexColors;
    if(state.walk.emissive)material.emissive.copy(state.walk.emissive);
    material.emissiveIntensity=state.walk.emissiveIntensity;
  }
  material.needsUpdate=true;
}

export function fitContextBounds(box, aspect, polar=.58, azimuth=0, fov=16) {
  const target=box.getCenter(new THREE.Vector3()),tan=Math.tan(THREE.MathUtils.degToRad(fov/2));
  const direction=new THREE.Vector3().setFromSphericalCoords(1,polar,azimuth);
  const right=new THREE.Vector3(Math.cos(azimuth),0,-Math.sin(azimuth));
  const up=new THREE.Vector3().crossVectors(direction,right);
  let distance=1;
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
    const p=new THREE.Vector3(x,y,z).sub(target),depth=p.dot(direction);
    distance=Math.max(distance,depth+Math.abs(p.dot(right))/(tan*aspect)*1.1,depth+Math.abs(p.dot(up))/tan*1.35);
  }
  return {target,span:distance*2*tan,polar,azimuth};
}
