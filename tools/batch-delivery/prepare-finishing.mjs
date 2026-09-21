import fs from 'node:fs/promises';
import path from 'node:path';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco from 'draco3dgltf';
import {Matrix4,Matrix3,Vector3} from 'three';
const root=path.resolve(import.meta.dirname,'../..'),source=path.resolve(root,'../model-finalization/web'),out=path.join(root,'.runtime/finishing');
await fs.mkdir(out,{recursive:true});
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco.createDecoderModule()});
const items=[];
for(const part of ['architecture','interior','garden','context-ground']){
 const doc=await io.read(path.join(source,part+'.gltf'));
 for(const node of doc.getRoot().listNodes())for(const [pi,p] of (node.getMesh()?.listPrimitives()??[]).entries()){
  const name=node.getName(),mat=p.getMaterial().getName();
  if(part==='architecture'&&!/interior\.001|ceiling|wood_floor|Restored stair|stucco|cream tile|wall tile|wall ceramic|ochre tile|mosaic band|roof\.003|white_trim \(4\)/i.test(name))continue;
  if(part==='interior'&&!/curtain|drape|picture|artwork/i.test(name))continue;
  if(part==='context-ground'&&!/grass|terrain|ground|soil/i.test(mat+' '+name))continue;
  const world=new Matrix4().fromArray(node.getWorldMatrix()),normal=new Matrix3().getNormalMatrix(world),v=new Vector3();
  const attributes=Object.fromEntries(p.listSemantics().map(k=>[k,Array.from(p.getAttribute(k).getArray())]));
  for(let i=0;i<attributes.POSITION.length;i+=3){v.fromArray(attributes.POSITION,i).applyMatrix4(world).toArray(attributes.POSITION,i);if(attributes.NORMAL)v.fromArray(attributes.NORMAL,i).applyMatrix3(normal).normalize().toArray(attributes.NORMAL,i);}
  items.push({part,name,pi,material:mat,attributes,indices:Array.from(p.getIndices()?.getArray()??Array.from({length:attributes.POSITION.length/3},(_,i)=>i))});
 }
}
await fs.writeFile(path.join(out,'input.json'),JSON.stringify(items));
console.log(items.map(x=>[x.part,x.name,x.indices.length/3]));
