import * as THREE from 'three';
import {prepareBakedLighting} from './baked-lighting.js';

// Only the current floor is resident. Texture Sources share image storage while
// each glTF texture retains its own UV channel, sampler and colour space.
export function createNativeDelivery({manifest,root,scene,groups,load,prepare,releaseMaterial}) {
  const loaded=new Map(),sources=new Map();
  const context=['context-ground','context-buildings','context-plants'];
  const records=new Map([...manifest.parts,...manifest.interior_streams].map(p=>[p.name,p]));
  function resources(root){
    const geometries=new Set(),materials=new Set(),textures=new Set();
    root.traverse(o=>{if(!o.isMesh)return;geometries.add(o.geometry);
      for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const t of Object.values(m))if(t?.isTexture)textures.add(t);}});
    return {geometries,materials,textures};
  }
  async function acquire(name){
    if(loaded.has(name))return loaded.get(name);
    const record=records.get(name);if(!record)throw Error('Missing native asset '+name);
    const url=new URL(record.file.replace(/\.gltf$/,'.gpu.gltf'),root);
    if(record.gpu_sha256)url.searchParams.set('v',record.gpu_sha256.slice(0,12));
    const result=await load(url.href),model=result.scene;
    try{
    for(const material of resources(model).materials){
      const descriptor=material.userData.angoraLightMapTexture;if(!descriptor)continue;
      const texture=await result.parser.getDependency('texture',descriptor.index);
      texture.channel=descriptor.texCoord;texture.colorSpace=THREE.SRGBColorSpace;
      material.lightMap=texture;material.lightMapIntensity=descriptor.intensity;
      material.userData.indirectDaylightIntensity=descriptor.intensity;
      prepareBakedLighting(material);
    }
    const modelTextures=resources(model).textures,discardedImages=new Set();
    for(const texture of modelTextures){
      const index=result.parser.associations.get(texture)?.textures,def=result.parser.json.textures?.[index];
      const image=def?.extensions?.KHR_texture_basisu?.source??def?.source;
      const uri=result.parser.json.images?.[image]?.uri;if(!uri)continue;
      const key=new URL(uri,url).href+'|'+texture.format+'|'+texture.type;
      if(sources.has(key)){
        const shared=sources.get(key);
        if(texture.source!==shared)discardedImages.add(texture.source.data);
        texture.source=shared;
      }else sources.set(key,texture.source);
    }
    // GLTFLoader can decode the same URI separately for each file. Replacing
    // its Source does not release the discarded ImageBitmap's native memory.
    // Close only after every sampler has been remapped: another sampler may
    // still use that image through a different Source or format.
    const retainedImages=new Set([...sources.values()].map(source=>source.data));
    for(const texture of modelTextures)retainedImages.add(texture.source.data);
    for(const data of discardedImages)if(data&&!retainedImages.has(data))data.close?.();
    const clipped=!context.includes(name)&&name!=='villa-context-white'&&name!=='plot-grass';
    model.traverse(o=>{if(o.isMesh){if(name.startsWith('interior')&&!/floor|tile|door|glass|stair|window|lift|wall/i.test(o.name))o.userData.category='furniture';prepare(o,{clipped,context:!clipped,name});}});
    loaded.set(name,model);groups.set(name,model);scene.add(model);return model;
    }catch(error){
      // A failed lightmap/mesh preparation must release this decoded asset
      // too; it has not yet been added to the visible scene or loaded map.
      loaded.set(name,model);release(name);throw error;
    }
  }
  function release(name){
    const model=loaded.get(name);if(!model)return;
    loaded.delete(name);groups.delete(name);scene.remove(model);
    const keepTextures=new Set();for(const other of loaded.values())for(const t of resources(other).textures)keepTextures.add(t);
    const keepSources=new Set([...keepTextures].map(t=>t.source)),keepImages=new Set([...keepSources].map(s=>s.data));
    const {geometries,materials,textures}=resources(model),closed=new Set();
    geometries.forEach(g=>g.dispose());materials.forEach(m=>{releaseMaterial?.(m);m.dispose();});
    for(const t of textures)if(!keepTextures.has(t)){t.dispose();const data=t.source?.data;if(data&&!keepImages.has(data)&&!closed.has(data)){data.close?.();closed.add(data);}}
    for(const [key,source] of sources)if(!keepSources.has(source))sources.delete(key);
    THREE.Cache.clear();
  }
  return {loaded,
    async activate(view){
      await acquire('architecture');await acquire('garden');
      const floor=/^f[0-3]$/.test(view);
      const wanted=new Set(['architecture','garden',...(floor?['plot-grass','villa-context-white','context-plants','interior-common','interior-'+view]:context)]);
      // Release unrelated context before decoding the next floor on phones.
      for(const name of [...loaded.keys()])if(!wanted.has(name))release(name);
      for(const name of wanted)await acquire(name);
    },
    dispose(){for(const name of [...loaded.keys()])release(name);},
  };
}
