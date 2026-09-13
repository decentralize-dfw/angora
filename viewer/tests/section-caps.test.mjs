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
  // Counted from the file rather than frozen, so adding a cap updates the
  // record instead of failing here: what is being checked is that they agree.
  const triangles=glb.json.meshes.reduce((sum,mesh)=>sum+mesh.primitives
    .reduce((n,primitive)=>n+glb.json.accessors[primitive.indices].count/3,0),0);
  assert.equal(manifest.section_cap_asset.triangles,triangles);
  assert.equal(manifest.section_cap_asset.exported_mesh_nodes,glb.json.meshes.length);
});

test('Every authored cap sits exactly on a documented cut height',()=>{
  const heights={'R32 F0 soil cut face.001':1.6,'R32 F0 wall cut face.001':1.6,
    'R32 F1 wall cut face.001':4.6996,'R32 F2 roof cut face':7.9714,'R32 F2 wall cut face.001':7.9714,
    'R32 F3 roof cut face':10.7705,'R32 F3 wall cut face.001':10.7705,
    // R44: the excavated void beside the basement, closed as ground with a
    // skirt; drawn 2 mm OVER the plane so the buried stubs' own cuts lie
    // under it, so it is the one face that is deliberately not flat
    'R44 F0 excavation fill':null};
  assert.equal(glb.json.meshes.length,8);
  for(const mesh of glb.json.meshes){
    const expected=heights[mesh.name];
    assert.ok(expected!==undefined,mesh.name);
    // the site field is draped over the ground, so it is the one face that is
    // deliberately not flat; its own bounds are checked by the closure test
    if(expected===null)continue;
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

test('The excavated void beside the basement is closed as ground, and the rejected full-site field stays gone',()=>{
  // R44, and the instruction is the review's own: "bodrum katında boş kısım
  // var ya, orasını taramalısın. boş gözükmemeli öyle. orda o kolonları da
  // gösterme." The R42 full-site field - the whole plot inked at one height,
  // lawns and pool terrace included - was rejected and stays out; what is
  // closed now is only the enclosed excavation under the entrance wing, the
  // strip the plane finds with no earth to cut and no room to draw, where
  // the buried stub walls and columns stood in an open pit.
  const report=JSON.parse(fs.readFileSync(new URL('build/basement-void-fill-r44.json',new URL('../../',import.meta.url))));
  assert.equal(report.cut_height_m,SOIL_CUT_HEIGHT);
  // the void the CAD excavated under the entrance wing measures about 48 m2;
  // the fill has to close substantially all of it and cannot grow into the
  // lawns the rejected field once inked
  assert.ok(report.fill_area_m2>30&&report.fill_area_m2<70,`${report.fill_area_m2} m2 of fill`);
  assert.ok(!glb.json.meshes.some(m=>m.name==='R42 F0 site section field'),'the rejected field is out of the delivery');
  const face=glb.json.meshes.find(m=>m.name==='R44 F0 excavation fill');
  assert.ok(face,'the delivery carries the excavation fill');
  const accessor=glb.json.accessors[face.primitives[0].attributes.POSITION];
  // the fill is drawn OVER the plane - that difference is the columns: the
  // buried stubs are cut open at exactly 1.6 and their poché is drawn there
  // too, so a face under the plane would print every one of them on the
  // ground; over it, the ground wins and the columns are simply under it
  assert.ok(Math.abs(report.drawn_at_m-(SOIL_CUT_HEIGHT+0.002))<1e-6,`drawn at ${report.drawn_at_m}`);
  assert.ok(accessor.max[1]>SOIL_CUT_HEIGHT&&accessor.max[1]<SOIL_CUT_HEIGHT+0.01,`top at ${accessor.max[1]}`);
  // its one-cell seal onto real walls stays just UNDER the plane, so a room
  // wall the fill laps onto keeps its own black cross-section on top
  assert.ok(report.seal_drawn_at_m<SOIL_CUT_HEIGHT,`seal at ${report.seal_drawn_at_m}`);
  // and skirts drop where the fill edge meets open air, so a tilted basement
  // view sees a cut block of ground rather than a sheet on stilts
  assert.ok(report.skirt_faces>50,`${report.skirt_faces} skirt faces`);
  assert.ok(accessor.min[1]<SOIL_CUT_HEIGHT-1.0,`the body reaches down to ${accessor.min[1]}`);
  // inside the property, never the neighbours' land; the grid rounds up to a
  // whole cell, so a face may reach one cell past the boundary - never further
  const edge=report.cell_m+1e-3;
  for (const capFace of glb.json.meshes.filter(m=>/soil cut face|excavation fill/.test(m.name))) {
    const a=glb.json.accessors[capFace.primitives[0].attributes.POSITION];
    assert.ok(a.min[0]>=report.property.x[0]-edge&&a.max[0]<=report.property.x[1]+edge,
      `${capFace.name} runs x ${a.min[0]}..${a.max[0]} past ${JSON.stringify(report.property.x)}`);
    assert.ok(a.max[2]<=report.property.front_z+edge,
      `${capFace.name} runs to z ${a.max[2]} past the fence at ${report.property.front_z}`);
  }
  assert.ok(report.property.x[1]-report.property.x[0]>15&&report.property.x[1]-report.property.x[0]<30,
    `the property is ${(report.property.x[1]-report.property.x[0]).toFixed(1)} m wide`);
  assert.equal(report.cap_asset_triangles,manifest.section_cap_asset.triangles);
});

test('The attic core stands clear of every attic doorway and window',()=>{
  // R41's core filled each plan cell from the floor to the highest wall
  // triangle over it, which over an opening is the head of the opening's own
  // wall - so it closed all three attic doorways and two of the three windows,
  // and nothing said so until the review did. The R42 tool now fires a ray
  // through every scheduled opening and every pane against the core it has
  // just built, and writes nothing if one is blocked. This is that record.
  const core=JSON.parse(fs.readFileSync(new URL('build/attic-partition-core-r42.json',new URL('../../',import.meta.url))));
  assert.equal(core.verified.rays_blocked,0);
  assert.equal(core.verified.doorways,3,'all three attic doorways were tested');
  assert.ok(core.verified.panes_checked>=5,`only ${core.verified.panes_checked} panes tested`);
  // a gap wider than this in a cell's sorted sample heights is an opening; it
  // has to stay well under a door head and well over the sampling step
  assert.ok(core.opening_gap_m>core.sample_m*2&&core.opening_gap_m<0.5,`gap ${core.opening_gap_m}`);
});

test('The wall and roof caps are redundant with the atlas, licensing the decision not to draw them',()=>{
  // If a future export changes this, the decision has to be revisited - that
  // is what this test is for, not decoration.
  const slice=h=>atlas.slices.find(s=>Math.abs(s.height-h)<1e-6);
  // 15.878 before R40; the B03 enclosure adds 0.486 m² of partition
  // cross-section to the basement cut (walls on the 2C056/2C11F witness lines).
  const native=atlas.revision==='native-open-doors-roads';
  // Native repairs remove duplicated/closed doorway faces and refit the attic shell.
  assert.ok(Math.abs(slice(1.6).area-(native?15.80351:16.364))<0.05); // Plan-only bathroom partitions removed.
  // 14.719 before R40; the Giriş doorway takes 0.199 m² of wall out of the
  // ground-floor cut, which is the 1.25 m opening across a 0.160 m wall.
  assert.ok(Math.abs(slice(4.6996).area-(native?14.18948:14.520))<0.05);
  assert.ok(Math.abs(slice(7.9714).area-(native?14.00075:17.812))<0.05);
  // Restoring the pre-deformation upper walls reduces this cut by 0.11982 m².
  assert.ok(Math.abs(slice(10.7705).area-(native?12.10227:24.487))<0.05);
  // the soil face, by contrast, exists nowhere in the atlas: no slice at any
  // height reaches even half its 197.89 m2
  for(const s of atlas.slices)assert.ok(s.area<99,`slice at ${s.height} carries ${s.area}`);
});

const capScene=()=>{
  const scene=new THREE.Group();
  const hatch=new THREE.MeshStandardMaterial({name:'R32 | soil section hatch'});
  const soil=new THREE.Mesh(new THREE.BufferGeometry(),hatch);
  soil.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array([0,1.6,0, 1,1.6,0, 0,1.6,1]),3));
  const fill=new THREE.Mesh(new THREE.BufferGeometry(),hatch);
  fill.name='R42 F0 site section field';
  fill.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array([2,1.6,0, 3,1.6,0, 2,1.6,1]),3));
  const wall=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshStandardMaterial({name:'R32 | wall section hatch'}));
  wall.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(9),3));
  scene.add(soil,fill,wall);
  return scene;
};

