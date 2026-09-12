import * as THREE from 'three';

// Presentation response only: source geometry and calibrated dimensions stay
// untouched. Keep the baked maps, but avoid amplifying their micro-relief.
export function materialFamily(name='') {
  if (/clay tile|^roof$|green tiles/i.test(name)) return 'roof';
  // Glass and mirrors must never reach a roughness floor: 'Lift glass leaf'
  // would otherwise match the landscape family through 'leaf' and pick up a
  // 0.88 floor, and the mirrors read as masonry through nothing at all - the
  // floor is what matters, so they are named out before any family test.
  if (/glass|mirror/i.test(name)) return 'other';
  if (/stucco|neighbor_wall|white_trim|limestone|stone_tile|retaining stone|asphalt/i.test(name)) return 'masonry';
  if (/grass|foliage|hedge|needle|leaf/i.test(name)) return 'landscape';
  if (/wood_floor|terra_floor/i.test(name)) return 'floor';
  // Indoor plaster. It used to fall through to 'other' and keep the loader's
  // envMapIntensity of 1 - the only family in the house left at full strength,
  // while roof sits at .65, floor .75 and masonry .8. A ceiling faces down, so
  // what it reflects is the lower half of the probe, which is the settlement's
  // ground: 73.8 k m² of grass against 17.7 k of asphalt and 20.5 k of stone,
  // averaging linear .180,.209,.112. Measured off a delivered frame the
  // ceilings were reading sRGB 118,125,97 - the ground's own colour, not their
  // own - because with no occlusion indoors the environment was most of what
  // reached them. The albedo is right; the weight was not.
  if (/^ceiling$/.test(name)) return 'soffit';
  if (/^interior$/.test(name)) return 'plaster';
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
    // The eaves trim and the roof plane cross at a very shallow angle where the
    // roof meets a gable, and the trim wins by a hair over a long run - which
    // draws as white shards lying on the tiles. A small depth bias toward the
    // camera lets the roof cover its own trim without moving any geometry.
    if(!context){material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-2;}
  } else if (family==='masonry') {
    material.normalScale?.multiplyScalar(context?.3:.55);
    material.envMapIntensity=.8;
  } else if (family==='landscape') {
    material.normalScale?.multiplyScalar(.25);
  } else if (family==='plaster') {
    material.envMapIntensity=.55;
  } else if (family==='soffit') {
    // A ceiling's normal points at the floor, so of the probe it sees the
    // ground hemisphere and nothing else - .55 of the settlement's olive is
    // still the settlement's olive, which is what a delivered interior frame
    // still showed. What lights a ceiling indoors is the room: the fixtures,
    // and the hemisphere fill, whose downward colour is a neutral warm grey.
    // The environment is the one term that has no business being there.
    material.envMapIntensity=.2;
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
