export const TRANSITIONS = [
 ['T01','Opening veil'],['T02','Opening to arrival'],['T03','Arrival film'],['T04','Perspective film'],['T05','Garden film'],['T06','Shared window retreat'],['T07','Residence facts'],['T08','Street arrival'],['T09','Rooms entry'],['T10','Private room sequence'],['T11','Pool takeover'],['T12','Terrace'],['T13','Garden path'],['T14','Paper interior threshold'],['T15','Living and dining'],['T16','Principal suite'],['T17','Kitchen surface'],['T18','Garden kitchen'],['T19','Attic kitchenette'],['T20','Isometric entry'],['T21','Garden to entrance'],['T22','Entrance to first'],['T23','First to attic'],['T24','Same-floor plan bridge'],['T25','Attic to first plan'],['T26','First to entrance plan'],['T27','Entrance to garden plan'],['T28','Local camera selection'],['T29','Photograph opening'],['T30','Return to origin'],['T31','Plan to comfort'],['T32','Central staircase'],['T33','Neighbourhood parallax'],['T34','Flat map'],['T35','First community image'],['T36','Second community image'],['T37','Ankara culture'],['T38','Gallery entry'],['T39','Gallery progression'],['T40','Gallery filter'],['T41','Filtered lightbox'],['T42','Opportunity'],['T43','Shared closing surface'],['T44','Line model orbit'],['T45','Credits'],['T46','Explicit navigation'],['T47','Responsive header'],['T48','Resize continuity'],['T49','Failure fallback']
].map(([id,name])=>({id,name}));
// Reveal only after actual viewport entry. No cached page offsets or early scrub.
export function mountScenes(){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const targets=[...document.querySelectorAll('.reveal,.from-left,.from-right,.reveal-frame,.wire-column')];
  const animations=new Set();
  const initial=node=>({opacity:0,transform:`translate3d(${node.classList.contains('from-left')?-55:node.classList.contains('from-right')?55:0}px,${node.parentElement.matches('.room-row,.kitchen-row')?0:32}px,0) scale(${node.classList.contains('reveal-frame')?.96:1})`});
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){if(!entry.isIntersecting)continue;const node=entry.target;observer.unobserve(node);node.dataset.motionState='entering';
      const a=node.animate([initial(node),{opacity:1,transform:'translate3d(0,0,0) scale(1)'}],{duration:node.classList.contains('reveal')?1400:1800,easing:'cubic-bezier(.22,.65,.25,1)',fill:'both'});
      animations.add(a);a.finished.then(()=>{node.style.opacity='1';node.style.transform='none';node.dataset.motionState='complete';a.cancel();animations.delete(a);}).catch(()=>{});
    }
  },{rootMargin:'0px 0px -18% 0px',threshold:.12});
  for(const node of targets){if(reduced.matches)continue;Object.assign(node.style,initial(node));node.dataset.motionState='waiting';observer.observe(node);}
  const parallax=[document.querySelector('.neighbourhood-image'),document.querySelector('.editorial-image')].filter(Boolean);
  let queued=false;
  function paint(){queued=false;if(reduced.matches)return;for(const frame of parallax){const r=frame.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)continue;const progress=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));frame.querySelector('img').style.transform=`translateY(${(progress-.5)*32}px) scale(${1.015+progress*.035})`;}}
  function schedule(){if(!queued){queued=true;requestAnimationFrame(paint);}}
  const pool=document.querySelector('.garden-takeover');
  const poolObserver=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting||reduced.matches)return;poolObserver.disconnect();pool.animate([{borderTopLeftRadius:'50% 7%',borderTopRightRadius:'50% 7%'},{borderTopLeftRadius:'0% 0%',borderTopRightRadius:'0% 0%'}],{duration:1800,easing:'cubic-bezier(.22,.65,.25,1)',fill:'forwards'});},{rootMargin:'0px 0px -20% 0px',threshold:.1});poolObserver.observe(pool);
  reduced.addEventListener('change',()=>{if(reduced.matches){observer.disconnect();animations.forEach(a=>a.cancel());targets.forEach(n=>{n.style.opacity='1';n.style.transform='none';});parallax.forEach(n=>n.querySelector('img').style.transform='none');}});
  addEventListener('scroll',schedule,{passive:true});schedule();
  return {refresh:schedule,dispose(){observer.disconnect();poolObserver.disconnect();removeEventListener('scroll',schedule);animations.forEach(a=>a.cancel());}};
}

