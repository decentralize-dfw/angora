import * as THREE from 'three';
import {WalkSurface} from './walk-surface.js';

// Across, not up: the number a lens is quoted at. 95° is the 16-18 mm an
// interior is actually shot with. A narrower lens is the more honest optic and
// it was tried first, at 75°; walked, it reads as a keyhole and the rooms come
// out feeling smaller than they are, because you cannot see a room you cannot
// fit in the frame. The wide lens shows the room.
export const WALK_HORIZONTAL_FOV_DEG = 95;

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
    canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
    const movement = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
    window.addEventListener('keydown',e=>{
      if (!this.active || this.inputSuspended || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (movement.includes(e.code)) {e.preventDefault();this.keys.add(e.code);invalidate();}
    });
    window.addEventListener('keyup',e=>{this.keys.delete(e.code);if(this.active)invalidate();});
    window.addEventListener('blur',()=>this.keys.clear());
    document.querySelectorAll('[data-walk-direction]').forEach(button=>{
      const key=button.dataset.walkDirection;
      button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);this.keys.add(key);invalidate();});
      const stop=()=>{this.keys.delete(key);invalidate();};
      button.addEventListener('pointerup',stop);button.addEventListener('pointercancel',stop);
      button.addEventListener('lostpointercapture',stop);
      button.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();this.keys.add(key);invalidate();}});
      button.addEventListener('keyup',e=>{if(['Enter',' '].includes(e.key))stop();});
    });
  }
  pose() {if(!this.xrActive)this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');}
  resize(w,h) {
    this.camera.aspect=w/h;
    const horizontal=THREE.MathUtils.degToRad(WALK_HORIZONTAL_FOV_DEG);
    // Clamped so a tall phone cannot turn the held horizontal field into a
    // fisheye, and a wide desktop cannot turn it into a telephoto.
    this.camera.fov=THREE.MathUtils.clamp(
      THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(horizontal/2)/this.camera.aspect)),46,82);
    this.camera.updateProjectionMatrix();
  }
  enter(room) {
    const station=this.surface.station(room);if(!station)throw Error('Unknown room');
    this.active=true;this.keys.clear();this.lastTime=null;this.route=null;
    this.rig.position.set(0,0,0);this.rig.rotation.set(0,0,0);
    this.camera.position.fromArray(station.position);this.yaw=station.view_yaw_rad??.85;this.pitch=station.view_pitch_rad??-.04;this.pose();
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
    const dt=this.lastTime===null?0:Math.min(.05,(time-this.lastTime)/1000);this.lastTime=time;
    if(!this.active||this.inputSuspended)return false;
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
      const input=[...xrSession.inputSources].find(i=>i.handedness==='left' && i.gamepad);
      if(input) {const axes=input.gamepad.axes,offset=axes.length>=4?2:0;side=axes[offset]??0;forward=-(axes[offset+1]??0);if(Math.abs(side)<.18)side=0;if(Math.abs(forward)<.18)forward=0;}
      const direction=this.camera.getWorldDirection(new THREE.Vector3());yaw=Math.atan2(-direction.x,-direction.z);
    }
    const length=Math.hypot(forward,side);if(!length)return false;
    forward/=Math.max(1,length);side/=Math.max(1,length);
    const speed=1.25*dt,dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed;
    if(this.xrActive) {
      const p=this.camera.getWorldPosition(new THREE.Vector3());p.y=this.rig.position.y+this.surface.data.eye_height_m;
      const before=p.clone();this.surface.move(p,dx,dz,this.furniture);
      this.rig.position.add(p.sub(before));
    } else this.surface.move(this.camera.position,dx,dz,this.furniture);
    return true;
  }
  startXR() {
    const position=this.camera.getWorldPosition(new THREE.Vector3());
    this.rig.position.set(position.x,position.y-this.surface.data.eye_height_m,position.z);
    this.rig.rotation.y=this.yaw;this.camera.position.set(0,0,0);this.camera.rotation.set(0,0,0);
    this.xrActive=true;this.keys.clear();
  }
  endXR() {
    const position=this.camera.getWorldPosition(new THREE.Vector3()),direction=this.camera.getWorldDirection(new THREE.Vector3());
    const floor=this.rig.position.y;this.rig.position.set(0,0,0);this.rig.rotation.set(0,0,0);
    this.camera.position.copy(position);this.camera.position.y=floor+this.surface.data.eye_height_m;
    this.xrActive=false;this.yaw=Math.atan2(-direction.x,-direction.z);this.pitch=Math.asin(THREE.MathUtils.clamp(direction.y,-1,1));this.pose();
  }
  teleportXR(point) {
    const sample=this.surface.sample(point.x,point.z,point.y,this.furniture,.18);if(!sample)return false;
    const head=this.camera.getWorldPosition(new THREE.Vector3());
    this.rig.position.x+=point.x-head.x;this.rig.position.z+=point.z-head.z;this.rig.position.y=sample.height;return true;
  }
}

export async function enableImmersiveWalk(renderer, scene, walk, meshGroups, onStart, onEnd) {
  const button=document.querySelector('#enter-vr');
  if(!navigator.xr || !window.isSecureContext)return;
  let supported=false;try{supported=await navigator.xr.isSessionSupported('immersive-vr');}catch{return;}
  if(!supported)return;
  renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');button.hidden=false;
  const ray=new THREE.Raycaster(),rotation=new THREE.Matrix4();
  for(let index=0;index<2;index++) {
    const controller=renderer.xr.getController(index);walk.rig.add(controller);
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-5)]),new THREE.LineBasicMaterial({color:0x72cfff}));
    line.userData.aoExcluded=true;controller.add(line);
    controller.addEventListener('select',()=>{
      controller.updateWorldMatrix(true,false);rotation.extractRotation(controller.matrixWorld);
      ray.ray.origin.setFromMatrixPosition(controller.matrixWorld);ray.ray.direction.set(0,0,-1).applyMatrix4(rotation);ray.far=12;
      const hits=ray.intersectObjects([...meshGroups.values()],true).filter(hit=>hit.object.visible);
      const hit=hits[0];if(!hit?.face)return;
      const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      if(normal.y>.7)walk.teleportXR(hit.point);
    });
  }
  button.onclick=async()=>{
    try {
      if(renderer.xr.isPresenting){await renderer.xr.getSession().end();return;}
      onStart();
      const session=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor']});
      await renderer.xr.setSession(session);
    } catch(error) {button.textContent='VR’a tekrar gir';console.warn('XR session could not start',error);}
  };
  renderer.xr.addEventListener('sessionstart',()=>{walk.startXR();button.textContent='VR’dan çık';});
  renderer.xr.addEventListener('sessionend',()=>{walk.endXR();button.textContent='VR’a gir';onEnd();});
}
