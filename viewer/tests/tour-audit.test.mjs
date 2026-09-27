import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {projectBox, safeArea, gradeFraming} from '../src/tour-audit.js';

// Ürün sahibi: "gösterilen yer ekranda ortalanmak ve sığmak zorundadır."
// Bu ölçüm aracının kendisi doğru ölçmeli, yoksa altmış ipucunu yanlış
// aklar. Testler aracın üç kararını tutuyor: kutunun ekrandaki yeri,
// arayüzün bıraktığı alan, ve karne.

const camera = (distance = 20) => {
  const c = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 500);
  c.position.set(0, 0, distance); c.lookAt(0, 0, 0); c.updateMatrixWorld();
  c.updateProjectionMatrix(); return c;
};
const box = (x, y, z, r = 1) =>
  new THREE.Box3(new THREE.Vector3(x - r, y - r, z - r), new THREE.Vector3(x + r, y + r, z + r));

test('merkezdeki kutu ekranın ortasına düşer', () => {
  const rect = projectBox(box(0, 0, 0), camera(), 1600, 900, THREE);
  assert.equal(rect.behind, false);
  assert.ok(Math.abs((rect.x0 + rect.x1) / 2 - 800) < 1, 'yatay orta');
  assert.ok(Math.abs((rect.y0 + rect.y1) / 2 - 450) < 1, 'dikey orta');
  // Sağa kayan kutu sağa düşmeli - eksen işareti ters olsaydı bütün
  // denetim aynalanır ve yanlış ipuçlarını suçlardı.
  const right = projectBox(box(6, 0, 0), camera(), 1600, 900, THREE);
  assert.ok((right.x0 + right.x1) / 2 > 800);
  const up = projectBox(box(0, 6, 0), camera(), 1600, 900, THREE);
  assert.ok((up.y0 + up.y1) / 2 < 450, 'yukarı = küçük y');
});

test('kameranın ARKASINDAKİ kutu sessizce sığmış sayılmaz', () => {
  const rect = projectBox(box(0, 0, 40), camera(20), 1600, 900, THREE);
  assert.equal(rect.behind, true);
  const area = safeArea(1600, 900);
  assert.equal(gradeFraming(rect, area).fits, false, 'arkadaki kutu asla sığmış olamaz');
});

test('boş kutu ve yokluk ölçülmedi olarak döner', () => {
  assert.equal(projectBox(new THREE.Box3(), camera(), 100, 100, THREE), null);
  assert.equal(projectBox(null, camera(), 100, 100, THREE), null);
  assert.equal(gradeFraming(null, safeArea(100, 100)).measured, false);
});

test('güvenli alan arayüzün bıraktığı yerdir', () => {
  // turda: üstte marka çubuğu, altta transport, solda fotoğraf sütunu
  const area = safeArea(1600, 900, [
    {x: 22, y: 18, width: 300, height: 44},      // topbar - üst kenar
    {x: 560, y: 820, width: 480, height: 60},    // transport - alt kenar
    {x: 18, y: 350, width: 186, height: 300},    // galeri - sol kenar
  ]);
  assert.equal(area.top, 62);
  assert.equal(area.bottom, 820);
  assert.equal(area.left, 204);
  assert.equal(area.right, 1600);
  assert.equal(area.cx, 902);
  // Ölçüsüz/gizli eleman alanı yemez
  const clean = safeArea(1600, 900, [null, {x: 0, y: 0, width: 0, height: 0}]);
  assert.deepEqual([clean.top, clean.bottom, clean.left, clean.right], [0, 900, 0, 1600]);
});

test('karne: kenara taşan sığmaz, ortadan kaçan ortalanmış sayılmaz', () => {
  const area = safeArea(1000, 1000, [{x: 0, y: 900, width: 1000, height: 100}]);  // alt 100 px dolu
  assert.equal(area.bottom, 900);
  const inside = gradeFraming({x0: 400, y0: 400, x1: 600, y1: 600, w: 200, h: 200}, area);
  assert.equal(inside.fits, true);
  assert.equal(inside.centred, true);
  // Altyazının altına sarkan özne: piksel var ama görünmüyor
  const under = gradeFraming({x0: 400, y0: 800, x1: 600, y1: 980, w: 200, h: 180}, area);
  assert.equal(under.fitsY, false);
  assert.equal(under.fits, false);
  // Kenara kaçmış ama sığan özne: sığar, ORTALANMAZ
  const off = gradeFraming({x0: 820, y0: 400, x1: 980, y1: 560, w: 160, h: 160}, area);
  assert.equal(off.fits, true);
  assert.equal(off.centred, false, 'sağ kenardaki özne ortalanmış sayılamaz');
  assert.ok(off.offX > 0.5);
});
