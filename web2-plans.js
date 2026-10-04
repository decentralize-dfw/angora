/* web2 plans: residence-plans.js with responsive photographs and direct floor transitions. */
(() => {
  'use strict';
  const data=window.ANGORA_ATLAS,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];const S=window.ANGORA_STRINGS||{};
  const {roomBounds}=window.AngoraMotionMath;
  const levels=S.levels||['Garden level','Entrance level','First floor','Attic level'],defaults=[3,4,19,9];
  const svg=$('#atlas-svg'),pins=$('#atlas-pins'),strip=$('#atlas-photo-strip'),map=$('.atlas-map'),image=$('#atlas-native-plan'),layer=$('.atlas-floor-layer');
  const ns='http://www.w3.org/2000/svg';let floor=0,selected,measure=false,poses,manifest,geometry,photoRequest=0;
  const compact=()=>innerWidth<=800;
  function node(name,attrs={},text){const e=document.createElementNS(ns,name);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;return e;}
  const photos=()=>data.photos.filter(p=>p.floor===floor&&!p.outdoor);
  const number=p=>photos().findIndex(item=>item.id===p.id)+1;
  const caption=p=>S.lang==='tr'?(p.tr||p.en).replace('Bodrum ·','Bahçe katı ·'):p.en.replace('Basement ·','Garden level ·').replace('Ground floor ·','Entrance level ·').replace('Attic floor ·','Attic level ·');
  function projection(index){
    const box=roomBounds(poses.floors[index])||manifest.crops[index],w=map.clientWidth,h=map.clientHeight;
    const marginX=Math.max(18,w*.10),marginY=Math.max(16,h*.09),iw=manifest.width,ih=manifest.height;
    const scale=Math.min((w-marginX*2)/(iw*box.width),(h-marginY*2)/(ih*box.height));
    const dx=(w-iw*box.width*scale)/2,dy=(h-ih*box.height*scale)/2;
    return {scale,iw,ih,left:dx-iw*box.x*scale,top:dy-ih*box.y*scale,at:p=>[dx+(p[0]-box.x)*iw*scale,dy+(p[1]-box.y)*ih*scale]};
  }
  function layout(){
    if(!poses||!manifest||!map.clientWidth||!map.clientHeight)return;
    const view=projection(floor);geometry=view.at;
    image.style.cssText='width:'+view.iw*view.scale+'px;height:'+view.ih*view.scale+'px;left:'+view.left+'px;top:'+view.top+'px;';
    svg.setAttribute('viewBox','0 0 '+map.clientWidth+' '+map.clientHeight);drawOverlays();
  }
  function inside(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
  const roomName=name=>{
    name=name.replace(/Bedroom (?:C)?\d+/,'Bedroom').replace('Guest WC','WC').replace('Hall & stairs','Hall');if(S.rooms)name=S.rooms[name]||name;
    if(innerHeight<=540||innerWidth<innerHeight&&innerHeight<=680)name=name.replace(/(?:Primary|Principal) bedroom/i,'Suite').replace('Bedroom','Bed').replace('Living room','Living').replace('Sitting area','Lounge').replace('Dressing room','Dress').replace(/(?:Family )?bathroom/i,'Bath').replace('Landing & kitchenette','Kitchen');
    return name;
  };
  function drawOverlays(){
    if(!poses||!geometry)return;svg.replaceChildren();pins.replaceChildren();
    const pose=poses.floors[floor],w=map.clientWidth,h=map.clientHeight,font=compact()?11:12;
    const points=photos().map(p=>{const registered=pose.photos.find(q=>q.id===p.id);if(!registered)return null;const [x,y]=geometry([registered.x,registered.y]);return {p,registered,x,y,lx:x,ly:y};}).filter(Boolean);
    const reserved=(pose.rooms||[]).map(room=>{const [x,y]=geometry(room.label);return {x,y,w:Math.min(roomName(room.name).length,13)*font*.56,h:font*1.3};});
    const spacing=compact()?44:42;
    for(let pass=0;pass<64;pass++){
      for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
      const a=points[i],b=points[j],dx=b.lx-a.lx,dy=b.ly-a.ly,d=Math.hypot(dx,dy);if(d>=spacing)continue;
      const ux=d>.1?dx/d:(i%2?1:-1),uy=d>.1?dy/d:0,push=(spacing-d)/2+.15;
      a.lx=Math.max(20,Math.min(w-20,a.lx-ux*push));a.ly=Math.max(20,Math.min(h-20,a.ly-uy*push));b.lx=Math.max(20,Math.min(w-20,b.lx+ux*push));b.ly=Math.max(20,Math.min(h-20,b.ly+uy*push));
      }
      points.forEach(p=>reserved.forEach(b=>{
        const dx=p.lx-b.x,dy=p.ly-b.y,sx=b.w/2+(compact()?26:23),sy=b.h/2+(compact()?26:23);
        if(Math.abs(dx)>=sx||Math.abs(dy)>=sy)return;
        if(sx-Math.abs(dx)<sy-Math.abs(dy))p.lx=b.x+(dx<0?-sx:sx);
        else p.ly=b.y+(dy<0?-sy:sy);
        p.lx=Math.max(20,Math.min(w-20,p.lx));p.ly=Math.max(20,Math.min(h-20,p.ly));
      }));
    }
    const labels=[],occupied=[];
    (pose.contours||[pose.contour]).filter(Boolean).forEach((contour,i)=>{
      if(contour.length<3)return;
      const coords=contour.map(geometry);if(coords.every(p=>p[0]<0||p[0]>w||p[1]<0||p[1]>h))return;
      svg.append(node('polygon',{points:coords.map(p=>p.join(',')).join(' '),class:i===0?'graphic-contour':'graphic-wall-boundary'}));
    });
    (pose.rooms||[]).forEach(room=>{
      const poly=room.screen.map(geometry),center=geometry(room.label),name=roomName(room.name);
      const words=name.split(' '),lines=name.length>12?[words.slice(0,Math.ceil(words.length/2)).join(' '),words.slice(Math.ceil(words.length/2)).join(' ')]:[name];
      const tw=Math.max(...lines.map(s=>s.length))*font*.56,th=font*1.25*lines.length;
      const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);
      const candidates=[center,...[.25,.5,.75].flatMap(tx=>[.25,.5,.75].map(ty=>[Math.min(...xs)+(Math.max(...xs)-Math.min(...xs))*tx,Math.min(...ys)+(Math.max(...ys)-Math.min(...ys))*ty]))];
      const free=candidates.find(([x,y])=>inside([x-tw/2,y-th/2],poly)&&inside([x+tw/2,y+th/2],poly)&&points.every(p=>Math.abs(p.lx-x)>tw/2+22||Math.abs(p.ly-y)>th/2+22)&&occupied.every(b=>Math.abs(b.x-x)>(tw+b.w)/2+6||Math.abs(b.y-y)>(th+b.h)/2+6));
      labels.push({room,center,lines,tw,th,free});if(free)occupied.push({x:free[0],y:free[1],w:tw,h:th});
    });
    const callouts=labels.filter(l=>!l.free);
    callouts.sort((a,b)=>b.tw*b.th-a.tw*a.th).forEach(item=>{
      // Pack labels into the nearest available space; no line cuts through a room.
      const [cx,cy]=item.center,poly=item.room.screen.map(geometry),candidates=[];
      candidates.push([cx,Math.max(...poly.map(p=>p[1]))+item.th/2+10]);
      for(let y=item.th/2+8;y<h-item.th/2-8;y+=8)for(let x=item.tw/2+8;x<w-item.tw/2-8;x+=10)candidates.push([x,y]);
      candidates.sort((a,b)=>Math.hypot(a[0]-cx,a[1]-cy)-Math.hypot(b[0]-cx,b[1]-cy));
      const free=candidates.find(([x,y])=>x>=item.tw/2+8&&x<=w-item.tw/2-8&&y>=item.th/2+8&&y<=h-item.th/2-8&&points.every(p=>Math.abs(p.lx-x)>item.tw/2+21||Math.abs(p.ly-y)>item.th/2+21)&&occupied.every(b=>Math.abs(b.x-x)>(item.tw+b.w)/2+5||Math.abs(b.y-y)>(item.th+b.h)/2+5));
      item.free=free||[Math.max(item.tw/2+8,Math.min(w-item.tw/2-8,cx)),Math.max(item.th/2+8,Math.min(h-item.th/2-8,cy))];
      occupied.push({x:item.free[0],y:item.free[1],w:item.tw,h:item.th});
    });
    labels.forEach(item=>{
      const title=node('text',{x:item.free[0],y:item.free[1]-(item.lines.length-1)*font*.6,'text-anchor':'middle','dominant-baseline':'middle',style:'font-size:'+font+'px',class:'graphic-room-label','data-room':item.room.id});
      item.lines.forEach((line,i)=>title.append(node('tspan',{x:item.free[0],dy:i?'1.2em':0},line)));svg.append(title);
    });
    points.forEach(({p,registered,x,y,lx,ly})=>{
      const button=document.createElement('button'),on=p.id===selected?.id;
      button.className='atlas-pin'+(on?' active':'');button.dataset.atlasPhoto=p.id;button.style.left=lx+'px';button.style.top=ly+'px';button.textContent=number(p);button.setAttribute('aria-label',(S.cameraPoint||'Camera point ')+number(p)+': '+caption(p));button.setAttribute('aria-pressed',String(on));pins.append(button);
      if(!registered.direction)return;
      const end=geometry(registered.direction),angle=Math.atan2(end[1]-y,end[0]-x),half=(p.hfov||70)*Math.PI/360,radius=compact()?35:44;
      const at=a=>[x+Math.cos(a)*radius,y+Math.sin(a)*radius],a=at(angle-half),b=at(angle+half),tip=at(angle),cls=on?' selected':'';
      const group=node('g',{'data-camera':number(p),class:'plan-camera'+cls});
      group.append(node('path',{d:'M '+x+' '+y+' L '+a.join(' ')+' A '+radius+' '+radius+' 0 0 1 '+b.join(' ')+' Z',class:'plan-view-cone'+cls}),node('line',{x1:x,y1:y,x2:tip[0],y2:tip[1],class:'plan-view-direction'+cls}));
      const wing=a=>[x+Math.cos(a)*radius*.82,y+Math.sin(a)*radius*.82];group.append(node('path',{d:'M '+wing(angle-.16).join(' ')+' L '+tip.join(' ')+' L '+wing(angle+.16).join(' '),class:'plan-camera-arrow'+cls}),node('circle',{cx:x,cy:y,r:2.5,class:'plan-pin-anchor'+cls}));svg.append(group);
      if(Math.hypot(lx-x,ly-y)>19)svg.append(node('polyline',{points:x+','+y+' '+x+','+ly+' '+lx+','+ly,class:'plan-pin-leader'}));
    });
    if(measure){
      const drawn=[];
      pose.dimensions.filter(d=>d.metres>=1&&d.metres<=10).forEach(d=>{
        const a=geometry(d.screen[0]),b=geometry(d.screen[1]);if([...a,...b].some((v,i)=>v<14||v>(i%2?h:w)-14))return;
        const vertical=Math.abs(b[1]-a[1])>Math.abs(b[0]-a[0]),x=(a[0]+b[0])/2+(vertical?-9:0),y=(a[1]+b[1])/2+(vertical?0:-9);
        if(points.some(p=>Math.hypot(p.lx-x,p.ly-y)<28)||labels.some(l=>Math.abs(l.free[0]-x)<l.tw/2+22&&Math.abs(l.free[1]-y)<l.th/2+8))return;
        if(drawn.some(p=>Math.hypot(p[0]-x,p[1]-y)<34)||drawn.length>=8)return;drawn.push([x,y]);
        const g=node('g',{class:'plan-dimension'});g.append(node('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1]}));
        for(const p of [a,b])g.append(node('line',{x1:p[0]-(vertical?3:0),y1:p[1]-(vertical?0:3),x2:p[0]+(vertical?3:0),y2:p[1]+(vertical?0:3)}));
        g.append(node('text',{x,y,'text-anchor':'middle','dominant-baseline':'middle',transform:vertical?'rotate(-90 '+x+' '+y+')':'',style:'font-size:11px'},d.metres.toFixed(2)+' m'));svg.append(g);
      });
    }
  }
  function commitPhoto(p){
    selected=p;const title=caption(p);const room=data.rooms.find(r=>r.id===p.roomId);
    $('#atlas-image').src=window.AngoraPhoto.src(p.file,1200);$('#atlas-image').srcset=window.AngoraPhoto.srcset(p.file);$('#atlas-image').sizes='(max-width: 800px) 100vw, 40vw';$('#atlas-image').alt=title;$('#atlas-photo-number').textContent=(S.camera||'Camera ')+number(p)+' · '+levels[floor];$('#atlas-photo-title').textContent=title.includes(' · ')?title.split(' · ').slice(1).join(' · '):title;
    $('#atlas-photo-description').textContent=(room?.name?(S.rooms?.[room.name.replace(/Bedroom (?:C)?\d+/,'Bedroom')]||room.name.replace(/Bedroom (?:C)?\d+/,'Bedroom')):levels[floor])+(room?.area?' · '+room.area.toFixed(2)+' m²':'');
    $('#atlas-open').dataset.photo=p.file;$('#atlas-open').dataset.caption=title;
    strip.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.atlasPhoto)===p.id)));drawOverlays();
  }
  async function showPhoto(id,animate=true){
    const p=photos().find(p=>p.id===Number(id));if(!p||p.id===selected?.id)return;
    const request=++photoRequest;
    if(!animate||matchMedia('(prefers-reduced-motion: reduce)').matches){commitPhoto(p);return;}
    const next=new Image();next.src=window.AngoraPhoto.src(p.file,1200);await next.decode().catch(()=>{});if(request!==photoRequest)return;
    const old=$('#atlas-image').cloneNode();old.removeAttribute('id');old.className='atlas-photo-previous';old.setAttribute('aria-hidden','true');$('#atlas-open').append(old);commitPhoto(p);
    gsap.fromTo($('#atlas-image'),{opacity:0},{opacity:1,duration:.28,ease:'power2.out',overwrite:true});gsap.to(old,{opacity:0,duration:.28,onComplete:()=>old.remove()});
  }
  function selectFloor(index,force=false){
    index=Math.max(0,Math.min(3,Number(index)));if(index===floor&&selected&&!force)return;floor=index;photoRequest++;selected=null;
    $('#atlas-level').textContent=levels[floor];$('#atlas-schedule-heading').textContent=levels[floor];$('#atlas-panel').setAttribute('aria-labelledby','atlas-tab-'+floor);map.dataset.floor=floor;
    image.src='./assets/web2/chapters/plan-'+floor+(compact()?'-900':'-1600')+'.webp';image.alt=(S.planAlt||'Furnished model plan: ')+levels[floor];
    $$('[data-atlas-floor]').forEach(b=>{const on=Number(b.dataset.atlasFloor)===floor;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
    strip.replaceChildren();photos().forEach(p=>{const b=document.createElement('button'),img=document.createElement('img'),label=document.createElement('span');b.dataset.atlasPhoto=p.id;b.setAttribute('aria-label',(S.cameraPoint||'Camera point ')+number(p)+': '+caption(p));img.src=window.AngoraPhoto.src(p.file,480);img.alt=caption(p);img.loading='lazy';img.decoding='async';label.textContent=number(p);b.append(img,label);strip.append(b);});
    const list=$('#atlas-room-list');list.replaceChildren();data.rooms.filter(r=>r.floor===floor).forEach(r=>{const b=document.createElement('button');b.textContent=(S.rooms?.[r.name.replace(/Bedroom (?:C)?\d+/,'Bedroom')]||r.name)+(r.area?' · '+r.area.toFixed(2)+' m²':'');b.dataset.atlasRoom=r.id;list.append(b);});
    showPhoto(defaults[floor],false);layout();
  }
  document.addEventListener('click',e=>{
    const point=e.target.closest('[data-atlas-photo]');if(point)showPhoto(point.dataset.atlasPhoto);
    const tab=e.target.closest('[data-atlas-floor]');if(tab){transition(Number(tab.dataset.atlasFloor));}
    const room=e.target.closest('[data-atlas-room]');if(room){const p=photos().find(p=>p.roomId===room.dataset.atlasRoom);if(p)showPhoto(p.id);}
  });
  $$('[data-atlas-floor]').forEach(b=>b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=e.key==='Home'?0:e.key==='End'?3:(floor+(e.key==='ArrowRight'?1:3))%4;transition(i);$('#atlas-tab-'+i).focus({preventScroll:true});}));
  $('#atlas-measure').onclick=()=>{measure=!measure;$('#atlas-measure').setAttribute('aria-pressed',String(measure));$('#atlas-measure').innerHTML=(S.dimensions||'Dimensions')+' <span aria-hidden="true">'+(measure?'−':'＋')+'</span>';drawOverlays();if(measure&&!matchMedia('(prefers-reduced-motion: reduce)').matches)gsap.from('.plan-dimension',{opacity:0,duration:.25,ease:'power1.out'});};
  window.addEventListener('angora:floor',e=>{transition(Number(e.detail));});
  async function transition(index){
    index=Math.max(0,Math.min(3,Number(index)));if(index===floor)return;
    if(!poses||!manifest||matchMedia('(prefers-reduced-motion: reduce)').matches){selectFloor(index);return;}
    const next=new Image(),photo=new Image();next.src='./assets/web2/chapters/plan-'+index+(compact()?'-900':'-1600')+'.webp';photo.src=window.AngoraPhoto.src(data.photos.find(p=>p.id===defaults[index]).file,1200);
    await Promise.all([next.decode().catch(()=>{}),photo.decode().catch(()=>{})]);
    const panel=$('#atlas-panel'),direction=Math.sign(index-floor),width=panel.clientWidth+Math.max(16,innerWidth*.03);
    // Move the complete registered drawing and its photograph together. No
    // contour interpolation: each floor remains an honest architectural plan.
    const previous=panel.cloneNode(true);previous.removeAttribute('id');previous.removeAttribute('role');previous.removeAttribute('aria-labelledby');
    previous.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));previous.querySelectorAll('canvas').forEach(e=>e.remove());
    previous.classList.add('atlas-slide-previous');previous.setAttribute('aria-hidden','true');previous.inert=true;
    const live=[...panel.children];selectFloor(index);await image.decode().catch(()=>{});panel.append(previous);
    gsap.set(live,{x:direction*width});
    await new Promise(resolve=>gsap.timeline({onComplete:resolve})
      .to(previous,{x:-direction*width,duration:.95,ease:'power2.inOut'},0)
      .to(live,{x:0,duration:.95,ease:'power2.inOut'},0));
    previous.remove();gsap.set(live,{clearProps:'transform'});layout();
  }
  window.AngoraPlan={selectFloor,layout,transition,get floor(){return floor;}};
  new ResizeObserver(layout).observe(map);image.addEventListener('load',layout);
  const loadPoses=()=>Promise.all([fetch('./assets/residence/chapters/poses.json').then(r=>r.json()),fetch('./assets/residence/chapters/native-manifest.json').then(r=>r.json())]).then(([p,m])=>{poses=p;manifest=m;layout();});
  const near=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){near.disconnect();loadPoses();}},{rootMargin:'120% 0px'});near.observe(document.querySelector('#atlas'));
  selectFloor(0,true);
})();
