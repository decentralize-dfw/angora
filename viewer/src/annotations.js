import * as THREE from 'three';
import {collectUIObstacles,layoutDimensionLabels} from './screen-layout.js';
import {ROOM_AREAS} from './room-areas.js';

// Fixed screen size keeps annotations readable throughout camera movement.
export function labelFontSize(pixelsPerMetre) {
  return 11;
}
// The owner's schedule comes first. Failing that the per-room area is not in
// the source and cannot be derived here: rooms.json
// states outright that the individual partitions are unverified and that no
// component-to-room area assignment is made, and its floor areas are a finish
// projection, not net usable area. Printing a bounding box as m² would be
// inventing a measurement. So the tag carries what IS registered - the room's
// own DWG span, with its handle and witness points behind it - and carries
// nothing at all where a room has none. The m² branch stays: the moment real
// room boundaries land, every one of these switches over untouched.
// One decimal, and no approximation sign. The '≈' the data carries on a
// model-measured span was reading as a guess; it is not one - every span in
// the set is a measurement, the difference is only whether the drawing or the
// delivered solid was measured, and the dashed witness line already says
// which. Two decimals on a metre span is false precision at any rate.
export function spanLabel(metres) {
  return `${metres.toLocaleString('tr-TR',{minimumFractionDigits:1,maximumFractionDigits:1})} m`;
}
export function areaLabel(room,data) {
  const area=ROOM_AREAS[room?.id]??(Number.isFinite(room?.area_m2)?room.area_m2:null);
  if(area!==null)return `${area.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})} m²`;
  // Only a verified project dimension may stand in for an area. The R39 set
  // also carries model-measured spans and face-residual records with the label
  // switched off; those are provenance, never a tag.
  const rows=(room?.dimensions??[]).map(id=>data?.dimensions?.find(entry=>entry.id===id))
    .filter(entry=>entry?.basis==='dwg_verified'&&entry.dimension_label_allowed);
  return rows[0]?spanLabel(rows[0].metres):'';
}
export function createAnnotations(data,host,onRoom) {
  if(data.coordinate_system!=='glTF_Y_up')throw Error('Invalid room annotations');
  const group=new THREE.Group();group.name='Source dimensions';group.userData.aoExcluded=true;
  const overlay=document.createElement('div');overlay.className='annotation-overlay';host.append(overlay);
  const leaders=document.createElementNS('http://www.w3.org/2000/svg','svg');leaders.classList.add('annotation-leaders');overlay.append(leaders);
  const names=[],dimensions=[],point=new THREE.Vector3();
  const material=new THREE.LineBasicMaterial({color:0x315e5c,depthTest:false,depthWrite:false,toneMapped:false});
  const measuredMaterial=new THREE.LineDashedMaterial({color:0x6d8a82,dashSize:.16,gapSize:.12,
    depthTest:false,depthWrite:false,toneMapped:false});
  for(const room of data.rooms) {
    const el=document.createElement('div');el.className='room-label';
    const name=document.createElement('strong');name.textContent=room.name;
    const area=document.createElement('span');area.textContent=areaLabel(room,data);
    const card=document.createElement('i'),meta=document.createElement('em');
    meta.append(area);card.append(name,meta);el.append(card);
    el.setAttribute('aria-label',`${room.name} ${area.textContent}`);
    overlay.append(el);
    names.push({el,kind:'name',position:new THREE.Vector3(...room.position),floor:room.floor_index});
  }
  // Both axes, on every room that has them. Only 24 of the 53 spans are project
  // dimensions, so for a long time only those were drawn - and since the rooms
  // that lack one are almost all open-plan, the plan came out dimensioned
  // across and not down, which reads as an omission rather than as a statement
  // about the source. The rest are drawn too, told apart rather than hidden:
  // a dashed witness line, a pale tag, and the '≈' the data already carries.
  // The tooltip says which it is; areaLabel() is untouched, so a measured span
  // still cannot stand in for an area.
  for(const dim of data.dimensions) {
    const measured=!dim.dimension_label_allowed;
    if(measured&&dim.basis!=='model_measured')continue;
    const a=new THREE.Vector3(...dim.a),b=new THREE.Vector3(...dim.b);
    const side=b.clone().sub(a).normalize().cross(new THREE.Vector3(0,1,0)).multiplyScalar(.12);
    const line=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([
      a,b,a.clone().add(side),a.clone().sub(side),b.clone().add(side),b.clone().sub(side)]),
      measured?measuredMaterial:material);
    if(measured)line.computeLineDistances();
    line.renderOrder=105;line.userData.aoExcluded=true;group.add(line);
    const el=document.createElement('span');
    el.className=measured?'dimension-label measured':'dimension-label';el.textContent=spanLabel(dim.metres);
    el.title=dim.basis==='dwg_verified'?'Çizimde belirtilen ölçü':dim.boundary_kind==='floor_edge'?'Modelde döşeme sınırları arasındaki ölçü':'Model üzerinden ölçülen açıklık';
    overlay.append(el);dimensions.push({el,line,position:a.clone().add(b).multiplyScalar(.5),floor:dim.floor_index,roomId:dim.room_id,measured});
  }
  function project(entry,camera,w,h,size) {
    point.copy(entry.position).project(camera);
    const visible=point.z>-1&&point.z<1;
    entry.el.hidden=!visible;if(!visible)return null;
    const x=THREE.MathUtils.clamp((point.x+1)*w/2,12,w-12),y=THREE.MathUtils.clamp((1-point.y)*h/2,12,h-12);
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
      const p=project(entry,camera,w,h,labelFontSize(ppm));
      if(p)candidates.push({...p,entry,width:entry.el.offsetWidth,height:entry.el.offsetHeight});
    }
    for(const entry of dimensions) {
      const visible=entry.floor===floor&&showDimensions&&!transitioning&&(!walking||entry.roomId===walkRoom);
      entry.line.visible=visible;entry.el.hidden=!visible;
      if(visible){
        const p=project(entry,camera,w,h,10);
        if(p)candidates.push({...p,entry,width:entry.el.offsetWidth,height:entry.el.offsetHeight});
      }
    }
    // Names are placed first, then dimensions avoid both names and controls.
    const placed=layoutDimensionLabels(candidates,{width:w,height:h,obstacles});
    for(const item of candidates)item.entry.el.hidden=true;
    leaders.replaceChildren();leaders.setAttribute('viewBox',`0 0 ${w} ${h}`);
    for(const {entry,x,y,anchorX,anchorY,rect} of placed){
      entry.el.hidden=false;entry.el.style.left=`${x}px`;entry.el.style.top=`${y}px`;
      if(Math.hypot(x-anchorX,y-anchorY)>6){
        const line=document.createElementNS(leaders.namespaceURI,'line');
        line.setAttribute('x1',anchorX);line.setAttribute('y1',anchorY);
        line.setAttribute('x2',Math.max(rect.left,Math.min(rect.right,anchorX)));
        line.setAttribute('y2',Math.max(rect.top,Math.min(rect.bottom,anchorY)));leaders.append(line);
      }
    }
    overlay.dataset.expected=String(candidates.length);overlay.dataset.placed=String(placed.length);
  },dispose(){overlay.remove();group.traverse(o=>o.geometry?.dispose());material.dispose();measuredMaterial.dispose();}};
}
