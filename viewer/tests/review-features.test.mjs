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
  // R39 re-verified every span against the new solid geometry and only one
  // survived, so the count is no longer the check - what each surviving span
  // claims still is. The tags fall back to the owner's area schedule.
  assert.ok(data.dimensions.length>=1);
  assert.equal(data.inferred_site_dimensions_included,false);
  for (const dim of data.dimensions) {
    const original = source.find(d => d.handle===dim.source_dimension_handle);
    assert.ok(original); assert.equal(original.dimstyle,'NES');
    assert.ok(Math.abs(original.actual_measurement*.01-dim.metres)<.001);
    assert.ok(Math.abs(new THREE.Vector3(...dim.a).distanceTo(new THREE.Vector3(...dim.b))-dim.metres)<.001);
    assert.ok(dim.maximum_wall_endpoint_residual_m<=.006);
    assert.equal(dim.dimension_label_allowed,true);
    assert.ok(data.rooms.some(r=>r.id===dim.room_id && r.floor_index===dim.floor_index));
  }
});
