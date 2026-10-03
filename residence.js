(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasMotion = !!(window.gsap && window.ScrollTrigger);
  let lenis = null, gardenTrigger = null;
  if (hasMotion) gsap.registerPlugin(ScrollTrigger);
  if (!reduced && hasMotion && window.Lenis) {
    lenis = new Lenis({duration:1.15, smoothWheel:true, syncTouch:false,
      prevent:node => !!node.closest('dialog')});
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  function scrollTo(target, options = {}) {
    if (lenis) lenis.scrollTo(target, {duration:1.35, ...options});
    else window.scrollTo({top:typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY + (options.offset || 0), behavior:reduced ? 'instant' : 'smooth'});
  }
  window.AngoraScroll={stop:()=>lenis?.stop(),start:()=>lenis?.start(),to:(top,immediate=false)=>scrollTo(top,{immediate,force:true})};
  window.addEventListener('angora:scroll', event => scrollTo(event.detail.top,{immediate:!!event.detail.immediate}));
  const menu = $('#menu'), menuToggle = $('.menu-toggle');
  let returnFocus = null;
  function closeMenu() {
    menu.hidden = true; menuToggle.setAttribute('aria-expanded','false');
    document.body.classList.remove('locked'); lenis?.start(); updateHeader();
  }
  menuToggle.addEventListener('click', () => {
    if (!menu.hidden) return closeMenu();
    menu.hidden = false; menuToggle.setAttribute('aria-expanded','true');
    document.body.classList.add('locked'); lenis?.stop();
    $('.header').classList.remove('on-dark'); menu.querySelector('a').focus();
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
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    event.preventDefault(); closeMenu();
    scrollTo(target, {offset:['home','floors','atlas','garden'].includes(target.id) ? 0 : -75});
    history.replaceState(null, '', link.hash);
  }));
  function updateHeader() {
    const center = scrollY + 60;
    const dark = ['.hero-story','.garden-story','.kitchen-story','.gallery','.contact'].some(selector => {
      const element = $(selector);
      return center >= element.offsetTop && center < element.offsetTop + element.offsetHeight;
    });
    const life=$('.angora-life');
    const darkLife=life && center>=life.offsetTop && center<life.offsetTop+life.offsetHeight;
    const useDark = (dark || darkLife) && menu.hidden;
    $('.header').classList.toggle('on-dark', useDark);
    $('.scroll-index').classList.toggle('on-dark', useDark);
    const progress = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
    $('#scroll-number').textContent = String(Math.round(progress * 100)).padStart(2,'0');
    $('.scroll-index b').style.height = `${progress * 100}%`;
  }
  let scrollQueued = false;
  window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true; requestAnimationFrame(() => {updateHeader(); scrollQueued = false;});
  }, {passive:true});
  updateHeader(); $('#year').textContent = new Date().getFullYear();

  const gardens = [
    ['01 / Your own water', 'A pool, all to yourself.', 'The private pool sits at the same level as the lower living floor. Open the doors, cross the terrace and the day moves outside.'],
    ['02 / A place in the shade', 'Stay a little longer.', 'A covered terrace makes room for unhurried lunches, quiet mornings and long evenings. It connects the garden-level rooms with the pool and outdoor dining area.'],
    ['03 / Room to breathe', 'A garden with its own rhythm.', 'Approximately 900 m² of private garden surrounds the residence. Mature planting, lawn and paths create different places to sit, play and spend time outdoors.'],
  ];
  let gardenIndex = 0;
  function setGarden(index, direct = false) {
    if (index === gardenIndex && !direct) return;
    gardenIndex = index;
    const content = gardens[index];
    $('#garden-number').textContent = content[0]; $('#garden-title').textContent = content[1]; $('#garden-copy').textContent = content[2];
    $$('[data-garden]').forEach(button => {button.classList.toggle('active', Number(button.dataset.garden) === index); button.setAttribute('aria-pressed', String(Number(button.dataset.garden) === index));});
    if (direct) $$('.garden-image').forEach((image,i) => {image.style.opacity = i === index ? '1' : '0';});
    if (hasMotion && !reduced) gsap.fromTo('.garden-copy', {y:14, opacity:.4}, {y:0, opacity:1, duration:.6, overwrite:true});
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
    $('#chapter-tour').dataset.tour = chapter.view;
    if($('#chapter-plan'))$('#chapter-plan').dataset.atlasLink=index;
    $('#chapter-model-level').textContent = chapter.level;

    $('#chapter-panel').setAttribute('aria-labelledby',`chapter-tab-${index}`);
    $$('[data-chapter]').forEach(button => {const selected = Number(button.dataset.chapter) === index; button.setAttribute('aria-selected',String(selected)); button.tabIndex = selected ? 0 : -1;});

    $('#chapter-photo-button').dataset.photo = chapter.photo; $('#chapter-photo-button').dataset.caption = chapter.caption;
    $('.chapter-progress i').style.width = `${(index + 1) * 25}%`;
    $('#chapter-map-link').dataset.atlasLink=index;
    $('.chapter-scene').dataset.floor=index;
    window.dispatchEvent(new CustomEvent('angora:chapter',{detail:index}));
    if (hasMotion && !reduced) {
      gsap.fromTo('.chapter-copy', {y:12, opacity:.5}, {y:0, opacity:1, duration:.5, overwrite:true});

    }
  }
  function goChapter(index) {
    if(Math.abs($('#floors').getBoundingClientRect().top)>5)scrollTo($('#floors'),{immediate:true});
    if(window.AngoraIso)window.AngoraIso.go(index);else setChapter(index);
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
  function openDialog(dialog) {returnFocus = document.activeElement; dialog.showModal(); document.body.classList.add('locked'); lenis?.stop();}
  [imageDialog].forEach(dialog => {
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {if (event.target === dialog) {const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();}});
    dialog.addEventListener('close', () => {document.body.classList.remove('locked'); lenis?.start(); returnFocus?.focus({preventScroll:true});});
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
      const scrub = (trigger, extra = {}) => ({trigger, start:'top top', end:'bottom bottom', scrub:.75, invalidateOnRefresh:true, ...extra});
      gsap.timeline({scrollTrigger:scrub('.arrival-story')})
        .to('.arrival-frame',{clipPath:mobile?'inset(31% 7% 24% 7%)':'inset(15% 40% 16% 8%)',duration:.4,ease:'power2.inOut'},0)
        .fromTo('.arrival-frame img',{scale:1.08},{scale:1,duration:.6,ease:'none'},0)
        .to('.arrival-caption',{opacity:1,y:-12,duration:.2},.32)
        .fromTo('.arrival-detail',{y:100,rotation:8},{y:0,rotation:-3,opacity:1,duration:.3},.4)
        .to('.arrival-caption,.arrival-detail,.arrival-type',{opacity:0,duration:.15},.78)
        .to('.arrival-frame',{clipPath:'inset(0% 0% 0% 0%)',duration:.25,ease:'power2.inOut'},.75);
      const garden = gsap.timeline({scrollTrigger:scrub('.garden-story', {onUpdate:self => setGarden(Math.min(2, Math.floor(self.progress * 3)))})});
      gardenTrigger = garden.scrollTrigger;
      garden.to('.garden-images',{clipPath:mobile?'inset(4% 5% 4% 5%)':'inset(6% 5% 6% 5%)',duration:.2,ease:'power2.inOut'},.02)
        .to('.garden-images',{clipPath:'inset(0% 0% 0% 0%)',duration:.15,ease:'power2.inOut'},.85);
      garden.fromTo('.garden-0', {scale:1.15, xPercent:1}, {scale:1, xPercent:0, duration:.42, ease:'none'}, 0)
        .set('.garden-1', {opacity:1}, .30)
        .fromTo('.garden-1', {clipPath:'polygon(100% 0%,100% 0%,125% 100%,100% 100%)'}, {clipPath:'polygon(0% 0%,100% 0%,100% 100%,0% 100%)',duration:.14,ease:'power2.inOut'}, .30)
        .fromTo('.garden-1', {scale:1.13, xPercent:-2}, {scale:1, xPercent:0, duration:.39, ease:'none'}, .32)
        .set('.garden-2', {opacity:1}, .64)
        .fromTo('.garden-2', {clipPath:'polygon(100% 0%,100% 0%,125% 100%,100% 100%)'}, {clipPath:'polygon(0% 0%,100% 0%,100% 100%,0% 100%)',duration:.14,ease:'power2.inOut'}, .64)
        .fromTo('.garden-2', {scale:1.15}, {scale:1, duration:.34, ease:'none'}, .66);
      // Keep the neighbourhood legible until a complete scene handoff is chosen.
      // The motion study documents the coupled footer and architectural masks.
      gsap.timeline({scrollTrigger:scrub('.life-opening')})
        .fromTo('.life-landscape img',{scale:1.08},{scale:1,duration:1,ease:'none'},0)
        .to('.life-opening-copy',{y:-40,opacity:0,duration:.3},.55);
      $$('.reveal').forEach(element => gsap.from(element, {y:45, opacity:0, duration:1.15, ease:'power2.out', scrollTrigger:{trigger:element, start:'top 92%', once:true}}));
      $$('.detail-photo').forEach(element => gsap.fromTo(element, {y:60, rotation:3}, {y:-35, rotation:-3, ease:'none', scrollTrigger:{trigger:element.closest('.editorial'), start:'top bottom', end:'bottom top', scrub:1}}));
      gsap.fromTo('.location-image img', {scale:1.14}, {scale:1, ease:'none', scrollTrigger:{trigger:'.location', start:'top bottom', end:'bottom top', scrub:1}});
      gsap.fromTo('.contact-image img', {scale:1.14, yPercent:-4}, {scale:1.02, yPercent:0, ease:'none', scrollTrigger:{trigger:'.contact', start:'top bottom', end:'bottom bottom', scrub:1}});
      return () => {chapterTrigger = null; gardenTrigger = null;};
    });
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh(), {once:true});
  }
})();
