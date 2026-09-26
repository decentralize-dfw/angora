import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {markUploads, releaseGeometryArrays} from '../src/geometry-release.js';

// MOBİL BELLEK. Ölçüm (mobil taklit, ?stats=1): CPU'da tutulan geometri
// 207,6 MiB / JS heap 334,9 MiB / 1 760 318 üçgen -> iPhone Safari sekmeyi
// öldürüyor. Yükleme sonrası bu diziler render için gereksiz.
//
// Değişmez: YÜKLENMEMİŞ bir dizi ASLA boşaltılmaz. Boşaltılsa o mesh bir daha
// yüklenemez, yani kalıcı görünmez olur - mobilde culling yüzünden gizli
// parçalar tam bu durumda. Hangi dizinin yüklendiği tahmin edilmez, three'nin
// onUploadCallback'iyle ÖLÇÜLÜR.

function part(name = 'p') {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  const group = new THREE.Group();
  group.add(mesh);
  group.updateMatrixWorld(true);
  return {models: new Map([[name, group]]), mesh, geometry};
}

// three'nin yaptığını taklit eder: tampon kurulunca geri çağrı tetiklenir.
const upload = geometry => {
  for (const key of Object.keys(geometry.attributes)) {
    const a = geometry.attributes[key];
    a.onUploadCallback?.call(a);
  }
  if (geometry.index) geometry.index.onUploadCallback?.call(geometry.index);
};

test('yüklenen diziler bırakılır, sınır hacimleri ÖNCE hesaplanır', () => {
  const {models, geometry} = part();
  markUploads(models);
  upload(geometry);

  const before = geometry.attributes.position.array.byteLength;
  assert.ok(before > 0);
  const result = releaseGeometryArrays(models);

  assert.equal(geometry.attributes.position.array, null, 'yüklenen dizi gitmeli');
  assert.equal(result.releasedAttributes > 0, true);
  assert.equal(result.deferred, 0, 'hepsi yüklenmişti');
  assert.ok(result.releasedBytes >= before);
  // three frustum culling için boundingSphere'a bakar ve onu ancak diziden
  // üretebilir - diziler gitmeden hesaplanmış olmalı.
  assert.ok(geometry.boundingSphere, 'boundingSphere hesaplanmış olmalı');
  assert.ok(geometry.boundingBox, 'boundingBox hesaplanmış olmalı');
  assert.ok(Number.isFinite(geometry.boundingSphere.radius));
  // count korunur: three sayıyı array'den değil kendi alanından okur.
  assert.ok(geometry.attributes.position.count > 0);
});

test('YÜKLENMEMİŞ dizi boşaltılmaz - kalıcı görünmezlik önlenir', () => {
  const {models, geometry} = part();
  markUploads(models);
  // upload() ÇAĞRILMIYOR: mobilde culling yüzünden gizli duran parça bu.
  const result = releaseGeometryArrays(models);

  assert.notEqual(geometry.attributes.position.array, null,
    'yüklenmemiş dizi DURMALI - gitse mesh bir daha asla yüklenemez');
  assert.equal(result.releasedAttributes, 0);
  assert.ok(result.deferred > 0, 'yüklenince bırakmak üzere ertelenmeli');

  // ve yüklendiği anda kendini bırakır
  upload(geometry);
  assert.equal(geometry.attributes.position.array, null,
    'ilk yüklemeden sonra kendini bırakmalı');
});

test('markUploads davranışı değiştirmez, yalnız kayıt tutar', () => {
  const {models, geometry} = part();
  const marked = markUploads(models);
  assert.ok(marked > 0);
  assert.notEqual(geometry.attributes.position.array, null, 'işaretleme silmez');
  // iki kez çağrılmak geri çağrıyı çoğaltmaz
  assert.equal(markUploads(models), 0, 'ikinci çağrı yeniden kurmamalı');
});

test('skip verilen mesh hiç ellenmez', () => {
  const {models, geometry} = part();
  markUploads(models);
  upload(geometry);
  const result = releaseGeometryArrays(models, {skip: () => true});
  assert.notEqual(geometry.attributes.position.array, null);
  assert.equal(result.releasedAttributes, 0);
  assert.equal(result.deferred, 0);
});

test('interleaved attribute paylaşımlı tampon olduğu için ellenmez', () => {
  const buffer = new THREE.InterleavedBuffer(new Float32Array([0, 0, 0, 1, 1, 1]), 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.InterleavedBufferAttribute(buffer, 3, 0));
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  const group = new THREE.Group(); group.add(mesh); group.updateMatrixWorld(true);
  const models = new Map([['p', group]]);
  markUploads(models);
  const result = releaseGeometryArrays(models);
  assert.equal(result.releasedAttributes, 0, 'interleaved dokunulmamalı');
  assert.equal(result.deferred, 0);
  assert.ok(buffer.array, 'paylaşımlı tampon durmalı');
});
