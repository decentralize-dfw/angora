(() => {
  'use strict';
  const data=window.ANGORA_ATLAS,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const levels=['Garden level','Entrance level','First floor','Attic level'],defaults=[3,4,19,9];
  const svg=$('#atlas-svg'),pins=$('#atlas-pins'),strip=$('#atlas-photo-strip'),map=$('.atlas-map'),image=$('#atlas-native-plan'),layer=$('.atlas-floor-layer');
  const ns='http://www.w3.org/2000/svg';let floor=0,selected,measure=false,poses,manifest,geometry;
  function node(name,attrs={},text){const e=document.createElementNS(ns,name);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;return e;}
  const photos=()=>data.photos.filter(p=>p.floor===floor&&!p.outdoor);
  const number=p=>photos().findIndex(item=>item.id===p.id)+1;
  const caption=p=>p.en.replace('Basement ·','Garden level ·').replace('Ground floor ·','Entrance level ·').replace('Attic floor ·','Attic level ·');
  function layout(){
    if(!poses||!manifest)return;
    const crop=manifest.crops[floor],w=map.clientWidth,h=map.clientHeight,iw=manifest.width,ih=manifest.height,scale=Math.min(w/(iw*crop.width),h/(ih*crop.height));
    const dx=(w-iw*crop.width*scale)/2,dy=(h-ih*crop.height*scale)/2;
    image.style.cssText=`width:${iw*scale}px;height:${ih*scale}px;left:${dx-iw*crop.x*scale}px;top:${dy-ih*crop.y*scale}px;`;
    geometry=p=>[100*(dx+(p[0]-crop.x)*iw*scale)/w,100*(dy+(p[1]-crop.y)*ih*scale)/h];
    drawOverlays();
  }
  function drawOverlays(){
    if(!poses||!geometry)return;svg.replaceChildren();pins.replaceChildren();
    const pose=poses.floors[floor],w=map.clientWidth,h=map.clientHeight;
    const labels=[];const rooms=node('g',{class:'graphic-rooms'});
    (pose.rooms||[]).forEach(room=>{
      const projected=room.screen.map(geometry),label=geometry(room.label),name=room.name.replace(/Bedroom (?:C)?\d+/,'Bedroom');
      rooms.append(node('polygon',{points:projected.map(p=>p.join(',')).join(' '),class:'graphic-room', 'data-room':room.id}));
      const title=node('text',{x:0,y:0,transform:`translate(${label[0]} ${label[1]}) scale(${h/w} 1)`,style:`font-size:${100*(innerWidth<801?8:11)/h}px`,class:'graphic-room-label','text-anchor':'middle'});
      const words=name.split(' '),lines=name.length>15?[words.slice(0,Math.ceil(words.length/2)).join(' '),words.slice(Math.ceil(words.length/2)).join(' ')]:[name];
      lines.forEach((line,i)=>title.append(node('tspan',{x:0,dy:i?'1.15em':0},line)));rooms.append(title);labels.push({title,projected,label,name});
    });
    svg.append(rooms);
    (pose.contours||[pose.contour]).filter(Boolean).forEach((contour,i)=>svg.append(node('polygon',{points:contour.map(geometry).map(p=>p.join(',')).join(' '),class:i===0?'graphic-contour':'graphic-wall-boundary'})));
    const points=photos().map(p=>{const registered=pose.photos.find(q=>q.id===p.id);if(!registered)return null;const [x,y]=geometry([registered.x,registered.y]);return {p,registered,x,y,lx:x*w/100,ly:y*h/100};}).filter(Boolean);
    // Registered camera locations stay fixed; only their labels separate in tight rooms.
    const spacing=matchMedia('(max-width:800px)').matches?27:34;
    for(let pass=0;pass<32;pass++)for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
      const a=points[i],b=points[j],dx=b.lx-a.lx,dy=b.ly-a.ly,d=Math.hypot(dx,dy);
      if(d>=spacing)continue;const ux=d>0.1?dx/d:(i%2?1:-1),uy=d>0.1?dy/d:0,push=(spacing-d)/2+.1;
      a.lx=Math.max(16,Math.min(w-16,a.lx-ux*push));a.ly=Math.max(16,Math.min(h-16,a.ly-uy*push));b.lx=Math.max(16,Math.min(w-16,b.lx+ux*push));b.ly=Math.max(16,Math.min(h-16,b.ly+uy*push));
    }
    // Room labels avoid camera numbers; compact rooms receive a margin callout.
    const inside=(p,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
    const callouts=[];
    labels.forEach(item=>{
      const font=innerWidth<801?8:11,textWidth=Math.min(item.name.length,15)*font*.55,textHeight=item.name.length>15?font*2.3:font*1.3;
      const poly=item.projected.map(p=>[p[0]*w/100,p[1]*h/100]),xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]),center=[item.label[0]*w/100,item.label[1]*h/100];
      const candidates=[center,...[.25,.5,.75].flatMap(tx=>[.2,.4,.6,.8].map(ty=>[Math.min(...xs)+(Math.max(...xs)-Math.min(...xs))*tx,Math.min(...ys)+(Math.max(...ys)-Math.min(...ys))*ty]))];
      const free=candidates.find(([x,y])=>inside([x-textWidth/2,y],poly)&&inside([x+textWidth/2,y+textHeight],poly)&&points.every(p=>Math.abs(p.lx-x)>textWidth/2+17||Math.abs(p.ly-y)>textHeight+16));
      if(free){item.title.setAttribute('transform',`translate(${free[0]/w*100} ${free[1]/h*100}) scale(${h/w} 1)`);return;}
      callouts.push(item);
    });
    callouts.forEach((item,i)=>{
      const x=89,y=25+i*13;item.title.setAttribute('transform',`translate(${x} ${y}) scale(${h/w} 1)`);
    });
    points.forEach(({p,registered,x,y,lx,ly})=>{
      const button=document.createElement('button'),labelX=lx/w*100,labelY=ly/h*100;
      button.className=`atlas-pin${p.id===selected?.id?' active':''}`;button.dataset.atlasPhoto=p.id;
      button.style.left=`${labelX}%`;button.style.top=`${labelY}%`;button.textContent=number(p);button.setAttribute('aria-label',`Camera point ${number(p)}: ${caption(p)}`);button.setAttribute('aria-pressed',String(p.id===selected?.id));pins.append(button);
      if(registered.direction){
        const end=geometry(registered.direction),vx=(end[0]-x)*w/100,vy=(end[1]-y)*h/100,len=Math.hypot(vx,vy)||1;
        const angle=Math.atan2(vy,vx),half=(p.hfov||70)*Math.PI/360,radius=Math.max(25,Math.min(52,len*1.4));
        const at=a=>[x+Math.cos(a)*radius/w*100,y+Math.sin(a)*radius/h*100],a=at(angle-half),b=at(angle+half),tip=at(angle);
        const on=p.id===selected?.id?' selected':'';
        const group=node('g',{'data-camera':number(p),class:`plan-camera${on}`});
        group.append(node('path',{d:`M ${x} ${y} L ${a.join(' ')} A ${radius/w*100} ${radius/h*100} 0 0 1 ${b.join(' ')} Z`,class:`plan-view-cone${on}`}),node('line',{x1:x,y1:y,x2:tip[0],y2:tip[1],class:`plan-view-direction${on}`}));
        const wing=a=>[x+Math.cos(a)*radius*.82/w*100,y+Math.sin(a)*radius*.82/h*100],left=wing(angle-.15),right=wing(angle+.15);
        group.append(node('path',{d:`M ${left.join(' ')} L ${tip.join(' ')} L ${right.join(' ')}`,class:`plan-camera-arrow${on}`}),node('ellipse',{cx:x,cy:y,rx:3/w*100,ry:3/h*100,class:`plan-pin-anchor${on}`}));
        svg.append(group);
        // Only the short label connection is orthogonal. Camera directions are
        // deliberate arrows, never schematic lines that divide the room.
        if(Math.hypot(lx-x*w/100,ly-y*h/100)>17)svg.append(node('polyline',{points:`${x},${y} ${x},${labelY} ${labelX},${labelY}`,class:'plan-pin-leader'}));
      }

    });
    if(measure)pose.dimensions.filter(d=>d.metres>=1&&d.metres<=10).forEach(d=>{
      const a=geometry(d.screen[0]),b=geometry(d.screen[1]);if([...a,...b].some(v=>v<3||v>97))return;
      const g=node('g',{class:'plan-dimension'});g.append(node('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1]}));
      const vertical=Math.abs(b[1]-a[1])>Math.abs(b[0]-a[0]),x=(a[0]+b[0])/2+.7,y=(a[1]+b[1])/2-.7;
      g.append(node('text',{x,y,'text-anchor':'middle',transform:vertical?`rotate(-90 ${x} ${y})`:''},`${d.metres.toFixed(2)} m`));svg.append(g);
    });
  }
  function showPhoto(id){
    const p=photos().find(p=>p.id===Number(id));if(!p)return;selected=p;
    $('#atlas-image').src=p.url;$('#atlas-image').alt=caption(p);
    $('#atlas-photo-number').textContent=`Camera point ${number(p)} · ${levels[floor]}`;
    $('#atlas-photo-title').textContent=caption(p).split(' · ').slice(1).join(' · ');
    const room=data.rooms.find(r=>r.id===p.roomId);$('#atlas-photo-description').textContent=`${room?.name?.replace(/Bedroom (?:C)?\d+/,'Bedroom')||levels[floor]}${room?.area?` · approx. ${room.area.toFixed(2)} m²`:''}`;
    $('#atlas-open').dataset.photo=p.id;$('#atlas-open').dataset.photoUrl=p.url;$('#atlas-open').dataset.caption=caption(p);
    strip.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.atlasPhoto)===p.id)));
    drawOverlays();
  }
  function selectFloor(index,force=false){
    index=Math.max(0,Math.min(3,Number(index)));if(index===floor&&selected&&!force)return;floor=index;
    $('#atlas-level').textContent=levels[floor];$('#atlas-schedule-heading').textContent=levels[floor];$('#atlas-panel').setAttribute('aria-labelledby',`atlas-tab-${floor}`);map.dataset.floor=floor;
    image.src=`./assets/residence/chapters/plan-${floor}.webp`;image.alt=`Actual furnished model plan: ${levels[floor]}`;
    $$('[data-atlas-floor]').forEach(b=>{const on=Number(b.dataset.atlasFloor)===floor;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
    strip.replaceChildren();photos().forEach(p=>{const b=document.createElement('button'),img=document.createElement('img'),label=document.createElement('span');b.dataset.atlasPhoto=p.id;b.setAttribute('aria-label',`Camera point ${number(p)}: ${caption(p)}`);img.src=p.url;img.alt=caption(p);img.loading='lazy';label.textContent=number(p);b.append(img,label);strip.append(b);});
    const list=$('#atlas-room-list');list.replaceChildren();data.rooms.filter(r=>r.floor===floor).forEach(r=>{const b=document.createElement('button');b.textContent=`${r.name}${r.area?` · ${r.area.toFixed(2)} m²`:''}`;b.dataset.atlasRoom=r.id;list.append(b);});
    showPhoto(defaults[floor]);layout();
  }
  document.addEventListener('click',e=>{
    const point=e.target.closest('[data-atlas-photo]');if(point)showPhoto(point.dataset.atlasPhoto);
    const tab=e.target.closest('[data-atlas-floor]');if(tab){if(window.AngoraPlan?.navigate)window.AngoraPlan.navigate(Number(tab.dataset.atlasFloor));else selectFloor(tab.dataset.atlasFloor);}
    const room=e.target.closest('[data-atlas-room]');if(room){const p=photos().find(p=>p.roomId===room.dataset.atlasRoom);if(p)showPhoto(p.id);}
  });
  $$('[data-atlas-floor]').forEach(b=>b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=e.key==='Home'?0:e.key==='End'?3:(floor+(e.key==='ArrowRight'?1:3))%4;window.AngoraPlan?.navigate?window.AngoraPlan.navigate(i):selectFloor(i);$(`#atlas-tab-${i}`).focus({preventScroll:true});}));
  $('#atlas-measure').onclick=()=>{measure=!measure;$('#atlas-measure').setAttribute('aria-pressed',String(measure));$('#atlas-measure').innerHTML=`${measure?'Hide':'Show'} dimensions <span>${measure?'−':'＋'}</span>`;drawOverlays();};
  window.addEventListener('angora:floor',e=>{selectFloor(e.detail);if(window.AngoraPlan?.navigate)window.AngoraPlan.navigate(Number(e.detail));});
  async function transition(index){
    index=Math.max(0,Math.min(3,Number(index)));if(index===floor)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){selectFloor(index);return;}
    const nextImage=new Image();nextImage.src=`./assets/residence/chapters/plan-${index}.webp`;await nextImage.decode().catch(()=>{});
    const previous=layer.cloneNode(true);previous.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));previous.classList.add('plan-previous-layer');previous.setAttribute('aria-hidden','true');previous.inert=true;map.append(previous);
    await new Promise(resolve=>gsap.to('.atlas-view',{opacity:0,duration:.05,onComplete:resolve}));
    gsap.set(layer,{opacity:0});selectFloor(index);await image.decode().catch(()=>{});
    await new Promise(resolve=>gsap.timeline({onComplete:resolve})
      .to(layer,{opacity:1,duration:.24,ease:'power1.inOut'},0)
      .to(previous,{opacity:0,duration:.24,ease:'power1.inOut'},0)
      .to('.atlas-view',{opacity:1,duration:.18,ease:'power1.out'},.05));
    previous.remove();gsap.set(layer,{clearProps:'opacity'});layout();
  }
  window.AngoraPlan={selectFloor,layout,transition,get floor(){return floor;}};
  new ResizeObserver(layout).observe(map);image.addEventListener('load',layout);
  Promise.all([fetch('./assets/residence/chapters/poses.json').then(r=>r.json()),fetch('./assets/residence/chapters/native-manifest.json').then(r=>r.json())]).then(([p,m])=>{poses=p;manifest=m;layout();});
  selectFloor(0,true);
})();
