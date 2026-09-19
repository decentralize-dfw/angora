import * as THREE from 'three';

// Use complete authored house objects. Never spatially crop a merged city mesh:
// its neighboring faces and overhangs cannot be identified by a bounding box.
export function groundSampler(doc){
 const surfaces=[],roads=[];
 for(const node of doc.getRoot().listNodes())for(const p of node.getMesh()?.listPrimitives()??[]){
  if(!/grass|asphalt/i.test(node.getName()))continue;
  const matrix=new THREE.Matrix4().fromArray(node.getWorldMatrix()),pos=p.getAttribute('POSITION'),idx=p.getIndices();
  const points=Array.from({length:pos.getCount()},(_,i)=>new THREE.Vector3().fromArray(pos.getElement(i,[])).applyMatrix4(matrix));
  for(let i=0;i<idx.getCount();i+=3){const tri=[0,1,2].map(k=>points[idx.getScalar(i+k)]);surfaces.push(tri);if(/asphalt/i.test(node.getName()))roads.push(tri);}
 }
 function height(x,z){
  let best=-Infinity;
  for(const [a,b,c] of surfaces){
   if(x<Math.min(a.x,b.x,c.x)||x>Math.max(a.x,b.x,c.x)||z<Math.min(a.z,b.z,c.z)||z>Math.max(a.z,b.z,c.z))continue;
   const den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(den)<1e-8)continue;
   const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/den,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/den;
   if(u>=-1e-5&&v>=-1e-5&&u+v<=1.00001)best=Math.max(best,u*a.y+v*b.y+(1-u-v)*c.y);
  }
  if(!Number.isFinite(best))throw Error(`No existing terrain at ${x},${z}`);return best;
 }
 function road(x,z){
  let nearest=null,distance=Infinity;
  for(const tri of roads)for(let i=0;i<3;i++){
   const a=tri[i],b=tri[(i+1)%3],dx=b.x-a.x,dz=b.z-a.z,t=THREE.MathUtils.clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);
   const q=[a.x+t*dx,a.y+t*(b.y-a.y),a.z+t*dz],d=Math.hypot(q[0]-x,q[2]-z);if(d<distance){distance=d;nearest=q;}
  }return nearest;
 }
 return {height,road};
}

