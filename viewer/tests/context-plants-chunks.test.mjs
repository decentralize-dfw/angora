import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as THREE from 'three';
import {chunkBatchedMesh, chunkModelInPlace} from '../src/context-plants-chunks.js';

// Two triangles per cluster, clusters 100 m apart so a 48 m grid must
// separate them. Extra attributes (_batchid) ride along like the real
// delivery's.
function plantField(clusters) {
  const positions = [], batchid = [];
  for (const [cx, cz] of clusters) {
    positions.push(
      cx, 0, cz, cx + 1, 0, cz, cx, 1, cz,
      cx + 2, 0, cz + 2, cx + 3, 0, cz + 2, cx + 2, 1, cz + 2,
    );
    for (let i = 0; i < 6; i++) batchid.push(clusters.indexOf([cx, cz]));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('_batchid', new THREE.BufferAttribute(new Float32Array(batchid.length ? batchid : positions.length / 3), 1));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(positions.length / 3).map((_, i) => i), 1));
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  mesh.name = 'context-plants';
  return mesh;
}

const CLUSTERS = [[0, 0], [100, 0], [0, 100], [100, 100], [200, 200]];

test('Chunks share attributes, re-bucket every triangle, and carry their own bounds', () => {
  const mesh = plantField(CLUSTERS);
  const sourceTriangles = mesh.geometry.index.count / 3;
  const group = chunkBatchedMesh(mesh, {chunk: 48, minChunks: 2});
  assert.ok(group, 'expected a chunked group');
  assert.equal(group.children.length, CLUSTERS.length);
  let triangles = 0;
  for (const chunk of group.children) {
    triangles += chunk.geometry.index.count / 3;
    // Shared attribute OBJECTS - the renderer uploads each buffer once.
    assert.equal(chunk.geometry.attributes.position, mesh.geometry.attributes.position);
    assert.equal(chunk.geometry.attributes._batchid, mesh.geometry.attributes._batchid);
    // The bound must cover only the chunk's own vertices, never the field:
    // three's computeBoundingSphere reads the WHOLE position attribute and
    // would hand every chunk the whole settlement, which un-culls everything.
    assert.ok(chunk.geometry.boundingSphere.radius < 5,
      'chunk bound leaked to the whole field: r=' + chunk.geometry.boundingSphere.radius);
  }
  assert.equal(triangles, sourceTriangles, 'every triangle lands in exactly one chunk');
});

test('A mesh already local to one cell is left alone', () => {
  const mesh = plantField([[0, 0]]);
  assert.equal(chunkBatchedMesh(mesh, {chunk: 48, minChunks: 2}), null);
});

test('chunkModelInPlace swaps the heavy mesh for its chunks inside the model', () => {
  const root = new THREE.Group();
  const mesh = plantField(CLUSTERS);
  root.add(mesh);
  const split = chunkModelInPlace(root, {chunk: 48, minTriangles: 1});
  assert.equal(split, 1);
  assert.equal(root.children.length, 1);
  assert.ok(root.children[0].isGroup);
  assert.equal(root.children[0].children.length, CLUSTERS.length);
  let triangles = 0;
  root.traverse(o => { if (o.isMesh) triangles += o.geometry.index.count / 3; });
  assert.equal(triangles, CLUSTERS.length * 2);
});
