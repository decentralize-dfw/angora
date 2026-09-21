import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco from 'draco3dgltf';
import {Matrix4,Matrix3,Vector3} from 'three';
const root=path.resolve(import.meta.dirname,'../..');
const source='E:/angora/EXPORT 2 GLB AYRIK/DENEME/BUILDING-2.glb';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco.createDecoderModule()});
const doc=await io.read(source),node=doc.getRoot().listNodes().find(n=>n.getName()==='interior');
if(!node)throw Error('Owner structural interior mesh missing');
const positions=[],normals=[],uv=[],indices=[];
for(const primitive of node.getMesh().listPrimitives()){
 const p=primitive.getAttribute('POSITION').getArray(),normal=primitive.getAttribute('NORMAL')?.getArray(),tex=primitive.getAttribute('TEXCOORD_0')?.getArray(),ids=primitive.getIndices().getArray();
 const matrix=new Matrix4().fromArray(node.getWorldMatrix()),nm=new Matrix3().getNormalMatrix(matrix),v=new Vector3();
 const world=Array.from({length:p.length/3},(_,i)=>v.fromArray(p,i*3).applyMatrix4(matrix).toArray());
 const parent=Array.from({length:ids.length/3},(_,i)=>i),seen=new Map();
 const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 for(let i=0;i<ids.length;i++){const key=world[ids[i]].map(x=>x.toFixed(4)).join(','),t=Math.floor(i/3);if(seen.has(key))parent[find(t)]=find(seen.get(key));else seen.set(key,t);}
 const groups=new Map();for(let i=0;i<ids.length;i+=3){const key=find(i/3);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(...ids.slice(i,i+3));}
 for(const group of groups.values()){
  const bounds=[0,1,2].map(k=>[Math.min(...group.map(i=>world[i][k])),Math.max(...group.map(i=>world[i][k]))]);
  if(!(bounds[0][0]>.5&&bounds[0][1]<4.4&&bounds[1][0]>-.4&&bounds[1][1]<3.2&&bounds[2][0]>-3.4&&bounds[2][1]<-.7))continue;
  for(const id of group){indices.push(positions.length/3);positions.push(...world[id]);normals.push(...(normal?v.fromArray(normal,id*3).applyMatrix3(nm).normalize().toArray():[0,1,0]));uv.push(...(tex?Array.from(tex.slice(id*2,id*2+2)):[world[id][0],world[id][2]]));}
 }
}
if(indices.length!==148*3)throw Error(`Unexpected owner basement component: ${indices.length/3} triangles`);
const result={source,source_sha256:createHash('sha256').update(await fs.readFile(source)).digest('hex'),name:'Owner original solid basement stair',triangles:indices.length/3,attributes:{POSITION:positions,NORMAL:normals,TEXCOORD_0:uv},indices};
await fs.writeFile(path.join(root,'.runtime/finishing/owner-solid-stair.json'),JSON.stringify(result));
console.log(result.name,result.triangles,result.source_sha256);
