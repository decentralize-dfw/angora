// Verify the visible floor finish after Draco decoding, not just source slots.
import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco from 'draco3dgltf';
import {Matrix4,Vector3} from 'three';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco.createDecoderModule()});
const samples=[{name:'Attic bathroom',x:1,z:-6.6,y:9.43,material:'R31 | R33 attic cream tile'},{name:'Garage',x:5.8,z:-2,y:3.1,material:'stone_tile'},{name:'Service room',x:6,z:-5.85,y:3.1,material:'stone_tile'}];
for(const profile of ['desktop','mobile']){
 const doc=await io.read(`build/web/batched/${profile}/architecture.glb`),hits=samples.map(()=>[]);
 for(const node of doc.getRoot().listNodes())for(const p of node.getMesh()?.listPrimitives()??[]){
  const a=p.getAttribute('POSITION').getArray(),ids=p.getIndices().getArray(),batch=p.getAttribute('_BATCHID')?.getArray(),material=p.getMaterial(),names=material.getExtras().angoraBatch?.materials;
  const matrix=new Matrix4().fromArray(node.getWorldMatrix()),v=new Vector3();
  for(let i=0;i<ids.length;i+=3){
   const t=Array.from(ids.slice(i,i+3),id=>v.fromArray(a,id*3).applyMatrix4(matrix).toArray());
   if(Math.max(...t.map(p=>p[1]))-Math.min(...t.map(p=>p[1]))>.004)continue;
   if(Math.abs((t[1][0]-t[0][0])*(t[2][2]-t[0][2])-(t[1][2]-t[0][2])*(t[2][0]-t[0][0]))<1e-7)continue;
   const y=t.reduce((s,p)=>s+p[1],0)/3;
   for(const [j,q] of samples.entries()){
    if(Math.abs(y-q.y)>.12)continue;
    const cross=(a,b)=>(b[0]-a[0])*(q.z-a[2])-(b[2]-a[2])*(q.x-a[0]),s=t.map((a,k)=>cross(a,t[(k+1)%3]));
    if(s.every(n=>n>=0)||s.every(n=>n<=0))hits[j].push({y,material:names?.[Math.round(batch[ids[i]])]??material.getName()});
   }
  }
 }
 samples.forEach((q,j)=>{const top=hits[j].sort((a,b)=>b.y-a.y)[0];assert.equal(top?.material,q.material,`${profile}: ${q.name}: ${JSON.stringify(hits[j])}`);console.log(profile,q.name,top.material,top.y.toFixed(4));});
}
