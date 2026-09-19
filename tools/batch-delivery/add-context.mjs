import * as THREE from 'three';

// Copy the existing donor into the same source materials before atlas grouping.
// No additional materials, primitives or runtime mesh groups are introduced.
export function addContextBuildings(doc,plan){
 const [lo,hi]=plan.donor.bounds,templates=[];let triangleCount=0;
 const buffer=doc.getRoot().listBuffers()[0],scene=doc.getRoot().listScenes()[0];
 for(const node of [...doc.getRoot().listNodes()])for(const primitive of node.getMesh()?.listPrimitives()??[]){
  const matrix=new THREE.Matrix4().fromArray(node.getWorldMatrix());
  const pos=primitive.getAttribute('POSITION'),idx=primitive.getIndices();
  const world=Array.from({length:pos.getCount()},(_,i)=>new THREE.Vector3().fromArray(pos.getElement(i,[])).applyMatrix4(matrix));
  const selected=[];
  for(let i=0;i<idx.getCount();i+=3){
   const ids=[idx.getScalar(i),idx.getScalar(i+1),idx.getScalar(i+2)];
   const center=world[ids[0]].clone().add(world[ids[1]]).add(world[ids[2]]).multiplyScalar(1/3);
   if(center.x>=lo[0]-.02&&center.x<=hi[0]+.02&&center.z>=lo[2]-.02&&center.z<=hi[2]+.02&&center.y>=lo[1]-.02&&center.y<=hi[1]+.02)selected.push(...ids);
  }
  if(selected.length){templates.push({primitive,matrix,world,selected});triangleCount+=selected.length/3;}
 }
 if(triangleCount<1000)throw Error('Donor extraction unexpectedly empty');
 for(const addition of plan.additions)for(const {primitive,matrix,world,selected} of templates){
  const A=addition.matrix_xz,t=addition.translation_xz;
  const transform=new THREE.Matrix4().set(A[0][0],0,A[0][1],t[0],0,1,0,addition.height_offset,A[1][0],0,A[1][1],t[1],0,0,0,1);
  const normalMatrix=new THREE.Matrix3().getNormalMatrix(transform.clone().multiply(matrix));
  const unique=[...new Set(selected)],lookup=new Map(unique.map((v,i)=>[v,i]));
  const copy=doc.createPrimitive().setMaterial(primitive.getMaterial());
  for(const semantic of primitive.listSemantics()){
   const source=primitive.getAttribute(semantic),width=source.getElementSize(),values=new Float32Array(unique.length*width);
   unique.forEach((v,i)=>{
    let value=source.getElement(v,[]);
    if(semantic==='POSITION')value=world[v].clone().applyMatrix4(transform).toArray();
    if(semantic==='NORMAL')value=new THREE.Vector3().fromArray(value).applyMatrix3(normalMatrix).normalize().toArray();
    values.set(value,i*width);
   });
   copy.setAttribute(semantic,doc.createAccessor().setType(source.getType()).setArray(values).setBuffer(buffer));
  }
  const ids=selected.map(v=>lookup.get(v));
  if(transform.determinant()<0)for(let i=0;i<ids.length;i+=3)[ids[i+1],ids[i+2]]=[ids[i+2],ids[i+1]];
  copy.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(ids)).setBuffer(buffer));
  scene.addChild(doc.createNode(addition.id).setMesh(doc.createMesh().addPrimitive(copy)));
 }
 return {buildings:plan.additions.length,donorTriangles:triangleCount};
}
