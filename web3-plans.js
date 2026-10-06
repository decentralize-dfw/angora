import {FLOORS} from './web3-state.js?v=20261006-refinement-2';
import {decodedImage} from './web3-media.js?v=20261006-refinement-2';
const NS='http://www.w3.org/2000/svg';
const el=(tag,attrs)=>{const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n;};
const friendly=name=>name.replace(/Bedroom 106|Bedroom C02/g,'Bedroom II').replace(/Bedroom 107|Bedroom C04/g,'Bedroom III').replace('Basement','Garden');
export const photoURL=(manifest,key,width=800)=>{const variants=manifest.photos[key]?.variants;return variants?.find(v=>v.width>=width)?.url||variants?.at(-1)?.url;};
export function photoName(manifest,floor,photo){return friendly(manifest.floors[floor].rooms.find(r=>r.id===photo.room)?.name||photo.name?.split(/[–—�]/).at(-1)?.trim()||'Interior');}
export function makePlan(manifest,floor,camera,dimensions=false){
  const data=manifest.floors[floor], unit=document.createElement('div');unit.className='plan-unit';unit.dataset.planFloor=floor;
  const box=document.createElement('div');box.className='drawing';
  const svg=el('svg',{'role':'img','aria-label':`${FLOORS[floor]} floor plan, selected photograph and viewing direction`});
  const defs=el('defs',{}),marker=el('marker',{id:`view-arrow-${floor}`,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto'});marker.append(el('path',{d:'M1 1L9 5L1 9',fill:'none',stroke:'#5c4133','stroke-width':1.5}));defs.append(marker);svg.append(defs);
  const pts=data.contours.flat();const xs=pts.map(p=>p[0]*2560),ys=pts.map(p=>p[1]*1440);
  const x=Math.min(...xs)-45,y=Math.min(...ys)-45,w=Math.max(...xs)-x+45,h=Math.max(...ys)-y+45;
  svg.setAttribute('viewBox',`${x} ${y} ${w} ${h}`);
  svg.append(el('image',{href:data.plan,x:0,y:0,width:2560,height:1440,opacity:'.19'}));
  for(const c of data.contours)svg.append(el('path',{d:'M'+c.map(p=>`${p[0]*2560},${p[1]*1440}`).join('L')+'Z',class:'wall'}));
  for(const room of data.rooms){
    if(!room.label)continue;
    const label=el('text',{x:room.label[0]*2560,y:room.label[1]*1440,class:'room-label','text-anchor':'middle','data-room':room.id});
    label.textContent=friendly(room.name).replace('Landing & kitchenette','Landing').replace('Hall & stairs','Hall');label.dataset.fullName=label.textContent;svg.append(label);
  }
  const dimensionGroup=el('g',{class:'plan-dimensions'});
  for(const d of data.dimensions){
    const [a,b]=d.screen;dimensionGroup.append(el('path',{d:`M${a[0]*2560},${a[1]*1440}L${b[0]*2560},${b[1]*1440}`,class:'dimension'}));
    const t=el('text',{x:(a[0]+b[0])*1280,y:(a[1]+b[1])*720-5,class:'dimension-label'});t.textContent=d.metres+' m';dimensionGroup.append(t);
  }
  svg.append(dimensionGroup);unit.classList.toggle('dimensions-visible',dimensions);
  const active=data.photos.find(p=>p.id===camera)||data.photos[0];
  for(const p of data.photos){
    const px=p.x*2560,py=p.y*1440,dx=p.direction[0]*2560-px,dy=p.direction[1]*1440-py,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
    const selected=p.id===active.id;
    if(selected){const reach=Math.min(w,h)*.16,halfAngle=(p.hfov||55)*Math.PI/360,spread=Math.tan(halfAngle)*reach;
      svg.append(el('path',{d:`M${px},${py}L${px+ux*reach-uy*spread},${py+uy*reach+ux*spread}L${px+ux*reach+uy*spread},${py+uy*reach-ux*spread}Z`,class:'view-cone'}));
      svg.append(el('path',{d:`M${px},${py}L${px+ux*reach*.82},${py+uy*reach*.82}`,class:'camera-axis','marker-end':`url(#view-arrow-${floor})`}));
    }else svg.append(el('path',{d:`M${px},${py}l${ux*20},${uy*20}`,class:'direction-tick'}));
    const g=el('g',{class:selected?'camera-pin active':'camera-pin','data-camera':p.id});
    g.append(el('circle',{cx:px,cy:py,r:selected?13:9}));
    const number=el('text',{x:px,y:py+4,'text-anchor':'middle'});number.textContent=p.number;g.append(number);svg.append(g);
  }
  box.append(svg);unit.append(box);
  const figure=document.createElement('figure');figure.className='plan-photo';
  const button=document.createElement('button');button.className='photo-open';button.dataset.openCamera='';button.setAttribute('aria-label',`Enlarge ${photoName(manifest,floor,active)} photograph ${active.number}`);
  const img=new Image();img.src=photoURL(manifest,active.key);img.width=manifest.photos[active.key].width;img.height=manifest.photos[active.key].height;img.alt=`${photoName(manifest,floor,active)}, ${FLOORS[floor]} level`;img.decoding='async';button.append(img);
  const badge=document.createElement('span');badge.textContent='View photograph ↗';badge.className='photo-badge';button.append(badge);figure.append(button);
  const caption=document.createElement('figcaption');caption.innerHTML=`<span>${FLOORS[floor]} · Photograph ${active.number}</span><strong>${photoName(manifest,floor,active)}</strong>`;
  const room=data.rooms.find(r=>r.id===active.room);if(room?.area){const area=document.createElement('small');area.textContent=`${room.area.toFixed(2)} m² · supplied room schedule`;caption.append(area);}
  figure.append(caption);unit.append(figure);
  return unit;
}
export async function preparePlan(manifest,floor,camera,dimensions){
  const photo=manifest.floors[floor].photos.find(p=>p.id===camera)||manifest.floors[floor].photos[0];
  await Promise.all([decodedImage(manifest.floors[floor].plan),decodedImage(photoURL(manifest,photo.key))]);return makePlan(manifest,floor,camera,dimensions);
}