test('createSoilCap drops the rejected full-site field and keeps the true cut face',()=>{
  const soilCap=createSoilCap(capScene());
  assert.ok(soilCap);
  const meshes=[];soilCap.group.traverse(o=>{if(o.isMesh)meshes.push(o);});
  assert.equal(meshes.length,1);
  assert.ok(meshes.every(m=>m.name==='Solid hatched soil cross section'));
  assert.ok(meshes.every(m=>m.castShadow===false));
  assert.equal(meshes[0].material.side,THREE.DoubleSide);
  soilCap.update(SOIL_CUT_HEIGHT,true);assert.equal(soilCap.group.visible,true);
  soilCap.update(4.6996,true);assert.equal(soilCap.group.visible,false,'no authored face exists at the upper cuts');
  soilCap.update(SOIL_CUT_HEIGHT,false);assert.equal(soilCap.group.visible,false,'whole-building states hide it');
  assert.equal(createSoilCap(new THREE.Group()),null,'a delivery without the cap degrades to the old behaviour');
});

test('What the plane cuts is drawn as black poché, ruled, with earth and masonry told apart by pitch',()=>{
  const wall=createHatchMaterial(SECTION_POCHE);
  assert.match(wall.fragmentShader,/\/ 0\.1400;/);
  assert.match(wall.fragmentShader,/const float INK = 0\.13000;/);
  assert.match(wall.fragmentShader,/#include <tonemapping_fragment>/);
  const soil=createHatchMaterial(SOIL_POCHE);
  assert.match(soil.fragmentShader,/\/ 0\.5500;/);
  assert.match(soil.fragmentShader,/const float INK = 0\.15000;/);
  // R40 put the earth's ground near black so that pulling back left solid
  // poché rather than a flat tan panel. R42 inverts the earth on the client's
  // instruction: the cut ground is pale and carries a thin dark line, so it is
  // the line that is inked and the field that stays quiet. Masonry is
  // unchanged - dark, with a lighter rule on it.
  assert.ok(Math.max(...SECTION_POCHE.ground)<0.05,JSON.stringify(SECTION_POCHE.ground));
  assert.ok(Math.min(...SECTION_POCHE.ink)>Math.max(...SECTION_POCHE.ground)*4);
  assert.ok(Math.min(...SOIL_POCHE.ground)>0.4,'the cut earth reads as a pale field');
  assert.ok(Math.max(...SOIL_POCHE.ink)<0.05,'and its rule is the ink itself');
  assert.equal(SOIL_POCHE.strength,1,'the earth line takes all of the ink');
  assert.ok(SECTION_POCHE.strength<0.7,'the masonry rule stays a highlight');
  assert.notEqual(SECTION_POCHE.pitch,SOIL_POCHE.pitch,'earth and masonry are told apart by the ruling');
  // thin line, wide gap: "siyah çizgileri incelt arasındaki mesafeyi arttır".
  // The shader was drawing about 40% of the period at the plan zoom whatever
  // the duty said; now that the duty is what is drawn, it has to be high
  // enough to read as a ruling there and low enough to stay a line close up.
  assert.ok(SOIL_POCHE.duty*2>0.12&&SOIL_POCHE.duty*2<0.20,
    `${(SOIL_POCHE.duty*2*100).toFixed(0)}% of the period is inked`);
  assert.ok(SOIL_POCHE.pitch>SECTION_POCHE.pitch*3,'on a far coarser pitch than masonry');
  assert.ok(!('fade' in SOIL_POCHE)&&!('fade' in SECTION_POCHE),'the hand-tuned far field is retired');
});

// The complaint the filter answers is that the earth came out a bold barcode
// however thin the duty was written. That was the shader adding the pixel to
// the line; this mirrors the shader's own arithmetic and holds it to the duty
// it was given, at every zoom from a 2 mm pixel to one four periods wide.
test('The ruling keeps the width it was authored with instead of growing with the pixel',()=>{
  for (const poche of [SECTION_POCHE,SOIL_POCHE]) {
    const ink=2*poche.duty;
    const ruled=x=>Math.floor(x)*ink+Math.min(x-Math.floor(x),ink);
    const hatch=(v,w)=>Math.min(1,Math.max(0,(ruled(v+0.5*w)-ruled(v-0.5*w))/w));
    for (const w of [0.002,0.01,0.05,0.2,0.5,1,2,4]) {
      let sum=0; const N=4096;
      for (let k=0;k<N;k++) sum+=hatch(17+k/N,w);       // one whole period, off the origin
      assert.ok(Math.abs(sum/N-ink)<2e-3,
        `pixel ${w} periods wide inks ${(sum/N*100).toFixed(1)}% of the field, not ${(ink*100).toFixed(0)}%`);
      // and never more of any one pixel than that pixel can hold
      // a pixel narrower than the period can never ink more of itself than the
      // line it straddles; one wider than the period settles on the duty
      assert.ok(hatch(17.03,w)<=Math.min(1,ink/Math.min(w,1))+1e-6,
        'a sub-pixel line greys out rather than fattening');
    }
  }
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
