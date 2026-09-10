import * as THREE from 'three';

// Smooth only the continuous earth skin; vertical retaining faces retain
// their own material and normals. Vertex positions/UVs are never displaced.
export function smoothSurfaceNormals(geometry,upward=false) {
  const p=geometry.attributes.position,index=geometry.index;
  const sums=new Map(),keys=[],a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  for(let i=0;i<p.count;i++)keys.push([p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1000)).join(','));
  const count=index?.count??p.count;
  for(let i=0;i<count;i+=3){
    const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j);
    a.fromBufferAttribute(p,ids[0]);b.fromBufferAttribute(p,ids[1]);c.fromBufferAttribute(p,ids[2]);
    b.sub(a).cross(c.sub(a));if(upward&&b.y<0)b.negate();
    for(const id of ids){const key=keys[id];if(!sums.has(key))sums.set(key,new THREE.Vector3());sums.get(key).add(b);}
  }
  const normals=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){const n=sums.get(keys[i])??new THREE.Vector3(0,1,0);a.copy(n).normalize().toArray(normals,i*3);}
  geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));
}

export function smoothGroundNormals(geometry){smoothSurfaceNormals(geometry,true);}

export function prepareContextSurfaces(context,background) {
  let ground;
  context.traverse(o=>{if(o.isMesh&&o.material.name==='grass')ground=o;});
  if(!ground)return;
  smoothGroundNormals(ground.geometry);ground.castShadow=false;
  const bounds=new THREE.Box3().setFromObject(ground);
  const edge=new THREE.Vector4(bounds.min.x,bounds.min.z,bounds.max.x,bounds.max.z),seen=new Set();
  context.traverse(o=>{
    if(!o.isMesh)return;
    for(const m of Array.isArray(o.material)?o.material:[o.material]){
      if(seen.has(m)||!['grass','asphalt','stone_tile','Retaining wall rough limestone'].includes(m.name))continue;
      seen.add(m);const previous=m.onBeforeCompile,previousKey=m.customProgramCacheKey();
      m.onBeforeCompile=(shader,renderer)=>{
        previous.call(m,shader,renderer);
        shader.uniforms.contextEdge={value:edge};shader.uniforms.contextBackground={value:background};
        shader.vertexShader='varying vec3 contextWorldPosition;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',
          '#include <project_vertex>\ncontextWorldPosition = (modelMatrix * vec4(transformed,1.0)).xyz;');
        shader.fragmentShader='varying vec3 contextWorldPosition;\nuniform vec4 contextEdge;\nuniform vec3 contextBackground;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`#include <opaque_fragment>
          vec2 edgeDistance = min(contextWorldPosition.xz-contextEdge.xy,contextEdge.zw-contextWorldPosition.xz);
          float edgeFade = 1.0-smoothstep(0.0,18.0,min(edgeDistance.x,edgeDistance.y));
          gl_FragColor.rgb=mix(gl_FragColor.rgb,contextBackground,edgeFade);`);
      };
      m.customProgramCacheKey=()=>previousKey+'|context-boundary-r27';m.needsUpdate=true;
    }
  });
  return bounds;
}
