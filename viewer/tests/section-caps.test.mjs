import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as THREE from 'three';
import {createSoilCap,createHatchMaterial,createWallCaps,SECTION_POCHE,SOIL_POCHE,SOIL_CUT_HEIGHT,floorDatums} from '../src/section.js';
import {splitContextSoil,PLOT_SOIL_NODE,authoredNodeName} from '../src/context-massing.js';

// All reads target the delivered set; viewer/public/models/full/ is a stale
// version-2 delivery with no section-caps at all.
const delivered=name=>new URL(`build/web/full/${name}`,new URL('../../',import.meta.url));
const glb=(()=>{const data=fs.readFileSync(delivered('section-caps.glb'));
  return {data,json:JSON.parse(data.subarray(20,20+data.readUInt32LE(12)))};})();
const manifest=JSON.parse(fs.readFileSync(delivered('manifest.json')));
const atlas=JSON.parse(fs.readFileSync(delivered('sections.json')));

test('The manifest describes the section-caps file that is actually on disk',()=>{
  // This failed on arrival: the record still carried the pre-recompression
  // bytes/sha (86644 / eb432e73…) while the file had been re-encoded.
  const raw=fs.readFileSync(delivered('section-caps.glb'));
  assert.equal(manifest.section_cap_asset.bytes,raw.length);
  assert.equal(manifest.section_cap_asset.sha256,crypto.createHash('sha256').update(raw).digest('hex'));
  assert.equal(manifest.section_cap_asset.triangles,3366);
});

test('Every authored cap sits exactly on a documented cut height',()=>{
  const heights={'R32 F0 soil cut face.001':1.6,'R32 F0 wall cut face.001':1.6,
    'R32 F1 wall cut face.001':4.6996,'R32 F2 roof cut face':7.9714,'R32 F2 wall cut face.001':7.9714,
    'R32 F3 roof cut face':10.7705,'R32 F3 wall cut face.001':10.7705};
  assert.equal(glb.json.meshes.length,7);
  for(const mesh of glb.json.meshes){
    const expected=heights[mesh.name];
    assert.ok(expected!==undefined,mesh.name);
    for(const primitive of mesh.primitives){
      const accessor=glb.json.accessors[primitive.attributes.POSITION];
      // Draco geometry still carries accessor min/max, which is enough to pin
      // the plane: a cap is flat exactly when min.y === max.y.
      assert.ok(Math.abs(accessor.min[1]-expected)<5e-4,`${mesh.name} min ${accessor.min[1]}`);
      assert.ok(Math.abs(accessor.max[1]-expected)<5e-4,`${mesh.name} max ${accessor.max[1]}`);
    }
  }
  // and the four heights are the documented cuts
  assert.deepEqual(atlas.exact_floor_heights_m,[1.6,4.6996,7.9714,10.7705]);
  for(const [f,expected] of [[0,1.6],[1,4.6996],[2,7.9714],[3,10.7705]])
    assert.ok(Math.abs(floorDatums[f]+(f===3?1.3:1.6)-expected)<1e-9,'floor '+f);
});

test('The wall and roof caps are redundant with the atlas, licensing the decision not to draw them',()=>{
  // If a future export changes this, the decision has to be revisited - that
  // is what this test is for, not decoration.
  const slice=h=>atlas.slices.find(s=>Math.abs(s.height-h)<1e-6);
  // 15.878 before R40; the B03 enclosure adds 0.486 m² of partition
  // cross-section to the basement cut (walls on the 2C056/2C11F witness lines).
  assert.ok(Math.abs(slice(1.6).area-16.364)<0.05);
  // 14.719 before R40; the Giriş doorway takes 0.199 m² of wall out of the
  // ground-floor cut, which is the 1.25 m opening across a 0.160 m wall.
  assert.ok(Math.abs(slice(4.6996).area-14.520)<0.05);
  assert.ok(Math.abs(slice(7.9714).area-17.812)<0.05);
  assert.ok(Math.abs(slice(10.7705).area-24.487)<0.05);
  // the soil face, by contrast, exists nowhere in the atlas: no slice at any
  // height reaches even half its 197.89 m2
  for(const s of atlas.slices)assert.ok(s.area<99,`slice at ${s.height} carries ${s.area}`);
});

const capScene=()=>{
  const scene=new THREE.Group();
  const soil=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshStandardMaterial({name:'R32 | soil section hatch'}));
  soil.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array([0,1.6,0, 1,1.6,0, 0,1.6,1]),3));
  const wall=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshStandardMaterial({name:'R32 | wall section hatch'}));
  wall.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(9),3));
  scene.add(soil,wall);
  return scene;
};

test('createSoilCap keeps exactly the soil face and shows it only at the basement cut',()=>{
  const soilCap=createSoilCap(capScene());
  assert.ok(soilCap);
  const meshes=[];soilCap.group.traverse(o=>{if(o.isMesh)meshes.push(o);});
  assert.equal(meshes.length,1);
  assert.equal(meshes[0].name,'Solid hatched soil cross section');
  assert.equal(meshes[0].castShadow,false);
  assert.equal(meshes[0].material.side,THREE.DoubleSide);
  soilCap.update(SOIL_CUT_HEIGHT,true);assert.equal(soilCap.group.visible,true);
  soilCap.update(4.6996,true);assert.equal(soilCap.group.visible,false,'no authored face exists at the upper cuts');
  soilCap.update(SOIL_CUT_HEIGHT,false);assert.equal(soilCap.group.visible,false,'whole-building states hide it');
  assert.equal(createSoilCap(new THREE.Group()),null,'a delivery without the cap degrades to the old behaviour');
});

