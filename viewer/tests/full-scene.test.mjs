import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {sectionHeight, createWallCaps} from '../src/section.js';

test('The shipped full scene retains lower stairs and full-height floors in every view', () => {
  const dir = new URL('../public/models/full/', import.meta.url);
  const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json', dir)));
  assert.equal(manifest.geometry_preclipped, false);
  assert.equal(manifest.clip_lower_plane, false);
  assert.deepEqual(manifest.lift_served_floor_indices, [0, 1, 2]);
  const ids = manifest.assets.map(a => a.id);
  for (const selection of Object.values(manifest.view_assets)) assert.deepEqual(selection, ids);
  let total = 0;
  for (const asset of manifest.assets) {
    const data = fs.readFileSync(new URL(asset.file, dir)); total += data.length;
    assert.equal(createHash('sha256').update(data).digest('hex'), asset.sha256);
    assert.equal(data.length, asset.bytes);
    assert.ok(data.length < 11800000, asset.id + ' individual transfer budget');
    assert.equal(asset.section_elevation_m, null, 'no baked upper or lower cut');
    const gltf = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString().trim());
    assert.ok(gltf.extensionsRequired.includes('KHR_draco_mesh_compression'));
    if (asset.id.startsWith('level-')) {
      const floor = Number(asset.id.slice(-1));
      let ymax = -Infinity, ymin = Infinity, walls = 0;
      for (const node of gltf.nodes) {
        const extras = node.extras ?? {};
        if (extras.section_cap_eligible) {
          walls++; assert.equal(extras.category, 'wall', 'rooms and furniture cannot generate hatches');
        }
      }
      for (const mesh of gltf.meshes) for (const p of mesh.primitives) {
        const a = gltf.accessors[p.attributes.POSITION];
        ymax = Math.max(ymax, a.max[1]); ymin = Math.min(ymin, a.min[1]);
      }
      assert.ok(walls >= 1, 'wall masks exported for ' + asset.id);
      assert.ok(ymax > manifest.floor_datums_m[floor] + 1.8, 'full height geometry retained');
      assert.ok(ymin < manifest.floor_datums_m[floor], 'below-floor geometry retained');
      const cut = sectionHeight('f' + floor, 30);
      const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), cut);
      assert.ok(plane.distanceToPoint(new THREE.Vector3(0, -4, 0)) > 0, 'all lower stairs remain on visible side');
      assert.ok(plane.distanceToPoint(new THREE.Vector3(0, cut + 0.01, 0)) < 0);
    }
  }
  assert.ok(total < 45000000, 'whole-scene transfer budget');
});

test('Wall caps share one moving plane and only use supplied wall volumes', () => {
  const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 4.6996);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 4), new THREE.MeshBasicMaterial());
  wall.position.set(2, 3, -1);
  const caps = createWallCaps([wall], plane);
  const [back, front, cap] = caps.group.children;
  assert.equal(caps.group.children.length, 3);
  assert.equal(back.geometry, wall.geometry); assert.equal(front.geometry, wall.geometry);
  assert.equal(back.material.clippingPlanes[0], plane);
  assert.equal(front.material.clippingPlanes[0], plane);
  assert.deepEqual(back.matrix.elements, wall.matrixWorld.elements);
  assert.equal(cap.material.stencilFunc, THREE.NotEqualStencilFunc);
  caps.update(7.9714, true);
  assert.equal(cap.position.y, 7.9714);
  caps.update(30, false); assert.equal(caps.group.visible, false);
});
