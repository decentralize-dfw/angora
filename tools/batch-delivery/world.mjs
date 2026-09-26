import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import {MeshoptDecoder} from '/home/user/angora/viewer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder':await draco3d.createDecoderModule(),
  'meshopt.decoder':await MeshoptDecoder.ready.then(()=>MeshoptDecoder)});
const mul=(m,v)=>[m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12], m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13], m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14]];
function mm(a,b){const o=new Array(16).fill(0);for(let r=0;r<4;r++)for(let c=0;c<4;c++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
// TRS'ten matris: nicemlenmiş (KHR_mesh_quantization) modelde int16
// pozisyonları metreye çeviren ölçek TAM BURADA duruyor - atlanırsa
// sınırlar saçmalar.
function nodeMatrix(n){
  const t=n.getTranslation?.()??[0,0,0];
  const q=n.getRotation?.()??[0,0,0,1];
  const s=n.getScale?.()??[1,1,1];
  const [x,y,z,w]=q;
  const x2=x+x,y2=y+y,z2=z+z;
  const xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
  return [
    (1-(yy+zz))*s[0], (xy+wz)*s[0], (xz-wy)*s[0], 0,
    (xy-wz)*s[1], (1-(xx+zz))*s[1], (yz+wx)*s[1], 0,
    (xz+wy)*s[2], (yz-wx)*s[2], (1-(xx+yy))*s[2], 0,
    t[0], t[1], t[2], 1];
}
async function bounds(file){
  const doc=await io.read(file); const r=doc.getRoot();
  const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
  const walk=(node,parent)=>{
    const local=nodeMatrix(node)??[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
    const world=mm(parent,local);
    const mesh=node.getMesh?.();
    if(mesh) for(const p of mesh.listPrimitives()){
      const pos=p.getAttribute('POSITION'); if(!pos)continue;
      const a=pos.getMin([]),b=pos.getMax([]);
      for(const cx of [a[0],b[0]])for(const cy of [a[1],b[1]])for(const cz of [a[2],b[2]]){
        const w=mul(world,[cx,cy,cz]);
        for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],w[k]);mx[k]=Math.max(mx[k],w[k]);}
      }
    }
    for(const c of node.listChildren?.()??[]) walk(c,world);
  };
  const I=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  for(const scene of r.listScenes()) for(const n of scene.listChildren()) walk(n,I);
  return {mn,mx};
}
for(const f of ['BUILDING-opt-v3.glb','GARDEN-opt-v2.glb','INTERIOR-opt-v2.glb']){
  const {mn,mx}=await bounds('/home/user/angora/build/web/26092026/'+f);
  console.log(f.padEnd(24),'X',mn[0].toFixed(1).padStart(8),'->',mx[0].toFixed(1).padStart(7),
    ' Y',mn[1].toFixed(1).padStart(7),'->',mx[1].toFixed(1).padStart(6),
    ' Z',mn[2].toFixed(1).padStart(8),'->',mx[2].toFixed(1).padStart(7));
}
