import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Document,NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {draco,weld,simplify} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import * as THREE from 'three';
import sharp from 'sharp';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const source=path.resolve(process.argv[2]??path.join(repo,'../model-finalization/web'));
const target=path.join(repo,'build/web/batched');
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco3d.createDecoderModule(),'draco3d.encoder':await draco3d.createEncoderModule()});
const manifest=JSON.parse(await fs.readFile(path.join(source,'manifest.json')));
const names=['architecture','interior','garden','context-ground','context-buildings','context-plants'];
const size=512,pad=4;
await MeshoptSimplifier.ready;
const report={source:manifest.source_native_sha256,profiles:{},textureSize:size,houseGeometryDecimation:false,contextSimplification:{desktop:{ratio:.55,error:.00015},mobile:{ratio:.3,error:.0004}}};
function family(name){return /wood|parquet|timber/i.test(name)?'wood':/metal|steel|chrome|alumin|iron|mirror/i.test(name)?'metal':/fabric|cloth|leather|sofa|velvet|cotton/i.test(name)?'fabric':/glass|water/i.test(name)?'glass':/stucco|plaster|ceiling|INTERIOR/i.test(name)?'plaster':/roof|clay|tile/i.test(name)?'tile':'other';}
const rawCache=new Map();
async function rawImage(file){if(!rawCache.has(file))rawCache.set(file,await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true}));return rawCache.get(file);}
const srgb=x=>x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;
for(const profile of ['desktop','mobile']){
 const out=path.join(target,profile);await fs.mkdir(out,{recursive:true});
 const parts=[],totals={bytes:0,primitives:0,triangles:0,parts:[]};
 for(const name of names){
  const raw=JSON.parse(await fs.readFile(path.join(source,name+'.gltf'))),doc=await io.read(path.join(source,name+'.gltf'));
  const byName=new Map(raw.materials.map(m=>[m.name,m]));
  const imageFile=desc=>desc?path.join(source,decodeURIComponent(raw.images[raw.textures[desc.index].source].uri)):null;
  const buckets=new Map();
  for(const node of doc.getRoot().listNodes())for(const p of node.getMesh()?.listPrimitives()??[]){
   const m=byName.get(p.getMaterial().getName()),light=m.extras?.angoraLightMapTexture;
   const glass=Boolean(m.extensions?.KHR_materials_transmission?.transmissionFactor)||m.alphaMode==='BLEND';
   const category=name==='interior'&&!/floor|tile|door|glass|stair|window|lift|wall/i.test(node.getName())?'furniture':'fixed';
   const key=[family(m.name),glass?'transparent':m.alphaMode==='MASK'?'cutout':'opaque',imageFile(m.occlusionTexture),imageFile(light),category].join('|');
   if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push({p,m,node,glass,category});
  }
  const output=new Document(),buffer=output.createBuffer(),scene=output.createScene();let batchIndex=0,triangles=0;
  const makeAccessor=(array,type)=>output.createAccessor().setType(type).setArray(array).setBuffer(buffer);
  const loadTexture=async(file,label)=>output.createTexture(label).setImage(await sharp(file).resize(size,size,{fit:'fill'}).webp({quality:profile==='desktop'?88:78}).toBuffer()).setMimeType('image/webp');
  for(const entries of buckets.values()){
   const materials=[...new Set(entries.map(e=>e.m))];
   for(let start=0;start<materials.length;start+=16){
    const mats=materials.slice(start,start+16),items=entries.filter(e=>mats.includes(e.m)),first=items[0];
    const grid=mats.length<=1?1:mats.length<=4?2:4,cell=size/grid,inner=cell-2*pad;
    const composites={color:[],normal:[],orm:[]};
    const rough=m=>m.pbrMetallicRoughness?.roughnessFactor??1,metal=m=>m.pbrMetallicRoughness?.metallicFactor??1;
    const hasNormal=mats.some(m=>m.normalTexture);
    const hasORM=mats.some(m=>m.pbrMetallicRoughness?.metallicRoughnessTexture||rough(m)!==rough(mats[0])||metal(m)!==metal(mats[0]));
    const roles=['color',...(hasNormal?['normal']:[]),...(hasORM?['orm']:[])];
    for(let id=0;id<mats.length;id++){
     const m=mats[id],pbr=m.pbrMetallicRoughness??{},factor=pbr.baseColorFactor??[1,1,1,1];
     for(const role of roles){
      const desc=role==='color'?pbr.baseColorTexture:role==='normal'?m.normalTexture:pbr.metallicRoughnessTexture;
      const file=imageFile(desc),base=role==='normal'?[128,128,255,255]:[255,255,255,255];
      let pixels=file?await sharp(file).resize(inner,inner,{fit:'fill'}).ensureAlpha().raw().toBuffer():Buffer.from(Array.from({length:inner*inner},()=>base).flat());
      for(let i=0;i<pixels.length;i+=4){
       if(role==='color'){for(let k=0;k<3;k++)pixels[i+k]=Math.round(pixels[i+k]*srgb(factor[k]));pixels[i+3]=Math.round(pixels[i+3]*factor[3]*(first.glass?.26:1));}
       if(role==='orm'){pixels[i]=255;pixels[i+1]=Math.round(pixels[i+1]*(pbr.roughnessFactor??1));pixels[i+2]=Math.round(pixels[i+2]*(pbr.metallicFactor??1));}
       if(role==='normal'){const strength=m.normalTexture?.scale??1;pixels[i]=128+(pixels[i]-128)*strength;pixels[i+1]=128+(pixels[i+1]-128)*strength;}
      }
      const tile=await sharp(pixels,{raw:{width:inner,height:inner,channels:4}}).extend({top:pad,bottom:pad,left:pad,right:pad,extendWith:'repeat'}).png().toBuffer();
      composites[role].push({input:tile,left:(id%grid)*cell,top:Math.floor(id/grid)*cell});
     }
    }
    const material=output.createMaterial(`${name}-${family(first.m.name)}-${batchIndex}`).setDoubleSided(true).setBaseColorFactor([1,1,1,1]).setRoughnessFactor(1).setMetallicFactor(1);
    if(!hasORM)material.setRoughnessFactor(rough(mats[0])).setMetallicFactor(metal(mats[0]));
    for(const role of roles){
     const data=await sharp({create:{width:size,height:size,channels:4,background:role==='normal'?{r:128,g:128,b:255,alpha:1}:{r:255,g:255,b:255,alpha:1}}}).composite(composites[role]).webp({quality:role==='normal'?95:profile==='desktop'?88:78}).toBuffer();
     const tex=output.createTexture(role).setImage(data).setMimeType('image/webp');
     if(role==='color')material.setBaseColorTexture(tex);else if(role==='normal')material.setNormalTexture(tex);else material.setMetallicRoughnessTexture(tex);
    }
    if(first.glass)material.setAlphaMode('BLEND');else if(first.m.alphaMode==='MASK')material.setAlphaMode('MASK').setAlphaCutoff(first.m.alphaCutoff??.5);
    const aoFile=imageFile(first.m.occlusionTexture),lightFile=imageFile(first.m.extras?.angoraLightMapTexture);
    if(aoFile){material.setOcclusionTexture(await loadTexture(aoFile,'AO'));material.getOcclusionTextureInfo().setTexCoord(1);}
    // Emissive texture transports the existing indirect-light bake; runtime binds it as lightMap.
    if(lightFile){material.setEmissiveTexture(await loadTexture(lightFile,'indirect'));material.getEmissiveTextureInfo().setTexCoord(2);}
    material.setExtras({angoraAuthoredPBR:true,angoraBatch:{grid,pad:pad/size,inner:inner/size,light:lightFile?first.m.extras.angoraLightMapTexture.intensity:0,materials:mats.map(m=>m.name)}});
    let vertexCount=0,indexCount=0;for(const {p} of items){vertexCount+=p.getAttribute('POSITION').getCount();indexCount+=p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount();}
    const pos=new Float32Array(vertexCount*3),normal=new Float32Array(vertexCount*3),uv=new Float32Array(vertexCount*2),uvAO=new Float32Array(vertexCount*2),uvLight=new Float32Array(vertexCount*2),ids=new Float32Array(vertexCount),colors=new Float32Array(vertexCount*4),indices=new Uint32Array(indexCount);
    let vertex=0,offset=0;const v=new THREE.Vector3(),n=new THREE.Vector3();
    for(const {p,m,node} of items){
     const id=mats.indexOf(m),mat=new THREE.Matrix4().fromArray(node.getWorldMatrix()),norm=new THREE.Matrix3().getNormalMatrix(mat);
     const pbr=m.pbrMetallicRoughness??{},desc=pbr.baseColorTexture??m.normalTexture??pbr.metallicRoughnessTexture;
     const uvDescriptor=d=>({a:p.getAttribute('TEXCOORD_'+(d?.extensions?.KHR_texture_transform?.texCoord??d?.texCoord??0)),t:d?.extensions?.KHR_texture_transform});
     const writeUV=(d,dest,i)=>{const a=d.a?.getElement(i,[])??[0,0],t=d.t;let x=a[0],y=a[1];if(t){x*=t.scale?.[0]??1;y*=t.scale?.[1]??1;const c=Math.cos(t.rotation??0),s=Math.sin(t.rotation??0);[x,y]=[c*x-s*y+(t.offset?.[0]??0),s*x+c*y+(t.offset?.[1]??0)];}dest[(vertex+i)*2]=x;dest[(vertex+i)*2+1]=y;};
     const baseUV=uvDescriptor(desc),aoUV=uvDescriptor(m.occlusionTexture),lightUV=uvDescriptor(m.extras?.angoraLightMapTexture);
     for(const d of [m.normalTexture,pbr.metallicRoughnessTexture].filter(Boolean))if(JSON.stringify(uvDescriptor(d).t)!==JSON.stringify(baseUV.t)||uvDescriptor(d).a!==baseUV.a)throw Error('Incompatible texture UVs: '+m.name);
     const count=p.getAttribute('POSITION').getCount();
     for(let i=0;i<count;i++){
      v.fromArray(p.getAttribute('POSITION').getElement(i,[])).applyMatrix4(mat).toArray(pos,(vertex+i)*3);
      n.fromArray(p.getAttribute('NORMAL')?.getElement(i,[])??[0,1,0]).applyMatrix3(norm).normalize().toArray(normal,(vertex+i)*3);
      writeUV(baseUV,uv,i);writeUV(aoUV,uvAO,i);writeUV(lightUV,uvLight,i);ids[vertex+i]=id;
      const c=p.getAttribute('COLOR_0')?.getElement(i,[])??[1,1,1,1];colors.set([c[0],c[1],c[2],c[3]??1],(vertex+i)*4);
     }
     const idx=p.getIndices();for(let i=0;i<(idx?.getCount()??count);i++)indices[offset++]=vertex+(idx?idx.getScalar(i):i);vertex+=count;
    }
    const prim=output.createPrimitive().setMaterial(material).setIndices(makeAccessor(indices,'SCALAR')).setAttribute('POSITION',makeAccessor(pos,'VEC3')).setAttribute('NORMAL',makeAccessor(normal,'VEC3')).setAttribute('TEXCOORD_0',makeAccessor(uv,'VEC2')).setAttribute('_BATCHID',makeAccessor(ids,'SCALAR'));
    if(colors.some(x=>x!==1))prim.setAttribute('COLOR_0',makeAccessor(colors,'VEC4'));
    if(aoFile)prim.setAttribute('TEXCOORD_1',makeAccessor(uvAO,'VEC2'));if(lightFile)prim.setAttribute('TEXCOORD_2',makeAccessor(uvLight,'VEC2'));
    const mesh=output.createMesh(material.getName()).addPrimitive(prim);scene.addChild(output.createNode(material.getName()).setMesh(mesh).setExtras({category:first.category}));
    triangles+=indexCount/3;batchIndex++;
   }
  }
  const context=name.startsWith('context-');
  await output.transform(weld());
  if(context)await output.transform(simplify({simplifier:MeshoptSimplifier,...report.contextSimplification[profile],lockBorder:name==='context-ground'}));
  triangles=output.getRoot().listMeshes().reduce((sum,m)=>sum+m.listPrimitives().reduce((n,p)=>n+p.getIndices().getCount()/3,0),0);
  await output.transform(draco({method:'edgebreaker',encodeSpeed:4,decodeSpeed:5,quantizePosition:context?(profile==='desktop'?14:13):(profile==='desktop'?17:16),quantizeNormal:context?8:(profile==='desktop'?12:10),quantizeTexcoord:context?10:(profile==='desktop'?14:13),quantizeColor:8,quantizeGeneric:8,quantizationVolume:'scene'}));
  const file=name+'.glb';await io.write(path.join(out,file),output);const bytes=(await fs.stat(path.join(out,file))).size;
  parts.push({name,file});totals.bytes+=bytes;totals.primitives+=batchIndex;totals.triangles+=triangles;totals.parts.push({name,bytes,primitives:batchIndex,triangles});
  console.log(profile,name,bytes,batchIndex,triangles);rawCache.clear();
 }
 const next={...manifest,batched:true,profile,parts,interior_streams:[]};
 for(const key of ['sections','lights','rooms','navigation','site_context','plot_boundary','soil_section'])next[key]='../../native-current/'+path.basename(manifest[key]);
 await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(next));report.profiles[profile]=totals;
}
await fs.writeFile(path.join(target,'report.json'),JSON.stringify(report,null,2));
