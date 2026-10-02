import * as THREE from 'three';
import {WalkSurface} from './walk-surface.js';
import {t} from './i18n.js';

// Across, not up: the number a lens is quoted at. 95° is the 16-18 mm an
// interior is actually shot with. A narrower lens is the more honest optic and
// it was tried first, at 75°; walked, it reads as a keyhole and the rooms come
// out feeling smaller than they are, because you cannot see a room you cannot
// fit in the frame. The wide lens shows the room.
export const WALK_HORIZONTAL_FOV_DEG = 95;

// The right hand, in a headset. Turning is snapped rather than swept: a yaw
// that slides continuously under a visor is the quickest way to make somebody
// ill, and 30° steps are what comfort settings in the field settle on. A flick
// up or down changes storey, because the walking surface has no stairs in it -
// the delivery says so in its own limitations - so without this a visitor in a
// headset could never leave the floor they arrived on, and the balconies and
// the upper rooms would be shown to them and kept from them at once.
const SNAP_TURN_DEG = 30, STICK_PRESS = .72, STICK_RELEASE = .35, STICK_DEAD = .18;
// Ürün sahibi (27.09): lens 14 mm SABİT (24 mm film yüksekliğine göre dikey
// açı), göz biraz alçak, yürüyüş 1,5 kat hızlı, Shift ile 2,5 kat.
export const WALK_LENS_MM = 14;
export const WALK_LENS_FOV = 2 * Math.atan(12 / WALK_LENS_MM) * 180 / Math.PI;
// Görüntünün göz yüksekliği çarpışma yüzeyinden bu kadar aşağıda: yalnız
// rig kaydırılır, zemin/basamak hesabı (camera.position) değişmez.
const EYE_DROP_M = .12, WALK_SPEED = 1.25 * 1.5, SPRINT = 2.5;

