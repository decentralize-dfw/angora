import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const {default:sharp}=await import(process.env.ANGORA_SHARP_MODULE??'sharp');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const source=path.join(root,'../model-finalization/web'),base=path.join(root,'build/web/batched');
const sha=b=>createHash('sha256').update(b).digest('hex');
const linear=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const srgb=x=>x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;
const record={method:'Replace only image buffer views; compressed geometry byte-identical',profiles:{}};
const previousDetail=JSON.parse(await fs.readFile(path.join(base,'detail-report.json')).catch(()=>'{}'));
const deliveryReport=JSON.parse(await fs.readFile(path.join(base,'report.json')));
for(const profile of ['desktop','mobile']){
 const dir=path.join(base,profile),manifest=JSON.parse(await fs.readFile(path.join(dir,'manifest.json')));
 const changes=[];
 // Mobile keeps its original material texture allocation. Desktop restores
 // twice the linear resolution on the main villa's color and baked light.
 if(profile==='desktop'&&!process.argv.includes('--lighting-only'))for(const part of manifest.parts.filter(p=>['architecture','interior'].includes(p.name))){
  const filename=path.join(dir,part.file),input=await fs.readFile(filename),jsonBytes=input.readUInt32LE(12);
  const doc=JSON.parse(input.subarray(20,20+jsonBytes)),bin=input.subarray(28+jsonBytes);
  const authored=JSON.parse(await fs.readFile(path.join(source,part.name+'.gltf'))),byName=new Map(authored.materials.map(m=>[m.name,m]));
  const sourceFile=d=>d?path.join(source,decodeURIComponent(authored.images[authored.textures[d.index].source].uri)):null;
  const imageIndex=d=>d?doc.textures[d.index].extensions?.EXT_texture_webp?.source??doc.textures[d.index].source:null;
  const replacements=new Map();
  for(const material of doc.materials){
   const batch=material.extras.angoraBatch,mats=batch.materials.map(n=>byName.get(n));
   if(mats.some(m=>!m))throw Error('Missing authored material '+material.name);
   const size=1024,cell=size/batch.grid,pad=Math.round(batch.pad*size),inner=cell-2*pad,composites=[];
   for(let id=0;id<mats.length;id++){
    const m=mats[id],pbr=m.pbrMetallicRoughness??{},factor=pbr.baseColorFactor??[1,1,1,1],file=sourceFile(pbr.baseColorTexture);
    const pixels=file?await sharp(file).resize(inner,inner).ensureAlpha().raw().toBuffer():Buffer.alloc(inner*inner*4,255);
    const transparent=Boolean(m.extensions?.KHR_materials_transmission?.transmissionFactor)||m.alphaMode==='BLEND';
    for(let i=0;i<pixels.length;i+=4){
     for(let k=0;k<3;k++)pixels[i+k]=Math.round(255*srgb(linear(pixels[i+k]/255)*factor[k]));
     pixels[i+3]=Math.round(pixels[i+3]*factor[3]*(transparent?.26:1));
    }
    const tile=await sharp(pixels,{raw:{width:inner,height:inner,channels:4}}).extend({top:pad,bottom:pad,left:pad,right:pad,extendWith:'repeat'}).png().toBuffer();
    composites.push({input:tile,left:(id%batch.grid)*cell,top:Math.floor(id/batch.grid)*cell});
   }
   const color=await sharp({create:{width:size,height:size,channels:4,background:'#ffffff'}}).composite(composites).webp({quality:90}).toBuffer();
   replacements.set(imageIndex(material.pbrMetallicRoughness.baseColorTexture),color);
   for(const [target,desc] of [[material.occlusionTexture,mats[0].occlusionTexture],[material.emissiveTexture,mats[0].extras?.angoraLightMapTexture]]){
    if(target&&desc)replacements.set(imageIndex(target),await sharp(sourceFile(desc)).resize(1024,1024).webp({quality:93}).toBuffer());
   }
  }
  const views=new Map([...replacements].map(([i,data])=>[doc.images[i].bufferView,data]));
  const chunks=[];let offset=0;const geometryHashes=[];
  for(let i=0;i<doc.bufferViews.length;i++){
   const view=doc.bufferViews[i],old=bin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength),data=views.get(i)??old;
   if(!views.has(i))geometryHashes.push(sha(data));
   view.byteOffset=offset;view.byteLength=data.length;chunks.push(data);offset+=data.length;
   const padding=(4-offset%4)%4;if(padding){chunks.push(Buffer.alloc(padding));offset+=padding;}
  }
  doc.buffers[0].byteLength=offset;
  const json=Buffer.from(JSON.stringify(doc)),padded=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]),output=Buffer.alloc(28+padded.length+offset);
  output.writeUInt32LE(0x46546c67,0);output.writeUInt32LE(2,4);output.writeUInt32LE(output.length,8);
  output.writeUInt32LE(padded.length,12);output.writeUInt32LE(0x4e4f534a,16);padded.copy(output,20);
  output.writeUInt32LE(offset,20+padded.length);output.writeUInt32LE(0x004e4942,24+padded.length);Buffer.concat(chunks).copy(output,28+padded.length);
  // Exact compressed stream checks, not only triangle counts.
  for(const mesh of doc.meshes)for(const primitive of mesh.primitives){
   const index=primitive.extensions.KHR_draco_mesh_compression.bufferView,v=doc.bufferViews[index];
   const oldDoc=JSON.parse(input.subarray(20,20+jsonBytes)),ov=oldDoc.bufferViews[index];
   if(sha(bin.subarray(ov.byteOffset??0,(ov.byteOffset??0)+ov.byteLength))!==sha(output.subarray(28+padded.length+v.byteOffset,28+padded.length+v.byteOffset+v.byteLength)))throw Error('Geometry changed');
  }
  await fs.writeFile(filename,output);part.gpu_sha256=sha(output);
  changes.push({part:part.name,beforeBytes:input.length,afterBytes:output.length,images:replacements.size,compressedGeometryUnchanged:true});
 }
 const baked=JSON.parse(await fs.readFile(path.join(base,'lighting/electric-bake.json')));
 manifest.electric_light=[];
 for(const map of baked.maps){
  const size=profile==='desktop'?1024:512,file=`../lighting/${map.stem}-${profile}.webp`;
  const bytes=await sharp(path.join(base,'lighting',map.stem+'.png')).resize(size,size).blur(.4).webp({quality:92}).toBuffer();
  await fs.writeFile(path.join(dir,file),bytes);
  manifest.electric_light.push({materials:map.materials,intensity:map.intensity,size,file,bytes:bytes.length,sha256:sha(bytes)});
 }
 // Visibility geometry is unchanged; refresh its whole-file provenance hash.
 for(const key of ['ground_light','floor_light'])for(const name of Object.keys(manifest[key].sourceGeometryHashes))manifest[key].sourceGeometryHashes[name]=sha(await fs.readFile(path.join(base,'desktop',name+'.glb')));
 let bytes=0;for(const part of manifest.parts){const n=(await fs.stat(path.join(dir,part.file))).size;bytes+=n;deliveryReport.profiles[profile].parts.find(p=>p.name===part.name).bytes=n;}
 deliveryReport.profiles[profile].bytes=bytes;
 manifest.texture_limits={materialMax:profile==='desktop'?1024:512,packageMaxMiB:profile==='desktop'?24:17};
 const probes=JSON.parse(await fs.readFile(path.join(base,'lighting/room-probes.json')));
 manifest.room_probes=[];
 for(const probe of probes.filter(p=>p.profile===profile)){
  const data=await fs.readFile(path.join(base,'lighting',probe.file));
  manifest.room_probes.push({...probe,file:'../lighting/'+probe.file,bytes:data.length,sha256:sha(data)});
 }
 record.profiles[profile]={...previousDetail.profiles?.[profile],changes:changes.length?changes:previousDetail.profiles?.[profile]?.changes??[],modelBytes:bytes,electricBytes:manifest.electric_light.reduce((n,m)=>n+m.bytes,0),reflectionBytes:manifest.room_probes.reduce((n,m)=>n+m.bytes,0)};
 record.profiles[profile].sceneAssetBytes=bytes+record.profiles[profile].electricBytes+record.profiles[profile].reflectionBytes+21748;
 if(bytes+record.profiles[profile].electricBytes+record.profiles[profile].reflectionBytes>manifest.texture_limits.packageMaxMiB*1024**2)throw Error('Delivery byte budget exceeded');
 await fs.writeFile(path.join(dir,'manifest.json'),JSON.stringify(manifest));
}
await fs.writeFile(path.join(base,'detail-report.json'),JSON.stringify(record,null,2));
await fs.writeFile(path.join(base,'report.json'),JSON.stringify(deliveryReport,null,2));
console.log(JSON.stringify(record));
