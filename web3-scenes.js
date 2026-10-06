export const TRANSITIONS = [
 ['T01','Opening veil'],['T02','Opening to arrival'],['T03','Arrival film'],['T04','Perspective film'],['T05','Garden film'],['T06','Shared window retreat'],['T07','Residence facts'],['T08','Street arrival'],['T09','Rooms entry'],['T10','Private room sequence'],['T11','Pool takeover'],['T12','Terrace'],['T13','Garden path'],['T14','Paper interior threshold'],['T15','Living and dining'],['T16','Principal suite'],['T17','Kitchen surface'],['T18','Garden kitchen'],['T19','Attic kitchenette'],['T20','Isometric entry'],['T21','Garden to entrance'],['T22','Entrance to first'],['T23','First to attic'],['T24','Same-floor plan bridge'],['T25','Attic to first plan'],['T26','First to entrance plan'],['T27','Entrance to garden plan'],['T28','Local camera selection'],['T29','Photograph opening'],['T30','Return to origin'],['T31','Plan to comfort'],['T32','Central staircase'],['T33','Neighbourhood parallax'],['T34','Flat map'],['T35','First community image'],['T36','Second community image'],['T37','Ankara culture'],['T38','Gallery entry'],['T39','Gallery progression'],['T40','Gallery filter'],['T41','Filtered lightbox'],['T42','Opportunity'],['T43','Shared closing surface'],['T44','Line model orbit'],['T45','Credits'],['T46','Explicit navigation'],['T47','Responsive header'],['T48','Resize continuity'],['T49','Failure fallback']
].map(([id,name])=>({id,name}));
export function mountScenes(){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');if(reduced.matches||!globalThis.gsap||!globalThis.ScrollTrigger)return {refresh(){}};
  gsap.registerPlugin(ScrollTrigger);
  const context=gsap.context(()=>{
    document.querySelectorAll('.reveal').forEach(node=>gsap.fromTo(node,{y:35,opacity:.25},{y:0,opacity:1,ease:'none',scrollTrigger:{trigger:node,start:'top 96%',end:'top 73%',scrub:.2}}));
    document.querySelectorAll('.from-left,.from-right').forEach(node=>gsap.fromTo(node,{xPercent:node.classList.contains('from-left')?-7:7,y:35,opacity:.4},{xPercent:0,y:0,opacity:1,ease:'none',scrollTrigger:{trigger:node,start:'top 96%',end:'top 65%',scrub:.3}}));
    document.querySelectorAll('.reveal-frame').forEach(node=>gsap.fromTo(node,{scale:.94},{scale:1,ease:'none',scrollTrigger:{trigger:node,start:'top 96%',end:'top 60%',scrub:.3}}));
    const neighbourhood=document.querySelector('.neighbourhood-image img');gsap.fromTo(neighbourhood,{y:-20,scale:1},{y:20,scale:1.04,ease:'none',scrollTrigger:{trigger:neighbourhood.parentElement,start:'top bottom',end:'bottom top',scrub:.4}});
    const arrival=document.querySelector('.editorial-image img');gsap.fromTo(arrival,{y:-12,scale:1},{y:12,scale:1.025,ease:'none',scrollTrigger:{trigger:arrival.parentElement,start:'top bottom',end:'bottom top',scrub:.3}});
    gsap.fromTo('.garden-takeover',{borderTopLeftRadius:'50% 7%',borderTopRightRadius:'50% 7%'},{borderTopLeftRadius:'0% 0%',borderTopRightRadius:'0% 0%',ease:'none',scrollTrigger:{trigger:'.garden-takeover',start:'top bottom',end:'top 10%',scrub:true}});
    gsap.fromTo('.interiors',{y:25},{y:0,ease:'none',scrollTrigger:{trigger:'.interiors',start:'top bottom',end:'top 65%',scrub:true}});
    gsap.fromTo('.wire-column',{y:65,scale:.95},{y:0,scale:1,ease:'none',scrollTrigger:{trigger:'.viewing',start:'top 90%',end:'top 25%',scrub:.3}});
  });
  return {refresh(){ScrollTrigger.refresh();},dispose(){context.revert();}};
}
export function installGalleryRail(windowNode,track,{onPhoto=()=>{}}={}){
  let tween=null;
  const media=matchMedia('(min-width: 1000px)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function refresh(selectedKey){
    const y=scrollY,current=windowNode.scrollLeft,previous=tween?.scrollTrigger,wasPinned=previous&&y>=previous.start&&y<=previous.end;tween?.scrollTrigger?.kill(true);tween?.kill();tween=null;
    const section=windowNode.closest('.gallery');section.classList.remove('has-rail');
    if(media.matches&&!reduced.matches){section.classList.add('has-rail');const available=windowNode.clientHeight;section.style.setProperty('--gallery-image-height',Math.max(130,available-130)+'px');}
    const overflow=track.scrollWidth-windowNode.clientWidth,target=selectedKey?track.querySelector(`[data-key="${selectedKey}"]`):null,targetX=target?target.offsetLeft-track.offsetLeft:current;
    if(media.matches&&!reduced.matches&&overflow>100&&globalThis.ScrollTrigger){
      section.classList.add('has-rail');
      tween=gsap.to(windowNode,{scrollLeft:overflow,ease:'none',scrollTrigger:{trigger:section,start:'top top',end:()=>'+='+overflow,pin:true,anticipatePin:0,scrub:.25,invalidateOnRefresh:true}});
      windowNode.scrollLeft=Math.min(overflow,targetX);
    }else section.classList.remove('has-rail');
    if(wasPinned){scrollTo({top:tween?tween.scrollTrigger.start+Math.min(overflow,targetX):section.offsetTop,behavior:'instant'});}else if(Math.abs(scrollY-y)>1)scrollTo({top:y,behavior:'instant'});
  }
  media.addEventListener('change',refresh);reduced.addEventListener('change',refresh);
  let lastKey=null;windowNode.addEventListener('scroll',()=>{const cards=[...track.children],left=windowNode.scrollLeft;const current=cards.reduce((best,card)=>Math.abs(card.offsetLeft-track.offsetLeft-left)<Math.abs((best?.offsetLeft??Infinity)-track.offsetLeft-left)?card:best,null);if(current?.dataset.key&&current.dataset.key!==lastKey){lastKey=current.dataset.key;onPhoto(lastKey);}}, {passive:true});
  return {refresh,advance(dir){const distance=(track.querySelector('.gallery-card')?.getBoundingClientRect().width||windowNode.clientWidth)+60;
    if(tween){const st=tween.scrollTrigger;scrollTo({top:Math.max(st.start,Math.min(st.end,scrollY+dir*distance)),behavior:'smooth'});}else windowNode.scrollBy({left:dir*distance,behavior:'smooth'});
  }};
}
