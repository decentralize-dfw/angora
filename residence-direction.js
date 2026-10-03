(() => {
  'use strict';
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,motion=!!(window.gsap&&window.ScrollTrigger)&&!reduced;
  const {FramePlayer,floorPosition,clamp}=window.AngoraFilmRuntime;
  function refreshMotion(){
    // Upstream pinned strips must measure before the floor / plan anchors below them.
    ScrollTrigger.sort((a,b)=>a.trigger===b.trigger?0:a.trigger.compareDocumentPosition(b.trigger)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1);
    ScrollTrigger.refresh();
  }
  const data=window.ANGORA_ATLAS;
  // Only newly supplied exterior material enters this presentation.
  const exteriors=[['front','The street elevation'],['pool-garden','The private garden & pool'],['garden-facade','The garden-facing elevation'],['pool-terrace','The covered terrace & water'],['neighbourhood','Angora Evleri, in context']].map(([name,en],i)=>({id:100+i,url:`./assets/residence/new/${name}.webp`,en,outdoor:true}));
  const curated=data.photos.filter(p=>!p.outdoor);
  const exteriorSafe=[...exteriors,...curated.filter(p=>!p.outdoor)];
  const track=$('.gallery-track');let gallery=[],galleryTrigger,index=0;
  function fitGallery(){
    const width=Math.max(220,Math.min(innerWidth*.83,(track.clientHeight-38)*16/9));
    const previous=parseFloat(track.style.getPropertyValue('--gallery-photo-width'))||0;
    if(Math.abs(width-previous)<1)return;
    track.style.setProperty('--gallery-photo-width',`${width}px`);
    if(galleryTrigger)requestAnimationFrame(refreshMotion);
  }
  new ResizeObserver(fitGallery).observe(track);
  function caption(p){return p.en.replace('Basement ·','Garden level ·').replace('Ground floor ·','Entrance level ·').replace('Attic floor ·','Attic level ·');}
  function updateCounter(x){
    const figures=[...track.children];if(!figures.length)return;
    index=figures.reduce((best,figure,i)=>Math.abs(figure.offsetLeft-figures[0].offsetLeft+x)<Math.abs(figures[best].offsetLeft-figures[0].offsetLeft+x)?i:best,0);
    $('#gallery-counter').textContent=`${String(index+1).padStart(2,'0')} / ${gallery.length}`;$('#gallery-prev').disabled=index===0;$('#gallery-next').disabled=index===gallery.length-1;
  }
  function galleryGo(delta){
    const next=Math.max(0,Math.min(gallery.length-1,index+delta));
    if(galleryTrigger){const distance=track.scrollWidth-track.clientWidth,p=.12+.88*Math.min(1,(track.children[next].offsetLeft-track.children[0].offsetLeft)/Math.max(1,distance));window.dispatchEvent(new CustomEvent('angora:scroll',{detail:{top:galleryTrigger.start+(galleryTrigger.end-galleryTrigger.start)*p}}));}
    else track.scrollTo({left:track.children[next].offsetLeft-track.children[0].offsetLeft,behavior:'smooth'});
  }
  function renderGallery(filter='all',reset=false){
    gallery=filter==='all'?exteriorSafe:filter==='outdoor'?exteriors:data.photos.filter(p=>!p.outdoor&&p.floor===Number(filter));
    galleryTrigger?.kill(true);galleryTrigger=null;track.replaceChildren();window.gsap?.set(track,{x:0});track.scrollLeft=0;index=0;
    gallery.forEach((p,i)=>{
      const figure=document.createElement('figure'),button=document.createElement('button'),image=document.createElement('img'),expand=document.createElement('span'),label=document.createElement('figcaption');figure.className='gallery-item';
      button.dataset.photo=p.id;button.dataset.photoUrl=p.url;button.dataset.caption=caption(p);button.setAttribute('aria-label',`Enlarge ${caption(p)}`);image.src=p.url;image.alt=caption(p);image.loading='lazy';image.width=1672;image.height=941;expand.textContent='↗';button.append(image,expand);label.textContent=`${String(i+1).padStart(2,'0')} / ${caption(p)}`;figure.append(button,label);track.append(figure);
    });fitGallery();updateCounter(0);
    if(motion){
      const distance=()=>Math.max(0,track.scrollWidth-track.clientWidth);
      const timeline=gsap.timeline({scrollTrigger:{id:'angora-photo-collection',trigger:'.gallery',pin:'.gallery-scene',start:'top top',end:()=>`+=${distance()+innerHeight*.7}`,scrub:1,invalidateOnRefresh:true,onUpdate:self=>updateCounter(-distance()*clamp((self.progress-.12)/.88))}});
      galleryTrigger=timeline.scrollTrigger;
      timeline.fromTo($('.gallery-window'),{clipPath:'inset(0 35% 0 35%)'},{clipPath:'inset(0 0% 0 0%)',duration:.12,ease:'power2.inOut'},0)
        .to(track,{x:()=>-distance(),duration:.88,ease:'none'},.12).to('.gallery .horizontal-progress i',{scaleX:1,duration:1,ease:'none'},0);
      refreshMotion();
      if(reset)window.dispatchEvent(new CustomEvent('angora:scroll',{detail:{top:galleryTrigger.start+(galleryTrigger.end-galleryTrigger.start)*.12,immediate:true}}));
    }else track.style.overflowX='auto';
  }
  renderGallery();$$('[data-gallery-filter]').forEach(b=>b.addEventListener('click',()=>{renderGallery(b.dataset.galleryFilter,true);$$('[data-gallery-filter]').forEach(other=>other.setAttribute('aria-pressed',String(other===b)));}));
  $('#gallery-prev').onclick=()=>galleryGo(-1);$('#gallery-next').onclick=()=>galleryGo(1);
  track.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();galleryGo(e.key==='ArrowRight'?1:-1);}});
  if(motion){
    $$('.horizontal-story').forEach(section=>{
      const scene=section.querySelector('.horizontal-scene'),window=section.querySelector('.horizontal-window'),strip=section.querySelector('.horizontal-track'),distance=()=>Math.max(0,strip.scrollWidth-window.clientWidth);
      const tl=gsap.timeline({scrollTrigger:{trigger:section,pin:scene,start:'top top',end:()=>`+=${distance()+innerHeight*.65}`,scrub:1,invalidateOnRefresh:true}});
      tl.fromTo(window,{clipPath:'inset(6% 24% 6% 24%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:.14,ease:'power2.inOut'},0)
        .to(strip,{x:()=>-distance(),duration:.86,ease:'none'},.14).to(section.querySelector('.horizontal-progress i'),{scaleX:1,duration:1,ease:'none'},0);
    });
    $$('.life-photo-story figure').forEach(figure=>{
      gsap.fromTo(figure,{clipPath:'inset(12% 0 12% 0)'},{clipPath:'inset(0% 0 0% 0)',ease:'none',scrollTrigger:{trigger:figure,start:'top 85%',end:'top 28%',scrub:1}});
      gsap.fromTo(figure.querySelector('img'),{scale:1.07,yPercent:-3},{scale:1,yPercent:3,ease:'none',scrollTrigger:{trigger:figure,start:'top bottom',end:'bottom top',scrub:1}});
    });
  }
  fetch('./assets/residence/chapters/native-manifest.json').then(r=>r.json()).then(manifest=>{
    const stage=$('.chapter-native-stage'),still=$('#chapter-native-still');
    const forward=[1,2,3].map(i=>window.AngoraVideo.create(`./assets/residence/chapters/level-${i}.mp4`,stage,'native-floor-film'));
    const reverse=[1,2,3].map(i=>window.AngoraVideo.create(`./assets/residence/chapters/level-${i}-reverse.mp4`,stage,'native-floor-film'));
    async function change(from,to){
      if(from===to)return;
      const step=Math.sign(to-from);
      for(let current=from;current!==to;current+=step){
        const next=current+step,video=(step>0?forward:reverse)[Math.max(current,next)-1];
        $('.chapter-scene').dataset.nativeMoving='true';
        await window.AngoraVideo.play(video,[...forward,...reverse],1.4,reduced);
        still.src=`./assets/residence/chapters/iso-${next}.webp`;
        await still.decode().catch(()=>{});video.classList.remove('playing');
        window.dispatchEvent(new CustomEvent('angora:chapter-display',{detail:next}));
      }
      $('.chapter-scene').dataset.nativeMoving='false';
    }
    window.AngoraIso=window.AngoraSteps.register($('#floors'),3,change);
    const planScene=window.AngoraSteps.register($('#atlas'),3,(from,to)=>window.AngoraPlan.transition(to));
    window.AngoraPlan.navigate=i=>{
      if(Math.abs($('#atlas').getBoundingClientRect().top)>5)window.AngoraScroll.to($('#atlas').getBoundingClientRect().top+scrollY,true);
      planScene.go(Number(i));
    };
    if(motion)refreshMotion();
  }).catch(error=>console.error('Native floor films',error));
  document.fonts?.ready.then(()=>{if(motion)refreshMotion();});
})();
