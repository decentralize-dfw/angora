import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { configureCameraControls } from './camera.js';

const $ = s => document.querySelector(s);
const host = $('#viewport'), status = $('#load-status');
const remoteRoot = 'https://raw.githubusercontent.com/decentralize-dfw/angora/main/build/web/';
const publicRoot = new URL(import.meta.env.BASE_URL, document.baseURI);
const pages = import.meta.env.MODE === 'pages';
const modelRoot = new URL(pages ? 'build/web/' : 'models/', publicRoot);
const decoderRoot = new URL(pages ? 'viewer/public/draco/' : 'draco/', publicRoot);
let manifest, localManifest, selected = 'neighborhood', generation = 0;
let scene, camera, renderer, controls, activeGroup, frameSpan = 40, framePending = false;
let draco, loader, lastBox, frameHeight = 70;
const titles = {neighborhood:'Çevre', building:'Villa 21', f0:'Bodrum',f1:'Giriş katı',f2:'1. kat',f3:'Çatı katı'};

function message(text, error = false) {
  status.hidden = false; $('#load-message').textContent = text;
  $('#retry').hidden = !error; status.classList.toggle('error', error);
}
function dispose(group) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  group?.traverse(o => {if (!o.isMesh) return; geometries.add(o.geometry);
    for (const m of Array.isArray(o.material)?o.material:[o.material]) {
      materials.add(m); for(const v of Object.values(m)) if(v?.isTexture) textures.add(v);
    }
  });
  geometries.forEach(v=>v.dispose()); materials.forEach(v=>v.dispose());
  textures.forEach(v=>{v.source?.data?.close?.();v.dispose();});
}
function invalidate() {
  if (framePending || !renderer) return;
  framePending = true;
  requestAnimationFrame(() => {
    framePending = false;
    const changing = controls.update();
    renderer.render(scene,camera);
    if(changing) invalidate();
  });
}
function resize() {
  if(!renderer) return;
  const w=host.clientWidth,h=host.clientHeight,aspect=w/h;
  camera.left=-frameSpan*aspect/2; camera.right=frameSpan*aspect/2;
  camera.top=frameSpan/2; camera.bottom=-frameSpan/2;
  camera.updateProjectionMatrix(); renderer.setSize(w,h); invalidate();
}
function frame(box) {
  lastBox=box.clone(); const center=box.getCenter(new THREE.Vector3());
  const size=box.getSize(new THREE.Vector3());
  // Orthographic zoom changes scale without changing camera elevation.
  const floor=selected.startsWith('f');
  frameHeight=floor?36:selected==='building'?60:200;
  const angle=floor ? .53 : .78;
  controls.minPolarAngle=controls.maxPolarAngle=angle;
  controls.target.copy(center);
  const reach=frameHeight*Math.tan(angle);
  camera.position.set(center.x+reach*.72,center.y+frameHeight,center.z+reach*.694);
  camera.near=.1;camera.far=2500; camera.zoom=1;
  const aspect=host.clientWidth/host.clientHeight;
  frameSpan=Math.max(size.z*.85+size.y*.5,size.x/aspect)*1.55;
  if(selected==='neighborhood') frameSpan=Math.min(frameSpan,170/aspect);
  controls.update(); resize(); controls.saveState();
}
function setup() {
  scene=new THREE.Scene();scene.background=new THREE.Color('#e9eeed');
  camera=new THREE.OrthographicCamera(-30,30,30,-30,.1,2500);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.localClippingEnabled=true;
  host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','3D model; döndürmek için sürükleyin');
  controls=new OrbitControls(camera,renderer.domElement);
  configureCameraControls(controls,THREE);
  controls.addEventListener('change',invalidate);
  scene.add(new THREE.HemisphereLight(0xe8f1ff,0x706954,2));
  const sun=new THREE.DirectionalLight(0xfff4df,3);sun.position.set(-30,60,20);scene.add(sun);
  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();
  scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();
  draco=new DRACOLoader();draco.setDecoderPath(decoderRoot.href);draco.setWorkerLimit(2);
  loader=new GLTFLoader();loader.setDRACOLoader(draco);
  window.addEventListener('resize',resize);
  renderer.domElement.addEventListener('webglcontextlost',event=>{
    event.preventDefault();message('3D görüntü durakladı. Sayfayı yenileyerek devam edebilirsin.',true);
  });
}
async function loadAsset(asset) {
  const bundled=localManifest.assets.find(a=>a.id===asset.id)?.sha256===asset.sha256;
  const url=bundled?new URL(asset.file,modelRoot).href:`${remoteRoot}${asset.file}?v=${asset.sha256.slice(0,12)}`;
  const gltf=await loader.loadAsync(url);
  return gltf.scene;
}
async function selectView(id) {
  selected=id;const token=++generation;
  host.dataset.loaded='false';
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===id));
  $('#view-title').textContent=titles[id];
  $('#section-label').textContent=id.startsWith('f')?'Döşemeden +1,60 m kesit · Sabit yükseklik':id==='building'?'Bina ve bahçe · Sabit yükseklik':'Mahalle ve 21 numaralı villa · Sabit yükseklik';
  message(`${titles[id]} yükleniyor…`);
  if(activeGroup) {scene.remove(activeGroup);dispose(activeGroup);activeGroup=null;invalidate();}
  const ids=id==='neighborhood'?['neighborhood','building']:[id.startsWith('f')?`floor-${id.slice(1)}`:'building'];
  const group=new THREE.Group();
  try {
    // Settle every request so a failed or superseded switch cannot leak meshes.
    const results=await Promise.allSettled(ids.map(key=>loadAsset(manifest.assets.find(a=>a.id===key))));
    results.forEach(r=>{if(r.status==='fulfilled')group.add(r.value);});
    if(token!==generation) {dispose(group);return;}
    const failure=results.find(r=>r.status==='rejected');if(failure)throw failure.reason;
    if(id.startsWith('f')) {
      const z=manifest.floor_datums_m[Number(id.slice(1))];
      const planes=[new THREE.Plane(new THREE.Vector3(0,-1,0),z+1.6+.001),new THREE.Plane(new THREE.Vector3(0,1,0),-(z-.6-.001))];
      group.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]) {
        m.clippingPlanes=planes;m.side=THREE.DoubleSide;
      }});
    }
    activeGroup=group;scene.add(group);
    let box=new THREE.Box3().setFromObject(group);
    if(id==='neighborhood') {
      const house=group.children[1];const hb=new THREE.Box3().setFromObject(house);
      const c=hb.getCenter(new THREE.Vector3());box=new THREE.Box3(c.clone().addScalar(-50),c.clone().addScalar(50));
    }
    frame(box);status.hidden=true;
    host.dataset.view=id;host.dataset.loaded='true';
  } catch(error) {
    dispose(group);if(token===generation)message('Model yüklenemedi. Bağlantını kontrol edip tekrar deneyebilirsin.',true);
    console.error('Model load failed',error);
  }
}
function mode(pan) {
  controls.touches.ONE=pan?THREE.TOUCH.PAN:THREE.TOUCH.ROTATE;
  controls.mouseButtons.LEFT=pan?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE;
  $('#rotate-mode').setAttribute('aria-pressed',!pan);$('#pan-mode').setAttribute('aria-pressed',pan);
  $('#gesture-help').textContent=pan?'Sürükle: kaydır · İki parmak: kaydır ve yakınlaştır':'Sürükle: döndür · İki parmak: kaydır ve yakınlaştır';
}
async function boot() {
  try {
    setup();localManifest=await fetch(new URL('manifest.json',modelRoot)).then(r=>{if(!r.ok)throw Error(r.status);return r.json();});
    manifest=localManifest;
    // Update source on the next visit without interrupting the active model.
    try {
      const response=await fetch(remoteRoot+'manifest.json',{signal:AbortSignal.timeout(1600),cache:'no-cache'});
      if(response.ok) {const remote=await response.json();if(remote.version===1&&remote.assets?.length===6)manifest=remote;}
    } catch { /* Bundled, verified model remains available offline. */ }
    document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>selectView(b.dataset.view)));
    $('#rotate-mode').onclick=()=>mode(false);$('#pan-mode').onclick=()=>mode(true);
    $('#zoom-in').onclick=()=>{camera.zoom=Math.min(controls.maxZoom,camera.zoom*1.3);camera.updateProjectionMatrix();invalidate();};
    $('#zoom-out').onclick=()=>{camera.zoom=Math.max(controls.minZoom,camera.zoom/1.3);camera.updateProjectionMatrix();invalidate();};
    $('#reset-view').onclick=()=>{if(lastBox)frame(lastBox);};
    $('#retry').onclick=()=>selectView(selected);
    await selectView(selected);
  } catch(error) {
    message('3D görünüm başlatılamadı. Güncel Safari veya Chrome ile tekrar açabilirsin.',true);
    $('#retry').onclick=()=>location.reload();console.error(error);
  }
}
boot();
