import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {neutraliseTransmission} from '../src/material-response.js';
import {splitContextBuildings,materialSignature} from '../src/context-massing.js';
import {prepareContextSurfaces} from '../src/context-surfaces.js';
import {isSeeThrough,isGlazing} from '../src/lighting.js';
import {gradeKey,applyGradeValues,bindGradeTextures} from '../src/exterior-grade.js';

test('Transmission becomes alpha glazing at load: no per-frame scene copy, still see-through',()=>{
  const glass=new THREE.MeshPhysicalMaterial({name:'glass',transmission:1,opacity:1});
  const frosted=new THREE.MeshPhysicalMaterial({name:'R31 | R33 shower frosted glass',transmission:.8,opacity:1});
  const wall=new THREE.MeshStandardMaterial({name:'stucco',opacity:1});
  const root=new THREE.Group();
  for(const m of [glass,frosted,wall])root.add(new THREE.Mesh(new THREE.BufferGeometry(),m));
  assert.equal(neutraliseTransmission(root),2);
  for(const m of [glass,frosted]){
    assert.equal(m.transmission,0,'the transmission pass trigger is gone');
    assert.ok(m.transparent&&m.opacity<.98,'still classified glazing by opacity');
    assert.ok(isSeeThrough(m)&&isGlazing(m));
    assert.equal(m.depthWrite,false);
  }
  // Clearer glass reads as lower alpha; frosted keeps more body.
  assert.ok(glass.opacity<frosted.opacity);
  // Untouched surfaces stay exactly as authored.
  assert.equal(wall.opacity,1);assert.equal(wall.transparent,false);
});

test('A context file in the buildings role whitens wholesale, minus plainly-site nodes',()=>{
  const material=name=>new THREE.MeshStandardMaterial({name});
  const mesh=(node,m)=>{const g=new THREE.Mesh(new THREE.BufferGeometry(),m);g.name=node;return g;};
  const root=new THREE.Group();
  const wallM=material('neighbor_wall'),glazeM=material('Context glazing'),roofM=material('roof');
  const leafM=material('foliage_light'),boundM=material('R31 | R39 boundary limestone top');
  root.add(mesh('neighbor_wall.001',wallM),mesh('Context_glazing.001',glazeM),mesh('roof.001',roofM),
    mesh('foliage_light.001',leafM),mesh('R31_|_R39_boundary_limestone_top.001',boundM));
  splitContextBuildings(root,{role:'buildings'});
  for(const m of [wallM,glazeM,roofM])assert.ok(m.userData.contextBuilding,m.name);
  for(const m of [leafM,boundM])assert.ok(!m.userData.contextBuilding,m.name+' is site');
  // Without the role, the same file matches nothing: no B## nodes exist.
  const plain=new THREE.Group();const againM=material('neighbor_wall');
  plain.add(mesh('neighbor_wall.001',againM));
  splitContextBuildings(plain);
  assert.ok(!againM.userData.contextBuilding);
});

test("bldg-3's renamed spellings still land in their families",async()=>{
  const {materialFamily}=await import('../src/material-response.js');
  assert.equal(materialFamily('STRUCCO'),'masonry');
  assert.equal(materialFamily('WHT'),'masonry');
  assert.equal(materialFamily('roof-7'),'roof');
  assert.equal(materialFamily('WOOD-FL'),'floor');
  assert.equal(materialFamily('INTERIOR'),'plaster');
  assert.equal(materialFamily('Clay tile'),'roof');
});

test('The exterior grade knows its surfaces and leaves everything else alone',()=>{
  assert.equal(gradeKey('Clay tile 5 [imported]'),'clay-tile');
  assert.equal(gradeKey('Clay tile'),'clay-tile');
  assert.equal(gradeKey('roof-7'),'villa-roof');
  assert.equal(gradeKey('STRUCCO'),'stucco');
  assert.equal(gradeKey('stone_tile (4).001'),'terrace');
  assert.equal(gradeKey('grass (1)'),'grass');
  assert.equal(gradeKey('Entrance coursed limestone (1)'),'', 'the healthy 52 m wall is not re-tiled');
  assert.equal(gradeKey('stone_tile'),'', 'the villa wall stone is not a paver');
  assert.equal(gradeKey('interior'),'plaster-grain','interior plaster gets its grain');
  assert.equal(gradeKey('leather_brown'),'');
  // Application is additionally gated by the manifest asset id: evrebina's
  // photographic neighbour roofs never take the villa tile sheet.
  const roof=new THREE.MeshStandardMaterial({name:'roof.004'});
  const scene=new THREE.Group();scene.add(new THREE.Mesh(new THREE.BufferGeometry(),roof));
  applyGradeValues(scene,'evrebina');
  assert.equal(roof.userData.exteriorGrade,'','stamped as ungraded for this asset');
  const iron=new THREE.MeshStandardMaterial({name:'metal (4)'});
  const scene2=new THREE.Group();scene2.add(new THREE.Mesh(new THREE.BufferGeometry(),iron));
  applyGradeValues(scene2,'building');
  assert.equal(iron.userData.exteriorGrade,'iron');
  assert.equal('#'+iron.color.getHexString(),'#212326');
  assert.equal(iron.roughness,0.58);
  // A graded name can never merge with an ungraded look-alike.
  const a=new THREE.MeshStandardMaterial({name:'grass (1)'}),b=new THREE.MeshStandardMaterial({name:'meadow'});
  assert.notEqual(materialSignature(a),materialSignature(b));
});

