import './style.css';
import './interface-quality.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { createLighting } from './lighting.js';
import { createAnnotations } from './annotations.js';
import { InteriorWalk, enableImmersiveWalk } from './walk.js';
import {CameraFlight} from './camera-flight.js';
import {clockLabel} from './daylight.js';
import {createHotspots} from './hotspots.js';
import {renderPropertyInfo} from './property-info.js';
import {areaLabel} from './annotations.js';
import { configureCameraControls } from './camera.js';
import { PendingAction } from './pending-action.js';
import {fitContextBounds} from './material-response.js';
import {createSiteContext} from './site-context.js';
import {renderPixelRatio,fitDepthRange} from './render-quality.js';
import {prepareContextSurfaces} from './context-surfaces.js';
import {batchContext} from './context-batch.js';
import {mergeEqualMaterials,abstractVehicle,splitContextSoil,splitContextBuildings,createContextMassing} from './context-massing.js';
import {createLift,FLOOR_SEND_LABEL} from './lift.js';
import {handleEscape} from './interface-actions.js';
import {createDeviceQA} from './device-qa.js';
import {readShareState,shareSearch} from './share-state.js';
import {referenceProfile} from './render-profile.js';
import { sectionHeight, smoothStep, createWallCaps, createSoilCap, SOIL_CUT_HEIGHT } from './section.js';

const $ = s => document.querySelector(s);
const host = $('#viewport'), status = $('#load-status');
const publicRoot = new URL(import.meta.env.BASE_URL, document.baseURI);
const pages = import.meta.env.MODE === 'pages';
const modelRoot = new URL(pages ? 'build/web/full/' : 'models/full/', publicRoot);
const decoderRoot = new URL(pages ? 'viewer/public/draco/' : 'draco/', publicRoot);
const daylightURL = new URL((pages ? 'assets/lighting/' : 'lighting/')+'kloofendal_48d_partly_cloudy_puresky_1k.hdr',publicRoot);
const titles = {region:'Bölge', neighborhood:'Yakın çevre', building:'Villa 21', f0:'Bodrum', f1:'Giriş katı', f2:'1. kat', f3:'Çatı katı'};
const groups = new Map();
const pendingRoomJump = new PendingAction();
const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 30);
// The earth cannot follow the sweeping building cut: its authored cap exists
// at exactly one height, so this plane snaps between "whole" and "basement
// cut open" instead of lerping and leaving the excavation uncapped mid-flight.
const earthClip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 30);
let flight, hotspots, planMode=false, roomData, interiorLights=true, soilCap=null;
let scene, camera, renderer, controls, loader, caps, buildingBox, gardenBox, contextBox, lighting, siteContext;
let selected = 'neighborhood', ready = false, loading = false;
let furnitureVisible = true, roomNamesVisible = true, measurementsVisible = false, annotations, walk;
let frameSpan = 40, framePending = false, fullHeight = 30, transition = null;
let deviceQA,assetRevision=null,pendingCapture=null,contextLost=false,massing=null,lift=null;

