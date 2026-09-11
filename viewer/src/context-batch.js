import * as THREE from 'three';

// The download shares repeated CAD components. Bake their transforms once
// after decoding so the whole neighborhood draws in tens of calls instead of
// thousands - but not into one mesh per material: a single neighbourhood-wide
// mesh forfeits frustum culling, and measured against the real villa and
// floor cameras 71-75% of the context is off screen. So solid buckets split
// on a 48 m ground grid, each chunk with its own bounds, and the culler earns
// that geometry back. The continuous site skins - terrain, soil, roads -
// stay whole: their welded normal smoothing and the horizon fade must not
// meet a chunk seam, and at 50k triangles they are not worth culling.
const CHUNK_M=48;
const CONTINUOUS_SITE=/grass|soil|asphalt|terrain|curb/i;
export function batchContext(root) {
  root.updateMatrixWorld(true);
  const buckets=new Map(),originals=new Set(),instances=[],matrix=new THREE.Matrix4();let supported=true;
  const centre=new THREE.Vector3();
  root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const g=mesh.geometry;
    if(Array.isArray(mesh.material)||mesh.isSkinnedMesh||Object.keys(g.attributes).some(k=>!['position','normal','uv'].includes(k))){supported=false;return;}
    if(!g.boundingSphere)g.computeBoundingSphere();
    for(let i=0;i<(mesh.isInstancedMesh?mesh.count:1);i++){
      if(mesh.isInstancedMesh){mesh.getMatrixAt(i,matrix);matrix.premultiply(mesh.matrixWorld);}else matrix.copy(mesh.matrixWorld);
      centre.copy(g.boundingSphere.center).applyMatrix4(matrix);
      const cell=CONTINUOUS_SITE.test(mesh.material.name)?'site':`${Math.floor(centre.x/CHUNK_M)},${Math.floor(centre.z/CHUNK_M)}`;
      const key=mesh.material.uuid+'|'+cell;
      const b=buckets.get(key)??{material:mesh.material,entries:[],vertices:0,indices:0};buckets.set(key,b);
      b.entries.push({g,matrix:matrix.clone()});b.vertices+=g.attributes.position.count;b.indices+=g.index?.count??g.attributes.position.count;
    }
    originals.add(g);if(mesh.isInstancedMesh)instances.push(mesh);
  });
  if(!supported)return root;
  const result=new THREE.Group();result.name=root.name;result.userData={...root.userData};
  const point=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();
  for(const [,b] of buckets){
    const material=b.material;
    const positions=new Float32Array(b.vertices*3),normals=new Float32Array(b.vertices*3),uvs=new Float32Array(b.vertices*2),indices=new Uint32Array(b.indices);
    let vertexOffset=0,indexOffset=0;
    for(const {g,matrix} of b.entries){
      const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;normalMatrix.getNormalMatrix(matrix);
      for(let i=0;i<p.count;i++){
        point.fromBufferAttribute(p,i).applyMatrix4(matrix).toArray(positions,(vertexOffset+i)*3);
        if(n)point.fromBufferAttribute(n,i).applyNormalMatrix(normalMatrix).toArray(normals,(vertexOffset+i)*3);
        if(uv){uvs[(vertexOffset+i)*2]=uv.getX(i);uvs[(vertexOffset+i)*2+1]=uv.getY(i);}
      }
      const count=g.index?.count??p.count,mirrored=matrix.determinant()<0;
      for(let i=0;i<count;i+=3)for(let j=0;j<3;j++){
        const source=i+(mirrored?(j===0?0:3-j):j);indices[indexOffset+i+j]=vertexOffset+(g.index?g.index.getX(source):source);
      }
      vertexOffset+=p.count;indexOffset+=count;
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));
    g.setAttribute('normal',new THREE.BufferAttribute(normals,3));g.setAttribute('uv',new THREE.BufferAttribute(uvs,2));g.setIndex(new THREE.BufferAttribute(indices,1));
    g.computeBoundingBox();g.computeBoundingSphere();const mesh=new THREE.Mesh(g,material);mesh.name='Context | '+material.name+(material.userData.contextBuilding?' · massing':'');result.add(mesh);
  }
  for(const g of originals)g.dispose();for(const mesh of instances)mesh.dispose();
  return result;
}
