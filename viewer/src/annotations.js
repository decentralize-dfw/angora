import * as THREE from 'three';
import {collectUIObstacles,layoutAnchoredLabels} from './screen-layout.js';
import {ROOM_AREAS} from './room-areas.js';

// Room tags sit on top of the model, so they are sized to be read past rather
// than read first, and they track the model instead of holding a size of their
// own: pulled back, a tag gets small along with the room it names. The old
// range held a 12 px floor, which is what kept them large over a small plan and
// what made the layout drop them rather than let them shrink.
export function labelFontSize(pixelsPerMetre) {
  return THREE.MathUtils.clamp(7+Math.log2(Math.max(1,pixelsPerMetre)/12)*1.9,7,11);
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
  const names=[],dimensions=[],point=new THREE.Vector3();
  const material=new THREE.LineBasicMaterial({color:0x315e5c,depthTest:false,depthWrite:false,toneMapped:false});
  const measuredMaterial=new THREE.LineDashedMaterial({color:0x6d8a82,dashSize:.16,gapSize:.12,
    depthTest:false,depthWrite:false,toneMapped:false});
  for(const room of data.rooms) {
    const el=document.createElement('button');el.type='button';el.className='room-label';
    const name=document.createElement('strong');name.textContent=room.name;
    const area=document.createElement('span');area.textContent=areaLabel(room,data);
    // Inline after the name rather than pinned to the corner, so the name no
    // longer reserves a gutter for it and the card can close up around them.
    // R49: a room tag names and measures; it no longer teleports - the tour
    // starts from the dock, at the storey's centre ("mahale tıklayarak
    // teleport özelliğini kaldır"). So every tag is inert information, and
    // the 360° badge goes with the click.
    const card=document.createElement('i'),meta=document.createElement('em');
    meta.append(area);card.append(name,meta);el.append(card);
    el.setAttribute('aria-label',area.textContent?`${room.name}, ${area.textContent}`:room.name);
    if(room.label_only)el.title='Açık balkon';
    el.disabled=true;
    overlay.append(el);
    names.push({el,position:new THREE.Vector3(...room.position),floor:room.floor_index});
  }
  // ONE breadth and ONE depth per room, wall to wall - "her odanın yatay ve
  // dikey ölçüsü olmalı", nothing more. The set carries many spans per room;
  // drawing them all is what buried the plan under chips. Per room and per
  // axis the registered DWG span wins, the longest model-measured span
  // stands in (dashed, as before) only where the drawing offers none.
  const chosen=new Map();
  for(const dim of data.dimensions){
    const measured=!dim.dimension_label_allowed;
    if(measured&&dim.basis!=='model_measured')continue;
    const axis=Math.abs(dim.b[0]-dim.a[0])>=Math.abs(dim.b[2]-dim.a[2])?'x':'z';
    const key=`${dim.room_id}|${axis}`;
    const current=chosen.get(key);
    const better=!current
      ||(current.measured&&!measured)
      ||(current.measured===measured&&dim.metres>current.dim.metres);
    if(better)chosen.set(key,{dim,measured});
  }
  for(const {dim,measured} of chosen.values()) {
    const a=new THREE.Vector3(...dim.a),b=new THREE.Vector3(...dim.b);
    const side=b.clone().sub(a).normalize().cross(new THREE.Vector3(0,1,0)).multiplyScalar(.12);
    const line=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([
      a,b,a.clone().add(side),a.clone().sub(side),b.clone().add(side),b.clone().sub(side)]),
      measured?measuredMaterial:material);
    if(measured)line.computeLineDistances();
    line.renderOrder=105;line.userData.aoExcluded=true;group.add(line);
    const el=document.createElement('span');
    el.className=measured?'dimension-label measured':'dimension-label';el.textContent=spanLabel(dim.metres);
    el.title=dim.basis==='dwg_verified'?'Çizimde belirtilen ölçü':'Model üzerinden ölçülen açıklık';
    overlay.append(el);dimensions.push({el,line,position:a.clone().add(b).multiplyScalar(.5),floor:dim.floor_index,roomId:dim.room_id,measured});
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
    const obstacles=collectUIObstacles(host),candidates=[],nameRects=[];
    // A room name stays on its room. It used to go through the same solver as
    // the dimensions, which pushed it aside to clear its neighbours and the
    // panels and dropped it outright when there was no room left - so a name
    // sat beside its room, or vanished as the view pulled back. project()
    // leaves it on the projected centre and it is not moved again.
    let lastPpm=12;
    for(const entry of names) {
      entry.el.hidden=!(entry.floor===floor&&showNames&&!transitioning&&!walking);
      if(entry.el.hidden)continue;
      const distance=Math.max(1,entry.position.distanceTo(camera.position));
      const ppm=camera.isPerspectiveCamera?h*camera.zoom/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*distance):h*camera.zoom/(camera.top-camera.bottom);
      lastPpm=ppm;
      const p=project(entry,camera,w,h,labelFontSize(ppm));
      // A name owns its ground: the measure chips route around every visible
      // name instead of ever landing on one.
      if(p)nameRects.push({left:p.x-entry.el.offsetWidth/2-3,right:p.x+entry.el.offsetWidth/2+3,
        top:p.y-entry.el.offsetHeight/2-3,bottom:p.y+entry.el.offsetHeight/2+3});
    }
    // The chip is subordinate to the name it serves - "oda isminden daha
    // büyük olmamalı" - and scales with the drawing exactly as the names do.
    const dimSize=walking?13:Math.max(6.5,labelFontSize(lastPpm)-2);
    for(const entry of dimensions) {
      const visible=entry.floor===floor&&showDimensions&&!transitioning&&(!walking||entry.roomId===walkRoom);
      entry.line.visible=visible;entry.el.hidden=!visible;
      if(visible){
        const p=project(entry,camera,w,h,dimSize);
        if(p)candidates.push({...p,entry,width:entry.el.offsetWidth,height:entry.el.offsetHeight});
      }
    }
    // The solver places in input order and drops what no longer fits, so the
    // project dimensions are offered first: a crowded plan gives up a measured
    // span before it gives up a registered one.
    candidates.sort((a,b)=>Number(a.entry.measured)-Number(b.entry.measured));
    const placed=layoutAnchoredLabels(candidates,{width:w,height:h,obstacles:[...obstacles,...nameRects]});
    // "yakınlık parametresi olmaksızın": with Ölçüler on, every span of the
    // floor stays readable at any zoom. The solver still declutters what it
    // can; what it cannot place sits on its own anchor instead of vanishing.
    const solved=new Map(placed.map(p=>[p.entry,p]));
    for(const item of candidates){
      const p=solved.get(item.entry);
      item.entry.el.hidden=false;
      item.entry.el.style.left=`${(p??item).x}px`;
      item.entry.el.style.top=`${(p??item).y}px`;
    }
  },dispose(){overlay.remove();group.traverse(o=>o.geometry?.dispose());material.dispose();measuredMaterial.dispose();}};
}
