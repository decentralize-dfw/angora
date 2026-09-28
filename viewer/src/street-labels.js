import * as THREE from 'three';
import data from './street-labels.json';

// Yakın çevre: sokak adları yolun ORTASINA (asfalt kesitlerinden), yola
// paralel, %50 opak, asfalt boyası gibi
// yatık yazılır (ürün sahibi, 28.09: "dönen kamera ile dönmelerine gerek yok,
// sadece yazsınlar; yola paralel, çok büyük olmayacak"). Yerleşim ve eğim
// tools/batch-delivery/make-region-site.mjs'ten: OSM ekseni ölçülmüş
// dönüşümle modele çevrilir, yükseklik modelin asfaltından okunur.
const TEXT_HEIGHT = 1.25;          // m - şerit genişliğinin yaklaşık yarısı

function drawName(name) {
  const px = 96, pad = 24;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const font = `600 ${px}px Jura, -apple-system, 'Segoe UI', sans-serif`;
  const text = name.toLocaleUpperCase('tr');
  ctx.font = font;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '14px';
  const width = Math.ceil(ctx.measureText(text).width) + pad * 2;
  canvas.width = width; canvas.height = Math.ceil(px * 1.3);
  ctx.font = font;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '14px';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, pad, canvas.height / 2 + px * 0.04);
  return canvas;
}

export function createStreetLabels() {
  const group = new THREE.Group();
  group.name = 'Street names';
  group.visible = false;
  group.userData.aoExcluded = true;
  const build = () => {
    for (const label of data.labels) {
      const canvas = drawName(label.name);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      const material = new THREE.MeshBasicMaterial({map: texture, transparent: true, opacity: 0.5,
        depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4});
      const width = TEXT_HEIGHT * canvas.width / canvas.height;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, TEXT_HEIGHT), material);
      mesh.name = 'Street name: ' + label.name;
      // Yazı ekseni yol yönünde ve yolun boyuna eğimiyle; yazının "yukarısı"
      // dünya yukarısına dik, yatay düzlemde.
      const along = new THREE.Vector3(Math.cos(label.angle), 0, Math.sin(label.angle));
      const slope = Math.atan2(label.rise ?? 0, label.length);
      along.y = Math.tan(slope); along.normalize();
      // yazının üstü: yatay ve yola dik (+x yönünde okunurken -z'ye bakar);
      // yüz normali yukarı
      const across = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), along).normalize();
      const normal = new THREE.Vector3().crossVectors(along, across).normalize();
      mesh.matrixAutoUpdate = false;
      mesh.matrix.makeBasis(along, across, normal);
      mesh.matrix.setPosition(label.x, label.y + 0.03, label.z);
      mesh.renderOrder = 6;
      mesh.castShadow = mesh.receiveShadow = false;
      mesh.userData.aoExcluded = true;
      group.add(mesh);
    }
  };
  // Jura yüklenmeden çizilirse sistem yazısıyla kalır
  (document.fonts?.load ? document.fonts.load('600 96px Jura').catch(() => null) : Promise.resolve()).then(build);
  return {
    group,
    // yalnız yakın çevre ve villa dış görünümü; katta, dolaşırken, bölgede yok
    setView(view, walking) { group.visible = !walking && (view === 'neighborhood' || view === 'building'); },
  };
}
