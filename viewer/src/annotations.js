import * as THREE from 'three';
import {collectUIObstacles,layoutDimensionsAtMidpoint} from './screen-layout.js';
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
  // Every room in the register carries its measured x and z spans, so the
  // rectangle a name has to stay inside is known rather than guessed.
  const spanOf=room=>{
    const span={x:0,z:0};
    for(const id of room.dimensions??[]){
      const dim=data.dimensions?.find(entry=>entry.id===id);if(!dim)continue;
      const axis=Math.abs(dim.b[0]-dim.a[0])>=Math.abs(dim.b[2]-dim.a[2])?'x':'z';
      span[axis]=Math.max(span[axis],dim.metres);
    }
    return span;
  };
  const boxOf=room=>{
    let x=null,z=null;
    for(const id of room.dimensions??[]){
      const dim=data.dimensions?.find(entry=>entry.id===id);if(!dim)continue;
      const dx=Math.abs(dim.b[0]-dim.a[0]),dz=Math.abs(dim.b[2]-dim.a[2]);
      if(dx>=dz&&(!x||dx>x[1]-x[0]))x=[Math.min(dim.a[0],dim.b[0]),Math.max(dim.a[0],dim.b[0])];
      if(dz>dx&&(!z||dz>z[1]-z[0]))z=[Math.min(dim.a[2],dim.b[2]),Math.max(dim.a[2],dim.b[2])];
    }
    return x&&z?{x0:x[0],x1:x[1],z0:z[0],z1:z[1]}:null;
  };
  const material=new THREE.LineBasicMaterial({color:0x315e5c,depthTest:false,depthWrite:false,toneMapped:false});
  const measuredMaterial=new THREE.LineDashedMaterial({color:0x6d8a82,dashSize:.16,gapSize:.12,
    depthTest:false,depthWrite:false,toneMapped:false});
  const batches=[material,measuredMaterial].map(m=>{
    const line=new THREE.LineSegments(new THREE.BufferGeometry(),m);
    line.renderOrder=105;line.userData.aoExcluded=true;group.add(line);return line;
  });
  let dimensionKey='';
  for(const room of data.rooms) {
    const el=document.createElement('div');el.className='room-label';
    const name=document.createElement('strong');name.textContent=room.name;
    const area=document.createElement('span');area.textContent=areaLabel(room,data);
    const card=document.createElement('i'),meta=document.createElement('em');
    meta.append(area);card.append(name,meta);el.append(card);
    el.setAttribute('aria-label',`${room.name} ${area.textContent}`);
    overlay.append(el);
    const span=spanOf(room);
    // Odanın gerçek dikdörtgeni ölçü çizgilerinin uçlarından: kayıttaki room.position
    // odanın ortası DEĞİL (ebeveyn yatak odasında kuzey duvarına 0,9 m), o yüzden
    // etiket onun etrafındaki sanal dikdörtgende "sığıp" duvarın üstüne taşıyordu.
    // Etiket artık bu dikdörtgenin ortasında durur ve hep onun içine sığar.
    const box=boxOf(room),center=box?[(box.x0+box.x1)/2,room.position[1],(box.z0+box.z1)/2]:room.position;
    if(box){span.x=box.x1-box.x0;span.z=box.z1-box.z0;}
    names.push({el,kind:'name',position:new THREE.Vector3(...center),floor:room.floor_index,
      span,corners:[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sz])=>
        new THREE.Vector3(center[0]+sx*span.x/2,center[1],center[2]+sz*span.z/2))});
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
    line.renderOrder=105;line.userData.aoExcluded=true;
    const el=document.createElement('span');
    el.className=measured?'dimension-label measured':'dimension-label';el.textContent=spanLabel(dim.metres);
    el.title=dim.basis==='dwg_verified'?'Çizimde belirtilen ölçü':dim.boundary_kind==='floor_edge'?'Modelde döşeme sınırları arasındaki ölçü':'Model üzerinden ölçülen açıklık';
    overlay.append(el);dimensions.push({el,line,a,b,position:a.clone().add(b).multiplyScalar(.5),floor:dim.floor_index,roomId:dim.room_id,measured});
  }
  // The largest uniform scale at which a w×h upright plate centred at (cx,cy)
  // still fits inside a convex screen quad. Each edge gives one bound; the
  // outward normal is the one pointing away from the quad's own centre, so the
  // winding of the projection - which flips as the model is orbited - cannot
  // invert the test. This is what keeps a room's name inside that room's
  // floor from every angle instead of bleeding over the wall.
  function fitInside(quad,cx,cy,w,h) {
    let gx=0,gy=0;
    for(const p of quad){gx+=p[0]/4;gy+=p[1]/4;}
    let fit=Infinity;
    for(let i=0;i<4;i++){
      const a=quad[i],b=quad[(i+1)%4];
      let nx=b[1]-a[1],ny=a[0]-b[0];
      const length=Math.hypot(nx,ny);if(length<1e-6)continue;
      nx/=length;ny/=length;
      if(nx*(gx-a[0])+ny*(gy-a[1])>0){nx=-nx;ny=-ny;}
      const room=nx*a[0]+ny*a[1]-(nx*cx+ny*cy);
      const reach=Math.abs(nx)*w/2+Math.abs(ny)*h/2;
      if(reach<1e-6)continue;
      fit=Math.min(fit,room/reach);
    }
    return fit;
  }
  function project(entry,camera,w,h,size) {
    point.copy(entry.position).project(camera);
    const visible=point.z>-1&&point.z<1;
    entry.el.hidden=!visible;if(!visible)return null;
    const x=THREE.MathUtils.clamp((point.x+1)*w/2,12,w-12),y=THREE.MathUtils.clamp((1-point.y)*h/2,12,h-12);
    entry.el.style.left=`${x}px`;entry.el.style.top=`${y}px`;entry.el.style.fontSize=`${size}px`;
    return {x,y};
  }
  const corner=new THREE.Vector3();
  return {group,data,update(view,showNames,showDimensions,transitioning,walking,camera,walkRoom,extraObstacles=[]) {
    const floor=/^f[0-3]$/.test(view)?Number(view[1]):-1;
    const w=host.clientWidth,h=host.clientHeight;
    camera.updateMatrixWorld();
    const obstacles=collectUIObstacles(host),candidates=[];
    // Writes first, reads second: reading offsetWidth right after writing a
    // label's left/top/fontSize forces a synchronous layout PER LABEL, every
    // frame the floor is orbited - dozens of layouts a frame inside the
    // villa. Positioning every label and only then measuring them all costs
    // one layout for the whole set.
    const named=[];
    for(const entry of names) {
      entry.el.hidden=!(entry.floor===floor&&showNames&&!transitioning&&!walking);
      if(entry.el.hidden)continue;
      const distance=Math.max(1,entry.position.distanceTo(camera.position));
      const ppm=camera.isPerspectiveCamera?h*camera.zoom/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*distance):h*camera.zoom/(camera.top-camera.bottom);
      const p=project(entry,camera,w,h,w<=720?9.5:labelFontSize(ppm));
      if(p)named.push({entry,p});
    }
    const measured=[];
    for(const entry of dimensions) {
      const visible=entry.floor===floor&&showDimensions&&!transitioning&&(!walking||entry.roomId===walkRoom);
      entry.line.visible=visible;entry.el.hidden=!visible;
      if(visible){const p=project(entry,camera,w,h,10);if(p)measured.push({entry,p});}
    }
    for(const item of named){item.width=item.entry.el.offsetWidth;item.height=item.entry.el.offsetHeight;}
    for(const item of measured){item.width=item.entry.el.offsetWidth;item.height=item.entry.el.offsetHeight;}
    for(const {entry,p,width,height} of named) {
      // The tag is a plate now, not glowing text, so it has to earn its area:
      // it shrinks until it sits inside its own room and disappears when that
      // room is too small on screen to carry a legible one.
      let fit=1;
      if(entry.span.x>0&&entry.span.z>0){
        const quad=entry.corners.map(v=>{corner.copy(v).project(camera);
          return [(corner.x+1)*w/2,(1-corner.y)*h/2];});
        fit=Math.max(0,Math.min(1,fitInside(quad,p.x,p.y,width,height)));
      }
      if(fit<0.56){entry.el.hidden=true;continue;}
      entry.el.style.setProperty('--label-fit',fit.toFixed(3));
      candidates.push({...p,entry,width:width*fit,height:height*fit});
    }
    const nameCount=candidates.length;
    for(const {entry,p,width,height} of measured)candidates.push({...p,entry,width,height});
    const nextKey=dimensions.map(e=>e.line.visible?'1':'0').join('');
    if(nextKey!==dimensionKey){
      dimensionKey=nextKey;
      batches.forEach((batch,index)=>{
        const values=dimensions.filter(e=>e.line.visible&&Number(e.measured)===index)
          .flatMap(e=>Array.from(e.line.geometry.attributes.position.array));
        batch.geometry.dispose();batch.geometry=new THREE.BufferGeometry();
        batch.geometry.setAttribute('position',new THREE.Float32BufferAttribute(values,3));
        batch.visible=values.length>0;if(index&&values.length)batch.computeLineDistances();
      });
    }
    // Names are placed first, then dimensions avoid the names, the controls
    // AND the photograph marks - a measurement printed under a camera pin is
    // two drawings on one spot, which is what the owner saw on the attic plan.
    const placed=layoutDimensionsAtMidpoint(candidates,{width:w,height:h,obstacles,fixedFrom:nameCount,extraObstacles});
    for(const item of candidates)item.entry.el.hidden=true;
    leaders.replaceChildren();leaders.setAttribute('viewBox',`0 0 ${w} ${h}`);
    for(const entry of dimensions.filter(e=>e.line.visible)){
      const a=entry.a.clone().project(camera),b=entry.b.clone().project(camera);
      if(a.z<-1||a.z>1||b.z<-1||b.z>1)continue;
      const x1=(a.x+1)*w/2,y1=(1-a.y)*h/2,x2=(b.x+1)*w/2,y2=(1-b.y)*h/2;
      const line=document.createElementNS(leaders.namespaceURI,'line');
      for(const [k,v] of Object.entries({x1,y1,x2,y2}))line.setAttribute(k,v);
      line.classList.add('dimension-witness');leaders.append(line);
      for(const [cx,cy] of [[x1,y1],[x2,y2]]){
        const dot=document.createElementNS(leaders.namespaceURI,'circle');
        for(const [k,v] of Object.entries({cx,cy,r:2.5}))dot.setAttribute(k,v);
        dot.classList.add('dimension-endpoint');leaders.append(dot);
      }
    }
    // Ölçüler çizgi ortasında sabit, adlar en çok bir satır kayar - kaçan
    // etiketin bağlantı çizgisine artık gerek yok.
    for(const {entry,x,y} of placed){
      entry.el.hidden=false;entry.el.style.left=`${x}px`;entry.el.style.top=`${y}px`;
      if(entry.kind==='name')entry.el.dataset.plate='on';
    }
    overlay.dataset.expected=String(candidates.length);overlay.dataset.placed=String(placed.length);
  },dispose(){overlay.remove();group.traverse(o=>o.geometry?.dispose());dimensions.forEach(e=>e.line.geometry.dispose());material.dispose();measuredMaterial.dispose();}};
}
