import {PMREMGenerator,EquirectangularReflectionMapping,HalfFloatType} from 'three';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';

// Four resident captures; floor changes only rebind a prefiltered texture.
// They approximate the room environment, not a planar or ray-traced mirror.
export async function loadRoomReflections(renderer,descriptors,root){
 const generator=new PMREMGenerator(renderer),targets=new Map();
 try{
  for(const d of descriptors){
   const texture=await new HDRLoader().setDataType(HalfFloatType).loadAsync(new URL(d.file+'?v='+d.sha256.slice(0,12),root).href);
   texture.mapping=EquirectangularReflectionMapping;
   try{targets.set(d.floor,generator.fromEquirectangular(texture));}finally{texture.dispose();}
  }
 }catch(error){for(const target of targets.values())target.dispose();throw error;}
 finally{generator.dispose();}
 return {get:floor=>targets.get(floor)?.texture??null,dispose(){for(const target of targets.values())target.dispose();}};
}
