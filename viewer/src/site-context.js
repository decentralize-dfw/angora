import * as THREE from 'three';
import {collectUIObstacles,layoutAnchoredLabels} from './screen-layout.js';

export function createSiteContext(data,host,onVilla){
  const overlay=document.createElement('div');overlay.className='site-overlay';host.append(overlay);
  const points=data.buildings.slice().sort((a,b)=>(b.number===21)-(a.number===21)).map(b=>{
    const el=document.createElement(b.number===21?'button':'span');
    el.className=b.number===21?'site-label site-label-villa':'site-label';
    el.textContent=b.number===21?'Villa 21':String(b.number);
    if(b.number===21){el.type='button';el.setAttribute('aria-label','Villa 21’e yaklaş');el.onclick=onVilla;}
    else el.title=`Vaziyet planı · Yapı ${b.number}`;
    overlay.append(el);return {el,p:new THREE.Vector3(...b.position)};
  });
  const scale=document.querySelector('#model-scale'),bar=scale.querySelector('i'),label=scale.querySelector('span');
  const point=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),right=new THREE.Vector3();
  return {update(view,camera,target,transitioning,walking){
    const active=['region','neighborhood'].includes(view)&&!transitioning&&!walking;
    overlay.hidden=!active;scale.hidden=walking||transitioning;
    if(!camera||!target)return;
    camera.updateMatrixWorld();
    const w=host.clientWidth,h=host.clientHeight,candidates=[];
    if(active)for(const item of points){
      point.copy(item.p).project(camera);
      const x=(point.x+1)*w/2,y=(1-point.y)*h/2;
      item.el.hidden=point.z< -1||point.z>1||x<0||x>w||y<0||y>h;
      if(item.el.hidden)continue;
      candidates.push({x,y,entry:item,width:item.el.offsetWidth,height:item.el.offsetHeight});
    }
    // Horizontal ground-plane model distance at the orbit target, not a
    // surveyed cadastral dimension or screen-wide perspective claim.
    right.set(1,0,0).applyQuaternion(camera.quaternion);right.y=0;right.normalize();
    a.copy(target).project(camera);b.copy(target).add(right).project(camera);
    const ppm=Math.abs(b.x-a.x)*w/2;
    const metres=[.5,1,2,5,10,20,50,100].filter(m=>m*ppm<110).at(-1)??.5;
    bar.style.width=Math.max(1,metres*ppm)+'px';label.textContent=metres.toLocaleString('tr-TR')+' m';
    const placed=layoutAnchoredLabels(candidates,{width:w,height:h,obstacles:collectUIObstacles(host),maxDisplacement:0});
    for(const item of candidates)item.entry.el.hidden=true;
    for(const {entry,x,y} of placed){entry.el.hidden=false;entry.el.style.left=x+'px';entry.el.style.top=y+'px';}
  },dispose(){overlay.remove();}};
}
