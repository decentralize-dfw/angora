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
  assert.equal(gradeKey('interior'),'');
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
  // 8 m plane over a 2 m module: the uv span must be exactly 4 repeats.
  const uv=ground.geometry.attributes.uv;
  let minU=1e9,maxU=-1e9;for(let i=0;i<uv.count;i++){minU=Math.min(minU,uv.getX(i));maxU=Math.max(maxU,uv.getX(i));}
  assert.ok(Math.abs(maxU-minU-4)<1e-6,`${maxU-minU}`);
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

test("An authored tint never restains a bound sheet, and placeholder stubs yield to colour grades",()=>{
  const sets={clayTileMap:new THREE.Texture(),clayTileNormal:new THREE.Texture(),
    grassMap:new THREE.Texture(),asphaltMap:new THREE.Texture(),
    travertineMap:new THREE.Texture(),travertineNormal:new THREE.Texture(),stuccoNormal:new THREE.Texture()};
  // bldg-3 ships 'Clay tile' textureless with a dark rust colour factor
  const tile=new THREE.MeshStandardMaterial({name:'Clay tile',color:0x752008});
  const roofMesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),tile);
  const scene=new THREE.Group();scene.add(roofMesh);
  applyGradeValues(scene,'building');
  bindGradeTextures([{scene}],sets);
  assert.ok(tile.map,'tile sheet bound');
  assert.equal('#'+tile.color.getHexString(),'#ffffff','tint cleared - the sheet carries the hue');
  // The sheet used to hold ONE tile and now holds 9x7 of them, so the
  // audited density divides through: 0.64 m per UV unit over a 2.4 m
  // sheet. The old number drew 4.7 cm tiles on the villa while the
  // neighbours drew 34 cm ones.
  assert.ok(tile.map.repeat.x>0.26&&tile.map.repeat.x<0.27,'sheet scaled to real tile size');
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