export function addContextBuildings(doc,plan,donorDoc,terrain){
 const buffer=doc.getRoot().listBuffers()[0],scene=doc.getRoot().listScenes()[0],materials=doc.getRoot().listMaterials();
 const materialFor=name=>materials.find(m=>m.getName()===name)??materials.find(m=>m.getName()===(/wood/i.test(name)?'wood_dark.002':/trim/i.test(name)?'WHT':/retaining/i.test(name)?'R31 | R39 surrounding retaining stone':/wall/i.test(name)?'neighbor_wall':'ceiling.004'));
 const [lo,hi]=plan.donor.bounds;
 const templates=donorDoc.getRoot().listNodes().filter(n=>/^B4(?:\s|$)/.test(n.getName())&&n.getMesh());
 if(templates.length!==46)throw Error(`Incomplete donor: ${templates.length} objects`);
 let triangleCount=0;
 for(const node of templates)for(const p of node.getMesh().listPrimitives())triangleCount+=p.getIndices().getCount()/3;
 // The baked facade has UV-chart splits absent from the old object file.
 // Copy its WHOLE connected shells, preserving those splits, instead of
 // interpolating across unrelated lightmap islands on the old topology.
 const facadeTemplates=[];let facadeTriangles=0;
 for(const node of [...doc.getRoot().listNodes()])for(const p of node.getMesh()?.listPrimitives()??[]){
  if(p.getMaterial().getName()!=='neighbor_wall')continue;
  const pos=p.getAttribute('POSITION'),idx=p.getIndices(),matrix=new THREE.Matrix4().fromArray(node.getWorldMatrix());
  const parents=Array.from({length:pos.getCount()},(_,i)=>i),find=i=>{while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;},join=(a,b)=>{parents[find(a)]=find(b);},weld=new Map(),world=[];
  for(let i=0;i<pos.getCount();i++){const v=new THREE.Vector3().fromArray(pos.getElement(i,[])).applyMatrix4(matrix);world.push(v);const k=v.toArray().map(x=>Math.round(x*10000)).join(',');if(weld.has(k))join(i,weld.get(k));else weld.set(k,i);}
  for(let i=0;i<idx.getCount();i+=3){join(idx.getScalar(i),idx.getScalar(i+1));join(idx.getScalar(i),idx.getScalar(i+2));}
  const components=new Map();
  for(let i=0;i<pos.getCount();i++){const root=find(i);if(!components.has(root))components.set(root,new THREE.Box3());components.get(root).expandByPoint(world[i]);}
  const selected=new Set([...components].filter(([,box])=>box.min.x>=lo[0]-.1&&box.max.x<=hi[0]+.1&&box.min.z>=lo[2]-.1&&box.max.z<=hi[2]+.1).map(([root])=>root));
  const sourceIDs=[];for(let i=0;i<idx.getCount();i+=3)if(selected.has(find(idx.getScalar(i))))sourceIDs.push(idx.getScalar(i),idx.getScalar(i+1),idx.getScalar(i+2));
  const vertices=[...new Set(sourceIDs)],lookup=new Map(vertices.map((v,i)=>[v,i])),copy=doc.createPrimitive().setMaterial(p.getMaterial());
  for(const semantic of p.listSemantics()){const a=p.getAttribute(semantic),values=new Float32Array(vertices.length*a.getElementSize());vertices.forEach((v,i)=>values.set(a.getElement(v,[]),i*a.getElementSize()));copy.setAttribute(semantic,doc.createAccessor().setType(a.getType()).setArray(values).setBuffer(buffer));}
  copy.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(sourceIDs.map(v=>lookup.get(v)))).setBuffer(buffer));facadeTriangles+=sourceIDs.length/3;
  facadeTemplates.push({getWorldMatrix:()=>node.getWorldMatrix(),getName:()=> 'B4 complete baked facade shells',getMesh:()=>({listPrimitives:()=>[copy]})});
 }
 if(facadeTriangles<500)throw Error('Complete baked facade shells missing');
 for(const addition of plan.additions){
  const A=addition.matrix_xz,t=addition.translation_xz;
  // Basement datum follows the lower side of the existing sloping plot.
  const ground=Math.min(...addition.footprint_xz.map(([x,z])=>terrain.height(x,z)));
  addition.height_offset=ground-(-10.5);
  const transform=new THREE.Matrix4().set(A[0][0],0,A[0][1],t[0],0,1,0,addition.height_offset,A[1][0],0,A[1][1],t[1],0,0,0,1);
  for(const node of [...templates,...facadeTemplates])for(const primitive of node.getMesh().listPrimitives()){
   if(primitive.getMaterial().getName()==='neighbor_wall'&&!primitive.getAttribute('TEXCOORD_2'))continue;
   const matrix=transform.clone().multiply(new THREE.Matrix4().fromArray(node.getWorldMatrix())),normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix);
   const copy=doc.createPrimitive().setMaterial(materialFor(primitive.getMaterial().getName()));
   for(const semantic of primitive.listSemantics()){
    const source=primitive.getAttribute(semantic),width=source.getElementSize(),values=new Float32Array(source.getCount()*width);
    for(let i=0;i<source.getCount();i++){
     let value=source.getElement(i,[]);
     if(semantic==='POSITION')value=new THREE.Vector3().fromArray(value).applyMatrix4(matrix).toArray();
     if(semantic==='NORMAL')value=new THREE.Vector3().fromArray(value).applyMatrix3(normalMatrix).normalize().toArray();
     values.set(value,i*width);
    }
    copy.setAttribute(semantic,doc.createAccessor().setType(source.getType()).setArray(values).setBuffer(buffer));
   }
   const ids=new Uint32Array(primitive.getIndices().getArray());
   if(matrix.determinant()<0)for(let i=0;i<ids.length;i+=3)[ids[i+1],ids[i+2]]=[ids[i+2],ids[i+1]];
   copy.setIndices(doc.createAccessor().setType('SCALAR').setArray(ids).setBuffer(buffer));
   scene.addChild(doc.createNode(`${addition.id} | ${node.getName()}`).setMesh(doc.createMesh().addPrimitive(copy)));
  }
 }
 return {buildings:plan.additions.length,donorObjects:templates.length,donorTriangles:triangleCount,bakedFacadeTriangles:facadeTriangles,method:'complete authored objects and baked facade shells; rigid transform; terrain sampled basement datum'};
}

