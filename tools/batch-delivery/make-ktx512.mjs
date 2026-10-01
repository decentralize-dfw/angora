// Texture-only GLB rewrite: geometry bufferViews and accessors remain byte-identical.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
const root=path.resolve(import.meta.dirname,'../..');
const base=path.join(root,'build/web/26092026');
const out=path.join(base,'ktx512');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'angora-ktx512-'));
const tool=process.env.TOKTX;
if(!tool)throw Error('TOKTX is required');
fs.mkdirSync(out,{recursive:true});
// MODELS=BUILDING-opt-v6 gibi: yalnız verilen modeller yeniden üretilir, rapordaki diğerleri korunur
const ONLY=process.env.MODELS?process.env.MODELS.split(','):null;
const report=process.env.LIGHTMAPS_ONLY||ONLY?JSON.parse(fs.readFileSync(path.join(out,'conversion.json'))):{models:{},textures:[],geometryUnchanged:true};
if(ONLY)report.textures=report.textures.filter(t=>!ONLY.some(n=>t.label.startsWith(n+':')));
if(process.env.LIGHTMAPS_ONLY||ONLY)report.textures=report.textures.filter(t=>!t.label.endsWith('.ktx2'));
async function encode(data,srgb,label,max=512){
 const png=path.join(temp,'in.png'),ktx=path.join(temp,'out.ktx2');
 const meta=await sharp(data).metadata();
 await sharp(data).resize({width:max,height:max,fit:'inside',withoutEnlargement:true}).png().toFile(png);
 execFileSync(tool,['--t2','--encode','uastc','--uastc_quality','2','--zcmp','18','--genmipmap','--assign_oetf',srgb?'srgb':'linear',ktx,png],{stdio:'pipe'});
 const b=fs.readFileSync(ktx);
 report.textures.push({label,width:b.readUInt32LE(20),height:b.readUInt32LE(24),sourceWidth:meta.width,sourceHeight:meta.height,bytes:b.length,srgb});
 return b;
}
for(const name of (process.env.LIGHTMAPS_ONLY?[]:ONLY??['BUILDING-opt-v6','INTERIOR-opt-v3','GARDEN-opt-v3','KOMSULAR-opt-v2','CEVRE-YOL-opt-v3'])){
 const src=fs.readFileSync(path.join(base,name+'.glb'));
 const jl=src.readUInt32LE(12),g=JSON.parse(src.subarray(20,20+jl).toString());
 const bin=src.subarray(28+jl,28+jl+src.readUInt32LE(20+jl));
 const originalGeometry=JSON.stringify({meshes:g.meshes,accessors:g.accessors,nodes:g.nodes});
 const views=g.bufferViews.map(v=>Buffer.from(bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength)));
 const srgbTextures=new Set();
 for(const m of g.materials||[]){for(const t of [m.pbrMetallicRoughness?.baseColorTexture,m.emissiveTexture,m.extensions?.KHR_materials_pbrSpecularGlossiness?.diffuseTexture])if(t)srgbTextures.add(t.index);}
 const newImages=[],cache=new Map(),replaced=new Set();
 for(const [ti,t] of (g.textures||[]).entries()){
  const ii=t.extensions?.EXT_texture_webp?.source??t.extensions?.KHR_texture_basisu?.source??t.source;
  const key=ii+':'+srgbTextures.has(ti);
  if(!cache.has(key)){
   const im=g.images[ii];if(im.bufferView===undefined)throw Error('External image: '+name);
   const data=await encode(views[im.bufferView],srgbTextures.has(ti),name+':'+ii);
   const vi=replaced.has(im.bufferView)?views.length:im.bufferView;
   views[vi]=data;g.bufferViews[vi]={buffer:0,byteLength:data.length};replaced.add(im.bufferView);
   cache.set(key,newImages.length);newImages.push({name:im.name,mimeType:'image/ktx2',bufferView:vi});
  }
  delete t.source;t.extensions={...t.extensions,KHR_texture_basisu:{source:cache.get(key)}};delete t.extensions.EXT_texture_webp;
 }
 // Preserve bufferView indices; only image buffers are replaced.
 g.images=newImages;
 for(const k of ['extensionsUsed','extensionsRequired'])g[k]=[...new Set([...(g[k]||[]).filter(x=>x!=='EXT_texture_webp'),'KHR_texture_basisu'])];
 const chunks=[];let offset=0;
 for(let i=0;i<views.length;i++){g.bufferViews[i].byteOffset=offset;chunks.push(views[i]);offset+=views[i].length;const p=(4-offset%4)%4;if(p){chunks.push(Buffer.alloc(p));offset+=p;}}
 g.buffers[0].byteLength=offset;
 if(originalGeometry!==JSON.stringify({meshes:g.meshes,accessors:g.accessors,nodes:g.nodes}))throw Error('Geometry changed');
 const jb=Buffer.from(JSON.stringify(g));const json=Buffer.concat([jb,Buffer.alloc((4-jb.length%4)%4,32)]),body=Buffer.concat(chunks);
 const h=Buffer.alloc(20);h.writeUInt32LE(0x46546c67);h.writeUInt32LE(2,4);h.writeUInt32LE(28+json.length+body.length,8);h.writeUInt32LE(json.length,12);h.writeUInt32LE(0x4e4f534a,16);
 const bh=Buffer.alloc(8);bh.writeUInt32LE(body.length);bh.writeUInt32LE(0x004e4942,4);
 const dest=path.join(out,name+'.ktx2.glb');fs.writeFileSync(dest,Buffer.concat([h,json,bh,body]));
 report.models[name]={file:'ktx512/'+name+'.ktx2.glb',bytes:fs.statSync(dest).size,textures:newImages.length};console.log(name,report.models[name]);
}
const lmSource=process.env.LIGHTMAP_SOURCE;
if(!lmSource)throw Error('LIGHTMAP_SOURCE is required');
const spec=JSON.parse(fs.readFileSync(path.join(lmSource,'lightmaps.json')));
const lmOut=path.join(base,'lightmaps-tur10-512');fs.mkdirSync(lmOut,{recursive:true});
const lmFull=path.join(base,'lightmaps-tur10');fs.mkdirSync(lmFull,{recursive:true});
for(const [atlas,a] of Object.entries(spec.atlaslar))for(const [state,m]of Object.entries(a.haritalar)){
 const file=atlas+'_'+state+'.ktx2';
 // Resample irradiance rather than its sqrt encoding, preserving average light energy.
 const {data,info}=await sharp(path.join(lmSource,atlas+'_'+state+'.png')).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const sx=info.width/512,sy=info.height/512;
 if(!Number.isInteger(sx)||!Number.isInteger(sy)||sx<1||sy<1)throw Error('Expected power-of-two lightmap');
 const pixels=Buffer.alloc(512*512*info.channels);
 for(let y=0;y<512;y++)for(let x=0;x<512;x++)for(let c=0;c<info.channels;c++){
  let sum=0;for(let dy=0;dy<sy;dy++)for(let dx=0;dx<sx;dx++){const v=data[((y*sy+dy)*info.width+x*sx+dx)*info.channels+c];sum+=v*v;}
  pixels[(y*512+x)*info.channels+c]=Math.round(Math.sqrt(sum/(sx*sy)));
 }
 const png=await sharp(pixels,{raw:{width:512,height:512,channels:info.channels}}).png().toBuffer();
 const b=await encode(png,false,file);fs.writeFileSync(path.join(lmOut,file),b);m.dosya=file;m.boyut=512;m.bytes=b.length;
 // masaüstü: pişirmenin web boyutu (iç gök/gece 2048, güneş 1024) KÜÇÜLTMEDEN. 512'ye küçültmede dar
 // yüzeyler (kapı/kemer iç yüzü, duvar ucu) 1-2 piksele düşüp komşu parçanın ışığını alıyordu: duvarda koyu iz.
 const full=await sharp(path.join(lmSource,atlas+'_'+state+'.png')).removeAlpha().png().toBuffer();
 const bf=await encode(full,false,'tam_'+file,4096);fs.writeFileSync(path.join(lmFull,file),bf);m.boyutTam=info.width;m.bytesTam=bf.length;
 console.log(file,b.length,'tam',info.width,bf.length);
}
spec.kok='lightmaps-tur10-512/';spec.uretim='tools/batch-delivery/make-ktx512.mjs';
fs.writeFileSync(path.join(root,'viewer/src/villa-lightmaps-tur10.json'),JSON.stringify(spec,null,2)+'\n');
fs.writeFileSync(path.join(out,'conversion.json'),JSON.stringify(report,null,2)+'\n');
console.log('DONE',report.textures.length,'textures; geometry unchanged');
if(path.dirname(temp)===os.tmpdir()&&path.basename(temp).startsWith('angora-ktx512-'))fs.rmSync(temp,{recursive:true});
