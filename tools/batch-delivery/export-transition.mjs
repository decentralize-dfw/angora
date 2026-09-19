import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const work=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../model-finalization');
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco from 'draco3dgltf';
import * as THREE from 'three';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco.createDecoderModule()});
const doc=await io.read(process.argv[2]??path.join(work,'web/architecture.gltf'));const triangles=[],objects=[];
for(const node of doc.getRoot().listNodes())for(const p of node.getMesh()?.listPrimitives()??[]){
 if(!/^(stucco|interior|ceiling|roof|white_trim)/i.test(node.getName()))continue;
 const matrix=new THREE.Matrix4().fromArray(node.getWorldMatrix()),pos=p.getAttribute('POSITION'),idx=p.getIndices();
 const vertices=Array.from({length:pos.getCount()},(_,i)=>{const v=new THREE.Vector3().fromArray(pos.getElement(i,[])).applyMatrix4(matrix);return [v.x,-v.z,v.y];});
 for(let i=0;i<idx.getCount();i+=3)triangles.push([vertices[idx.getScalar(i)],vertices[idx.getScalar(i+1)],vertices[idx.getScalar(i+2)]]);
 objects.push(node.getName());
}
await fs.writeFile(path.join(work,'transition-wall-triangles.json'),JSON.stringify({objects,triangles}));console.log(objects,triangles.length);
