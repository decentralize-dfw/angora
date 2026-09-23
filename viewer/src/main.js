import {loadRoomReflections,createLazyRoomReflections} from './room-reflections.js';
import {createElectricLighting} from './electric-light.js';
import './style.css';
import './interface-quality.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import {invalidateUIObstacles} from './screen-layout.js';
import {createPlotMaterialMask} from './plot-material-mask.js';
import {createNativeDelivery} from './native-delivery.js';
import {createGroundLight} from './ground-light.js';
import {gunzipSync} from 'three/addons/libs/fflate.module.js';
import {waitForGPU} from './render-readiness.js';
import {assetLoadBudget,createLoadQueue} from './asset-loading.js';
import {createTextureLoader} from './texture-loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { createLighting, probeMassingFrom } from './lighting.js';
import { createAnnotations } from './annotations.js';
import { InteriorWalk, enableImmersiveWalk } from './walk.js';
import {CameraFlight} from './camera-flight.js';
import {frameInsets} from './frame-insets.js';
import {clockLabel} from './daylight.js';
import {createHotspots} from './hotspots.js';
import {createSpotlight} from './tour-spotlight.js';
import {TOUR_DURATION,tourLang} from './tour-meta.js';
import {roomBox,clampToFloor} from './tour-rooms.js';
import {renderPropertyInfo,renderFloorInfo} from './property-info.js';
import {areaLabel} from './annotations.js';
import { configureCameraControls } from './camera.js';
import { PendingAction } from './pending-action.js';
import {fitContextBounds,neutraliseTransmission} from './material-response.js';
import {applyGradeValues,loadGradeTextures,bindGradeTextures,reviveBatchedGrade} from './exterior-grade.js';
import {reviveBakedOcclusion} from './ao-revival.js';
import {upgradeAtlasToArrays} from './atlas-array.js';
import {bakeContactOcclusion} from './vertex-ao.js';
import {createSiteContext} from './site-context.js';
import {renderPixelRatio,fitDepthRange} from './render-quality.js';
import {rigFovFor} from './camera-rigs.js';
import {prepareContextSurfaces} from './context-surfaces.js';
import {batchContext} from './context-batch.js';
import {mergeEqualMaterials,abstractVehicle,splitContextSoil,splitContextBuildings,createContextMassing,authoredNodeName} from './context-massing.js';
// Trees, hedges and beds, by the names the delivery gives them.
const PLANTING=/spruce|needle|foliage|hedge|leaves|leaf|shrub|tree|branch|trunk|planting/i;
import {createLift,SHAFT} from './lift.js';
import {handleEscape} from './interface-actions.js';
import {createInterfaceSound} from './interface-sound.js';
import {createDeviceQA} from './device-qa.js';
import {readShareState,shareSearch} from './share-state.js';
import {referenceProfile} from './render-profile.js';
import {FEATURES} from './features.js';
import {createQualityProfile,detectTierFromEnvironment} from './quality-profile.js';
import { sectionHeight, smoothStep, createWallCaps, createSoilCap, createNativeSoilSection, SOIL_CUT_HEIGHT } from './section.js';
import { createWalkLocator } from './walk-locator.js';
import { t, roomName, applyStatic, setLang, currentLang } from './i18n.js';

const $ = s => document.querySelector(s);
const host = $('#viewport'), status = $('#load-status');
const publicRoot = new URL(import.meta.env.BASE_URL, document.baseURI);
const pages = import.meta.env.MODE === 'pages';
const requestedProfile=new URLSearchParams(location.search).get('profile');
const deliveryProfile=['desktop','mobile'].includes(requestedProfile)?requestedProfile:matchMedia('(pointer: coarse)').matches?'mobile':'desktop';
const modelRoot = new URL(import.meta.env.VITE_MODEL_ROOT || (pages ? 'build/web/batched/' : 'models/batched/')+deliveryProfile+'/', publicRoot);
const decoderRoot = new URL(pages ? 'viewer/public/draco/' : 'draco/', publicRoot);
const daylightURL = new URL((pages ? 'assets/lighting/' : 'lighting/')+'kloofendal_48d_partly_cloudy_puresky_1k.hdr',publicRoot);
// The owner's photographs live beside the model, not inside the bundle:
// fifty-five frames are a folder, and only the one that is opened is ever
// fetched. prepare-native.mjs stages the same folder for the dev server.
const photoRoot = new URL('photogallery/', publicRoot);
// The voiceover is served the same way - a file beside the model, fetched
// only when someone actually starts the narrated tour.
const audioRoot = new URL('audio/', publicRoot);
// The gallery's own 400 px versions of the listing photographs, made by
// tools/make-photo-thumbs.py from the same originals the viewer opens.
const thumbRoot = new URL('photogallery/thumbs/', publicRoot);
// Titles read through the language of the moment; every titles[x] call
// site stays untouched while the words follow the toggle.
const titles = new Proxy({}, {get: (_, key) => t(key)});
const groups = new Map();
const pendingRoomJump = new PendingAction();
// One device decision for everything: which manifest, how many download
// workers, how many draco decoders. Phones die on memory PEAKS, not totals -
// a warm cache hands all three files over at once and three parallel draco
// heaps finish WebKit off - so lite mode also serialises the pipeline.
const LITE = (() => {
  const forced = new URLSearchParams(location.search).get('model');
  if (forced === 'lite') return true;
  if (forced === 'full') return false;
  return (matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 820)
    || (navigator.deviceMemory !== undefined && navigator.deviceMemory <= 4);
})();
let regionMap = null;   // built on first Bölge visit; a map layer, not a scene
// Planting rooted above the basement's soil cut: the front-garden trees and
// hedges stand on ground the f0 section removes, so drawing them over the
// excavation hatch reads as trees growing out of the drawing. Judged by the
// SOIL under each plant, not the plant's own base - tree trunks are modelled
// sunk below grade, so a base test lets them keep floating over the hatch.
const plantingCandidates = [], plantingAboveCut = [];
const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 30);
// The earth cannot follow the sweeping building cut: its authored cap exists
// at exactly one height, so this plane snaps between "whole" and "basement
// cut open" instead of lerping and leaving the excavation uncapped mid-flight.
const earthClip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 30);
// The classic delivery carried a closed plot-soil solid the basement plane
// could cut. The optimised set ships the plot's lawn and walls as spans of the
// settlement-wide skins instead - no solid to cut, and a single infinite plane
// on those skins would behead the whole neighbourhood's ground. So the skins
// the manifest flags carve_plot are carved with an INTERSECTION of five
// planes: inside the plot rectangle AND above the earth plane, which is
// exactly the excavation and nothing beyond the boundary. The rectangle is
// the classic 'R32 | Continuous local soil volume' extent, measured from the
// stamped native scene.
const PLOT_RECT = {minX: -11.2, maxX: 11.5, minZ: -24.0, maxZ: 11.06};
const plotCarvePlanes = [earthClip,
  new THREE.Plane(new THREE.Vector3(-1, 0, 0), PLOT_RECT.minX),
  new THREE.Plane(new THREE.Vector3(1, 0, 0), -PLOT_RECT.maxX),
  new THREE.Plane(new THREE.Vector3(0, 0, -1), PLOT_RECT.minZ),
  new THREE.Plane(new THREE.Vector3(0, 0, 1), -PLOT_RECT.maxZ)];
// Whether the staged context can actually open the excavation - the classic
// soil solid or carve-flagged skins. The authored hatch face only shows over
// a real cut; over unbroken earth it would float.
let plotCutReady = false;
// Plan mode's paper wash (surroundings 80 % white, interior 30 %) - built
// once from the staged groups, faded by planMode alone. The 3D views never
// see it.
let planWash = null;
let flight, hotspots, planMode=false, roomData, interiorLights=true, soilCap=null;
let scene, camera, renderer, controls, loader, loadAsset, caps, buildingBox, gardenBox, contextBox, lighting, siteContext, quality;
let nativeDelivery=null,nativeSwitching=false,nativeAtlas=null,nativeSoil=null,plotMask=null;
// The opening view is the street, not the house: a visitor should see where
// Angora 21 sits before they see what it is. share-state.js has always called
// this the default - a link carries no view parameter for it - and this is the
// line that used to disagree with it.
let selected = 'neighborhood', ready = false, loading = false;
let furnitureVisible = true, roomNamesVisible = true, measurementsVisible = false, annotations, walk;
let photosVisible = false, photoPins = null, photoViewer = null;let photoPoints=null;
let frameSpan = 40, framePending = false, fullHeight = 30, transition = null;
let deviceQA,assetRevision=null,pendingCapture=null,contextLost=false,massing=null,lift=null,interfaceSound=null;
// Live location during the tour: the interface names where the feet ARE,
// with a short dwell so a doorway crossing cannot flicker the title.
let locator=null,locationKey='',locationPendingKey='',locationPendingSince=0;
// Whether THIS ENTRY carried a view deep link - read once, before
// rememberState() starts rewriting the address bar with the current view.
const openedWithView=new URLSearchParams(location.search).has('view');

