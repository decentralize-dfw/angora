import * as THREE from 'three';

// Presentation response only: source geometry and calibrated dimensions stay
// untouched. Keep the baked maps, but avoid amplifying their micro-relief.
export function materialFamily(name='') {
  if (/clay tile|^roof$|green tiles/i.test(name)) return 'roof';
  if (/stucco|neighbor_wall|white_trim|limestone|stone_tile/i.test(name)) return 'masonry';
  if (/grass|foliage|hedge|needle|leaf/i.test(name)) return 'landscape';
  if (/wood_floor|terra_floor/i.test(name)) return 'floor';
  return 'other';
}

export function prepareMaterialResponse(material, {context=false}={}) {
  if (!material?.isMeshStandardMaterial || material.userData.presentationR27) return;
  const family=materialFamily(material.name);
  material.userData.presentationR27={family,context,normal:material.normalScale?.clone()};
  if (['roof','masonry','landscape','floor'].includes(family)) material.metalness=0;
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
  } else if (family==='masonry') {
    material.normalScale?.multiplyScalar(context?.3:.55);
    material.envMapIntensity=.8;
  } else if (family==='landscape') {
    material.normalScale?.multiplyScalar(.25);
  } else if (family==='floor') {
    material.normalScale?.multiplyScalar(.3);
    material.envMapIntensity=.75;
    if(material.isMeshPhysicalMaterial){material.clearcoat=Math.min(material.clearcoat,.08);material.clearcoatRoughness=.65;}
  }
  material.needsUpdate=true;
}

export function setMaterialScale(material, view) {
  const state=material.userData.presentationR27;
  if(state?.family!=='roof'||!state.normal)return;
  const scale=view==='region'?.06:view==='neighborhood'?.14:state.context?.18:.3;
  material.normalScale.copy(state.normal).multiplyScalar(scale);
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