function message(text, error = false) {
  status.hidden = false; $('#load-message').textContent = text;
  $('#retry').hidden = !error; status.classList.toggle('error', error);
}
// The scene is about 38 MB in seven files, so a chunk count alone leaves long
// silences mid-download. The share is shown visually and is deliberately kept
// out of the live region, which would otherwise read out every update.
function progress(share) {
  const bar = $('#load-bar'), percent = $('#load-percent');
  if (share === null) { bar.hidden = true; percent.textContent = ''; return; }
  const whole = Math.max(0, Math.min(100, Math.round(share * 100)));
  bar.hidden = false; bar.firstElementChild.style.width = `${whole}%`;
  percent.textContent = `%${whole}`;
}
// Dragging the daylight slider fires continuously, and Safari rate-limits
// history writes, so the address is rewritten once the controls settle.
let shareTimer = null;
function rememberState() {
  clearTimeout(shareTimer);
  shareTimer = setTimeout(() => {
    const search = shareSearch({view:selected, hour:Number($('#daylight-hour').value),
      season:$('#daylight-season').value, style:$('#lighting-style').value});
    // An empty search would leave the current query in place, so back at the
    // opening view the path replaces it outright.
    history.replaceState(null, '', (search || location.pathname) + location.hash);
  }, 400);
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
  caps?.setFurnitureVisible(visible);
  $('#toggle-furniture').setAttribute('aria-pressed', String(visible));
  $('#toggle-furniture').textContent = 'Mobilya';
  if (renderer) renderer.shadowMap.needsUpdate = true;
  if (walk) {
    walk.furniture = visible;
    if (walk.active && visible && !walk.xrActive && !walk.surface.sample(walk.camera.position.x, walk.camera.position.z, walk.camera.position.y-walk.surface.data.eye_height_m)) enterWalk(walk.room);
  }
  invalidate();
}
function invalidate() {
  if (framePending || !renderer || contextLost || renderer.xr.isPresenting) return;
  framePending = true;
  requestAnimationFrame(time => {if (!renderer.xr.isPresenting) renderFrame(time); else framePending = false;});
}
function renderFrame(time) {
    framePending = false;
    if(contextLost)return;
    if (transition) {
      const t = Math.min(1, (time - transition.start) / transition.span);
      clip.constant = THREE.MathUtils.lerp(transition.from, transition.to, smoothStep(t));
      // Re-rendering every shadow map on every frame of the cut was why changing
      // floor crawled: a 4096 sun map plus the fixtures, sixty times a second,
      // for a whole second. They only have to be right once the cut settles.
      if (t >= 1) {transition = null; renderer.shadowMap.needsUpdate = true;}
    }
    const flying=flight?.update(time);
    caps?.update(clip.constant, clip.constant < fullHeight - 0.001);
    soilCap?.update(earthClip.constant, earthClip.constant < fullHeight - 0.001 && groups.has('context'));
    const changing=walk?.active?walk.update(time,renderer.xr.getSession()):flying?false:controls.update();
    const activeCamera=walk?.active?walk.camera:camera;
    if(!walk?.active)fitDepthRange(camera,controls.target,contextBox);
    if(walk?.active){
      const sample=walk.surface.sample(walk.camera.position.x,walk.camera.position.z,walk.camera.position.y-walk.surface.data.eye_height_m,walk.furniture,.3);
      if(sample&&walk.floor!==sample.floor){walk.floor=sample.floor;selected='f'+sample.floor;lift?.setWalkFloor(sample.floor);refreshLiftControl();}
      else if(sample){walk.floor=sample.floor;selected='f'+sample.floor;}
      lighting.interior(walk.floor,walk.camera.position.toArray(),time);
    }
    const lightChanging=lighting.update(time);
    const massingChanging=massing?.update(time);
    const liftChanging=lift?.update(time);
    annotations?.update(selected,roomNamesVisible,measurementsVisible,Boolean(transition||flight?.active),walk?.active,activeCamera,walk?.room);
    hotspots?.update(activeCamera,walk?.active&&!walk.xrActive&&!walk.route);
    siteContext?.update(selected,activeCamera,controls.target,Boolean(transition||flight?.active),walk?.active);
    renderer.info.reset();
    lighting.render(activeCamera);
    if(pendingCapture){
      const callback=pendingCapture,snapshot=deviceQA.snapshot();pendingCapture=null;
      try{renderer.domElement.toBlob(blob=>callback(blob,null,snapshot),'image/png');}catch(error){callback(null,error);}
    }
    deviceQA?.sample(time,{draw_calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
      drawing_buffer:`${renderer.domElement.width}×${renderer.domElement.height}`,view:walk?.active?`${selected}:walk`:selected});
    if(changing||transition||flying||lightChanging||massingChanging||liftChanging||deviceQA?.active)invalidate();
}