function message(text, error = false) {
  status.hidden = false; $('#load-message').textContent = text;
  $('#retry').hidden = !error; status.classList.toggle('error', error);
}
// The scene is about 27 MB in three files, so a chunk count alone leaves long
// silences mid-download. The share is shown visually and is deliberately kept
// out of the live region, which would otherwise read out every update.
function progress(share) {
  const bar = $('#load-bar'), percent = $('#load-percent');
  if (share === null) { bar.hidden = true; percent.textContent = ''; return; }
  const whole = Math.max(0, Math.min(100, Math.round(share * 100)));
  bar.hidden = false; bar.firstElementChild.style.width = `${whole}%`;
  percent.textContent = `%${whole}`;
}
// What the bar cannot say: WHICH wait is being served. A percentage alone,
// on a twenty-megabyte scene, reads as one long undifferentiated stall; the
// named steps turn it into a sequence with an end in sight. Each lights as it
// starts and stays lit, and step(null) marks them all done.
const LOAD_STEPS=['model','light','scene','view'];
function step(name) {
  const list=$('#load-steps'); if(!list) return;
  const index=LOAD_STEPS.indexOf(name);
  for(const el of list.children){
    const at=LOAD_STEPS.indexOf(el.dataset.step);
    el.dataset.state=name===null?'done':at<index?'done':at===index?'active':'idle';
  }
}
// Dragging the daylight slider fires continuously, and Safari rate-limits
// history writes, so the address is rewritten once the controls settle.
let shareTimer = null;
function rememberState() {
  clearTimeout(shareTimer);
  shareTimer = setTimeout(() => {
    const search = shareSearch({view:selected, hour:Number($('#daylight-hour').value),
      season:$('#daylight-season').value, style:$('#lighting-style').value,profile:requestedProfile});
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
    const cpuStart=performance.now(),measuredTransition=transition;
    framePending = false;
    idleRefining=false;clearTimeout(idleRefineTimer);
    if(contextLost)return;
    if (transition) {
      transition.frames=(transition.frames??0)+1;
      transition.maxFrameGap=Math.max(transition.maxFrameGap??0,time-(transition.last??transition.start));
      transition.elapsed=Math.max(0,time-transition.start);
      transition.last=time;
      const t = Math.min(1, transition.elapsed / transition.span);
      clip.constant = THREE.MathUtils.lerp(transition.from, transition.to, smoothStep(t));
      // Re-rendering every shadow map on every frame of the cut was why changing
      // floor crawled: a 4096 sun map plus the fixtures, sixty times a second,
      // for a whole second. They only have to be right once the cut settles.
      if (t >= 1) {transition = null; renderer.shadowMap.needsUpdate = true;}
    }
    const flying=flight?.update(time);
    if(planWash){
      const target=planMode&&!walk?.active?1:0;
      // dt caps at 0.25 s so even a slow renderer settles the wash in a
      // handful of frames instead of a dozen
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
    const earthSectionActive=/^f[0-3]$/.test(selected)&&!walk?.active&&clip.constant<fullHeight-.001;
    plotMask?.setSoilCut(earthSectionActive?clip.constant:1e6);
    nativeSoil?.userData.update(clip.constant,earthSectionActive);
    soilCap?.update(earthClip.constant, earthClip.constant < fullHeight - 0.001 && plotCutReady);
    if(tourSweep&&!flying&&!walk?.active)advanceTourSweep(time);
    const changing=walk?.active?walk.update(time,renderer.xr.getSession()):flying?false:controls.update();
    const activeCamera=walk?.active?walk.camera:camera;
    if(!walk?.active)fitDepthRange(camera,controls.target,contextBox);
    if(walk?.active){
      const sample=walk.surface.sample(walk.camera.position.x,walk.camera.position.z,walk.camera.position.y-walk.surface.data.eye_height_m,walk.furniture,.3);
      if(sample&&walk.floor!==sample.floor){
        walk.floor=sample.floor;selected='f'+sample.floor;lift?.setWalkFloor(sample.floor);refreshLiftControl();
        $('#section-label').textContent=titles[selected]+' · '+t('walkSub');
        refreshSheets(selected);
      }
      else if(sample){walk.floor=sample.floor;selected='f'+sample.floor;}
      // The title names where the visitor actually stands - room, stairs,
      // garden - and only settles after a short dwell so a doorway cannot
      // flicker it. The room menu stays a go-to control, but it follows the
      // feet too, so "where am I" and "where can I go" read from one place.
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
    photoPins?.update(selected,photosVisible,Boolean(transition||flight?.active),walk?.active,activeCamera);
    annotations?.update(selected,roomNamesVisible,measurementsVisible,Boolean(transition||flight?.active),walk?.active,activeCamera,walk?.room,photoPins?.obstacles()??[]);
    hotspots?.update(activeCamera,walk?.active&&!walk.xrActive&&!walk.route);
    // The tour's shade eases in and out rather than cutting, and once it is
    // down it is re-laid every frame: the hole has to follow the room while
    // the camera flies to it.
    if(spotlight){
      const dt=Math.min(.25,(time-(tourShadeTime??time))/1000);tourShadeTime=time;
      const next=Math.abs(tourShadeTarget-tourShade)<.004?tourShadeTarget:THREE.MathUtils.damp(tourShade,tourShadeTarget,5,dt);
      if(next!==tourShade){tourShade=next;spotlight.setLevel(tourShade);invalidate();}
      if(tourShade>.01&&spotlight.update(activeCamera,host.clientWidth,host.clientHeight))invalidate();
    }
    siteContext?.update(selected,activeCamera,controls.target,Boolean(transition||flight?.active),walk?.active,Boolean(guidedTour?.active));
    host.dataset.runtime=JSON.stringify({view:selected,plan:planMode,projection:activeCamera.type,cameraPosition:activeCamera.position.toArray(),target:controls.target.toArray(),sectionHeight:clip.constant,loaded:nativeDelivery?[...nativeDelivery.loaded.keys()]:[...groups.keys()],zoom:activeCamera.zoom,autoRotate:controls.autoRotate,zoomEnabled:controls.enableZoom,rotate:controls.mouseButtons.LEFT===THREE.MOUSE.ROTATE,transition:Boolean(transition),textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries,rooms:Boolean(groups.get('interior')?.visible),lamps:lighting?.snapshot?.().interior?.map(f=>Math.round(f.rendered_intensity_cd))??[],glazing:lighting?.snapshot?.().glazing??0});
    renderer.info.reset();
    lighting.render(activeCamera);
      host.dataset.frameStats=JSON.stringify({view:selected,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,allRenderPasses:true,transition:Boolean(transition||flight?.active),sectionCaps:{visible:Boolean(caps?.group.visible),height:caps?.group.children[0]?.position.y,triangles:(caps?.group.children[0]?.geometry.index?.count??0)/3}});
    if(measuredTransition){
      measuredTransition.maxCpuMs=Math.max(measuredTransition.maxCpuMs??0,performance.now()-cpuStart);
      if(!transition)host.dataset.lastTransition=JSON.stringify({frames:measuredTransition.frames,elapsed:time-measuredTransition.start,to:measuredTransition.to,maxFrameGap:measuredTransition.maxFrameGap,maxCpuMs:measuredTransition.maxCpuMs,programs:renderer.info.programs?.length,drawCalls:renderer.info.render.calls});
    }
    if(pendingCapture){
      const callback=pendingCapture,snapshot=deviceQA.snapshot();pendingCapture=null;
      try{renderer.domElement.toBlob(blob=>callback(blob,null,snapshot),'image/png');}catch(error){callback(null,error);}
    }
    deviceQA?.sample(time,{draw_calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
      drawing_buffer:`${renderer.domElement.width}×${renderer.domElement.height}`,view:walk?.active?`${selected}:walk`:selected});
    if(controls.autoRotate||changing||transition||flying||lightChanging||massingChanging||liftChanging||deviceQA?.active)invalidate();
    // FAZ 5: a still camera on desktop-high earns the cinema treatment -
    // 400 ms of quiet, then up to 24 jittered samples accumulate soft
    // shadows and settled AO. Any new frame request cancels instantly.
    else scheduleIdleRefine();
}
let idleRefine=null,idleRefineTimer=null,idleRefining=false;
function scheduleIdleRefine(){
  if(!FEATURES.cinemaStill||!ready)return;
  clearTimeout(idleRefineTimer);
  idleRefineTimer=setTimeout(async()=>{
    if(framePending||idleRefining||walk?.active||contextLost)return;
    const q=quality?.value;
    if(q?.tier!=='desktop-high'||!q.postProcessing)return;
    idleRefine??=(await import('./idle-refine.js')).createIdleRefine({renderer});
    if(framePending||walk?.active)return;
    idleRefine.reset();idleRefining=true;
    const step=()=>{
      if(!idleRefining||framePending||walk?.active){idleRefining=false;return;}
      let more=false;
      try{more=lighting.renderRefineSample(camera,idleRefine);}
      catch(error){console.warn('Idle refine stopped',error);more=false;}
      if(more)requestAnimationFrame(step);else idleRefining=false;
    };
    requestAnimationFrame(step);
  },400);
}

function floorFrameInsets(){
  const rect=host.getBoundingClientRect(),dock=$('.explore-dock').getBoundingClientRect();
  const topBottom=rect.width<700?Math.max($('.topbar').getBoundingClientRect().bottom,$('.scale-picker').getBoundingClientRect().bottom)-rect.top:0;
  return frameInsets(rect.width,rect.height,{dockTop:dock.top-rect.top,topBottom});
}
function resize() {
  invalidateUIObstacles();
  if (!renderer) return;
  const w = host.clientWidth, h = Math.max(1, host.clientHeight), aspect = w / h;
  const ratio=renderPixelRatio(w,h,devicePixelRatio,quality?.value??false);
  if(renderer.getPixelRatio()!==ratio){renderer.setPixelRatio(ratio);lighting?.pixelRatio(ratio);}
  camera.aspect=aspect;
  if(camera.isOrthographicCamera){camera.left=-camera.top*aspect;camera.right=camera.top*aspect;}
  if(selected.startsWith('f')&&!walk?.active)camera.setViewOffset(w,h,photoOffsetX(w),floorFrameInsets().offsetY,w,h);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix(); renderer.setSize(w, h); lighting?.resize(w, h); layoutOverlays(); invalidate();
  walk?.resize(w,h);
}
function frame(initial=false,keep=false) {
  if(!buildingBox)return;
  if(Boolean(camera.isOrthographicCamera)!==planMode){
    flight.cancel();
    // Task 1.5: leaving plan mode restores the VIEW'S lens, not the one
    // hardcoded 16 that used to snap every storey back to telephoto.
    const rigFov=rigFovFor(selected,{enabled:FEATURES.cameraRigsV2});
    const next=planMode?new THREE.OrthographicCamera(-20,20,20,-20,camera.near,camera.far):new THREE.PerspectiveCamera(rigFov,camera.aspect,camera.near,camera.far);
    next.position.copy(camera.position);next.quaternion.copy(camera.quaternion);next.aspect=camera.aspect;next.fov=rigFov;
    camera=next;controls.object=camera;flight.camera=camera;
  }
  const floor=selected.startsWith('f'),aspect=host.clientWidth/Math.max(1,host.clientHeight);
  let box=buildingBox.clone();if(selected==='building'||selected==='f0')box.union(gardenBox);
  if(floor&&nativeAtlas){
    const slice=nativeAtlas.slices[Number(selected[1])];box.makeEmpty();
    for(let i=0;i<slice.p.length;i+=2)box.expandByPoint(new THREE.Vector3(slice.p[i],slice.height-.8,slice.p[i+1]));
    box.expandByScalar(.6);
    if(selected==='f0'&&planMode){
      for(const r of roomData?.rooms??[])if(r.id.startsWith('f0-site-'))box.expandByPoint(new THREE.Vector3(...r.position));
      for(const d of roomData?.dimensions??[])if(d.room_id.startsWith('f0-site-')){box.expandByPoint(new THREE.Vector3(...d.a));box.expandByPoint(new THREE.Vector3(...d.b));}
      box.expandByScalar(.8);
    }
  }
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
  const polar=planMode?.0001:selected==='region'?.58:floor?.56:.78;
  const insets=floor?floorFrameInsets():{verticalFraction:1,horizontalFraction:1};
  frameSpan=Math.max((size.z*Math.cos(polar)+size.y*Math.sin(polar))/insets.verticalFraction,size.x/aspect/insets.horizontalFraction)*(floor?1.08:1.14);
  const rigFov=rigFovFor(selected,{enabled:FEATURES.cameraRigsV2});
  if(selected==='region'&&contextBox)frameSpan=fitContextBounds(contextBox,aspect,polar,0,rigFov).span;
  if(keep){center.copy(controls.target);if(floor)center.y=[0,3.0996,6.3714,9.4705][Number(selected[1])];frameSpan=camera.position.distanceTo(controls.target)*2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));}
  flight.go({target:center,polar,span:frameSpan,zoom:keep?camera.zoom:1,azimuth:planMode||selected==='region'?0:initial?.804:undefined,fov:planMode?undefined:rigFov},initial===true);
  resize();
}
const SHEETS={'options-panel':'open-options','info-panel':'open-info','floor-panel':'open-floor'};
// The property sheet is the listing and never changes with the view; the
// storey sheet is the open floor and exists only while one is open.
function refreshSheets(view){
  if(!roomData)return;
  renderPropertyInfo($('#property-info'),roomData);
  renderFloorInfo($('#floor-info'),roomData,view);
  $('#floor-panel-title').textContent=/^f[0-3]$/.test(view)?titles[view]:t('floorInfo');
  if(!/^f[0-3]$/.test(view)&&!$('#floor-panel').hidden)panel('',false);
}
function panel(id,open) {
  invalidateUIObstacles();
  if(walk){walk.inputSuspended=open;walk.keys.clear();walk.lastTime=null;}
  const previous=document.querySelector('.panel:not([hidden])');
  for(const [name,button] of Object.entries(SHEETS)){
    const show=name===id&&open;$('#'+name).hidden=!show;
    $('#'+button).setAttribute('aria-expanded',show);
  }
  if(open){$('#'+id).querySelector('[data-close-panel]')?.focus();}
  else if(previous){$('#'+SHEETS[previous.id])?.focus();}
  layoutOverlays();
  reframeForOverlays();
}
// Nothing the interface opens may land on anything else it has already
// opened. The sheets own fixed corners in CSS; the photograph frame is the
// one floating thing, so its band is measured here from whatever is open -
// the gear at the bottom right, the view options above it, an information
// sheet hanging from the top - and the frame is centred in what is left.
// On a phone the frame is the screen and the media query owns it.
// A frame squeezed into eighty pixels is not a photograph, so the band has a
// floor: when the right column cannot give it one - a long storey sheet next
// to the gear leaves a sliver - the frame moves to the empty left column
// rather than shrinking or being drawn over.
const PHOTO_BAND=300;
// A frame parked over the right-hand quarter of the screen is parked over the
// marks under it, and a mark you cannot reach is a mark that "does not open".
// So the drawing steps aside instead: the projection is offset by half the
// frame's width while it is up, which slides the whole storey out from under
// it and back again when it closes. Bounded, so a narrow window cannot push
// the plan off its other edge.
function photoOffsetX(width){
  const dock=$('#photo-dock');
  if(!dock||dock.hidden||matchMedia('(max-width:720px)').matches)return 0;
  const frame=host.getBoundingClientRect();
  let left=0,right=0;
  const claim=(rect,side)=>{
    if(side==='left')left=Math.max(left,rect.right-frame.left);
    else right=Math.max(right,frame.right-rect.left);
  };
  claim(dock.getBoundingClientRect(),dock.dataset.side==='left'?'left':'right');
  // A sheet open on the right narrows the window from that side too, so with
  // the frame parked left and a sheet parked right the drawing barely moves.
  for(const id of Object.keys(SHEETS)){
    const sheet=$('#'+id);if(!sheet||sheet.hidden||!sheet.getClientRects().length)continue;
    claim(sheet.getBoundingClientRect(),'right');
  }
  const limit=width*0.16;
  return Math.max(-limit,Math.min(limit,(right-left)/2));
}
// Only the projection moves, not the canvas: a full resize() would reset the
// drawing buffer and flash the scene every time a photograph is opened.
function reframeForOverlays(){
  if(!renderer||!camera)return;
  const w=host.clientWidth,h=Math.max(1,host.clientHeight);
  if(selected.startsWith('f')&&!walk?.active)camera.setViewOffset(w,h,photoOffsetX(w),floorFrameInsets().offsetY,w,h);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();invalidate();
}
function layoutOverlays() {
  const dock=$('#photo-dock');if(!dock)return;
  if(matchMedia('(max-width:720px)').matches){
    for(const key of ['top','bottom'])dock.style.removeProperty(key);
    delete dock.dataset.side;return;
  }
  const frame=host.getBoundingClientRect();
  // Whatever is on a side eats into that side's band from the edge it hangs
  // off, so the frame is always centred in what nothing else has claimed.
  const bandOf=elements=>{
    let top=74,bottom=22;
    for(const el of elements){
      if(!el||el.hidden||!el.getClientRects().length)continue;
      const rect=el.getBoundingClientRect();if(!rect.height)continue;
      if((rect.top+rect.bottom)/2-frame.top<frame.height/2)top=Math.max(top,rect.bottom-frame.top+12);
      else bottom=Math.max(bottom,frame.bottom-rect.top+12);
    }
    return {top,bottom,free:frame.height-top-bottom};
  };
  const right=bandOf([$('.tool-dock'),...Object.keys(SHEETS).map(id=>$('#'+id))]);
  let side='right',band=right;
  if(right.free<PHOTO_BAND){
    const left=bandOf([$('.view-description'),$('#model-scale')]);
    if(left.free>right.free){side='left';band=left;}
  }
  dock.dataset.side=side;
  dock.style.top=`${Math.round(band.top)}px`;
  dock.style.bottom=`${Math.round(band.bottom)}px`;
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
  refreshSheets(selected);
}
// Live location while walking: the title, the room menu and the area follow
// the visitor's feet. Circulation and outdoor ground name themselves and
// show no borrowed room area - a previous room's m² never travels along.
function applyWalkLocation(name,station){
  $('#view-title').textContent=name;
  if(station){
    walk.room=station.room_id;
    $('#walk-room').value=station.room_id;
    $('#walk-room-area').textContent=areaLabel(roomData?.rooms.find(r=>r.id===station.room_id),roomData);
  } else $('#walk-room-area').textContent='';
  invalidate();
}
async function travelRoom(roomId){
  pendingRoomJump.cancel();
  const destination=walk?.surface.data.stations.find(s=>s.room_id===roomId);
  if(nativeDelivery&&destination&&selected!=='f'+destination.floor_index){
    if(nativeSwitching)return;
    nativeSwitching=true;message('Kat hazırlanıyor…');
    try{await nativeDelivery.activate('f'+destination.floor_index);setFurnitureVisible(furnitureVisible);selected='f'+destination.floor_index;enterWalk(roomId);status.hidden=true;}
    catch(error){message('Oda yüklenemedi: '+error.message,true);}
    finally{nativeSwitching=false;}
    return;
  }
  if(!walk?.active)return enterWalk(roomId);
  panel('',false);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){enterWalk(roomId);return;}
  if(walk.travel(roomId,updateRoomUI))return;
  // Closed source doors are not removed to create a fictitious walkable route.
  clouds();pendingRoomJump.run(()=>enterWalk(roomId),480);
}

// In a headset there is no room menu and no lift button to press, and the
// walking surface carries no stairs - the delivery states that limitation
// itself - so the right stick is how a visitor changes storey. They come out
// directly above or below where they were standing, or at the nearest place on
// that floor where a person can actually stand, and the storey's own interior
// is loaded first exactly as the room menu loads it.
let storeyShifting=false;
async function shiftWalkFloor(delta){
  if(!walk?.active||storeyShifting||nativeSwitching)return;
  const floor=Math.max(0,Math.min(3,(walk.floor??1)+delta));
  if(floor===walk.floor)return;
  storeyShifting=true;
  try{
    const head=walk.camera.getWorldPosition(new THREE.Vector3());
    if(nativeDelivery&&selected!=='f'+floor){
      nativeSwitching=true;
      try{await nativeDelivery.activate('f'+floor);setFurnitureVisible(furnitureVisible);}
      finally{nativeSwitching=false;}
    }
    const station=walk.surface.data.stations.find(s=>s.floor_index===floor);
    const landing=walk.surface.center(floor,[head.x,head.z],furnitureVisible)??station?.position;
    if(!landing)return;
    walk.placeAt(landing);walk.floor=floor;selected='f'+floor;
    lift?.setWalkFloor(floor);refreshLiftControl();
    lighting.interior(floor,landing);
    $('#section-label').textContent=titles[selected]+' \u00b7 '+t('walkSub');
    refreshSheets(selected);
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===selected));
    invalidate();
  } finally{storeyShifting=false;}
}

