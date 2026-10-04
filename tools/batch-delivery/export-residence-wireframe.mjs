// A line-only derivative of the delivered villa and its actual near context.
// Only white lines are visible. A compact colourless depth buffer suppresses
// hidden edges; no surface colour, materials, images or textures are exported.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import {MeshoptDecoder,MeshoptSimplifier} from 'meshoptimizer';
import * as THREE from 'three';
import {gzipSync} from 'node:zlib';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../../',import.meta.url));
const output=path.join(root,'assets/residence/wireframe');
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder':await draco3d.createDecoderModule(),
  'meshopt.decoder':MeshoptDecoder,
});
await Promise.all([MeshoptDecoder.ready,MeshoptSimplifier.ready]);
await mkdir(output,{recursive:true});
const sources=[
  {name:'villa',file:'build/web/26092026/BUILDING-opt-v6.glb',angle:35},
  {name:'garden',file:'build/web/26092026/GARDEN-opt-v3.glb',angle:38},
  {name:'neighbours',file:'build/web/26092026/KOMSULAR-opt-v2.glb',angle:40},
  {name:'landscape',file:'build/web/26092026/CEVRE-YOL-opt-v3.glb',angle:48},
  {name:'trees',file:'build/web/batched/desktop/context-plants.glb',angle:48},
];
const quantum=.005, radius=54, target=[-.7,4.7,-.4];
const groups=[],values=[],depthValues=[],matrix=new THREE.Matrix4();
for(const source of sources){
  const document=await io.read(path.join(root,source.file));
  const seen=new Set(),plantCells=new Map(),start=values.length/3,depthStart=depthValues.length/3;
  let primitives=0;
  for(const node of document.getRoot().listNodes()){
    const mesh=node.getMesh();if(!mesh)continue;
    matrix.fromArray(node.getWorldMatrix());
    for(const primitive of mesh.listPrimitives()){
      if(primitive.getMode()!==4)continue;
      const position=primitive.getAttribute('POSITION');if(!position)continue;
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.BufferAttribute(Float32Array.from(position.getArray()),3));
      const index=primitive.getIndices();if(index)geometry.setIndex(new THREE.BufferAttribute(index.getArray(),1));
      geometry.applyMatrix4(matrix);geometry.computeBoundingBox();
      const material=primitive.getMaterial()?.getName()||'';
      const organic=/tree|plant|leaf/i.test(material)||source.name==='trees';
      if(organic&&index){
        const indices=Uint32Array.from(geometry.index.array),positions=geometry.getAttribute('position').array;
        const targetCount=Math.floor(indices.length*.06/3)*3;
        const [simplified]=MeshoptSimplifier.simplify(indices,positions,3,targetCount,.004);
        geometry.setIndex(new THREE.BufferAttribute(simplified,1));
      }
      const box=geometry.boundingBox;
      if(box.max.x<target[0]-radius||box.min.x>target[0]+radius||box.max.z<target[2]-radius||box.min.z>target[2]+radius){geometry.dispose();continue;}
      const edges=new THREE.EdgesGeometry(geometry,source.angle);
      const p=edges.getAttribute('position');
      for(let i=0;i<p.count;i+=2){
        const a=[p.getX(i),p.getY(i),p.getZ(i)],b=[p.getX(i+1),p.getY(i+1),p.getZ(i+1)];
        const near=Math.min(Math.hypot(a[0]-target[0],a[2]-target[2]),Math.hypot(b[0]-target[0],b[2]-target[2]));
        if(near>radius)continue;
        // Sub-centimetre seams cannot contribute at this camera scale.
        const minimum=organic?.16:/clay/i.test(material)?1.1:/metal|gobek|zincir|desen|donanim/i.test(material)?.35:.09;
        if(Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])<minimum)continue;
        const qa=a.map((v,k)=>Math.round((v-target[k])/quantum)),qb=b.map((v,k)=>Math.round((v-target[k])/quantum));
        if([...qa,...qb].some(v=>Math.abs(v)>32767))throw Error('Position exceeded line quantization bounds');
        const ka=qa.join(','),kb=qb.join(','),key=ka<kb?ka+'|'+kb:kb+'|'+ka;
        if(seen.has(key))continue;seen.add(key);
        if(organic){
          // Keep the canopy's distribution without stacking hundreds of leaf
          // triangles into a bright knot at the presentation's camera scale.
          const cell=a.map((v,k)=>Math.floor(((v+b[k])/2-target[k])/.45)).join(',');
          const length=Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]),previous=plantCells.get(cell);
          if(!previous||length>previous.length)plantCells.set(cell,{length,points:[...qa,...qb]});
        }else values.push(...qa,...qb);
      }
      let depthIndices=geometry.index?.array;
      const positions=geometry.getAttribute('position').array;
      if(depthIndices&&!organic){
        [depthIndices]=MeshoptSimplifier.simplify(Uint32Array.from(depthIndices),positions,3,Math.floor(depthIndices.length*.3/3)*3,.00015);
      }
      // Fine fittings never need an occluder. The actual walls, windows, roof
      // and slabs alone reject the villa's hidden interior edge clutter.
      const occludes=!organic&&source.name!=='landscape'&&(source.name!=='villa'||/wall|stucco|roof|clay|ceiling|terra|WHT|stone_tile|glass|alci/i.test(material));
      if(depthIndices&&occludes)for(let i=0;i<depthIndices.length;i+=3){
        const vertices=[depthIndices[i],depthIndices[i+1],depthIndices[i+2]].map(j=>[positions[j*3],positions[j*3+1],positions[j*3+2]]);
        const mx=vertices.reduce((s,p)=>s+p[0],0)/3,mz=vertices.reduce((s,p)=>s+p[2],0)/3;
        if(Math.hypot(mx-target[0],mz-target[2])>radius)continue;
        for(const point of vertices)depthValues.push(...point.map((v,k)=>Math.round((v-target[k])/quantum)));
      }
      primitives++;edges.dispose();geometry.dispose();
    }
  }
  for(const edge of plantCells.values())values.push(...edge.points);
  const count=values.length/3-start;
  groups.push({name:source.name,start,count,depthStart,depthCount:depthValues.length/3-depthStart,source:source.file,primitives});
  console.log(`${source.name}: ${count/2} line segments`);
}
const packed=new Int16Array(values),compressed=gzipSync(Buffer.from(packed.buffer),{level:9});
await writeFile(path.join(output,'near-context.bin.gz'),compressed);
const depthLookup=new Map(),depthUnique=[],depthIndex=new Uint32Array(depthValues.length/3);
for(let i=0;i<depthValues.length;i+=3){
  const key=depthValues[i]+','+depthValues[i+1]+','+depthValues[i+2];
  let index=depthLookup.get(key);
  if(index===undefined){index=depthUnique.length/3;depthLookup.set(key,index);depthUnique.push(depthValues[i],depthValues[i+1],depthValues[i+2]);}
  depthIndex[i/3]=index;
}
const depthPacked=new Int16Array(depthUnique),depthIndexOffset=Math.ceil((8+depthPacked.byteLength)/4)*4;
const depthBuffer=Buffer.alloc(depthIndexOffset+depthIndex.byteLength);
depthBuffer.writeUInt32LE(depthUnique.length/3,0);depthBuffer.writeUInt32LE(depthIndex.length,4);
Buffer.from(depthPacked.buffer).copy(depthBuffer,8);Buffer.from(depthIndex.buffer).copy(depthBuffer,depthIndexOffset);
const depthCompressed=gzipSync(depthBuffer,{level:9});
await writeFile(path.join(output,'hidden-edges.bin.gz'),depthCompressed);
await writeFile(path.join(output,'manifest.json'),JSON.stringify({version:2,quantum,target,radius,groups,vertices:values.length/3,bytes:compressed.length,depthVertices:depthUnique.length/3,depthIndices:depthIndex.length,depthIndexOffset,depthBytes:depthCompressed.length,source:'Delivered Tur 10 villa, garden, neighbours, roads and context planting. Only architectural edge lines are visible; colourless depth data suppresses hidden edges. No surface colours or textures.'},null,2)+'\n');
console.log(`Saved ${(compressed.length/1048576).toFixed(2)} MiB, ${values.length/6} actual edge lines.`);
console.log(`Colourless hidden-edge buffer: ${(depthCompressed.length/1048576).toFixed(2)} MiB.`);
