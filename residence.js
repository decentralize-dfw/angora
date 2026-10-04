(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasMotion = !!(window.gsap && window.ScrollTrigger);
  let lenis = null, gardenTrigger = null;
  if (hasMotion) gsap.registerPlugin(ScrollTrigger);
  if (!reduced && hasMotion && window.Lenis) {
    lenis = new Lenis({duration:.8, smoothWheel:true, syncTouch:false,
      prevent:node => !!node.closest('dialog')});
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  function scrollTo(target, options = {}) {
    if (lenis) lenis.scrollTo(target, {duration:1.35, ...options});
    else window.scrollTo({top:typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY + (options.offset || 0), behavior:options.immediate||reduced ? 'instant' : 'smooth'});
  }
  let navigationTween=null,heldTop=null;
  function releaseScroll(){
    if(heldTop!==null){scrollTo(heldTop,{immediate:true,force:true});heldTop=null;}
    if(!document.body.classList.contains('locked')&&!document.querySelector('dialog[open]'))lenis?.start();
  }
  window.AngoraScroll={stop:()=>lenis?.stop(),start:()=>lenis?.start(),to:(top,immediate=false)=>scrollTo(top,{immediate,force:true}),
    hold:top=>{navigationTween?.kill();heldTop=top;scrollTo(top,{immediate:true,force:true});lenis?.stop();},
    release:releaseScroll,
    cancelTravel:()=>navigationTween?.kill(),
    travel:(top,duration=.85)=>new Promise(resolve=>{
      releaseScroll();
      navigationTween?.kill();top=Math.max(0,Math.min(top,document.documentElement.scrollHeight-innerHeight));
      if(reduced||!hasMotion||Math.abs(top-scrollY)<1){scrollTo(top,{immediate:true,force:true});resolve();return;}
      const position={top:scrollY},done=()=>{navigationTween=null;resolve();};
      navigationTween=gsap.to(position,{top,duration,ease:'power2.inOut',onUpdate:()=>scrollTo(position.top,{immediate:true,force:true}),onComplete:done,onInterrupt:done});
    })};
  window.addEventListener('angora:scroll', event => scrollTo(event.detail.top,{immediate:!!event.detail.immediate}));
  const menu = $('#menu'), menuToggle = $('.menu-toggle');
  const header=$('.header');let headerTimer,previousScroll=scrollY,previousTime=performance.now();
  function hideHeader(){
    if(!menu.hidden||(header.contains(document.activeElement)&&document.activeElement.matches(':focus-visible')))return;
    header.classList.remove('is-visible');
  }
  function revealHeader(){
    header.classList.add('is-visible');clearTimeout(headerTimer);
    headerTimer=setTimeout(hideHeader,1100);
  }
  // Wheel intent also reveals navigation while a film deliberately holds y=0.
  window.AngoraNavigation={gesture:(delta,mode=0)=>{
    const pixels=Math.abs(delta)*(mode===1?16:mode===2?innerHeight:1);
    if(pixels>=70)revealHeader();
  }};
  header.addEventListener('focusin',revealHeader);
  header.addEventListener('focusout',()=>{clearTimeout(headerTimer);headerTimer=setTimeout(hideHeader,600);});
  let returnFocus = null, menuClosing = null;
  function closeMenu() {
    if(menuClosing)return menuClosing;
    if(menu.hidden)return Promise.resolve();
    menuToggle.setAttribute('aria-expanded','false');
    const finish=()=>{menu.hidden=true;document.body.classList.remove('locked');lenis?.start();updateHeader();revealHeader();};
    if(reduced||!hasMotion){finish();return Promise.resolve();}
    menuClosing=new Promise(resolve=>gsap.to(menu,{opacity:0,y:-12,duration:.22,overwrite:true,onComplete:()=>{finish();gsap.set(menu,{clearProps:'opacity,transform'});menuClosing=null;resolve();}}));
    return menuClosing;
  }
  menuToggle.addEventListener('click', () => {
    if (!menu.hidden) return closeMenu();
    menu.hidden = false; menuToggle.setAttribute('aria-expanded','true');
    revealHeader();
    document.body.classList.add('locked'); lenis?.stop();
    $('.header').classList.remove('on-dark'); menu.querySelector('a').focus({preventScroll:true});
    if(!reduced&&hasMotion){gsap.fromTo(menu,{opacity:0,y:12},{opacity:1,y:0,duration:.4,ease:'power3.out',overwrite:true});gsap.fromTo(menu.querySelectorAll('a'),{opacity:0,y:12},{opacity:1,y:0,duration:.45,stagger:.025,ease:'power3.out',overwrite:true});}
  });
  document.addEventListener('keydown', event => {
    if (!menu.hidden && event.key === 'Escape') {closeMenu(); menuToggle.focus();}
    if (!menu.hidden && event.key === 'Tab') {
      const focusable = [menuToggle, ...menu.querySelectorAll('a')];
      const index = focusable.indexOf(document.activeElement);
      if (event.shiftKey && index === 0) {event.preventDefault(); focusable.at(-1).focus();}
      if (!event.shiftKey && index === focusable.length - 1) {event.preventDefault(); menuToggle.focus();}
    }
  });
  let navigationId=0;
  async function navigate(target,before=()=>{}) {
    const id=++navigationId;await closeMenu();await window.AngoraSteps?.whenIdle();if(id!==navigationId)return;
    const commit=async()=>{
      await before();if(target.id==='home')await window.AngoraCinema?.reset();if(target.id==='floors')window.AngoraIso?.resetView();if(target.id==='atlas')window.AngoraPlan?.resetView();
      // A viewport / font change can resize upstream pinned galleries. Measure
      // after those observers settle, before capturing the incoming scene.
      await document.fonts?.ready;
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      window.ScrollTrigger?.refresh();
      const top=target.getBoundingClientRect().top+scrollY;scrollTo(top,{immediate:true,force:true});
      target.tabIndex=-1;target.focus({preventScroll:true});window.ScrollTrigger?.update();updateHeader();
    };
    if(reduced||Math.abs(target.getBoundingClientRect().top)<innerHeight*.8){await commit();return;}
    // Capture both complete scenes; distant navigation never flies through the story.
    if(document.startViewTransition){await document.startViewTransition(commit).finished;}
    else{let veil=$('.navigation-veil');if(!veil){veil=document.createElement('div');veil.className='navigation-veil';document.body.append(veil);}await new Promise(r=>gsap.to(veil,{opacity:1,duration:.2,onComplete:r}));await commit();await new Promise(r=>gsap.to(veil,{opacity:0,duration:.3,onComplete:r}));}
  }
  window.AngoraScroll.navigate=navigate;
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', async event => {
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    event.preventDefault();await navigate(target);
    history.replaceState(null, '', link.hash);
  }));
  function updateHeader() {
    const center = scrollY + 60;
    const dark = ['.hero-story','.garden-story','.kitchen-story','.gallery','.contact','footer'].some(selector => {
      const element = $(selector);
      return center >= element.offsetTop && center < element.offsetTop + element.offsetHeight;
    });
    const life=$('.angora-life');
    const darkLife=life && center>=life.offsetTop && center<life.offsetTop+life.offsetHeight;
    const useDark = (dark || darkLife) && menu.hidden;
    $('.header').classList.toggle('on-dark', useDark);
    $('.scroll-index').classList.toggle('on-dark', useDark);
    const chapters=['home','residence','garden','spaces','floors','atlas','location','life','gallery','contact'];
    let chapter=0;chapters.forEach((id,i)=>{const e=document.getElementById(id);if(e&&e.getBoundingClientRect().top<=innerHeight*.45)chapter=i;});
    $('#scroll-number').textContent=String(chapter).padStart(2,'0');
    $('.index-word').textContent=chapter?'Chapter '+String(chapter).padStart(2,'0'):'Scroll to discover ↓';
    $('.scroll-index b').style.height=`${chapter/(chapters.length-1)*100}%`;
  }
  let scrollQueued = false;
  window.addEventListener('scroll', () => {
    const now=performance.now(),elapsed=Math.max(16,now-previousTime),speed=Math.abs(scrollY-previousScroll)/elapsed;
    if(speed>1.15)revealHeader();previousScroll=scrollY;previousTime=now;
    if (scrollQueued) return;
    scrollQueued = true; requestAnimationFrame(() => {updateHeader(); scrollQueued = false;});
  }, {passive:true});
  updateHeader(); $('#year').textContent = new Date().getFullYear();

  const gardens = [
    ['01 / Your own water', 'A pool, all to yourself.', 'The private pool sits at the same level as the lower living floor. Open the doors, cross the terrace and the day moves outside.'],
    ['02 / A place in the shade', 'Stay a little longer.', 'A covered terrace makes room for unhurried lunches, quiet mornings and long evenings. It connects the garden-level rooms with the pool and outdoor dining area.'],
    ['03 / Room to breathe', 'A garden with its own rhythm.', 'Approximately 900 m² of private garden surrounds the residence. Mature planting, lawn and paths create different places to sit, play and spend time outdoors.'],
  ];
  let gardenIndex = 0, gardenCopyTween;
  function setGarden(index, direct = false) {
    if (index === gardenIndex && !direct) return;
    gardenIndex = index;
    const content = gardens[index];
    const updateCopy=()=>{$('#garden-number').textContent = content[0]; $('#garden-title').textContent = content[1]; $('#garden-copy').textContent = content[2];};
    $$('[data-garden]').forEach(button => {button.classList.toggle('active', Number(button.dataset.garden) === index); button.setAttribute('aria-pressed', String(Number(button.dataset.garden) === index));});
    if (direct||reduced||!hasMotion){updateCopy();$$('.garden-image').forEach((image,i) => {image.style.opacity = i === index ? '1' : '0';});}
    else{
      gardenCopyTween?.kill();gardenCopyTween=gsap.timeline().to('.garden-copy',{opacity:0,duration:.12}).call(updateCopy).to('.garden-copy',{opacity:1,duration:.26,ease:'power2.out'},.26);
      $$('.garden-image').forEach((image,i)=>gsap.to(image,{opacity:i===index?1:0,duration:.5,ease:'power2.inOut',overwrite:true}));
    }
  }
  $$('[data-garden]').forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.garden);
    if (gardenTrigger) scrollTo(gardenTrigger.start + (gardenTrigger.end - gardenTrigger.start) * ((index + .4) / 3));
    else setGarden(index, true);
  }));
  setGarden(0, true);

  const chapters = [
    {view:'f0', level:'Garden level', kicker:'1 / The garden floor', title:'Open the day outside.', copy:'A living room of approximately 54 m², a separate kitchen and direct access to the garden and pool. An annexe with its own entrance adds space for guests, work or a separate daily routine.', features:['Living room & kitchen','Garden & pool access','Guest WC & separate annexe'], photo:'03', caption:'Garden-level living room'},
    {view:'f1', level:'Entrance level', kicker:'2 / The entrance floor', title:'The heart of the home.', copy:'Arrive from the street into the main social floor. A living and dining room of approximately 53 m² connects to a generous enclosed kitchen, utility space and an internally accessible garage.', features:['Main living & dining room','Kitchen, utility space & guest WC','Street entrance, garage & balcony'], photo:'04', caption:'Entrance-level living and dining room'},
    {view:'f2', level:'First floor', kicker:'3 / The bedroom floor', title:'A place for privacy.', copy:'The principal suite has its own dressing room and en-suite bathroom. Two more bedrooms, a family bathroom and a sitting area bring the private rooms together on one level.', features:['Principal suite & dressing room','Two further bedrooms & family bathroom','Sitting area, balcony & lift access'], photo:'19', caption:'First-floor principal bedroom'},
    {view:'f3', level:'Attic level', kicker:'4 / The attic floor', title:'Room for another rhythm.', copy:'Under the pitched roof, a sitting room, two bedrooms, a kitchenette and a bathroom create an additional living arrangement. A place for guests, grown children or a quieter working day, reached by the staircase.', features:['Sitting room & two bedrooms','Kitchenette & bathroom','Stair access; lift stops below'], photo:'09', caption:'Attic-level sitting room'},
  ];
  let chapterIndex = 0;
  function setChapter(index, force = false) {
    index = Math.max(0, Math.min(3, index));
    if (index === chapterIndex && !force) return;
    chapterIndex = index;
    const chapter = chapters[index];
    $('#chapter-kicker').textContent = chapter.kicker; $('#chapter-title').textContent = chapter.title;
    $('#chapter-copy').textContent = chapter.copy; $('#chapter-features').replaceChildren(...chapter.features.map(text => {const li = document.createElement('li'); li.textContent = text; return li;}));
    if($('#chapter-tour'))$('#chapter-tour').dataset.tour = chapter.view;
    if($('#chapter-plan'))$('#chapter-plan').dataset.atlasLink=index;
    $('#chapter-model-level').textContent = chapter.level;

    $('#chapter-panel').setAttribute('aria-labelledby',`chapter-tab-${index}`);
    $$('[data-chapter]').forEach(button => {const selected = Number(button.dataset.chapter) === index; button.setAttribute('aria-selected',String(selected)); button.tabIndex = selected ? 0 : -1;});

    if($('#chapter-photo-button')){$('#chapter-photo-button').dataset.photo = chapter.photo; $('#chapter-photo-button').dataset.caption = chapter.caption;}
    $('.chapter-progress i').style.width = `${(index + 1) * 25}%`;
    if($('#chapter-map-link'))$('#chapter-map-link').dataset.atlasLink=index;
    $('.chapter-scene').dataset.floor=index;
    window.dispatchEvent(new CustomEvent('angora:chapter',{detail:index}));
  }
  async function goChapter(index) {
    if(Math.abs($('#floors').getBoundingClientRect().top)>5)await navigate($('#floors'));
    if(window.AngoraIso)await window.AngoraIso.go(index);else setChapter(index);
  }
  $$('[data-chapter]').forEach(button => {
    button.addEventListener('click', () => goChapter(Number(button.dataset.chapter)));
    button.addEventListener('keydown', event => {
      let index = Number(button.dataset.chapter);
      if (event.key === 'ArrowRight') index = (index + 1) % 4;
      else if (event.key === 'ArrowLeft') index = (index + 3) % 4;
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = 3;
      else return;
      event.preventDefault(); goChapter(index); $(`#chapter-tab-${index}`).focus({preventScroll:true});
    });
  });
  $$('[data-chapter-link]').forEach(button => button.addEventListener('click', () => goChapter(Number(button.dataset.chapterLink))));
  $$('[data-atlas-link]').forEach(button => button.addEventListener('click',()=>{
    const floor=Number(button.dataset.atlasLink);
    if(window.AngoraPlan?.navigate)window.AngoraPlan.navigate(floor);
    else {window.dispatchEvent(new CustomEvent('angora:floor',{detail:floor}));scrollTo($('#atlas'),{offset:-60});}
  }));
  window.addEventListener('angora:chapter-display',event=>setChapter(event.detail));
  setChapter(0, true);

  const imageDialog = $('#image-dialog');
  let closingPhoto=false;
  function closePhoto(){
    if(closingPhoto||!imageDialog.open)return;
    if(reduced||!hasMotion){imageDialog.close();return;}
    closingPhoto=true;gsap.to(imageDialog,{opacity:0,y:8,duration:.18,ease:'power2.in',onComplete:()=>{imageDialog.close();gsap.set(imageDialog,{clearProps:'opacity,transform'});closingPhoto=false;}});
  }
  function openDialog(dialog) {
    returnFocus = document.activeElement;dialog.showModal();document.body.classList.add('locked');lenis?.stop();
    if(!reduced&&hasMotion)gsap.fromTo(dialog,{opacity:0,y:12,scale:.98},{opacity:1,y:0,scale:1,duration:.35,ease:'power3.out',overwrite:true});
  }
  [imageDialog].forEach(dialog => {
    dialog.querySelector('.dialog-close').addEventListener('click', closePhoto);
    dialog.addEventListener('cancel',event=>{event.preventDefault();closePhoto();});
    dialog.addEventListener('click', event => {if (event.target === dialog) {const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closePhoto();}});
    dialog.addEventListener('close', () => {document.body.classList.remove('locked');lenis?.start();returnFocus?.focus({preventScroll:true});});
  });
  document.addEventListener('click', event => {
    const photo = event.target.closest('[data-photo]');
    if (photo) {$('#lightbox-image').src = photo.dataset.photoUrl || window.ANGORA_ATLAS.photos.find(point=>point.id===Number(photo.dataset.photo))?.url || `./assets/residence/photo-${photo.dataset.photo}.jpg`; $('#lightbox-image').alt = photo.dataset.caption || ''; $('#lightbox-caption').textContent = photo.dataset.caption || ''; openDialog(imageDialog);}
    const tour = event.target.closest('[data-tour]');
    if (tour) {const url = `./index.html?lang=en&view=${encodeURIComponent(tour.dataset.tour)}`; window.open(url,'_blank','noopener');}
  });

  if (hasMotion && !reduced) {
    const mm = gsap.matchMedia();
    mm.add({desktop:'(min-width:801px)', mobile:'(max-width:800px)'}, context => {
      const mobile = context.conditions.mobile;
      const scrub = (trigger, extra = {}) => ({trigger, start:'top top', end:'bottom bottom', scrub:.25, invalidateOnRefresh:true, ...extra});
      gsap.timeline({scrollTrigger:scrub('.arrival-story')})
        .to('.arrival-frame',{left:'7%',top:mobile?'31%':'30%',width:mobile?'86%':'53%',height:()=>Math.min(innerHeight*.43,innerWidth*(mobile?.86:.53)*941/1672),duration:.45,ease:'power2.inOut'},0)
        .to('.arrival-type',{opacity:0,duration:.2},.05)
        .to('.arrival-caption',{opacity:1,y:0,duration:.22},.28);
      const garden = gsap.timeline({scrollTrigger:scrub('.garden-story', {onUpdate:self => setGarden(self.progress<.42?0:self.progress<.76?1:2)})});
      gardenTrigger = garden.scrollTrigger;
      garden.to('.garden-images',{clipPath:mobile?'inset(4% 5% 4% 5%)':'inset(6% 5% 6% 5%)',duration:.2,ease:'power2.inOut'},.02)
        .to('.garden-images',{clipPath:'inset(0% 0% 0% 0%)',duration:.15,ease:'power2.inOut'},.85);
      garden.fromTo('.garden-0', {scale:1.035}, {scale:1, duration:.44, ease:'none'}, 0)
        .fromTo('.garden-1', {scale:1.03}, {scale:1, duration:.39, ease:'none'}, .32)
        .fromTo('.garden-2', {scale:1.03}, {scale:1, duration:.34, ease:'none'}, .66);
      // Keep the neighbourhood legible until a complete scene handoff is chosen.
      // The motion study documents the coupled footer and architectural masks.
      gsap.timeline({scrollTrigger:scrub('.life-opening')})
        .fromTo('.life-landscape',{y:20},{y:0,duration:1,ease:'none'},0);
      $$('.reveal').forEach(element => {if(element.matches('h2,h3,.editorial-image'))return;gsap.from(element, {y:22, opacity:0, duration:.65, ease:'power3.out', scrollTrigger:{trigger:element, start:'top 91%', once:true}});});
      $$('.detail-photo').forEach(element => gsap.fromTo(element, {y:35}, {y:-18, ease:'none', scrollTrigger:{trigger:element.closest('.editorial'), start:'top bottom', end:'bottom top', scrub:.25}}));
      gsap.fromTo('.location-image img', {scale:1.12,yPercent:-5}, {scale:1.2,yPercent:5, ease:'none', scrollTrigger:{trigger:'.location-image', start:'top bottom', end:'bottom top', scrub:.25}});
      gsap.fromTo('.contact-image img', {scale:1.04}, {scale:1, ease:'none', scrollTrigger:{trigger:'.contact', start:'top bottom', end:'bottom bottom', scrub:.25}});
      return () => {gardenTrigger = null;};
    });
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh(), {once:true});
  }
})();
