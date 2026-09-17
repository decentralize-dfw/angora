import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {neutraliseTransmission} from '../src/material-response.js';
import {splitContextBuildings} from '../src/context-massing.js';
import {prepareContextSurfaces} from '../src/context-surfaces.js';
import {isSeeThrough,isGlazing} from '../src/lighting.js';

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

test("The numbered 'grass (1)' skin is still the ground family",()=>{
  const context=new THREE.Group();
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(10,10),new THREE.MeshStandardMaterial({name:'grass (1)'}));
  context.add(ground);
  const bounds=prepareContextSurfaces(context,new THREE.Color('#e4e9ed'));
  assert.ok(bounds,'ground found, so smoothing and the horizon fade are back on');
  assert.equal(ground.castShadow,false);
});
