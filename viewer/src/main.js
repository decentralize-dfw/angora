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
import {handleEscape} from './interface-actions.js';
import {createDeviceQA} from './device-qa.js';
import {readShareState,shareSearch} from './share-state.js';
import {referenceProfile} from './render-profile.js';
import { sectionHeight, smoothStep, createWallCaps } from './section.js';

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
let flight, hotspots, planMode=false, roomData, interiorLights=true;
let scene, camera, renderer, controls, loader, caps, buildingBox, gardenBox, contextBox, lighting, siteContext;
let selected = 'neighborhood', ready = false, loading = false;
let furnitureVisible = true, roomNamesVisible = true, measurementsVisible = false, annotations, walk;
let frameSpan = 40, framePending = false, fullHeight = 30, transition = null;
let deviceQA,assetRevision=null,pendingCapture=null,contextLost=false;

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
  $('#toggle-furniture').setAttribute('aria-pressed', String(visible));
  $('#toggle-furniture').textContent = 'Mobilya';
  if (renderer) renderer.shadowMap.needsUpdate = true;
  if (walk) {
    walk.furniture = visible;
    if (walk.active && visible && !walk.xrActive && !walk.surface.sample(walk.camera.position.x, walk.camera.position.z, walk.camera.position.y-1.62)) enterWalk(walk.room);
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
      const t = Math.min(1, (time - transition.start) / 1050);
      clip.constant = THREE.MathUtils.lerp(transition.from, transition.to, smoothStep(t));
      renderer.shadowMap.needsUpdate = true;
      if (t >= 1) transition = null;
    }
    const flying=flight?.update(time);
    caps?.update(clip.constant, clip.constant < fullHeight - 0.001);
    const changing=walk?.active?walk.update(time,renderer.xr.getSession()):flying?false:controls.update();
    const activeCamera=walk?.active?walk.camera:camera;
    if(!walk?.active)fitDepthRange(camera,controls.target,contextBox);
    if(walk?.active){
      const sample=walk.surface.sample(walk.camera.position.x,walk.camera.position.z,walk.camera.position.y-1.62,walk.furniture,.3);
      if(sample){walk.floor=sample.floor;selected='f'+sample.floor;}
      lighting.interior(walk.floor,walk.camera.position.toArray(),time);
    }
    const lightChanging=lighting.update(time);
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
    if(changing||transition||flying||lightChanging||deviceQA?.active)invalidate();
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
function updateRoomUI(station){
  selected='f'+station.floor_index;$('#walk-room').value=station.room_id;
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
  renderer = new THREE.WebGLRenderer({antialias:false, alpha:false, powerPreference:'high-performance'});
  renderer.setPixelRatio(renderPixelRatio(host.clientWidth,host.clientHeight,devicePixelRatio,matchMedia('(pointer: coarse)').matches));
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
          hour:Number($('#daylight-hour').value),day:Number($('#daylight-season').value),light_style:$('#lighting-style').value,interior_lights:interiorLights},
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
  const draco = new DRACOLoader(); draco.setDecoderPath(decoderRoot.href); draco.setWorkerLimit(2);
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
  lighting.frame(id,contextBox);
  lighting.interior(id.startsWith('f')?Number(id[1]):null,null);
  if(roomData)renderPropertyInfo($('#property-info'),roomData,id);
  if(!initial&&(id==='region'||previous==='region'))clouds();
  if (initial || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    clip.constant = target; transition = null;
  } else transition = {from:clip.constant, to:target, start:performance.now()};
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
  controls.enabled=false;clip.constant=fullHeight;transition=null;lighting.frame('building');
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
  const staged = new Map();
  try {
    const response = await fetch(new URL('manifest.json', modelRoot), {cache:'no-cache'});
    if (!response.ok) throw Error(`Manifest HTTP ${response.status}`);
    const manifest = await response.json();
    assetRevision=manifest.assets?.map(({file,sha256})=>({file,sha256}));
    if (!manifest.full_scene || manifest.geometry_preclipped || manifest.assets?.length !== 7) throw Error('Whole-scene manifest required');
    let next = 0, completed = 0;
    const totalBytes = manifest.assets.reduce((sum, asset) => sum + (asset.bytes || 0), 0);
    const received = new Map();
    const reportProgress = () => {
      let done = 0; for (const value of received.values()) done += value;
      progress(totalBytes ? done / totalBytes : 0);
    };
    progress(0);
    async function worker() {
      while (next < manifest.assets.length) {
        const asset = manifest.assets[next++];
        const url = new URL(asset.file, modelRoot); url.searchParams.set('v', asset.sha256.slice(0, 12));
        // A compressed response reports fewer bytes than the manifest records,
        // so the manifest size stays the denominator and caps each part.
        const gltf = await loader.loadAsync(url.href, event => {
          received.set(asset.id, Math.min(event.loaded, asset.bytes || event.loaded));
          reportProgress();
        });
        received.set(asset.id, asset.bytes || 0);
        staged.set(asset.id, asset.id==='context'?batchContext(gltf.scene):gltf.scene);
        reportProgress();
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
      if(data.source_architecture_sha256!==manifest.library_hashes['build/blender/layers/10-architecture.blend'])throw Error('Navigation/architecture revision mismatch');
      if(data.source_furniture_sha256!==manifest.library_hashes['build/blender/layers/30-furniture-placeholders.blend'])throw Error('Navigation/furniture revision mismatch');
      if(data.source_fittings_sha256!==manifest.library_hashes['build/blender/layers/20-fixed-fittings.blend'])throw Error('Navigation/fittings revision mismatch');
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
        const sectionClipped=!['context','garden'].includes(id);
        lighting.prepareMesh(o,sectionClipped);
        if (sectionClipped) for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          m.clippingPlanes = [clip]; m.side = THREE.DoubleSide;
        }
      });
    }
    buildingBox = new THREE.Box3();
    for (const id of ['level-0', 'level-1', 'level-2', 'level-3', 'envelope']) buildingBox.union(new THREE.Box3().setFromObject(groups.get(id)));
    // Keep the entrance, pool terrace and basement garden in the building frame.
    gardenBox = new THREE.Box3(new THREE.Vector3(-10.2, -4, -29.1), new THREE.Vector3(12.5, 3.4, 11));
    contextBox=new THREE.Box3().setFromObject(groups.get('context')).union(buildingBox);
    // The background is the sky itself now, so the edge fade takes the horizon
    // colour it used to read off it.
    prepareContextSurfaces(groups.get('context'),lighting.horizonColour);
    try {
      // Every other model file carries ?v= from its manifest hash, but the site
      // context has no manifest entry, so it is revalidated instead. Without
      // this a returning visitor can pair a new bundle with the layout cached
      // before the surface repair changed it.
      const contextResponse=await fetch(new URL('../site-context.json',modelRoot),{cache:'no-cache'});
      if(!contextResponse.ok)throw Error('Context labels unavailable');
      const contextData=await contextResponse.json();
      const settlementBox=new THREE.Box3();
      for(const b of contextData.buildings)if(b.bounds)for(const p of b.bounds)settlementBox.expandByPoint(new THREE.Vector3(...p));
      if(!settlementBox.isEmpty())contextBox=settlementBox.union(buildingBox);
      siteContext=createSiteContext(contextData,host,()=>selectView('building'));
      $('#context-count').textContent=`${contextData.buildings.length} yapı · Kaynak vaziyet planı`;
    } catch(error){console.warn(error);$('#context-count').textContent='Kaynak vaziyet planı';}
    fullHeight = buildingBox.max.y + 2;
    caps = createWallCaps(results[2].value); scene.add(caps.group);
    roomData=results[3].value;annotations=createAnnotations(roomData,host,enterWalk);scene.add(annotations.group);
    walk = new InteriorWalk(results[4].value,renderer.domElement,invalidate);scene.add(walk.rig);
    lighting.setFixtures(results[4].value.lights);hotspots=createHotspots(host,walk,travelRoom);
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
    document.querySelectorAll('[data-needs-model]').forEach(b=>b.disabled=false);
    enableImmersiveWalk(renderer,scene,walk,groups,()=>{if(!walk.active)enterWalk();},()=>{resize();invalidate();});
    selectView(selected, true);
  } catch (error) {
    for (const group of staged.values()) {scene.remove(group); dispose(group);}
    groups.clear();
    message('Model yüklenemedi. Bağlantını kontrol edip tekrar deneyebilirsin.', true);
    console.error('Model load failed', error);
  } finally {loading = false;}
}
function zoom(factor){
  if(!ready)return;
  flight.go({target:controls.target,polar:controls.minPolarAngle,span:camera.position.distanceTo(controls.target)*2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),zoom:THREE.MathUtils.clamp(camera.zoom*factor,controls.minZoom,controls.maxZoom)});
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
