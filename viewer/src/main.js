import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { createLighting } from './lighting.js';
import { createAnnotations } from './annotations.js';
import { InteriorWalk, enableImmersiveWalk } from './walk.js';
import { configureCameraControls } from './camera.js';
import { sectionHeight, smoothStep, createWallCaps } from './section.js';

const $ = s => document.querySelector(s);
const host = $('#viewport'), status = $('#load-status');
const publicRoot = new URL(import.meta.env.BASE_URL, document.baseURI);
const pages = import.meta.env.MODE === 'pages';
const modelRoot = new URL(pages ? 'build/web/full/' : 'models/full/', publicRoot);
const decoderRoot = new URL(pages ? 'viewer/public/draco/' : 'draco/', publicRoot);
const daylightURL = new URL((pages ? 'assets/lighting/' : 'lighting/')+'kloofendal_48d_partly_cloudy_puresky_1k.hdr',publicRoot);
const titles = {neighborhood:'Çevre', building:'Villa 21', f0:'Bodrum', f1:'Giriş katı', f2:'1. kat', f3:'Çatı katı'};
const groups = new Map();
const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 30);
let scene, camera, renderer, controls, loader, caps, buildingBox, gardenBox, lighting;
let selected = 'neighborhood', ready = false, loading = false;
let furnitureVisible = true, roomNamesVisible = true, measurementsVisible = false, annotations, walk;
let frameSpan = 40, framePending = false, fullHeight = 30, transition = null;

