import * as THREE from 'three';
import {collectUIObstacles,layoutAnchoredLabels} from './screen-layout.js';

// Room tags sit on top of the model, so they are sized to be read past rather
// than read first. The old range topped out at 19 px on a two-line card and
// covered the thing it was labelling.
export function labelFontSize(pixelsPerMetre) {
  return THREE.MathUtils.clamp(12+Math.log2(Math.max(1,pixelsPerMetre)/18)*1.1,12,14);
}
// The per-room area is not in the source and cannot be derived here: rooms.json
// states outright that the individual partitions are unverified and that no
// component-to-room area assignment is made, and its floor areas are a finish
// projection, not net usable area. Printing a bounding box as m² would be
// inventing a measurement. So the tag carries what IS registered - the room's
// own DWG span, with its handle and witness points behind it - and carries
// nothing at all where a room has none. The m² branch stays: the moment real
// room boundaries land, every one of these switches over untouched.
export function areaLabel(room,data) {
  if(Number.isFinite(room?.area_m2))
    return `${room.area_m2.toLocaleString('tr-TR',{minimumFractionDigits:1,maximumFractionDigits:1})} m²`;
  const first=room?.dimensions?.[0];
  return data?.dimensions?.find(entry=>entry.id===first)?.display??'';
}
export function createAnnotations(data,host,onRoom) {
  if(data.coordinate_system!=='glTF_Y_up')throw Error('Invalid room annotations');
  const group=new THREE.Group();group.name='Source dimensions';group.userData.aoExcluded=true;
  const overlay=document.createElement('div');overlay.className='annotation-overlay';host.append(overlay);
  const names=[],dimensions=[],point=new THREE.Vector3();
  const material=new THREE.LineBasicMaterial({color:0x315e5c,depthTest:false,depthWrite:false,toneMapped:false});
  for(const room of data.rooms) {
    const el=document.createElement('button');el.type='button';el.className='room-label';
    const name=document.createElement('strong');name.textContent=room.name;
    const area=document.createElement('span');area.textContent=areaLabel(room,data);
    // Inline after the name rather than pinned to the corner, so the name no
    // longer reserves a gutter for it and the card can close up around them.
    const tour=document.createElement('small');tour.textContent='360°';tour.setAttribute('aria-hidden','true');
    // The badge shares the measure's line instead of sitting after the name, so
    // a long room name gets the card's full width before it has to truncate.
    const card=document.createElement('i'),meta=document.createElement('em');
    meta.append(area,tour);card.append(name,meta);el.append(card);
    el.setAttribute('aria-label',area.textContent
      ?`${room.name}, kayıtlı açıklık ${area.textContent}, 360 derece gez`
      :`${room.name}, 360 derece gez`);
    el.title=room.area_method_label??'Kaynak kat planı';
    el.onclick=e=>{e.stopPropagation();onRoom(room.id);};overlay.append(el);
    names.push({el,position:new THREE.Vector3(...room.position),floor:room.floor_index});
  }
  for(const dim of data.dimensions) {
    if(!dim.dimension_label_allowed)continue;
    const a=new THREE.Vector3(...dim.a),b=new THREE.Vector3(...dim.b);
    const side=b.clone().sub(a).normalize().cross(new THREE.Vector3(0,1,0)).multiplyScalar(.12);
    const line=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([
      a,b,a.clone().add(side),a.clone().sub(side),b.clone().add(side),b.clone().sub(side)]),material);
    line.renderOrder=105;line.userData.aoExcluded=true;group.add(line);
    const el=document.createElement('span');el.className='dimension-label';el.textContent=dim.display;
    overlay.append(el);dimensions.push({el,line,position:a.clone().add(b).multiplyScalar(.5),floor:dim.floor_index,roomId:dim.room_id});
  }
  function project(entry,camera,w,h,size) {
    point.copy(entry.position).project(camera);
    const visible=point.z>-1&&point.z<1&&Math.abs(point.x)<1.1&&Math.abs(point.y)<1.1;
    entry.el.hidden=!visible;if(!visible)return null;
    const x=(point.x+1)*w/2,y=(1-point.y)*h/2;
    entry.el.style.left=`${x}px`;entry.el.style.top=`${y}px`;entry.el.style.fontSize=`${size}px`;
    return {x,y};
  }
  return {group,data,update(view,showNames,showDimensions,transitioning,walking,camera,walkRoom) {
    const floor=/^f[0-3]$/.test(view)?Number(view[1]):-1;
    const w=host.clientWidth,h=host.clientHeight;
    camera.updateMatrixWorld();
    const obstacles=collectUIObstacles(host),candidates=[];
    for(const entry of names) {
      entry.el.hidden=!(entry.floor===floor&&showNames&&!transitioning&&!walking);
      if(entry.el.hidden)continue;
      const distance=Math.max(1,entry.position.distanceTo(camera.position));
      const ppm=camera.isPerspectiveCamera?h*camera.zoom/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*distance):h*camera.zoom/(camera.top-camera.bottom);
      const p=project(entry,camera,w,h,labelFontSize(ppm));if(!p)continue;
      candidates.push({...p,entry,width:entry.el.offsetWidth,height:entry.el.offsetHeight});
    }
    for(const entry of dimensions) {
      const visible=entry.floor===floor&&showDimensions&&!transitioning&&(!walking||entry.roomId===walkRoom);
      entry.line.visible=visible;entry.el.hidden=!visible;
      if(visible){
        const p=project(entry,camera,w,h,walking?15:14);
        if(p)candidates.push({...p,entry,width:entry.el.offsetWidth,height:entry.el.offsetHeight});
      }
    }
    const placed=layoutAnchoredLabels(candidates,{width:w,height:h,obstacles});
    for(const item of candidates)item.entry.el.hidden=true;
    for(const {entry,x,y} of placed){entry.el.hidden=false;entry.el.style.left=`${x}px`;entry.el.style.top=`${y}px`;}
  },dispose(){overlay.remove();group.traverse(o=>o.geometry?.dispose());material.dispose();}};
}
