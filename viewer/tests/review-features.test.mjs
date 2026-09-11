import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {SectionGTAOPass} from '../src/lighting.js';

test('AO respects hidden furniture, uncut context, glazing, annotations and camera changes', () => {
  const scene = new THREE.Scene(), ortho = new THREE.OrthographicCamera(), clip = new THREE.Plane(new THREE.Vector3(0,-1,0),7.9714);
  const pass = new SectionGTAOPass(scene, ortho, clip, .5);
  const hidden = new THREE.Mesh(); hidden.visible = false;
  const glass = new THREE.Mesh(); glass.userData.aoExcluded = true;
  const label = new THREE.Group(); label.userData.aoExcluded = true;
  scene.add(hidden, glass, label);
  pass._overrideVisibility(); assert.equal(glass.visible, false); assert.equal(label.visible, false);
  pass._restoreVisibility(); assert.equal(hidden.visible, false); assert.equal(glass.visible, true);
  const wall = new THREE.Mesh(); wall.userData.sectionClipped = true;
  pass.normalMaterial.onBeforeRender(null,scene,ortho,null,wall);
  assert.deepEqual(pass.normalMaterial.clippingPlanes,[clip]);
  pass.normalMaterial.onBeforeRender(null,scene,ortho,null,new THREE.Mesh());
  assert.deepEqual(pass.normalMaterial.clippingPlanes,[]);
  pass.setSize(800,600); assert.equal(pass.width,400); assert.equal(pass.height,300);
  pass.setCamera(new THREE.PerspectiveCamera()); assert.equal(pass.gtaoMaterial.defines.PERSPECTIVE_CAMERA,1);
  pass.setCamera(ortho); assert.equal(pass.gtaoMaterial.defines.PERSPECTIVE_CAMERA,0); pass.dispose();
});

test('Every displayed span agrees with the original DWG dimension and registered endpoints', () => {
  const root = new URL('../../',import.meta.url);
  const source = JSON.parse(fs.readFileSync(new URL('build/cad/dimension-source.json',root)));
  const data = JSON.parse(fs.readFileSync(new URL('build/web/full/rooms.json',root)));
  assert.equal(data.rooms.length,27);
  // The R39 set restores 35 label-allowed project dimensions, every one
  // re-verified against the delivered wall solids; the rows with the label
  // switched off are model-measured spans and face-residual records that must
  // never be displayed, so only the allowed rows face the DWG check.
  const allowed=data.dimensions.filter(d=>d.dimension_label_allowed);
  assert.ok(allowed.length>=35,String(allowed.length));
  for(const dim of allowed)assert.equal(dim.basis,'dwg_verified');
  for(const dim of data.dimensions.filter(d=>!d.dimension_label_allowed&&d.basis==='model_measured'))
    assert.equal(dim.claim,'model_span_measured');
  assert.equal(data.inferred_site_dimensions_included,false);
  for (const dim of allowed) {
    const original = source.find(d => d.handle===dim.source_dimension_handle);
    assert.ok(original); assert.equal(original.dimstyle,'NES');
    assert.ok(Math.abs(original.actual_measurement*.01-dim.metres)<.001);
    assert.ok(Math.abs(new THREE.Vector3(...dim.a).distanceTo(new THREE.Vector3(...dim.b))-dim.metres)<.001);
    assert.ok(dim.maximum_wall_endpoint_residual_m<=.006);
    assert.equal(dim.dimension_label_allowed,true);
    assert.ok(data.rooms.some(r=>r.id===dim.room_id && r.floor_index===dim.floor_index));
  }
});
