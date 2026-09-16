import * as THREE from 'three';
import {t,roomName} from './i18n.js';
export function createHotspots(host,walk,onTravel) {
  const overlay=document.createElement('div');overlay.className='hotspot-overlay';host.append(overlay);
  const point=new THREE.Vector3(),entries=[];let key='';
  function refresh() {
    const next=`${walk.room}:${walk.floor}:${walk.furniture}`;if(next===key)return;key=next;
    overlay.replaceChildren();entries.length=0;
    const source=walk.surface.station(walk.room);if(!source)return;
    const position=walk.camera.position;
    // Candidates by sightline distance, admitted by WALK distance: a room
    // whose route is much longer than its sightline is behind walls, and a
    // marker for it would float on this room's wall as though it were a
    // door ("Garaj" over the salon sofa). Those stay in the room menu.
    // What is admitted anchors a few steps along its actual route - at the
    // doorway - so the marker points where the feet would go.
    const candidates=walk.surface.data.stations.filter(s=>s.floor_index===walk.floor&&s.room_id!==walk.room)
      .sort((a,b)=>position.distanceToSquared(new THREE.Vector3(...a.position))-position.distanceToSquared(new THREE.Vector3(...b.position))).slice(0,7);
    const same=[];
    for(const s of candidates){
      if(same.length===3)break;
      const path=walk.surface.path(position.toArray(),s.position,walk.furniture);
      if(!path)continue;
      let length=0;
      for(let i=1;i<path.length;i++)length+=Math.hypot(path[i][0]-path[i-1][0],path[i][2]-path[i-1][2]);
      const straight=Math.hypot(s.position[0]-position.x,s.position[2]-position.z);
      if(length<=Math.max(6,straight*1.7))same.push({station:s,anchor:path[Math.min(10,path.length-1)]});
    }
    const adjacent=[-1,1].map(offset=>walk.surface.data.stations.find(s=>s.floor_index===walk.floor+offset&&/hol|antre/i.test(s.name))).filter(Boolean);
    for(const entry of [...same,...adjacent.map(s=>({station:s}))]) {
      const station=entry.station;
      const crossFloor=station.floor_index!==walk.floor;
      const path=crossFloor?walk.surface.path(position.toArray(),station.position,walk.furniture):null;
      // A stair marker is on the actual traversable stair route, never in the
      // lower room hidden under a slab. Non-connected floors remain in the room menu.
      if(crossFloor&&!path)continue;
      const anchor=crossFloor?path[Math.min(20,path.length-1)]:entry.anchor;
      const el=document.createElement('button');el.type='button';el.className='hotspot';
      const ring=document.createElement('i'),label=document.createElement('span');
      label.textContent=crossFloor?`${station.floor_index<walk.floor?'↓':'↑'} ${t('f'+station.floor_index+'Short')}`:roomName(station.name);
      el.append(ring,label);el.setAttribute('aria-label',label.textContent);el.onclick=e=>{e.stopPropagation();onTravel(station.room_id);};
      overlay.append(el);entries.push({el,position:new THREE.Vector3(anchor[0],anchor[1]-walk.surface.data.eye_height_m+.035,anchor[2])});
    }
  }
  return {update(camera,show){
    overlay.hidden=!show;if(!show)return;refresh();camera.updateMatrixWorld();
    for(const entry of entries){
      point.copy(entry.position).project(camera);const distance=entry.position.distanceTo(camera.position);
      entry.el.hidden=point.z<=-1||point.z>=1||Math.abs(point.x)>.94||Math.abs(point.y)>.88||distance<.5;
      if(!entry.el.hidden){entry.el.style.left=`${(point.x+1)*host.clientWidth/2}px`;entry.el.style.top=`${(1-point.y)*host.clientHeight/2}px`;}
    }
  },reset(){key='';}};
}
