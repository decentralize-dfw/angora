// Telefon için Tur 10 modelleri: ktx512 ile AYNI geometri (bufferView'lar bayt bayt korunur,
// pişmiş ışık UV1'i kaymaz), dokular 512 px UASTC yerine 512 px ETC1S (BasisLZ).
// ETC1S UASTC'nin ~1/4-1/6'sı kadar iner ve telefonda çok daha hızlı çözülür (transcode).
//   TOKTX=/yol/toktx node make-mobile-tur10.mjs        (Linux'ta gerekirse LD_LIBRARY_PATH)
//   MODELS=BUILDING-opt-v6,INTERIOR-opt-v3 ...         yalnız verilenler
// Çıktı: build/web/26092026/mobile-tur10/<ad>.ktx2.glb + conversion.json
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
const root=path.resolve(import.meta.dirname,'../..');
const base=path.join(root,'build/web/26092026');
const out=path.join(base,'mobile-tur10');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'angora-mobil-'));
const tool=process.env.TOKTX;
if(!tool)throw Error('TOKTX is required');
const QLEVEL=+(process.env.QLEVEL||192);
fs.mkdirSync(out,{recursive:true});
const ONLY=process.env.MODELS?process.env.MODELS.split(','):null;
const rp=path.join(out,'conversion.json');
const report=ONLY&&fs.existsSync(rp)?JSON.parse(fs.readFileSync(rp)):{models:{},textures:[],geometryUnchanged:true,codec:'etc1s'};
if(ONLY)report.textures=report.textures.filter(t=>!ONLY.some(n=>t.label.startsWith(n+':')));
async function encode(data,srgb,label,max=512){
 const png=path.join(temp,'in.png'),ktx=path.join(temp,'out.ktx2');
 const meta=await sharp(data).metadata();
 await sharp(data).resize({width:max,height:max,fit:'inside',withoutEnlargement:true}).png().toFile(png);
 execFileSync(tool,['--t2','--encode','etc1s','--clevel','2','--qlevel',String(QLEVEL),'--genmipmap','--assign_oetf',srgb?'srgb':'linear',ktx,png],{stdio:'pipe'});
 const b=fs.readFileSync(ktx);
 report.textures.push({label,width:b.readUInt32LE(20),height:b.readUInt32LE(24),sourceWidth:meta.width,sourceHeight:meta.height,bytes:b.length,srgb});
 return b;
}
for(const name of ONLY??['BUILDING-opt-v6','INTERIOR-opt-v3','GARDEN-opt-v3','KOMSULAR-opt-v2','CEVRE-YOL-opt-v3']){
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
 report.models[name]={file:'mobile-tur10/'+name+'.ktx2.glb',bytes:fs.statSync(dest).size,textures:newImages.length};console.log(name,report.models[name]);
}
fs.writeFileSync(rp,JSON.stringify(report,null,1)+'\n');
fs.rmSync(temp,{recursive:true,force:true});
console.log('DONE',report.textures.length,'textures; geometry unchanged');
