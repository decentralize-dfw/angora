import './style.css';
import './interface-quality.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { createLighting } from './lighting.js';
import { createAnnotations } from './annotations.js';
import { InteriorWalk, enableImmersiveWalk } from './walk.js';
import {CameraFlight} from './camera-flight.js';
import {clockLabel} from './daylight.js';
import {createHotspots} from './hotspots.js';
import {renderPropertyInfo} from './property-info.js';
import {areaLabel} from './annotations.js';
import {ROOM_AREAS} from './room-areas.js';
import { configureCameraControls } from './camera.js';
import { PendingAction } from './pending-action.js';
import {fitContextBounds,neutraliseTransmission} from './material-response.js';
import {applyGradeValues,loadGradeTextures,bindGradeTextures} from './exterior-grade.js';
import {createSiteContext} from './site-context.js';
import {createRegionMap,atlasMeta} from './region-map.js';
import {renderPixelRatio,fitDepthRange} from './render-quality.js';
import {prepareContextSurfaces} from './context-surfaces.js';
import {batchContext} from './context-batch.js';
import {mergeEqualMaterials,abstractVehicle,splitContextSoil,splitContextBuildings,createContextMassing,authoredNodeName} from './context-massing.js';
const PLANTING=/spruce|needle|foliage|hedge|leaves|leaf|shrub|tree|branch|trunk|planting/i;
import {createLift} from './lift.js';
import {handleEscape} from './interface-actions.js';
import {createInterfaceSound} from './interface-sound.js';
import {createDeviceQA} from './device-qa.js';
import {readShareState,shareSearch} from './share-state.js';
import {referenceProfile} from './render-profile.js';
import { sectionHeight, smoothStep, createWallCaps, createSoilCap, SOIL_CUT_HEIGHT } from './section.js';
import { createStencilCaps, createInteriorPoche } from './section-stencil.js';
import { createWalkLocator } from './walk-locator.js';
import { t, roomName, applyStatic, setLang, currentLang } from './i18n.js';

const $ = s => document.querySelector(s);
const host = $('#viewport'), status = $('#load-status');
const publicRoot = new URL(import.meta.env.BASE_URL, document.baseURI);
const pages = import.meta.env.MODE === 'pages';
const modelRoot = new URL(pages ? 'build/web/full/' : 'models/full/', publicRoot);
const decoderRoot = new URL(pages ? 'viewer/public/draco/' : 'draco/', publicRoot);
const daylightURL = new URL((pages ? 'assets/lighting/' : 'lighting/')+'kloofendal_48d_partly_cloudy_puresky_1k.hdr',publicRoot);
const titles = new Proxy({}, {get: (_, key) => t(key)});
const groups = new Map();
const pendingRoomJump = new PendingAction();
const LITE = (() => {
  const forced = new URLSearchParams(location.search).get('model');
  if (forced === 'lite') return true;
  if (forced === 'full') return false;
  return (matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 820)
    || (navigator.deviceMemory !== undefined && navigator.deviceMemory <= 4);
})();
let regionMap = null;
const plantingCandidates = [], plantingAboveCut = [];
const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 30);
const earthClip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 30);
const PLOT_RECT = {minX: -11.2, maxX: 11.5, minZ: -24.0, maxZ: 11.06};
const plotCarvePlanes = [earthClip,
  new THREE.Plane(new THREE.Vector3(-1, 0, 0), PLOT_RECT.minX),
  new THREE.Plane(new THREE.Vector3(1, 0, 0), -PLOT_RECT.maxX),
  new THREE.Plane(new THREE.Vector3(0, 0, -1), PLOT_RECT.minZ),
  new THREE.Plane(new THREE.Vector3(0, 0, 1), -PLOT_RECT.maxZ)];
let plotCutReady = false;
let planWash = null;
let flight, hotspots, planMode=false, roomData, interiorLights=true, soilCap=null, stencilCaps=null, interiorPoche=null;
let scene, camera, renderer, controls, loader, caps, buildingBox, gardenBox, contextBox, lighting, siteContext;
let selected = 'f3', ready = false, loading = false;
let furnitureVisible = true, roomNamesVisible = true, measurementsVisible = false, annotations, walk;
let frameSpan = 40, framePending = false, fullHeight = 30, transition = null;
let deviceQA,assetRevision=null,pendingCapture=null,contextLost=false,massing=null,lift=null;
let floorBoxes=[];
let mergedBasement=null;
let locator=null,locationKey='',locationPendingKey='',locationPendingSince=0;
const openedWithView=new URLSearchParams(location.search).has('view');

