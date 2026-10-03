import * as THREE from 'three';
import {WebGLPathTracer} from 'three-gpu-pathtracer';
import {GenerateMeshBVHWorker} from 'three-mesh-bvh/src/workers/GenerateMeshBVHWorker.js';

// V-RAY E (03.10): boşta ışın izleme. Kamera durunca içerideki kare gerçek
// yol izlemeyle (three-gpu-pathtracer) yeniden hesaplanır: ışık duvardan
// duvara sekiyor, pencereden giren güneş zemine iz düşürüyor, gölgeler
// alan ışığı gibi yumuşuyor, parlak yüzeyler odayı doğru yansıtıyor.
// Ekran-uzayı yaklaşımların (GTAO, SSR, pişmiş harita + katsayılar) yerine
// her pikselde fiziksel ışık. Rasterleştirilmiş kare altta kalır; izlenen
// görüntü birkaç örnekten sonra üstüne yumuşakça biner, en küçük etkileşimde
// iptal olur ve normal kare geri gelir.
//
// Yalnız göz hizası (kamera binanın içinde): izleyici kesit düzlemini
// tanımaz, kat planı görünümünde üst katları ve çatıyı da çizerdi.
// Sahne (BVH) görünür nesneler değişince bir kez, iş parçacığında kurulur.

const MAX_SAMPLES = 1500;

class TraceScene extends THREE.Scene {
  constructor() { super(); this.roots = []; this.lights = []; }
  traverse(cb) { cb(this); for (const o of this.roots) o.traverse(cb); for (const l of this.lights) cb(l); }
  traverseVisible(cb) { cb(this); for (const o of this.roots) o.traverseVisible(cb); }
  updateMatrixWorld() {}
}

export function createPathTraceStill({renderer, getRoots, getLights, getSky}) {
  const tracer = new WebGLPathTracer(renderer);
  tracer.setBVHWorker(new GenerateMeshBVHWorker());
  tracer.textureSize.set(512, 512);       // teslim edilen dokular da 512
  tracer.bounces = 6;
  tracer.transmissiveBounces = 8;
  tracer.filterGlossyFactor = 0.5;        // parlak zeminde ateş böceği gürültüsünü bastırır
  tracer.tiles.set(2, 2);                 // tek karede tüm ekran değil: arayüz akıcı kalır
  tracer.renderDelay = 0;
  tracer.minSamples = 6;
  tracer.fadeDuration = 900;
  tracer.rasterizeScene = false;
  tracer.dynamicLowRes = false;
  tracer.renderToCanvas = true;

  const traceScene = new TraceScene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: {map: {value: null}},
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: 'uniform sampler2D map; varying vec2 vUv; void main(){ gl_FragColor = texture2D(map, vUv); }',
    depthTest: false, depthWrite: false, toneMapped: false,
  }));
  quad.frustumCulled = false;
  const quadScene = new THREE.Scene(); quadScene.add(quad);
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  let base = null, sceneKey = '', building = null, broken = false;

  // görünür nesne kümesi: yalnız o değişince BVH yeniden kurulur
  function keyOf(roots) {
    let key = '';
    for (const r of roots) r.traverseVisible(o => { if (o.isMesh) key += o.id + ','; });
    return key;
  }

  async function prepare(camera) {
    const roots = getRoots();
    const key = keyOf(roots);
    traceScene.roots = roots;
    traceScene.lights = getLights();
    const sky = getSky();
    traceScene.environment = sky.texture; traceScene.background = sky.texture;
    traceScene.environmentIntensity = sky.intensity; traceScene.backgroundIntensity = sky.intensity;
    if (key !== sceneKey) {
      sceneKey = key;
      const t0 = performance.now();
      building = tracer.setSceneAsync(traceScene, camera);
      await building; building = null;
      console.info(`Işın izleme sahnesi ${((performance.now() - t0) / 1000).toFixed(1)} sn`);
    } else {
      tracer.setCamera(camera);
      tracer.updateLights();
      tracer.updateEnvironment();
    }
  }

  // temel kare (rasterleştirilmiş) dokuya alınır: izlenen görüntü onun üstüne biner
  function captureBase() {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    if (!base || base.image.width !== size.x || base.image.height !== size.y) {
      base?.dispose();
      base = new THREE.FramebufferTexture(size.x, size.y);
    }
    renderer.setRenderTarget(null);
    renderer.copyFramebufferToTexture(base, new THREE.Vector2(0, 0));
    quad.material.uniforms.map.value = base;
  }

  return {
    get broken() { return broken; },
    get samples() { return tracer.samples; },
    get building() { return Boolean(building); },
    // drawBase: normal kareyi çizer (bir kez). true dönerse çalışmaya devam.
    async start(camera, drawBase) {
      if (broken) return false;
      try {
        await prepare(camera);
        drawBase();
        captureBase();
        tracer.reset();
        return true;
      } catch (error) {
        broken = true;
        console.warn('Işın izleme kapandı:', error);
        return false;
      }
    },
    // bir adım: altta temel kare, üstte izlenen görüntü (solarak). false: bitti.
    step() {
      if (broken) return false;
      try {
        const autoClear = renderer.autoClear;
        renderer.setRenderTarget(null);
        renderer.autoClear = false;
        renderer.render(quadScene, quadCamera);
        tracer.renderSample();
        renderer.autoClear = autoClear;
        return tracer.samples < MAX_SAMPLES;
      } catch (error) {
        broken = true;
        console.warn('Işın izleme kapandı:', error);
        return false;
      }
    },
    dispose() { tracer.dispose(); base?.dispose(); quad.geometry.dispose(); quad.material.dispose(); },
  };
}
