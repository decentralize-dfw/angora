import {createState,FLOORS,ROUTE,cursorFor} from './web3-state.js?v=20261006-pin-5';
import {FilmSurface,decodedImage} from './web3-media.js?v=20261006-pin-5';
import {preparePlan,photoURL,photoName} from './web3-plans.js?v=20261006-pin-5';
import {installInput,terminalReadingInset} from './web3-input.js?v=20261006-pin-5';
import {installHistory,parseRoute} from './web3-history.js?v=20261006-pin-5';
import {installOverlays} from './web3-overlays.js?v=20261006-pin-5';
import {mountScenes,installGalleryRail,TRANSITIONS} from './web3-scenes.js?v=20261006-pin-5';
import {installLanguage} from './web3-i18n.js?v=20261006-pin-5';
const $=selector=>document.querySelector(selector);
const OPENING_LAST='assets/web3/films/opening-last.webp';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const descriptions=['Living spaces open towards the pool and garden.','The street arrival, principal kitchen and shared living spaces.','Bedrooms, the principal suite and a private sitting room.','Rooms beneath the roof, with a sitting area and kitchenette.'];
const heroCopy=[['00 / Arrival','A quieter perspective on the city.'],['01 / Arrival','A quieter arrival.'],['02 / Perspective','A world of your own.'],['03 / Garden','Life opens outside.']];
const gestures=[], errors=[];
const failedScenes=new Set();
const qaNode=document.createElement('script');qaNode.type='application/json';qaNode.id='web3-qa';document.body.append(qaNode);
function publishQA(){if(state){const s=state.snapshot();if(s.pending)$('#technical').setAttribute('aria-busy','true');else $('#technical').removeAttribute('aria-busy');document.querySelectorAll('#camera-bar button,#dimensions').forEach(n=>n.disabled=!!s.pending);qaNode.textContent=JSON.stringify({state:s,events:state.log.slice(-20),gestures:gestures.slice(-25),errors,width:innerWidth,height:innerHeight,y:scrollY,active:document.activeElement?.id||document.activeElement?.tagName});}}
let manifest,state,history,overlays,input,scenes,heroPlayer,isoPlayer,rail,dimensions=false,initializing=true;
let paintHeader=()=>{};
let openingAbort=null,transitionAnimations=[],reversePending=null,navigationActive=false,navigationId=0,lastDirection=1,planWarm=null;
function prepareNext(s){if(!heroPlayer||!isoPlayer)return;const size=innerWidth<681?'m':'d';
  const nextFloor=s.section==='technical'?(s.technical.mode==='iso'?3:ROUTE[s.cursor+lastDirection]?.floor):null;
  const warmKey=nextFloor!=null?`${nextFloor}:${s.cameraByFloor[nextFloor]}`:null;
  if(warmKey&&planWarm?.key!==warmKey){const photo=manifest.floors[nextFloor].photos.find(p=>p.id===s.cameraByFloor[nextFloor]);planWarm={key:warmKey,images:Promise.all([decodedImage(manifest.floors[nextFloor].plan),decodedImage(photoURL(manifest,photo.key))]).catch(()=>null)};}else if(!warmKey)planWarm=null;
  if(s.section==='hero'){const index=lastDirection<0?s.hero-1:s.hero<3?s.hero:s.hero-1;if(index>=0)heroPlayer.warm(['approach','orbit','garden-return'][index]+((lastDirection<0||s.hero===3)?'-back':'')+'-'+size);}else heroPlayer.dropWarm();
  if(s.section==='technical'&&s.technical.mode==='iso'){const floor=s.technical.floor,level=lastDirection<0?floor:floor<3?floor+1:floor;if(level>0)isoPlayer.warm(`level-${level}${lastDirection<0||floor===3?'-back':''}-${size}`);}else isoPlayer.dropWarm();
}
function status(message){$('#status').textContent=message;setTimeout(()=>$('#status').textContent='',3500);}
function abortPresentation(){openingAbort?.();openingAbort=null;heroPlayer?.cancel();isoPlayer?.cancel();transitionAnimations.forEach(a=>a.cancel());transitionAnimations=[];document.querySelectorAll('.unit-outgoing').forEach(n=>n.remove());}
function animate(node,keyframes,duration){
  if(reduced.matches)return Promise.resolve();const a=node.animate(keyframes,{duration,easing:'cubic-bezier(.25,.75,.2,1)',fill:'none'});transitionAnimations.push(a);return a.finished.catch(()=>{});
}
function fitPlan(){
  const svg=$('#plan-surface svg');if(!svg)return;const box=svg.viewBox.baseVal,r=svg.getBoundingClientRect(),scale=Math.min(r.width/box.width,r.height/box.height);if(!scale)return;
  const labelSize=Math.max(8,Math.min(12,r.height/22)),compact=r.height<210;
  svg.querySelectorAll('.room-label').forEach(n=>{n.style.fontSize=(labelSize/scale)+'px';n.style.strokeWidth=(2/scale)+'px';
    const names={'Principal bedroom':'Suite','Bedroom II':'Bed II','Bedroom III':'Bed III','Guest WC':'WC','Dressing room':'Dressing','En-suite':'Bath','Landing & kitchenette':'Landing','Living room':'Living','Hall & stairs':'Hall','Entry hall':'Entry'};
    const full=n.dataset.fullName||n.textContent;n.dataset.fullName=full;
    n.textContent=r.width<500?(names[full]||full):['Guest WC','Hall & stairs','Entry hall'].includes(full)?names[full]:full;
  });
  const groups=[...svg.querySelectorAll('.camera-pin')];
  groups.forEach(g=>{const circle=g.querySelector('circle'),active=g.classList.contains('active');circle.setAttribute('r',(active?(compact?8:10):(compact?6:7))/scale);g.querySelector('text').style.fontSize=(compact?9:11)/scale+'px';const cy=+circle.getAttribute('cy');g.querySelector('text').setAttribute('y',cy+(compact?3.1:3.8)/scale);
    g.querySelector('text').style.display='';delete g.dataset.cluster;
    if(!active){const cx=+circle.getAttribute('cx');const near=groups.filter(other=>other!==g&&Math.hypot(cx-+other.querySelector('circle').getAttribute('cx'),cy-+other.querySelector('circle').getAttribute('cy'))*scale<21);if(near.length){circle.setAttribute('r',2.5/scale);g.querySelector('text').style.display='none';g.dataset.cluster=[g.dataset.camera,...near.map(p=>p.dataset.camera)].join(',');}}
  });
}
function setTerminal(node,enabled){
  if(enabled&&!node.classList.contains('is-terminal')){
    const r=node.getBoundingClientRect(),stage=node.querySelector('.pinned'),h=stage.getBoundingClientRect().height;
    node.style.setProperty('--reading-inset',terminalReadingInset(r.top,r.bottom,h)+'px');
  }
  node.classList.toggle('is-terminal',enabled);
  if(!enabled)node.style.removeProperty('--reading-inset');
}
function renderMeta(s=state.snapshot(),{surfaces=true,geometry=true}={}){
  const {floor,mode}=s.technical;
  $('#technical-eyebrow').textContent=mode==='iso'?'04 / One home, four chapters':'05 / Inside every level';
  $('#technical-title').textContent=`The ${FLOORS[floor].toLowerCase()} level.`;
  $('#mode-toggle').textContent=mode==='iso'?'See this floor’s plan ↗':'View this floor in 3D ↗';
  $('#floor-description').textContent=descriptions[floor];$('#floor-position').textContent=`${FLOORS[floor]} / ${floor+1} of 4`;
  $('#chapters').classList.toggle('plan-active',mode==='plan');
  $('#chapters').dataset.cursor=s.cursor;
  if(surfaces){$('.iso-surface').hidden=mode!=='iso';$('#plan-surface').hidden=mode!=='plan';}
  $('#camera-bar').hidden=mode!=='plan';
  $('.iso-surface .film-still').alt=`${FLOORS[floor]} level isometric overview`;
  document.querySelectorAll('.floor-tabs [data-floor]').forEach(b=>{const selected=+b.dataset.floor===floor;b.setAttribute('aria-selected',selected);b.tabIndex=selected?0:-1;});
  const choices=$('.camera-choices');
  if(choices.dataset.cameraFloor!==String(floor)){choices.replaceChildren();choices.dataset.cameraFloor=floor;
    manifest.floors[floor].photos.forEach(p=>{const b=document.createElement('button');b.type='button';b.disabled=!!state.snapshot().pending;b.dataset.camera=p.id;b.textContent=p.number;b.setAttribute('aria-label',`Photograph ${p.number}, ${photoName(manifest,floor,p)}`);choices.append(b);});}
  choices.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.camera===s.cameraByFloor[floor]));
  const selectedCamera=choices.querySelector('[aria-pressed="true"]');if(selectedCamera)choices.scrollLeft=Math.max(0,selectedCamera.offsetLeft-choices.offsetLeft-choices.clientWidth/2+selectedCamera.offsetWidth/2);
  choices.dataset.scrollLeft=Math.round(choices.scrollLeft);
  document.querySelectorAll('[data-hero]').forEach(b=>b.setAttribute('aria-current',+b.dataset.hero===s.hero));
  $('#hero-count').textContent=heroCopy[s.hero][0];$('#hero-caption').textContent=heroCopy[s.hero][1];
  $('.hero-stage').dataset.exit=String(s.heroExit);
  $('.hero-stage').dataset.shadeExit=String(s.heroExit);
  paintHeader();
  if(geometry){setTerminal($('#hero'),s.heroExit);setTerminal($('#technical'),s.cursor===7);}
  $('#hero').querySelector('.hero-wordmark').style.opacity=s.hero?'.0':'1';
  prepareNext(s);
  requestAnimationFrame(fitPlan);
}
async function paintCommitted(){
  const s=state.snapshot(),{floor,mode}=s.technical;
  renderMeta();
  const heroURL=s.hero?manifest.films[['approach','orbit','garden-return'][s.hero-1]+'-'+(innerWidth<681?'m':'d')].last:OPENING_LAST;
  const heroStill=$('.hero-film .film-still');if(!heroStill.src.endsWith(heroURL))decodedImage(heroURL,600).then(image=>{if(state.snapshot().requestId===s.requestId)heroStill.src=image.src;}).catch(()=>{});
  $('.hero-film').style.transform=s.heroExit?'scale(.76)':'';$('.hero-stage').style.background=s.heroExit?'#efede6':'#223e35';$('.hero-stage').style.color=s.heroExit?'#223e35':'#efede6';
  if(mode==='iso'){$('.iso-surface .film-still').src=manifest.floors[floor].iso;$('.iso-surface .film-still').alt=`${FLOORS[floor]} level isometric overview`;}else{const unit=await preparePlan(manifest,floor,s.cameraByFloor[floor],dimensions);const now=state.snapshot();if(now.cursor!==s.cursor||now.requestId!==s.requestId||now.cameraByFloor[floor]!==s.cameraByFloor[floor])return;$('#plan-surface').replaceChildren(unit);fitPlan();}
}
async function transition(target,source='explicit',direction=1){
  if(state.snapshot().overlay)return false;
  const before=state.snapshot();if(source==='wheel'||source==='touch'||source==='keyboard'){if(before.pending){const property=target.hero!=null?'hero':'cursor',going=Math.sign((before.pending.target[property]??before[property])-before[property]);if(direction!==going)reversePending={id:before.pending.id,owner:property==='hero'?'hero':'technical',direction,source};return true;}}
  if(!before.pending&&target.cursor===before.cursor)return true;
  lastDirection=direction;const id=state.begin(target,source);abortPresentation();
  const started=performance.now(),y=scrollY;gestures.push({id,source,before:{hero:before.hero,cursor:before.cursor},y,start:started});
  try{
    if(target.heroExit!=null){
      const surface=$('.hero-film'),stage=$('.hero-stage'),scale=target.heroExit?.76:1;
      stage.dataset.shadeExit=String(target.heroExit);
      const color=target.heroExit?'#efede6':'#223e35',ink=target.heroExit?'#223e35':'#efede6';await Promise.all([animate(surface,[{transform:surface.style.transform||'scale(1)'},{transform:`scale(${scale})`}],1300),animate(stage,[{background:getComputedStyle(stage).backgroundColor,color:getComputedStyle(stage).color},{background:color,color:ink}],1300)]);
      if(state.current(id)){surface.style.transform=`scale(${scale})`;stage.style.background=color;stage.style.color=target.heroExit?'#223e35':'#efede6';}
    }else if(target.hero!=null){
      const destination=target.hero;
      if(Math.abs(destination-before.hero)===1){const index=direction>0?destination-1:before.hero-1,key=['approach','orbit','garden-return'][index]+(direction<0?'-back':'')+'-'+(innerWidth<681?'m':'d');if(!await heroPlayer.play(key,id,{fadeMs:before.hero===0&&destination===1?2000:destination===0?2000:0,finalStill:destination===0?OPENING_LAST:null}))throw Error('Film endpoint unavailable');}
      else {const key=destination?['approach','orbit','garden-return'][destination-1]+'-'+(innerWidth<681?'m':'d'):null;await heroPlayer.show(key?manifest.films[key].last:OPENING_LAST,id);}
    }else if(target.cursor!=null){
      const next=ROUTE[target.cursor],old=before.technical;
      if(next.mode==='iso'&&old.mode==='iso'){
        if(Math.abs(next.floor-old.floor)===1){const level=Math.max(next.floor,old.floor),key=`level-${level}${next.floor<old.floor?'-back':''}-${innerWidth<681?'m':'d'}`;if(!await isoPlayer.play(key,id))throw Error('Floor film endpoint unavailable');}
        else await isoPlayer.show(manifest.floors[next.floor].iso,id);
      }else if(next.mode==='plan'){
        const unit=await preparePlan(manifest,next.floor,before.cameraByFloor[next.floor],dimensions);
        if(!state.current(id))return false;
        const surface=$('#plan-surface'),outgoing=surface.firstElementChild;
        // Reserve the complete reading layout before either surface appears.
        renderMeta({...before,cursor:target.cursor,technical:next},{surfaces:false,geometry:false});
        if(old.mode==='plan'&&outgoing){outgoing.classList.add('unit-outgoing');outgoing.setAttribute('inert','');surface.append(unit);fitPlan();state.phase(id,'playing');await Promise.all([animate(outgoing,[{transform:'translateX(0)',opacity:1},{transform:`translateX(${-direction*102}%)`,opacity:0}],1350),animate(unit,[{transform:`translateX(${direction*102}%)`,opacity:0},{transform:'translateX(0)',opacity:1}],1350)]);if(state.current(id))outgoing.remove();}
        else {surface.replaceChildren(unit);surface.hidden=false;fitPlan();await Promise.all([animate(surface,[{opacity:0},{opacity:1}],1200),animate($('.iso-surface'),[{opacity:1},{opacity:0}],1200)]);}
      }else {await isoPlayer.show(manifest.floors[next.floor].iso,id);$('.iso-surface').hidden=false;await animate($('.iso-surface'),[{opacity:0},{opacity:1}],1200);}
    }
    if(!state.current(id))return false;
    state.commit(id);failedScenes.delete(target.hero!=null||target.heroExit!=null?'hero':'technical');renderMeta();history.write();
    gestures.at(-1).finish=performance.now();gestures.at(-1).endY=scrollY;gestures.at(-1).elapsed=performance.now()-started;publishQA();
    if(gestures.length>120)gestures.shift();if(reversePending?.id===id){const next=reversePending;reversePending=null;queueMicrotask(()=>step(next.owner,next.direction,next.source));}return true;
  }catch(error){errors.push(String(error));if(state.current(id)){failedScenes.add(target.hero!=null||target.heroExit!=null?'hero':'technical');state.cancel();await paintCommitted().catch(()=>{});status('The last ready view remains available. Choose another view or continue down the page.');}return false;}
  finally{publishQA();}
}
function step(owner,dir,source){if(failedScenes.has(owner))return false;const s=state.snapshot(),property=owner==='hero'?'hero':'cursor';if(s.pending){if(s.pending.target.cursor!=null||s.pending.target.hero!=null||s.pending.target.heroExit!=null)transition({[property]:s[property]+dir},source,dir);return true;}if(owner==='hero'&&s.hero===3&&((dir>0&&!s.heroExit)||(dir<0&&s.heroExit))){transition({heroExit:dir>0,section:'hero'},source,dir);return true;}const maximum=owner==='hero'?3:7,target=s[property]+dir;if(target<0||target>maximum)return false;transition({[property]:target,section:owner==='hero'?'hero':'technical'},source,dir);return true;}
async function camera(id,force=false,source='camera'){
  const before=state.snapshot(),floor=before.technical.floor;if(before.technical.mode!=='plan'||before.overlay)return;
  if(!force&&!before.pending&&before.cameraByFloor[floor]===id)return;
  const cameras=[...before.cameraByFloor];cameras[floor]=id;const token=state.begin({cameraByFloor:cameras},source);abortPresentation();
  try{const unit=await preparePlan(manifest,floor,id,dimensions);if(!state.current(token))return;state.commit(token);$('#plan-surface').replaceChildren(unit);renderMeta();fitPlan();history.write();await animate(unit.querySelector(".plan-photo"),[{opacity:0},{opacity:1}],600);}catch{if(state.current(token)){state.cancel();status('This photograph could not load. Choose another viewpoint.');}}
}
async function navigate(hash,push=true){
  if(overlays?.isOpen){overlays.close(()=>navigate(hash,push));return;}
  const parsed=parseRoute(hash,manifest);const allowed=['hero','residence','rooms','garden','interiors','kitchens','chapters','plans','comfort','angora','gallery','opportunity','viewing'];
  const section=allowed.includes(parsed.section)?parsed.section:'residence';
  const nav=++navigationId;navigationActive=true;state.cancel();reversePending=null;abortPresentation();
  if(['chapters','plans'].includes(section)){
    const s=state.snapshot();let cursor=parsed.cursor;
    if(!hash.includes('floor=')&&s.section==='technical')cursor=cursorFor(section==='plans'?'plan':'iso',s.technical.floor);
    state.restore({section:'technical',cursor});if(parsed.camera)state.camera(parsed.floor,parsed.camera);await paintCommitted();
  }else state.local('navigate',{section});
  const node=section==='gallery'?$('.gallery-story'):$(['chapters','plans'].includes(section)?'#technical':'#'+section);node.scrollIntoView({behavior:initializing||reduced.matches?'instant':'smooth',block:'start'});
  history.write(push);input?.reset();
  if(initializing||reduced.matches){navigationActive=false;return;}
  await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;removeEventListener('scrollend',finish);clearTimeout(timer);resolve();};addEventListener('scrollend',finish,{once:true});const timer=setTimeout(finish,1400);});
  if(nav===navigationId){navigationActive=false;history.write();}
}
function openPlanPhoto(){const s=state.snapshot(),floor=s.technical.floor;if(s.technical.mode!=='plan')return;const collection=manifest.floors[floor].photos.map(p=>({key:p.key,title:`${FLOORS[floor]} · ${photoName(manifest,floor,p)} · Photograph ${p.number}`}));const index=manifest.floors[floor].photos.findIndex(p=>p.id===s.cameraByFloor[floor]);overlays.show({type:'photo',source:'plan',collection,index,key:collection[index].key,floor,camera:s.cameraByFloor[floor],cursor:s.cursor,section:s.section,y:scrollY});}
const curated=[['angora_02','Living','Garden living room'],['angora_09','Private','Attic sitting room'],['angora_15','Private','Attic bathroom'],['angora_17','Private','First-level bedroom'],['angora_22','Living','Entrance kitchen'],['angora_07','Private','Attic bedroom'],['pool-terrace','Outside','Pool & terrace'],['front','Outside','The street arrival']].map(([key,category,title])=>({key,category,title}));
function renderGallery(filter='All'){
  const current=state.snapshot().galleryPhoto,items=curated.filter(p=>filter==='All'||p.category===filter),track=$('#gallery-track');track.replaceChildren();
  items.forEach(item=>{const figure=document.createElement('figure');figure.className='gallery-card';figure.dataset.key=item.key;const b=document.createElement('button');b.setAttribute('aria-label',`Enlarge ${item.title}`);const img=new Image();img.src=photoURL(manifest,item.key,800);img.alt=item.title;img.loading='lazy';b.append(img);b.addEventListener('click',()=>overlays.show({type:'photo',source:'gallery',collection:items.map(p=>({key:p.key,title:p.title})),index:items.indexOf(item),key:item.key,filter,section:'gallery',y:scrollY}));figure.append(b);const caption=document.createElement('figcaption');caption.textContent=item.category;const title=document.createElement('strong');title.textContent=item.title;caption.append(title);figure.append(caption);track.append(figure);});
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.filter===filter));
  const selected=items.find(p=>p.key===current)||items[0];state.local('gallery-filter',{filter,galleryPhoto:selected?.key||null});rail?.refresh(selected?.key);
  const target=track.querySelector(`[data-key="${selected?.key}"]`);if(target&&innerWidth<1000)$('.gallery-window').scrollLeft=target.offsetLeft-track.offsetLeft;
}
function initializeHeader(){
  const header=$('#header'),surfaces=[...document.querySelectorAll('main>section,.gallery-story')];
  let queued=false;
  function paint(){queued=false;const probe=header.getBoundingClientRect().height*.5;
    const surface=surfaces.find(node=>{const r=node.getBoundingClientRect();return r.top<=probe&&r.bottom>probe;});
    const s=state.snapshot(),dark=surface?.matches('.kitchens,.angora,.opportunity,.viewing')||(surface?.id==='hero'&&s.hero===0&&!s.heroExit);
    header.dataset.ink=dark?'light':'dark';
  }
  const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(paint);}};
  header.classList.add('is-visible');addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);paintHeader=paint;paint();
  return schedule;
}
function opening(){
  const s=state.snapshot(),surface=$('.hero-film');
  if(s.section!=='hero'||s.hero!==0||scrollY>2)return;
  const id=s.requestId;surface.dataset.opening='playing';
  // Play the day-to-night opening once, without advancing the scroll chapter.
  const current=token=>state.snapshot().requestId===token&&state.snapshot().hero===0&&!state.snapshot().overlay;
  const player=new FilmSurface(surface,manifest,{current,phase:()=>{}});
  openingAbort=()=>player.cancel(true);
  player.play('opening',id).then(ready=>{
    if(current(id)){surface.dataset.opening=ready?'held':'fallback';openingAbort=null;}
  }).catch(error=>{errors.push(String(error));publishQA();});
}
async function initialize(){
  installLanguage();
  const initialHash=location.hash;
  manifest=await fetch('assets/web3/manifest.json?v=20261006-pin-5').then(r=>{if(!r.ok)throw Error('Manifest unavailable');return r.json();});
  for(const film of Object.values(manifest.films))for(const field of ['url','first','last'])film[field]+='?v=20261006-pin-5';
  for(const floor of manifest.floors)floor.iso+='?v=20261006-pin-5';
  manifest.films.opening={url:'assets/residence/films/opening/source.mp4',last:OPENING_LAST,seconds:5.056};
  state=createState(manifest.floors);state.subscribe((snapshot,type)=>{publishQA();if(type==='section')prepareNext(snapshot);if(type==='open'){abortPresentation();paintCommitted().catch(()=>{});}});heroPlayer=new FilmSurface($('.hero-film'),manifest,state);isoPlayer=new FilmSurface($('.iso-surface'),manifest,state);
  history=installHistory(state,async(saved,y,hash,isCurrent)=>{
    const nav=++navigationId;navigationActive=true;state.cancel();abortPresentation();let after=null;
    if(saved){const origin=saved.overlay;state.restore({...saved,overlay:null});if(saved.filter!==document.querySelector('[data-filter][aria-pressed="true"]')?.dataset.filter)renderGallery(saved.filter);await paintCommitted();if(!isCurrent())return;if(y!=null)scrollTo({top:y,behavior:'instant'});if(overlays.isOpen)after=overlays.finishClose();if(origin)overlays.show(origin,false);}
    else {if(overlays.isOpen)after=overlays.finishClose();await navigate(hash,false);}
    if(!isCurrent())return;if(nav===navigationId)navigationActive=false;return after;
  });
  overlays=installOverlays({state,manifest,history,onNavigate:navigate});
  const activity=initializeHeader();input=installInput({state,hero:$('#hero'),technical:$('#technical'),step,activity});
  document.querySelectorAll('.floor-tabs [data-floor]').forEach(b=>b.addEventListener('click',()=>{const s=state.snapshot(),cursor=cursorFor(s.technical.mode,+b.dataset.floor);transition({cursor,section:'technical'},'tab',cursor>=s.cursor?1:-1);}));
  $('.floor-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const s=state.snapshot(),floor=e.key==='Home'?0:e.key==='End'?3:(s.technical.floor+(e.key==='ArrowLeft'?3:1))%4;const b=$(`[data-floor="${floor}"]`);b.focus({preventScroll:true});b.click();});
  $('#mode-toggle').addEventListener('click',()=>{const s=state.snapshot();transition({cursor:cursorFor(s.technical.mode==='iso'?'plan':'iso',s.technical.floor),section:'technical'},'mode',1);});
  $('.camera-choices').addEventListener('click',e=>{const b=e.target.closest('[data-camera]');if(b)camera(+b.dataset.camera);});
  $('.camera-choices').addEventListener('scroll',e=>e.currentTarget.dataset.scrollLeft=Math.round(e.currentTarget.scrollLeft),{passive:true});
  $('#plan-surface').addEventListener('click',e=>{if(e.target.closest('[data-open-camera]'))openPlanPhoto();else{const room=e.target.closest('[data-room]');if(room){const s=state.snapshot(),photos=manifest.floors[s.technical.floor].photos.filter(p=>p.room===room.dataset.room),photo=photos.find(p=>p.id===s.cameraByFloor[s.technical.floor])||photos[0];if(photo)camera(photo.id,false,'room');else status('No registered photograph of this room is available.');return;}const pin=e.target.closest('.camera-pin');if(pin){if(pin.dataset.cluster){const ids=pin.dataset.cluster.split(',').map(Number),floor=state.snapshot().technical.floor;const numbers=manifest.floors[floor].photos.filter(p=>ids.includes(p.id)).map(p=>p.number);status('Nearby viewpoints: '+numbers.join(', ')+'. Choose a number below.');}else camera(+pin.dataset.camera);}}});
  $('#dimensions').addEventListener('change',e=>{dimensions=e.target.checked;$('#plan-surface .plan-unit')?.classList.toggle('dimensions-visible',dimensions);});
  document.querySelectorAll('[data-hero]').forEach(b=>b.addEventListener('click',()=>transition({hero:+b.dataset.hero,section:'hero'},'tab',+b.dataset.hero>=state.snapshot().hero?1:-1)));
  document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a||a.closest('dialog'))return;e.preventDefault();navigate(a.hash);});
  document.querySelectorAll('img[data-photo]').forEach(img=>{const p=manifest.photos[img.dataset.photo];if(!p)return;img.width=p.width;img.height=p.height;if(img.closest(".room-row,.kitchen-row"))img.style.aspectRatio=`${p.width} / ${p.height}`;img.src=photoURL(manifest,img.dataset.photo,1600);img.srcset=p.variants.map(v=>`${v.url} ${v.width}w`).join(',');img.sizes=img.closest('.room-row,.kitchen-row')?'(max-width:680px) 85vw, 30vw':img.closest('.opportunity-image,.garden-takeover')?'100vw':'(max-width:680px) 100vw, 55vw';});
  for(const item of curated){const floor=manifest.floors.find(f=>f.photos.some(p=>p.key===item.key));if(floor){const p=floor.photos.find(p=>p.key===item.key);item.title=`${FLOORS[floor.floor]} · ${photoName(manifest,floor.floor,p)}`;}}
  scenes=mountScenes();rail=installGalleryRail($('.gallery-window'),$('#gallery-track'),{onPhoto:key=>{if(!state.snapshot().overlay){state.local('gallery-position',{galleryPhoto:key});history.write();}}});renderGallery();
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{if(!overlays.isOpen){renderGallery(b.dataset.filter);history.write();}}));
  $('#gallery-prev').addEventListener('click',()=>rail.advance(-1));$('#gallery-next').addEventListener('click',()=>rail.advance(1));
  new ResizeObserver(()=>{fitPlan();}).observe($('#technical'));
  const visualHeight=()=>document.documentElement.style.setProperty('--visual-h',(visualViewport?.height||innerHeight)+'px');visualHeight();visualViewport?.addEventListener('resize',visualHeight);
  addEventListener('scroll',()=>{const p=state.snapshot().pending;if(p&&(p.target.cursor!=null||p.target.hero!=null||p.target.heroExit!=null)&&!navigationActive&&!input.owner()){state.cancel();reversePending=null;abortPresentation();paintCommitted().catch(()=>{});}},{passive:true});
  const freeze=()=>{state.cancel();reversePending=null;abortPresentation();heroPlayer.dropWarm();isoPlayer.dropWarm();paintCommitted().catch(()=>{});input.reset();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)freeze();else prepareNext(state.snapshot());});
  addEventListener('pagehide',freeze);addEventListener('pageshow',e=>{if(e.persisted){paintCommitted().catch(()=>{});input.reset();scenes.refresh();}});
  reduced.addEventListener('change',()=>{freeze();rail.refresh();});
  let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{fitPlan();scenes.refresh();rail.refresh();},180);});
  const observer=new IntersectionObserver(entries=>{
    if(initializing||navigationActive||state.snapshot().overlay||state.snapshot().pending)return;
    const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(visible){state.local('section',{section:visible.target.id});history.write();}
  },{rootMargin:'-25% 0px -45% 0px',threshold:[0,.2,.5]});document.querySelectorAll('main>section[id],.gallery-story>section[id]').forEach(s=>observer.observe(s));
  let wireLoaded=false;new IntersectionObserver(entries=>{if(entries[0].isIntersecting&&!wireLoaded){wireLoaded=true;import('./web3-wireframe.js?v=20261006-pin-5').then(m=>m.mountWireframe($('#wire-viewer'))).catch(error=>{errors.push(String(error));publishQA();});}},{rootMargin:'400px'}).observe($('#wire-viewer'));
  renderMeta();document.body.classList.add('is-enhanced');$('#hero').classList.add('is-enhanced');$('#technical').classList.add('is-enhanced');
  if(initialHash)await navigate(initialHash,false);else {state.local('initial',{section:'hero'});history.write();}
  initializing=false;prepareNext(state.snapshot());opening();publishQA();
  document.fonts.ready.then(()=>{scenes.refresh();rail.refresh(state.snapshot().galleryPhoto);});
  if(initialHash.includes('photo=')){const p=new URLSearchParams(initialHash.split('?')[1]);const s=state.snapshot();const item=manifest.floors[s.technical.floor].photos.find(v=>v.key===p.get('photo'));if(item){await camera(item.id);openPlanPhoto();}}
  Object.defineProperty(window,'WEB3_QA',{value:Object.freeze({snapshot:()=>state.snapshot(),log:()=>structuredClone(state.log),gestures:()=>structuredClone(gestures),errors:()=>[...errors],transitions:TRANSITIONS.map(v=>({...v})),manifestVersion:manifest.version}),writable:false});
}
initialize().catch(error=>{errors.push(String(error));qaNode.textContent=JSON.stringify({errors,initializationError:true});document.querySelectorAll('.opening-veil').forEach(n=>n.remove());document.body.classList.remove('is-enhanced');status('Animation is unavailable. The residence, photographs and property listing remain available.');});
