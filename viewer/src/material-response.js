import * as THREE from 'three';

// Presentation response only: source geometry and calibrated dimensions stay
// untouched. Keep the baked maps, but avoid amplifying their micro-relief.
export function materialFamily(name='') {
  name=name.replace(/\.\d{3}$/,'');
  // The bldg-3 re-export renamed its surfaces in passing - 'roof' became
  // 'roof-7', 'stucco' arrived as 'STRUCCO', 'white_trim' as 'WHT',
  // 'wood_floor' as 'WOOD-FL' - so each family tolerates the variants the
  // deliveries have actually used rather than one authored spelling.
  if (/clay tile|^roof(-\d+)?$|green tiles/i.test(name)) return 'roof';
  // Glass and mirrors must never reach a roughness floor: 'Lift glass leaf'
  // would otherwise match the landscape family through 'leaf' and pick up a
  // 0.88 floor, and the mirrors read as masonry through nothing at all - the
  // floor is what matters, so they are named out before any family test.
  if (/glass|mirror/i.test(name)) return 'other';
  if (/st?rucco|neighbor_wall|white_trim|^wht$|limestone|stone_tile|retaining stone|asphalt/i.test(name)) return 'masonry';
  if (/grass|foliage|hedge|needle|leaf/i.test(name)) return 'landscape';
  if (/wood_floor|^wood-?fl$|terra_floor/i.test(name)) return 'floor';
  // Indoor plaster. It used to fall through to 'other' and keep the loader's
  // envMapIntensity of 1 - the only family in the house left at full strength,
  // while roof sits at .65, floor .75 and masonry .8. A ceiling faces down, so
  // what it reflects is the lower half of the probe, which is the settlement's
  // ground: 73.8 k m² of grass against 17.7 k of asphalt and 20.5 k of stone,
  // averaging linear .180,.209,.112. Measured off a delivered frame the
  // ceilings were reading sRGB 118,125,97 - the ground's own colour, not their
  // own - because with no occlusion indoors the environment was most of what
  // reached them. The albedo is right; the weight was not.
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
    // An interior wall's environment is the room, not the sky. At .55 the
    // probe's upper hemisphere reached a 0.94 white wall with nothing to
    // occlude it, and the attic's 360° tour showed the result: the ceiling
    // beside it reads white because its own envMap is 0, while the walls read
    // the blue-grey of the façade - "iç duvarlar beyaz. dış da ise tüm
    // duvarlar o grimsi mavimsi renk. bunu karıştırma hiçbir yerde." The
    // albedo was never the problem; the weight was, and it is the same
    // argument that took the ceilings to 0.
    material.envMapIntensity=0;
    // A grade-supplied plaster grain is deliberate relief, not baked noise -
    // only the authored maps are cleared.
    if(!material.userData.exteriorGradeBound){material.normalMap=null;}
    material.bumpMap=null;
    // and the rest of what makes a ceiling read white, because the review is
    // about the pair: "iç duvarlar beyaz" against a ceiling that already is.
    // The albedo is 0.940 either way; the ceiling looks it and the wall does
    // not, and the difference is here - the forced white, the vertex colours
    // off, and the small emissive lift that stands in for the bounce an
    // interior with no occlusion never gets.
    material.color.setRGB(.94,.94,.94);
    material.vertexColors=false;
    material.emissive?.setRGB(.22,.22,.22);material.emissiveIntensity=1;
  } else if (family==='soffit') {
    if(!material.userData.exteriorGradeBound){material.normalMap=null;}
    material.bumpMap=null;
    material.map=null;
    material.color.setRGB(.94,.94,.94);
    material.vertexColors=false;
    // A ceiling's normal points at the floor, so of the probe it sees the
    // ground hemisphere and nothing else - .55 of the settlement's olive is
    // still the settlement's olive, which is what a delivered interior frame
    // still showed. What lights a ceiling indoors is the room: the fixtures,
    // and the hemisphere fill, whose downward colour is a neutral warm grey.
    // The environment is the one term that has no business being there.
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
    // The hard .08 clamp existed because an early export's floors read as wet
    // pavement outdoors. The optimised set authors its coats deliberately
    // (wood floors at .25), so the authored value now stands up to .35 with
    // enough coat roughness to keep the sheen soft rather than wet.
    if(material.isMeshPhysicalMaterial){
      material.clearcoat=Math.min(material.clearcoat,.35);
      material.clearcoatRoughness=Math.max(material.clearcoatRoughness??.65,.35);
    }
  }
  material.needsUpdate=true;
}

// KHR_materials_transmission makes three re-render the entire opaque scene
// into a transmission buffer every frame any such surface is visible - a
// hidden second scene pass that is what made the optimised set crawl. The
// refraction is traded for plain alpha glazing at load time: the openings
// look the same, isSeeThrough still classifies them as glazing through the
// opacity branch, and the per-frame scene copy is gone. Running before
// mergeEqualMaterials also lets copies that differed only in transmission
// collapse, so fewer programs compile.
export function neutraliseTransmission(root) {
  let converted=0;
  root.traverse(object=>{
    if(!object.isMesh)return;
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      if(!material||!(material.transmission>0))continue;
      // Deeper transmission reads as clearer glass, so it maps to lower alpha.
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

// The native model supplies a separate plaster lining. Exterior clay tiles
// retain their material in every camera mode, including through windows.
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