function resize() {
  if (!renderer) return;
  const w = host.clientWidth, h = Math.max(1, host.clientHeight), aspect = w / h;
  const ratio=renderPixelRatio(w,h,devicePixelRatio,matchMedia('(pointer: coarse)').matches);
  if(renderer.getPixelRatio()!==ratio){renderer.setPixelRatio(ratio);lighting?.pixelRatio(ratio);}
  camera.aspect=aspect;
  camera.updateProjectionMatrix(); renderer.setSize(w, h); lighting?.resize(w, h); invalidate();
  walk?.resize(w,h);
}
function frame(initial=false,keep=false) {
  if(!buildingBox)return;
  const floor=selected.startsWith('f'),aspect=host.clientWidth/Math.max(1,host.clientHeight);
  let box=buildingBox.clone();if(selected==='building'||selected==='f0')box.union(gardenBox);
  const center=box.getCenter(new THREE.Vector3());center.y=floor?[0,3.0996,6.3714,9.4705][Number(selected[1])]:2;
  let size=box.getSize(new THREE.Vector3());
  if(selected==='neighborhood'){size.set(66,21,70);center.set(0,3,-5);}
  if(selected==='region'&&contextBox){size=contextBox.getSize(new THREE.Vector3());center.copy(contextBox.getCenter(new THREE.Vector3()));}
  const polar=planMode?.12:selected==='region'?.58:floor?.56:.78;
  frameSpan=Math.max(size.z*Math.cos(polar)+size.y*Math.sin(polar),size.x/aspect)*(floor?1.17:1.14);
  if(selected==='region'&&contextBox)frameSpan=fitContextBounds(contextBox,aspect,polar).span;
  if(keep){center.copy(controls.target);if(floor)center.y=[0,3.0996,6.3714,9.4705][Number(selected[1])];frameSpan=camera.position.distanceTo(controls.target)*2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));}
  flight.go({target:center,polar,span:frameSpan,zoom:keep?camera.zoom:1,azimuth:selected==='region'?0:initial?.804:undefined},initial===true);
  resize();
}
function panel(id,open) {
  if(walk){walk.inputSuspended=open;walk.keys.clear();walk.lastTime=null;}
  const previous=document.querySelector('.panel:not([hidden])');
  for(const name of ['options-panel','info-panel']){
    const show=name===id&&open;$('#'+name).hidden=!show;
    $('#'+(name==='options-panel'?'open-options':'open-info')).setAttribute('aria-expanded',show);
  }
  if(open){$('#'+id).querySelector('[data-close-panel]')?.focus();}
  else if(previous){$('#'+(previous.id==='options-panel'?'open-options':'open-info')).focus();}
  invalidate();
}
function clouds(){const el=$('#cloud-transition');el.classList.remove('travel');void el.offsetWidth;el.classList.add('travel');}
// One label that always names exactly what the press will do: call the cabin
// to the floor being walked, or send it away when it is already here.
function refreshLiftControl(){
  const button=$('#lift-call'),target=$('#lift-call-target');
  if(!button)return;
  if(lift?.travelling){button.disabled=true;target.textContent='hareket ediyor…';button.setAttribute('aria-label','Asansör hareket ediyor');return;}
  const can=Boolean(lift)&&ready&&!contextLost&&lift.canRun();
  button.disabled=!can;
  if(!can){target.textContent='bu katta';button.setAttribute('aria-label','Asansör bu katta');return;}
  const to=lift.target();
  target.textContent=to===lift.walkFloor?'bu kata çağır':FLOOR_SEND_LABEL[to];
  button.setAttribute('aria-label','Asansörü '+target.textContent);
}
function updateRoomUI(station){
  selected='f'+station.floor_index;$('#walk-room').value=station.room_id;
  lift?.setWalkFloor(station.floor_index);refreshLiftControl();
  $('#view-title').textContent=station.name;
  $('#section-label').textContent=titles[selected]+' · 360° oda turu';
  $('#walk-room-area').textContent=areaLabel(roomData.rooms.find(r=>r.id===station.room_id),roomData);
  renderPropertyInfo($('#property-info'),roomData,selected);
}
function travelRoom(roomId){
  pendingRoomJump.cancel();
  if(!walk?.active)return enterWalk(roomId);
  panel('',false);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){enterWalk(roomId);return;}
  if(walk.travel(roomId,updateRoomUI))return;
  // Closed source doors are not removed to create a fictitious walkable route.
  clouds();pendingRoomJump.run(()=>enterWalk(roomId),480);
}

