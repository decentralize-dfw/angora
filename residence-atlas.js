(() => {
  'use strict';
  const data=window.ANGORA_ATLAS;if(!data)return;
  const $=selector=>document.querySelector(selector),$$=selector=>[...document.querySelectorAll(selector)];
  const levels=['Garden level','Entrance level','First floor','Attic level'];
  const defaults=[3,4,19,9];
  const svg=$('#atlas-svg'),pins=$('#atlas-pins'),strip=$('#atlas-photo-strip'),ext=data.extent;
  const ns='http://www.w3.org/2000/svg';let floor=0,selected=null,measure=false;
  function node(name,attributes={},text){const item=document.createElementNS(ns,name);Object.entries(attributes).forEach(([key,value])=>item.setAttribute(key,value));if(text!==undefined)item.textContent=text;return item;}
  function inside(point,poly){let result=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,zi]=poly[i],[xj,zj]=poly[j];if((zi>point.z)!==(zj>point.z)&&point.x<(xj-xi)*(point.z-zi)/(zj-zi)+xi)result=!result;}return result;}
  function roomFor(point){return data.rooms.find(room=>room.id===point.roomId);}
  function caption(point){return point.en.replace('Basement ·','Garden level ·').replace('Ground floor ·','Entrance level ·').replace('Attic floor ·','Attic level ·');}
  function activePhotos(){return data.photos.filter(point=>point.floor===floor&&!point.outdoor);}
  function drawPlan(){
    svg.replaceChildren();pins.replaceChildren();const room=selected?roomFor(selected):null;
    data.rooms.filter(item=>item.floor===floor).forEach(item=>{
      svg.append(node('polygon',{points:item.poly.map(p=>p.join(',')).join(' '),class:`plan-room${room?.id===item.id?' is-selected':''}`,'data-room':item.id}));
      const label=node('text',{x:item.anchor[0],y:item.anchor[1]-.08,'text-anchor':'middle',class:'plan-room-label'});
      const short=item.name.replace('Principal bedroom','Principal suite').replace('Landing & kitchenette','Landing');
      label.append(node('tspan',{x:item.anchor[0],dy:0},short));
      if(measure&&item.area)label.append(node('tspan',{x:item.anchor[0],dy:.3,class:'plan-room-area'},`${item.area.toFixed(2)} m²`));svg.append(label);
    });
    if(selected){
      const {x,z,dx,dz}=selected;const end=[x+dx*1.65,z+dz*1.65],cross=[-dz*.65,dx*.65];
      svg.append(node('polygon',{points:[[x,z],[end[0]+cross[0],end[1]+cross[1]],[end[0]-cross[0],end[1]-cross[1]]].map(p=>p.join(',')).join(' '),class:'plan-view-cone'}));
      svg.append(node('line',{x1:x,y1:z,x2:end[0],y2:end[1],class:'plan-view-direction'}));
    }
    if(measure){
      data.dimensions.filter(d=>d.floor_index===floor&&d.metres>=1&&d.metres<=10&&(!room||inside({x:(d.a[0]+d.b[0])/2,z:(d.a[2]+d.b[2])/2},room.poly))&&[d.a,d.b].every(p=>p[0]>ext.x+.3&&p[0]<ext.x+ext.width-.3&&p[2]>ext.z+.3&&p[2]<ext.z+ext.height-.8)).forEach(d=>{
        const [x1,,y1]=d.a,[x2,,y2]=d.b,angle=Math.atan2(y2-y1,x2-x1),cx=-Math.sin(angle)*.13,cy=Math.cos(angle)*.13;
        const group=node('g',{class:'plan-dimension'});
        group.append(node('line',{x1,y1,x2,y2}));
        for(const [x,y]of[[x1,y1],[x2,y2]])group.append(node('line',{x1:x-cx,y1:y-cy,x2:x+cx,y2:y+cy}));
        const x=(x1+x2)/2+cx*1.7,y=(y1+y2)/2+cy*1.7;
        group.append(node('text',{x,y,'text-anchor':'middle',transform:`rotate(${Math.abs(angle)>1?90:0} ${x} ${y})`},`${d.metres.toFixed(2)} m`));svg.append(group);
      });
    }
    const scale=node('g',{class:'plan-scale'});scale.append(node('line',{x1:-6.8,y1:7.6,x2:-1.8,y2:7.6}));
    for(let i=0;i<=5;i++)scale.append(node('line',{x1:-6.8+i,y1:7.45,x2:-6.8+i,y2:7.75}));
    scale.append(node('text',{x:-6.8,y:8.25},'0'),node('text',{x:-1.8,y:8.25,'text-anchor':'end'},'5 metres'));svg.append(scale);
    svg.append(node('text',{x:1,y:-10.25,'text-anchor':'middle',class:'plan-side'},'GARDEN SIDE'),node('text',{x:1,y:8.2,'text-anchor':'middle',class:'plan-side'},'STREET SIDE'));
    activePhotos().forEach(point=>{
      const button=document.createElement('button');button.className=`atlas-pin${selected?.id===point.id?' active':''}`;button.dataset.atlasPhoto=point.id;
      button.style.left=`${(point.x-ext.x)/ext.width*100}%`;button.style.top=`${(point.z-ext.z)/ext.height*100}%`;
      button.textContent=String(point.id).padStart(2,'0');button.setAttribute('aria-label',`Photograph ${point.id}: ${caption(point)}`);button.setAttribute('aria-pressed',String(selected?.id===point.id));button.title=caption(point);pins.append(button);
    });
  }
  function showPhoto(id){
    const point=activePhotos().find(item=>item.id===Number(id));if(!point)return;selected=point;
    const image=$('#atlas-image');image.src=point.url;image.alt=caption(point);
    $('#atlas-photo-number').textContent=`Photograph ${String(point.id).padStart(2,'0')} · Original image`;
    $('#atlas-photo-title').textContent=caption(point).split(' · ').slice(1).join(' · ')||caption(point);
    const room=roomFor(point);$('#atlas-photo-description').textContent=`${levels[floor]}${room?.area?` · ${room.name}, approximately ${room.area.toFixed(2)} m²`:''}`;
    $('#atlas-open').dataset.photo=String(point.id).padStart(2,'0');$('#atlas-open').dataset.caption=caption(point);
    strip.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.atlasPhoto)===point.id)));
    $$('#atlas-room-list [data-atlas-room]').forEach(button=>button.classList.toggle('active',button.dataset.atlasRoom===room?.id));
    drawPlan();
    if(window.gsap&&!matchMedia('(prefers-reduced-motion: reduce)').matches)gsap.fromTo('.atlas-photo-copy',{opacity:.35,y:12},{opacity:1,y:0,duration:.45,overwrite:true});
  }
  function selectFloor(index){
    floor=Math.max(0,Math.min(3,Number(index)));$('#atlas-level').textContent=levels[floor];$('#atlas-schedule-heading').textContent=levels[floor];$('#atlas-panel').setAttribute('aria-labelledby',`atlas-tab-${floor}`);
    $$('[data-atlas-floor]').forEach(button=>{const active=Number(button.dataset.atlasFloor)===floor;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
    strip.replaceChildren();activePhotos().forEach(point=>{const button=document.createElement('button');button.dataset.atlasPhoto=point.id;button.setAttribute('aria-label',`Select photograph ${point.id}: ${caption(point)}`);const image=document.createElement('img');image.src=point.url;image.alt=caption(point);image.loading='lazy';const number=document.createElement('span');number.textContent=String(point.id).padStart(2,'0');button.append(image,number);strip.append(button);});
    const list=$('#atlas-room-list');list.replaceChildren();data.rooms.filter(room=>room.floor===floor).forEach(room=>{const button=document.createElement('button');button.dataset.atlasRoom=room.id;const name=document.createElement('span');name.textContent=room.name;const area=document.createElement('span');area.textContent=room.area?`${room.area.toFixed(2)} m²`:'—';button.append(name,area);list.append(button);});
    showPhoto(defaults[floor]);
  }
  document.addEventListener('click',event=>{
    const tab=event.target.closest('[data-atlas-floor]');if(tab)selectFloor(tab.dataset.atlasFloor);
    const photo=event.target.closest('[data-atlas-photo]');if(photo)showPhoto(photo.dataset.atlasPhoto);
    const room=event.target.closest('[data-atlas-room]');if(room){const shape=data.rooms.find(item=>item.id===room.dataset.atlasRoom);const point=activePhotos().find(point=>point.roomId===shape.id);if(point)showPhoto(point.id);else{svg.querySelectorAll('[data-room]').forEach(item=>item.classList.toggle('is-selected',item.dataset.room===shape.id));$$('#atlas-room-list button').forEach(item=>item.classList.toggle('active',item===room));}}
  });
  $$('[data-atlas-floor]').forEach(tab=>tab.addEventListener('keydown',event=>{let index=floor;if(event.key==='ArrowRight')index=(floor+1)%4;else if(event.key==='ArrowLeft')index=(floor+3)%4;else if(event.key==='Home')index=0;else if(event.key==='End')index=3;else return;event.preventDefault();selectFloor(index);$(`#atlas-tab-${index}`).focus({preventScroll:true});}));
  $('#atlas-measure').addEventListener('click',()=>{measure=!measure;$('#atlas-measure').setAttribute('aria-pressed',String(measure));$('#atlas-measure').innerHTML=`${measure?'Hide':'Show'} dimensions <span>${measure?'−':'＋'}</span>`;drawPlan();});
  window.addEventListener('angora:floor',event=>selectFloor(event.detail));selectFloor(0);
})();
