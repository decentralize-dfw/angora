import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {PropertyBinding} from 'three';
import {materialSignature,mergeEqualMaterials,abstractVehicle,splitContextBuildings,
  createContextMassing,authoredNodeName,MASSING_ALBEDO,VEHICLE_ALBEDO} from '../src/context-massing.js';
import {batchContext} from '../src/context-batch.js';
import {prepareContextSurfaces} from '../src/context-surfaces.js';

const box=()=>{const g=new THREE.BoxGeometry(1,1,1);g.deleteAttribute('uv');
  g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));return g;};
// Name each node the way GLTFLoader will: it sanitises whitespace to `_` and
// drops []./:, which is exactly what a prefix match has to survive.
const mesh=(name,material)=>{const m=new THREE.Mesh(box(),material);
  m.name=PropertyBinding.sanitizeNodeName(name);return m;};

test('Materials that differ only in their export name collapse onto one instance',()=>{
  const a=new THREE.MeshStandardMaterial({name:'garden cream limestone',color:0xd8d2c4,roughness:.8});
  const b=new THREE.MeshStandardMaterial({name:'garden cream limestone.001',color:0xd8d2c4,roughness:.8});
  const c=new THREE.MeshStandardMaterial({name:'garden cream limestone.002',color:0xd8d2c4,roughness:.42});
  assert.equal(materialSignature(a),materialSignature(b));
  assert.notEqual(materialSignature(a),materialSignature(c),'roughness is a real difference, not a duplicate');
  const root=new THREE.Group();
  const first=mesh('one',a),second=mesh('two',b),third=mesh('three',c);
  root.add(first,second,third);
  assert.equal(mergeEqualMaterials(root),1);
  assert.equal(second.material,first.material,'the duplicate now shares the first instance');
  assert.notEqual(third.material,first.material,'the surface that really differs is left alone');
});

test('Two materials that share a texture slot by value but not by image stay apart',()=>{
  const shared=new THREE.Texture();
  const other=new THREE.Texture();
  const a=new THREE.MeshStandardMaterial({name:'roof',color:0xffffff});a.map=shared;
  const b=new THREE.MeshStandardMaterial({name:'green tiles',color:0xffffff});b.map=other;
  assert.notEqual(materialSignature(a),materialSignature(b));
  b.map=shared;
  assert.equal(materialSignature(a),materialSignature(b));
});

test('The garage vehicle reduces to a single abstract base',()=>{
  const root=new THREE.Group();
  const parts=['BodyHood','WheelFrontLRim','BodyWindshield','Interior seat'].map((part,i)=>
    mesh('R35 | Garage vehicle / '+part,new THREE.MeshStandardMaterial({name:'Paint '+i,color:0x8c1b2b,metalness:.9})));
  const kitchen=mesh('Kitchen review 15 | sink run carcass side',new THREE.MeshStandardMaterial({name:'chrome',metalness:1}));
  root.add(...parts,kitchen);
  assert.equal(abstractVehicle(root),4);
  const base=parts[0].material;
  for(const part of parts)assert.equal(part.material,base,'every panel shares the one base');
  assert.equal('#'+base.color.getHexString(),VEHICLE_ALBEDO);
  assert.equal(kitchen.material.name,'chrome','the garage around it keeps its own surfaces');
});

test('Whitening the neighbour blocks cannot reach the site surface they share',()=>{
  // stone_tile is both the neighbours' floor slabs and the road curbs. Only the
  // building side may turn white.
  const paving=new THREE.MeshStandardMaterial({name:'stone_tile',color:0xbdb6a8});
  const roof=new THREE.MeshStandardMaterial({name:'roof',color:0x9c5b3f});
  const root=new THREE.Group();
  const slab=mesh('B10 | KAT 0$ZEMİN',paving),curb=mesh('CAD curb edges',paving);
  const tiles=mesh('B12 | ÇATII',roof),footing=mesh('B12 foundation below BK',roof);
  root.add(slab,curb,tiles,footing);
  splitContextBuildings(root);
  assert.notEqual(slab.material,curb.material,'the shared surface was split');
  assert.equal(slab.material.userData.contextBuilding,true);
  assert.ok(!curb.material.userData.contextBuilding,'the curb stays site');
  assert.equal(tiles.material,footing.material,'a building-only surface is tagged in place, not duplicated');
  assert.equal(roof.userData.contextBuilding,true);
});

