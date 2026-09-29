import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder': await draco3d.createDecoderModule()});
const doc = await io.read(process.argv[2]);
const [x0,x1,y0,y1,z0,z1]=JSON.parse(process.argv[3]);
const planes=new Map();
for(const node of doc.getRoot().listNodes()){const mesh=node.getMesh();if(!mesh)continue;const w=node.getWorldMatrix();
for(const prim of mesh.listPrimitives()){const mat=prim.getMaterial()?.getName()??'';const pos=prim.getAttribute('POSITION'),idx=prim.getIndices(),v=[0,0,0];
const P=i=>{pos.getElement(i,v);return[w[0]*v[0]+w[4]*v[1]+w[8]*v[2]+w[12],w[1]*v[0]+w[5]*v[1]+w[9]*v[2]+w[13],w[2]*v[0]+w[6]*v[1]+w[10]*v[2]+w[14]];};
const n=idx?idx.getCount():pos.getCount();
for(let t=0;t<n;t+=3){const p=[P(idx?idx.getScalar(t):t),P(idx?idx.getScalar(t+1):t+1),P(idx?idx.getScalar(t+2):t+2)];
const c=[0,1,2].map(k=>(p[0][k]+p[1][k]+p[2][k])/3);if(c[0]<x0||c[0]>x1||c[1]<y0||c[1]>y1||c[2]<z0||c[2]>z1)continue;
const e1=[0,1,2].map(k=>p[1][k]-p[0][k]),e2=[0,1,2].map(k=>p[2][k]-p[0][k]);const cr=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];const L=Math.hypot(...cr);if(L<1e-9)continue;
const nn=cr.map(x=>x/L);if(Math.abs(nn[1])>0.5)continue;
const ax=Math.abs(nn[0])>Math.abs(nn[2])?0:2;const d=c[ax];const k=`${ax?'z':'x'}${nn[ax]>0?'+':'-'}@${d.toFixed(3)}|${mat}|${node.getName()}`;
const r=planes.get(k)??planes.set(k,{a:0,n:0,ymin:99,ymax:-99}).get(k);r.a+=L/2;r.n++;for(const q of p){r.ymin=Math.min(r.ymin,q[1]);r.ymax=Math.max(r.ymax,q[1]);}}}}
for(const [k,r] of [...planes].sort()) if(r.a>0.05) console.log(k.padEnd(90),r.a.toFixed(2),'m²',r.n,'y',r.ymin.toFixed(2),r.ymax.toFixed(2));
