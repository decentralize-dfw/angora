import * as THREE from 'three';
import {prepareBakedLighting} from './baked-lighting.js';
import {restoreBatchSurface} from './batch-surface-response.js';
import {prepareBatchedMaterial} from './batched-material.js';
import {applyMaterialResponse} from './material-response-v2.js';
import {chunkModelInPlace} from './context-plants-chunks.js';
import {applyPlantVariation} from './plant-variation.js';

// Batched deliveries remain resident across every view. The legacy manifest
// path retains its older floor streams for explicit compatibility previews.
export function createNativeDelivery({manifest,root,scene,groups,load,prepare,releaseMaterial,onProgress,onAcquired,features={},proceduralDetail={},materialResponse=false}) {
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
    const url=new URL(manifest.batched?record.file:record.file.replace(/\.gltf$/,'.gpu.gltf'),root);
    if(record.gpu_sha256)url.searchParams.set('v',record.gpu_sha256.slice(0,12));
    // The boot bar is weighed by these bytes, so the download reports as it
    // runs and once more on completion - a compressed response reports fewer
    // bytes than the manifest records, so the manifest size caps each part.
    const result=await load(url.href,event=>onProgress?.(name,event.loaded,false));
    onProgress?.(name,record.bytes??0,true);
    const model=result.scene;
    try{
    if(manifest.batched){
      const replacements=new Map();
      // FAZ 7 İŞ 6 rides the same replacement pass the surface restore
      // owns: standard -> physical upgrade with per-cell clearcoat/sheen.
      // materialResponse is tier-gated in main (desktop only, flag'lı).
      for(const material of resources(model).materials)replacements.set(material,
        (materialResponse?applyMaterialResponse:(m=>m))(restoreBatchSurface(material,manifest.surface_response?.[name])));
      model.traverse(o=>{if(o.isMesh)o.material=Array.isArray(o.material)?o.material.map(m=>replacements.get(m)):replacements.get(o.material);});
      for(const [old,next] of replacements)if(old!==next)old.dispose();
      // Task 1.4 safety valve: the published GLBs are patched single-sided;
      // ?features=singleSided:0 puts both faces back at load time so a
      // surface lost to an inverted source normal can be confirmed without
      // re-patching the delivery.
      if(features.singleSided===false)for(const material of resources(model).materials)
        if(material.userData.angoraBatch)material.side=THREE.DoubleSide;
    }
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
    // Task 1.4: the planting ships as ONE mesh whose bound is the whole
    // settlement, so the culler can never drop an off-screen tree. Split it
    // into 48 m cells before mesh preparation runs, so each chunk gets the
    // same clipping/lighting treatment the single mesh would have.
    // Task 2.3 (runtime half): per-PLANT hue/value drift. Runs before the
    // chunker so a tree straddling a cell keeps one seed across both chunks
    // (the attribute rides the shared vertex buffer).
    if(features.plantVariation&&manifest.batched&&name==='context-plants')
      model.traverse(o=>{if(o.isMesh)applyPlantVariation(o);});
    if(features.plantsChunking&&manifest.batched&&name==='context-plants')chunkModelInPlace(model);
    // Task 2.2 (runtime half): the neighbour blocks are 1.02 M merged
    // triangles behind one settlement-sized bound - same disease the
    // planting had, same cure: triangle-bucketed 48 m cells over SHARED
    // attributes, so an orbit that faces away stops paying for the far
    // half of the settlement. Real instancing and the LOD tiers need the
    // pre-merge source objects, which only build.mjs sees - H6.
    if(features.buildingsChunking&&manifest.batched&&name==='context-buildings')chunkModelInPlace(model);
    const clipped=!context.includes(name)&&name!=='villa-context-white'&&name!=='plot-grass';
    model.traverse(o=>{if(o.isMesh){if(!manifest.batched&&name.startsWith('interior')&&!/floor|tile|door|glass|stair|window|lift|wall/i.test(o.name))o.userData.category='furniture';prepare(o,{clipped,context:!clipped,name});}});
    // Task 1.6: the garden is outdoors too. Without this its surfaces
    // compile the four interior fixture loops and evaluate them per fragment
    // for lamps they can never see through the walls.
    for(const material of resources(model).materials)prepareBatchedMaterial(material,{exterior:context.includes(name)||(features.gardenSpotStrip&&name==='garden'),
      proceduralDetail:Boolean(proceduralDetail.enabled),detailOctaves:proceduralDetail.octaves??2,detailInterior:Boolean(proceduralDetail.interior),detailBoost:proceduralDetail.boost??null});
    loaded.set(name,model);groups.set(name,model);scene.add(model);onAcquired?.(name,model);return model;
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
  let preload,walking=false,interiorReady=null,currentView='neighborhood';
  // DAİMİ EMİR A7: first-interactive was 23.8 MB desktop / 18.2 MB mobile
  // against Task 2.1's 5/4 MB target, and 13.6 MB of it is the two big
  // context parts (buildings 8.1 + plants 5.6 on desktop). They are scenery
  // behind the villa, not the villa: behind progressiveContextV1 they load
  // like the interior does - off the critical path, on idle, visible when
  // ready. context-ground stays on the boot path (0.6 MB; without it the
  // villa floats for the first seconds). contextDone resolves when ALL
  // deferred parts are in, so QA captures stay deterministic.
  let resolveContext;const contextDone=new Promise(resolve=>{resolveContext=resolve;});
  const applyVisibility=view=>{
    for(const [name,model] of loaded){
      model.visible=name!=='interior'||/^f[0-3]$/.test(view);
      // Walking happens indoors: the neighbourhood's planting is 514k
      // triangles of trees seen, at most, through a window. First step of
      // Task 1.4's view culling - A/B'd on the walk cameras before shipping.
      if(features.viewCulling&&name==='context-plants'&&walking)model.visible=false;
    }
  };
  if(!manifest.batched)resolveContext(); // classic path defers nothing
  return {loaded,batched:Boolean(manifest.batched),contextReady:contextDone,
    setWalkMode(active,view){
      if(walking===active)return;
      walking=active;
      if(manifest.batched){
        currentView=view;
        if(active&&features.progressiveLoaderV2)(interiorReady??=acquire('interior').catch(error=>{interiorReady=null;throw error;})).then(()=>applyVisibility(currentView)).catch(()=>{});
        applyVisibility(view);
      }
    },
    async activate(view){
      if(manifest.batched){
        // Task 2.1: the interior is invisible in every exterior view, so its
        // bytes have no business on the first-orbit critical path. With the
        // progressive flag the boot loads everything BUT the interior, an
        // idle prefetch brings it in behind the first frame, and a floor
        // pick that outruns the idle simply awaits the same acquire.
        const deferInterior=features.progressiveLoaderV2;
        const deferredContext=features.progressiveContextV1?['context-buildings','context-plants']:[];
        preload??=(async()=>{
          for(const {name} of manifest.parts)if(!(deferInterior&&name==='interior')&&!deferredContext.includes(name))await acquire(name);
          const idle=globalThis.requestIdleCallback?.bind(globalThis)??(fn=>setTimeout(fn,2000));
          if(deferredContext.length){
            idle(()=>{(async()=>{
              for(const name of deferredContext)await acquire(name);
              applyVisibility(currentView);
            })().catch(error=>console.warn('Context prefetch failed',error)).finally(resolveContext);});
          } else resolveContext();
          if(deferInterior){
            idle(()=>{interiorReady??=acquire('interior').then(()=>applyVisibility(currentView)).catch(error=>{interiorReady=null;console.warn('Interior prefetch failed; retried on demand',error);});});
          }
        })();
        await preload;
        currentView=view;
        if(deferInterior&&(/^f[0-3]$/.test(view)||walking))await (interiorReady??=acquire('interior').catch(error=>{interiorReady=null;throw error;}));
        applyVisibility(view);
        return;
      }
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