test('The massing fade drives one shared uniform and only in the close views',()=>{
  const paving=new THREE.MeshStandardMaterial({name:'stone_tile',color:0xbdb6a8});
  const wall=new THREE.MeshStandardMaterial({name:'neighbor_wall',color:0xd9d2c6});
  const root=new THREE.Group();
  root.add(mesh('B10 | KAT 0$DUVAR',wall),mesh('B10 | KAT 0$ZEMİN',paving),mesh('CAD curb edges',paving));
  const context=batchContext(splitContextBuildings(root));
  const massing=createContextMassing(context);
  assert.equal(massing.surfaces,2,'wall and the split paving, never the curb');
  const uniforms=[];
  context.traverse(o=>{if(!o.isMesh||!o.material.userData.contextBuilding)return;
    const shader={uniforms:{},vertexShader:'',fragmentShader:
      '#include <color_fragment>\n#include <roughnessmap_fragment>\n#include <metalnessmap_fragment>\n'};
    o.material.onBeforeCompile(shader,null);uniforms.push(shader);});
  assert.equal(uniforms.length,2);
  assert.equal(uniforms[0].uniforms.massingBlend,uniforms[1].uniforms.massingBlend,'one uniform, so they cross over together');
  assert.equal('#'+uniforms[0].uniforms.massingColour.value.getHexString(),MASSING_ALBEDO);
  // Albedo is mixed before lighting, so the sun and the occlusion pass still
  // describe a solid rather than flattening it to a silhouette.
  for(const shader of uniforms){
    assert.match(shader.fragmentShader,/#include <color_fragment>\s*\ndiffuseColor\.rgb = mix\(diffuseColor\.rgb, massingColour, massingBlend\);/);
    assert.match(shader.fragmentShader,/roughnessFactor = mix\(roughnessFactor, 0\.86, massingBlend\)/);
    assert.match(shader.fragmentShader,/metalnessFactor = mix\(metalnessFactor, 0\.0, massingBlend\)/);
  }
  const blend=uniforms[0].uniforms.massingBlend;
  massing.set('neighborhood',true);assert.equal(blend.value,0);
  massing.set('building',true);assert.equal(blend.value,1,'the villa view is white');
  massing.set('f2',true);assert.equal(blend.value,1,'so are the floor cuts');
  massing.set('region',true);assert.equal(blend.value,0,'the region reads photographically');
});

test('The fade eases across its whole span instead of cutting',()=>{
  const root=new THREE.Group();
  root.add(mesh('B10 | KAT 0$DUVAR',new THREE.MeshStandardMaterial({name:'neighbor_wall'})));
  const massing=createContextMassing(splitContextBuildings(root));
  const start=performance.now();
  massing.set('building');
  assert.equal(massing.value,0,'no jump on the frame the view changes');
  assert.equal(massing.update(start+450),true);
  assert.ok(massing.value>.35&&massing.value<.65,`half way through the span, got ${massing.value}`);
  assert.equal(massing.update(start+2000),true);
  assert.equal(massing.value,1);
  assert.equal(massing.update(start+2100),false,'settled frames stop asking to redraw');
});

test('The horizon fade survived the R39 surface rename',()=>{
  // R39 renamed `grass` to `R31 | R39 continuous grass ground`; matching the
  // old name exactly left the whole pass switched off.
  const ground=new THREE.MeshStandardMaterial({name:'R31 | R39 continuous grass ground'});
  const curb=new THREE.MeshStandardMaterial({name:'stone_tile'});
  const wall=new THREE.MeshStandardMaterial({name:'neighbor_wall'});
  const root=new THREE.Group();
  root.add(mesh('Terrain — CAD TK and road levels',ground),mesh('CAD curb edges',curb),mesh('B10 | KAT 0$DUVAR',wall));
  splitContextBuildings(root);
  const bounds=prepareContextSurfaces(root,new THREE.Color('#b9c6d4'));
  assert.ok(bounds,'the ground surface was found');
  const compiled=material=>{const shader={uniforms:{},vertexShader:'#include <project_vertex>',
    fragmentShader:'#include <opaque_fragment>'};material.onBeforeCompile(shader,null);return shader;};
  assert.match(compiled(ground).fragmentShader,/edgeFade/);
  assert.match(compiled(curb).fragmentShader,/edgeFade/);
  assert.ok(!/edgeFade/.test(compiled(wall).fragmentShader),'the neighbour blocks are not the horizon');
});

test('Node prefixes survive the loader renaming them',()=>{
  // The first cut of this matched the authored names and silently matched
  // nothing: GLTFLoader had already turned `B10 | KAT 0$DUVAR` into
  // `B10_|_KAT_0$DUVAR`, so no neighbour block was ever tagged and the villa
  // view stayed exactly as it was.
  assert.equal(PropertyBinding.sanitizeNodeName('B10 | KAT 0$DUVAR'),'B10_|_KAT_0$DUVAR');
  assert.equal(authoredNodeName('B10_|_KAT_0$DUVAR'),'B10 | KAT 0$DUVAR');
  assert.equal(authoredNodeName(PropertyBinding.sanitizeNodeName('R35 | Garage vehicle / BodyHood')),
    'R35 | Garage vehicle BodyHood');
  const root=new THREE.Group();
  const wall=new THREE.MeshStandardMaterial({name:'neighbor_wall'});
  root.add(mesh('B10 | KAT 0$DUVAR',wall),mesh('B7 foundation below BK',wall),
    mesh('R35 | Garage vehicle / WheelFrontLRim',new THREE.MeshStandardMaterial({name:'Rim1'})),
    mesh('CAD curb edges',new THREE.MeshStandardMaterial({name:'stone_tile'})));
  assert.equal(abstractVehicle(root),1);
  splitContextBuildings(root);
  assert.equal(wall.userData.contextBuilding,true,'the blocks and their footings were found');
  assert.equal(createContextMassing(root).surfaces,1);
});

test('A node that only starts with a B is not a neighbour block',()=>{
  const material=new THREE.MeshStandardMaterial({name:'grass'});
  const root=new THREE.Group();
  root.add(mesh('Bahçe merdiveni',material),mesh('B7 | KAT 0$DUVAR',material));
  splitContextBuildings(root);
  const names=[];root.traverse(o=>{if(o.isMesh)names.push(Boolean(o.material.userData.contextBuilding));});
  assert.deepEqual(names,[false,true]);
});