test('Ground UVs are rebuilt from world metres on up-facing meshes only',()=>{
  const sets={grassMap:new THREE.Texture(),asphaltMap:new THREE.Texture(),
    travertineMap:new THREE.Texture(),travertineNormal:new THREE.Texture(),
    clayTileMap:new THREE.Texture(),clayTileNormal:new THREE.Texture()};
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(8,8),new THREE.MeshStandardMaterial({name:'grass (1)'}));
  ground.rotation.x=-Math.PI/2; // faces up
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(8,8),new THREE.MeshStandardMaterial({name:'grass (1)'}));
  const scene=new THREE.Group();scene.add(ground,wall);
  applyGradeValues(scene,'context-ground');
  const wallUV=wall.geometry.attributes.uv.array.slice();
  bindGradeTextures([{scene}],sets);
  // 8 m plane over a 3 m module: the uv span must be exactly 8/3 repeats.
  const uv=ground.geometry.attributes.uv;
  let minU=1e9,maxU=-1e9;for(let i=0;i<uv.count;i++){minU=Math.min(minU,uv.getX(i));maxU=Math.max(maxU,uv.getX(i));}
  assert.ok(Math.abs(maxU-minU-8/3)<1e-6,`${maxU-minU}`);
  // the vertical copy keeps its authored UVs
  assert.deepEqual([...wall.geometry.attributes.uv.array],[...wallUV]);
  assert.equal(ground.material.map,sets.grassMap,'ground texture bound at unit repeat');
  // and a missing texture set still leaves the grade harmless
  const bare=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshStandardMaterial({name:'asphalt'}));
  bare.rotation.x=-Math.PI/2;
  const scene2=new THREE.Group();scene2.add(bare);
  applyGradeValues(scene2,'context-ground');
  bindGradeTextures([{scene:scene2}],null);
  assert.equal(bare.material.map,null);
});

test("Modelled roof tiles draw their own lottery, and stubs yield to colour grades",()=>{
  const sets={grassMap:new THREE.Texture(),asphaltMap:new THREE.Texture(),
    travertineMap:new THREE.Texture(),travertineNormal:new THREE.Texture(),
    stuccoNormal:new THREE.Texture(),stuccoMottle:new THREE.Texture()};
  // two disjoint quads = two modelled tiles; each must take ONE colour
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([
    0,0,0, 1,0,0, 0,1,0,  1,0,0, 1,1,0, 0,1,0,      // tile A
    5,0,0, 6,0,0, 5,1,0,  6,0,0, 6,1,0, 5,1,0],3)); // tile B
  const tile=new THREE.MeshStandardMaterial({name:'Clay tile',color:0x752008});
  const roofMesh=new THREE.Mesh(g,tile);
  const scene=new THREE.Group();scene.add(roofMesh);
  applyGradeValues(scene,'building');
  bindGradeTextures([{scene}],sets);
  assert.equal(tile.map,null,'no painted sheet fights the modelled tiles');
  assert.equal(tile.vertexColors,true);
  assert.equal('#'+tile.color.getHexString(),'#ffffff','authored rust tint cleared');
  const colour=g.attributes.color;
  assert.ok(colour&&colour.count===12);
  const cornerOf=i=>[colour.getX(i),colour.getY(i),colour.getZ(i)].join(',');
  assert.equal(cornerOf(0),cornerOf(4),'tile A is one colour');
  assert.equal(cornerOf(6),cornerOf(10),'tile B is one colour');
  // the facade keeps its authored blue-grey under the near-white mottle
  const facade=new THREE.MeshStandardMaterial({name:'STRUCCO',color:0x9aa3ab});
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(1,1),facade);
  const scene3=new THREE.Group();scene3.add(wall);
  applyGradeValues(scene3,'building');
  bindGradeTextures([{scene:scene3}],sets);
  assert.ok(facade.map,'mottle bound');
  assert.equal('#'+facade.color.getHexString(),'#9aa3ab','keepTint holds the photo hue');
  // a 4x4 placeholder baseColor is dropped when a colour grade lands
  const stub=new THREE.Texture();stub.image={width:4,height:4};
  const rail=new THREE.MeshStandardMaterial({name:'metal (4)'});rail.map=stub;
  const scene2=new THREE.Group();scene2.add(new THREE.Mesh(new THREE.PlaneGeometry(1,1),rail));
  applyGradeValues(scene2,'building');
  assert.equal(rail.map,null);
  assert.equal('#'+rail.color.getHexString(),'#212326');
});

test("The numbered 'grass (1)' skin is still the ground family",()=>{
  const context=new THREE.Group();
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(10,10),new THREE.MeshStandardMaterial({name:'grass (1)'}));
  context.add(ground);
  const bounds=prepareContextSurfaces(context,new THREE.Color('#e4e9ed'));
  assert.ok(bounds,'ground found, so smoothing and the horizon fade are back on');
  assert.equal(ground.castShadow,false);
});
