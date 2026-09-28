import * as THREE from 'three';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
import {createSectionNormalMaterials} from './section-normal-materials.js';

// Villa modu (28.09, ürün sahibi): "çevre binaları sadece wireframe çizgi
// olarak; dışları, gölge olmasın, detayların outline'ı gibi ince %60 siyah".
//
// Kenarlar ÖNCEDEN hesaplanamadı: KOMSULAR-opt-v2'de 1,1 M üçgen binlerce
// ayrı küçük parçadan (kiremit, doğrama) oluşuyor; kenar geometrisi 1,1 M
// parça (≈26 MB) çıkıyor, sadeleştirme de parçaları birleştiremiyor. Bu
// yüzden çizgi EKRANDA çıkarılır:
//   1. Komşular ana kameranın görmediği bir katmana alınır: güzellik
//      geçişine, GTAO'ya ve gölge haritasına girmezler (gölge yok).
//   2. Ayrı hedefe önce görünen sahne yalnız DERİNLİK olarak (villanın kesit
//      düzlemleri korunarak) çizilir - villa ve bahçe komşunun önünü örter.
//   3. Komşular yalnız normal+derinlik olarak çizilir.
//   4. Tam ekran geçiş: komşunun kapladığı pikseller kâğıt tonuyla (villa
//      görünümündeki beyazlatılmış zeminle aynı) örtülür; normal kırılması,
//      derinlik sıçraması ve siluet pikselleri tek piksellik %60 siyah çizgi.
// 28.09 (2): yakın çevre <-> villa geçişi "şak diye" değil - örtü ve
// çizgiler `fade` ile (0..1) yakınlaşma boyunca birlikte açılır/kapanır.
// Tam açıkken komşular çizgi katmanına park edilir (güzellik, GTAO ve gölge
// geçişlerine girmez); yarıdan sonra gölge atmayı bırakırlar.
const LINE_LAYER = 3;

