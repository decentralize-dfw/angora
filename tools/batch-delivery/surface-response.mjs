import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const source=path.resolve(process.argv[2]??path.join(repo,'../model-finalization/web'));
export function opticalResponse(material){
 const e=material.extensions??{},ior=e.KHR_materials_ior?.ior??1.5;
 const spec=e.KHR_materials_specular??{},coat=e.KHR_materials_clearcoat??{};
 const f0=((ior-1)/(ior+1))**2;
 return {f0:(spec.specularColorFactor??[1,1,1]).map(x=>Math.min(1,x*f0)*(spec.specularFactor??1)),
  coat:coat.clearcoatFactor??0,coatRoughness:coat.clearcoatRoughnessFactor??0};
}
export async function sourceResponses(source,parts){
 const result={};
 for(const {name} of parts){
  const data=JSON.parse(await fs.readFile(path.join(source,name+'.gltf')));
  result[name]=Object.fromEntries(data.materials.map(m=>[m.name,opticalResponse(m)]));
 }
 return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 for(const profile of ['desktop','mobile']){
  const file=path.join(repo,'build/web/batched',profile,'manifest.json');
  const manifest=JSON.parse(await fs.readFile(file));
  manifest.surface_response=await sourceResponses(source,manifest.parts);
  await fs.writeFile(file,JSON.stringify(manifest));
 }
}
