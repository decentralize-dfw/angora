import {MEDIA,MOTIONS} from './motion-catalog.js';
export const SUPPORTED_KINDS=new Set(MOTIONS.map(m=>m.kind));
const full='inset(0% 0% 0% 0%)';
const open='polygon(0% 0%,100% 0%,100% 100%,0% 100%)';
const closed='polygon(100% 0%,100% 0%,101% 100%,125% 100%)';
const local={hero:'27',night:'25',terrace:'53',garden:'36',alpha:'38',arch:'38',interior:'21',aerial:'24',footer:'25'};
// The reference's cubic Bezier curves, evaluated without another runtime.
function bezier(x1,y1,x2,y2){return x=>{if(x<=0)return 0;if(x>=1)return 1;const at=(t,a,b)=>3*(1-t)*(1-t)*t*a+3*(1-t)*t*t*b+t*t*t;let lo=0,hi=1,t=x;for(let i=0;i<16;i++){const value=at(t,x1,x2);if(value<x)lo=t;else hi=t;t=(lo+hi)/2;}return at(t,y1,y2);};}
function media(key,source){return source==='angora'&&local[key]?`./assets/residence/photo-${local[key]}.jpg`:MEDIA[key];}
export function mountMotion(stage,{id=1,source='era'}={}){
 const motion=MOTIONS.find(m=>m.id===Number(id));if(!motion)throw new Error('Unknown motion');
 const g=window.gsap;if(!g)throw new Error('GSAP unavailable');
 stage.replaceChildren();stage.dataset.kind=motion.kind;stage.dataset.source=source;
 g.registerEase('eraInOut',bezier(.75,0,.25,1));g.registerEase('eraOut',bezier(.25,1,.5,1));g.registerEase('eraIn',bezier(.5,0,.75,0));g.registerEase('eraEase',bezier(.25,.1,.25,1));g.registerEase('eraHorizontal',bezier(.25,0,.75,1));g.registerEase('eraDive',bezier(.6,0,0,1));
 const timeline=g.timeline({paused:true,defaults:{duration:1,ease:'eraInOut'}});
 const cleanup=[];
 function el(tag,cls,text,parent=stage){const e=document.createElement(tag);e.className=cls;if(text!==undefined)e.textContent=text;parent.append(e);return e;}
 function picture(cls='lab-photo',key='hero',parent=stage){const box=el('div',cls,undefined,parent);const image=el('img','',undefined,box);image.src=media(key,source);image.alt=source==='era'?`ERA reference · ${key}`:`Angora original photograph · ${key}`;image.draggable=false;return{box,image};}
 function title(text='A quieter rhythm.',cls='lab-title',parent=stage){return el('div',cls,text,parent);}
 function chars(text,parent){const wrap=el('div','lab-letters',undefined,parent);for(const ch of text){el('span','char',ch===' '?'\u00a0':ch,wrap);}return[...wrap.children];}
 function plant(cls='lab-plant',parent=stage){const v=el('video',cls,undefined,parent);v.src=MEDIA.flower;v.muted=true;v.loop=true;v.playsInline=true;v.autoplay=!matchMedia('(prefers-reduced-motion:reduce)').matches;v.play().catch(()=>{});cleanup.push(()=>{v.pause();v.removeAttribute('src');v.load();});return v;}
 function card(cls='lab-card',text='A room of your own',parent=stage){const c=el('div',cls,undefined,parent);el('small','', 'ANGORA · PRIVATE RESIDENCE',c);title(text,'card-title',c);el('p','','The photograph, the place and the story belong together.',c);return c;}
 function framePair(mode){
   const back=picture('arch-back','arch');const pair=el('div','arch-pair');
   picture('duo-img duo-left','arch',pair);picture('duo-img duo-right','terrace',pair);
   const l=el('div','mask-panel mask-left',undefined,pair),r=el('div','mask-panel mask-right',undefined,pair);
   const lp0='polygon(0% 0%,0% 100%,44.444% 100%,44.444% 36.111%,98.889% 36.111%,98.889% 99.074%,44.444% 99.074%,1.111% 100%,100% 100%,100% 0%)';
   const rp0='polygon(0% 0%,0% 100%,1.111% 100%,1.111% .926%,55.556% .926%,55.556% 63.889%,1.111% 63.889%,1.111% 100%,100% 100%,100% 0%)';
   const lp1='polygon(0% 0%,0% 100%,44.444% 100%,44.444% 18.519%,98.889% 18.519%,98.889% 81.481%,44.444% 81.481%,1.111% 100%,100% 100%,100% 0%)';
   const rp1='polygon(0% 0%,0% 100%,1.111% 100%,1.111% 18.519%,55.556% 18.519%,55.556% 81.481%,1.111% 81.481%,1.111% 100%,100% 100%,100% 0%)';
   const lp2=lp1.replaceAll('98.889%','100%'),rp2=rp1.replaceAll('1.111%','0%');
   g.set(back.box,{scale:.75});
   if(mode==='align-windows'||mode==='arch-dive')timeline.fromTo(l,{clipPath:lp0},{clipPath:lp1,duration:.5,ease:'none'},0).fromTo(r,{clipPath:rp0},{clipPath:rp1,duration:.5,ease:'none'},0);
   else g.set(l,{clipPath:lp1}),g.set(r,{clipPath:rp1});
   if(mode!=='align-windows'){const at=mode==='arch-dive'?.5:0;timeline.to(l,{clipPath:lp2,duration:.1,ease:'none'},at).to(r,{clipPath:rp2,duration:.1,ease:'none'},at);}
   if(mode==='arch-dive'){
    const pl=plant('lab-plant plant-left',pair),pr=plant('lab-plant plant-right',pair);
    timeline.to(pair,{scale:1.84,duration:.4},.6).to([pl,pr],{scale:1.84,xPercent:i=>i?50:-50,duration:.4},.6).to(back.box,{scale:1,duration:.4},.6).to(pair,{opacity:0,duration:.12},.9);
   }
   title(mode==='arch-dive'?'Two views. One passage.':'Find the shared horizon.','arch-note');
 }
 const kind=motion.kind;
 switch(kind){
 case 'arch-loader':{
  picture();const cover=el('div','loader-cover');cover.style.setProperty('--mask-url',`url("${MEDIA.archMask}")`);title('ANGORA','loader-word',cover);
  const bg=stage.querySelector('.lab-photo');g.set(bg,{scale:.75});
  timeline.fromTo(cover,{'--arch-w':'24%','--arch-y':'104%'},{'--arch-w':'36%','--arch-y':'15%',duration:.5}).to(cover,{'--arch-w':'125%','--arch-y':'-100%',duration:.7,ease:'eraDive'},.45).to(bg,{scale:1,duration:.5},.45);break;
 }
 case 'loader':{title('A place to begin.');const track=el('div','loading-line');const ink=el('i','',undefined,track);timeline.fromTo(ink,{scaleY:0},{scaleY:1,duration:2,ease:'power2.inOut'}).to(stage.querySelector('.lab-title'),{opacity:0,y:-30},1.8);break;}
 case 'hero':{const p=picture('hero-demo','hero');const h=title('A private world.','hero-demo-title');timeline.to(h,{yPercent:-180,opacity:0,duration:.6,ease:'eraEase'},0).to(p.box,{yPercent:-20,duration:.6,ease:'eraEase'},0).to(p.image,{scale:2,transformOrigin:'50% 75%',duration:.6,ease:'eraIn'},.4);break;}
 case 'crossfade':{picture('lab-photo','hero');const p=picture('lab-photo','night');title(source==='era'?'Day / night':'Two original views','image-label');timeline.fromTo(p.box,{opacity:0},{opacity:1});break;}
 case 'pulse':case 'pin-hover':{
  picture();const pin=el('div','demo-pin');const rings=[el('i','ring',undefined,pin),el('i','ring',undefined,pin)];const dot=el('b','dot',undefined,pin),plus=el('span','plus','+',pin);
  if(kind==='pulse')timeline.fromTo(rings,{scale:1,opacity:1},{scale:1.6,opacity:0,stagger:.2,ease:'power2.in',duration:1});
  else timeline.to(dot,{scale:5.33},0).fromTo(plus,{scale:0,rotation:45},{scale:1,rotation:225},0);break;
 }
 case 'tooltip':{picture();const pin=el('div','demo-pin');el('b','dot',undefined,pin);const c=card('tip-demo','A camera point');timeline.fromTo(c,{scale:.75,opacity:0,x:40},{scale:1,opacity:1,x:0});const move=e=>{const r=stage.getBoundingClientRect();g.to(c,{x:Math.min(r.width*.2,e.clientX-r.left-r.width*.45),y:(e.clientY-r.top-r.height*.5)*.35,duration:1.2,ease:'power3.out'});};stage.addEventListener('pointermove',move);cleanup.push(()=>stage.removeEventListener('pointermove',move));break;}
 case 'word-space':{const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 1000 600');svg.classList.add('word-arch');svg.innerHTML='<defs><path id="case-curve" d="M 80,510 A 425,425 0 0,1 920,510"/></defs><text><textPath href="#case-curve" startOffset="50%" text-anchor="middle">A HOME · A GARDEN · A WHOLE LIFE</textPath></text>';stage.append(svg);const text=svg.querySelector('text');timeline.fromTo(text,{wordSpacing:'0px'},{wordSpacing:'40px',ease:'none'});break;}
 case 'slider':case 'property-slider':case 'tabs':{
  const old=picture('slide-old','hero'),fresh=picture('slide-new','terrace');const c=card('slide-card',kind==='property-slider'?'Room to live.':'The next chapter.');const label=el('div','slide-counter','01 / 03');
  timeline.fromTo(fresh.box,{clipPath:closed},{clipPath:open,duration:1.2},0).fromTo(fresh.image,{scale:1.5,xPercent:25},{scale:1,xPercent:0,duration:1.2},0).to(old.image,{xPercent:-25,scale:1.5,duration:1.2},0).fromTo(c,{opacity:0,y:30},{opacity:1,y:0,duration:.5},.8).to(label,{textContent:'02 / 03',duration:.01},.8);break;
 }
 case 'diagonal':{const p=picture();timeline.fromTo(p.box,{clipPath:closed},{clipPath:open,duration:1.2}).fromTo(p.image,{scale:1.5,xPercent:25},{scale:1,xPercent:0,duration:1.2},0);break;}
 case 'alpha':{el('div','alpha-blue');title('Edges belong to the place.','alpha-copy');const p=picture('alpha-image','alpha');if(source==='angora')el('div','alpha-notice','Bu Angora fotoğrafı alpha değildir. Siluet etkisi için hazırlanmış materyal gerekir.');timeline.fromTo(p.image,{yPercent:0},{yPercent:20,ease:'none'});break;}
 case 'concept':{const c=card('concept-card','Inside the setting.');picture('concept-photo','terrace',c);timeline.fromTo(c,{scale:.75,opacity:0},{scale:1,opacity:1,ease:'none'});break;}
 case 'horizontal':{
  const rail=el('div','horizontal-rail');for(const [i,key]of['hero','terrace','aerial'].entries()){const panel=el('div','rail-panel',undefined,rail);picture('rail-photo',key,panel);title(['The home.','The setting.','The wider world.'][i],'rail-title',panel);}
  timeline.to(rail,{xPercent:-66.6667,duration:2,ease:'none'});break;
 }
 case 'title-drift':{picture('small-side-photo','terrace');const lines=['A HOME','A GARDEN','A WHOLE LIFE'].map(t=>title(t,'drift-line'));timeline.fromTo(lines,{xPercent:g.utils.wrap([-5,25,-15])},{xPercent:g.utils.wrap([5,-25,25]),ease:'none'},0);break;}
 case 'flower':case 'video':{picture();const v=plant();timeline.fromTo(v,{xPercent:0,yPercent:0},{xPercent:-25,yPercent:kind==='video'?0:25,ease:'none'});el('small','video-note',kind==='video'?'Şeffaf WebM · görünür sahnede oynar':'Ön plan video · arka plandan bağımsız hız');break;}
 case 'route':{const p=picture('route-image','route');el('div','route-note','Konum şeması · soldan sağa reveal');timeline.fromTo(p.box,{clipPath:'inset(0% 100% 0% 0%)'},{clipPath:full,duration:2.4,ease:'power2.out'});break;}
 case 'clouds':{picture('lab-photo','aerial');const clouds=[0,1,2].map(i=>{const box=el('div',`cloud-band cloud-${i}`);for(let j=0;j<3;j++){const img=el('img','',undefined,box);img.src=MEDIA.cloud;img.alt='ERA alpha cloud layer';}return box;});timeline.fromTo(clouds,{xPercent:-20},{xPercent:10,ease:'none',duration:2});break;}
 case 'aerial':{const p=picture('lab-photo','aerial');timeline.fromTo(p.image,{scale:1.15,transformOrigin:'center bottom'},{scale:1,ease:'none'});break;}
 case 'highlight':{const list=el('div','tab-demo-list');['The garden','The entrance','The first floor','The attic'].forEach(t=>el('div','',t,list));const hl=el('i','tab-highlight',undefined,list);timeline.to(hl,{yPercent:200,height:'25%',duration:1});picture('tab-demo-photo','terrace');break;}
 case 'amen-exit':{const p=picture();const h=card('overlay-info','Everyday comforts.');timeline.to(p.box,{scale:2,ease:'power2.in'},0).to(h,{opacity:0,ease:'power2.in'},0);break;}
 case 'arch-overlap':{picture();const arch=el('div','overlap-arch');title('The next rhythm.','overlap-title',arch);timeline.fromTo(arch,{yPercent:100},{yPercent:0,duration:1.4,ease:'none'});break;}
 case 'opposing':{const l=picture('opposed-left','garden'),r=picture('opposed-right','terrace');timeline.fromTo(l.box,{yPercent:-10},{yPercent:10,ease:'none'},0).fromTo(r.box,{yPercent:10},{yPercent:-10,ease:'none'},0);break;}
 case 'align-windows':case 'merge':case 'arch-dive':framePair(kind);break;
 case 'arch-pan':{const p=picture('arch-pan-photo','arch');title('Architecture.','arch-heading');timeline.to(p.image,{yPercent:25,ease:'none'});break;}
 case 'footer':{
  const footer=el('div','footer-demo');el('small','','YOUR NEXT CHAPTER',footer);title('Meet the place.','footer-demo-title',footer);el('span','','Arrange a visit ↗',footer);
  const p=picture('footer-window','footer');timeline.fromTo(p.box,{clipPath:full},{clipPath:'inset(8% 22% 8% 22%)',ease:'none'},0).fromTo(footer,{scale:.75,opacity:0},{scale:1,opacity:1,ease:'none'},0);break;
 }
 case 'heading':case 'script':case 'nav-roll':case 'nav-simple':case 'link-flip':{
  const wrap=el('div',kind==='script'?'text-center text-script':'text-center');const text=kind==='script'?'At your own pace.':kind==='heading'?'ROOM TO LIVE':kind==='link-flip'?'Explore the residence':'Choose your chapter';const letters=chars(text,wrap);
  if(kind==='heading')timeline.fromTo(letters,{opacity:0,yPercent:50,rotationY:90},{opacity:1,yPercent:0,rotationY:0,duration:1.2,stagger:.05,ease:'power2.out'});
  else if(kind==='script')timeline.fromTo(letters,{opacity:0,rotationX:90,x:100,transformOrigin:'center bottom'},{opacity:1,rotationX:0,x:0,duration:1.2,stagger:.1,ease:'power2.out'});
  else{
   const second=chars(text,wrap);second[0].parentElement.classList.add('second-line');
   if(kind==='link-flip')timeline.to(letters,{opacity:0,x:10,yPercent:-25,rotationY:-90,stagger:.025},0).fromTo(second,{opacity:0,x:-10,yPercent:25,rotationY:90},{opacity:1,x:0,yPercent:0,rotationY:0,stagger:.025},.2);
   else timeline.to(letters,{yPercent:-100,opacity:0,stagger:kind==='nav-simple'?0:.025},0).fromTo(second,{yPercent:100,opacity:0},{yPercent:0,opacity:1,stagger:kind==='nav-simple'?0:.025},0);
   if(kind==='link-flip'){const line=el('i','link-underline',undefined,wrap);timeline.to(line,{scaleX:0,transformOrigin:'right center'},0).to(line,{scaleX:1,transformOrigin:'left center'},.5);}
  }break;
 }
 case 'lines':{const block=el('div','paragraph-demo');['A garden for slower mornings.','A house with room to gather.','A place to make your own.'].forEach(t=>{const mask=el('div','line-mask',undefined,block);el('p','',t,mask);});timeline.fromTo(block.querySelectorAll('p'),{yPercent:110},{yPercent:0,duration:1.2,stagger:.1,ease:'power2.out'});break;}
 case 'content':{const c=card('content-demo','A considered arrival.');const b=el('span','demo-button','Discover the home ↗',c);timeline.fromTo([...c.children],{y:40,opacity:0},{y:0,opacity:1,stagger:.1,ease:'power2.out'});break;}
 case 'line':{title('A subtle division.');const line=el('div','divider-demo');timeline.fromTo(line,{clipPath:'inset(0% 0% 100% 0%)'},{clipPath:full,ease:'power2.out'});break;}
 case 'parallax':case 'parallax-in':case 'parallax-out':{const p=picture('parallax-frame','arch');const start=kind==='parallax'?-15:kind==='parallax-in'?-20:0,end=kind==='parallax'?15:kind==='parallax-in'?0:20;g.set(p.image,{scale:1.4});timeline.fromTo(p.image,{yPercent:start},{yPercent:end,ease:'none'});el('div','frame-cross','+');break;}
 case 'block-down':case 'block-up':{const c=card('block-parallax','The same story.');picture('block-photo','garden',c);const down=kind==='block-down';timeline.fromTo(c,{yPercent:down?-10:10},{yPercent:down?10:-10,ease:'none'});break;}
 case 'magnetic':case 'arcs':{
  const c=el('div','circle-demo');const t=el('span','','DISCOVER\nTHE HOME ↗',c);const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 240 240');svg.innerHTML='<circle cx="120" cy="120" r="103.5"/><circle cx="120" cy="120" r="103.5"/>';c.append(svg);const rings=svg.querySelectorAll('circle');
  if(kind==='arcs')timeline.fromTo(rings,{strokeDasharray:'27 650'},{strokeDasharray:'325 650'},0);
  else{timeline.to(c,{x:35,y:15,duration:.5},0).to(t,{x:12,y:8,duration:.5},0).to([c,t],{x:0,y:0,ease:'elastic.out(1,.3)',duration:1.2},.5);const move=e=>{const r=stage.getBoundingClientRect();g.to(c,{x:(e.clientX-r.left-r.width/2)*.12,y:(e.clientY-r.top-r.height/2)*.12,duration:.5});};const leave=()=>g.to(c,{x:0,y:0,duration:1.6,ease:'elastic.out(1,.3)'});stage.addEventListener('pointermove',move);stage.addEventListener('pointerleave',leave);cleanup.push(()=>{stage.removeEventListener('pointermove',move);stage.removeEventListener('pointerleave',leave);});}break;
 }
 case 'button-fill':{const b=el('div','button-demo');const bg=el('i','',undefined,b),text=el('span','','Discover ↗',b);timeline.fromTo(bg,{yPercent:100,borderRadius:'100%'},{yPercent:0,borderRadius:'0%'},0).to(text,{color:'#edf1e9'},0);break;}
 case 'theme':{const back=el('div','theme-demo');const header=el('div','theme-demo-header','ANGORA                                       DISCOVER ↗');timeline.to(back,{backgroundColor:'#223e35'},0).to(header,{color:'#edf1e9'},.1);break;}
 case 'logo':{const logo=title('✳','logo-demo');const direction=el('small','logo-note','30° / s → velocity response → return');timeline.to(logo,{rotation:720,ease:'power1.inOut',duration:2}).to(logo,{rotation:540,duration:1});break;}
 case 'progress':{const rail=el('div','progress-demo');const line=el('div','progress-demo-line',undefined,rail),thumb=el('b','progress-demo-thumb',undefined,rail),n=el('span','progress-demo-number','00',rail);timeline.to(line,{scaleY:1,ease:'none'},0).to(thumb,{y:180,ease:'none'},0);const obj={n:0};timeline.to(obj,{n:100,ease:'none',onUpdate:()=>n.textContent=String(Math.round(obj.n)).padStart(2,'0')},0);title('The journey, measured.');break;}
 case 'snap':{const rail=el('div','snap-rail');['A','B','C'].forEach((t,i)=>{const panel=el('div',`snap-panel snap-${i}`,undefined,rail);title(t,'',panel);});timeline.to(rail,{yPercent:-28,duration:.5,ease:'none'}).to(rail,{yPercent:-33.333,duration:.8,ease:'power2.inOut'});break;}
 case 'modal':case 'sheet':case 'tray':case 'menu':{
  picture();const shade=el('div','modal-shade'),c=card(kind==='tray'?'tray-demo':kind==='sheet'?'sheet-demo':kind==='menu'?'menu-demo':'modal-demo',kind==='menu'?'The home. The garden.':kind==='tray'?'A quieter interface.':'Discover in person.');
  if(kind==='modal')timeline.fromTo(c,{scale:0,rotationX:-90,yPercent:-100,rotation:-25,transformPerspective:1000},{scale:1,rotationX:0,yPercent:0,rotation:0},0);
  else if(kind==='menu'){timeline.fromTo(c,{opacity:0},{opacity:1},0).fromTo(c.querySelectorAll('*'),{y:20,opacity:0},{y:0,opacity:1,stagger:.1},.1);}
  else timeline.fromTo(c,{yPercent:125},{yPercent:0},0);timeline.fromTo(shade,{opacity:0},{opacity:kind==='tray'?0:.65},0);break;
 }
 case 'page-fade':{const p=picture('page-old','hero'),n=picture('page-new','terrace');const text=title('A new chapter.');timeline.to(text,{y:-30,opacity:0,duration:.4},0).to(p.box,{opacity:0,duration:.8},.3).fromTo(n.box,{opacity:0},{opacity:1,duration:.8},1);break;}
 case 'accordion':{const wrap=el('div','accordion-demo');el('div','accordion-label','The details that matter   +',wrap);const body=el('div','accordion-body',undefined,wrap);el('p','','Room dimensions, floor identity and original photographs should tell one consistent story.',body);timeline.fromTo(body,{height:0},{height:100,duration:1.2,ease:'power2.out'}).fromTo(body.querySelector('p'),{y:20,opacity:0},{y:0,opacity:1},.4);break;}
 case 'signature':{const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('signature-demo');svg.setAttribute('viewBox','0 0 500 220');svg.innerHTML='<path d="M35 175 Q95 30 130 140 T230 105 Q290 15 310 115 T450 90 M85 170 L330 170" fill="none" stroke="currentColor" stroke-width="3"/>';stage.append(svg);const p=svg.querySelector('path'),len=p.getTotalLength();timeline.fromTo(p,{strokeDasharray:len,strokeDashoffset:len},{strokeDashoffset:0,ease:'none'});el('small','signature-note','Hareket ailesi demosu · özgün ajans Lottie dosyası değildir');break;}
 case 'to-top':case 'lenis':{const scene=el('div','scroll-engine-demo');['01 · The arrival','02 · The garden','03 · The home','04 · The next chapter'].forEach(t=>el('div','',t,scene));timeline.fromTo(scene,{yPercent:kind==='to-top'?-55:0},{yPercent:kind==='to-top'?0:-55,ease:'power2.out',duration:1.2});break;}
 case 'arrow':case 'social':{const b=title(kind==='social'?'↗':'Next photograph  →','arrow-demo');timeline.fromTo(b,{scale:1,x:kind==='arrow'?-12:0},{scale:kind==='social'?1.25:1,x:0});break;}
 case 'responsive':{const desktop=el('div','responsive-desktop');picture('responsive-image','hero',desktop);card('responsive-card','A whole scene.',desktop);timeline.fromTo(desktop,{width:'90%',height:'80%'},{width:'34%',height:'90%'}).to(desktop,{borderRadius:'20px'},0);break;}
 default:throw new Error(`No renderer: ${kind}`);
 }
 // Add a short final hold; all experiments can be sought in either direction.
 const end=timeline.duration();timeline.to({hold:0},{hold:1,duration:.12,ease:'none'},end);
 timeline.progress(0);
 return {motion,timeline,setProgress:p=>timeline.progress(Math.max(0,Math.min(1,p))),destroy(){timeline.kill();g.killTweensOf(stage.querySelectorAll('*'));cleanup.forEach(fn=>fn());stage.replaceChildren();}};
}
