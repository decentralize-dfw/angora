(() => {
  'use strict';
  const $=selector=>document.querySelector(selector), $$=selector=>[...document.querySelectorAll(selector)];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion=!!(window.gsap&&window.ScrollTrigger), {position,FramePlayer,clamp}=window.AngoraFilmRuntime;
  const media=$('.cinema-media'), canvas=$('#cinema-canvas'), opening=$('.cinema-opening');
  let manifest, player, trigger, lastProgress=0, current=-1;
  opening.muted=true;
  if(!reduced)opening.play().catch(()=>{});
  if(motion&&!reduced){
    gsap.fromTo('.cinema-veil',{opacity:1},{opacity:0,duration:1.8,delay:.3,ease:'power2.inOut',onComplete:()=>$('.cinema-veil').hidden=true});
  }else $('.cinema-veil').hidden=true;
  const sceneProgress=p=>{
    if(!manifest||!player)return;
    const state=position(p,manifest.clips), clip=manifest.clips[state.index];
    player.seek(clip,state.frame,p<lastProgress?-1:1);lastProgress=p;
    media.classList.toggle('is-scrolling',p>.002||reduced);
    if(p>.002){opening.pause();opening.style.opacity=1-clamp(p/.035);}
    else opening.style.opacity='1';
    if(state.index!==current){
      current=state.index;$('#cinema-count').textContent=`0${current+1} / 03`;
      $('#cinema-title').textContent=clip.title;$('#cinema-caption').textContent=clip.caption;
      canvas.setAttribute('aria-label',`${clip.title} ${clip.caption}. Scroll to move the camera.`);
    }
    $$('[data-film-chapter]').forEach((button,index)=>{
      button.setAttribute('aria-current',String(index===current));
      const progress=index<current?1:index===current?state.local:0;
      button.querySelector('i').style.transform=`scaleX(${progress})`;
    });
    $('.hero').dataset.filmProgress=p.toFixed(4);$('.hero').dataset.filmChapter=current;
  };
  fetch('./assets/residence/films/manifest.json').then(response=>{
    if(!response.ok)throw new Error('Film unavailable');return response.json();
  }).then(data=>{
    manifest=data;
    player=new FramePlayer(canvas,data.clips,()=>{media.classList.add('is-ready');$('#cinema-status').textContent='';});
    sceneProgress(0);
    if(motion&&!reduced){
      // Three equal intervals. Each source clip occupies exactly two viewport heights.
      trigger=ScrollTrigger.create({id:'angora-camera-films',trigger:'.cinematic-story',start:'top top',end:()=>`+=${innerHeight*data.scrollScreensPerClip*data.clips.length}`,onUpdate:self=>sceneProgress(self.progress),invalidateOnRefresh:true});
      const timeline=gsap.timeline({scrollTrigger:{trigger:'.cinematic-story',start:'top top',end:'bottom bottom',scrub:.45,invalidateOnRefresh:true}});
      timeline.to('.hero-title',{autoAlpha:0,yPercent:-28,duration:.07,ease:'none'},0)
        .to('.hero-sides,.hero-bottom',{autoAlpha:0,duration:.045},0)
        .to('.cinema-caption,.cinema-track',{autoAlpha:1,duration:.06},.045)
        // ERA frame contraction + Likova content panel: one material, one camera.
        .to(media,{left:'5%',right:'5%',top:'7%',bottom:'7%',duration:.13,ease:'power2.inOut'},.28)
        .to(media,{left:'0%',right:'0%',top:'0%',bottom:'0%',duration:.13,ease:'power2.inOut'},.5)
        .to('.cinema-caption,.cinema-track',{autoAlpha:0,y:-25,duration:.09},.82)
        .to('.hero',{backgroundColor:'#efede6',duration:.16,ease:'power2.inOut'},.84)
        .to(media,{left:()=>matchMedia('(max-width:800px)').matches?'7%':'43%',right:()=>matchMedia('(max-width:800px)').matches?'7%':'6%',top:()=>matchMedia('(max-width:800px)').matches?'54%':'15%',bottom:()=>matchMedia('(max-width:800px)').matches?'8%':'15%',duration:.16,ease:'power2.inOut'},.84)
        .fromTo('.cinema-destination',{autoAlpha:0,y:40},{autoAlpha:1,y:0,duration:.12,ease:'power2.out'},.88);
      sceneProgress(trigger.progress);
      ScrollTrigger.refresh();
    }else{
      opening.pause();media.classList.add('is-scrolling');sceneProgress(0);
    }
    $$('[data-film-chapter]').forEach(button=>button.addEventListener('click',()=>{
      const index=Number(button.dataset.filmChapter);
      if(trigger) window.dispatchEvent(new CustomEvent('angora:scroll',{detail:{top:trigger.start+(index+.06)*innerHeight*2}}));
      else sceneProgress((index+.1)/3);
    }));
  }).catch(()=>{$('.cinema-veil').hidden=true;$('#cinema-status').textContent='The film is unavailable. Continue to discover the residence.';});
  // Real floor photographs + registered room/camera geometry replace the studio plinth.
  const data=window.ANGORA_ATLAS, svgNS='http://www.w3.org/2000/svg', defaults=[3,4,19,9];
  function miniPlan(index){
    const svg=$('#chapter-plan-preview'), point=data.photos.find(p=>p.id===defaults[index]);
    svg.replaceChildren();
    const make=(name,attrs)=>{const node=document.createElementNS(svgNS,name);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,value);return node;};
    data.rooms.filter(room=>room.floor===index).forEach(room=>{
      svg.append(make('polygon',{points:room.poly.map(p=>p.join(',')).join(' '),class:`chapter-mini-room${room.id===point?.roomId?' selected':''}`}));
    });
    data.photos.filter(p=>!p.outdoor&&p.floor===index).forEach(p=>{
      const caption=p.en.replace('Basement ·','Garden level ·').replace('Ground floor ·','Entrance level ·').replace('Attic floor ·','Attic level ·');
      const group=make('g',{class:`chapter-mini-camera${p.id===point?.id?' selected':''}`,role:'button',tabindex:0,'aria-label':`View photograph ${p.id}: ${caption}`,'data-photo':p.id,'data-caption':caption});
      group.append(make('circle',{cx:p.x,cy:p.z,r:.48}));
      const number=make('text',{x:p.x,y:p.z});number.textContent=p.id;group.append(number);svg.append(group);
      group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();group.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
    });
    const room=data.rooms.find(r=>r.id===point?.roomId);
    $('#chapter-plan-room').textContent=room?`${room.name}${room.area?` · ${room.area.toFixed(2)} m²`:''}`:'Original floor plan';
  }
  let previousFloor=-1;
  function floorChanged(index){
    if(index===previousFloor)return;previousFloor=index;miniPlan(index);
    const images=$$('[data-floor-image]'), selected=images[index];
    images.forEach((image,i)=>image.setAttribute('aria-hidden',String(i!==index)));
    if(motion&&!reduced){
      gsap.killTweensOf(images);gsap.set(images,{zIndex:1});gsap.set(selected,{zIndex:2,opacity:1});
      gsap.fromTo(selected,{clipPath:'polygon(100% 0%,100% 0%,125% 100%,100% 100%)',xPercent:4,scale:1.055},{clipPath:'polygon(0% 0%,100% 0%,100% 100%,0% 100%)',xPercent:0,scale:1,duration:.9,ease:'power3.inOut',onComplete:()=>images.forEach(image=>{if(image!==selected)image.style.opacity='0';})});
      gsap.fromTo('.chapter-plan-card',{y:25,opacity:.2},{y:0,opacity:1,duration:.7,delay:.14,ease:'power2.out',overwrite:true});
    }else images.forEach((image,i)=>image.style.opacity=String(i===index?1:0));
  }
  window.addEventListener('angora:chapter',event=>floorChanged(event.detail));floorChanged(Number($('.chapter-scene').dataset.floor)||0);
  if(!motion||reduced)return;
  // Likova word-window reveal: individual words keep natural line wrapping.
  $$('.display,h3').filter(node=>!node.closest('.chapter-copy,.cinema-destination,.hero')).forEach(heading=>{
    const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT), nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const fragment=document.createDocumentFragment();node.textContent.split(/(\s+)/).forEach(word=>{
        if(!word.trim()){fragment.append(document.createTextNode(word));return;}
        const outer=document.createElement('span'),inner=document.createElement('span');outer.className='word-window';inner.textContent=word;outer.append(inner);fragment.append(outer);
      });node.replaceWith(fragment);
    });
    gsap.fromTo(heading.querySelectorAll('.word-window>span'),{yPercent:110},{yPercent:0,duration:1.15,stagger:.035,ease:'power3.out',scrollTrigger:{trigger:heading,start:'top 90%',once:true}});
  });
  // ERA diagonal media reveal with measured overflow, not an arbitrary zoom.
  $$('.editorial-image').forEach(frame=>{
    gsap.fromTo(frame,{clipPath:'polygon(0% 0%,0% 0%,0% 100%,-20% 100%)'},{clipPath:'polygon(0% 0%,100% 0%,100% 100%,0% 100%)',duration:1.25,ease:'power3.inOut',scrollTrigger:{trigger:frame,start:'top 88%',once:true}});
    gsap.fromTo(frame.querySelector('img'),{scale:1.09,yPercent:-3},{scale:1.03,yPercent:3,ease:'none',scrollTrigger:{trigger:frame,start:'top bottom',end:'bottom top',scrub:.6}});
  });
  // Coupled image/CTA/footer choreography from ERA: the footer waits underneath.
  gsap.fromTo('footer',{scale:.94,opacity:.45},{scale:1,opacity:1,ease:'none',scrollTrigger:{trigger:'footer',start:'top bottom',end:'bottom bottom',scrub:.5}});
  gsap.fromTo('.contact-image',{clipPath:'polygon(6% 8%,94% 8%,94% 92%,6% 92%)'},{clipPath:'polygon(0% 0%,100% 0%,100% 100%,0% 100%)',ease:'none',scrollTrigger:{trigger:'.contact',start:'top 65%',end:'bottom bottom',scrub:.5}});
  document.fonts?.ready.then(()=>ScrollTrigger.refresh());
})();