export class InteriorWalk {
  constructor(data, canvas, invalidate) {
    this.surface = new WalkSurface(data); this.canvas = canvas; this.invalidate = invalidate;
    // 62° of VERTICAL field was an 18 mm lens on a laptop: about 94° across,
    // which pushes every wall away from the eye and reads the rooms as a
    // dolls' house. What a room should be walked at is a horizontal field,
    // held at the 24 mm that interior photography uses, with the vertical
    // falling out of the viewport - so a phone held upright does not get a
    // 28° keyhole out of the same number.
    this.camera = new THREE.PerspectiveCamera(60,1,.045,450);
    this.camera.rotation.order = 'YXZ'; this.rig = new THREE.Group(); this.rig.add(this.camera);
    this.active = false; this.xrActive = false; this.keys = new Set(); this.furniture = true;
    this.yaw = .85; this.pitch = -.04; this.pointer = null; this.lastTime = null;
    canvas.addEventListener('pointerdown',e=>{
      if (!this.active || this.inputSuspended || this.xrActive || this.pointer) return;
      this.pointer = {id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove',e=>{
      if (this.inputSuspended || !this.pointer || this.pointer.id!==e.pointerId) return;
      this.yaw -= (e.clientX-this.pointer.x)*.004;
      this.pitch = THREE.MathUtils.clamp(this.pitch-(e.clientY-this.pointer.y)*.004,-1.25,1.25);
      Object.assign(this.pointer,{x:e.clientX,y:e.clientY});this.pose();invalidate();
    });
    const release=e=>{if(this.pointer?.id===e.pointerId)this.pointer=null;};
    canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
    const movement = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
    window.addEventListener('keydown',e=>{
      if (!this.active || this.inputSuspended || e.altKey || e.ctrlKey || e.metaKey || e.target.isContentEditable || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      this.sprint=e.shiftKey;
      if (movement.includes(e.code)) {e.preventDefault();this.keys.add(e.code);invalidate();}
    });
    window.addEventListener('keyup',e=>{this.keys.delete(e.code);this.sprint=e.shiftKey;if(this.active)invalidate();});
    window.addEventListener('blur',()=>{this.keys.clear();this.pointer=null;this.lastTime=null;});
    document.addEventListener('visibilitychange',()=>{
      this.visibilityPaused=document.hidden;this.keys.clear();this.pointer=null;this.lastTime=null;
      if(!document.hidden&&this.active)invalidate();
    });
    document.querySelectorAll('[data-walk-direction]').forEach(button=>{
      const key=button.dataset.walkDirection;
      button.addEventListener('pointerdown',e=>{if(!this.active||this.inputSuspended)return;e.preventDefault();button.setPointerCapture(e.pointerId);this.keys.add(key);invalidate();});
      const stop=()=>{this.keys.delete(key);invalidate();};
      button.addEventListener('pointerup',stop);button.addEventListener('pointercancel',stop);
      button.addEventListener('lostpointercapture',stop);
      button.addEventListener('keydown',e=>{if(this.active&&!this.inputSuspended&&['Enter',' '].includes(e.key)){e.preventDefault();this.keys.add(key);invalidate();}});
      button.addEventListener('keyup',e=>{if(['Enter',' '].includes(e.key))stop();});
      button.addEventListener('blur',stop);
    });
  }
  pose() {if(!this.xrActive)this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');}
  // Turn the room about the HEAD, not about the rig's origin. Rotating the rig
  // alone swings the visitor around a point somewhere behind them, which reads
  // as being shoved sideways; this leaves them standing exactly where they are
  // and turns the house around them.
  snapTurnXR(direction) {
    const head=this.camera.getWorldPosition(new THREE.Vector3());
    const angle=-direction*THREE.MathUtils.degToRad(SNAP_TURN_DEG);
    const cos=Math.cos(angle),sin=Math.sin(angle);
    const dx=this.rig.position.x-head.x,dz=this.rig.position.z-head.z;
    this.rig.position.x=head.x+dx*cos+dz*sin;
    this.rig.position.z=head.z-dx*sin+dz*cos;
    this.rig.rotation.y+=angle;
    this.invalidate();
  }
  // Stand the visitor at a world point without disturbing where they are
  // looking - the same call whether a headset is on or not.
  placeAt([x,y,z]) {
    if(this.xrActive) {
      const head=this.camera.getWorldPosition(new THREE.Vector3());
      this.rig.position.x+=x-head.x;this.rig.position.z+=z-head.z;
      this.rig.position.y=y-this.surface.data.eye_height_m;
    } else {this.camera.position.set(x,y,z);this.pose();}
    this.invalidate();
  }
  // The tour's lens slider: an explicit vertical field chosen by hand.
  // While set it survives resizes untouched - the user picked THE lens -
  // and null returns to the derived default below.
  setLens(fovDeg) {
    this.lensFov=fovDeg;
    if(fovDeg!==null){this.camera.fov=fovDeg;this.camera.updateProjectionMatrix();}
  }
  resize(w,h) {
    this.camera.aspect=w/h;
    if(this.lensFov!=null){this.camera.updateProjectionMatrix();return;}
    const horizontal=THREE.MathUtils.degToRad(WALK_HORIZONTAL_FOV_DEG);
    // Clamped so a tall phone cannot turn the held horizontal field into a
    // fisheye, and a wide desktop cannot turn it into a telephoto.
    this.camera.fov=THREE.MathUtils.clamp(
      THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(horizontal/2)/this.camera.aspect)),46,82);
    this.camera.updateProjectionMatrix();
  }
  enter(room,position=null) {
    let station=this.surface.station(room);if(!station)throw Error('Unknown room');
    if(position&&this.surface.sample(position[0],position[2],position[1]-this.surface.data.eye_height_m,this.furniture)?.floor===station.floor_index)station={...station,position};
    this.active=true;this.keys.clear();this.lastTime=null;this.route=null;
    this.rig.position.set(0,-EYE_DROP_M,0);this.rig.rotation.set(0,0,0);
    this.camera.position.fromArray(station.position);
    this.setLens(WALK_LENS_FOV);
    this.yaw=position?this.surface.openingYaw(station.position,station.view_yaw_rad??.85):station.view_yaw_rad??.85;
    this.pitch=station.view_pitch_rad??-.04;this.pose();
    this.room=station.room_id;this.floor=station.floor_index;this.invalidate();return station;
  }
  leave() {this.active=false;this.keys.clear();this.pointer=null;this.lastTime=null;this.route=null;}
  travel(room,onArrive) {
    const station=this.surface.station(room);if(!station)return false;
    const path=this.surface.path(this.camera.position.toArray(),station.position,this.furniture);
    if(!path)return false;
    this.route={points:path,index:0,room,onArrive};this.keys.clear();this.invalidate();return true;
  }
  update(time, xrSession) {
    // VR'da kare hızı düşse de yürüyüş gerçek zamanlı: adım üst sınırı .05 s idi, 10 fps'de ziyaretçi yarı hızda
    // sürünüyordu ("hareket edemiyorum"). surface.move adımı zaten hücre boyunda böler, duvardan geçirmez.
    const dt=this.lastTime===null?0:Math.min(this.xrActive?.12:.05,(time-this.lastTime)/1000);this.lastTime=time;
    if(!this.active||this.inputSuspended||this.visibilityPaused)return false;
    if(this.route&&!this.xrActive) {
      if(this.keys.size){this.route=null;}
      else {
        const route=this.route;let budget=dt*2.1;
        while(budget>0&&route.index<route.points.length) {
          const target=new THREE.Vector3(...route.points[route.index]);
          const distance=this.camera.position.distanceTo(target);
          if(distance<=budget){this.camera.position.copy(target);route.index++;budget-=distance;}
          else {this.camera.position.lerp(target,budget/distance);budget=0;}
        }
        const sample=this.surface.sample(this.camera.position.x,this.camera.position.z,this.camera.position.y-this.surface.data.eye_height_m,this.furniture,.3);
        if(sample)this.floor=sample.floor;
        if(route.index>=route.points.length){this.room=route.room;this.route=null;route.onArrive?.(this.surface.station(route.room));}
        return true;
      }
    }
    let forward=(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0)-(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0);
    let side=(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0);
    let yaw=this.yaw;
    if(this.xrActive && xrSession) {
      // 02.10 ürün sahibi ("kolları sağ sol ilerleme vs kullanabilmem lazım"): sol çubuk baktığın yöne göre
      // ileri/geri/yana; sağ çubuk ileri/geri de yürütür, sağa/sola 30° döndürür; A/X kat yukarı, B/Y kat aşağı.
      side=0;forward=0;
      for(const input of xrSession.inputSources) {
        const gamepad=input.gamepad;if(!gamepad)continue;
        const axes=gamepad.axes,offset=axes.length>=4?2:0,x=axes[offset]??0,y=axes[offset+1]??0;
        if(input.handedness==='left'){if(Math.abs(x)>=STICK_DEAD)side+=x;if(Math.abs(y)>=STICK_DEAD)forward-=y;}
        else if(input.handedness==='right'&&Math.abs(y)>=STICK_DEAD&&Math.abs(y)>Math.abs(x))forward-=y;
      }
      this.xrControls(xrSession);
      const direction=this.camera.getWorldDirection(new THREE.Vector3());yaw=Math.atan2(-direction.x,-direction.z);
    }
    const length=Math.hypot(forward,side);if(!length)return false;
    forward/=Math.max(1,length);side/=Math.max(1,length);
    const speed=WALK_SPEED*(this.sprint&&!this.xrActive?SPRINT:1)*dt,dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed;
    if(this.xrActive) {
      const p=this.camera.getWorldPosition(new THREE.Vector3());p.y=this.rig.position.y+this.surface.data.eye_height_m;
      const before=p.clone();this.surface.move(p,dx,dz,this.furniture);
      this.rig.position.add(p.sub(before));
    } else this.surface.move(this.camera.position,dx,dz,this.furniture);
    return true;
  }
  // One push, one answer. The stick has to come back past the release
  // threshold before it will turn again, so a held stick spins nobody. Storey
  // changes moved from the right stick's up/down (now walking, the way a
  // visitor expects a stick to work) to the face buttons: A/X up, B/Y down,
  // one storey per press.
  xrControls(xrSession) {
    this.stick ??= {turn:false,buttons:new Map()};
    let turnX=0;
    for(const input of xrSession.inputSources) {
      const gamepad=input.gamepad;if(!gamepad)continue;
      if(input.handedness==='right'){const axes=gamepad.axes,offset=axes.length>=4?2:0,x=axes[offset]??0,y=axes[offset+1]??0;if(Math.abs(x)>Math.abs(y))turnX=x;}
      // xr-standard: 4 = A/X, 5 = B/Y
      for(const [index,delta] of [[4,1],[5,-1]]) {
        const key=input.handedness+index,pressed=!!gamepad.buttons?.[index]?.pressed;
        if(pressed&&!this.stick.buttons.get(key))this.onFloorRequest?.(delta);
        this.stick.buttons.set(key,pressed);
      }
    }
    if(Math.abs(turnX)>STICK_PRESS&&!this.stick.turn){this.stick.turn=true;this.snapTurnXR(Math.sign(turnX));}
    if(Math.abs(turnX)<STICK_RELEASE)this.stick.turn=false;
  }
  startXR() {
    const position=this.camera.getWorldPosition(new THREE.Vector3());
    this.rig.position.set(position.x,position.y-this.surface.data.eye_height_m,position.z);
    this.rig.rotation.y=this.yaw;this.camera.position.set(0,0,0);this.camera.rotation.set(0,0,0);
    this.xrActive=true;this.keys.clear();
  }
  endXR() {
    const position=this.camera.getWorldPosition(new THREE.Vector3()),direction=this.camera.getWorldDirection(new THREE.Vector3());
    const floor=this.rig.position.y;this.rig.position.set(0,-EYE_DROP_M,0);this.rig.rotation.set(0,0,0);
    this.camera.position.copy(position);this.camera.position.y=floor+this.surface.data.eye_height_m;
    this.xrActive=false;this.yaw=Math.atan2(-direction.x,-direction.z);this.pitch=Math.asin(THREE.MathUtils.clamp(direction.y,-1,1));this.pose();
  }
  teleportXR(point) {
    const sample=this.surface.sample(point.x,point.z,point.y,this.furniture,.18);if(!sample)return false;
    const head=this.camera.getWorldPosition(new THREE.Vector3());
    this.rig.position.x+=point.x-head.x;this.rig.position.z+=point.z-head.z;this.rig.position.y=sample.height;return true;
  }
}

// Standart WebXR girişi (three.js VRButton düzeni). Düğmeler cihaz immersive-vr
// desteğini bildirdiği anda görünür (yükleme sürerken pasif), model hazır olunca
// etkinleşir. Oturum isteği tıklamanın İÇİNDE, hiçbir beklemeden önce yapılır:
// Quest tarayıcısı geçici kullanıcı etkileşimi ister, araya giren bir await
// isteği reddettirir. Gözlükte içeride gez adamı bırakılınca da aynı yol açılır.
const XR_BUTTONS='#enter-vr,#enter-vr-walk,#welcome-vr',XR_FRAMEBUFFER_SCALE=.8;
const immersive={supported:null,start:null};
export function offerImmersive() {
  if(immersive.supported)return immersive.supported;
  immersive.supported=(async()=>{
    if(!navigator.xr||!window.isSecureContext)return false;
    let ok=false;try{ok=await navigator.xr.isSessionSupported('immersive-vr');}catch{return false;}
    if(ok)for(const button of document.querySelectorAll(XR_BUTTONS)){button.hidden=false;if(!immersive.start)button.disabled=true;}
    return ok;
  })();
  return immersive.supported;
}
// Gözlükte (2D sayfada) bir jestin içinden çağrılır: oturum hazırsa true.
export function startImmersive() {return immersive.start?immersive.start():false;}
export async function enableImmersiveWalk(renderer, scene, walk, meshGroups, onStart, onEnd, onFloor) {
  // Two of these say what the session is doing and change their label with
  // it; the welcome card's says what it offers and is gone the moment it is
  // taken, so it keeps its own word.
  const buttons=[...document.querySelectorAll('#enter-vr,#enter-vr-walk')];
  const offers=[...document.querySelectorAll('#welcome-vr')];
  if(!(await offerImmersive()))return;
  walk.onFloorRequest=onFloor;
  const label=key=>{for(const button of buttons){button.textContent=t(key);button.dataset.i18n=key;button.setAttribute('aria-label',t(key));}};
  renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');
  const ray=new THREE.Raycaster(),rotation=new THREE.Matrix4();
  for(let index=0;index<2;index++) {
    const controller=renderer.xr.getController(index);walk.rig.add(controller);
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-5)]),new THREE.LineBasicMaterial({color:0x72cfff}));
    line.userData.aoExcluded=true;controller.add(line);
    controller.addEventListener('select',()=>{
      controller.updateWorldMatrix(true,false);rotation.extractRotation(controller.matrixWorld);
      ray.ray.origin.setFromMatrixPosition(controller.matrixWorld);ray.ray.direction.set(0,0,-1).applyMatrix4(rotation);
      // Far enough to cross the garden in a few hops rather than a dozen: the
      // plot runs forty metres and a twelve-metre reach was drawn for rooms.
      ray.far=20;
      const hits=ray.intersectObjects([...meshGroups.values()],true).filter(hit=>hit.object.visible);
      const hit=hits[0];if(!hit?.face)return;
      const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      if(normal.y>.7)walk.teleportXR(hit.point);
    });
  }
  // Kumandalar gözlükte görünsün (standart profil modelleri; yüklenemezse ışın çizgileri yeter).
  import('three/examples/jsm/webxr/XRControllerModelFactory.js').then(({XRControllerModelFactory})=>{
    const factory=new XRControllerModelFactory();
    for(let index=0;index<2;index++){
      const grip=renderer.xr.getControllerGrip(index);grip.userData.aoExcluded=true;
      grip.add(factory.createControllerModel(grip));walk.rig.add(grip);
    }
  }).catch(error=>console.warn('XR controller models unavailable',error));
  const open=()=>{
    if(renderer.xr.isPresenting){renderer.xr.getSession().end();return true;}
    let pending;
    // Quest 3'ün önerilen göz çözünürlüğü ~2064x2208; iki göz + MSAA mobil GPU'ya ağır. %80 ölçek (oturumdan ÖNCE
    // ayarlanmalı) ve kenarları seyrek çizen foveation, görüntüyü bozmadan kare süresini düşürür.
    try{renderer.xr.setFramebufferScaleFactor(XR_FRAMEBUFFER_SCALE);}catch{/* oturum açıkken değiştirilemez */}
    // İstek önce, senkron: kullanıcı etkileşimi bu çağrıda tüketilir.
    try{pending=navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor']});}
    catch(error){label('retryVR');console.warn('XR session could not start',error);return false;}
    // Walking first, then the headset: the visitor is put inside the house
    // and on their feet before the session opens, so the first thing the
    // visor shows is the room they are standing in rather than the model
    // seen from outside.
    onStart();
    pending.then(session=>renderer.xr.setSession(session)).then(()=>{try{renderer.xr.setFoveation(1);}catch{/* desteklenmiyor */}})
      .catch(error=>{label('retryVR');console.warn('XR session could not start',error);});
    return true;
  };
  immersive.start=open;
  for(const button of [...buttons,...offers]){button.onclick=open;button.hidden=false;button.disabled=false;}
  renderer.xr.addEventListener('sessionstart',()=>{walk.startXR();label('exitVR');});
  renderer.xr.addEventListener('sessionend',()=>{walk.endXR();label('enterVR');onEnd();});
}
