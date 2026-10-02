// The villa as a scroll-driven model. The same Draco/WebP GLBs the interactive
// tour uses (build/web/full/villa-m.glb and garden-m.glb) are loaded once;
// the page's scroll position drives the camera through six resting poses and
// lowers a horizontal cut through the house one storey at a time, so the
// visitor reads the plan of every floor without touching anything. A mouse
// drag adds a yaw offset on top of the scripted pose; touch keeps scrolling.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';

// Floor datums from build/web/full/manifest.json; the tour cuts each floor
// 1.60 m above its own slab, and so does this page.
const DATUMS = [0, 3.0996, 6.3714, 9.4705];
const EYE = 1.6;
const ROOF = 15.2;      // above the ridge: the cut starts here and vanishes
const NO_CUT = 1e3;
export const KEYS = [
  {pos: [27, 21, -37], look: [3.5, 2.5, -8], cut: NO_CUT},
  {pos: [17, 8.5, -25], look: [0.5, 5.2, -3], cut: NO_CUT},
  {pos: [13, 27, -17], look: [0.9, 9.6, -2.6], cut: DATUMS[3] + EYE},
  {pos: [13, 23, -16], look: [0.9, 6.5, -2.6], cut: DATUMS[2] + EYE},
  {pos: [13, 20, -15.5], look: [0.9, 3.2, -2.6], cut: DATUMS[1] + EYE},
  {pos: [12, 16.5, -15], look: [0.9, 0.1, -2.6], cut: DATUMS[0] + EYE},
];
const smooth = (t) => t * t * (3 - 2 * t);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const here = (p) => new URL(p, document.baseURI).href;
// Transfer sizes of the three downloads, so one progress bar can be honest
// about the whole rather than jumping per file.
const BYTES = {villa: 5683732, garden: 2265084, hdr: 1437000};