test('What the plane cuts is drawn as black poché, ruled, with earth and masonry told apart by pitch',()=>{
  const wall=createHatchMaterial(SECTION_POCHE);
  assert.match(wall.fragmentShader,/\/ 0\.1400;/);
  assert.match(wall.fragmentShader,/smoothstep\(0\.0650, 0\.0650 \+ edge/);
  assert.match(wall.fragmentShader,/#include <tonemapping_fragment>/);
  const soil=createHatchMaterial(SOIL_POCHE);
  assert.match(soil.fragmentShader,/\/ 0\.2500;/);
  // R40: the ground goes black so that pulling back - where the shader's own
  // anti-alias fade flattens the ruling - leaves solid poché rather than a
  // flat tan panel, and the ruling is the lighter of the two so it reads on it.
  for(const preset of [SECTION_POCHE,SOIL_POCHE]){
    assert.ok(Math.max(...preset.ground)<0.05,JSON.stringify(preset.ground));
    assert.ok(Math.min(...preset.ink)>Math.max(...preset.ground)*4);
  }
  assert.notEqual(SECTION_POCHE.pitch,SOIL_POCHE.pitch,'earth and masonry share the ink, not the ruling');
});

test('Only the plot soil node receives private, marked material instances',()=>{
  const sanitize=s=>s.replace(/\s/g,'_').replace(/[\[\]./:]/g,'');
  const terrainMaterial=new THREE.MeshStandardMaterial({name:'R31 | R39 continuous grass ground'});
  const limestone=new THREE.MeshStandardMaterial({name:'Retaining wall rough limestone'});
  const root=new THREE.Group();
  const soil=new THREE.Mesh(new THREE.BufferGeometry(),[terrainMaterial,limestone]);
  soil.name=sanitize('R32 | Continuous local soil volume');
  const terrain=new THREE.Mesh(new THREE.BufferGeometry(),terrainMaterial);
  terrain.name=sanitize('Terrain — CAD TK and road levels with terraced pads');
  const foundation=new THREE.Mesh(new THREE.BufferGeometry(),limestone);
  foundation.name=sanitize('B10 foundation below BK');
  root.add(soil,terrain,foundation);
  assert.ok(PLOT_SOIL_NODE.test(authoredNodeName(soil.name)));
  splitContextSoil(root);
  assert.notEqual(soil.material[0],terrainMaterial,'the soil grass skin is split off the terrain');
  assert.notEqual(soil.material[1],limestone,'the soil limestone is split off the foundations');
  assert.equal(soil.material[0].userData.plotSoil,true);
  assert.equal(soil.material[1].name,'Retaining wall rough limestone · plot section');
  assert.equal(terrain.material,terrainMaterial,'the terrain keeps the original instance');
  assert.equal(foundation.material,limestone,'the foundations keep the original instance');
  assert.ok(!terrainMaterial.userData.plotSoil);
});

test('Everything the plane cuts is poché, and the furniture poché goes with the furniture',()=>{
  // R40: the atlas used to carry wall cross-sections only, so a plan cut
  // through a wardrobe or a door leaf showed the inside of it. Fixed bodies
  // and furniture are filled too, in their own arrays, because the furniture
  // toggle has to be able to take a cut away with the thing that casts it.
  const at=h=>atlas.slices.find(s=>Math.abs(s.height-h)<1e-6);
  assert.deepEqual(atlas.object_caps.arrays,{fixed:['q','j'],furniture:['fq','fj']});
  for(const h of [1.6,4.6996,7.9714,10.7705]){
    const s=at(h);
    assert.ok(s.q.length>0,`no fixed cap at ${h}`);
    assert.equal(s.q.length%2,0); assert.equal(s.j.length%3,0);
    assert.ok(Math.max(...s.j)<s.q.length/2,`fixed cap index out of range at ${h}`);
    if(s.fq?.length){
      assert.equal(s.fq.length%2,0); assert.equal(s.fj.length%3,0);
      assert.ok(Math.max(...s.fj)<s.fq.length/2,`furniture cap index out of range at ${h}`);
    }
  }
  // the storeys people look at all carry furniture caps; the basement's own
  // cut passes above everything loose in it, which is a fact about the room
  assert.ok([4.6996,7.9714,10.7705].every(h=>at(h).fq.length>0));
  const caps=createWallCaps(atlas);
  caps.update(4.6996,true);
  const named=caps.group.children.map(m=>m.name);
  assert.equal(named.length,3);
  assert.ok(named.some(n=>/furniture/.test(n)));
  const furniture=caps.group.children.find(m=>/furniture/.test(m.name));
  assert.equal(furniture.visible,true);
  caps.setFurnitureVisible(false); caps.update(4.6996,true);
  assert.equal(furniture.visible,false);
  for(const mesh of caps.group.children)assert.ok(Math.abs(mesh.position.y-4.6996)<1e-9);
});
