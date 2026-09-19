import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('../../build/web/native-current/',import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,root),'utf8'));
test('Authored AO survives export, including stone and retaining-wall duplicate-output regression',()=>{
 for(const [part,names] of Object.entries({architecture:['STRUCCO','INTERIOR','ceiling','Clay tile','WOOD-FL','stone_tile'],garden:['Retaining wall rough limestone.001'],'context-buildings':['neighbor_wall']})){
  const doc=read(part+'.gpu.gltf');
  for(const name of names){
   const index=doc.materials.findIndex(m=>m.name===name);assert.ok(index>=0,name);
   const ao=doc.materials[index].occlusionTexture;assert.ok(ao,name+' missing baked AO');
   const texture=doc.textures[ao.index];assert.ok(texture,name+' invalid AO texture');
   const image=doc.images[texture.extensions?.KHR_texture_basisu?.source??texture.source];
   assert.ok(image?.uri&&fs.existsSync(new URL(image.uri,root)),name+' missing AO payload');
   const users=doc.meshes.flatMap(m=>m.primitives).filter(p=>p.material===index);
   assert.ok(users.length,name+' unused material');
   for(const primitive of users)assert.ok(primitive.attributes['TEXCOORD_'+(ao.texCoord??0)]!==undefined,name+' missing AO UV');
  }
 }
});

test('Every material texture retains its UV set and optional compressed images retain source fallbacks',()=>{
 const manifest=read('manifest.json');
 const collect=value=>!value||typeof value!=='object'?[]:Object.entries(value).flatMap(([key,item])=>[
  ...(key.endsWith('Texture')&&Number.isInteger(item?.index)?[item]:[]),...collect(item)
 ]);
 for(const part of [...manifest.parts,...manifest.interior_streams]){
  const doc=read(part.file.replace(/\.gltf$/,'.gpu.gltf'));
  assert.ok(!doc.extensionsRequired?.includes('KHR_texture_basisu'),part.name+' requires lossy GPU fallback');
  for(const mesh of doc.meshes??[])for(const primitive of mesh.primitives){
   for(const slot of collect(doc.materials?.[primitive.material])){
    const channel=slot.extensions?.KHR_texture_transform?.texCoord??slot.texCoord??0;
    assert.ok(primitive.attributes['TEXCOORD_'+channel]!==undefined,part.name+' missing used UV '+channel);
   }
  }
  for(const texture of doc.textures??[]){
   assert.ok(doc.images[texture.source]?.uri,part.name+' missing original texture');
   assert.ok(fs.existsSync(new URL(doc.images[texture.source].uri,root)));
  }
 }
});
