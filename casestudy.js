import * as ERA from './motion-catalog.js';
import * as LIKOVA from './likova-motion-catalog.js';
import {mountMotion as mountEra} from './motion-library.js';
import {mountMotion as mountLikova} from './likova-motion-library.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let project='era',MOTIONS=ERA.MOTIONS,STORY=ERA.STORY,SOURCE=ERA.SOURCE;
let selected=1,source='reference',filter='all',mounted=null,playing=false,p=0,last=0,speed=1;
const projectSelection={era:1,likova:1};
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
function switchView(view){
 for(const id of ['library','story','direction','diagnosis'])$(`#${id}-view`).hidden=id!==view;
 $$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
 if(view!=='library')pause();
}
function renderList(){
 const term=$('#motion-search').value.toLocaleLowerCase('tr-TR').trim(),list=$('#motion-list'),scroll=list.scrollTop;list.replaceChildren();
 const matches=MOTIONS.filter(m=>(filter==='all'||m.group===filter)&&`${m.title} ${m.location} ${m.description} ${m.kind}`.toLocaleLowerCase('tr-TR').includes(term));
 matches.forEach(m=>{const b=document.createElement('button');b.className='motion-item';b.dataset.motion=m.id;b.setAttribute('aria-current',String(m.id===selected));const n=document.createElement('span');n.textContent=String(m.id).padStart(2,'0');const text=document.createElement('div');const title=document.createElement('b');title.textContent=m.title;const group=document.createElement('small');group.textContent=m.group;text.append(title,group);b.append(n,text);list.append(b);});
 if(!matches.length){const empty=document.createElement('p');empty.className='catalog-empty';empty.textContent='Bu aramayla eşleşen hareket yok.';list.append(empty);}
 list.scrollTop=scroll;
}
function currentHash(){return project==='era'?`#motion-${selected}`:`#likova-motion-${selected}`;}
function setProject(name,{hash=true}={}){
 if(!['era','likova'].includes(name))return;
 projectSelection[project]=selected;project=name;
 ({MOTIONS,STORY,SOURCE}=project==='era'?ERA:LIKOVA);
 selected=projectSelection[project];filter='all';$('#motion-search').value='';
 $$('[data-project]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.project===project)));
 $$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter==='all')));
 $('#project-title').textContent=project==='era'?'ERA RESIDENCE → ANGORA':'LIKOVA → ANGORA';
 $('.reference-link').href=SOURCE.page;$('#catalog-count').textContent=`${MOTIONS.length} seçilebilir deney`;
 $('#reference-source').textContent=project==='era'?'ERA materyali':'Likova materyali';
 $('#library-download').href=project==='era'?'./motion-library.js':'./likova-motion-library.js';
 $('#catalog-download').href=project==='era'?'./motion-catalog.js':'./likova-motion-catalog.js';
 $('#catalog-download').textContent=`${MOTIONS.length} hareketin kataloğunu indir ↙`;
 $('#era-coverage').hidden=project!=='era';$('#likova-coverage').hidden=project!=='likova';
 $('#motion-list').scrollTop=0;renderList();renderStory();select(selected,{hash});
}
function setProgress(value){p=Math.max(0,Math.min(1,value));mounted?.setProgress(p);$('#scrub').value=Math.round(p*1000);$('#progress-value').value=`${Math.round(p*100)}%`;}
function pause(){playing=false;$('#play').textContent='Oynat ▷';$('#play').setAttribute('aria-label','Animasyonu oynat');}
function play(){if(p>=.995)setProgress(0);playing=true;last=performance.now();$('#play').textContent='Duraklat Ⅱ';$('#play').setAttribute('aria-label','Animasyonu duraklat');}
function select(id,{hash=true}={}){
 const item=MOTIONS.find(m=>m.id===Number(id));if(!item)return;
 pause();selected=item.id;mounted?.destroy();$('#stage-error').hidden=true;
 $('#case-number').textContent=String(item.id).padStart(2,'0');$('#case-title').textContent=item.title;$('#case-group').textContent=item.group;$('#case-location').textContent=item.location;$('#case-count').textContent=`${String(item.id).padStart(2,'0')} / ${MOTIONS.length}`;
 $('#case-description').textContent=item.description;$('#case-angora').textContent=item.angora;$('#case-parameters').textContent=item.parameters;$('#case-evidence').textContent=`${item.evidence} ↗`;
 const css=item.evidence.startsWith('CSS');$('#case-evidence').href=project==='era'?(css?SOURCE.page:SOURCE.motion):(css?(item.evidence.includes('preloader')||item.evidence.includes('animation--text')||item.evidence.includes('btn')||item.evidence.includes('cookie')||item.evidence.includes('modal--side')?SOURCE.globalCss:SOURCE.css):item.evidence.startsWith('22.js')?SOURCE.webgl:item.evidence.startsWith('DOM')?SOURCE.page:item.evidence.includes('landing.js')||item.evidence.includes('preloaderLanding')?SOURCE.landing:SOURCE.motion);
 const special=['flower','video','clouds','route','arch-loader'].includes(item.kind);
 const actualSource=source==='reference'?project:'angora';
 $('#material-label').textContent=source==='reference'?`${project==='era'?'ERA':'Likova'} referans materyali · izole hareket demosu`:project==='era'&&special?'Angora zemin / özel öğe ERA referans materyali':project==='likova'&&['maps','diagram','video','plan-video'].includes(item.kind)?'Angora zemin / özel öğe Likova referans materyali':'Angora özgün fotoğrafları · hareket uyarlaması';
 if(project==='likova'&&item.kind==='camera-path')$('#material-label').textContent='Kamera yolu şeması · kaynakta gerçek 3D model / iki eğri';
 if(source==='angora'&&item.kind==='crossfade')$('#material-label').textContent='Angora: iki ayrı gerçek görünüm · gündüz/gece eşleşmesi değildir';
 $('#case-code').textContent=`import { mountMotion } from './${project==='era'?'motion':'likova-motion'}-library.js';\n\nconst motion = mountMotion(stage, {\n  id: ${item.id}, // ${item.kind}\n  source: '${actualSource}'\n});\n\n// ScrollTrigger, bir range veya kayıtlı bir timeline ile bağla.\nmotion.setProgress(0.5); // 0–1: ileri ve geri seek\n// Görünüm değiştiğinde:\nmotion.destroy();\n\n// Referansta doğrulanan parametreler:\n// ${item.parameters}\n// ${item.evidence}`;
 try{mounted=(project==='era'?mountEra:mountLikova)($('#motion-stage'),{id:item.id,source:actualSource});setProgress(reduced?.65:0);}catch(error){$('#stage-error').hidden=false;$('#stage-error').textContent=`Bu örnek açılamadı: ${error.message}`;mounted=null;}
 $$('[data-motion]').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.motion)===selected)));
 projectSelection[project]=selected;if(hash)history.replaceState(null,'',currentHash());
 document.title=`${String(item.id).padStart(2,'0')} · ${item.title} — ${project==='era'?'ERA':'Likova'} → Angora`;
 $('.catalog').classList.remove('is-open');$('#catalog-toggle').setAttribute('aria-expanded','false');$('#catalog-toggle').textContent='Listeyi aç ＋';
 // A choice always presents the full stage. Keep the independently scrolled list.
 window.scrollTo({top:0,behavior:'instant'});
}
document.addEventListener('click',e=>{
 if(e.target.closest('.study-brand')){e.preventDefault();switchView('library');select(1);}
 const projectButton=e.target.closest('[data-project]');if(projectButton){setProject(projectButton.dataset.project);switchView('library');}
 const m=e.target.closest('[data-motion],[data-open-case]');if(m){if(m.dataset.projectCase&&m.dataset.projectCase!==project)setProject(m.dataset.projectCase,{hash:false});switchView('library');select(m.dataset.motion||m.dataset.openCase);if(m.hasAttribute('data-open-case'))window.scrollTo({top:0,behavior:'instant'});}
 const v=e.target.closest('[data-view]');if(v){switchView(v.dataset.view);history.replaceState(null,'',v.dataset.view==='library'?currentHash():`#${project}-${v.dataset.view}`);}
 const f=e.target.closest('[data-filter]');if(f){filter=f.dataset.filter;$$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===f)));renderList();}
 const s=e.target.closest('[data-source]');if(s){source=s.dataset.source;$$('[data-source]').forEach(b=>b.setAttribute('aria-pressed',String(b===s)));const keep=p;select(selected);setProgress(keep);}
});
$('#motion-search').addEventListener('input',renderList);
$('#details-link').addEventListener('click',e=>{e.preventDefault();$('#case-details').scrollIntoView({behavior:'smooth',block:'start'});});
$('#catalog-toggle').addEventListener('click',()=>{const open=$('.catalog').classList.toggle('is-open');$('#catalog-toggle').setAttribute('aria-expanded',String(open));$('#catalog-toggle').textContent=open?'Listeyi kapat −':'Listeyi aç ＋';});
$('#previous-case').addEventListener('click',()=>select(selected===1?MOTIONS.length:selected-1));$('#next-case').addEventListener('click',()=>select(selected===MOTIONS.length?1:selected+1));
$('#play').addEventListener('click',()=>playing?pause():play());$('#restart').addEventListener('click',()=>{pause();setProgress(0);});
$('#scrub').addEventListener('input',()=>{pause();setProgress(Number($('#scrub').value)/1000);window.scrollTo({top:0,behavior:'instant'});});$('#speed').addEventListener('change',()=>speed=Number($('#speed').value));
$('#motion-stage').addEventListener('wheel',e=>{if(!document.fullscreenElement&&((e.deltaY>0&&p>=.999)||(e.deltaY<0&&p<=.001)))return;e.preventDefault();pause();setProgress(p+e.deltaY/1600);},{passive:false});
let touch=null;$('#motion-stage').addEventListener('touchstart',e=>{touch=e.touches[0]?.clientY;},{passive:true});$('#motion-stage').addEventListener('touchmove',e=>{if(touch===null)return;const y=e.touches[0].clientY;pause();setProgress(p+(touch-y)/650);touch=y;},{passive:true});$('#motion-stage').addEventListener('touchend',()=>touch=null,{passive:true});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#stage-shell').requestFullscreen();}catch{$('#material-label').textContent='Tam ekran bu tarayıcıda desteklenmiyor; sahne normal görünümde açık.';}});
document.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if($('#library-view').hidden)return;if(e.key==='ArrowRight'){e.preventDefault();select(selected===MOTIONS.length?1:selected+1);}else if(e.key==='ArrowLeft'){e.preventDefault();select(selected===1?MOTIONS.length:selected-1);}else if(e.key===' '){e.preventDefault();playing?pause():play();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function tick(now){if(playing){const elapsed=Math.min(.1,(now-last)/1000);setProgress(p+elapsed*speed/(mounted?.motion.duration||5));if(p>=1)pause();}last=now;requestAnimationFrame(tick);}requestAnimationFrame(tick);
function renderStory(){
 $('#story-map').replaceChildren();
 STORY.forEach((chapter,index)=>{const row=document.createElement('article');row.className='story-row';const number=document.createElement('span');number.textContent=String(index+1).padStart(2,'0');const title=document.createElement('h3');title.textContent=chapter.title;const cases=document.createElement('div');cases.className='story-cases';chapter.cases.forEach(id=>{const item=MOTIONS.find(m=>m.id===id);const b=document.createElement('button');b.dataset.openCase=id;b.textContent=String(id).padStart(2,'0');b.title=item.title;b.setAttribute('aria-label',`${id}: ${item.title}`);cases.append(b);});row.append(number,title,cases);$('#story-map').append(row);});
}
$('#export-json').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({source:SOURCE,motions:MOTIONS,story:STORY},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${project}-angora-motion-catalog.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
function applyHash(){const match=location.hash.match(/^#(?:(era|likova)-)?motion-(\d+)$/);if(match){setProject(match[1]||'era',{hash:false});switchView('library');select(Number(match[2]),{hash:false});}else{const view=location.hash.match(/^#(?:(era|likova)-)?(story|direction|diagnosis)$/);if(view){setProject(view[1]||'era',{hash:false});switchView(view[2]);}}}
setProject('era',{hash:false});applyHash();window.addEventListener('hashchange',applyHash);