export async function mountVilla({container, onProgress}) {
  if (!window.WebGL2RenderingContext) throw new Error('WebGL 2 is not available');
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.localClippingEnabled = true;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = 'villa-canvas';
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.5, 500);
  const sun = new THREE.DirectionalLight(0xfff0dc, 2.3);
  sun.position.set(-18, 46, -34);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, {left: -28, right: 28, top: 28, bottom: -28, near: 5, far: 150});
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.035;
  sun.target.position.set(1, 3, -8);
  scene.add(sun, sun.target, new THREE.HemisphereLight(0xdfe8f2, 0x8a7a62, 0.3));
  const cut = new THREE.Plane(new THREE.Vector3(0, -1, 0), NO_CUT);

  const draco = new DRACOLoader();
  draco.setDecoderPath(here('../viewer/public/draco/'));
  const gltf = new GLTFLoader();
  gltf.setDRACOLoader(draco);
  const got = {villa: 0, garden: 0, hdr: 0};
  const total = Object.values(BYTES).reduce((a, b) => a + b, 0);
  const report = () => onProgress?.(clamp(Object.values(got).reduce((a, b) => a + b, 0) / total, 0, 1));
  const progress = (key) => (e) => {got[key] = Math.min(e.loaded, BYTES[key]); report();};
  const load = (key, path) => new Promise((res, rej) => gltf.load(here(path), res, progress(key), rej));
  const loadHdr = () => new Promise((res, rej) => new RGBELoader().load(here('../assets/lighting/kloofendal_48d_partly_cloudy_puresky_1k.hdr'), res, progress('hdr'), rej));

  const [villa, garden, hdr] = await Promise.all([
    load('villa', '../build/web/full/villa-m.glb'),
    load('garden', '../build/web/full/garden-m.glb'),
    loadHdr().catch(() => null),
  ]);
  got.villa = BYTES.villa; got.garden = BYTES.garden; got.hdr = BYTES.hdr; report();
  if (hdr) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    scene.environment = pmrem.fromEquirectangular(hdr).texture;
    scene.environmentIntensity = 0.75;
    hdr.dispose(); pmrem.dispose();
  }
  // The cut opens the walls, so villa materials draw both faces and clip
  // their shadows with them; the garden is never cut.
  const seen = new Set();
  villa.scene.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true; o.receiveShadow = true;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (seen.has(m)) continue;
      seen.add(m);
      m.clippingPlanes = [cut];
      m.clipShadows = true;
      if (m.transmission > 0) {
        // Real transmission renders the whole scene a second time per frame.
        // Window glass reads just as well as a tinted, reflective surface.
        m.transmission = 0; m.transparent = true; m.opacity = Math.min(m.opacity ?? 1, 0.42);
        m.roughness = Math.max(m.roughness, 0.06); m.depthWrite = false; m.side = THREE.DoubleSide;
      } else if (!m.transparent) m.side = THREE.DoubleSide;
    }
  });
  garden.scene.traverse((o) => {if (o.isMesh) {o.castShadow = true; o.receiveShadow = true;}});
  // Earth under everything: where the street-level forecourt is cut away the
  // visitor sees ground, not the page behind the canvas.
  const earth = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({color: 0x37312c, roughness: 1, metalness: 0}));
  earth.rotation.x = -Math.PI / 2; earth.position.y = -0.4; earth.receiveShadow = true;
  scene.add(earth, garden.scene, villa.scene);

  // Pose: piecewise ease between resting keys. The cut moves in the middle
  // of a segment so each floor holds still while its text is read.
  const P = new THREE.Vector3(), L = new THREE.Vector3(), T = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  function pose(p) {
    const s = p * (KEYS.length - 1);
    const i = Math.min(KEYS.length - 2, Math.floor(s));
    const t = smooth(s - i), a = KEYS[i], b = KEYS[i + 1];
    P.fromArray(a.pos).lerp(T.fromArray(b.pos), t);
    L.fromArray(a.look).lerp(T.fromArray(b.look), t);
    const tc = smooth(clamp((s - i - 0.12) / 0.76, 0, 1));
    const from = a.cut >= NO_CUT ? ROOF : a.cut, to = b.cut >= NO_CUT ? ROOF : b.cut;
    const c = from + (to - from) * tc;
    return c >= ROOF - 1e-3 ? NO_CUT : c;
  }

  let target = 0, shown = 0, yaw = 0, yawTarget = 0, visible = true, dirty = true, cutApplied = NaN, last = 0, lost = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function render() {
    const c = pose(shown);
    T.subVectors(P, L).applyAxisAngle(UP, yaw);
    camera.position.addVectors(L, T);
    camera.lookAt(L);
    if (c !== cutApplied) {cutApplied = c; cut.constant = c; renderer.shadowMap.needsUpdate = true;}
    renderer.render(scene, camera);
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || lost) return;
    const dt = clamp((now - last) / 1000 || 0.016, 0.001, 0.05);
    last = now;
    const k = reduced ? 1 : 1 - Math.pow(0.002, dt);
    let ns = shown + (target - shown) * k, ny = yaw + (yawTarget - yaw) * k;
    if (Math.abs(target - ns) < 2e-4) ns = target;
    if (Math.abs(yawTarget - ny) < 2e-4) ny = yawTarget;
    if (ns === shown && ny === yaw && !dirty) return;
    shown = ns; yaw = ny; dirty = false;
    render();
  }
  const ro = new ResizeObserver(() => {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // On wide screens the copy sits bottom-left, so the house is framed a
    // little to the right of centre.
    if (w > 900) camera.setViewOffset(w, h, -w * 0.11, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    dirty = true;
  });
  ro.observe(container);
  const io = new IntersectionObserver(([e]) => {visible = e.isIntersecting; if (visible) dirty = true;}, {rootMargin: '10% 0px'});
  io.observe(container);
  renderer.domElement.addEventListener('webglcontextlost', (e) => {e.preventDefault(); lost = true; container.dispatchEvent(new CustomEvent('villa3d:lost'));});

  renderer.setSize(container.clientWidth || 1, container.clientHeight || 1, false);
  camera.aspect = (container.clientWidth || 1) / (container.clientHeight || 1);
  if (container.clientWidth > 900) camera.setViewOffset(container.clientWidth, container.clientHeight, -container.clientWidth * 0.11, 0, container.clientWidth, container.clientHeight);
  camera.updateProjectionMatrix();
  await renderer.compileAsync(scene, camera);
  render();
  requestAnimationFrame(frame);

  return {
    setProgress(p) {
      p = clamp(p, 0, 1);
      if (Math.abs(p - target) > 0.003) yawTarget *= 0.85;   // the script takes the camera back
      target = p;
    },
    addYaw(d) {yawTarget = clamp(yawTarget + d, -1.3, 1.3);},
    get progress() {return shown;},
    dispose() {
      ro.disconnect(); io.disconnect(); visible = false;
      renderer.dispose(); draco.dispose();
      scene.traverse((o) => {o.geometry?.dispose?.(); for (const m of [].concat(o.material || [])) m.dispose?.();});
      renderer.domElement.remove();
    },
  };
}