function setup() {
  scene = new THREE.Scene(); scene.background = new THREE.Color('#e9eeed');
  camera = new THREE.PerspectiveCamera(16,1,1,2000);camera.position.set(60,100,60);
  // A phone draws straight to the canvas, so the canvas has to do the
  // antialiasing: the chain that used to do it is not in that path. On desktop
  // the composer's SMAA owns it and canvas MSAA would be paying twice.
  const coarse=matchMedia('(pointer: coarse)').matches;
  renderer = new THREE.WebGLRenderer({antialias:coarse, alpha:false, powerPreference:'high-performance'});
  renderer.setPixelRatio(renderPixelRatio(host.clientWidth,host.clientHeight,devicePixelRatio,coarse));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.localClippingEnabled = true;
  renderer.info.autoReset=false;
  host.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', '3D model; döndürmek için sürükleyin');
  controls = new OrbitControls(camera, renderer.domElement);
  configureCameraControls(controls, THREE);
  flight=new CameraFlight(camera,controls,resize,invalidate);
  controls.addEventListener('change', invalidate);
  lighting = createLighting(renderer, scene, camera, clip);
  // bindInterface() ran before this, so the controls may already carry values
  // from a shared link. Push them in before the first frame is drawn.
  lighting.setStyle($('#lighting-style').value);
  $('#daylight-hour').oninput();
  deviceQA=createDeviceQA({invalidate,closePanel:()=>panel('',false),
    capture:callback=>{pendingCapture=callback;invalidate();},
    getState:()=>{
      const c=walk?.active?walk.camera:camera;
      return {revision:'R29',bundle:import.meta.url,models:assetRevision,view:selected,walking:Boolean(walk?.active),
        css_viewport:{width:host.clientWidth,height:host.clientHeight},
        drawing_buffer:{width:renderer.domElement.width,height:renderer.domElement.height},
        camera:{position:c.position.toArray(),quaternion:c.quaternion.toArray(),target:controls.target.toArray(),fov:c.fov,zoom:c.zoom,near:c.near,far:c.far},
        settings:{section_height:clip.constant,plan:planMode,furniture:furnitureVisible,room_names:roomNamesVisible,dimensions:measurementsVisible,
          hour:Number($('#daylight-hour').value),day:Number($('#daylight-season').value),light_style:$('#lighting-style').value,interior_lights:interiorLights,lift:lift?.snapshot()??null},
        lighting:lighting.snapshot(),
        renderer:{profile:referenceProfile,three:THREE.REVISION,exposure:renderer.toneMappingExposure,tone_mapping:renderer.toneMapping,output_color_space:renderer.outputColorSpace,
          max_samples:renderer.capabilities.maxSamples,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures},
        elapsed_since_navigation_ms:performance.now()};
    }});
  renderer.domElement.addEventListener('webglcontextlost',event=>{
    event.preventDefault();
    contextLost=true;
    deviceQA.interrupt();
    document.querySelectorAll('[data-needs-model]').forEach(b=>b.disabled=true);
    if(pendingCapture){pendingCapture(null,new Error('WebGL context lost'));pendingCapture=null;}
    message('3D grafik bağlantısı kesildi. Sayfayı yeniden açarak devam edebilirsin.',true);
    $('#retry').onclick=()=>location.reload();
  });
  // Seven compressed meshes were being unpacked two at a time on hardware that
  // has six or eight cores, which is dead time in the middle of the wait. One
  // core is left for the page, and a phone keeps one fewer decoder in flight so
  // the peak memory of the decode does not stack up on top of the scene.
  const draco = new DRACOLoader(); draco.setDecoderPath(decoderRoot.href);
  draco.setWorkerLimit(Math.max(2,Math.min(coarse?3:4,(navigator.hardwareConcurrency||4)-1)));
  loader = new GLTFLoader(); loader.setDRACOLoader(draco);
  window.addEventListener('resize', resize);
  renderer.xr.addEventListener('sessionstart', () => renderer.setAnimationLoop(renderFrame));
  renderer.xr.addEventListener('sessionend', () => {renderer.setAnimationLoop(null);resize();invalidate();});
}
function selectView(id, initial = false) {
  pendingRoomJump.cancel();
  if (walk?.active && id.startsWith('f')) {
    const station=walk.surface.data.stations.find(s=>s.floor_index===Number(id[1]));travelRoom(station.room_id);return;
  }
  if (walk?.active) exitWalk(false);
  const previous = selected; selected = id;
  $('#app').dataset.scale=id.startsWith('f')?'floor':id;
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === id));
  $('#view-title').textContent = titles[id];
  $('#section-label').textContent = id.startsWith('f')
    ? (id==='f3'?'1,30 m kesit':'1,60 m kesit')
    : id === 'building' ? 'Bahçe · Havuz · Villa' : id==='region'?'Vaziyet planından 3D yerleşim':'Angora Evleri · Ankara';
  $('#region-panel').hidden=id!=='region';
  panel('',false);
  if (!ready) return;
  const target = sectionHeight(id, fullHeight);
  const earthTarget = id==='f0' ? SOIL_CUT_HEIGHT : fullHeight;
  if (earthClip.constant !== earthTarget) {earthClip.constant = earthTarget; renderer.shadowMap.needsUpdate = true;}
  lighting.frame(id,contextBox);massing?.set(id);lift?.park(id);
  lighting.interior(id.startsWith('f')?Number(id[1]):null,null);
  if(roomData)renderPropertyInfo($('#property-info'),roomData,id);
  if(!initial&&(id==='region'||previous==='region'))clouds();
  if (initial || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    clip.constant = target; transition = null;
  } else transition = {from:clip.constant, to:target, start:performance.now(),
    span:matchMedia('(pointer: coarse)').matches?520:820};
  // All assets stay loaded and visible; floor changes preserve orbit, pan and zoom.
  if(initial||!previous.startsWith('f')||!id.startsWith('f'))frame(initial);
  else if(previous!==id)frame(false,true);
  host.dataset.view = id; host.dataset.loaded = 'true'; rememberState(); invalidate();
}
function enterWalk(roomId) {
  pendingRoomJump.cancel();
  if (!walk || !ready) return;
  const floor=selected.startsWith('f')?Number(selected[1]):1;
  roomId ||= walk.surface.data.stations.find(s=>s.floor_index===floor).room_id;
  flight.cancel();panel('',false);const station=walk.enter(roomId);selected='f'+station.floor_index;updateRoomUI(station);
  lighting.interior(station.floor_index,station.position);
  controls.enabled=false;clip.constant=fullHeight;earthClip.constant=fullHeight;transition=null;lighting.frame('building');massing?.set('building');
  // after the section plane is raised, or canRun() reads the previous cut
  lift?.setWalkActive(true);lift?.setWalkFloor(station.floor_index);refreshLiftControl();
  $('#app').dataset.walk='true';$('.camera-tools').hidden=true;$('#walk-tools').hidden=false;$('#enter-walk').hidden=true;
  $('#walk-room').value=station.room_id;
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===selected));
  $('#gesture-help').textContent='Sürükle: 360° bak · Yerdeki noktalara dokun: ilerle';
  resize();invalidate();
}
function exitWalk(reselect = true) {
  pendingRoomJump.cancel();
  if(!walk?.active)return;
  walk.leave();controls.enabled=true;$('#app').dataset.walk='false';
  lighting.interior(null,null);
  lift?.setWalkActive(false);lift?.cancel();refreshLiftControl();
  $('.camera-tools').hidden=false;$('#walk-tools').hidden=true;$('#enter-walk').hidden=false;
  planMode=false;$('#toggle-plan').setAttribute('aria-pressed',false);
  if(reselect){selectView(selected);frame(false);}
  $('#gesture-help').textContent='Sürükle: döndür · İki parmak: kaydır / yakınlaştır';
}
async function loadModel() {
  if (loading || ready) return;
  loading = true; host.dataset.loaded = 'false';
  // Clear any bar left by a failed attempt before the manifest is back.
  progress(null);
  message('Bütün model yükleniyor…');
  const staged = new Map(), stagedClips = new Map();
  try {
    const response = await fetch(new URL('manifest.json', modelRoot), {cache:'no-cache'});
    if (!response.ok) throw Error(`Manifest HTTP ${response.status}`);
    const manifest = await response.json();
    assetRevision=manifest.assets?.map(({file,sha256})=>({file,sha256}));
    if (!manifest.full_scene || manifest.geometry_preclipped || manifest.assets?.length !== 7) throw Error('Whole-scene manifest required');
    // R42: the whole scene before the first frame. It used to open on the villa
    // alone and stream the garden and the neighbourhood in behind it, which is
    // quicker to something but slower to the thing that was asked for - the
    // house stood on nothing for a moment, the ground arrived under it, then
    // the street. "hepsini yükle öyle aç." Everything is downloaded and staged
    // before the bar goes, and the order still reveals the building outside-in
    // for whoever is watching the count.
    const PHASE_ORDER=['envelope','level-1','level-0','level-2','level-3','garden','context'];
    const queue=manifest.assets.slice().sort((a,b)=>PHASE_ORDER.indexOf(a.id)-PHASE_ORDER.indexOf(b.id));
    let completed = 0;
    const totalBytes = manifest.assets.reduce((sum, asset) => sum + (asset.bytes || 0), 0) + (manifest.section_cap_asset?.bytes || 0);
    const received = new Map();
    const reportProgress = () => {
      let done = 0; for (const value of received.values()) done += value;
      progress(totalBytes ? done / totalBytes : 0);
    };
    progress(0);
    async function worker(assets) {
      while (assets.length) {
        const asset = assets.shift();
        const url = new URL(asset.file, modelRoot); url.searchParams.set('v', asset.sha256.slice(0, 12));
        // A compressed response reports fewer bytes than the manifest records,
        // so the manifest size stays the denominator and caps each part.
        const gltf = await loader.loadAsync(url.href, event => {
          received.set(asset.id, Math.min(event.loaded, asset.bytes || event.loaded));
          reportProgress();
        });
        received.set(asset.id, asset.bytes || 0);
        mergeEqualMaterials(gltf.scene); abstractVehicle(gltf.scene);
        staged.set(asset.id, asset.id==='context'?batchContext(splitContextBuildings(splitContextSoil(gltf.scene))):gltf.scene);
        if (gltf.animations?.length) stagedClips.set(asset.id, gltf.animations);
        reportProgress();
        if(!ready)message(`Model yükleniyor… ${++completed}/${manifest.assets.length}`);else ++completed;
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
    async function loadCaps() {
      // Optional by design: the dev-server copy under viewer/public is a
      // version-2 manifest with no section_cap_asset, and a missing cap only
      // costs the authored soil face, never the load.
      if (!manifest.section_cap_asset) return null;
      const url = new URL(manifest.section_cap_asset.file, modelRoot);
      url.searchParams.set('v', manifest.section_cap_asset.sha256.slice(0, 12));
      try {
        const gltf = await loader.loadAsync(url.href, event => {
          received.set('section-caps', Math.min(event.loaded, manifest.section_cap_asset.bytes || event.loaded));
          reportProgress();
        });
        received.set('section-caps', manifest.section_cap_asset.bytes || 0); reportProgress();
        return gltf.scene;
      } catch (error) {console.warn('Section caps unavailable', error); return null;}
    }
    async function loadNavigation() {
      const url=new URL(manifest.navigation?.file ?? 'navigation.json',modelRoot);
      if(manifest.navigation?.sha256)url.searchParams.set('v',manifest.navigation.sha256.slice(0,12));
      const response=await fetch(url);if(!response.ok)throw Error(`Navigation HTTP ${response.status}`);
      const data=await response.json();
      if(data.source_architecture_sha256!==manifest.library_hashes['build/blender/layers/10-architecture.blend'])throw Error('Navigation/architecture revision mismatch');
      if(data.source_furniture_sha256!==manifest.library_hashes['build/blender/layers/30-furniture-placeholders.blend'])throw Error('Navigation/furniture revision mismatch');
      if(data.source_fittings_sha256!==manifest.library_hashes['build/blender/layers/20-fixed-fittings.blend'])throw Error('Navigation/fittings revision mismatch');
      return data;
    }
    // R42: one plane cuts the whole property. Two of the neighbourhood's trees
    // are planted inside the boundary and arrive in context.glb, so they used
    // to stand whole over the Bodrum plan - 212,000 vertices of canopy above
    // the cut - while the garden's own spruces beside them were sectioned.
    // "arsa içi, orda kot farklı olmasın, tek bir clipping plane çalışacak."
    // Anything from the neighbourhood whose body sits inside the plot is cut
    // with the garden; the roads, the curbs and the neighbours' blocks, which
    // only clip the boundary, stay whole.
    const plotBox = new THREE.Box3(new THREE.Vector3(-10.2, -40, -29.1), new THREE.Vector3(12.5, 40, 11));
    const centre = new THREE.Vector3(), bounds = new THREE.Box3();
    const onThePlot = (mesh) => {
      if (!mesh.geometry?.boundingBox) mesh.geometry?.computeBoundingBox();
      if (!mesh.geometry?.boundingBox) return false;
      bounds.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld);
      return plotBox.containsPoint(bounds.getCenter(centre));
    };
    function stageGroup(id) {
      const group=staged.get(id);
      groups.set(id, group); scene.add(group);
      group.updateMatrixWorld(true);
      group.traverse(o => {
        if (!o.isMesh) return;
        o.renderOrder = 5;
        const building=id!=='context'&&id!=='garden';
        // A 1.60 m section that leaves a 10 m spruce standing on the plan is
        // not a section, so the garden sweeps with the building cut. Of the
        // context only the plot's own soil is cut, by the snap plane, so the
        // neighbourhood and roads stay whole and the authored cap always fits.
        const planes=building||id==='garden'?[clip]
          :(Array.isArray(o.material)?o.material:[o.material]).some(m=>m?.userData.plotSoil)?[earthClip]
          :onThePlot(o)?[clip]:[];
        lighting.prepareMesh(o,{clipped:planes[0]===clip,context:!building});
        o.userData.clipPlanes=planes;
        if (planes.length) for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          m.clippingPlanes = planes; m.side = THREE.DoubleSide;
        }
      });
    }
    const results = await Promise.allSettled([worker(queue), worker(queue), loadSections(), loadRooms(), loadNavigation(),
      lighting.loadEnvironment(daylightURL.href).catch(error=>console.warn('HDR unavailable; atmospheric daylight retained',error)), loadCaps()]);
    const failure = results.find(r => r.status === 'rejected'); if (failure) throw failure.reason;
    for (const id of staged.keys()) stageGroup(id);
    buildingBox = new THREE.Box3();
    for (const id of ['level-0', 'level-1', 'level-2', 'level-3', 'envelope']) buildingBox.union(new THREE.Box3().setFromObject(groups.get(id)));
    // Keep the entrance, pool terrace and basement garden in the building frame.
    gardenBox = new THREE.Box3(new THREE.Vector3(-10.2, -4, -29.1), new THREE.Vector3(12.5, 3.4, 11));
    contextBox=buildingBox.clone();
    try {
      // Every other model file carries ?v= from its manifest hash, but the site
      // context has no manifest entry, so it is revalidated instead. Without
      // this a returning visitor can pair a new bundle with the layout cached
      // before the surface repair changed it. It also frames the region view
      // correctly before the context geometry itself has arrived.
      const contextResponse=await fetch(new URL('../site-context.json',modelRoot),{cache:'no-cache'});
      if(!contextResponse.ok)throw Error('Context labels unavailable');
      const contextData=await contextResponse.json();
      const settlementBox=new THREE.Box3();
      for(const b of contextData.buildings)if(b.bounds)for(const p of b.bounds)settlementBox.expandByPoint(new THREE.Vector3(...p));
      if(!settlementBox.isEmpty())contextBox=settlementBox.union(buildingBox);
      siteContext=createSiteContext(contextData,host,()=>selectView('building'));
      $('#context-count').textContent=`${contextData.buildings.length} yapı · Kaynak vaziyet planı`;
    } catch(error){console.warn(error);$('#context-count').textContent='Kaynak vaziyet planı';}
    // The neighbourhood is in by now, so its bounds, its horizon fade and its
    // white massing are set up here rather than in a continuation that used to
    // run after the first frame.
    if(groups.has('context')){
      contextBox.union(new THREE.Box3().setFromObject(groups.get('context')));
      prepareContextSurfaces(groups.get('context'),lighting.horizonColour);
      massing=createContextMassing(groups.get('context'));
    }
    fullHeight = buildingBox.max.y + 2;
    caps = createWallCaps(results[2].value); scene.add(caps.group);
    const capScene=results[6].status==='fulfilled'?results[6].value:null;
    if (capScene) {soilCap = createSoilCap(capScene); if (soilCap) scene.add(soilCap.group);}
    roomData=results[3].value;annotations=createAnnotations(roomData,host,enterWalk);scene.add(annotations.group);
    walk = new InteriorWalk(results[4].value,renderer.domElement,invalidate);scene.add(walk.rig);
    lighting.setFixtures(results[4].value.lights);hotspots=createHotspots(host,walk,travelRoom);
    lift=createLift({groups,clips:stagedClips.get('level-0')??[],clipPlane:clip,fullHeight,
      shadowsDirty:()=>{renderer.shadowMap.needsUpdate=true;},onSettled:()=>refreshLiftControl()});
    refreshLiftControl();
    for(let f=0;f<4;f++) {
      const group=document.createElement('optgroup');group.label=titles['f'+f];
      for(const station of results[4].value.stations.filter(s=>s.floor_index===f)) {
        const room=results[3].value.rooms.find(r=>r.id===station.room_id);
        group.append(new Option(station.name+' · '+room.code,station.room_id));
      }
      $('#walk-room').append(group);
    }
    // Everything the first tap used to pay for is paid for here, behind the
    // progress bar. A storey button used to hand the driver a few hundred
    // programs to build at the moment it was pressed - the villa is only ever
    // drawn whole until then - and the cut animation ran on top of the
    // compile, which is what made the first Bodrum or Çatı crawl and every
    // one after it fine. Compiling first costs the load a beat and gives the
    // interface back a press that opens immediately.
    message('Görünüm hazırlanıyor…');
    // Never fatal: a driver that cannot pre-compile still draws, it just pays
    // at the first press the way it used to.
    try {
      // Bounded. A driver with parallel shader compile finishes this in well
      // under a second; one without it compiles serially, and nobody should
      // wait behind a progress bar that has nothing left to download. The
      // compile is not cancelled, only stopped being waited on.
      if (renderer.compileAsync) {
        await Promise.race([renderer.compileAsync(scene, camera),
          new Promise(resolve => setTimeout(resolve, 8000))]);
      } else renderer.compile(scene, camera);
    } catch (error) {console.warn('Shader pre-compile unavailable; first view will compile on demand', error);}
    ready = true;
    $('#toggle-furniture').disabled = false; setFurnitureVisible(furnitureVisible);
    $('#toggle-rooms').disabled = false; $('#toggle-measurements').disabled = false;
    $('#enter-walk').disabled=false;
    document.querySelectorAll('[data-needs-model]').forEach(b=>b.disabled=false);
    enableImmersiveWalk(renderer,scene,walk,groups,()=>{if(!walk.active)enterWalk();},()=>{resize();invalidate();});
    // Build each storey's cut geometry once, here, rather than on the frame
    // that first shows it: four heights, four slices, and the allocation and
    // the triangulation upload are behind us.
    for (const view of ['f0','f1','f2','f3']) caps.update(sectionHeight(view, fullHeight), true);
    selectView(selected, true);
    // One composed frame before the bar goes: the occlusion, antialias, bloom,
    // grade and dither passes compile on their first use like anything else.
    lighting.render(camera);
    status.hidden = true;
  } catch (error) {
    for (const group of staged.values()) {scene.remove(group); dispose(group);}
    groups.clear();
    message('Model yüklenemedi. Bağlantını kontrol edip tekrar deneyebilirsin.', true);
    console.error('Model load failed', error);
  } finally {loading = false;}
}
// Zoom must not move the camera. This used to fly to controls.minPolarAngle, so
// every tap on + or - also tilted the view back to its flattest angle and the
// building appeared to shift under you. Only the zoom changes now.
function zoom(factor){
  if(!ready)return;
  camera.zoom=THREE.MathUtils.clamp(camera.zoom*factor,controls.minZoom,controls.maxZoom);
  camera.updateProjectionMatrix();invalidate();
}
function mode(pan) {
  controls.touches.ONE = pan ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
  controls.mouseButtons.LEFT = pan ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
  $('#rotate-mode').setAttribute('aria-pressed', !pan); $('#pan-mode').setAttribute('aria-pressed', pan);
  $('#gesture-help').textContent = pan ? 'Sürükle: kaydır · İki parmak: kaydır ve yakınlaştır' : 'Sürükle: döndür · İki parmak: kaydır ve yakınlaştır';
}
// Panels remain usable if WebGL is unavailable. Model actions are disabled
// until loading succeeds; do not strand every control in the renderer catch.
function bindInterface() {
  // The controls hold the shared state; lighting is built later in setup() and
  // reads its opening values back off them, so a link lands on the right hour
  // rather than easing into it after the first frame.
  const shared = readShareState(location.search);
  if (shared.view) selected = shared.view;
  if (shared.hour !== undefined) $('#daylight-hour').value = shared.hour;
  if (shared.season) $('#daylight-season').value = shared.season;
  if (shared.style) $('#lighting-style').value = shared.style;
  for(const id of ['toggle-plan','reset-view','rotate-mode','pan-mode','zoom-in','zoom-out']){
    const button=$('#'+id);button.dataset.needsModel='';button.disabled=true;
  }
  document.querySelectorAll('[data-view]').forEach(b => {
    b.dataset.needsModel='';b.disabled=true;b.addEventListener('click', () => selectView(b.dataset.view));
  });
  $('#rotate-mode').onclick = () => mode(false); $('#pan-mode').onclick = () => mode(true);
  $('#zoom-in').onclick=()=>zoom(1.3);
  $('#zoom-out').onclick=()=>zoom(1/1.3);
  $('#reset-view').onclick=()=>{planMode=false;$('#toggle-plan').setAttribute('aria-pressed',false);frame(false);}; $('#retry').onclick = loadModel;
  $('#lift-call').onclick=()=>{if(lift?.run(performance.now())){refreshLiftControl();invalidate();}};
  $('#toggle-furniture').onclick = () => setFurnitureVisible(!furnitureVisible);
  $('#toggle-rooms').onclick = () => {
    roomNamesVisible = !roomNamesVisible; $('#toggle-rooms').setAttribute('aria-pressed', roomNamesVisible); invalidate();
  };
  $('#toggle-measurements').onclick = () => {
    measurementsVisible = !measurementsVisible; $('#toggle-measurements').setAttribute('aria-pressed', measurementsVisible); invalidate();
  };
  $('#enter-walk').onclick=()=>enterWalk();$('#exit-walk').onclick=()=>exitWalk();
  $('#walk-room').onchange=event=>travelRoom(event.target.value);
  $('#toggle-plan').onclick=()=>{planMode=!planMode;$('#toggle-plan').setAttribute('aria-pressed',planMode);frame(false,true);};
  $('#open-options').onclick=()=>panel('options-panel',$('#options-panel').hidden);
  $('#open-info').onclick=()=>panel('info-panel',$('#info-panel').hidden);
  document.querySelectorAll('[data-close-panel]').forEach(button=>button.onclick=()=>panel('',false));
  $('#daylight-hour').oninput=()=>{const hour=Number($('#daylight-hour').value);$('#daylight-time').textContent=clockLabel(hour);$('#daylight-hour').setAttribute('aria-valuetext',clockLabel(hour));lighting?.setTime(hour,Number($('#daylight-season').value));rememberState();invalidate();};
  $('#daylight-season').onchange=()=>$('#daylight-hour').oninput();
  $('#toggle-lights').onclick=()=>{interiorLights=!interiorLights;$('#toggle-lights').setAttribute('aria-pressed',interiorLights);lighting?.setLights(interiorLights);invalidate();};
  $('#lighting-style').onchange=e=>{lighting?.setStyle(e.target.value);rememberState();invalidate();};
  $('#return-villa').onclick=()=>selectView('building');
  window.addEventListener('keydown',event=>handleEscape(event,{
    panelOpen:Boolean(document.querySelector('.panel:not([hidden])')),closePanel:()=>panel('',false),
    walkActive:walk?.active,immersive:renderer?.xr.isPresenting,exitWalk
  }));
  // Keep keyboard navigation inside an open sheet, with Escape and explicit
  // close both restoring focus to the button that opened it.
  document.querySelectorAll('.panel').forEach(sheet=>sheet.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const items=[...sheet.querySelectorAll('button:not(:disabled),a[href],input,select,summary')].filter(el=>el.getClientRects().length>0);
    const first=items[0],last=items.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }));
}
bindInterface();
try {
  setup();
  loadModel();
} catch (error) {
  message('3D görünüm başlatılamadı. Güncel Safari veya Chrome ile tekrar açabilirsin.', true);
  $('#retry').onclick = () => location.reload(); console.error(error);
  $('#app').dataset.renderError='true';
  // The renderer never started, so no manifest hash is available to version
  // this with; revalidate so the panel cannot fall back to stale room data.
  fetch(new URL('rooms.json',modelRoot),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Property info unavailable');return r.json();})
    .then(data=>{roomData=data;renderPropertyInfo($('#property-info'),data,'building');}).catch(console.warn);
}
