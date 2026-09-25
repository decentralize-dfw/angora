import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import fs from 'node:fs';
import path from 'node:path';
const SRC='/home/user/angora/build/web/native-current';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS.filter(e=>e.EXTENSION_NAME!=='KHR_texture_basisu'))
  .registerDependencies({'draco3d.decoder':await draco3d.createDecoderModule()});
for(const f of fs.readdirSync(SRC).filter(f=>f.endsWith('.gltf')).sort()){
  const d=await io.read(path.join(SRC,f));
  const r=d.getRoot();
  let geo=0; for(const a of r.listAccessors()) geo+=a.getArray()?.byteLength??0;
  let img=0; for(const t of r.listTextures()) img+=t.getImage()?.byteLength??0;
  let tris=0; for(const m of r.listMeshes()) for(const p of m.listPrimitives()){
    const i=p.getIndices(), pos=p.getAttribute('POSITION');
    tris+=(i?i.getCount():(pos?pos.getCount():0))/3;
  }
  console.log(f.replace('.gpu.gltf','').padEnd(24),
    'geo',(geo/1048576).toFixed(1).padStart(6),'MB  doku',(img/1048576).toFixed(1).padStart(5),'MB  malzeme',
    String(r.listMaterials().length).padStart(3),'  üçgen',Math.round(tris).toLocaleString().padStart(10));
}
