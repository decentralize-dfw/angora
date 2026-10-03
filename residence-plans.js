(() => {
  'use strict';
  const data=window.ANGORA_ATLAS,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const levels=['Garden level','Entrance level','First floor','Attic level'],defaults=[3,4,19,9];
  const svg=$('#atlas-svg'),pins=$('#atlas-pins'),strip=$('#atlas-photo-strip'),map=$('.atlas-map'),image=$('#atlas-native-plan');
  const ns='http://www.w3.org/2000/svg';let floor=0,selected,measure=false,poses,manifest,geometry;
  function node(name,attrs={},text){const e=document.createElementNS(ns,name);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;return e;}
  const photos=()=>data.photos.filter(p=>p.floor===floor&&!p.outdoor);
  const number=p=>photos().findIndex(item=>item.id===p.id)+1;
  const caption=p=>p.en.replace('Basement ·','Garden level ·').replace('Ground floor ·','Entrance level ·').replace('Attic floor ·','Attic level ·');
  function layout(){
    if(!poses||!manifest)return;
    const crop=manifest.crops[floor],w=map.clientWidth,h=map.clientHeight,iw=1280,ih=720,scale=Math.min(w/(iw*crop.width),h/(ih*crop.height));
    const dx=(w-iw*crop.width*scale)/2,dy=(h-ih*crop.height*scale)/2;
    image.style.cssText=`width:${iw*scale}px;height:${ih*scale}px;left:${dx-iw*crop.x*scale}px;top:${dy-ih*crop.y*scale}px;`;
    geometry=p=>[100*(dx+(p[0]-crop.x)*iw*scale)/w,100*(dy+(p[1]-crop.y)*ih*scale)/h];
    drawOverlays();
  }
  function drawOverlays(){
    if(!poses||!geometry)return;svg.replaceChildren();pins.replaceChildren();
    const pose=poses.floors[floor],w=map.clientWidth,h=map.clientHeight;
    const points=photos().map(p=>{const registered=pose.photos.find(q=>q.id===p.id);if(!registered)return null;const [x,y]=geometry([registered.x,registered.y]);return {p,registered,x,y,lx:x*w/100,ly:y*h/100};}).filter(Boolean);
    // Registered camera locations stay fixed; only their labels separate in tight rooms.
    const spacing=matchMedia('(max-width:800px)').matches?27:34;
    for(let pass=0;pass<32;pass++)for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
      const a=points[i],b=points[j],dx=b.lx-a.lx,dy=b.ly-a.ly,d=Math.hypot(dx,dy);
      if(d>=spacing)continue;const ux=d>0.1?dx/d:(i%2?1:-1),uy=d>0.1?dy/d:0,push=(spacing-d)/2+.1;
      a.lx=Math.max(16,Math.min(w-16,a.lx-ux*push));a.ly=Math.max(16,Math.min(h-16,a.ly-uy*push));b.lx=Math.max(16,Math.min(w-16,b.lx+ux*push));b.ly=Math.max(16,Math.min(h-16,b.ly+uy*push));
    }
    points.forEach(({p,registered,x,y,lx,ly})=>{
      const button=document.createElement('button'),labelX=lx/w*100,labelY=ly/h*100;
      if(Math.hypot(labelX-x,labelY-y)>1.5)svg.append(node('line',{x1:x,y1:y,x2:labelX,y2:labelY,class:'plan-pin-leader'}),node('circle',{cx:x,cy:y,r:.45,class:'plan-pin-anchor'}));
      button.className=`atlas-pin${p.id===selected?.id?' active':''}`;button.dataset.atlasPhoto=p.id;
      button.style.left=`${labelX}%`;button.style.top=`${labelY}%`;button.textContent=number(p);button.setAttribute('aria-label',`Camera point ${number(p)}: ${caption(p)}`);button.setAttribute('aria-pressed',String(p.id===selected?.id));pins.append(button);
      if(p.id===selected?.id){
        const xd=pose.dimensions.find(d=>Math.abs(d.b[0]-d.a[0])>1),yd=pose.dimensions.find(d=>Math.abs(d.b[2]-d.a[2])>1);
        const xs=xd?(xd.screen[1][0]-xd.screen[0][0])/(xd.b[0]-xd.a[0]):.03,ys=yd?(yd.screen[1][1]-yd.screen[0][1])/(yd.b[2]-yd.a[2]):.05;
        const end=geometry([registered.x+p.dx*xs*1.7,registered.y+p.dz*ys*1.7]);
        svg.append(node('polygon',{points:`${x},${y} ${end[0]-p.dz*2},${end[1]+p.dx*2} ${end[0]+p.dz*2},${end[1]-p.dx*2}`,class:'plan-view-cone'}),node('line',{x1:x,y1:y,x2:end[0],y2:end[1],class:'plan-view-direction'}));
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
    const room=data.rooms.find(r=>r.id===p.roomId);$('#atlas-photo-description').textContent=`${room?.name||levels[floor]}${room?.area?` · approx. ${room.area.toFixed(2)} m²`:''}`;
    $('#atlas-open').dataset.photo=p.id;$('#atlas-open').dataset.caption=caption(p);
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
  window.AngoraPlan={selectFloor,layout,get floor(){return floor;}};
  new ResizeObserver(layout).observe(map);image.addEventListener('load',layout);
  Promise.all([fetch('./assets/residence/chapters/poses.json').then(r=>r.json()),fetch('./assets/residence/chapters/native-manifest.json').then(r=>r.json())]).then(([p,m])=>{poses=p;manifest=m;layout();});
  selectFloor(0,true);
})();