export function addContextGardens(doc,plan,terrain){
 const buffer=doc.getRoot().listBuffers()[0],scene=doc.getRoot().listScenes()[0],materials=doc.getRoot().listMaterials();
 const material=pattern=>materials.find(m=>pattern.test(m.getName()));
 function geometry(name,positions,indices,mat){
  const g=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3)).setIndex(indices);g.computeVertexNormals();
  const uv=[];for(let i=0;i<positions.length;i+=3)uv.push(positions[i]*.25,positions[i+2]*.25);
  const p=doc.createPrimitive().setMaterial(mat);
  for(const [semantic,array,type] of [['POSITION',new Float32Array(positions),'VEC3'],['NORMAL',g.attributes.normal.array,'VEC3'],['TEXCOORD_0',new Float32Array(uv),'VEC2']])p.setAttribute(semantic,doc.createAccessor().setType(type).setArray(array).setBuffer(buffer));
  p.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(indices)).setBuffer(buffer));scene.addChild(doc.createNode(name).setMesh(doc.createMesh().addPrimitive(p)));g.dispose();
 }
 for(const a of plan.additions){
  const [cx,cz]=a.center_xz,ring=a.footprint_xz.slice(0,-1).map(([x,z])=>{const l=Math.hypot(x-cx,z-cz);return [x+(x-cx)/l*2.2,z+(z-cz)/l*2.2];});
  const road=terrain.road(cx,cz);if(!road)throw Error('No road for '+a.id);
  // Open the boundary on its road-facing edge for the entrance.
  let entry=0,dist=Infinity;
  ring.forEach((p,i)=>{const q=ring[(i+1)%ring.length],d=Math.hypot((p[0]+q[0])/2-road[0],(p[1]+q[1])/2-road[2]);if(d<dist){dist=d;entry=i;}});
  for(let i=0;i<ring.length;i++){
   const p=ring[i],q=ring[(i+1)%ring.length],length=Math.hypot(q[0]-p[0],q[1]-p[1]),segments=Math.ceil(length/1.5);
   for(let j=0;j<segments;j++){
    if(i===entry&&Math.abs((j+.5)/segments-.5)<2/length)continue;
    const t=j/segments,u=(j+1)/segments,x=p[0]+(q[0]-p[0])*t,z=p[1]+(q[1]-p[1])*t,xx=p[0]+(q[0]-p[0])*u,zz=p[1]+(q[1]-p[1])*u;
    const y=terrain.height(x,z),yy=terrain.height(xx,zz),nx=-(q[1]-p[1])/length*.18,nz=(q[0]-p[0])/length*.18;
    geometry(`${a.id} garden boundary`,[x,y-.5,z,xx,yy-.5,zz,xx,yy+.5,zz,x,y+.5,z,x+nx,y-.5,z+nz,xx+nx,yy-.5,zz+nz,xx+nx,yy+.5,zz+nz,x+nx,y+.5,z+nz],[0,1,2,0,2,3,4,6,5,4,7,6,3,2,6,3,6,7],material(/Retaining/));
   }
  }
  const p=ring[entry],q=ring[(entry+1)%ring.length],gate=[(p[0]+q[0])/2,(p[1]+q[1])/2];
  const dx=road[0]-gate[0],dz=road[2]-gate[1],length=Math.hypot(dx,dz),nx=-dz/(length||1)*1.25,nz=dx/(length||1)*1.25;
  // A terrain-following paved connection continues inside the garden to the facade.
  const start=[gate[0]+(cx-gate[0])*.32,gate[1]+(cz-gate[1])*.32],end=[road[0]+dx/(length||1)*.3,road[2]+dz/(length||1)*.3];
  const count=Math.max(2,Math.ceil(Math.hypot(end[0]-start[0],end[1]-start[1]))),pos=[],ids=[];
  for(let j=0;j<=count;j++){const t=j/count,x=start[0]+(end[0]-start[0])*t,z=start[1]+(end[1]-start[1])*t;for(const sign of [-1,1]){const px=x+sign*nx,pz=z+sign*nz;pos.push(px,terrain.height(px,pz)+.045,pz);}if(j<count){const k=j*2;ids.push(k,k+2,k+1,k+1,k+2,k+3);}}
  geometry(`${a.id} road-connected entrance`,pos,ids,material(/asphalt/));
  a.garden={boundary:ring,entrance:gate,road_connection:road};
 }
 return {gardens:plan.additions.length,roadConnections:plan.additions.length,materialReuse:true};
}
