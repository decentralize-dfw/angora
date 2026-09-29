import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=path.resolve(import.meta.dirname,'../../build/web/26092026');
function read(file){const b=fs.readFileSync(file),l=b.readUInt32LE(12);return {g:JSON.parse(b.subarray(20,20+l)),bin:b.subarray(28+l)};}
const report=JSON.parse(fs.readFileSync(path.join(base,'ktx512/conversion.json')));
let geometryViews=0,images=0;
for(const [name,m]of Object.entries(report.models)){
 const a=read(path.join(base,name+'.glb')),b=read(path.join(base,m.file));
 for(const key of ['meshes','nodes','accessors','materials','scenes'])assert.deepEqual(b.g[key],a.g[key],name+' '+key);
 const imageViews=new Set(a.g.images.map(i=>i.bufferView));
 for(const [i,v]of a.g.bufferViews.entries())if(!imageViews.has(i)){
  const w=b.g.bufferViews[i];assert.deepEqual(b.bin.subarray(w.byteOffset,w.byteOffset+w.byteLength),a.bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength),name+' geometry view '+i);geometryViews++;
 }
 for(const im of b.g.images){assert.equal(im.mimeType,'image/ktx2');const v=b.g.bufferViews[im.bufferView],d=b.bin.subarray(v.byteOffset,v.byteOffset+v.byteLength);assert.ok(d.readUInt32LE(20)<=512&&d.readUInt32LE(24)<=512);images++;}
}
const spec=JSON.parse(fs.readFileSync(path.resolve(base,'../../../viewer/src/villa-lightmaps-tur10.json')));
let maps=0;
for(const a of Object.values(spec.atlaslar))for(const m of Object.values(a.haritalar)){
 const b=fs.readFileSync(path.join(base,spec.kok,m.dosya));assert.equal(b.readUInt32LE(20),512);assert.equal(b.readUInt32LE(24),512);assert.ok(b.length>1000,'Blank lightmap');assert.ok(m.olcek>0);maps++;
}
assert.equal(maps,20);
console.log(JSON.stringify({models:Object.keys(report.models).length,geometryViewsByteIdentical:geometryViews,ktx2ModelTextures:images,maxTextureEdge:512,lightmaps:maps},null,2));
