import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const {default:sharp}=await import(process.env.ANGORA_SHARP_MODULE??'sharp');
const root=new URL('../../build/web/batched/',import.meta.url),descriptors={};
for(const stem of ['ground-light','floor-light']){
 const meta=JSON.parse(await fs.readFile(new URL(`lighting/${stem}.json`,root)));
 const bytes=await sharp(fileURLToPath(new URL(`lighting/${stem}.png`,root))).blur(.55).webp({lossless:true}).toBuffer();
 await fs.writeFile(new URL(`lighting/${stem}.webp`,root),bytes);
 descriptors[stem.replace('-','_')]={...meta,file:`../lighting/${stem}.webp`,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
}
for(const profile of ['desktop','mobile']){
 const file=new URL(`${profile}/manifest.json`,root),manifest=JSON.parse(await fs.readFile(file));
 await fs.writeFile(file,JSON.stringify({...manifest,...descriptors}));
}
console.log('Shared visibility maps:',Object.values(descriptors).reduce((sum,d)=>sum+d.bytes,0),'bytes');
