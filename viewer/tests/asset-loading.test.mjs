import test from 'node:test';
import assert from 'node:assert/strict';
import {assetLoadBudget,createLoadQueue} from '../src/asset-loading.js';
import * as THREE from 'three';
import {prepareMaterialResponse,setMaterialScale,setInteriorMode} from '../src/material-response.js';

test('Phone model and cap decodes do not overlap; a failed load releases its slot',async()=>{
 const budget=assetLoadBudget({compact:true,cores:16}),enqueue=createLoadQueue(budget.models);
 assert.equal(budget.draco,1);assert.equal(budget.textures,1);
 let active=0,peak=0;const completed=[];
 const result=await Promise.allSettled(['envelope','cap','interior','garden'].map(name=>enqueue(async()=>{
   active++;peak=Math.max(peak,active);
   try{await new Promise(resolve=>setTimeout(resolve,3));if(name==='cap')throw Error('Fixture load failure');completed.push(name);return name;}
   finally{active--;}
 })));
 assert.equal(peak,1);assert.equal(active,0);assert.equal(result[1].status,'rejected');
 assert.deepEqual(completed,['envelope','interior','garden']);
});

test('Desktop retains two concurrent model requests',async()=>{
 const enqueue=createLoadQueue(assetLoadBudget({compact:false,cores:8}).models);let active=0,peak=0;
 await Promise.all(Array.from({length:4},()=>enqueue(async()=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,3));active--;})));
 assert.equal(peak,2);
});

test('Authored PBR survives legacy presentation, floor changes and walk mode',()=>{
 for(const name of ['ceiling.003','interior.001','Clay tile','wood_floor','STRUCCO']){
   const m=new THREE.MeshStandardMaterial({name,color:0xaabbcc,roughness:.42,metalness:.12,map:new THREE.Texture(),normalMap:new THREE.Texture(),roughnessMap:new THREE.Texture(),aoMap:new THREE.Texture()});
   m.userData.angoraAuthoredPBR=true;m.normalScale.set(.7,.8);
   const maps=[m.map,m.normalMap,m.roughnessMap,m.aoMap],color=m.color.clone(),normal=m.normalScale.clone(),shader=m.onBeforeCompile;
   prepareMaterialResponse(m);for(const view of ['region','neighborhood','f1'])setMaterialScale(m,view);setInteriorMode(m,true);setInteriorMode(m,false);
   assert.deepEqual([m.map,m.normalMap,m.roughnessMap,m.aoMap],maps);assert.ok(m.color.equals(color));assert.ok(m.normalScale.equals(normal));assert.equal(m.roughness,.42);assert.equal(m.metalness,.12);assert.equal(m.onBeforeCompile,shader);assert.equal(m.emissiveIntensity,1);assert.equal(m.emissive.getHex(),0);
 }
});
