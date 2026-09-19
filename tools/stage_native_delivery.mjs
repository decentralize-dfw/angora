// Stage the dependency closure of a native delivery without its source scenes,
// unused exemplars, historical textures or local machine paths. Never publish.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('Usage: node tools/stage_native_delivery.mjs <source web folder> <destination>');
const source=path.resolve(input),destination=path.resolve(output);
if(source===destination)throw Error('Staging must not overwrite the working export');
if(destination===path.parse(destination).root||source.startsWith(destination+path.sep))throw Error('Unsafe staging directory');
let previousPackage=false;
try{const previous=JSON.parse(await fs.readFile(path.join(destination,'package-verification.json'),'utf8'));previousPackage=Array.isArray(previous.files)&&previous.published===false;}catch{}
const manifest=JSON.parse(await fs.readFile(path.join(source,'manifest.json'),'utf8'));
if(!manifest.source_native_sha256||!manifest.interior_streams?.length)throw Error('Expected finalized native runtime manifest');
const active=new Set(['architecture','garden','plot-grass','villa-context-white','context-ground','context-buildings','context-plants']);
manifest.parts=manifest.parts.filter(part=>active.has(part.name));
for(const name of active)if(!manifest.parts.some(part=>part.name===name))throw Error('Missing active part '+name);
delete manifest.source;
const files=new Map();
function safe(root,name){const resolved=path.resolve(root,name);if(!resolved.startsWith(root+path.sep))throw Error('Path escapes package: '+name);return resolved;}
async function copy(name,bytes){
 const target=safe(destination,name);await fs.mkdir(path.dirname(target),{recursive:true});
 bytes??=await fs.readFile(safe(source,name));await fs.writeFile(target,bytes);
 files.set(name,{file:name,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
for(const part of [...manifest.parts,...manifest.interior_streams]){
 const name=part.file.replace(/\.gltf$/,'.gpu.gltf'),bytes=await fs.readFile(safe(source,name));
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==part.gpu_sha256)throw Error('Stale runtime hash '+name);
 const doc=JSON.parse(bytes);
 for(const ref of [...doc.buffers??[],...doc.images??[]]){
  if(!ref.uri||ref.uri.startsWith('data:'))continue;
  if(/^[a-z]+:/i.test(ref.uri))throw Error('Remote dependency '+ref.uri);
  const relative=path.join(path.dirname(name),decodeURIComponent(ref.uri));if(!files.has(relative))await copy(relative);
 }
 await copy(name,bytes);
}
for(const field of ['sections','lights','rooms','navigation','site_context','plot_boundary','soil_section']){
 if(!manifest[field])continue;
 const original=path.resolve(source,manifest[field]);
 // Runtime metadata in the working export sits one directory above web.
 if(!original.startsWith(path.dirname(source)+path.sep))throw Error('Metadata escapes working delivery');
 const name=path.basename(original);await copy(name,await fs.readFile(original));manifest[field]=name;
}
await copy('manifest.json',Buffer.from(JSON.stringify(manifest,null,2)));
for(const entry of files.values()){
 const actual=crypto.createHash('sha256').update(await fs.readFile(safe(destination,entry.file))).digest('hex');
 if(actual!==entry.sha256)throw Error('Staged byte mismatch '+entry.file);
}
// Only a recognized generated package may be pruned, and only after every
// replacement file has been verified. Old unhashed buffers otherwise survive
// subsequent staging and silently double the checked-in/downloadable package.
if(previousPackage){
 async function prune(folder){
  for(const entry of await fs.readdir(folder,{withFileTypes:true})){
   const target=safe(destination,path.relative(destination,path.join(folder,entry.name)));
   if(entry.isDirectory())await prune(target);
   else if(entry.isFile()){
    const relative=path.relative(destination,target);
    if(relative!=='package-verification.json'&&!files.has(relative))await fs.unlink(target);
   }
  }
 }
 await prune(destination);
}
const report={sourceRevision:manifest.source_native_sha256,files:[...files.values()],totalBytes:[...files.values()].reduce((n,f)=>n+f.bytes,0),published:false};
await fs.writeFile(path.join(destination,'package-verification.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({files:files.size,MiB:report.totalBytes/1048576,destination,published:false}));
