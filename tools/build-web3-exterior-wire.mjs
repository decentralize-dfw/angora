// Offline visibility baking. The delivered runtime receives ONLY lines + bitmasks.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync,gunzipSync} from 'node:zlib';
import * as THREE from '../.runtime/web3-wire/node_modules/three/build/three.module.js';
import {MeshBVH} from '../.runtime/web3-wire/node_modules/three-mesh-bvh/src/index.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const input=path.join(root,'assets/residence/wireframe');
const output=path.join(root,'assets/web3/wire');await fs.mkdir(output,{recursive:true});
const source=JSON.parse(await fs.readFile(path.join(input,'manifest.json'),'utf8'));
const raw=gunzipSync(await fs.readFile(path.join(input,'near-context.bin.gz')));
const lines=new Int16Array(raw.buffer,raw.byteOffset,raw.length/2);
const depth=gunzipSync(await fs.readFile(path.join(input,'hidden-edges.bin.gz')));
const count=depth.readUInt32LE(0),indicesCount=depth.readUInt32LE(4);
const packedPositions=new Int16Array(depth.buffer,depth.byteOffset+8,count*3);
const positions=Float32Array.from(packedPositions,n=>n*source.quantum);
const offset=Math.ceil((8+count*6)/4)*4;
const indices=Uint32Array.from(new Uint32Array(depth.buffer,depth.byteOffset+offset,indicesCount));
const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setIndex(new THREE.BufferAttribute(indices,1));
const bvh=new MeshBVH(geometry,{maxLeafTris:12});
const angles=32,ray=new THREE.Ray(),towards=new THREE.Vector3(),mid=new THREE.Vector3();
const vertices=[],masks=[],groups=[];let radius=0,height=0;
const villa=source.groups.find(g=>g.name==='villa');
for(let i=villa.start*3;i<(villa.start+villa.count)*3;i+=3){radius=Math.max(radius,Math.hypot(lines[i],lines[i+2])*source.quantum);height=Math.max(height,Math.abs(lines[i+1])*source.quantum);}
for(const group of source.groups){
 const start=vertices.length/3;let kept=0;
 for(let v=group.start;v<group.start+group.count;v+=2){
   const i=v*3;mid.set((lines[i]+lines[i+3])*.5*source.quantum,(lines[i+1]+lines[i+4])*.5*source.quantum,(lines[i+2]+lines[i+5])*.5*source.quantum);
   let mask=0;
   for(let a=0;a<angles;a++){
     const yaw=a*Math.PI*2/angles;towards.set(-.88*Math.sin(yaw),.475,.88*Math.cos(yaw)).normalize();
     ray.origin.copy(mid).addScaledVector(towards,200);ray.direction.copy(towards).negate();
     const hit=bvh.raycastFirst(ray,THREE.DoubleSide);
     if(!hit||hit.distance>=199.94)mask=(mask|(1<<a))>>>0;
   }
   if(mask){for(let j=0;j<6;j++)vertices.push(lines[i+j]);masks.push(mask);kept++;}
 }
 groups.push({name:group.name,start,count:vertices.length/3-start});
 console.log(`${group.name}: ${kept} exterior lines from ${group.count/2}`);
}
const packed=new Int16Array(vertices),maskOffset=Math.ceil((8+packed.byteLength)/4)*4,buffer=Buffer.alloc(maskOffset+masks.length*4);
buffer.writeUInt32LE(vertices.length/3,0);buffer.writeUInt32LE(angles,4);Buffer.from(packed.buffer).copy(buffer,8);Buffer.from(new Uint32Array(masks).buffer).copy(buffer,maskOffset);
await fs.writeFile(path.join(output,'exterior.bin.gz'),gzipSync(buffer,{level:9}));
await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify({version:3,quantum:source.quantum,target:source.target,groups,vertices:vertices.length/3,visibilityAngles:angles,maskOffset,fit:{radius,height},source:'Native architectural edges; exterior visibility baked offline. Runtime has no surfaces, mesh, depth buffer or textures.'},null,2));
console.log(`Delivered ${masks.length} exterior line segments, ${angles} view masks.`);