function message(text, error = false) {
  status.hidden = false; $('#load-message').textContent = text;
  $('#retry').hidden = !error; status.classList.toggle('error', error);
}
function progress(share) {
  const bar = $('#load-bar'), percent = $('#load-percent');
  if (share === null) { bar.hidden = true; percent.textContent = ''; return; }
  const whole = Math.max(0, Math.min(100, Math.round(share * 100)));
  bar.hidden = false; bar.firstElementChild.style.width = `${whole}%`;
  percent.textContent = `%${whole}`;
}
let shareTimer = null;
function rememberState() {
  clearTimeout(shareTimer);
  shareTimer = setTimeout(() => {
    const search = shareSearch({view:selected, hour:Number($('#daylight-hour').value),
      season:$('#daylight-season').value, style:$('#lighting-style').value});
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
  $('#toggle-furniture').textContent = t('furniture');
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
      if (t >= 1) {transition = null; renderer.shadowMap.needsUpdate = true;}
    }
    const flying=flight?.update(time);
    if(planWash){
      const target=planMode&&!walk?.active?1:0;
      const dt=Math.min(0.25,(time-(planWash.userData.time??time))/1000);planWash.userData.time=time;
      const next=THREE.MathUtils.damp(planWash.userData.level,target,6,dt);
      if(Math.abs(next-planWash.userData.level)>0.0005){
        planWash.userData.level=next;
        for(const over of planWash.userData.overlays)over.opacity=next*over.userData.washBase;
        invalidate();
      }
      planWash.visible=planWash.userData.level>0.01;
    }
    caps?.update(clip.constant, clip.constant < fullHeight - 0.001);
    stencilCaps?.update(clip.constant, clip.constant < fullHeight - 0.001 && !walk?.active);
    interiorPoche?.update(clip.constant, clip.constant < fullHeight - 0.001 && !walk?.active);
    soilCap?.update(earthClip.constant, earthClip.constant < fullHeight - 0.001 && plotCutReady);
    const changing=walk?.active?walk.update(time,renderer.xr.getSession()):flying?false:controls.update();
    const activeCamera=walk?.active?walk.camera:camera;
    if(!walk?.active)fitDepthRange(camera,controls.target,contextBox);
    if(walk?.active){
      const sample=walk.surface.sample(walk.camera.position.x,walk.camera.position.z,walk.camera.position.y-walk.surface.data.eye_height_m,walk.furniture,.3);
      if(sample&&walk.floor!==sample.floor){
        walk.floor=sample.floor;selected='f'+sample.floor;lift?.setWalkFloor(sample.floor);refreshLiftControl();
        $('#section-label').textContent=titles[selected]+' · '+t('walkSub');
        if(roomData)renderPropertyInfo($('#property-info'),roomData,selected);
      }
      else if(sample){walk.floor=sample.floor;selected='f'+sample.floor;}
      if(locator){
        const here=locator.locate(walk.camera.position.x,walk.camera.position.z,walk.floor);
        const key=here?(here.outdoor?'out'+(walk.floor>=2?'t':'g'):here.stairs?'stairs':here.station?.room_id??''):locationKey;
        if(key!==locationPendingKey){locationPendingKey=key;locationPendingSince=time;}
        else if(key!==locationKey&&time-locationPendingSince>380){
          locationKey=key;
          if(here.outdoor)applyWalkLocation(t(walk.floor>=2?'terrace':'garden'),null);
          else if(here.stairs)applyWalkLocation(t('stairs'),null);
          else if(here.station)applyWalkLocation(roomName(here.station.name),here.station);
        }
      }
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
function frame(initial=false) {
  if(!buildingBox)return;
  const floor=selected.startsWith('f'),aspect=host.clientWidth/Math.max(1,host.clientHeight);
  let box=(floor?floorBoxes[Number(selected[1])]??buildingBox:buildingBox).clone();
  if(selected==='f0')box.union(gardenBox);
  const center=box.getCenter(new THREE.Vector3());center.y=floor?[0,3.0996,6.3714,9.4705][Number(selected[1])]:2;
  let size=box.getSize(new THREE.Vector3());
  if(selected==='building'){
    const compact=matchMedia('(pointer: coarse)').matches||aspect<0.9;
    if(compact&&gardenBox){
      const plot=buildingBox.clone().union(gardenBox);
      size.set(2*Math.max(center.x-plot.min.x,plot.max.x-center.x),size.y,
               2*Math.max(center.z-plot.min.z,plot.max.z-center.z));
    } else size.multiplyScalar(1.18);
  }
  if(selected==='neighborhood'){size.set(66,21,70);center.set(0,3,-5);}
  if(selected==='region'&&contextBox){size=contextBox.getSize(new THREE.Vector3());center.copy(contextBox.getCenter(new THREE.Vector3()));}
  const polar=planMode?.02:selected==='region'?.58:floor?.56:.78;
  frameSpan=Math.max(size.z*Math.cos(polar)+size.y*Math.sin(polar),size.x/aspect)*(floor?1.1:1.14);
  if(selected==='region'&&contextBox)frameSpan=fitContextBounds(contextBox,aspect,polar).span;
  flight.go({target:center,polar,span:frameSpan,zoom:1,fov:planMode?4:35,
    azimuth:selected==='region'||planMode?0:initial?.804:undefined},initial===true);
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
function refreshLiftControl(){
  const button=$('#lift-call'),target=$('#lift-call-target');
  if(!button)return;
  if(lift?.travelling){button.disabled=true;target.textContent='hareket ediyor…';button.setAttribute('aria-label','Asansör hareket ediyor');return;}
  const can=Boolean(lift)&&ready&&!contextLost&&lift.canRun();
  button.disabled=!can;
  if(!can){target.textContent='bu katta';button.setAttribute('aria-label','Asansör bu katta');return;}
  const to=lift.target();
  target.textContent=to===lift.walkFloor?t('liftCall'):t('liftSend'+to);
  button.setAttribute('aria-label','Asansörü '+target.textContent);
}
function updateRoomUI(station){
  selected='f'+station.floor_index;$('#walk-room').value=station.room_id;
  lift?.setWalkFloor(station.floor_index);refreshLiftControl();
  locationKey=station.room_id;locationPendingKey=station.room_id;
  $('#view-title').textContent=roomName(station.name);
  $('#section-label').textContent=titles[selected]+' · '+t('walkSub');
  $('#walk-room-area').textContent=areaLabel(roomData.rooms.find(r=>r.id===station.room_id),roomData);
  renderPropertyInfo($('#property-info'),roomData,selected);
}
function applyWalkLocation(name,station){
  $('#view-title').textContent=name;
  if(station){
    walk.room=station.room_id;
    const shownId=station.room_id===mergedBasement?.absorbedId?mergedBasement.keeperId:station.room_id;
    $('#walk-room').value=shownId;
    $('#walk-room-area').textContent=areaLabel(roomData?.rooms.find(r=>r.id===shownId),roomData);
  } else $('#walk-room-area').textContent='';
  invalidate();
}
function travelRoom(roomId){
  pendingRoomJump.cancel();
  if(!walk?.active)return enterWalk(roomId);
  panel('',false);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){enterWalk(roomId);return;}
  if(walk.travel(roomId,updateRoomUI))return;
  clouds();pendingRoomJump.run(()=>enterWalk(roomId),480);
}

function setup() {
  scene = new THREE.Scene(); scene.background = new THREE.Color('#e9eeed');
  camera = new THREE.PerspectiveCamera(16,1,1,2000);camera.position.set(60,100,60);
  const coarse=matchMedia('(pointer: coarse)').matches;
  try {
    renderer = new THREE.WebGLRenderer({antialias:coarse, alpha:false, stencil:true, powerPreference:'high-performance'});
  } catch (error) {
    console.error('WebGL unavailable', error);
    message(t('loadFailed'), true); $('#retry').hidden = true; $('#no3d').hidden = false;
    contextLost = true; return;
  }
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
    message(t('contextLost'),true);$('#no3d').hidden=false;
    $('#retry').onclick=()=>location.reload();
  });
  const draco = new DRACOLoader(); draco.setDecoderPath(decoderRoot.href);
  draco.setWorkerLimit(LITE?1:Math.max(2,Math.min(coarse?3:4,(navigator.hardwareConcurrency||4)-1)));
  loader = new GLTFLoader(); loader.setDRACOLoader(draco);
  loader.setMeshoptDecoder(MeshoptDecoder);
  window.addEventListener('resize',()=>{
    const portrait=camera.aspect<1;resize();
    if(ready&&!walk?.active&&portrait!==(camera.aspect<1))frame(true);
  });
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
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed',
    b.dataset.view === id || (b.dataset.view === 'building' && id.startsWith('f'))));
  $('#view-title').textContent = titles[id];
  $('#section-label').textContent = id.startsWith('f')
    ? (id==='f3'?t('cut130'):t('cut160'))
    : id === 'building' ? t('buildingSub') : id==='region'?t('regionSub'):t('neighborhoodSub');
  $('#cut-light-note').hidden = !id.startsWith('f');
  $('#region-panel').hidden=id!=='region';
  if (id==='region') {
    regionMap ??= createRegionMap($('#app'));
    if (initial) regionMap.show(); else setTimeout(()=>regionMap.show(), 180);
  } else regionMap?.hide();
  panel('',false);
  if (!ready) return;
  const target = sectionHeight(id, fullHeight);
  const earthTarget = id==='f0' ? SOIL_CUT_HEIGHT : fullHeight;
  for (const o of plantingAboveCut) o.visible = id !== 'f0';
  if (earthClip.constant !== earthTarget) {earthClip.constant = earthTarget; renderer.shadowMap.needsUpdate = true;}
  if(controls)controls.enableZoom=id!=='neighborhood';
  setAutoRotate(false);
  $('#toggle-autorotate').hidden=id!=='neighborhood';
  lighting.frame(id,contextBox);massing?.set(id);lift?.park(id);
  lighting.interior(id.startsWith('f')?Number(id[1]):null,null);
  if(roomData)renderPropertyInfo($('#property-info'),roomData,id);
  if(!initial&&(id==='region'||previous==='region'))clouds();
  if (initial) {
    clip.constant = target; transition = null;
  } else transition = {from:clip.constant, to:target, start:performance.now(),
    span:matchMedia('(pointer: coarse)').matches?520:820};
  frame(initial);
  host.dataset.view = id; host.dataset.loaded = 'true'; rememberState(); invalidate();
}
let walkData=null,tourStep=-1;
function fillRoomMenu(){
  const select=$('#walk-room');
  const value=select.value;
  select.replaceChildren();
  for(let f=0;f<4;f++){
    const group=document.createElement('optgroup');group.label=titles['f'+f];
    const floorStations=walkData.stations.filter(s=>s.floor_index===f&&s.room_id!==mergedBasement?.absorbedId);
    for(const station of floorStations){
      const room=roomData?.rooms.find(r=>r.id===station.room_id);
      const name=roomName(station.name);
      const twins=floorStations.filter(s=>s.name===station.name).length>1;
      const option=new Option(twins&&room?name+' ('+room.code+')':name,station.room_id);
      if(room)option.title=name+' \u00b7 '+room.code;
      group.append(option);
    }
    select.append(group);
  }
  if(value)select.value=value;
}
function refreshChrome(){
  applyStatic();
  $('#lang-toggle').textContent=currentLang()==='tr'?'EN':'TR';
  $('#toggle-furniture').textContent=t('furniture');
  if(walk?.active){
    const station=walk.surface.station(walk.room);
    if(station)$('#view-title').textContent=roomName(station.name);
    $('#section-label').textContent=titles['f'+walk.floor]+' \u00b7 '+t('walkSub');
    $('#gesture-help').textContent=t('walkHelp');
  } else {
    $('#view-title').textContent=titles[selected];
    $('#section-label').textContent=selected.startsWith('f')
      ?(selected==='f3'?t('cut130'):t('cut160'))
      :selected==='building'?t('buildingSub'):selected==='region'?t('regionSub'):t('neighborhoodSub');
  }
  if(walkData)fillRoomMenu();
  if(roomData)renderPropertyInfo($('#property-info'),roomData,selected);
  refreshLiftControl();
  document.querySelectorAll('.room-label strong').forEach(el=>{
    el.dataset.base??=el.textContent;el.textContent=roomName(el.dataset.base);
  });
  if(regionMap){
    const open=selected==='region';
    regionMap.element.remove();regionMap=null;
    if(open){regionMap=createRegionMap($('#app'));regionMap.show();}
  }
  hotspots?.reset();
  if(tourStep>=0)$('#tour-caption').textContent=t(TOUR[tourStep].caption);
  invalidate();
}
const TOUR=[
  {view:'f3',caption:'tourExterior'},
  {view:'f1',caption:'tourLiving'},
  {view:'f2',caption:'tourUpper'},
  {view:'f0',caption:'tourGarden'},
  {walk:/salon/i,caption:'tourInterior'},
  {view:'neighborhood',caption:'tourStreet'},
  {view:'region',caption:'tourRegion'},
];
function tourApply(){
  const stop=TOUR[tourStep];
  $('#tour-caption').textContent=t(stop.caption);
  $('#tour-prev').disabled=tourStep===0;
  $('#tour-next').textContent=tourStep===TOUR.length-1?t('tourEnd'):'\u203a';
  if(stop.walk){
    const station=walkData?.stations.find(x=>stop.walk.test(x.name))??walkData?.stations[0];
    if(station)travelRoom(station.room_id);
  } else {
    if(walk?.active)exitWalk(false);
    selectView(stop.view);
  }
}
function startTour(){if(!ready)return;tourStep=0;$('#tour-bar').hidden=false;tourApply();}
function endTour(openInfo){tourStep=-1;$('#tour-bar').hidden=true;if(openInfo)panel('info-panel',true);}
function updateLensReadout(){
  $('#walk-lens-value').textContent=`≈ ${Math.round(12/Math.tan(THREE.MathUtils.degToRad(walk.camera.fov)/2))} mm`;
}
function enterWalk(roomId) {
  pendingRoomJump.cancel();
  if (!walk || !ready) return;
  const floor=selected.startsWith('f')?Number(selected[1]):1;
  if(!roomId){
    const centre=(floorBoxes[floor]??buildingBox).getCenter(new THREE.Vector3());
    roomId=walk.surface.data.stations.filter(s=>s.floor_index===floor)
      .reduce((best,s)=>{
        const d=(s.position[0]-centre.x)**2+(s.position[2]-centre.z)**2;
        return !best||d<best.d?{d,id:s.room_id}:best;
      },null)?.id;
  }
  if(!roomId)return;
  flight.cancel();panel('',false);const station=walk.enter(roomId);selected='f'+station.floor_index;updateRoomUI(station);
  lighting.interior(station.floor_index,station.position);
  controls.enabled=false;clip.constant=fullHeight;earthClip.constant=fullHeight;transition=null;lighting.frame('building');massing?.set('building');
  lighting.setWalkInterior(true);
  lift?.setWalkActive(true);lift?.setWalkFloor(station.floor_index);refreshLiftControl();
  regionMap?.hide();
  for (const o of plantingAboveCut) o.visible = true;
  $('#app').dataset.walk='true';$('.camera-tools').hidden=true;$('#walk-tools').hidden=false;$('#enter-walk').hidden=true;
  $('#walk-room').value=station.room_id;
  $('#walk-lens').value=Math.round(walk.camera.fov);updateLensReadout();
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',
    b.dataset.view===selected||(b.dataset.view==='building'&&selected.startsWith('f'))));
  $('#gesture-help').textContent=t('walkHelp');
  resize();invalidate();
}
function exitWalk(reselect = true) {
  pendingRoomJump.cancel();
  if(!walk?.active)return;
  walk.leave();controls.enabled=true;$('#app').dataset.walk='false';
  lighting.setWalkInterior(false);
  lighting.interior(null,null);
  lift?.setWalkActive(false);lift?.cancel();refreshLiftControl();
  $('.camera-tools').hidden=false;$('#walk-tools').hidden=true;$('#enter-walk').hidden=false;
  planMode=false;$('#toggle-plan').setAttribute('aria-pressed',false);
  camera.fov=35;camera.updateProjectionMatrix();controls.enableRotate=true;$('#rotate-mode').disabled=false;
  if(reselect){selectView(selected);frame(false);}
  $('#gesture-help').textContent=t('orbitHelp');
}
async function loadModel() {
  if (loading || ready || !renderer) return;
  loading = true; host.dataset.loaded = 'false';
  progress(null);
  message(t('loadingAll'));
  const staged = new Map(), stagedClips = new Map();
  try {
    const forcedModel=new URLSearchParams(location.search).get('model');
    let response = LITE
      ? await fetch(new URL('manifest-mobile.json', modelRoot), {cache:'no-cache'}).catch(() => null)
      : forcedModel==='classic'
      ? await fetch(new URL('manifest-classic.json', modelRoot), {cache:'no-cache'}).catch(() => null)
      : null;
    if (!response?.ok) response = await fetch(new URL('manifest.json', modelRoot), {cache:'no-cache'});
    if (!response.ok) throw Error(`Manifest HTTP ${response.status}`);
    const manifest = await response.json();
    assetRevision=manifest.assets?.map(({file,sha256})=>({file,sha256}));
    const groupsInManifest=new Set((manifest.assets??[]).map(a=>a.group??a.id));
    if (!manifest.full_scene || manifest.geometry_preclipped ||
        !['villa','garden','context'].every(g=>groupsInManifest.has(g))) throw Error('Whole-scene manifest required');
    const PHASE_ORDER=['villa','garden','context'];
    const queue=manifest.assets.slice().sort((a,b)=>PHASE_ORDER.indexOf(a.group??a.id)-PHASE_ORDER.indexOf(b.group??b.id));
    let completed = 0;
    const totalBytes = manifest.assets.reduce((sum, asset) => sum + (asset.bytes || 0), 0) + (manifest.section_cap_asset?.bytes || 0);
    const received = new Map();
    const PHASE={download:.70,stage:.04,wash:.02,assemble:.02,compile:.08,caps:.02,prewarm:.10,finish:.02};
    let bootBase=0;
    const phase=(name,fraction=1)=>progress(Math.min(1,bootBase+PHASE[name]*fraction));
    const phaseDone=name=>{bootBase+=PHASE[name];progress(bootBase);};
    const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
    const reportProgress = () => {
      let done = 0; for (const value of received.values()) done += value;
      phase('download', totalBytes ? done / totalBytes : 0);
    };
    progress(0);
    async function worker(assets) {
      while (assets.length) {
        const asset = assets.shift();
        const url = new URL(asset.file, modelRoot); url.searchParams.set('v', asset.sha256.slice(0, 12));
        const gltf = await loader.loadAsync(url.href, event => {
          received.set(asset.id, Math.min(event.loaded, asset.bytes || event.loaded));
          reportProgress();
        });
        received.set(asset.id, asset.bytes || 0);
        neutraliseTransmission(gltf.scene);
        if (asset.carve_plot) gltf.scene.traverse(o=>{
          if(!o.isMesh)return;
          for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)m.userData.carvePlot=true;
        });
        if (asset.exterior_grade) applyGradeValues(gltf.scene, asset.id);
        mergeEqualMaterials(gltf.scene); abstractVehicle(gltf.scene);
        const group=asset.group??asset.id;
        staged.set(asset.id, {group, furniture:!!asset.furniture,
          scene: group==='context'?batchContext(splitContextBuildings(splitContextSoil(gltf.scene),{role:asset.context_role})):gltf.scene});
        if (gltf.animations?.length) stagedClips.set(group, gltf.animations);
        reportProgress();
        if(!ready)message(`Model yükleniyor… ${++completed}/${manifest.assets.length}`);else ++completed;
      }
    }
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
      if (!manifest.section_cap_asset) return null;
      const url = new URL(manifest.section_cap_asset.file, modelRoot);
      url.searchParams.set('v', manifest.section_cap_asset.sha256.slice(0, 12));
      try {
        const gltf = await loader.loadAsync(url.href, event => {
          received.set('section-caps', Math.min(event.loaded, manifest.section_cap_asset.bytes || event.loaded));
          reportProgress();
        });
        received.set('section-caps', manifest.section_cap_asset.bytes || 0); reportProgress();
        neutraliseTransmission(gltf.scene);
        return gltf.scene;
      } catch (error) {console.warn('Section caps unavailable', error); return null;}
    }
    async function loadNavigation() {
      const url=new URL(manifest.navigation?.file ?? 'navigation.json',modelRoot);
      if(manifest.navigation?.sha256)url.searchParams.set('v',manifest.navigation.sha256.slice(0,12));
      const response=await fetch(url);if(!response.ok)throw Error(`Navigation HTTP ${response.status}`);
      const data=await response.json();
      if(manifest.native_delivery){
        if(data.source_native_sha256!==manifest.source_native_sha256)throw Error('Navigation/native model revision mismatch');
      }else{
        if(data.source_architecture_sha256!==manifest.library_hashes['build/blender/layers/10-architecture.blend'])throw Error('Navigation/architecture revision mismatch');
        if(data.source_furniture_sha256!==manifest.library_hashes['build/blender/layers/30-furniture-placeholders.blend'])throw Error('Navigation/furniture revision mismatch');
        if(data.source_fittings_sha256!==manifest.library_hashes['build/blender/layers/20-fixed-fittings.blend'])throw Error('Navigation/fittings revision mismatch');
      }
      return data;
    }
    function stageGroup(id, group) {
      groups.set(id, group); scene.add(group);
      group.updateMatrixWorld(true);
      group.traverse(o => {
        if (!o.isMesh) return;
        o.renderOrder = 5;
        const building=id!=='context'&&id!=='garden';
        const planting=id==='garden'&&PLANTING.test(authoredNodeName(o.name));
        if(planting)plantingCandidates.push(o);
        const materials=Array.isArray(o.material)?o.material:[o.material];
        const planes=planting?[]:building||id==='garden'?[clip]
          :materials.some(m=>m?.userData.plotSoil)?[earthClip]
          :materials.some(m=>m?.userData.carvePlot)?plotCarvePlanes:[];
        lighting.prepareMesh(o,{clipped:planes[0]===clip,context:!building});
        if(id==='context')o.userData.aoExcluded=true;
        o.userData.clipPlanes=planes;
        if (planes.length) for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          m.clippingPlanes = planes; m.side = THREE.DoubleSide;
          m.clipIntersection = planes === plotCarvePlanes;
        }
      });
    }
    const wantsGrade = manifest.assets.some(a => a.exterior_grade);
    const results = await Promise.allSettled([worker(queue), LITE?Promise.resolve():worker(queue), loadSections(), loadRooms(), loadNavigation(),
      lighting.loadEnvironment(daylightURL.href).catch(error=>console.warn('HDR unavailable; atmospheric daylight retained',error)), loadCaps(),
      wantsGrade ? loadGradeTextures(new URL(pages ? 'assets/textures/' : 'textures/', publicRoot)) : Promise.resolve(null)]);
    const failure = results.slice(0, 7).find(r => r.status === 'rejected'); if (failure) throw failure.reason;
    phaseDone('download');
    if (results[7].status === 'rejected') console.warn('Exterior detail maps unavailable', results[7].reason);
    bindGradeTextures([...staged.values()], results[7].status === 'fulfilled' ? results[7].value : null);
    const mergedGroups=new Map();
    const furnitureLift=new THREE.Color('#ffffff');
    for (const {group, furniture, scene: part} of staged.values()) {
      if (furniture) part.traverse(o=>{
        if(!o.isMesh)return;
        o.userData.category='furniture';
        for(const m of Array.isArray(o.material)?o.material:[o.material]){
          if(!m||m.userData.furnitureSoftened||/chrome|mirror|glass|brass|stainless/i.test(m.name))continue;
          m.userData.furnitureSoftened=true;
          m.color?.lerp(furnitureLift,.18);
          if(m.roughness!==undefined)m.roughness=Math.max(m.roughness,.45);
        }
      });
      if (!mergedGroups.has(group)) {const g=new THREE.Group(); g.name=group; mergedGroups.set(group,g);}
      mergedGroups.get(group).add(part);
    }
    {
      let stagedCount=0;
      for (const [id, group] of mergedGroups) {stageGroup(id, group); phase('stage', ++stagedCount/mergedGroups.size); await tick();}
      phaseDone('stage');
    }
    loader.dracoLoader?.dispose();
    {
      const soilMeshes=[];let carvePresent=false;
      groups.get('context')?.traverse(o=>{
        if(!o.isMesh)return;
        const materials=Array.isArray(o.material)?o.material:[o.material];
        if(materials.some(m=>m?.userData.plotSoil))soilMeshes.push(o);
        if(materials.some(m=>m?.userData.carvePlot))carvePresent=true;
      });
      plotCutReady=soilMeshes.length>0||carvePresent;
      const ray=new THREE.Raycaster();ray.far=80;
      const down=new THREE.Vector3(0,-1,0),box=new THREE.Box3(),centre=new THREE.Vector3();
      for(const o of plantingCandidates){
        box.setFromObject(o).getCenter(centre);
        ray.set(new THREE.Vector3(centre.x,60,centre.z),down);
        const hit=soilMeshes.length?ray.intersectObjects(soilMeshes,false)[0]:null;
        const ground=hit?hit.point.y:box.min.y;
        if(ground>SOIL_CUT_HEIGHT-0.15)plantingAboveCut.push(o);
      }
      plantingCandidates.length=0;
    }
    {
      planWash=new THREE.Group();planWash.name='Plan paper wash';planWash.visible=false;
      planWash.userData={level:0,overlays:[]};
      const planeIds=new Map(),variants=new Map();
      const idOf=plane=>{if(!planeIds.has(plane))planeIds.set(plane,planeIds.size);return planeIds.get(plane);};
      const washFor=(planes,intersection,base)=>{
        const key=`${base}|${intersection?'i':'u'}|${(planes??[]).map(idOf).join(',')}`;
        if(!variants.has(key)){
          const shared={clippingPlanes:planes??null,clipIntersection:intersection,side:THREE.DoubleSide,transparent:true};
          const pre=new THREE.MeshBasicMaterial({colorWrite:false,...shared});
          const over=new THREE.MeshBasicMaterial({color:0xffffff,opacity:0,
            depthWrite:false,depthFunc:THREE.EqualDepth,...shared});
          over.userData.washBase=base;
          planWash.userData.overlays.push(over);
          variants.set(key,[pre,over]);
        }
        return variants.get(key);
      };
      const washGroup=(group,base)=>{
        if(!group)return;
        group.updateMatrixWorld(true);
        group.traverse(o=>{
          if(!o.isMesh)return;
          const source=Array.isArray(o.material)?o.material[0]:o.material;
          const [pre,over]=washFor(source?.clippingPlanes??null,source?.clipIntersection??false,base);
          for(const [material,order] of [[pre,7],[over,8]]){
            const g=new THREE.Mesh(o.geometry,material);
            g.matrixAutoUpdate=false;g.matrix.copy(o.matrixWorld);
            g.renderOrder=order;g.userData.aoExcluded=true;g.castShadow=false;g.receiveShadow=false;
            planWash.add(g);
          }
        });
      };
      washGroup(groups.get('villa'),0.30);
      washGroup(groups.get('garden'),0.80);
      washGroup(groups.get('context'),0.80);
      scene.add(planWash);
    }
    phaseDone('wash'); await tick();
    {
      const proxyMaterial=new THREE.MeshBasicMaterial();
      const shadowProxy=new THREE.Group();shadowProxy.name='Whole-building shadow proxy';
      groups.get('villa').traverse(o=>{
        if(!o.isMesh||!o.castShadow||o.userData?.category==='furniture')return;
        const g=new THREE.Mesh(o.geometry,proxyMaterial);
        g.matrixAutoUpdate=false;g.matrix.copy(o.matrixWorld);
        g.castShadow=true;g.receiveShadow=false;g.layers.set(1);g.userData.aoExcluded=true;
        shadowProxy.add(g);
      });
      scene.add(shadowProxy);
    }
    buildingBox = new THREE.Box3().setFromObject(groups.get('villa'));
    stencilCaps=createStencilCaps(groups.get('villa'),clip,buildingBox);
    scene.add(stencilCaps.group);
    interiorPoche=createInteriorPoche(groups.get('villa'),clip);
    scene.add(interiorPoche.group);
    {
      const datums=[0,3.0996,6.3714,9.4705,1e9];
      floorBoxes=datums.slice(0,4).map(()=>new THREE.Box3());
      const p=new THREE.Vector3();
      groups.get('villa').traverse(o=>{
        if(!o.isMesh)return;
        const position=o.geometry.attributes.position;
        for(let i=0;i<position.count;i++){
          p.fromBufferAttribute(position,i).applyMatrix4(o.matrixWorld);
          const band=p.y<datums[1]?0:p.y<datums[2]?1:p.y<datums[3]?2:3;
          floorBoxes[band].expandByPoint(p);
        }
      });
      for(const [i,b] of floorBoxes.entries())if(b.isEmpty())floorBoxes[i]=null;
    }
    gardenBox = new THREE.Box3(new THREE.Vector3(-10.2, -4, -29.1), new THREE.Vector3(12.5, 3.4, 11));
    contextBox=buildingBox.clone();
    try {
      const contextResponse=await fetch(new URL('../site-context.json',modelRoot),{cache:'no-cache'});
      if(!contextResponse.ok)throw Error('Context labels unavailable');
      const contextData=await contextResponse.json();
      const settlementBox=new THREE.Box3();
      for(const b of contextData.buildings)if(b.bounds)for(const p of b.bounds)settlementBox.expandByPoint(new THREE.Vector3(...p));
      if(!settlementBox.isEmpty())contextBox=settlementBox.union(buildingBox);
      siteContext=createSiteContext(contextData,host,()=>selectView('f3'));
      $('#context-count').textContent=`${contextData.buildings.length} ${t('buildingsWord')} · ${atlasMeta()}`;
    } catch(error){console.warn(error);$('#context-count').textContent=atlasMeta();}
    if(groups.has('context')){
      contextBox.union(new THREE.Box3().setFromObject(groups.get('context')));
      prepareContextSurfaces(groups.get('context'),lighting.horizonColour);
      massing=createContextMassing(groups.get('context'),PLOT_RECT);
    }
    fullHeight = buildingBox.max.y + 2;
    caps = createWallCaps(results[2].value); scene.add(caps.group);
    const capScene=results[6].status==='fulfilled'?results[6].value:null;
    if (capScene) {soilCap = createSoilCap(capScene); if (soilCap) scene.add(soilCap.group);}
    roomData=results[3].value;
    {
      const rooms=roomData.rooms??[];
      const pair=['bahçe salonu','oda'].map(wanted=>rooms.find(r=>r.floor_index===0&&r.name.toLocaleLowerCase('tr')===wanted));
      if(pair[0]&&pair[1]){
        const [keeper,absorbed]=pair;
        const areaOf=r=>ROOM_AREAS[r.id]??(Number.isFinite(r.area_m2)?r.area_m2:0);
        ROOM_AREAS[keeper.id]=Math.round((areaOf(keeper)+areaOf(absorbed))*100)/100;
        keeper.name='Salon';
        mergedBasement={keeperId:keeper.id,absorbedId:absorbed.id};
        roomData.rooms=rooms.filter(r=>r!==absorbed);
        for(const dim of roomData.dimensions??[])if(dim.room_id===absorbed.id)dim.room_id=keeper.id;
        for(const s of results[4].value.stations??[])
          if(s.room_id===keeper.id||s.room_id===absorbed.id)s.name='Salon';
      }
      const water=new THREE.Box3();let hasWater=false;
      groups.get('garden')?.traverse(o=>{
        if(o.isMesh&&(Array.isArray(o.material)?o.material:[o.material]).some(m=>/^water$/i.test(m?.name??'')))
          {water.expandByObject(o);hasWater=true;}
      });
      const dims=roomData.dimensions??(roomData.dimensions=[]);
      const outdoor=(id,name,box,y)=>{
        const c=box.getCenter(new THREE.Vector3());
        roomData.rooms.push({id,name,floor_index:0,position:[c.x,y,c.z],label_only:true});
        dims.push(
          {id:id+'-x',room_id:id,floor_index:0,basis:'model_measured',dimension_label_allowed:false,
           metres:box.max.x-box.min.x,a:[box.min.x,y,c.z],b:[box.max.x,y,c.z]},
          {id:id+'-z',room_id:id,floor_index:0,basis:'model_measured',dimension_label_allowed:false,
           metres:box.max.z-box.min.z,a:[c.x,y,box.min.z],b:[c.x,y,box.max.z]});
      };
      if(hasWater)outdoor('f0-out-pool','Havuz',water,water.max.y+.25);
      const garden=new THREE.Box3(
        new THREE.Vector3(PLOT_RECT.minX+.4,-1,PLOT_RECT.minZ+.4),
        new THREE.Vector3(PLOT_RECT.maxX-.4,3,buildingBox.min.z-.4));
      if(garden.max.z>garden.min.z+2)outdoor('f0-out-garden','Bahçe',garden,.6);
    }
    annotations=createAnnotations(roomData,host,enterWalk);scene.add(annotations.group);
    walk = new InteriorWalk(results[4].value,renderer.domElement,invalidate);scene.add(walk.rig);
    locator=createWalkLocator(walk.surface,{minX:buildingBox.min.x+1,maxX:buildingBox.max.x-1,
      minZ:buildingBox.min.z+1,maxZ:buildingBox.max.z-1});
    {
      const nav=results[4].value;
      for(const s of nav.stations){
        if(/balkon|teras|bahçe(?!\s*salonu)|merdiven/i.test(s.name))continue;
        const [sx,sy,sz]=s.position;
        const lit=nav.lights.some(l=>Math.abs(l.position[1]-sy)<2.6&&Math.hypot(l.position[0]-sx,l.position[2]-sz)<2.8);
        if(!lit)nav.lights.push({name:`Synthesized ceiling light (${s.room_id})`,
          position:[sx,sy+1.15,sz],direction:[0,-1,0],floor_index:s.floor_index,
          color:[1,.93,.85],intensity_cd:80,
          intensity_status:'render_assumption_not_measured_electrical_power',
          source:'viewer_synthesized_for_lightless_room'});
      }
    }
    lighting.setFixtures(results[4].value.lights);hotspots=createHotspots(host,walk,travelRoom);
    lift=createLift({groups,clips:stagedClips.get('villa')??[],clipPlane:clip,fullHeight,
      shadowsDirty:()=>{renderer.shadowMap.needsUpdate=true;},onSettled:()=>refreshLiftControl()});
    refreshLiftControl();
    walkData=results[4].value;
    fillRoomMenu();
    phaseDone('assemble'); await tick();
    message('Görünüm hazırlanıyor…');
    try {
      if (renderer.compileAsync) {
        await Promise.race([renderer.compileAsync(scene, camera),
          new Promise(resolve => setTimeout(resolve, 8000))]);
      } else renderer.compile(scene, camera);
    } catch (error) {console.warn('Shader pre-compile unavailable; first view will compile on demand', error);}
    phaseDone('compile');
    ready = true;
    $('#toggle-furniture').disabled = false; setFurnitureVisible(furnitureVisible);
    $('#toggle-rooms').disabled = false; $('#toggle-measurements').disabled = false;
    $('#enter-walk').disabled=false;
    document.querySelectorAll('[data-needs-model]').forEach(b=>b.disabled=false);
    enableImmersiveWalk(renderer,scene,walk,groups,()=>{if(!walk.active)enterWalk();},()=>{resize();invalidate();});
    for (const view of ['f0','f1','f2','f3']) caps.update(sectionHeight(view, fullHeight), true);
    phaseDone('caps');
    message(t('preparing'));
    await new Promise(resolve=>setTimeout(resolve,0));
    const culled=[];
    scene.traverse(o=>{if(o.isMesh&&o.frustumCulled){o.frustumCulled=false;culled.push(o);}});
    const WARM=['building','f3','f2','f1','f0'];
    for (const id of WARM) {
      clip.constant=sectionHeight(id,fullHeight);
      earthClip.constant=id==='f0'?SOIL_CUT_HEIGHT:fullHeight;
      caps?.update(clip.constant,clip.constant<fullHeight-0.001);
      soilCap?.update(earthClip.constant,earthClip.constant<fullHeight-0.001&&plotCutReady);
      lighting.frame(id,contextBox);massing?.set(id);
      lighting.interior(id.startsWith('f')?Number(id[1]):null,null);
      lighting.update(performance.now()+60000);
      if(planWash&&id==='f1'){planWash.visible=true;for(const over of planWash.userData.overlays)over.opacity=over.userData.washBase;}
      renderer.shadowMap.needsUpdate=true;
      lighting.render(camera);
      if(planWash&&id==='f1'){planWash.visible=false;for(const over of planWash.userData.overlays)over.opacity=0;}
      phase('prewarm',(WARM.indexOf(id)+1)/WARM.length);
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    phaseDone('prewarm');
    for(const o of culled)o.frustumCulled=true;
    scene.traverse(o=>{if(o.isDirectionalLight&&o.shadow)o.shadow.camera.layers.enable(1);});
    renderer.shadowMap.needsUpdate=true;
    selectView(selected, true);
    lighting.render(camera);
    phaseDone('finish');
    status.hidden = true;
    const boot=$('#boot');
    if(boot){
      $('#app').append($('#load-status'));
      boot.classList.add('boot-done');
      setTimeout(()=>boot.remove(),720);
    }
    delete $('#app').dataset.booting;
    let welcomeSeen=false;
    try{welcomeSeen=sessionStorage.getItem('angora-welcome')==='1';}catch{}
    if(!openedWithView&&!welcomeSeen)$('#welcome').hidden=false;
  } catch (error) {
    for (const group of staged.values()) {scene.remove(group); dispose(group);}
    groups.clear();
    message(t('loadFailed'), true);$('#no3d').hidden=false;
    console.error('Model load failed', error);
  } finally {loading = false;}
}
function zoom(factor){
  if(!ready)return;
  camera.zoom=THREE.MathUtils.clamp(camera.zoom*factor,controls.minZoom,controls.maxZoom);
  camera.updateProjectionMatrix();invalidate();
}
function setPlanMode(on){
  planMode=on;$('#toggle-plan').setAttribute('aria-pressed',on);
  controls.enableRotate=!on;
  $('#rotate-mode').disabled=on;
  mode(on);
  frame(false);
}
function mode(pan) {
  controls.touches.ONE = pan ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
  controls.mouseButtons.LEFT = pan ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
  $('#rotate-mode').setAttribute('aria-pressed', !pan); $('#pan-mode').setAttribute('aria-pressed', pan);
  $('#gesture-help').textContent = t(pan?'panHelp':'orbitHelp');
}
function setAutoRotate(on){
  if(!controls)return;
  controls.autoRotate=on&&selected==='neighborhood';
  controls.autoRotateSpeed=.55;
  $('#toggle-autorotate')?.setAttribute('aria-pressed',String(controls.autoRotate));
  if(controls.autoRotate)invalidate();
}
function bindInterface() {
  const shared = readShareState(location.search);
  if (shared.view) selected = shared.view;
  if (shared.hour !== undefined) $('#daylight-hour').value = shared.hour;
  if (shared.season) $('#daylight-season').value = shared.season;
  if (shared.style) $('#lighting-style').value = shared.style;
  for(const id of ['toggle-plan','reset-view','rotate-mode','pan-mode','zoom-in','zoom-out']){
    const button=$('#'+id);button.dataset.needsModel='';button.disabled=true;
  }
  document.querySelectorAll('[data-view]').forEach(b => {
    b.dataset.needsModel='';b.disabled=true;
    b.addEventListener('click', () => selectView(b.dataset.view==='building'?'f3':b.dataset.view));
  });
  $('#rotate-mode').onclick = () => mode(false); $('#pan-mode').onclick = () => mode(true);
  $('#zoom-in').onclick=()=>zoom(1.3);
  $('#zoom-out').onclick=()=>zoom(1/1.3);
  $('#reset-view').onclick=()=>setPlanMode(false); $('#retry').onclick = loadModel;
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
  $('#toggle-plan').onclick=()=>setPlanMode(!planMode);
  $('#open-options').onclick=()=>panel('options-panel',$('#options-panel').hidden);
  $('#open-info').onclick=()=>panel('info-panel',$('#info-panel').hidden);
  document.querySelectorAll('[data-close-panel]').forEach(button=>button.onclick=()=>panel('',false));
  $('#daylight-hour').oninput=()=>{const hour=Number($('#daylight-hour').value);$('#daylight-time').textContent=clockLabel(hour);$('#daylight-hour').setAttribute('aria-valuetext',clockLabel(hour));lighting?.setTime(hour,Number($('#daylight-season').value));rememberState();invalidate();};
  $('#daylight-season').onchange=()=>$('#daylight-hour').oninput();
  $('#toggle-lights').onclick=()=>{interiorLights=!interiorLights;$('#toggle-lights').setAttribute('aria-pressed',interiorLights);lighting?.setLights(interiorLights);invalidate();};
  $('#lighting-style').onchange=e=>{lighting?.setStyle(e.target.value);rememberState();invalidate();};
  $('#return-villa').onclick=()=>selectView('f3');
  applyStatic();
  $('#lang-toggle').textContent=currentLang()==='tr'?'EN':'TR';
  $('#lang-toggle').onclick=()=>setLang(currentLang()==='tr'?'en':'tr',refreshChrome);
  const dismissWelcome=()=>{$('#welcome').hidden=true;try{sessionStorage.setItem('angora-welcome','1');}catch{}};
  $('#welcome-close').onclick=dismissWelcome;
  $('#welcome-explore').onclick=()=>{dismissWelcome();if(ready)selectView('f1');};
  $('#welcome-tour').onclick=()=>{dismissWelcome();startTour();};
  $('#tour-exit').onclick=()=>endTour(false);
  $('#tour-prev').onclick=()=>{if(tourStep>0){tourStep--;tourApply();}};
  $('#tour-next').onclick=()=>{if(tourStep<TOUR.length-1){tourStep++;tourApply();}else endTour(true);};
  host.addEventListener('pointerdown',()=>{if(tourStep>=0)endTour(false);},{capture:true});
  $('#toggle-autorotate').onclick=()=>setAutoRotate(!controls?.autoRotate);
  host.addEventListener('pointermove',()=>{if(controls?.autoRotate)setAutoRotate(false);},{passive:true});
  $('#walk-lens').oninput=e=>{
    if(!walk)return;
    walk.setLens(Number(e.target.value));
    updateLensReadout();invalidate();
  };
  document.querySelectorAll('.region-radius button').forEach(b=>b.onclick=()=>{
    regionMap ??= createRegionMap($('#app'));
    regionMap.setRadius(Number(b.dataset.radius));
    document.querySelectorAll('.region-radius button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  });
  window.addEventListener('keydown',event=>handleEscape(event,{
    panelOpen:Boolean(document.querySelector('.panel:not([hidden])')),closePanel:()=>panel('',false),
    walkActive:walk?.active,immersive:renderer?.xr.isPresenting,exitWalk
  }));
  document.querySelectorAll('.panel').forEach(sheet=>sheet.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const items=[...sheet.querySelectorAll('button:not(:disabled),a[href],input,select,summary')].filter(el=>el.getClientRects().length>0);
    const first=items[0],last=items.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }));
}
bindInterface();
createInterfaceSound({button:$('#toggle-sound')});
try {
  setup();
  loadModel();
} catch (error) {
  message('3D görünüm başlatılamadı. Güncel Safari veya Chrome ile tekrar açabilirsin.', true);
  $('#retry').onclick = () => location.reload(); console.error(error);
  $('#app').dataset.renderError='true';
  fetch(new URL('rooms.json',modelRoot),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Property info unavailable');return r.json();})
    .then(data=>{roomData=data;renderPropertyInfo($('#property-info'),data,'building');}).catch(console.warn);
}
