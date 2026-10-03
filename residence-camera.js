(() => {
  'use strict';
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,motion=!!(window.gsap&&window.ScrollTrigger);
  const {stagedPosition,FramePlayer,clamp}=window.AngoraFilmRuntime;
  const media=$('.cinema-media'),canvas=$('#cinema-canvas'),opening=$('.cinema-opening');
  let manifest,player,trigger,target=0,displayed=0,current=-1,previousTime=0,active=false;
  const stops=[
    ['A living floor that opens directly onto the garden. A covered terrace connects the home to the water.','A private pool, framed by the villa and its own mature garden. 900 m² of garden space, as described in the listing.'],
    ['A detached home with four different levels: garden, entrance, bedrooms and attic.','500 m² gross interior area. Five bedrooms and four living spaces, with room for different generations.'],
    ['The garden-facing elevation connects balconies, terrace and lower living floor.','Your own pool. Your own lawn. An outdoor living space, sheltered by the home.']
  ];
  opening.muted=true;if(!reduced)opening.play().catch(()=>{});
  if(motion&&!reduced)gsap.to('.cinema-veil',{opacity:0,duration:2.2,delay:.25,ease:'power2.inOut',onComplete:()=>$('.cinema-veil').hidden=true});
  else $('.cinema-veil').hidden=true;
  function draw(p){
    if(!player)return;
    const state=stagedPosition(p,manifest.clips),clip=manifest.clips[state.index];
    player.seek(clip,state.frame,target<displayed?-1:1);
    media.classList.toggle('is-scrolling',p>.0005||reduced);
    if(p>.0005){opening.pause();opening.style.opacity=String(1-clamp(p/.018));}else opening.style.opacity='1';
    if(state.index!==current){current=state.index;$('#cinema-title').textContent=clip.title;$('#cinema-count').textContent=`0${current+1} / 03`;}
    $('#cinema-caption').textContent=state.hold?stops[current][state.stop==='midpoint'?0:1]:clip.caption;
    $('.hero').dataset.cameraHold=state.hold;$('.hero').dataset.filmChapter=current;$('.hero').dataset.filmProgress=p.toFixed(4);
    $$('[data-film-chapter]').forEach((button,i)=>{button.setAttribute('aria-current',String(i===current));button.querySelector('i').style.transform=`scaleX(${i<current?1:i===current?state.local:0})`;});
  }
  function tick(time){
    const dt=Math.min(.05,(time-(previousTime||time))/1000);previousTime=time;
    if(active&&Math.abs(target-displayed)>.00005){
      // Ordinary scrolling is limited to the source film's camera speed.
      const delta=target-displayed,max=Math.abs(delta)>.20?.45:.045;
      displayed+=Math.sign(delta)*Math.min(Math.abs(delta),max*dt,Math.max(.00005,Math.abs(delta)*dt*4));draw(displayed);
    }
    requestAnimationFrame(tick);
  }
  fetch('./assets/residence/films/manifest.json').then(r=>r.json()).then(data=>{
    manifest=data;player=new FramePlayer(canvas,data.clips,()=>{media.classList.add('is-ready');$('#cinema-status').textContent='';});draw(0);
    if(motion&&!reduced){
      trigger=ScrollTrigger.create({id:'angora-camera-films',trigger:'.cinematic-story',start:'top top',end:'bottom bottom',onUpdate:self=>{target=self.progress;active=true;},onLeave:()=>{displayed=target=1;draw(1);active=false;},onEnterBack:self=>{displayed=target=self.progress;active=true;},invalidateOnRefresh:true});
      requestAnimationFrame(tick);
      gsap.timeline({scrollTrigger:{trigger:'.cinematic-story',start:'top top',end:'bottom bottom',scrub:1,invalidateOnRefresh:true}})
        .to('.hero-title',{autoAlpha:0,yPercent:-20,duration:.045},0)
        .to('.hero-sides,.hero-bottom',{autoAlpha:0,duration:.04},0)
        .to('.cinema-caption,.cinema-track',{autoAlpha:1,duration:.035},.03)
        .to(media,{left:'5%',right:'5%',top:'7%',bottom:'7%',duration:.045,ease:'power2.inOut'},.10)
        .to(media,{left:'0%',right:'0%',top:'0%',bottom:'0%',duration:.045,ease:'power2.inOut'},.17)
        .to(media,{left:'5%',right:'5%',top:'7%',bottom:'7%',duration:.045,ease:'power2.inOut'},.44)
        .to(media,{left:'0%',right:'0%',top:'0%',bottom:'0%',duration:.045,ease:'power2.inOut'},.51)
        .to('.cinema-caption,.cinema-track',{autoAlpha:0,duration:.08},.88)
        .to('.hero',{backgroundColor:'#efede6',duration:.12},.88)
        .to(media,{left:()=>innerWidth<801?'7%':'43%',right:()=>innerWidth<801?'7%':'6%',top:()=>innerWidth<801?'54%':'15%',bottom:()=>innerWidth<801?'8%':'15%',duration:.12,ease:'power2.inOut'},.88)
        .fromTo('.cinema-destination',{autoAlpha:0,y:25},{autoAlpha:1,y:0,duration:.08},.92);
      target=trigger.progress;displayed=target;draw(displayed);
      $$('[data-film-chapter]').forEach(button=>button.addEventListener('click',()=>{
        const p=(Number(button.dataset.filmChapter)+.40)/3;
        window.dispatchEvent(new CustomEvent('angora:scroll',{detail:{top:trigger.start+(trigger.end-trigger.start)*p}}));
      }));
    }else{opening.pause();media.classList.add('is-scrolling');}
    if(motion)ScrollTrigger.refresh();
  }).catch(()=>{$('.cinema-veil').hidden=true;$('#cinema-status').textContent='Continue to discover the residence.';});
  if(!motion||reduced)return;
  // Word windows belong to editorial statements, rather than every interface label.
  $$('.residence .display,.editorial h3,.life-lede h3').forEach(heading=>{
    const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{const f=document.createDocumentFragment();node.textContent.split(/(\s+)/).forEach(word=>{if(!word.trim()){f.append(document.createTextNode(word));return;}const outer=document.createElement('span'),inner=document.createElement('span');outer.className='word-window';inner.textContent=word;outer.append(inner);f.append(outer);});node.replaceWith(f);});
    gsap.fromTo(heading.querySelectorAll('.word-window>span'),{yPercent:110},{yPercent:0,duration:1.15,stagger:.04,ease:'power3.out',scrollTrigger:{trigger:heading,start:'top 89%',once:true}});
  });
  $$('.editorial-image').forEach(frame=>{
    gsap.fromTo(frame,{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)',duration:1.4,ease:'power3.inOut',scrollTrigger:{trigger:frame,start:'top 85%',once:true}});
    gsap.fromTo(frame.querySelector('img'),{scale:1.055},{scale:1,ease:'none',scrollTrigger:{trigger:frame,start:'top bottom',end:'bottom top',scrub:1}});
  });
  gsap.fromTo('footer',{yPercent:-12},{yPercent:0,ease:'none',scrollTrigger:{trigger:'footer',start:'top bottom',end:'bottom bottom',scrub:1}});
  document.fonts?.ready.then(()=>ScrollTrigger.refresh());
})();
