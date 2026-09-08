import * as THREE from 'three';

export function labelFontSize(pixelsPerMetre) {
  return THREE.MathUtils.clamp(12+Math.log2(Math.max(1,pixelsPerMetre)/18)*1.6,12,19);
}
export function areaLabel(room) {
  return Number.isFinite(room.area_m2)?`${room.area_m2.toLocaleString('tr-TR',{minimumFractionDigits:1,maximumFractionDigits:1})} m²`:'Alan doğrulanıyor';
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
    const area=document.createElement('span');area.textContent=areaLabel(room);
    const tour=document.createElement('small');tour.textContent='360°';tour.setAttribute('aria-hidden','true');
    el.append(name,area,tour);el.setAttribute('aria-label',`${room.name}, ${area.textContent}, 360 derece gez`);
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
    const occupied=[];
    for(const entry of names) {
      entry.el.hidden=!(entry.floor===floor&&showNames&&!transitioning&&!walking);
      if(entry.el.hidden)continue;
      const distance=Math.max(1,entry.position.distanceTo(camera.position));
      const ppm=camera.isPerspectiveCamera?h*camera.zoom/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*distance):h*camera.zoom/(camera.top-camera.bottom);
      const p=project(entry,camera,w,h,labelFontSize(ppm));if(!p)continue;
      const rw=entry.el.offsetWidth,rh=entry.el.offsetHeight;
      let y=p.y;
      for(let i=0;i<8;i++) {
        const hit=occupied.find(r=>Math.abs(p.x-r.x)<(rw+r.w)/2+4&&Math.abs(y-r.y)<(rh+r.h)/2+3);
        if(!hit)break;y=hit.y+(rh+hit.h)/2+4;
      }
      y=THREE.MathUtils.clamp(y,Math.max(rh/2,95),h-rh/2-105);
      entry.el.style.top=`${y}px`;entry.el.style.left=`${THREE.MathUtils.clamp(p.x,rw/2+5,w-rw/2-5)}px`;
      occupied.push({x:p.x,y,w:rw,h:rh});
    }
    for(const entry of dimensions) {
      const visible=entry.floor===floor&&showDimensions&&!transitioning&&(!walking||entry.roomId===walkRoom);
      entry.line.visible=visible;entry.el.hidden=!visible;
      if(visible)project(entry,camera,w,h,walking?15:13);
    }
  },dispose(){overlay.remove();group.traverse(o=>o.geometry?.dispose());material.dispose();}};
}