const EDGE_SHADER = {
  uniforms: {
    tNormal: {value: null}, tDepth: {value: null}, texel: {value: new THREE.Vector2()},
    opacity: {value: 0.6}, fade: {value: 1}, paper: {value: new THREE.Vector3(0.878, 0.875, 0.867)},
    cameraNear: {value: 0.1}, cameraFar: {value: 1000}, ortho: {value: 0},
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tNormal, tDepth; uniform vec2 texel; uniform float opacity, fade, cameraNear, cameraFar, ortho;
    uniform vec3 paper;
    varying vec2 vUv;
    float viewZ(float d){
      return ortho > 0.5 ? cameraNear + d * (cameraFar - cameraNear)
        : cameraNear * cameraFar / (cameraFar - d * (cameraFar - cameraNear));
    }
    void main(){
      vec4 c = texture2D(tNormal, vUv);
      if (c.a < 0.5) { gl_FragColor = vec4(0.0); return; }
      vec3 nc = normalize(c.rgb * 2.0 - 1.0);
      float zc = viewZ(texture2D(tDepth, vUv).x);
      float edge = 0.0;
      vec2 offs[4]; offs[0] = vec2(1.0, 0.0); offs[1] = vec2(-1.0, 0.0); offs[2] = vec2(0.0, 1.0); offs[3] = vec2(0.0, -1.0);
      for (int i = 0; i < 4; i++) {
        vec2 uv = vUv + offs[i] * texel;
        vec4 n = texture2D(tNormal, uv);
        if (n.a < 0.5) { edge = 1.0; break; }                                   // siluet
        if (dot(nc, normalize(n.rgb * 2.0 - 1.0)) < 0.82) { edge = 1.0; break; } // kırılma
        float z = viewZ(texture2D(tDepth, uv).x);
        if (abs(z - zc) > 0.035 * zc) { edge = 1.0; break; }                    // derinlik sıçraması
      }
      gl_FragColor = vec4(mix(paper, vec3(0.0), edge * opacity), fade);
    }`,
};

export function createNeighbourLines(renderer) {
  const target = new THREE.WebGLRenderTarget(1, 1, {depthTexture: new THREE.DepthTexture(1, 1)});
  const occluder = new THREE.MeshBasicMaterial({colorWrite: false, side: THREE.DoubleSide});
  const occluders = createSectionNormalMaterials(occluder);
  const normals = new THREE.MeshNormalMaterial({side: THREE.DoubleSide});
  const edge = new THREE.ShaderMaterial({...EDGE_SHADER, uniforms: THREE.UniformsUtils.clone(EDGE_SHADER.uniforms),
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.NormalBlending});
  const quad = new FullScreenQuad(edge);
  const size = new THREE.Vector2(), clear = new THREE.Color(), layers = new THREE.Layers();
  let meshes = [], fade = 0, parked = false, casting = true;
  const setLayer = layer => { for (const mesh of meshes) mesh.layers.set(layer); };
  return {
    get fade() { return fade; },
    // Geçiş seviyesi (0 = gerçek komşular, 1 = yalnız çizgi). Gölge atma
    // durumu değiştiyse true döner - çağıran gölge haritasını yeniler.
    update(value, group) {
      fade = value;
      if (!meshes.length && group) group.traverse(o => { if (o.isMesh) { o.userData.lineCast ??= o.castShadow; meshes.push(o); } });
      if (!meshes.length) return false;
      const park = fade >= 0.999;
      if (park !== parked) { parked = park; setLayer(park ? LINE_LAYER : 0); }
      const cast = fade < 0.5;
      if (cast === casting) return false;
      casting = cast;
      for (const mesh of meshes) mesh.castShadow = cast && mesh.userData.lineCast;
      return true;
    },
    render(scene, camera) {
      if (fade <= 0.001 || !meshes.length) return;
      renderer.getDrawingBufferSize(size);
      if (target.width !== size.x || target.height !== size.y) target.setSize(size.x, size.y);
      const previousTarget = renderer.getRenderTarget(), autoClear = renderer.autoClear;
      const background = scene.background, override = scene.overrideMaterial, alpha = renderer.getClearAlpha();
      renderer.getClearColor(clear); layers.mask = camera.layers.mask;
      try {
        scene.background = null; renderer.autoClear = false;
        if (!parked) setLayer(LINE_LAYER);   // geçiş sürerken: yalnız bu geçişler için
        renderer.setRenderTarget(target); renderer.setClearColor(0x000000, 0); renderer.clear();
        // 2. önü örten sahne: yalnız derinlik, kesit düzlemleri aynı
        scene.overrideMaterial = null;
        occluders.render(scene, () => renderer.render(scene, camera));
        // 3. komşular: normal + derinlik
        camera.layers.set(LINE_LAYER); scene.overrideMaterial = normals;
        renderer.render(scene, camera);
        camera.layers.mask = layers.mask; scene.overrideMaterial = override;
        // 4. çizgiler karenin üstüne
        edge.uniforms.tNormal.value = target.texture; edge.uniforms.tDepth.value = target.depthTexture;
        edge.uniforms.texel.value.set(1 / size.x, 1 / size.y);
        edge.uniforms.cameraNear.value = camera.near; edge.uniforms.cameraFar.value = camera.far;
        edge.uniforms.ortho.value = camera.isOrthographicCamera ? 1 : 0;
        edge.uniforms.fade.value = fade;
        renderer.setRenderTarget(null);
        quad.render(renderer);
      } finally {
        if (!parked) setLayer(0);
        camera.layers.mask = layers.mask; scene.overrideMaterial = override; scene.background = background;
        renderer.setRenderTarget(previousTarget); renderer.autoClear = autoClear; renderer.setClearColor(clear, alpha);
      }
    },
    dispose() { target.dispose(); occluder.dispose(); occluders.dispose(); normals.dispose(); edge.dispose(); quad.dispose(); },
  };
}
