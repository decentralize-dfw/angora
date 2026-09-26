import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import {MeshoptDecoder} from '/home/user/angora/viewer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js';
import fs from 'node:fs';
const DIR='/home/user/angora/build/web/26092026';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({'draco3d.decoder':await draco3d.createDecoderModule(),
    'meshopt.decoder':await MeshoptDecoder.ready.then(()=>MeshoptDecoder)});
for(const f of ['INTERIOR-opt-v2.glb']){
  const buf=fs.readFileSync(`${DIR}/${f}`);
  const jl=buf.readUInt32LE(12);
  const raw=JSON.parse(buf.slice(20,20+jl).toString('utf8'));
  const doc=await io.read(`${DIR}/${f}`);
  const r=doc.getRoot();
  let tris=0,verts=0;
  const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
  for(const m of r.listMeshes())for(const p of m.listPrimitives()){
    const pos=p.getAttribute('POSITION'); if(!pos)continue;
    verts+=pos.getCount(); const i=p.getIndices();
    tris+=(i?i.getCount():pos.getCount())/3;
    const a=pos.getMin([]),b=pos.getMax([]);
    for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],a[k]);mx[k]=Math.max(mx[k],b[k]);}
  }
  let img=0; for(const t of r.listTextures()) img+=t.getImage()?.byteLength??0;
  console.log('\n=== '+f+' ('+(buf.length/1048576).toFixed(2)+' MB) ===');
  console.log(' üretici   :', raw.asset?.generator);
  console.log(' uzantılar :', (raw.extensionsUsed||[]).join(', ')||'(yok)', '| gerekli:', (raw.extensionsRequired||[]).join(', ')||'-');
  console.log(' malzeme   :', r.listMaterials().length, ' mesh:', r.listMeshes().length, ' doku:', r.listTextures().length, `(${(img/1048576).toFixed(1)} MB)`);
  console.log(' üçgen     :', Math.round(tris).toLocaleString(), ' vertex:', verts.toLocaleString());
  console.log(' sınır (m) : X', mn[0].toFixed(1),'->',mx[0].toFixed(1), ' Y', mn[1].toFixed(1),'->',mx[1].toFixed(1), ' Z', mn[2].toFixed(1),'->',mx[2].toFixed(1));
  console.log(' malzemeler:', r.listMaterials().map(m=>m.getName()).slice(0,14).join(' | '));
}
