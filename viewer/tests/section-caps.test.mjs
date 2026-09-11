import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as THREE from 'three';
import {createSoilCap,createHatchMaterial,SOIL_CUT_HEIGHT,floorDatums} from '../src/section.js';
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
  assert.ok(Math.abs(slice(1.6).area-15.878)<0.05);
  assert.ok(Math.abs(slice(4.6996).area-14.719)<0.05);
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

test('The hatch factory reproduces the wall preset byte for byte and parameterises the soil one',()=>{
  const wall=createHatchMaterial({pitch:0.14,duty:0.065,ground:[0.70,0.64,0.53],ink:[0.19,0.17,0.13]});
  assert.match(wall.fragmentShader,/\/ 0\.1400;/);
  assert.match(wall.fragmentShader,/smoothstep\(0\.0650, 0\.0650 \+ edge/);
  assert.match(wall.fragmentShader,/vec3\(0\.70, 0\.64, 0\.53\)/);
  assert.match(wall.fragmentShader,/#include <tonemapping_fragment>/);
  const soil=createHatchMaterial({pitch:0.25,duty:0.055,ground:[0.3864,0.4020,0.3864],ink:[0.1384,0.1559,0.1356]});
  assert.match(soil.fragmentShader,/\/ 0\.2500;/);
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
