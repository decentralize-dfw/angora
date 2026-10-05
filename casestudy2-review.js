import { FLOWS } from './casestudy2-data.js';

const $ = id => document.getElementById(id);
const make = (tag, text, className) => { const node = document.createElement(tag); if (text != null) node.textContent = text; if (className) node.className = className; return node; };
const names = {era:'ERA Residence',likova:'Likova'};
const stamp = time => `${String(Math.floor(time / 60)).padStart(2,'0')}:${(time % 60).toFixed(2).padStart(5,'0')}`;
let active = null, selected = null, current = null;
const reference = $('reference-video');
const currentVideo = $('current-clip-video');
const all = Object.values(FLOWS).filter(f => f.project !== 'active').flatMap(flow => flow.scenes.map(scene => ({flow,scene})));
const match = ref => { const flow = FLOWS[ref.flow]; return {flow,scene:flow.scenes.find(s => s.key === ref.key)}; };
function showReference(flow, scene, rationale = null, focus = null) {
 reference.pause();
 const playbackScene=focus?{...scene,sourceStart:focus.sourceStart,sourceEnd:focus.sourceEnd,start:focus.sourceStart-flow.offset,end:focus.sourceEnd-flow.offset,duration:focus.sourceEnd-focus.sourceStart}:scene;
 selected = {flow,scene:playbackScene};
 $('reference-title').textContent = `${names[flow.project]} / ${flow.device === 'desktop' ? 'Desktop' : 'Mobil'} / ${String(scene.id).padStart(2,'0')} · ${scene.title}`;
 const sameDevice = flow.device === active.device;
 $('reference-reason').textContent = rationale || (sameDevice ? 'Serbest kütüphane seçimi. Bu klip, aktif sahneye özel bir uygulama önerisi olarak puanlanmadı.' : 'Farklı cihaz kaydı. Yalnız kompozisyon ilkesi karşılaştırılabilir; aktif cihazda aynı davranışın uygun olduğu varsayılmaz.');
 $('reference-open').href = `./casestudy2.html#${flow.id}-${scene.id}`;
 $('reference-boundary').textContent = focus
  ? `Öneri için odak: ${stamp(focus.sourceStart)}–${stamp(focus.sourceEnd)} · ${playbackScene.duration.toFixed(2)} sn. ${focus.note} Tam sahne: ${stamp(scene.sourceStart)}–${stamp(scene.sourceEnd)}; bağlantıdan açılabilir. Kaynak hızı korunur, bekleme bölümü bu karşılaştırmaya alınmaz.`
  : `Kaynak ${stamp(scene.sourceStart)}–${stamp(scene.sourceEnd)} · ${scene.duration.toFixed(2)} sn kayıt. Oynatma bu sahnenin sonunda durur. Süreler bağımsızdır; iki sitenin scroll hızları eşitlenmez.`;
 $('reference-status').textContent = 'Referans hazırlanıyor…';
 reference.poster = focus?`./assets/casestudy2/focus/${flow.id}-${scene.key}.jpg`:`./assets/casestudy2/${flow.project}/stills/${flow.device}-${scene.id}-0.jpg`;
 reference.src = flow.video; reference.load();
 $('recommendations').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ref === `${flow.id}:${scene.key}`)));
}
reference.addEventListener('loadedmetadata', () => { if (selected) reference.currentTime = selected.scene.start; reference.playbackRate = +$('reference-speed').value; });
reference.addEventListener('seeked', () => $('reference-status').textContent = '');
reference.addEventListener('loadeddata',()=>{if(!reference.seeking)$('reference-status').textContent='';});
reference.addEventListener('error', () => $('reference-status').textContent = 'Referans yüklenemedi.');
function keepInClip(player,scene,flow){
 if(player.seeking||player.readyState<1)return;
 const end=scene.end-1/flow.fps;
 if(player.currentTime<scene.start-1/flow.fps)player.currentTime=scene.start;
 if(player.currentTime>end+.0001||(!player.paused&&player.currentTime>=end)){
  player.pause();if(Math.abs(player.currentTime-end)>.0001)player.currentTime=end;
 }
}
reference.addEventListener('timeupdate', () => {
 if (!selected || reference.seeking) return;
 const {scene,flow} = selected;
 keepInClip(reference,scene,flow);
 $('reference-clock').textContent = `${stamp(Math.max(0,reference.currentTime-scene.start))} / ${stamp(scene.duration)}`;
});
reference.addEventListener('play', () => { if (selected && reference.currentTime >= selected.scene.end - 2 / selected.flow.fps) reference.currentTime = selected.scene.start; });
$('reference-restart').addEventListener('click', async () => { if (!selected || reference.readyState < 2) return; reference.currentTime = selected.scene.start; try { await reference.play(); } catch { $('reference-status').textContent = 'Oynat düğmesiyle yeniden deneyin.'; } });
$('reference-speed').addEventListener('change', () => reference.playbackRate = +$('reference-speed').value);
currentVideo.addEventListener('loadedmetadata',()=>{if(current)currentVideo.currentTime=current.scene.start;});
currentVideo.addEventListener('seeked',()=>$('current-clip-status').textContent='');
currentVideo.addEventListener('loadeddata',()=>{if(!currentVideo.seeking)$('current-clip-status').textContent='';});
currentVideo.addEventListener('error',()=>$('current-clip-status').textContent='Angora klibi yüklenemedi.');
currentVideo.addEventListener('timeupdate',()=>{if(current)keepInClip(currentVideo,current.scene,current.flow);});
currentVideo.addEventListener('play',()=>{if(current&&currentVideo.currentTime>=current.scene.end-2/current.flow.fps)currentVideo.currentTime=current.scene.start;});
$('current-restart').addEventListener('click',async()=>{if(!current||currentVideo.readyState<2)return;currentVideo.currentTime=current.scene.start;try{await currentVideo.play();}catch{$('current-clip-status').textContent='Oynatma başlayamadı.';}});
function bindTransport(prefix,player,getClip){
 const go=time=>{const clip=getClip();if(!clip||player.readyState<1)return;player.pause();player.currentTime=Math.max(clip.scene.start,Math.min(clip.scene.end-1/clip.flow.fps,time));};
 const toggle=async()=>{if(player.readyState<2)return;if(!player.paused)player.pause();else try{await player.play();}catch{$(prefix==='current'?'current-clip-status':'reference-status').textContent='Oynatma başlayamadı.';}};
 $(prefix+'-play').addEventListener('click',toggle);player.addEventListener('click',toggle);
 $(prefix+'-scrub').addEventListener('input',()=>{const clip=getClip();if(clip)go(clip.scene.start+clip.scene.duration*+$(prefix+'-scrub').value/1000);});
 $(prefix+'-frame-back').addEventListener('click',()=>{const clip=getClip();if(clip)go(player.currentTime-1/clip.flow.fps);});
 $(prefix+'-frame-forward').addEventListener('click',()=>{const clip=getClip();if(clip)go(player.currentTime+1/clip.flow.fps);});
}
bindTransport('current',currentVideo,()=>current);bindTransport('reference',reference,()=>selected);
function clipTick(){
 for(const [prefix,player,clip] of [['current',currentVideo,current],['reference',reference,selected]]){
  if(!clip)continue;
  keepInClip(player,clip.scene,clip.flow);
  const relative=Math.max(0,Math.min(clip.scene.duration,player.currentTime-clip.scene.start));
  $(prefix+'-scrub').value=String(relative/clip.scene.duration*1000);
  $(prefix+'-scrub').step=String(1000/(clip.scene.duration*clip.flow.fps));
  $(prefix+'-clock').textContent=`${stamp(relative)} / ${stamp(clip.scene.duration)}`;
  $(prefix+'-play').textContent=player.paused?'Oynat ▷':'Duraklat Ⅱ';
  $(prefix+'-play').setAttribute('aria-label',`${prefix==='current'?'Angora':'Referans'} klibini ${player.paused?'oynat':'duraklat'}`);
  $(prefix+'-play').disabled=player.readyState<2;
 }
 requestAnimationFrame(clipTick);
}
clipTick();
function library() {
 if (!active) return;
 const query = $('reference-search').value.toLocaleLowerCase('tr');
 const sorted = [...all].sort((a,b) => Number(b.flow.device === active.device)-Number(a.flow.device === active.device));
 $('reference-library').replaceChildren(...sorted.filter(({flow,scene}) => `${names[flow.project]} ${flow.device} ${scene.title} ${scene.family}`.toLocaleLowerCase('tr').includes(query)).map(({flow,scene}) => {
  const button = make('button'); button.dataset.libraryRef = `${flow.id}:${scene.key}`;
  const recommendations = Object.values(FLOWS).filter(f => f.project === 'active').flatMap(f => f.scenes.flatMap(s => s.review.references.map(r => ({r,s,f}))));
  const usage = recommendations.filter(({r}) => r.flow === flow.id && r.key === scene.key);
  const excluded={identity:'Yükleme başlangıcı Angora kaydında yok; bu klipten yeni preloader sonucu çıkarılmadı.',cookie:'Angora kaydında cookie etkileşimi yok; ana scroll geçişi olarak kullanılmadı.',menu:'Angora kaydında menü açılışı yok; görülmeyen etkileşime puan verilmedi.','page-change':'Angora kaydı tek landing akışı; sayfa değişimini bölüm geçişine zorlamak uygun değil.','similar':'Benzer daire listesi Angora’nın tek villa anlatısına uymuyor.','return-list':'Angora kaydında çoklu konut listesi yok.','team':'Ajans/ekip kartları villa mekân anlatısına aynı görevle bağlanmıyor.','materials':'Angora’da ayrışan 3D malzeme parçaları yok; fotoğraflara bu efekti dayatmak içeriği değiştirecek.'};
  button.append(make('b',`${names[flow.project]} · ${flow.device === 'desktop'?'Desktop':'Mobil'} · ${scene.id}`),make('span',scene.title),make('small',usage.length ? `${usage.length} aktif klipte seçildi · ${[...new Set(usage.map(u => u.s.family))].join(', ')}` : `Doğrudan seçilmedi: ${excluded[scene.key] || 'Bu sahnenin özel kompozisyonu için bir eşleşme zorlanmadı. Tasarım ilkesi: '+scene.lesson}`));
  button.addEventListener('click', () => { showReference(flow,scene); $('comparison').scrollIntoView({block:'start',behavior:'instant'}); }); return button;
 }));
}
$('reference-search').addEventListener('input',library);
export function renderReview(flow, scene, seek) {
 reference.pause(); currentVideo.pause(); active = flow;
 const review = scene.review;
 $('active-review').hidden = !review;
 $('details-link').textContent = review ? `Karar: ${review.verdict} · ${review.score.toFixed(1)}/10 ↓` : 'Sahnenin breakdown’ı ↓';
 if (!review) { reference.removeAttribute('src'); reference.load(); currentVideo.removeAttribute('src'); currentVideo.load(); selected = null; current = null; return; }
 current={flow,scene};$('current-clip-title').textContent=scene.title;
 $('current-clip-status').textContent='Angora klibi hazırlanıyor…';
 currentVideo.poster=`./assets/casestudy2/active/stills/${flow.device}-${scene.id}-0.jpg`;
 currentVideo.src=flow.video;currentVideo.load();
 $('review-verdict').textContent = `${review.verdict} · ${review.score.toFixed(1)} / 10`;
 $('review-verdict').dataset.verdict = review.verdict;
 $('review-scores').replaceChildren(...review.scores.map((score,i) => {
  const block = make('div'); block.append(make('span',['Devamlılık','Kadraj','Okuma'][i]),make('b',`${score} / 10`)); return block;
 }));
 $('review-observation').textContent = review.observation;
 $('review-action').textContent = review.action;
 $('review-avoid').textContent = `Sınır: ${review.avoid}`;
 $('review-evidence').replaceChildren(...scene.phases.map(([fraction,title,note]) => {
  const button = make('button',`${stamp(scene.sourceStart + scene.duration * fraction)} · ${title}`);
  button.title = note; button.addEventListener('click', () => { window.scrollTo({top:0,behavior:'instant'}); seek(scene.start + scene.duration * fraction); }); return button;
 }));
 $('recommendations').replaceChildren(...review.references.map((ref,i) => {
  const {flow:rf,scene:rs} = match(ref), card = make('article'), button = make('button', 'Gerçek klibi karşılaştır ▷');
  card.append(make('span',`${String(i+1).padStart(2,'0')} / ${names[rf.project]} · ${rf.device === 'desktop'?'Desktop':'Mobil'} · ${rs.id}`, 'eyebrow'),make('h4',rs.title),make('p',ref.reason));
  if(ref.focus)card.append(make('p',`Odak aralığı ${stamp(ref.focus.sourceStart)}–${stamp(ref.focus.sourceEnd)} · tam sahne ayrıca açık.`, 'review-scope'));
  button.dataset.ref = `${rf.id}:${rs.key}`; button.addEventListener('click', () => {showReference(rf,rs,ref.reason,ref.focus);$('comparison').scrollIntoView({block:'start',behavior:'instant'});}); card.append(button); return card;
 }));
 library();
 if (review.references.length) { const first = review.references[0], r = match(first); showReference(r.flow,r.scene,first.reason,first.focus); }
}
