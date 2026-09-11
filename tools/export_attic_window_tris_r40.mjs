import { writeFileSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
});
const doc = await io.read('/home/user/angora/build/web/full/level-3.glb');
const ARCH = /^F3 \| (ÇATII|ÇATI ALIN|KAT 3\$DUVAR|KAT 3\$DUVAR KAPLAMA)$/;
const WIN = {x0:1.8, x1:4.45, z0:-2.7, z1:-1.25};
const tris=[];
for (const node of doc.getRoot().listNodes()) {
  if (!ARCH.test(node.getName())) continue;
  const mesh=node.getMesh(); if(!mesh) continue;
  const wm=node.getWorldMatrix();
  for(const prim of mesh.listPrimitives()){
    const pos=prim.getAttribute('POSITION'); if(!pos) continue;
    const idx=prim.getIndices()?.getArray(); const a=pos.getArray();
    const P=i=>[wm[0]*a[i*3]+wm[4]*a[i*3+1]+wm[8]*a[i*3+2]+wm[12], wm[1]*a[i*3]+wm[5]*a[i*3+1]+wm[9]*a[i*3+2]+wm[13], wm[2]*a[i*3]+wm[6]*a[i*3+1]+wm[10]*a[i*3+2]+wm[14]];
    const n=idx?idx.length:pos.getCount();
    for(let t=0;t<n;t+=3){
      const v=[P(idx?idx[t]:t),P(idx?idx[t+1]:t+1),P(idx?idx[t+2]:t+2)];
      const xs=v.map(p=>p[0]), zs=v.map(p=>p[2]);
      if(Math.max(...xs)<WIN.x0||Math.min(...xs)>WIN.x1||Math.max(...zs)<WIN.z0||Math.min(...zs)>WIN.z1) continue;
      tris.push(v.map(p=>p.map(c=>+c.toFixed(5))));
    }
  }
}
writeFileSync('attic-window-tris.json', JSON.stringify(tris));
console.log('window triangles:', tris.length);
