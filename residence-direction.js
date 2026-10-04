(() => {
  'use strict';
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,motion=!!(window.gsap&&window.ScrollTrigger)&&!reduced;
  const {galleryOffset}=window.AngoraMotionMath;
  function refreshMotion(){
    // Upstream pinned strips must measure before the floor / plan anchors below them.
    ScrollTrigger.sort((a,b)=>a.trigger===b.trigger?0:a.trigger.compareDocumentPosition(b.trigger)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1);
    ScrollTrigger.refresh();
  }
  const data=window.ANGORA_ATLAS;
  // Only newly supplied exterior material enters this presentation.
  const exteriors=[['angora_28.jpeg','The street elevation'],['angora_24.jpg','The private garden & pool'],['angora_26.jpg','The garden-facing elevation'],['angora_27.jpg','The covered terrace & water']].map(([file,en],i)=>({id:100+i,url:`./photogallery-v2/${file}`,en,outdoor:true}));
  // The gallery is an edit; the complete photograph collection lives on the plans.
  const selections={0:[2,5,1],1:[4,21,23],2:[17,12,32],3:[7,9,15]};
  const curated=Object.fromEntries(Object.entries(selections).map(([floor,ids])=>[floor,ids.map(id=>data.photos.find(p=>p.id===id))]));
  const exteriorEdit=[exteriors[1],exteriors[0],exteriors[3]];
  const exteriorSafe=[5,22,40,31,33,32,7,10].map(id=>data.photos.find(p=>p.id===id));
  const track=$('.gallery-track');let gallery=[],galleryTrigger,index=0;
  function fitGallery(){
    const mobile=innerWidth<=800&&innerHeight>innerWidth;
    const width=Math.min(innerWidth*(mobile?.82:.68),(track.clientHeight-44)*(mobile?1:16/9));
    const previous=parseFloat(track.style.getPropertyValue('--gallery-photo-width'))||0;
    track.style.setProperty('--gallery-edge',`${Math.max(0,(track.clientWidth-width)/2-innerWidth*(mobile?.05:.03))}px`);
    if(Math.abs(width-previous)<1)return;
    track.style.setProperty('--gallery-photo-width',`${width}px`);
    if(galleryTrigger)requestAnimationFrame(refreshMotion);
  }
  new ResizeObserver(fitGallery).observe(track);
  function caption(p){return p.en.replace('Basement ·','Garden level ·').replace('Ground floor ·','Entrance level ·').replace('Attic floor ·','Attic level ·');}
  function updateCounter(x){
    const figures=[...track.children];if(!figures.length)return;
    index=window.AngoraMotionMath.galleryIndex(-x,figures.map(f=>f.offsetLeft+f.offsetWidth/2),track.clientWidth,Math.max(0,track.scrollWidth-track.clientWidth));
    $('#gallery-counter').textContent=`${String(index+1).padStart(2,'0')} / ${gallery.length}`;$('#gallery-prev').disabled=-x<.5;$('#gallery-next').disabled=-x>=track.scrollWidth-track.clientWidth-.5;
  }
  function galleryGo(delta){
    const next=Math.max(0,Math.min(gallery.length-1,index+delta));
    const figure=track.children[next],distance=Math.max(0,track.scrollWidth-track.clientWidth),offset=galleryOffset(figure.offsetLeft+figure.offsetWidth/2,track.clientWidth,distance);
    if(galleryTrigger){const p=offset/Math.max(1,distance);window.dispatchEvent(new CustomEvent('angora:scroll',{detail:{top:galleryTrigger.start+(galleryTrigger.end-galleryTrigger.start)*p}}));}
    else track.scrollTo({left:offset,behavior:reduced?'instant':'smooth'});
  }
  function renderGallery(filter='all',reset=false){
    gallery=filter==='all'?exteriorSafe:filter==='outdoor'?exteriorEdit:curated[filter];
    galleryTrigger?.kill(true);galleryTrigger=null;track.replaceChildren();window.gsap?.set(track,{x:0});track.scrollLeft=0;index=0;
    gallery.forEach((p,i)=>{
      const figure=document.createElement('figure'),button=document.createElement('button'),image=document.createElement('img'),expand=document.createElement('span'),label=document.createElement('figcaption');figure.className='gallery-item';
      button.dataset.photo=p.id;button.dataset.photoUrl=p.url;button.dataset.caption=caption(p);button.setAttribute('aria-label',`Enlarge ${caption(p)}`);image.src=p.url;image.alt=caption(p);image.loading='lazy';image.width=1672;image.height=941;expand.textContent='↗';button.append(image,expand);label.textContent=`${String(i+1).padStart(2,'0')} / ${caption(p)}`;figure.append(button,label);track.append(figure);
    });fitGallery();updateCounter(0);
    if(motion){
      const distance=()=>Math.max(0,track.scrollWidth-track.clientWidth);
      const timeline=gsap.timeline({scrollTrigger:{id:'angora-photo-collection',trigger:'.gallery',pin:'.gallery-scene',start:'top top',end:()=>`+=${distance()+innerHeight*.15}`,scrub:.3,invalidateOnRefresh:true}});
      galleryTrigger=timeline.scrollTrigger;
      timeline.to(track,{x:()=>-distance(),duration:1,ease:'none',onUpdate:()=>updateCounter(Number(gsap.getProperty(track,'x')))},0)
        .fromTo('.gallery .horizontal-progress i',{scaleX:0},{scaleX:1,duration:1,ease:'none'},0)
        .to('.gallery-scene',{backgroundColor:'#5c4133',duration:.08,ease:'none'},.92);
      refreshMotion();
      if(reset)window.dispatchEvent(new CustomEvent('angora:scroll',{detail:{top:galleryTrigger.start,immediate:true}}));
    }else track.style.overflowX='auto';
  }
  let filterRequest=0;
  renderGallery();$$('[data-gallery-filter]').forEach(b=>b.addEventListener('click',async()=>{
    if(b.getAttribute('aria-pressed')==='true')return;
    const request=++filterRequest;
    if(motion)await new Promise(resolve=>gsap.to('.gallery-window',{opacity:0,duration:.14,overwrite:true,onComplete:resolve,onInterrupt:resolve}));
    if(request!==filterRequest)return;
    renderGallery(b.dataset.galleryFilter,true);$$('[data-gallery-filter]').forEach(other=>other.setAttribute('aria-pressed',String(other===b)));
    await Promise.all([...track.querySelectorAll('img')].slice(0,2).map(img=>img.decode().catch(()=>{})));
    if(request===filterRequest&&motion)gsap.to('.gallery-window',{opacity:1,duration:.3,overwrite:true,ease:'power2.out'});
  }));
  $('#gallery-prev').onclick=()=>galleryGo(-1);$('#gallery-next').onclick=()=>galleryGo(1);
  track.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();galleryGo(e.key==='ArrowRight'?1:-1);}});
  if(motion){
    $$('.horizontal-story').forEach(section=>{
      const scene=section.querySelector('.horizontal-scene'),window=section.querySelector('.horizontal-window'),strip=section.querySelector('.horizontal-track'),distance=()=>Math.max(0,strip.scrollWidth-window.clientWidth);
      const tl=gsap.timeline({scrollTrigger:{trigger:section,pin:scene,start:'top top',end:()=>`+=${distance()+innerHeight*.18}`,scrub:.3,invalidateOnRefresh:true}});
      tl.to(strip,{x:()=>-distance(),duration:1,ease:'none'},0).to(section.querySelector('.horizontal-progress i'),{scaleX:1,duration:1,ease:'none'},0);
      if(section.classList.contains('family-story'))tl.to(scene,{backgroundColor:'#223e35',color:'#efede6',duration:.12,ease:'none'},.88);
      else tl.to(scene,{backgroundColor:'#fff',color:'#223e35',duration:.12,ease:'none'},.88);
    });
    $$('.life-photo-story').forEach((story,index)=>{
      const figure=story.querySelector('figure'),side=index%2?1:-1;
      const entrance=gsap.timeline({scrollTrigger:{trigger:story,start:'top 88%',end:'top 36%',scrub:.35}});
      entrance.fromTo(figure,{x:()=>side*innerWidth*.14,opacity:.15},{x:0,opacity:1,duration:1,ease:'power2.out'},0)
        .fromTo(figure.querySelector('img'),{scale:1.12},{scale:1.015,duration:1,ease:'power2.out'},0)
        .fromTo(story.querySelectorAll('.life-story-number,h4,p,.text-link'),{x:side*24,opacity:0},{x:0,opacity:1,duration:.5,stagger:.035,ease:'power2.out'},.35);
    });
    // Release the photograph into the same forest ground that holds the lines.
    gsap.to('.footer-scene>img',{opacity:0,ease:'none',scrollTrigger:{trigger:'.footer-orbit',start:'top 80%',end:'top 15%',scrub:.25}});
    gsap.fromTo('.footer-orbit .footer-actions',{opacity:.5,y:16},{opacity:1,y:0,ease:'power1.out',scrollTrigger:{trigger:'.footer-orbit',start:'top 75%',end:'top 15%',scrub:.25}});
  }
  fetch('./assets/residence/chapters/native-manifest.json').then(r=>r.json()).then(manifest=>{
    const stage=$('.chapter-native-stage'),still=$('#chapter-native-still');
    const forward=[1,2,3].map(i=>window.AngoraVideo.create(`./assets/residence/chapters/finished/level-${i}.mp4`,stage,'native-floor-film'));
    const reverse=[1,2,3].map(i=>window.AngoraVideo.create(`./assets/residence/chapters/finished/level-${i}-reverse.mp4`,stage,'native-floor-film'));
    const nearFloors=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){window.AngoraVideo.prime(forward[0]);nearFloors.disconnect();}},{rootMargin:'150% 0px'});nearFloors.observe($('#floors'));
    async function change(from,to){
      if(from===to)return;
      const step=Math.sign(to-from);
      for(let current=from;current!==to;current+=step){
        const next=current+step,video=(step>0?forward:reverse)[Math.max(current,next)-1];
        if(forward[next])window.AngoraVideo.prime(forward[next]);if(reverse[next-1])window.AngoraVideo.prime(reverse[next-1]);
        $('.chapter-scene').dataset.nativeMoving='true';
        if(motion)gsap.to('.chapter-copy',{opacity:0,y:-6,duration:.1,overwrite:true});
        let displayPromise;
        const display=()=>{
          if(displayPromise)return;
          window.dispatchEvent(new CustomEvent('angora:chapter-display',{detail:next}));
          displayPromise=motion?new Promise(resolve=>gsap.to('.chapter-copy',{opacity:1,y:0,duration:.16,ease:'power2.out',overwrite:true,onComplete:resolve})):Promise.resolve();
        };
        await window.AngoraVideo.play(video,[...forward,...reverse],1.4/3,reduced,progress=>{if(progress>=.5)display();});
        still.src=`./assets/residence/chapters/finished/iso-${next}.webp`;
        // Hold the exact final movie frame. A separately rendered still must not
        // change the camera, exposure or colour at the end of the movement.
        display();await displayPromise;
      }
      $('.chapter-scene').dataset.nativeMoving='false';
    }
    let planDescending=false;
    function holdFloor(index){
      [...forward,...reverse].forEach(v=>{v.pause();v.classList.remove('playing');v.style.removeProperty('opacity');});
      stage.querySelectorAll('.film-hold-frame').forEach(c=>c.hidden=true);
      still.src=`./assets/residence/chapters/finished/iso-${index}.webp`;still.style.opacity='1';
      window.dispatchEvent(new CustomEvent('angora:chapter-display',{detail:index}));
    }
    window.AngoraIso=window.AngoraSteps.register($('#floors'),3,change,async(direction,top)=>{
      if(direction<0)return false;
      planDescending=true;planScene.reset(3-window.AngoraIso.index);window.AngoraPlan.selectFloor(window.AngoraIso.index);
      await window.AngoraScroll.travel(top,.65);return true;
    });
    const planScene=window.AngoraSteps.register($('#atlas'),3,(from,to)=>window.AngoraPlan.transition(planDescending?3-to:to),async(direction,top)=>{
      if(direction>0)return false;
      const index=window.AngoraPlan.floor;window.AngoraIso.reset(index);holdFloor(index);
      await window.AngoraScroll.travel($('#floors').getBoundingClientRect().top+scrollY,.65);return true;
    });
    window.AngoraIso.resetView=()=>{window.AngoraIso.reset(0);holdFloor(0);};
    window.AngoraIso.enter=direction=>{if(direction>0)window.AngoraIso.resetView();};
    window.AngoraPlan.resetView=()=>{planDescending=false;planScene.reset(0);window.AngoraPlan.selectFloor(0);};
    window.AngoraPlan.navigate=i=>{
      const go=()=>planScene.go(planDescending?3-Number(i):Number(i));
      if(Math.abs($('#atlas').getBoundingClientRect().top)>5){window.AngoraScroll.navigate($('#atlas')).then(go);}
      else go();
    };
    if(motion)refreshMotion();
  }).catch(error=>console.error('Native floor films',error));
  document.fonts?.ready.then(()=>{if(motion)refreshMotion();});
  if(motion){
    // The model settles back while the plan arrives, with no forced page jump.
    gsap.fromTo('.atlas-heading,.atlas-toolbar',{opacity:0,y:18},{opacity:1,y:0,ease:'power1.out',scrollTrigger:{trigger:'#atlas',start:'top 80%',end:'top 18%',scrub:.25}});
  }
})();