function setup() {
  scene = new THREE.Scene(); scene.background = new THREE.Color('#e9eeed');
  camera = new THREE.PerspectiveCamera(16,1,1,2000);camera.position.set(60,100,60);
  // One quality decision for the whole pipeline (Task 1.1). Tier detection
  // and the model-root read live inside quality-profile.js; nothing after
  // this line asks the pointer or the pathname a quality question.
  quality = createQualityProfile({
    tier: detectTierFromEnvironment({search: location.search}),
    view: selected, deliveryPath: modelRoot.pathname, features: FEATURES,
  });
  // A phone draws straight to the canvas, so the canvas has to do the
  // antialiasing: the chain that used to do it is not in that path. On desktop
  // the composer's SMAA owns it and canvas MSAA would be paying twice.
  try {
    renderer = new THREE.WebGLRenderer({antialias:quality.value.antialiasing==='canvas-msaa', alpha:false, powerPreference:'high-performance'});
  } catch (error) {
    // No 3D is not no product: the boot screen keeps the verified facts,
    // the listing route and an honest explanation on screen.
    console.error('WebGL unavailable', error);
    message(t('loadFailed'), true); $('#retry').hidden = true; $('#no3d').hidden = false;
    contextLost = true; return;
  }
  renderer.setPixelRatio(renderPixelRatio(host.clientWidth,host.clientHeight,devicePixelRatio,quality.value));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.localClippingEnabled = true;
  renderer.info.autoReset=false;
  host.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', '3D model; döndürmek için sürükleyin');
  controls = new OrbitControls(camera, renderer.domElement);
  configureCameraControls(controls, THREE);
  flight=new CameraFlight(camera,controls,resize,invalidate);
  controls.addEventListener('change', invalidate);
  lighting = createLighting(renderer, scene, camera, clip,{quality});
  // Task 4.2: the desktop postfx chain arrives through a dynamic import;
  // a capture must not screenshot the canvas-path frames it bridges with.
  window.__angoraPostfxReady=lighting.postfxReady?.then?.(chain=>{if(chain)invalidate();return Boolean(chain);});
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
    message(t('contextLost'),true);$('#no3d').hidden=false;
    $('#retry').onclick=()=>location.reload();
  });
  // Bound both package concurrency and decoder workers. A phone's core count
  // does not imply enough memory for simultaneous model/texture decode.
  // A decode-memory decision, not a render-quality one - and it stays on the
  // physical pointer: keying it off ?profile= changed decode order under a
  // forced profile, which re-ties a z-fight at the eaves junction (measured:
  // 26 px on the mobile C07 gate frame). Loading must not move pixels.
  const draco = new DRACOLoader(); draco.setDecoderPath(decoderRoot.href);
  const budget=assetLoadBudget({compact:matchMedia('(pointer: coarse)').matches,cores:navigator.hardwareConcurrency});
  draco.setWorkerLimit(budget.draco);
  loader = new GLTFLoader(); loader.setDRACOLoader(draco);
  loader.setKTX2Loader(createTextureLoader(renderer,budget.textures));
  const enqueue=createLoadQueue(budget.models);
  loadAsset=(...args)=>enqueue(()=>loader.loadAsync(...args));
  loader.setMeshoptDecoder(MeshoptDecoder);
  window.addEventListener('resize',()=>{
    const portrait=camera.aspect<1;resize();
    if(ready&&!walk?.active&&(selected.startsWith('f')||portrait!==(camera.aspect<1)))frame(true);
  });
  renderer.xr.addEventListener('sessionstart', () => renderer.setAnimationLoop(renderFrame));
  renderer.xr.addEventListener('sessionend', () => {renderer.setAnimationLoop(null);resize();invalidate();});
}
async function selectView(id, initial = false) {
  if(id==='building')id='f3';
  setAutoRotate(false);
  if(nativeDelivery){
    if(nativeSwitching)return;
    nativeSwitching=true;message('Kat hazırlanıyor…');
    try{
      await nativeDelivery.activate(id);
      lighting.frame(id,contextBox);
      lighting.interior(id.startsWith('f')?Number(id[1]):null,null);
      if(/^f[0-3]$/.test(id))ensureRoomProbe(Number(id[1]));
      if(!nativeDelivery.batched){
        if(renderer.compileAsync)await renderer.compileAsync(scene,camera);
        lighting.warm(camera);
        await waitForGPU(renderer);
      }
      setFurnitureVisible(furnitureVisible);status.hidden=true;
    }catch(error){message('Görünüm yüklenemedi: '+error.message,true);return;}
    finally{nativeSwitching=false;}
  }
  pendingRoomJump.cancel();
  if (walk?.active && id.startsWith('f')) {
    const station=walk.surface.data.stations.find(s=>s.floor_index===Number(id[1]));travelRoom(station.room_id);return;
  }
  if (walk?.active) exitWalk(false);
  const previous = selected; selected = id;
  quality?.applyView(id,{plan:planMode,walking:walk?.active});
  // The pin that opened a frame is about to leave the screen, so the frame
  // goes with it rather than hanging over another storey.
  if (previous !== id) photoViewer?.hide();
  plotMask?.set(id.startsWith('f'));
  if(!id.startsWith('f')){planMode=false;$('#toggle-plan').setAttribute('aria-pressed',false);$('#toggle-plan').textContent='Plan';mode(false);}
  if(id==='region')$('#region-summary').open=false;
  $('#app').dataset.scale=id.startsWith('f')?'floor':id;
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === id || (b.dataset.view==='building' && id.startsWith('f'))));
  $('#view-title').textContent = titles[id];
  $('#section-label').textContent = id.startsWith('f')
    ? (id==='f3'?t('cut130'):t('cut160'))
    : id === 'building' ? t('buildingSub') : id==='region'?t('regionSub'):t('neighborhoodSub');
  $('#cut-light-note').hidden = !id.startsWith('f');
  $('#region-panel').hidden=id!=='region';
  // The Bölge scale is a north-up map layer; the clouds sweep while the 3D
  // frame pulls out beneath it, so the model leaves smoothly either way.
  if (id==='region') {
    await ensureRegionMap();
    regionMap.show(initial ? 0 : 180);
  } else regionMap?.hide();
  panel('',false);
  if (!ready) return;
  controls.enableZoom=id!=='neighborhood';
  $('#toggle-auto-rotate').hidden=id!=='neighborhood';
  $('#enter-walk').hidden=!id.startsWith('f');
  $('#toggle-plan').hidden=!id.startsWith('f');
  for(const key of ['zoom-in','zoom-out'])$('#'+key).disabled=id==='neighborhood';
  const target = sectionHeight(id, fullHeight);
  const earthTarget = id==='f0' ? SOIL_CUT_HEIGHT : fullHeight;
  for (const o of plantingAboveCut) o.visible = id !== 'f0';
  if (earthClip.constant !== earthTarget) {earthClip.constant = earthTarget; renderer.shadowMap.needsUpdate = true;}
  lighting.frame(id,contextBox);massing?.set(id);lift?.park(id);
  lighting.interior(id.startsWith('f')?Number(id[1]):null,null);
  refreshSheets(id);
  if(!initial&&(id==='region'||previous==='region'))clouds();
  if (initial || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    clip.constant = target; transition = null;
  } else {
    transition = {from:clip.constant, to:target, start:performance.now(), span:950};
    // The plane takes just under a second to travel; the sweep takes exactly
    // as long and runs the way the plane runs. Forced during the tour, which
    // is already playing a voice.
    interfaceSound?.transition(950, target > clip.constant, guidedTour?.active);
  }
  frame(initial);
  invalidateUIObstacles();
  host.dataset.view = id; host.dataset.loaded = 'true'; rememberState(); invalidate();
}
let walkData=null;
// The narrated tour: the driver (audio clock and subtitles), the shade it
// draws over everything the sentence is not about, and how dark that shade
// currently is - eased per frame so starting and leaving the tour are fades
// rather than a cut.
let guidedTour=null,spotlight=null,tourShade=0,tourShadeTarget=0,tourShadeTime=null;
let roomProbes=null,contactBake=null;
// Task 2.1-c: a storey's probe arrives on its first visit; rebinding goes
// through setRoomReflections, which is idempotent and refreshes the glazing.
function ensureRoomProbe(floor){
  if(!roomProbes||typeof floor!=='number')return;
  roomProbes.ensure(floor).then(()=>{lighting?.setRoomReflections(roomProbes);invalidate();}).catch(()=>{});
}
// The Bolge map's slow turn during the opening. It is driven by its own timer
// rather than by the render loop: the map is an opaque DOM layer over the
// scene, so turning it must not ask the renderer for forty megabytes of frame.
const REGION_SPIN_DEG=0.75;
let tourSpinTimer=null,tourBearing=0;
// The side gallery's current frames, and the timers that light a sentence's
// rooms one after another. Both are kept so a language switch can redraw the
// captions and a cue change can cancel a reveal still in flight.
let tourPhotos=[],tourReveal=[],tourHourBefore=null,tourLightsBefore=null;
// The closing's turn, and the lens it is taken with. Both are restored when
// the tour ends; see setTourSweep and endTour.
let tourSweep=null,tourLensBefore=null;
// The buyer's room menu: drawing names in the viewer's language, internal
// codes ('Z06') demoted to tooltips, twins told apart by code only.
function fillRoomMenu(){
  const select=$('#walk-room');
  const value=select.value;
  select.replaceChildren();
  for(let f=0;f<4;f++){
    const group=document.createElement('optgroup');group.label=titles['f'+f];
    const floorStations=walkData.stations.filter(s=>s.floor_index===f);
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
// Both flags stay on screen; the active one is the one marked pressed, which
// is what colours it.
function markLanguage(){
  document.querySelectorAll('.lang-flag').forEach(button=>
    button.setAttribute('aria-pressed',String(button.dataset.lang===currentLang())));
}
// One language switch, every surface: static DOM, state-carrying labels,
// the room menu, the plan's room tags, the map, the property sheet, the
// photograph captions.
function refreshChrome(){
  applyStatic();
  markLanguage();
  photoPins?.refreshLabels();photoViewer?.refresh();
  // There is a recording per language, so the switch is not only a caption
  // change: mid-tour the other voice picks up the sentence being spoken.
  guidedTour?.setLanguage(currentLang());
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
  refreshSheets(selected);
  refreshLiftControl();
  document.querySelectorAll('.room-label strong').forEach(el=>{
    el.dataset.base??=el.textContent;el.textContent=roomName(el.dataset.base);
  });
  if(regionMap){
    const open=selected==='region';
    regionMap.element.remove();regionMap=null;
    if(open&&regionMapFactory){regionMap=regionMapFactory($('#app'));regionMap.show();}
  }
  hotspots?.reset();
  refreshTourLabels();setTourPhotos(tourPhotos);guidedTour?.refresh();
  invalidate();
}
// \u00a77: the owner's voiceover, and the viewer keeping up with it.
//
// The recording is one unbroken four-and-a-half-minute read - no pause in it
// reaches a second and a half - so there is nothing for a step button to step
// between. The audio is the timeline: tour-script.js says what should be on
// screen while each sentence is spoken, the driver reads the audio clock, and
// this is what it asks the viewer to do. Where a sentence names rooms they are
// lit and everything else is taken down to a shade; where it names only a
// view, the view's own framing stands.
// The storey's own footprint, taken from the same section atlas the floor
// views frame with. An open-plan label carries its SPACE's span in the
// register, so without this the salon's box runs out past the wall that holds
// it; site boxes - the pool, the garden - are meant to reach beyond the house
// and keep their own extent.
function floorFootprint(floor){
  const slice=nativeAtlas?.slices?.[floor];if(!slice?.p?.length)return null;
  const box={min:[Infinity,0,Infinity],max:[-Infinity,0,-Infinity]};
  for(let i=0;i<slice.p.length;i+=2){
    box.min[0]=Math.min(box.min[0],slice.p[i]);box.max[0]=Math.max(box.max[0],slice.p[i]);
    box.min[2]=Math.min(box.min[2],slice.p[i+1]);box.max[2]=Math.max(box.max[2],slice.p[i+1]);
  }
  return Number.isFinite(box.min[0])?box:null;
}
// Every part of the plot that is not the house, as the four spans a plan
// reads: the street side, the garden behind, and the two flanks. The plot is
// the registered R32 rectangle and the house is its own box, so this is
// subtraction rather than invention - and it is how "the garden wraps the
// villa" is shown to include the front and the sides, which the register's
// single Bahce label does not cover.
function plotRingBoxes(){
  if(!buildingBox)return [];
  // Tall enough to span both grades: the street side stands a storey above
  // the pool terrace, and one mark has to cover the whole slope.
  const low=-0.8,high=4.2,house=buildingBox;
  return [[PLOT_RECT.minX,PLOT_RECT.maxX,house.max.z,PLOT_RECT.maxZ],
          [PLOT_RECT.minX,PLOT_RECT.maxX,PLOT_RECT.minZ,house.min.z],
          [PLOT_RECT.minX,house.min.x,house.min.z,house.max.z],
          [house.max.x,PLOT_RECT.maxX,house.min.z,house.max.z]]
    .filter(([x0,x1,z0,z1])=>x1-x0>.6&&z1-z0>.6)
    .map(([x0,x1,z0,z1])=>new THREE.Box3(new THREE.Vector3(x0,low,z0),new THREE.Vector3(x1,high,z1)));
}
// The shaft, at one storey's height. Its footprint is lift.js's recorded
// measurement of the delivered model rather than a guess, and the roof storey
// has no landing, so it is never asked for.
function liftBox(floor){
  const datums=roomData?.floor_datums_m??[0,3.0996,6.3714,9.4705];
  const base=datums[floor];if(base===undefined)return null;
  const top=base+(datums[floor+1]?datums[floor+1]-base-.3:2.75);
  return new THREE.Box3(new THREE.Vector3(SHAFT.minX,base,SHAFT.minZ),
                        new THREE.Vector3(SHAFT.maxX,top,SHAFT.maxZ));
}
function tourBoxes(ids){
  if(!roomData)return [];
  const boxes=[],seen=new Set();
  for(const id of ids){
    // Marks are the tour's own, told apart from register ids by their prefix
    // so neither can ever be mistaken for the other.
    if(id==='mark:plot-ring'){boxes.push(...plotRingBoxes());continue;}
    const shaft=/^mark:lift-([0-2])$/.exec(id);
    if(shaft){const box=liftBox(Number(shaft[1]));if(box)boxes.push(box);continue;}
    const room=roomData.rooms.find(entry=>entry.id===id);if(!room)continue;
    const raw=roomBox(room,roomData.dimensions,roomData.floor_datums_m,roomData.spaces);
    // Two labels of one open plan are one enclosure, and the register says so:
    // lighting the salon has already lit the hall it opens into, so naming
    // both must not light the same rectangle twice.
    if(raw.space){if(seen.has(raw.space))continue;seen.add(raw.space);}
    const box=raw.space||id.includes('-site-')?raw:clampToFloor(raw,floorFootprint(room.floor_index));
    boxes.push(new THREE.Box3(new THREE.Vector3(...box.min),new THREE.Vector3(...box.max)));
  }
  return boxes;
}
// The owner's own frames of whatever the sentence is naming. Three at most:
// beyond that they stop being a glance and start being a contact sheet. Two
// on a phone - the row is narrower, and these are half-megabyte listing
// photographs going over whatever connection the visitor has.
function setTourPhotos(ids){
  const el=$('#tour-gallery');if(!el)return;
  tourPhotos=ids??[];
  const limit=matchMedia('(max-width:720px)').matches?2:3;
  const shown=photoPoints?tourPhotos.slice(0,limit).map(id=>photoPoints.PHOTO_POINTS.find(entry=>entry.id===id)).filter(Boolean):[];
  el.replaceChildren(...shown.map((point,i)=>{
    const figure=document.createElement('figure');
    const image=document.createElement('img');
    // The 400 px versions, made from the same originals: a card is 250 px
    // wide and the full frames are half a megabyte each.
    image.src=new URL(point.file.replace(/\.[^.]+$/,'.jpg'),thumbRoot).href;
    image.alt='';image.loading='lazy';image.decoding='async';
    const caption=document.createElement('figcaption');
    const number=document.createElement('b');number.textContent=String(i+1);
    const where=document.createElement('span');where.textContent=photoPoints.photoCaption(point,currentLang());
    caption.append(number,where);
    figure.append(image,caption);return figure;
  }));
  el.dataset.single=String(shown.length<2);
  el.hidden=!shown.length;
  // Each card's number is repeated in the scene, at the spot the photograph
  // was taken from, so "where is this" is answered by the model itself.
  spotlight?.setShots(shown.map((point,i)=>(
    {n:i+1,position:[point.x,point.y,point.z],look:[point.dx,point.dz]})));
}
// "aynı anda üçünü de açma": a sentence that names three rooms lights them in
// the order it names them, spread across the words rather than thrown on at
// once. The camera still frames all of them from the start, so the view does
// not creep while they arrive.
const REVEAL_MAX_S=2.4;
function clearTourReveal(){for(const id of tourReveal)clearTimeout(id);tourReveal=[];}
function revealBoxes(boxes,glow,span){
  clearTourReveal();
  if(boxes.length<2||span<1.6){spotlight?.setBoxes(boxes,{glow});return;}
  const gap=Math.min(REVEAL_MAX_S,span/(boxes.length+0.6));
  spotlight?.setBoxes(boxes.slice(0,1),{glow});
  for(let i=1;i<boxes.length;i++)
    tourReveal.push(setTimeout(()=>{spotlight?.setBoxes(boxes.slice(0,i+1),{glow});invalidate();},gap*i*1000));
}
// The hour a cue asks for - the closing is at dusk - with the visitor's own
// setting remembered and put back when the tour ends.
function setTourHour(hour){
  const slider=$('#daylight-hour');if(!slider||hour===null||String(hour)===slider.value)return;
  tourHourBefore??=slider.value;
  slider.value=String(hour);slider.oninput();
}
function setTourSpin(on){
  if(on===Boolean(tourSpinTimer))return;
  if(!on){clearInterval(tourSpinTimer);tourSpinTimer=null;return;}
  let last=performance.now();
  tourSpinTimer=setInterval(()=>{
    const now=performance.now(),dt=Math.min(.5,(now-last)/1000);last=now;
    if(!regionMap||selected!=='region'||guidedTour?.paused)return;
    tourBearing+=dt*REGION_SPIN_DEG;
    regionMap.setBearing(Math.round(tourBearing*10)/10);
  },80);
}
function restRegionMap(){
  setTourSpin(false);tourBearing=0;
  regionMap?.setBearing(0);regionMap?.setGroup(null);regionMap?.setHighlight(false);
}
function tourCaption(step){
  $('#tour-caption').textContent=step?(currentLang()==='en'?step.en:step.tr):'';
}
// applyStatic() writes the transport's aria-label straight from the markup's
// key, which is the PAUSE wording; a language switch made mid-pause would
// otherwise leave the play button telling a screen reader to pause.
function refreshTourLabels(){
  const play=$('#tour-play');if(!play)return;
  play.dataset.pauseLabel=t('tourPause');play.dataset.playLabel=t('tourResume');
  play.setAttribute('aria-label',play.dataset.state==='paused'?play.dataset.playLabel:play.dataset.pauseLabel);
}
async function applyTourStep(step){
  if(walk?.active)exitWalk(false);
  photoViewer?.hide();
  $('#tour-listing').hidden=!step.link;
  setTourPhotos(step.photos);
  setTourHour(step.hour);
  // The B\u00f6lge scale is a map layer, so its cues move its radius rather than
  // a camera, and the only thing to light is the address at its centre.
  if(step.view==='region'){
    if(selected!=='region')await selectView('region');
    await ensureRegionMap();
    regionMap.setRadius(step.radius);
    document.querySelectorAll('.region-radius button').forEach(button=>
      button.setAttribute('aria-pressed',String(Number(button.dataset.radius)===step.radius)));
    // One amenity family per sentence, chosen to match it: the civic set
    // under "idari ve sosyal", the parks under "en yesil", transport under
    // "kolay ulasim", the schools under "ailelerin gozdesi".
    regionMap.setGroup(step.group);
    setTourSpin(step.spin);
    clearTourReveal();
    spotlight?.setBoxes([]);spotlight?.setCentre(step.spot==='centre');
    tourShadeTarget=step.spot==='centre'?1:0;
    setTourWindows(step.windows);
    setTourSweep(null);
    setAutoRotate(false);invalidate();return;
  }
  restRegionMap();
  spotlight?.setCentre(false);
  if(selected!==step.view)await selectView(step.view);
  const boxes=tourBoxes(step.rooms);
  revealBoxes(boxes,!step.rooms.includes('mark:plot-ring'),step.span);
  tourShadeTarget=boxes.length?1:0;
  // What the camera is for. A cue about the plot frames the villa WITH what
  // is lit - the garden reads as wrapping the house only if the house is in
  // the picture - and a cue about the villa frames the house alone. 'storey'
  // keeps the view's own framing while something inside it is lit, which is
  // how the lift is marked ON a floor rather than filling the screen with a
  // 1,2 m shaft. With none of them the lit rooms are the subject, and with
  // nothing lit the view frames itself.
  const lit=boxes.length?boxes.reduce((box,next)=>box.union(next),new THREE.Box3()):null;
  const framed=!buildingBox||step.frame==='storey'?null
    :step.frame==='plot'?(lit?.clone()??new THREE.Box3()).union(buildingBox).union(gardenBox??buildingBox)
    :step.frame==='villa'?buildingBox.clone().union(lit??buildingBox)
    :lit;
  if(framed&&!framed.isEmpty()){
    const centre=framed.getCenter(new THREE.Vector3()),size=framed.getSize(new THREE.Vector3());
    const aspect=host.clientWidth/Math.max(1,host.clientHeight);
    // Outdoor ground has no walls to hold the eye, so the pool framed to its
    // own edges reads as a photograph of water rather than as a garden: site
    // boxes take a wider frame and a lower camera, which puts the terrace,
    // the trees and the house itself back in the picture.
    const outdoor=step.rooms.length>0&&step.rooms.every(id=>id.includes('-site-'));
    const polar=step.polar??(step.frame==='villa'?1:step.frame==='plot'?.86:outdoor?.95:.62);
    const pad=step.pad??(step.frame==='villa'?1.12:step.frame==='plot'?1.1:outdoor?2.4:1.7);
    // A phone's frame is what the owner saw run off the edges: the same span
    // that fits on a screen does not fit under a topbar, a subtitle card and a
    // transport. Everything the tour frames is brought to about four fifths of
    // the viewport there.
    const room=matchMedia('(max-width:720px)').matches?1.25:1;
    const span=Math.max(size.z*Math.cos(polar)+size.y*Math.sin(polar),size.x/aspect)*pad*room;
    // Looked at from its own side of the house, so the camera is never put
    // behind the wall it is meant to be showing through.
    const house=buildingBox.getCenter(new THREE.Vector3());
    const offset=new THREE.Vector2(centre.x-house.x,centre.z-house.z);
    const azimuth=step.azimuth??(offset.length()>1.2?Math.atan2(offset.x,offset.y):undefined);
    // A cue may ask for its own lens. The closing does, because the only
    // unobstructed way round this house is close to it, and the tour's own
    // 16 deg would then see a window rather than a villa.
    if(step.lens&&tourLensBefore===null)tourLensBefore=camera.fov;
    flight.go({target:centre,polar,span,azimuth,fov:step.lens??tourLensBefore??camera.fov});
  } else frame(false);
  setTourWindows(step.windows);
  setTourSweep(step);
  setAutoRotate(step.rotate);
  invalidate();
}
// "i\u00e7erdeki \u0131\u015f\u0131klar d\u0131\u015fardan g\u00f6z\u00fcks\u00fcn": the closing is a dark elevation, and a
// dark elevation of an empty house is a model. Lighting one lamp per storey
// puts a home behind the glazing instead - and it has to be asked for, because
// selectView turns the interior off for every exterior view, which is right
// everywhere else in the tour.
//
// The visitor's own switch is borrowed, not spent: whatever they had set is
// restored when the tour ends, the same way their daylight is.
// "orda artik yavasca etrafindan rotate edebilrisn" - and a full turn is not
// available here. A neighbour stands 11 m from this villa's centre, so at the
// tour's 16 deg lens an orbit has to stand 74 m out, and clearing that roof
// from there needs the eye 40 m up: the roof view the closing was asked to
// stop being. Close enough to look up at the house, better than a third of the
// circle puts the CAMERA inside a neighbour's walls.
//
// So the closing turns through the arc that is actually clear - 155 to 234
// degrees, across the pool and the garden, which is the face the listing's own
// photographs were taken from - and takes its time over it: one slow pass,
// eased at both ends so it neither starts nor stops with a jerk.
function setTourSweep(step){
  // It runs to the end of the recording, not to the end of the sentence, so
  // the whole closing is one unbroken move - and it follows the transport: at
  // 2x the words finish in half the time and so must the turn.
  tourSweep=step?.sweep?{from:step.azimuth,through:step.sweep,
    span:Math.max(8,(TOUR_DURATION[tourLang(currentLang())]-step.at)/(guidedTour?.rate??1)),done:0}:null;
  if(tourSweep)invalidate();
}
function advanceTourSweep(time){
  const last=tourSweep.last??time;tourSweep.last=time;
  // Paused means paused: the camera waits with the voice rather than turning
  // on through a silence the listener asked for.
  if(!guidedTour?.paused)tourSweep.done+=(time-last)/1000;
  const t=Math.min(1,tourSweep.done/tourSweep.span);
  // Smoothstep: the turn creeps in and settles rather than snapping to speed.
  // OrbitControls has getAzimuthalAngle but no setter, so the bearing is put
  // back the way the flight does it - recompose the offset from the target.
  const spherical=new THREE.Spherical().setFromVector3(
    new THREE.Vector3().subVectors(camera.position,controls.target));
  spherical.theta=tourSweep.from+tourSweep.through*(t*t*(3-2*t));
  camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
  camera.lookAt(controls.target);
  if(t<1)invalidate(); else tourSweep=null;
}
function setTourWindows(on){
  if(!lighting)return;
  // An exterior view hides the interior group outright - native-delivery.js
  // keeps it visible only for /^f[0-3]$/ - so four lamps inside an uncut shell
  // light nothing at all, which is exactly what shipped the first time. The
  // closing is the one exterior view that wants the rooms rendered, because
  // the rooms are what the glazing has to show.
  const rooms=groups.get('interior');
  if(rooms)rooms.visible=on||/^f[0-3]$/.test(selected);
  if(on){
    if(tourLightsBefore===null){tourLightsBefore=interiorLights;lighting.setLights(true);}
    // Ranked from the middle of the house, not from the camera: the closing
    // is an orbit, so any choice made from where the camera happens to be is
    // wrong by the time it has turned. From the centre the slots land on the
    // hall and landing lamps - the ones a stairwell window shows off anyway.
    // Reach far enough to be seen from the garden: the closing stands about
    // 22 m out, and a lamp measured for its own room does not carry that far
    // through glass at an exterior's exposure.
    lighting.interior('all',buildingBox?.getCenter(new THREE.Vector3())?.toArray()??null,
      undefined,{gain:5.5,reach:16});
    // And the windows themselves carry it, because the lamps cannot: the
    // batched shaders compile the spot lights out of the very surfaces the
    // rooms are made of. See lighting.setWindowGlow.
    lighting.setWindowGlow(.42);
  } else if(tourLightsBefore!==null){
    lighting.setLights(tourLightsBefore);tourLightsBefore=null;
    lighting.setWindowGlow(0);
    lighting.interior(/^f[0-3]$/.test(selected)?Number(selected[1]):null,null,undefined,{});
  }
}
// Task 4.2: the region map layer (21 KB plus its OSM street/amenity JSON)
// loads on the first visit to the Bölge scale, not with the boot bundle.
let regionMapFactory=null;
async function ensureRegionMap(){
  regionMapFactory??=(await import('./region-map.js')).createRegionMap;
  return regionMap??=regionMapFactory($('#app'));
}
function ensureSpotlight(){
  if(!spotlight&&scene){spotlight=createSpotlight($('#app'));scene.add(spotlight.group);}
  return spotlight;
}
async function startTour(){
  if(!ready)return;
  ensureSpotlight();
  // Task 4.2: the narrated tour and its four-minute script load on the
  // first press, not with the boot bundle.
  guidedTour??=(await import('./guided-tour.js')).createGuidedTour({element:$('#tour-bar'),audioRoot,lang:currentLang(),
    apply:applyTourStep,caption:tourCaption,onEnd:()=>endTour(true),
    // The bar stays up with the reason in it, so leaving is still one press.
    onError:()=>{$('#tour-caption').textContent=t('tourAudioFailed');
      spotlight?.setBoxes([]);spotlight?.setCentre(false);tourShadeTarget=0;invalidate();}});
  panel('',false);photoViewer?.hide();
  // A tour that opened over the plan drawing would spend four minutes looking
  // straight down through an orthographic lens; the narration describes rooms,
  // not sheets.
  planMode=false;$('#toggle-plan').setAttribute('aria-pressed',false);$('#toggle-plan').textContent='Plan';mode(false);
  $('#tour-bar').hidden=false;$('#app').dataset.tour='true';
  invalidateUIObstacles();
  guidedTour.start();
}
function endTour(openInfo){
  guidedTour?.stop();
  $('#tour-bar').hidden=true;$('#app').dataset.tour='false';
  $('#tour-listing').hidden=true;
  clearTourReveal();setTourPhotos([]);setTourWindows(false);setTourSweep(null);
  // The closing's wide lens belongs to the closing. Left in place the whole
  // viewer would carry it, and every view after the tour would be a
  // different building.
  if(tourLensBefore!==null){camera.fov=tourLensBefore;camera.updateProjectionMatrix();tourLensBefore=null;}
  if(tourHourBefore!==null){$('#daylight-hour').value=tourHourBefore;$('#daylight-hour').oninput();tourHourBefore=null;}
  restRegionMap();
  tourCaption(null);
  spotlight?.setBoxes([]);spotlight?.setCentre(false);
  tourShadeTarget=0;
  setAutoRotate(false);
  // The closing orbit leaves the camera low and close, and the flight pins the
  // polar angle it was given. The presentation is over, so the view goes back
  // to its own framing rather than leaving the visitor where the tour parked.
  frame(false);
  invalidateUIObstacles();
  if(openInfo)panel('info-panel',true);
  invalidate();
}
// The lens readout speaks photographer: the 35 mm-equivalent focal length
// (24 mm frame height) of the tour camera's vertical field.
function updateLensReadout(){
  $('#walk-lens-value').textContent=`≈ ${Math.round(12/Math.tan(THREE.MathUtils.degToRad(walk.camera.fov)/2))} mm`;
}
function enterWalk(roomId) {
  pendingRoomJump.cancel();
  if (!walk || !ready) return;
  const floor=selected.startsWith('f')?Number(selected[1]):1;
  const stations=walk.surface.data.stations.filter(s=>s.floor_index===floor);
  if(!stations.length)return;
  const centre=buildingBox.getCenter(new THREE.Vector3());
  const position=roomId?null:walk.surface.center(floor,[centre.x,centre.z],furnitureVisible);
  roomId ||= stations.reduce((a,b)=>new THREE.Vector3(...a.position).distanceToSquared(centre)<new THREE.Vector3(...b.position).distanceToSquared(centre)?a:b).room_id;
  flight.cancel();panel('',false);photoViewer?.hide();const station=walk.enter(roomId,position);selected='f'+station.floor_index;updateRoomUI(station);
  quality?.applyView(selected,{walking:true});
  nativeDelivery?.setWalkMode(true,selected);
  lighting.interior(station.floor_index,station.position);
  ensureRoomProbe(station.floor_index);
  controls.enabled=false;clip.constant=fullHeight;earthClip.constant=fullHeight;transition=null;lighting.frame('building');massing?.set('building');
  lighting.setWalkInterior(true);
  // after the section plane is raised, or canRun() reads the previous cut
  lift?.setWalkActive(true);lift?.setWalkFloor(station.floor_index);refreshLiftControl();
  regionMap?.hide();
  for (const o of plantingAboveCut) o.visible = true;   // the walk raises the cut
  $('#app').dataset.walk='true';$('.camera-tools').hidden=true;$('#walk-tools').hidden=false;$('#enter-walk').hidden=true;
  $('#walk-room').value=station.room_id;
  $('#walk-lens').value=Math.round(walk.camera.fov);updateLensReadout();
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===selected));
  $('#gesture-help').textContent=t('walkHelp');
  resize();invalidate();
}
function exitWalk(reselect = true) {
  pendingRoomJump.cancel();
  if(!walk?.active)return;
  walk.leave();controls.enabled=true;$('#app').dataset.walk='false';
  quality?.applyView(selected,{walking:false,plan:planMode});
  nativeDelivery?.setWalkMode(false,selected);
  lighting.setWalkInterior(false);
  lighting.interior(null,null);
  lift?.setWalkActive(false);lift?.cancel();refreshLiftControl();
  $('.camera-tools').hidden=false;$('#walk-tools').hidden=true;$('#enter-walk').hidden=false;
  planMode=false;$('#toggle-plan').setAttribute('aria-pressed',false);$('#toggle-plan').textContent='Plan';mode(false);
  if(reselect){selectView(selected);frame(false);}
  $('#gesture-help').textContent=t('orbitHelp');
}
// R47 | One honest bar and four named steps, from the first byte to the
// first drawn frame. The batched delivery used to show a single sentence for
// its whole boot - twenty-odd megabytes behind a spinner that never moved -
// which reads as a stall rather than as work. Every wait the visitor actually
// serves is now weighed into the same bar: the plan data, the model bytes
// (by their manifest sizes, so the big parts count for what they cost), the
// light, the scene assembly, the shader compile and the first composed frame.
// Nothing creeps and nothing is faked; when it reaches the end the model is
// already on screen and the boot screen leaves immediately.
async function loadNativeModel(manifest){
  const loadStarted=performance.now();
  const PHASE={data:.06,model:.62,light:.10,scene:.10,view:.12};
  let bootBase=0;
  const phase=(name,fraction=1)=>progress(Math.min(1,bootBase+PHASE[name]*fraction));
  const phaseDone=name=>{bootBase+=PHASE[name];progress(bootBase);};
  step('model');message(t('loadingData'));progress(0);
  const lightingReady=Promise.all([
    lighting.loadEnvironment(daylightURL.href),
    // Task 2.1-c: with the progressive loader the four storey probes stop
    // riding the boot; each loads on its floor's first visit (ensureRoomProbe).
    manifest.room_probes?.length
      ?(FEATURES.progressiveLoaderV2
        ?Promise.resolve(lighting.setRoomReflections(roomProbes=createLazyRoomReflections(renderer,manifest.room_probes,modelRoot)))
        :loadRoomReflections(renderer,manifest.room_probes,modelRoot).then(value=>lighting.setRoomReflections(value)))
      :Promise.resolve()
  ]);
  // Keep early network failures handled while model workers are still busy;
  // the awaited promise below still reports the original failure to boot.
  lightingReady.catch(()=>{});
  const electricReady=Promise.all((manifest.electric_light??[]).map(async descriptor=>({
    ...descriptor,texture:await new THREE.TextureLoader().loadAsync(new URL(descriptor.file+'?v='+descriptor.sha256.slice(0,12),modelRoot).href)
  }))).then(entries=>{if(entries.length)lighting.setElectricLight(createElectricLighting(entries));});
  const groundLightReady=Promise.all([['ground_light','setGroundLight'],['floor_light','setFloorLight']].map(async([key,setter])=>{
    const descriptor=manifest[key];if(!descriptor)return;
    const texture=await new THREE.TextureLoader().loadAsync(new URL(descriptor.file+'?v='+descriptor.sha256.slice(0,12),modelRoot).href);
    lighting[setter](createGroundLight(texture,descriptor));
  }));
    async function json(file){const response=await fetch(new URL(file,modelRoot),{cache:'no-cache'});if(!response.ok)throw Error(file+' HTTP '+response.status);
      if(!file.endsWith('.gz'))return response.json();
      // Pages serves .gz bytes raw; the dev server negotiates Content-Encoding
      // and hands them over already inflated. The magic bytes decide.
      const bytes=new Uint8Array(await response.arrayBuffer());
      return JSON.parse(new TextDecoder().decode(bytes[0]===0x1f&&bytes[1]===0x8b?gunzipSync(bytes):bytes));}
    // Task 2.1-b: the scene JSONs ship gzipped next to their originals
    // (1.17 MB -> 291 KB); a missing .gz falls back to the plain file so a
    // stale deploy can never fail the boot.
    async function gzJson(file){
      if(!FEATURES.gzipSceneJson||typeof file!=='string'||!file.endsWith('.json'))return json(file);
      try{return await json(file+'.gz');}catch{return json(file);}
    }
  const [atlas,rooms,navigation,soil]=await Promise.all([gzJson(manifest.sections),gzJson(manifest.rooms),gzJson(manifest.navigation),manifest.soil_section?gzJson(manifest.soil_section):null]);
  if(navigation.source_native_sha256!==manifest.source_native_sha256)throw Error('Native navigation revision mismatch');
  phaseDone('data');
  nativeAtlas=atlas;roomData=rooms;walkData=navigation;
  $('#app').dataset.delivery='native';
  flight.limitFrameStep=false;
  if(manifest.plot_boundary){const boundary=await gzJson(manifest.plot_boundary);plotMask=createPlotMaterialMask(boundary.polygon_native_xy);}
  // Byte weighting where the manifest records sizes, part counting where it
  // does not - a two-hundred-kilobyte garden must not step the bar as far as
  // an eight-megabyte neighbourhood.
  const parts=manifest.parts??[];
  const sizes=new Map(parts.map(part=>[part.name,part.bytes||0]));
  const weighed=[...sizes.values()].some(value=>value>0);
  const totalWeight=weighed?[...sizes.values()].reduce((sum,value)=>sum+value,0):parts.length;
  const received=new Map();
  message(t('loadingModel'));
  nativeDelivery=createNativeDelivery({manifest,root:modelRoot,scene,groups,load:loadAsset,features:FEATURES,
    onAcquired:(name,model)=>{if(contactBake?.bakeLate&&contactBake.bakeLate(model))invalidate();},
    // FAZ 6 İŞ B: analytic drift is a desktop spend until H1 measures a
    // phone; the flag stays honest (?features=proceduralDetailV1:0 = zero
    // trace) while the tier gate keeps every mobile tier on the old bytes.
    proceduralDetail:{enabled:FEATURES.proceduralDetailV1&&quality.tier.startsWith('desktop'),octaves:2,interior:false},
    onProgress:(name,loaded,complete)=>{
      if(!sizes.has(name))return;
      const size=sizes.get(name);
      received.set(name,weighed?(complete?size:Math.min(loaded,size||loaded)):(complete?1:0));
      let done=0;for(const value of received.values())done+=value;
      phase('model',totalWeight?done/totalWeight:1);
    },
    releaseMaterial:m=>lighting.releaseMaterial(m),prepare:(o,{clipped,context,name})=>{
      o.renderOrder=5;lighting.prepareMesh(o,{clipped,context,name});
      const planes=clipped?[clip]:[];o.userData.clipPlanes=planes;
        for(const material of Array.isArray(o.material)?o.material:[o.material]){material.clippingPlanes=planes;material.clipShadows=true;if(material.aoMap)material.aoMapIntensity=.7;if(name==='garden'||name==='context-plants'||(manifest.batched&&context))plotMask?.apply(material,{alwaysOutside:name==='context-buildings',cutInsidePlot:name==='context-ground'||name==='garden'});}
    }});
    await nativeDelivery.activate(selected==='building'?'f3':selected);
    phaseDone('model');
    step('light');message(t('loadingLight'));
    await Promise.all([groundLightReady,electricReady]);
    phaseDone('light');
    // Task 1.2-b withdrawn: a shadow-only proxy cannot exist in r180 -
    // WebGLShadowMap culls casters with the BEAUTY camera's layers, so a
    // layer the main camera never draws never reaches the depth map either.
    // The scene's own meshes cast instead (event-driven, cached map), and
    // manifest.shadow_proxy is no longer fetched.
    if(manifest.batched){loader.dracoLoader?.dispose();loader.ktx2Loader?.dispose();}
    host.dataset.deliveryStats=JSON.stringify({profile:manifest.profile??'legacy',decodeAndPrepareMs:Math.round(performance.now()-loadStarted),residentParts:nativeDelivery.loaded.size});
  step('scene');message(t('loadingScene'));
  buildingBox=new THREE.Box3().setFromObject(groups.get('architecture'));
  gardenBox=new THREE.Box3().setFromObject(groups.get('garden'));contextBox=buildingBox.clone();
  lighting.setShadowBounds(buildingBox,gardenBox);
  for(const model of groups.values())contextBox.union(new THREE.Box3().setFromObject(model));
  if(manifest.site_context){
    const data=await gzJson(manifest.site_context);siteContext=createSiteContext(data,host,()=>selectView('building'));
    $('#context-count').textContent=`${data.buildings.length} yapı`;
  }
  phase('scene',.4);
  fullHeight=buildingBox.max.y+2;
  const movingSections=manifest.batched?await json('../../native-current/transition-sections.json.gz'):null;
  caps=createWallCaps(atlas,movingSections);scene.add(caps.group);
  if(soil){nativeSoil=createNativeSoilSection(soil);nativeSoil.userData.height=soil.height;scene.add(nativeSoil);}
  annotations=createAnnotations(rooms,host);scene.add(annotations.group);
  walk=new InteriorWalk(navigation,renderer.domElement,invalidate);scene.add(walk.rig);
  lighting.setFixtures(navigation.lights,{allRooms:true});hotspots=createHotspots(host,walk,travelRoom);
  fillRoomMenu();
  locator=createWalkLocator(walk.surface,{minX:buildingBox.min.x+1,maxX:buildingBox.max.x-1,minZ:buildingBox.min.z+1,maxZ:buildingBox.max.z-1});
  phaseDone('scene');
  step('view');message(t('loadingView'));
  await lightingReady;
  phase('view',.3);
  lighting.frame(selected==='building'?'f3':selected,contextBox);
  await lighting.compile(camera);
  phase('view',.75);
  ready=true;document.querySelectorAll('[data-needs-model],#toggle-furniture,#toggle-rooms,#toggle-measurements,#toggle-photos,#enter-walk').forEach(b=>b.disabled=false);
  await selectView(selected,true);lighting.render(camera);
  phaseDone('view');step(null);status.hidden=true;
  host.dataset.deliveryStats=JSON.stringify({...JSON.parse(host.dataset.deliveryStats),readyMs:Math.round(performance.now()-loadStarted)});
  // The frame behind it is already drawn, so the screen leaves at once and
  // fades rather than sitting on a full bar waiting to be dismissed.
  $('#app').append(status);
  const boot=$('#boot');
  if(boot){boot.classList.add('boot-done');setTimeout(()=>boot.remove(),460);}
  delete $('#app').dataset.booting;
  // Task 1.3: the repository's own tileable detail maps (1.2 MB of real
  // texture the delivery stopped shipping) revive off the critical path.
  // Until they arrive the atlas look stands; on arrival the grid=1 hero
  // materials rebind and recompile once, during idle.
  if(FEATURES.exteriorGradeRevival){
    const idle=window.requestIdleCallback?.bind(window)??(fn=>setTimeout(fn,1500));
    // The promise is exposed so a QA capture can await the rebind instead of
    // racing the idle callback - a screenshot half a second either side of
    // the revival is two different images.
    window.__angoraGradeReady=new Promise(resolve=>idle(()=>{
      loadGradeTextures(new URL(pages?'assets/textures/':'textures/',publicRoot))
        .then(textures=>{
          const applied=reviveBatchedGrade(nativeDelivery.loaded,textures,
            {anisotropy:Math.min(quality.value.anisotropy,renderer.capabilities.getMaxAnisotropy())});
          if(applied){renderer.shadowMap.needsUpdate=true;invalidate();}
          console.info('Exterior grade revived on '+applied+' materials');
          resolve(applied);
        })
        .catch(error=>{console.warn('Exterior detail maps unavailable',error);resolve(0);});
    }));
  }
  // Task 3.4d: the source pipeline's own KTX2 occlusion bakes (4×the WebP
  // texel) rebind on idle, desktop only - a phone keeps its WebP and its
  // bytes. Exposed like __angoraGradeReady so a capture can await the swap.
  if(FEATURES.bakedAoRevival&&manifest.batched&&quality.tier.startsWith('desktop')){
    const idle=window.requestIdleCallback?.bind(window)??(fn=>setTimeout(fn,1500));
    window.__angoraAoReady=new Promise(resolve=>idle(()=>{
      const ktx2=createTextureLoader(renderer,1);
      reviveBakedOcclusion(nativeDelivery.loaded,{loader:ktx2,root:new URL('../../native-current/',modelRoot)})
        .then(applied=>{ktx2?.dispose();if(applied)invalidate();console.info('Baked occlusion revived on '+applied+' materials');resolve(applied);})
        .catch(error=>{ktx2?.dispose();console.warn('KTX2 occlusion bakes unavailable',error);resolve(0);});
    }));
  }
  // Task 3.3 (runtime half): the atlas cells move into texture-array layers
  // on idle - one recompile per batched material, then true wrapping, full
  // mips and anisotropy at the same texel count. Exposed for QA like the
  // other idle upgrades so captures never race the swap.
  if(FEATURES.atlasArrayV2&&manifest.batched){
    const idle=window.requestIdleCallback?.bind(window)??(fn=>setTimeout(fn,1500));
    window.__angoraAtlasReady=new Promise(resolve=>idle(()=>{
      try{
        const applied=upgradeAtlasToArrays(nativeDelivery.loaded);
        if(applied)invalidate();
        console.info('Atlas arrays upgraded on '+applied+' materials');resolve(applied);
      }catch(error){console.warn('Atlas array upgrade failed; textureLod path retained',error);resolve(0);}
    }));
  }
  // FAZ 6 İŞ C: contact darkening. Joins the SAME idle queue and explicitly
  // waits for the other idle upgrades (BÖLÜM 3: onların önüne geçme); the
  // deferred interior bakes late against the same occupancy grid.
  if(FEATURES.runtimeVertexAO&&manifest.batched){
    window.__angoraContactReady=Promise.all([
      window.__angoraGradeReady??0,window.__angoraAoReady??0,window.__angoraAtlasReady??0,
    ]).then(()=>bakeContactOcclusion(nativeDelivery.loaded,
      // BÖLÜM 3: telefonda 8-12 ışın, kalite masaüstünde artar.
      {rays:quality.tier.startsWith('desktop')?16:10})).then(result=>{
      contactBake=result;
      if(result.materials)invalidate();
      console.info('Contact AO baked: '+result.vertices+' vertices / '+result.meshes+' meshes / '+result.materials+' materials');
      return result;
    }).catch(error=>{console.warn('Contact AO unavailable',error);return null;});
  }
  // The property card greets a plain entry here too. It used to be raised
  // only on the classic path, which this one returns before ever reaching -
  // so on the delivered build nobody was ever offered the tour.
  let welcomeSeen=false;
  try{welcomeSeen=sessionStorage.getItem('angora-welcome')==='1';}catch{/* private mode */}
  if(!openedWithView&&!welcomeSeen)$('#welcome').hidden=false;
}
async function loadModel() {
  if (loading || ready || !renderer) return;
  loading = true; host.dataset.loaded = 'false';
  // Clear any bar left by a failed attempt before the manifest is back.
  progress(null);
  message(t('loadingAll'));
  const staged = new Map(), stagedClips = new Map();
  try {
    // Phones get the derived mobile set (simplified geometry, 512px webp,
    // no relief maps): the full 4M-triangle delivery is a desktop budget
    // and WebKit gives up mid-upload. ?model=full / ?model=lite override.
    const forcedModel=new URLSearchParams(location.search).get('model');
    const nativeRoot=!/\/full\/$/.test(modelRoot.pathname);
    let response = LITE&&!nativeRoot
      ? await fetch(new URL('manifest-mobile.json', modelRoot), {cache:'no-cache'}).catch(() => null)
      : forcedModel==='classic'
      ? await fetch(new URL('manifest-classic.json', modelRoot), {cache:'no-cache'}).catch(() => null)
      : null;
    if (!response?.ok) response = await fetch(new URL('manifest.json', modelRoot), {cache:'no-cache'});
    if (!response.ok) throw Error(`Manifest HTTP ${response.status}`);
    const manifest = await response.json();
    if(manifest.parts&&manifest.interior_streams){await loadNativeModel(manifest);return;}
    assetRevision=manifest.assets?.map(({file,sha256})=>({file,sha256}));
    // A whole scene may arrive as any number of parts, but the three groups
    // the pipeline stages - villa, garden, context - must all be covered.
    // Entries name their group (kanka set) or ARE the group (classic set).
    const groupsInManifest=new Set((manifest.assets??[]).map(a=>a.group??a.id));
    if (!manifest.full_scene || manifest.geometry_preclipped ||
        !['villa','garden','context'].every(g=>groupsInManifest.has(g))) throw Error('Whole-scene manifest required');
    // R42: the whole scene before the first frame. It used to open on the villa
    // alone and stream the garden and the neighbourhood in behind it, which is
    // quicker to something but slower to the thing that was asked for - the
    // house stood on nothing for a moment, the ground arrived under it, then
    // the street. "hepsini yükle öyle aç." Everything is downloaded and staged
    // before the bar goes, and the order still reveals the building outside-in
    // for whoever is watching the count.
    const PHASE_ORDER=['villa','garden','context'];
    const queue=manifest.assets.slice().sort((a,b)=>PHASE_ORDER.indexOf(a.group??a.id)-PHASE_ORDER.indexOf(b.group??b.id));
    let completed = 0;
    const totalBytes = manifest.assets.reduce((sum, asset) => sum + (asset.bytes || 0), 0) + (manifest.section_cap_asset?.bytes || 0);
    const received = new Map();
    // ONE percent bar for the whole boot. "model yüklendi, sonra bekletiyor.
    // öyle şey mi olur? o da yüzdelik yüklemenin bir parçası olmak zorunda."
    // Downloads earn 0-70 %; staging, the wash build, assembly, the shader
    // compile, the cap pre-pass and the five warming renders earn the rest,
    // each stepping the same bar. The ledger is per-call so a retry restarts
    // clean, and every synchronous phase yields once so its width paints.
    const PHASE={download:.70,stage:.04,wash:.02,assemble:.02,compile:.08,caps:.02,prewarm:.10,finish:.02};
    step('model');
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
        // A compressed response reports fewer bytes than the manifest records,
        // so the manifest size stays the denominator and caps each part.
        const gltf = await loadAsset(url.href, event => {
          received.set(asset.id, Math.min(event.loaded, asset.bytes || event.loaded));
          reportProgress();
        });
        received.set(asset.id, asset.bytes || 0);
        // Before the merge, so copies that differed only in transmission
        // collapse to one program instead of surviving as separate compiles.
        neutraliseTransmission(gltf.scene);
        // A carve-flagged asset marks its MATERIALS: the batcher rebuilds
        // meshes but keeps their material instances, so the flag survives
        // into stageGroup where the excavation planes are assigned.
        if (asset.carve_plot) gltf.scene.traverse(o=>{
          if(!o.isMesh)return;
          for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)m.userData.carvePlot=true;
        });
        // Photo-graded exterior scalars, before the merge so numbered copies
        // still collapse and the signature hashes graded values.
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
        const gltf = await loadAsset(url.href, event => {
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
        // The garden's ground, paving, steps and walls sweep with the building
        // cut - they are the section's own subject. Its PLANTING does not:
        // "arka bahçedeki ağaçları kesme!!!" A tree is not a wall, and a plan
        // that beheads the spruces while the neighbours' stand whole a metre
        // away reads as damage rather than as a drawing. Of the context only
        // the plot's own soil is cut, by the snap plane, so the neighbourhood
        // and roads stay whole and the authored cap always fits.
        const planting=id==='garden'&&PLANTING.test(authoredNodeName(o.name));
        if(planting)plantingCandidates.push(o);
        const materials=Array.isArray(o.material)?o.material:[o.material];
        const planes=planting?[]:building||id==='garden'?[clip]
          :materials.some(m=>m?.userData.plotSoil)?[earthClip]
          :materials.some(m=>m?.userData.carvePlot)?plotCarvePlanes:[];
        lighting.prepareMesh(o,{clipped:planes[0]===clip,context:!building});
        // The neighbourhood is setting, not subject: screen-space occlusion on
        // the white massing reads as grime in its eaves, so the context sits
        // outside the AO pass entirely - and outside the villa's section
        // planes, so changing floor never cuts the neighbours down.
        if(id==='context')o.userData.aoExcluded=true;
        o.userData.clipPlanes=planes;
        if (planes.length) for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          m.clippingPlanes = planes; m.side = THREE.DoubleSide;
          // The carve set is a region (all five planes at once), not a union.
          m.clipIntersection = planes === plotCarvePlanes;
        }
      });
    }
    // On lite devices the second download worker is a resolved no-op so the
    // settled results keep their positions - they are read by index below.
    const wantsGrade = manifest.assets.some(a => a.exterior_grade);
    const results = await Promise.allSettled([worker(queue), LITE?Promise.resolve():worker(queue), loadSections(), loadRooms(), loadNavigation(),
      lighting.loadEnvironment(daylightURL.href).catch(error=>console.warn('HDR unavailable; atmospheric daylight retained',error)), loadCaps(),
      wantsGrade ? loadGradeTextures(new URL(pages ? 'assets/textures/' : 'textures/', publicRoot)) : Promise.resolve(null)]);
    const failure = results.slice(0, 7).find(r => r.status === 'rejected'); if (failure) throw failure.reason;
    phaseDone('download');
    // Detail maps bind before staging so program identity is settled before
    // compile/prewarm, and the anisotropy pass configures them for free. A
    // failed fetch keeps the scalar grades and the authored placeholders.
    if (results[7].status === 'rejected') console.warn('Exterior detail maps unavailable', results[7].reason);
    bindGradeTextures([...staged.values()], results[7].status === 'fulfilled' ? results[7].value : null);
    // Several files may feed one pipeline group (kanka: BUILDING+INTERIOR are
    // the villa; evrebina+ground are the context). A file flagged furniture
    // tags every mesh wholesale, so the Mobilya toggle, the paper wash and
    // the shadow twin treat it exactly like the merged set's furniture.
    const mergedGroups=new Map();
    for (const {group, furniture, scene: part} of staged.values()) {
      if (furniture) part.traverse(o=>{if(o.isMesh)o.userData.category='furniture';});
      if (!mergedGroups.has(group)) {const g=new THREE.Group(); g.name=group; mergedGroups.set(group,g);}
      mergedGroups.get(group).add(part);
    }
    {
      let stagedCount=0;step('scene');
      for (const [id, group] of mergedGroups) {stageGroup(id, group); phase('stage', ++stagedCount/mergedGroups.size); await tick();}
      phaseDone('stage');
    }
    // every glb is decoded and staged; the draco workers' wasm heaps are the
    // largest transient allocation on a phone - give them back now (retry is
    // a full page reload, so the loader is never reused)
    loader.dracoLoader?.dispose();
    {
      // ground truth for the f0 planting rule: the plot soil under each plant
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
      // The plan drawing's paper wash, for PLAN MODE ONLY: the surroundings
      // sink under 80 % white and the villa's own interior under 30 %, so the
      // cut walls and the rooms carry the drawing ("etraf yüzde 80, içerisi
      // yüzde 30"). The 3D floor views stay exactly as modelled.
      // Each wash renders as ONE layer - a depth-only prepass keeps the
      // nearest surface, the white overlay paints where that depth matches -
      // so stacked slabs cannot thicken the veil. transparent:true keeps the
      // prepass in the transparent pass, after the real glazing has blended.
      // A wash mesh must vanish exactly where its source is clipped away, so
      // material pairs are made per clipping signature.
      planWash=new THREE.Group();planWash.name='Plan paper wash';planWash.visible=false;
      planWash.userData={level:0,overlays:[]};
      const planeIds=new Map(),variants=new Map();
      const idOf=plane=>{if(!planeIds.has(plane))planeIds.set(plane,planeIds.size);return planeIds.get(plane);};
      const washFor=(planes,intersection,base)=>{
        const key=`${base}|${intersection?'i':'u'}|${(planes??[]).map(idOf).join(',')}`;
        if(!variants.has(key)){
          // clipIntersection travels with the planes: the plot carve is a
          // five-plane REGION, and a union reading of it would clip the wash
          // across the whole settlement.
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
      // \u00a713: cutting storeys away for viewing must not silently
      // re-light the house. A shadow-only twin of the villa's architecture
      // lives on layer 1 - the main camera never draws it, every shadow
      // camera does - so the WHOLE building keeps shading the garden, the
      // terraces and the open floor even while upper storeys are hidden.
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
      const {atlasMeta}=await import('./region-map.js');
      $('#context-count').textContent=`${contextData.buildings.length} ${t('buildingsWord')} · ${atlasMeta()}`;
    } catch(error){console.warn(error);$('#context-count').textContent=(await import('./region-map.js')).atlasMeta();}
    // The neighbourhood is in by now, so its bounds, its horizon fade and its
    // white massing are set up here rather than in a continuation that used to
    // run after the first frame.
    if(groups.has('context')){
      contextBox.union(new THREE.Box3().setFromObject(groups.get('context')));
      prepareContextSurfaces(groups.get('context'),lighting.horizonColour);
      massing=createContextMassing(groups.get('context'));
      // Task 3.4f: rebuild the sky probe with the settlement's own mass in
      // it, so glazing reflects the neighbourhood silhouette. One-time cost;
      // no-op while FEATURES.probeMassing is off.
      if(FEATURES.probeMassing&&lighting.setEnvironmentMassing(probeMassingFrom(groups.get('context'))))invalidate();
    }
    fullHeight = buildingBox.max.y + 2;
    caps = createWallCaps(results[2].value); scene.add(caps.group);
    const capScene=results[6].status==='fulfilled'?results[6].value:null;
    if (capScene) {soilCap = createSoilCap(capScene); if (soilCap) scene.add(soilCap.group);}
    roomData=results[3].value;annotations=createAnnotations(roomData,host);scene.add(annotations.group);
    walk = new InteriorWalk(results[4].value,renderer.domElement,invalidate);scene.add(walk.rig);
    // the villa box includes roof eaves; the walls sit about a metre inside
    // it, so the outdoor test insets by that much or garden ground under an
    // eave would still count as "inside the house"
    locator=createWalkLocator(walk.surface,{minX:buildingBox.min.x+1,maxX:buildingBox.max.x-1,
      minZ:buildingBox.min.z+1,maxZ:buildingBox.max.z-1});
    lighting.setFixtures(results[4].value.lights);hotspots=createHotspots(host,walk,travelRoom);
    lift=createLift({groups,clips:stagedClips.get('villa')??[],clipPlane:clip,fullHeight,
      shadowsDirty:()=>{renderer.shadowMap.needsUpdate=true;},onSettled:()=>refreshLiftControl()});
    refreshLiftControl();
    walkData=results[4].value;
    fillRoomMenu();
    // Everything the first tap used to pay for is paid for here, behind the
    // progress bar. A storey button used to hand the driver a few hundred
    // programs to build at the moment it was pressed - the villa is only ever
    // drawn whole until then - and the cut animation ran on top of the
    // compile, which is what made the first Bodrum or Çatı crawl and every
    // one after it fine. Compiling first costs the load a beat and gives the
    // interface back a press that opens immediately.
    phaseDone('assemble'); await tick();
    step('view');message(t('loadingView'));
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
    // One honest step: compileAsync is a single promise with no inner
    // progress, and a fake creep would lie about it.
    phaseDone('compile');
    ready = true;
    $('#toggle-furniture').disabled = false; setFurnitureVisible(furnitureVisible);
    $('#toggle-rooms').disabled = false; $('#toggle-measurements').disabled = false;
    $('#toggle-photos').disabled = false;
    $('#enter-walk').disabled=false;
    document.querySelectorAll('[data-needs-model]').forEach(b=>b.disabled=false);
    // Offered, never imposed: if the device answers for WebXR the welcome card
    // grows a third choice, and taking it puts the visitor inside the house on
    // their feet before the session opens. Declining it - or closing the card -
    // leaves the viewer exactly as it is on a screen.
    enableImmersiveWalk(renderer,scene,walk,groups,()=>{
      $('#welcome').hidden=true;
      try{sessionStorage.setItem('angora-welcome','1');}catch{/* private mode */}
      if(!walk.active)enterWalk();
    },()=>{resize();invalidate();},shiftWalkFloor);
    // Build each storey's cut geometry once, here, rather than on the frame
    // that first shows it: four heights, four slices, and the allocation and
    // the triangulation upload are behind us.
    for (const view of ['f0','f1','f2','f3']) caps.update(sectionHeight(view, fullHeight), true);
    // "bastığım zaman anında kullanabileyim": every storey changes the set of
    // live lights, and a changed light set means recompiled shaders - the
    // freeze the floor buttons used to carry. So while the boot screen is
    // still up, each state is rendered once: every program, shadow pass and
    // cap the floor buttons can ever ask for is already warm.
    phaseDone('caps');
    message(t('preparing'));
    await new Promise(resolve=>setTimeout(resolve,0));
    // A warming render frustum-culls, and compile() gathers a light set no
    // real view uses - both leave programs for the first real floor click.
    // So culling is switched off for these five renders: every mesh passes
    // through the program path against each state's true lights. The boot
    // screen covers the canvas, so nothing of this is seen.
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
      // The fixture slots FADE to a selection: light.visible only flips once
      // update() walks the fade, so a render straight after select() races it
      // and can compile a zero-light variant instead of the floor's real one
      // (which floor stayed cold varied run to run). A far-future step snaps
      // both fade phases before the warming render.
      lighting.update(performance.now()+60000);
      // plan mode's paper wash compiles alongside one storey's state
      if(planWash&&id==='f1'){planWash.visible=true;for(const over of planWash.userData.overlays)over.opacity=over.userData.washBase;}
      renderer.shadowMap.needsUpdate=true;
      lighting.render(camera);
      if(planWash&&id==='f1'){planWash.visible=false;for(const over of planWash.userData.overlays)over.opacity=0;}
      phase('prewarm',(WARM.indexOf(id)+1)/WARM.length);
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    phaseDone('prewarm');
    for(const o of culled)o.frustumCulled=true;
    // Sun only: daylight is what the cut falsifies. Fixture shadow passes
    // keep their old cost, so walk-mode light fades stay as cheap as before.
    scene.traverse(o=>{if(o.isDirectionalLight&&o.shadow)o.shadow.camera.layers.enable(1);});
    renderer.shadowMap.needsUpdate=true;
    selectView(selected, true);
    // One composed frame before the bar goes: the occlusion, antialias, bloom,
    // grade and dither passes compile on their first use like anything else.
    lighting.render(camera);
    phaseDone('finish');
    step(null);
    status.hidden = true;
    // the boot screen has done its real work; the interface fades in behind it
    const boot=$('#boot');
    if(boot){
      $('#app').append($('#load-status'));
      boot.classList.add('boot-done');
      setTimeout(()=>boot.remove(),460);
    }
    delete $('#app').dataset.booting;
    // \u00a77: a plain entry greets with the property card - identity, the
    // verified facts, one clear action. Deep links land untouched, and the
    // card returns for every fresh tab so demonstrations open on it.
    let welcomeSeen=false;
    try{welcomeSeen=sessionStorage.getItem('angora-welcome')==='1';}catch{/* private mode */}
    if(!openedWithView&&!welcomeSeen)$('#welcome').hidden=false;
  } catch (error) {
    nativeDelivery?.dispose();nativeDelivery=null;
    for (const group of staged.values()) {scene.remove(group); dispose(group);}
    groups.clear();
    message('Model yüklenemedi. Bağlantını kontrol edip tekrar deneyebilirsin.', true);
    console.error('Model load failed: '+(error?.stack??error?.message??String(error)));
  } finally {loading = false;}
}
// Zoom must not move the camera. This used to fly to controls.minPolarAngle, so
// every tap on + or - also tilted the view back to its flattest angle and the
// building appeared to shift under you. Only the zoom changes now.
function zoom(factor){
  if(!ready||selected==='neighborhood')return;
  camera.zoom=THREE.MathUtils.clamp(camera.zoom*factor,controls.minZoom,controls.maxZoom);
  camera.updateProjectionMatrix();invalidate();
}
function setAutoRotate(value) {
  if(!controls)return;
  // The neighbourhood turns on request; during the narrated tour the tour
  // decides, so the villa may turn as well.
  controls.autoRotate=Boolean(value&&(selected==='neighborhood'||guidedTour?.active));
  // A quarter-speed orbit is right for an idle street view and invisible
  // over a six-second sentence, so the tour turns at its own pace.
  controls.autoRotateSpeed=guidedTour?.active?.45:.25;
  $('#toggle-auto-rotate').setAttribute('aria-pressed',String(controls.autoRotate));
  if(controls.autoRotate)invalidate();
}
function mode(pan) {
  controls.touches.ONE = pan ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
  controls.mouseButtons.LEFT = pan ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
  $('#rotate-mode').setAttribute('aria-pressed', !pan); $('#pan-mode').setAttribute('aria-pressed', pan);
  $('#gesture-help').textContent = t(pan?'panHelp':'orbitHelp');
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
  // Task 1.5: the door opens at golden hour under direct sun - noon-flat
  // light is the flattest the facade can look. A shared link still says
  // exactly what it wants; only the unspoken opening changes.
  if (FEATURES.cameraRigsV2) {
    if (shared.hour === undefined) $('#daylight-hour').value = 16.5;
    if (!shared.style) $('#lighting-style').value = 'sun';
  }
  for(const id of ['toggle-plan','reset-view','rotate-mode','pan-mode','zoom-in','zoom-out']){
    const button=$('#'+id);button.dataset.needsModel='';button.disabled=true;
  }
  document.querySelectorAll('[data-view]').forEach(b => {
    b.dataset.needsModel='';b.disabled=true;b.addEventListener('click', () => selectView(b.dataset.view));
  });
  $('#rotate-mode').onclick = () => mode(false); $('#pan-mode').onclick = () => mode(true);
  $('#zoom-in').onclick=()=>zoom(1.3);
  $('#zoom-out').onclick=()=>zoom(1/1.3);
  $('#reset-view').onclick=()=>{planMode=false;$('#toggle-plan').setAttribute('aria-pressed',false);$('#toggle-plan').textContent='Plan';mode(false);frame(false);}; $('#retry').onclick = loadModel;
  $('#lift-call').onclick=()=>{if(lift?.run(performance.now())){refreshLiftControl();invalidate();}};
  $('#toggle-furniture').onclick = () => setFurnitureVisible(!furnitureVisible);
  $('#toggle-rooms').onclick = () => {
    roomNamesVisible = !roomNamesVisible; $('#toggle-rooms').setAttribute('aria-pressed', roomNamesVisible); invalidate();
  };
  $('#toggle-measurements').onclick = () => {
    measurementsVisible = !measurementsVisible; $('#toggle-measurements').setAttribute('aria-pressed', measurementsVisible); invalidate();
  };
  // The pins and the frame are pure interface - they need the host element and
  // the drawing's own coordinates, nothing from the delivery - so they are
  // built here and only the switch waits for the model.
  // Task 4.2: the photo layer (gallery + 11 KB of point data) rides an idle
  // import; every later use already guards with photoViewer?./photoPins?..
  {
    const idle=window.requestIdleCallback?.bind(window)??(fn=>setTimeout(fn,1200));
    idle(async()=>{
      const [gallery,points]=await Promise.all([import('./photo-gallery.js'),import('./photo-points.js')]);
      photoPoints=points;
      photoPins = gallery.createPhotoPins(host, photoRoot, {onOpen: id => {photoViewer.show(id); invalidate();}});
      photoViewer = gallery.createPhotoViewer({
        dock: $('#photo-dock'), figure: $('#photo-view'), image: $('#photo-image'), caption: $('#photo-caption'),
        close: $('#photo-close'), backdrop: $('#photo-backdrop'), pins: photoPins,
        onShow: () => {layoutOverlays(); reframeForOverlays(); invalidateUIObstacles();},
        onClose: () => {layoutOverlays(); reframeForOverlays(); invalidateUIObstacles();},
      });
      invalidate();
    });
  }
  // Switching the photographs off is also how an open frame is put away -
  // the brief asks for both that and the frame's own cross.
  $('#toggle-photos').onclick = () => {
    photosVisible = !photosVisible; $('#toggle-photos').setAttribute('aria-pressed', photosVisible);
    if (!photosVisible) photoViewer?.hide();
    invalidate();
  };
  $('#enter-walk').onclick=()=>enterWalk();$('#exit-walk').onclick=()=>exitWalk();
  $('#walk-room').onchange=event=>travelRoom(event.target.value);
  $('#toggle-plan').onclick=()=>{planMode=!planMode;$('#toggle-plan').setAttribute('aria-pressed',planMode);$('#toggle-plan').textContent=planMode?'3D':'Plan';mode(planMode);quality?.applyView(selected,{plan:planMode});frame(false);};
  $('#region-summary').ontoggle=()=>{invalidateUIObstacles();invalidate();};
  $('#toggle-auto-rotate').onclick=()=>setAutoRotate(!controls.autoRotate);
  // A press takes the camera; merely moving the mouse does not. The idle
  // street orbit still yields to a move, but the tour's own turn would
  // otherwise stop the moment the visitor's hand crossed the window.
  window.addEventListener('pointermove',()=>{if(!guidedTour?.active)setAutoRotate(false);});
  host.addEventListener('pointerdown',()=>setAutoRotate(false));
  $('#open-options').onclick=()=>panel('options-panel',$('#options-panel').hidden);
  $('#open-info').onclick=()=>panel('info-panel',$('#info-panel').hidden);
  $('#open-floor').onclick=()=>panel('floor-panel',$('#floor-panel').hidden);
  document.querySelectorAll('[data-close-panel]').forEach(button=>button.onclick=()=>panel('',false));
  $('#daylight-hour').oninput=()=>{const hour=Number($('#daylight-hour').value);$('#daylight-time').textContent=clockLabel(hour);$('#daylight-hour').setAttribute('aria-valuetext',clockLabel(hour));lighting?.setTime(hour,Number($('#daylight-season').value));rememberState();invalidate();};
  $('#daylight-season').onchange=()=>{$('#daylight-hour').oninput();lighting?.requestShadowUpdate();invalidate();};
  // Task 1.2-c: the shadow map re-renders when the hand SETTLES on an hour
  // (change fires on release/keyup), never per drag tick.
  $('#daylight-hour').addEventListener('change',()=>{lighting?.requestShadowUpdate();invalidate();});
  $('#toggle-lights').onclick=()=>{interiorLights=!interiorLights;$('#toggle-lights').setAttribute('aria-pressed',interiorLights);lighting?.setLights(interiorLights);invalidate();};
  $('#lighting-style').onchange=e=>{lighting?.setStyle(e.target.value);rememberState();invalidate();};
  applyStatic();
  document.querySelectorAll('.lang-flag').forEach(button=>{
    button.onclick=()=>setLang(button.dataset.lang,refreshChrome);
  });
  markLanguage();
  const dismissWelcome=()=>{$('#welcome').hidden=true;try{sessionStorage.setItem('angora-welcome','1');}catch{/* private mode */}};
  $('#welcome-close').onclick=dismissWelcome;
  $('#welcome-explore').onclick=()=>{dismissWelcome();if(ready)selectView('f1');};
  $('#welcome-tour').onclick=()=>{dismissWelcome();startTour();};
  $('#start-tour').onclick=()=>{dismissWelcome();startTour();};
  $('#tour-exit').onclick=()=>endTour(false);
  // Touching the scene no longer ends the tour. The narration does not stop
  // for a camera, so looking around while it speaks is the point; the next
  // cue reframes and the visitor never loses their place.
  refreshTourLabels();
  // The tour's lens, draggable by hand; the readout speaks photographer -
  // the 35 mm-equivalent focal length of the chosen vertical field.
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
    photoOpen:photoViewer?.open!==null&&photoViewer?.open!==undefined,closePhoto:()=>photoViewer?.hide(),
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
// FAZ 0 QA harness: measurement and deterministic cameras, loaded only when
// the address asks for them (?stats=1 / ?camera=C0x). Without those keys this
// block imports nothing and the visitor path is untouched.
const qaQuery=new URLSearchParams(location.search);
if(qaQuery.get('stats')==='1'||qaQuery.get('camera')){
  import('./qa-harness.js').then(({installQaHarness})=>installQaHarness({
    host,query:qaQuery,
    hooks:{
      three:THREE,
      isReady:()=>ready,
      renderer:()=>renderer,scene:()=>scene,
      camera:()=>walk?.active?walk.camera:camera,
      controls:()=>controls,flight:()=>flight,
      lighting:()=>lighting,walk:()=>walk,
      quality:()=>quality,
      selected:()=>selected,
      enterWalk,exitWalk,invalidate,
      deliveryProfile,
      setPlan(on){
        if(planMode===on)return;
        planMode=on;$('#toggle-plan').setAttribute('aria-pressed',on);
        $('#toggle-plan').textContent=on?'3D':'Plan';mode(on);frame(false);
      },
    },
  })).catch(error=>console.warn('QA harness unavailable',error));
}
// ?debug=quality — the live state of the one quality decision, on screen,
// so a broken tier or a flag that silently failed to flip is seen during
// development instead of discovered in a measurement.
if(qaQuery.get('debug')==='quality'){
  const box=document.createElement('pre');
  box.style.cssText='position:fixed;left:8px;bottom:8px;z-index:99;background:rgba(20,26,24,.82);color:#d9f2e6;font:11px/1.5 ui-monospace,monospace;padding:8px 10px;border-radius:8px;pointer-events:none;margin:0';
  document.body.append(box);
  setInterval(()=>{
    const q=quality?.value;if(!q||!renderer)return;
    const frame=JSON.parse(host.dataset.frameStats??'{}');
    box.textContent=[
      `tier ${q.tier} · view ${q.view}`,
      `dynamicSunShadow ${q.dynamicSunShadow?'✓':'✗'}  postProcessing ${q.postProcessing?'✓':'✗'}`,
      `gtao ${q.gtao?'✓':'✗'}  bloom ${q.bloom?'✓':'✗'}  compactOutput ${q.compactOutput?'✓':'✗'}`,
      `batched ${q.batchedGeometry?'✓':'✗'}  bakedGI ${q.bakedIndirectLighting?'✓':'✗'}  receiverVis ${q.bakedReceiverVisibility?'✓':'✗'}`,
      `calls ${frame.drawCalls??'—'}  tris ${frame.triangles??'—'}  shadowMap ${renderer.shadowMap.enabled?'on':'off'}`,
      // Task 4.4: the two numbers the plan's overlay spec still missed. Both
      // come from the ?stats=1 harness when it is up; without it they stay
      // honest dashes rather than an estimate the estimator never made.
      (()=>{const report=window.__angoraQA?.report;
        return `p95 ${report?.frame?.p95FrameMs?.toFixed?.(1)??'—'} ms  gpuTex ${report?.memory?.estimatedTextureMiB??'—'} MiB  geo ${report?.memory?.estimatedGeometryMiB??'—'} MiB`;})(),
    ].join('\n');
  },500);
}
interfaceSound=createInterfaceSound({button:$('#toggle-sound')});
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
    .then(data=>{roomData=data;renderPropertyInfo($('#property-info'),data);}).catch(console.warn);
}
