import fs from 'node:fs/promises';
import path from 'node:path';
const {default:sharp}=await import(process.env.ANGORA_SHARP_MODULE??'sharp');
const root=path.resolve(import.meta.dirname,'../..'),source=path.resolve(root,'../model-finalization/web'),work=path.join(root,'.runtime/finishing'),out=path.join(work,'source');
await fs.mkdir(out,{recursive:true});
// Fine mineral variation, without the previous oversized rectangular grid.
const mineral=Buffer.alloc(512*512*3);let seed=19327;
for(let i=0;i<512*512;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const grain=(seed/4294967296-.5)*5;for(let k=0;k<3;k++)mineral[i*3+k]=[184,179,168][k]+grain;}
await sharp(mineral,{raw:{width:512,height:512,channels:3}}).webp({quality:88}).toFile(path.join(out,'limestone-fine.webp'));
const repaired=JSON.parse(await fs.readFile(path.join(work,'repaired.json')));
await fs.copyFile(path.join(source,'manifest.json'),path.join(out,'manifest.json'));
for(const part of ['architecture','interior','garden','context-ground','context-buildings','context-plants']){
 const doc=JSON.parse(await fs.readFile(path.join(source,part+'.gltf')));
 for(const list of [doc.buffers,doc.images])for(const item of list??[])if(item.uri)item.uri=path.relative(out,path.resolve(source,decodeURIComponent(item.uri))).replaceAll('\\','/');
 const chunks=[];let offset=0;const buffer=doc.buffers.length;doc.buffers.push({uri:part+'-finish.bin',byteLength:0});
 function accessor(values,components,index=false){
  const a=index?new Uint32Array(values):new Float32Array(values),data=Buffer.from(a.buffer),view=doc.bufferViews.length;
  doc.bufferViews.push({buffer,byteOffset:offset,byteLength:data.length});chunks.push(data);offset+=data.length;
  const ac={bufferView:view,componentType:index?5125:5126,count:a.length/components,type:components===1?'SCALAR':'VEC'+components};
  if(components===3&&!index){ac.min=[0,1,2].map(k=>{let n=Infinity;for(let i=k;i<a.length;i+=3)n=Math.min(n,a[i]);return n;});ac.max=[0,1,2].map(k=>{let n=-Infinity;for(let i=k;i<a.length;i+=3)n=Math.max(n,a[i]);return n;});}
  doc.accessors.push(ac);return doc.accessors.length-1;
 }
 for(const item of repaired.filter(i=>i.part===part)){
  const node=doc.nodes.find(n=>n.name===item.name),prim=doc.meshes[node.mesh].primitives[item.pi];
  if(item.name==='curtain_sheer'){
   const a=item.attributes.POSITION;
   for(let i=0;i<a.length;i+=3)if(a[i+1]>6.37&&a[i+1]<9.2&&a[i+2]<-7.85&&a[i+2]>-8.1){
    if(a[i]<-2.5)a[i]=-4.126+(a[i]+4.126)*.28;
    else a[i]=-.35+(a[i]+.35)*.28;
   }
  }
  delete node.matrix;delete node.translation;delete node.rotation;delete node.scale;
  delete prim.extensions?.KHR_draco_mesh_compression;
  for(const [key,a] of Object.entries(item.attributes))prim.attributes[key]=accessor(a,a.length/(item.attributes.POSITION.length/3));
  prim.indices=accessor(item.indices,1,true);
  if(item.metricUV){const m=doc.materials[prim.material];const descriptors=[m.pbrMetallicRoughness?.baseColorTexture,m.normalTexture,m.pbrMetallicRoughness?.metallicRoughnessTexture].filter(Boolean);const channel=7;prim.attributes.TEXCOORD_7=accessor(item.metricUV,2);for(const d of descriptors){d.texCoord=channel;delete d.extensions;}}
  if(item.name==='interior.001'){
   const high=[],low=[],a=item.attributes.POSITION;
   for(let i=0;i<item.indices.length;i+=3){const ids=item.indices.slice(i,i+3);(ids.every(v=>a[v*3+1]>9.3)?high:low).push(...ids);}
   const m=structuredClone(doc.materials[prim.material]);m.name='INTERIOR attic clean';delete m.occlusionTexture;if(m.extras)delete m.extras.angoraLightMapTexture;
   delete m.normalTexture;delete m.pbrMetallicRoughness.baseColorTexture;delete m.pbrMetallicRoughness.metallicRoughnessTexture;m.pbrMetallicRoughness.baseColorFactor=[.82,.82,.80,1];m.pbrMetallicRoughness.roughnessFactor=.9;m.pbrMetallicRoughness.metallicFactor=0;
   const material=doc.materials.length;doc.materials.push(m);prim.indices=accessor(low,1,true);
   doc.meshes[node.mesh].primitives.push({...prim,attributes:{...prim.attributes},material,indices:accessor(high,1,true)});
  }
 }
 if(part==='architecture'){
  // Upper-floor concrete stair plates; basement uses the owner reference solid.
  // The authored treads/landings are retained, including the stairwell void.
  const positions=[],normals=[],uv=[],indices=[];
  function face(points){
   const a=points[0],b=points[1],c=points[2],u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n);n=n.map(v=>v/l);const start=positions.length/3;
   for(const p of points){positions.push(...p);normals.push(...n);uv.push(p[0],p[2]);}indices.push(start,start+1,start+2,start,start+2,start+3);
  }
  for(const datum of [3.0996,6.3714])for(const [x0,x1,h0,h1,z0,z1] of [[.83,2.9,-.08,1.34,-3.128,-2.129],[.87,2.84,2.72,1.36,-1.928,-.931]]){
   const top=[[x0,datum+h0,z0],[x1,datum+h1,z0],[x1,datum+h1,z1],[x0,datum+h0,z1]],bottom=top.map(p=>[p[0],p[1]-.16,p[2]]);
   face(top);face([...bottom].reverse());for(let i=0;i<4;i++)face([top[i],bottom[i],bottom[(i+1)%4],top[(i+1)%4]]);
  }
  const material=doc.materials.findIndex(m=>m.name==='WHT');if(material<0)throw Error('Missing existing stair concrete finish');
  const mesh=doc.meshes.length;doc.meshes.push({name:'Closed stair concrete plates',primitives:[{material,attributes:{POSITION:accessor(positions,3),NORMAL:accessor(normals,3),TEXCOORD_0:accessor(uv,2)},indices:accessor(indices,1,true)}]});
  const node=doc.nodes.length;doc.nodes.push({name:'Closed stair concrete plates',mesh});doc.scenes[doc.scene??0].nodes.push(node);
  const original=JSON.parse(await fs.readFile(path.join(work,'owner-solid-stair.json')));
  const ownerMesh=doc.meshes.length;doc.meshes.push({name:original.name,primitives:[{material,attributes:Object.fromEntries(Object.entries(original.attributes).map(([key,a])=>[key,accessor(a,key.startsWith('TEXCOORD')?2:3)])),indices:accessor(original.indices,1,true)}]});
  const ownerNode=doc.nodes.length;doc.nodes.push({name:original.name,mesh:ownerMesh,extras:{source_sha256:original.source_sha256}});doc.scenes[doc.scene??0].nodes.push(ownerNode);
 }
 // Reuse the archived dolphin motif exactly; pool wall tiles get a separate finish.
 if(part==='garden'){
  const motifSource=path.join(root,'../angora-review/assets/review-textures/pool-dolphin-web.png');
  const motifFile=path.join(out,'pool-dolphin-centered.webp');
  const motif=await sharp(motifSource).resize(172,245,{fit:'fill'}).png().toBuffer();
  await sharp({create:{width:512,height:512,channels:3,background:'#ffffff'}}).composite([{input:motif,left:170,top:133}]).webp({quality:94}).toFile(motifFile);
  const image=doc.images.length;doc.images.push({uri:path.relative(out,motifFile).replaceAll('\\','/')});const texture=doc.textures.length;doc.textures.push({source:image});
  const material=doc.materials.length;doc.materials.push({name:'pool_tile dolphin mosaic',doubleSided:true,pbrMetallicRoughness:{baseColorTexture:{index:texture,texCoord:7},roughnessFactor:.55,metallicFactor:0},extras:{angoraAuthoredPBR:true}});
  const node=doc.nodes.find(n=>n.name==='pool_tile'),prim=doc.meshes[node.mesh].primitives[0],item=repaired.find(i=>i.part===part&&i.name==='pool_tile'),p=item.attributes.POSITION;
  const bottom=[],sides=[];let low=Infinity;for(let i=1;i<p.length;i+=3)low=Math.min(low,p[i]);
  for(let i=0;i<item.indices.length;i+=3){const ids=item.indices.slice(i,i+3),ys=ids.map(v=>p[v*3+1]);(Math.max(...ys)<low+.21&&Math.max(...ys)-Math.min(...ys)<.001?bottom:sides).push(...ids);}
  const uv=[];for(let i=0;i<p.length;i+=3)uv.push((p[i]+1.91056)/10.41387,1-(p[i+2]+18.38829)/4.86258);
  prim.attributes.TEXCOORD_7=accessor(uv,2);prim.indices=accessor(sides,1,true);
  if(bottom.length)doc.meshes[node.mesh].primitives.push({...prim,attributes:{...prim.attributes},material,indices:accessor(bottom,1,true)});
  console.log('pool mosaic triangles',bottom.length/3,'height',low);
 }
 for(const m of doc.materials){
  const p=m.pbrMetallicRoughness??(m.pbrMetallicRoughness={});
  if(m.name==='ceiling'){
   delete p.baseColorTexture;delete p.metallicRoughnessTexture;delete m.normalTexture;
   delete m.occlusionTexture;if(m.extras)delete m.extras.angoraLightMapTexture;
   p.baseColorFactor=[.82,.82,.80,1];p.roughnessFactor=.9;p.metallicFactor=0;
  }
  if(/picture|artwork|Original damask curtain photograph/i.test(m.name)){
   delete p.baseColorTexture;delete p.metallicRoughnessTexture;delete m.normalTexture;p.baseColorFactor=[.88,.88,.86,1];p.roughnessFactor=.9;p.metallicFactor=0;
  }
  if(part==='garden'&&/limestone|^pool_tile$|^water$/.test(m.name)){
   delete p.baseColorTexture;delete p.metallicRoughnessTexture;delete m.normalTexture;
   p.baseColorFactor=m.name==='water'?[.48,.76,.8,1]:m.name==='pool_tile'?[.57,.77,.79,1]:[.49,.46,.4,1];p.roughnessFactor=m.name==='water'?.12:m.name==='pool_tile'?.6:.88;p.metallicFactor=0;
  }
  if(/limestone/i.test(m.name)){
   const image=doc.images.length;doc.images.push({uri:'limestone-fine.webp'});const texture=doc.textures.length;doc.textures.push({source:image});
   p.baseColorTexture={index:texture};p.baseColorFactor=[1,1,1,1];p.roughnessFactor=.88;p.metallicFactor=0;delete p.metallicRoughnessTexture;delete m.normalTexture;
  }
 }
 doc.buffers[buffer].byteLength=offset;await fs.writeFile(path.join(out,part+'-finish.bin'),Buffer.concat(chunks));
 await fs.writeFile(path.join(out,part+'.gltf'),JSON.stringify(doc));
}
console.log('Staged repaired authored delivery',out);

