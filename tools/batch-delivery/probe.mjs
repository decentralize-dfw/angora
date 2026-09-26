import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import {MeshoptDecoder} from '/home/user/angora/viewer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder':await draco3d.createDecoderModule(),
  'meshopt.decoder':await MeshoptDecoder.ready.then(()=>MeshoptDecoder)});
const doc=await io.read('/home/user/angora/build/web/26092026/INTERIOR-opt-v2.glb');
const r=doc.getRoot();
const mesh=r.listMeshes()[0], prim=mesh.listPrimitives()[0], pos=prim.getAttribute('POSITION');
console.log('POSITION tipi   :', pos.getArray().constructor.name, ' normalized:', pos.getNormalized());
console.log('ham min/max     :', JSON.stringify(pos.getMin([])), JSON.stringify(pos.getMax([])));
console.log('getElement(0)   :', JSON.stringify(pos.getElement(0,[])));
// düğüm TRS
for(const scene of r.listScenes()) for(const n of scene.listChildren().slice(0,2))
  console.log('düğüm', (n.getName()||'(adsız)').slice(0,28).padEnd(30),
    'T', JSON.stringify(n.getTranslation().map(v=>+v.toFixed(2))),
    'S', JSON.stringify(n.getScale().map(v=>+v.toFixed(4))));
// gerçek sınır: getElement + düğüm ölçeği
const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
for(const scene of r.listScenes()) for(const n of scene.listChildren()){
  const t=n.getTranslation(), s=n.getScale(), m=n.getMesh(); if(!m)continue;
  for(const p of m.listPrimitives()){
    const a=p.getAttribute('POSITION'); if(!a)continue;
    const step=Math.max(1,Math.floor(a.getCount()/2000)); const e=[];
    for(let i=0;i<a.getCount();i+=step){ a.getElement(i,e);
      for(let k=0;k<3;k++){ const w=e[k]*s[k]+t[k]; if(w<mn[k])mn[k]=w; if(w>mx[k])mx[k]=w; } }
  }
}
console.log('\nINTERIOR dünya sınırı: X',mn[0].toFixed(1),'->',mx[0].toFixed(1),
  ' Y',mn[1].toFixed(1),'->',mx[1].toFixed(1),' Z',mn[2].toFixed(1),'->',mx[2].toFixed(1));
