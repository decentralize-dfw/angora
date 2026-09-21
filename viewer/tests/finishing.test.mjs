import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WalkSurface} from '../src/walk-surface.js';
import {createNativeSoilSection} from '../src/section.js';
const root=new URL('../../',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root)));
test('Earth remains capped during both directions of floor transition with one reused mesh',()=>{
 const soil=createNativeSoilSection(read('build/web/native-current/native-soil-section.json'));
 for(const h of [1.6,1.8,2.2,2.8,3.2,2.8,2.2,1.8,1.6]){
  soil.userData.update(h,true);assert.equal(soil.visible,true,`height ${h}`);assert.ok(soil.geometry.index.count>0);assert.equal(soil.position.y,h+.001);
 }
 soil.userData.update(2.2,true);const geometry=soil.geometry;
 soil.userData.update(2.8,true);soil.userData.update(2.2,true);assert.equal(soil.geometry,geometry);
 soil.userData.update(2.2,false);assert.equal(soil.visible,false);
 soil.userData.update(8,true);assert.equal(soil.visible,false);
});
test('Earth hatching stays on the horizontal cut and cannot cover exterior facades',()=>{
 const data=read('build/web/native-current/native-soil-section.json'),soil=createNativeSoilSection(data);
 for(const s of data.slices){
  if(!s.i.length)continue;
  soil.userData.update(s.height,true);
  assert.equal(soil.children.length,0);
  assert.equal(soil.geometry.index.count,s.i.length);
  const p=soil.geometry.attributes.position;
  assert.equal(p.count,s.p.length/2);
  for(let i=0;i<p.count;i++)assert.equal(p.getY(i),0,'no false vertical soil facade');
 }
});
test('Exterior stair caps stop at the actual 1.60 m solid intersection, leaving lower treads open',()=>{
 const data=read('build/web/native-current/native-soil-section.json');
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const cases=data.slices.filter(s=>s.height<=2.8).flatMap(s=>[[-6.4,-2.8],[8,-2]].map(point=>({s,point,expected:false})));
 for(const [point,expected] of [[[-6.4,-.32],false],[[-6.4,-.29],true],[[8,-1.74],false],[[8,-1.70],true]])cases.push({s:data.slices[0],point,expected});
 for(const {s,point,expected} of cases){
  const vertices=Array.from({length:s.p.length/2},(_,i)=>s.p.slice(i*2,i*2+2));let covered=false;
  for(let i=0;i<s.i.length;i+=3){const [a,b,c]=s.i.slice(i,i+3).map(k=>vertices[k]);const signs=[cross(a,b,point),cross(b,c,point),cross(c,a,point)];if(signs.every(v=>v>=-1e-8)||signs.every(v=>v<=1e-8)){covered=true;break;}}
  assert.equal(covered,expected,`${point} at ${s.height}`);
 }
});
test('Basement stair section and collider use the supplied owner solid',()=>{
 const source=read('build/web/native-current/owner-stair-restoration.json');
 assert.equal(source.triangles,148);
 assert.equal(source.sha256,'322138f5b8c3a482e7881c93af75c86be6a45bb75ce949dc24ce858e419b59f6');
 const cut=source.sections.find(s=>s.file==='sections-current.json'&&s.height===1.6);
 assert.ok(cut.solid_area_m2>1.9&&cut.solid_area_m2<2.1);
 assert.equal(read('build/web/native-current/native-navigation.json').owner_basement_stair_sha256,source.sha256);
 assert.equal(read('build/web/native-current/sections-current.json').owner_basement_stair_sha256,source.sha256);
});
test('All first-floor rooms and both balconies are connected with furniture enabled',()=>{
 const nav=read('build/web/native-current/native-navigation.json'),walk=new WalkSurface(nav),hall=nav.stations.find(s=>s.room_id==='f2-101');
 for(const id of ['102','103','104','105','106','107','108','109','110']){
  const station=nav.stations.find(s=>s.room_id==='f2-'+id);assert.ok(station,id);assert.ok(walk.path(hall.position,station.position,true),id);
 }
});
test('Transparent atlas images retain alpha in both delivery profiles',()=>{
 for(const profile of ['desktop','mobile'])for(const name of ['architecture','interior','garden']){
  const b=fs.readFileSync(new URL(`build/web/batched/${profile}/${name}.glb`,root)),len=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+len));
  for(const m of g.materials.filter(m=>m.alphaMode==='BLEND')){
   const t=g.textures[m.pbrMetallicRoughness.baseColorTexture.index],im=g.images[t.source??t.extensions.EXT_texture_webp.source],v=g.bufferViews[im.bufferView],img=b.subarray(28+len+(v.byteOffset??0),28+len+(v.byteOffset??0)+v.byteLength),kind=img.toString('ascii',12,16);
   assert.ok(kind==='VP8X'&&(img[20]&16)||kind==='VP8L'&&(img.readUInt32LE(21)&0x10000000),`${profile}/${name}/${m.name} lost alpha`);
  }
 }
});
test('Basement storage recess stays empty within the thin wall returns',()=>{
 const s=read('build/web/native-current/sections-current.json').slices[0],p=[];
 for(let i=0;i<s.p.length;i+=2)p.push([s.p[i],s.p[i+1]]);
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const q=[-5.45,-5];
 for(let i=0;i<s.i.length;i+=3){const [a,b,c]=s.i.slice(i,i+3).map(j=>p[j]),v=[cross(a,b,q),cross(b,c,q),cross(c,a,q)];assert.ok(!(v.every(n=>n>1e-8)||v.every(n=>n< -1e-8)));}
});
test('Terrain section includes raised parcel terrain without adding a draw layer',()=>{
 const soil=read('build/web/native-current/native-soil-section.json');assert.ok(soil.fill_area_m2>150&&soil.fill_area_m2<300);assert.equal(soil.height,1.6);
});
