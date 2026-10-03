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
const SAMPLE_CLAMP = 3.0;

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
  tracer.minSamples = 12;                // pozlama eşlemesi bu örnekte yapılır, görüntü ondan sonra belirir
  tracer.fadeDuration = 900;
  tracer.rasterizeScene = false;
  tracer.dynamicLowRes = false;
  tracer.renderToCanvas = true;
  // Örnek başına parlaklık sınırı: içeride tek ışık küçük pencerelerden giren parlak gök; seken bir ışın
  // pencereye isabet edince tek piksel binlerce kat parlıyor ve yüzlerce örnekte bile sönmüyordu
  // (ateş böceği). Sınır enerjinin çok küçük bir kısmını keser, gürültüyü yok eder. NaN/Inf de sıfırlanır.
  const ptMaterial = tracer._pathTracer.material;
  ptMaterial.fragmentShader = ptMaterial.fragmentShader.replace('gl_FragColor.a *= opacity;', `
					if ( any( isnan( gl_FragColor.rgb ) ) || any( isinf( gl_FragColor.rgb ) ) ) gl_FragColor.rgb = vec3( 0.0 );
					float ptLum = dot( gl_FragColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
					if ( ptLum > ${SAMPLE_CLAMP.toFixed(2)} ) gl_FragColor.rgb *= ${SAMPLE_CLAMP.toFixed(2)} / ptLum;
					gl_FragColor.a *= opacity;`);
  ptMaterial.needsUpdate = true;

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
  // Pozlama eşleme: izlenen kare fiziksel olarak doğru ama iç mekân pencereye göre ~3 durak karanlık
  // (raster bunu elle x11 kazançla yapıyor). Fotoğrafçı gibi: izlenen karenin medyan parlaklığı normal
  // karenin medyanına eşlenir. Medyan: parlak pencereler ortalamayı bozmasın.
  let rasterMedian = 0, gain = 1, gainReady = false;
  const median = values => { values.sort((a, b) => a - b); return values[Math.floor(values.length / 2)] ?? 0; };
  function readRasterMedian() {
    const gl = renderer.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
    const px = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const out = [];
    for (let i = 0; i < px.length; i += 4 * 17) out.push(0.2126 * lin(px[i]) + 0.7152 * lin(px[i + 1]) + 0.0722 * lin(px[i + 2]));
    return median(out);
  }
  function computeGain() {
    const target = tracer.target, w = target.width, h = target.height;
    const px = new Float32Array(w * h * 4); renderer.readRenderTargetPixels(target, 0, 0, w, h, px);
    const out = [];
    for (let i = 0; i < px.length; i += 4 * 17) out.push(0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]);
    // raster medyanı ton eğrisinden geçmiş; orta tonlarda eğri ~0,8 eğimli: aynı bölgeye eşlemek için
    const traced = median(out) * renderer.toneMappingExposure * 0.8;
    gain = traced > 1e-5 ? THREE.MathUtils.clamp(rasterMedian / traced, 1, 16) : 1;
    gainReady = true;
    console.info(`Işın izleme pozlaması x${gain.toFixed(2)}`);
  }

  // görünür nesne kümesi: yalnız o değişince BVH yeniden kurulur
  function keyOf(roots) {
    let key = '';
    for (const r of roots) r.traverseVisible(o => { if (o.isMesh) key += o.id + ','; });
    return key;
  }

  // Gündüz izlemesinde ışıyan malzemeler (avize ampulleri, parlaklık hilesi emissiveLift) kapanır: küçük
  // ve çok parlak yüzeyler rastgele ışınlara isabet ettikçe tek pikselleri patlatıyor (ateş böceği) ve
  // örnek sayısıyla yakınsamıyordu. Işığı güneş + gök verir; malzeme değerleri izleyiciye kopyalanınca geri alınır.
  function updateMaterialsDaylight() {
    const touched = [];
    for (const r of traceScene.roots) r.traverseVisible(o => {
      if (!o.isMesh) return;
      for (const m of [].concat(o.material)) if (m?.emissiveIntensity > 0 && m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0) {
        touched.push([m, m.emissiveIntensity]); m.emissiveIntensity = 0;
      }
    });
    try { tracer.updateMaterials(); } finally { for (const [m, v] of touched) m.emissiveIntensity = v; }
    return touched.length;
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
      console.info(`Işın izleme sahnesi ${((performance.now() - t0) / 1000).toFixed(1)} sn, ${updateMaterialsDaylight()} ışıyan malzeme kapalı`);
    } else {
      tracer.setCamera(camera);
      tracer.updateLights();
      // gök küpü aynı nesne kalır ama içeriği güneşle değişir: kütüphane yalnız nesne değişince yeniler
      tracer._previousEnvironment = null; tracer._previousBackground = null;
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
        rasterMedian = readRasterMedian();
        captureBase();
        gainReady = false; gain = 1;
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
        if (!gainReady && tracer.samples >= tracer.minSamples - 1) computeGain();
        const exposure = renderer.toneMappingExposure;
        renderer.toneMappingExposure = exposure * gain;
        try { tracer.renderSample(); } finally { renderer.toneMappingExposure = exposure; }
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