function message(text, error = false) {
  status.hidden = false; $('#load-message').textContent = text;
  $('#retry').hidden = !error; status.classList.toggle('error', error);
}
function dispose(group) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  group?.traverse(o => {
    if (!o.isMesh) return;
    geometries.add(o.geometry);
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      materials.add(m);
      for (const v of Object.values(m)) if (v?.isTexture) textures.add(v);
    }
  });
  geometries.forEach(v => v.dispose()); materials.forEach(v => v.dispose());
  textures.forEach(v => {v.source?.data?.close?.(); v.dispose();});
}
function setFurnitureVisible(visible) {
  furnitureVisible = visible;
  for (const group of groups.values()) group.traverse(object => {
    if (object.isMesh && object.userData.category === 'furniture') object.visible = visible;
  });
  $('#toggle-furniture').setAttribute('aria-pressed', String(visible));
  $('#toggle-furniture').textContent = visible ? 'Mobilya: Açık' : 'Mobilya: Kapalı';
  if (renderer) renderer.shadowMap.needsUpdate = true;
  if (walk) {
    walk.furniture = visible;
    if (walk.active && visible && !walk.xrActive && !walk.surface.sample(walk.camera.position.x, walk.camera.position.z, walk.camera.position.y-1.62)) enterWalk(walk.room);
  }
  invalidate();
}
function invalidate() {
  if (framePending || !renderer || renderer.xr.isPresenting) return;
  framePending = true;
  requestAnimationFrame(time => {if (!renderer.xr.isPresenting) renderFrame(time); else framePending = false;});
}
function renderFrame(time) {
    framePending = false;
    if (transition) {
      const t = Math.min(1, (time - transition.start) / 1050);
      clip.constant = THREE.MathUtils.lerp(transition.from, transition.to, smoothStep(t));
      renderer.shadowMap.needsUpdate = true;
      if (t >= 1) transition = null;
    }
    caps?.update(clip.constant, clip.constant < fullHeight - 0.001);
    annotations?.update(selected, roomNamesVisible, measurementsVisible, Boolean(transition), walk?.active);
    const changing = walk?.active ? walk.update(time, renderer.xr.getSession()) : controls.update();
    lighting.render(walk?.active ? walk.camera : camera);
    if (changing || transition) invalidate();
}
function resize() {
  if (!renderer) return;
  const w = host.clientWidth, h = Math.max(1, host.clientHeight), aspect = w / h;
  camera.left = -frameSpan * aspect / 2; camera.right = frameSpan * aspect / 2;
  camera.top = frameSpan / 2; camera.bottom = -frameSpan / 2;
  camera.updateProjectionMatrix(); renderer.setSize(w, h); lighting?.resize(w, h); invalidate();
  walk?.resize(w,h);
}
function frame() {
  if (!buildingBox) return;
  const floor = selected.startsWith('f');
  let box = buildingBox.clone();
  if (selected === 'building' || selected === 'f0') box.union(gardenBox);
  const center = box.getCenter(new THREE.Vector3()); center.y = 0;
  if (selected === 'neighborhood') box = new THREE.Box3(
    center.clone().add(new THREE.Vector3(-52, -5, -52)),
    center.clone().add(new THREE.Vector3(52, 28, 52)));
  const size = box.getSize(new THREE.Vector3());
  const height = selected === 'neighborhood' ? 200 : 60;
  const angle = floor ? 0.56 : 0.78;
  controls.minPolarAngle = controls.maxPolarAngle = angle;
  controls.target.copy(center);
  const reach = height * Math.tan(angle);
  camera.position.set(center.x + reach * 0.72, height, center.z + reach * 0.694);
  camera.zoom = 1;
  const aspect = host.clientWidth / Math.max(1, host.clientHeight);
  frameSpan = Math.max(size.z * 0.85 + size.y * 0.5, size.x / aspect) * 1.35;
  controls.update(); resize(); controls.saveState();
}
function setup() {
  scene = new THREE.Scene(); scene.background = new THREE.Color('#e9eeed');
  camera = new THREE.OrthographicCamera(-30, 30, 30, -30, 0.1, 2500);
  renderer = new THREE.WebGLRenderer({antialias:true, alpha:false, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
  renderer.localClippingEnabled = true;
  host.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', '3D model; döndürmek için sürükleyin');
  controls = new OrbitControls(camera, renderer.domElement);
  configureCameraControls(controls, THREE);
  controls.addEventListener('change', invalidate);
  lighting = createLighting(renderer, scene, camera, clip);
  const draco = new DRACOLoader(); draco.setDecoderPath(decoderRoot.href); draco.setWorkerLimit(2);
  loader = new GLTFLoader(); loader.setDRACOLoader(draco);
  window.addEventListener('resize', resize);
  renderer.xr.addEventListener('sessionstart', () => renderer.setAnimationLoop(renderFrame));
  renderer.xr.addEventListener('sessionend', () => {renderer.setAnimationLoop(null);resize();invalidate();});
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); message('3D görüntü durakladı. Sayfayı yenileyerek devam edebilirsin.', true);
    $('#retry').onclick = () => location.reload();
  });
}
function selectView(id, initial = false) {
  if (walk?.active && id.startsWith('f')) {
    const station=walk.surface.data.stations.find(s=>s.floor_index===Number(id[1]));enterWalk(station.room_id);return;
  }
  if (walk?.active) exitWalk(false);
  const previous = selected; selected = id;
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === id));
  $('#view-title').textContent = titles[id];
  $('#section-label').textContent = id.startsWith('f')
    ? 'Döşemeden +1,60 m · Alt katlar ve merdivenler açık'
    : id === 'building' ? 'Bina, bahçe ve yakın çevre · Sabit yükseklik'
    : 'Mahalle ve 21 numaralı villa · Sabit yükseklik';
  if (!ready) return;
  const target = sectionHeight(id, fullHeight);
  lighting.frame(id);
  if (initial || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    clip.constant = target; transition = null;
  } else transition = {from:clip.constant, to:target, start:performance.now()};
  // All assets stay loaded and visible; floor changes preserve orbit, pan and zoom.
  if (initial || !previous.startsWith('f') || !id.startsWith('f')) frame();
  host.dataset.view = id; host.dataset.loaded = 'true'; invalidate();
}
function enterWalk(roomId) {
  if (!walk || !ready) return;
  const floor=selected.startsWith('f')?Number(selected[1]):1;
  roomId ||= walk.surface.data.stations.find(s=>s.floor_index===floor).room_id;
  const station=walk.enter(roomId);selected='f'+station.floor_index;
  lighting.interior(station.floor_index,station.position);
  controls.enabled=false;clip.constant=fullHeight;transition=null;lighting.frame('building');
  $('#app').dataset.walk='true';$('.camera-tools').hidden=true;$('#walk-tools').hidden=false;$('#enter-walk').hidden=true;
  $('#walk-room').value=station.room_id;
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===selected));
  $('#view-title').textContent=titles[selected]+' · '+station.name;
  $('#section-label').textContent='Sürükle: etrafa bak · Oklar veya W A S D: yürü';
  resize();invalidate();
}
function exitWalk(reselect = true) {
  if(!walk?.active)return;
  walk.leave();controls.enabled=true;$('#app').dataset.walk='false';
  lighting.interior(null,null);
  $('.camera-tools').hidden=false;$('#walk-tools').hidden=true;$('#enter-walk').hidden=false;
  if(reselect)selectView(selected,true);
}
async function loadModel() {
  if (loading || ready) return;
  loading = true; host.dataset.loaded = 'false';
  message('Bütün model yükleniyor…');
  const staged = new Map();
  try {
    const response = await fetch(new URL('manifest.json', modelRoot), {cache:'no-cache'});
    if (!response.ok) throw Error(`Manifest HTTP ${response.status}`);
    const manifest = await response.json();
    if (!manifest.full_scene || manifest.geometry_preclipped || manifest.assets?.length !== 7) throw Error('Whole-scene manifest required');
    let next = 0, completed = 0;
    async function worker() {
      while (next < manifest.assets.length) {
        const asset = manifest.assets[next++];
        const url = new URL(asset.file, modelRoot); url.searchParams.set('v', asset.sha256.slice(0, 12));
        const gltf = await loader.loadAsync(url.href);
        staged.set(asset.id, gltf.scene);
        message(`Bütün model yükleniyor… ${++completed}/${manifest.assets.length}`);
      }
    }
    // Bound decode concurrency on phones, and settle both workers before cleanup.
    async function loadSections() {
      const url = new URL(manifest.section_atlas?.file ?? 'sections.json', modelRoot);
      if (manifest.section_atlas?.sha256) url.searchParams.set('v', manifest.section_atlas.sha256.slice(0, 12));
      const response = await fetch(url);
      if (!response.ok) throw Error(`Section atlas HTTP ${response.status}`);
      return response.json();
    }
    async function loadRooms() {
      const url = new URL(manifest.room_annotations?.file ?? 'rooms.json', modelRoot);
      if (manifest.room_annotations?.sha256) url.searchParams.set('v', manifest.room_annotations.sha256.slice(0, 12));
      const response = await fetch(url);
      if (!response.ok) throw Error(`Room annotations HTTP ${response.status}`);
      return response.json();
    }
    async function loadNavigation() {
      const url=new URL(manifest.navigation?.file ?? 'navigation.json',modelRoot);
      if(manifest.navigation?.sha256)url.searchParams.set('v',manifest.navigation.sha256.slice(0,12));
      const response=await fetch(url);if(!response.ok)throw Error(`Navigation HTTP ${response.status}`);
      const data=await response.json();
      if(data.source_furniture_sha256!==manifest.library_hashes['build/blender/layers/30-furniture-placeholders.blend'])throw Error('Navigation/furniture revision mismatch');
      return data;
    }
    const results = await Promise.allSettled([worker(), worker(), loadSections(), loadRooms(), loadNavigation(),
      lighting.loadEnvironment(daylightURL.href).catch(error=>console.warn('HDR unavailable; atmospheric daylight retained',error))]);
    const failure = results.find(r => r.status === 'rejected'); if (failure) throw failure.reason;
    for (const [id, group] of staged) {
      groups.set(id, group); scene.add(group);
      group.traverse(o => {
        if (!o.isMesh) return;
        o.renderOrder = 5;
        lighting.prepareMesh(o, id !== 'context');
        if (id !== 'context') for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          m.clippingPlanes = [clip]; m.side = THREE.DoubleSide;
        }
      });
    }
    buildingBox = new THREE.Box3();
    for (const id of ['level-0', 'level-1', 'level-2', 'level-3', 'envelope']) buildingBox.union(new THREE.Box3().setFromObject(groups.get(id)));
    // Keep the entrance, pool terrace and basement garden in the building frame.
    gardenBox = new THREE.Box3(new THREE.Vector3(-10.2, -4, -29.1), new THREE.Vector3(12.5, 3.4, 11));
    fullHeight = buildingBox.max.y + 2;
    caps = createWallCaps(results[2].value); scene.add(caps.group);
    annotations = createAnnotations(results[3].value); scene.add(annotations.group);
    walk = new InteriorWalk(results[4].value,renderer.domElement,invalidate);scene.add(walk.rig);
    lighting.setFixtures(results[4].value.lights);
    for(let f=0;f<4;f++) {
      const group=document.createElement('optgroup');group.label=titles['f'+f];
      for(const station of results[4].value.stations.filter(s=>s.floor_index===f)) {
        const room=results[3].value.rooms.find(r=>r.id===station.room_id);
        group.append(new Option(station.name+' · '+room.code,station.room_id));
      }
      $('#walk-room').append(group);
    }
    ready = true; status.hidden = true;
    $('#toggle-furniture').disabled = false; setFurnitureVisible(furnitureVisible);
    $('#toggle-rooms').disabled = false; $('#toggle-measurements').disabled = false;
    $('#enter-walk').disabled=false;
    enableImmersiveWalk(renderer,scene,walk,groups,()=>{if(!walk.active)enterWalk();},()=>{resize();invalidate();});
    selectView(selected, true);
  } catch (error) {
    for (const group of staged.values()) {scene.remove(group); dispose(group);}
    groups.clear();
    message('Model yüklenemedi. Bağlantını kontrol edip tekrar deneyebilirsin.', true);
    console.error('Model load failed', error);
  } finally {loading = false;}
}
function mode(pan) {
  controls.touches.ONE = pan ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
  controls.mouseButtons.LEFT = pan ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
  $('#rotate-mode').setAttribute('aria-pressed', !pan); $('#pan-mode').setAttribute('aria-pressed', pan);
  $('#gesture-help').textContent = pan ? 'Sürükle: kaydır · İki parmak: kaydır ve yakınlaştır' : 'Sürükle: döndür · İki parmak: kaydır ve yakınlaştır';
}
try {
  setup();
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => selectView(b.dataset.view)));
  $('#rotate-mode').onclick = () => mode(false); $('#pan-mode').onclick = () => mode(true);
  $('#zoom-in').onclick = () => {camera.zoom = Math.min(controls.maxZoom, camera.zoom * 1.3); camera.updateProjectionMatrix(); invalidate();};
  $('#zoom-out').onclick = () => {camera.zoom = Math.max(controls.minZoom, camera.zoom / 1.3); camera.updateProjectionMatrix(); invalidate();};
  $('#reset-view').onclick = frame; $('#retry').onclick = loadModel;
  $('#toggle-furniture').onclick = () => setFurnitureVisible(!furnitureVisible);
  $('#toggle-rooms').onclick = () => {
    roomNamesVisible = !roomNamesVisible; $('#toggle-rooms').setAttribute('aria-pressed', roomNamesVisible); invalidate();
  };
  $('#toggle-measurements').onclick = () => {
    measurementsVisible = !measurementsVisible; $('#toggle-measurements').setAttribute('aria-pressed', measurementsVisible); invalidate();
  };
  $('#enter-walk').onclick=()=>enterWalk();$('#exit-walk').onclick=()=>exitWalk();
  $('#walk-room').onchange=event=>enterWalk(event.target.value);
  window.addEventListener('keydown',event=>{if(event.code==='Escape'&&walk?.active&&!renderer.xr.isPresenting)exitWalk();});
  loadModel();
} catch (error) {
  message('3D görünüm başlatılamadı. Güncel Safari veya Chrome ile tekrar açabilirsin.', true);
  $('#retry').onclick = () => location.reload(); console.error(error);
}