// A sticky section is constrained by its own physical wrapper. It can never pin
// over the previous chapter, even after fonts, media, filtering or resize change.
export function installGalleryRail(windowNode,track,{onPhoto=()=>{}}={}){
  const section=windowNode.closest('.gallery'),wrapper=section.parentElement;
  const media=matchMedia('(min-width:1000px) and (min-height:600px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let overflow=0,active=false,queued=false,lastKey=null;
  let keyboardFocus=false;
  addEventListener('keydown',e=>{if(e.key==='Tab')keyboardFocus=true;},{capture:true});
  addEventListener('pointerdown',()=>keyboardFocus=false,{capture:true,passive:true});
  track.addEventListener('focusin',e=>{const card=e.target.closest('.gallery-card');if(!keyboardFocus||!active||!card)return;const x=Math.max(0,Math.min(overflow,card.offsetLeft-track.offsetLeft));scrollTo({top:scrollY+wrapper.getBoundingClientRect().top+x,behavior:'instant'});});
  function nearest(){const left=windowNode.scrollLeft;return [...track.children].reduce((best,card)=>Math.abs(card.offsetLeft-track.offsetLeft-left)<Math.abs((best?.offsetLeft??Infinity)-track.offsetLeft-left)?card:best,null);}
  function report(){const key=nearest()?.dataset.key;if(key&&key!==lastKey){lastKey=key;onPhoto(key);}}
  function paint(){queued=false;if(active){const progress=Math.max(0,Math.min(overflow,-wrapper.getBoundingClientRect().top));windowNode.scrollLeft=progress;wrapper.dataset.progress=Math.round(progress);}report();}
  function schedule(){if(!queued){queued=true;requestAnimationFrame(paint);}}
  function refresh(selectedKey){
    const before=wrapper.getBoundingClientRect(),wasInside=active&&before.top<=1&&before.bottom>=innerHeight-1;
    active=media.matches&&!reduced.matches;section.classList.toggle('has-rail',active);wrapper.classList.toggle('is-rail',active);
    wrapper.style.height='';
    if(active){section.style.setProperty('--gallery-image-height',Math.max(130,windowNode.clientHeight-110)+'px');overflow=Math.max(0,track.scrollWidth-windowNode.clientWidth);wrapper.style.height=(section.getBoundingClientRect().height+overflow)+'px';}
    else overflow=0;
    const target=selectedKey?track.querySelector(`[data-key="${selectedKey}"]`):null;
    if(wasInside&&target){const x=Math.min(overflow,target.offsetLeft-track.offsetLeft);scrollTo({top:scrollY+wrapper.getBoundingClientRect().top+x,behavior:'instant'});}
    else if(!active&&target)windowNode.scrollLeft=target.offsetLeft-track.offsetLeft;
    paint();
  }
  media.addEventListener('change',()=>refresh(lastKey));reduced.addEventListener('change',()=>refresh(lastKey));
  addEventListener('scroll',schedule,{passive:true});windowNode.addEventListener('scroll',report,{passive:true});
  return {refresh,advance(dir){const distance=(track.querySelector('.gallery-card')?.getBoundingClientRect().width||windowNode.clientWidth)+parseFloat(getComputedStyle(track).gap);
    if(active){const start=scrollY+wrapper.getBoundingClientRect().top;scrollTo({top:start+Math.max(0,Math.min(overflow,scrollY-start+dir*distance)),behavior:'smooth'});}else windowNode.scrollBy({left:dir*distance,behavior:'smooth'});
  }};
}
