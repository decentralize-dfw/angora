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

// Task 2.1-c: the boot no longer pays for four storeys of probe (desktop
// 4x~390 KB). A floor's probe loads when the floor is picked; its
// neighbours prefetch behind it; get() answers null until then, which the
// glazing already treats as "no room reflection yet".
export function createLazyRoomReflections(renderer,descriptors,root){
 const targets=new Map(),loading=new Map();
 const byFloor=new Map(descriptors.map(d=>[d.floor,d]));
 const loadOne=floor=>{
  const d=byFloor.get(floor);
  if(!d||targets.has(floor))return Promise.resolve();
  if(!loading.has(floor))loading.set(floor,(async()=>{
   const generator=new PMREMGenerator(renderer);
   try{
    const texture=await new HDRLoader().setDataType(HalfFloatType).loadAsync(new URL(d.file+'?v='+d.sha256.slice(0,12),root).href);
    texture.mapping=EquirectangularReflectionMapping;
    try{targets.set(floor,generator.fromEquirectangular(texture));}finally{texture.dispose();}
   }finally{generator.dispose();loading.delete(floor);}
  })());
  return loading.get(floor);
 };
 return {
  get:floor=>targets.get(floor)?.texture??null,
  async ensure(floor){
   await loadOne(floor);
   for(const neighbour of [floor-1,floor+1])loadOne(neighbour)?.catch?.(()=>{});
  },
  dispose(){for(const target of targets.values())target.dispose();targets.clear();},
 };
}
