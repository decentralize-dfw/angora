(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasMotion = !!(window.gsap && window.ScrollTrigger);
  let lenis = null, chapterTrigger = null, gardenTrigger = null;
  if (hasMotion) gsap.registerPlugin(ScrollTrigger);
  if (!reduced && hasMotion && window.Lenis) {
    lenis = new Lenis({duration:1.15, smoothWheel:true, syncTouch:false,
      prevent:node => !!node.closest('dialog,.gallery-track')});
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  function scrollTo(target, options = {}) {
    if (lenis) lenis.scrollTo(target, {duration:1.35, ...options});
    else window.scrollTo({top:typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY + (options.offset || 0), behavior:reduced ? 'instant' : 'smooth'});
  }
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
    scrollTo(target, {offset:target.id === 'home' || target.id === 'floors' || target.id === 'garden' ? 0 : -75});
    history.replaceState(null, '', link.hash);
  }));
  function updateHeader() {
    const center = scrollY + 60;
    const dark = ['.hero-story','.garden-story','.contact'].some(selector => {
      const element = $(selector);
      return center >= element.offsetTop && center < element.offsetTop + element.offsetHeight;
    });
    const life=$('.angora-life');
    const darkLife=life && center>=life.offsetTop && center<life.offsetTop+life.offsetHeight;
    // The circular wipe at the end of the opening has a cream background.
    const hero = $('.hero-story');
    const heroCream = scrollY > (hero.offsetHeight - innerHeight) * .86 && scrollY < hero.offsetHeight;
    const useDark = (dark || darkLife) && !heroCream && menu.hidden;
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
    {view:'f0', level:'Garden level', kicker:'−01 / The garden floor', title:'Open the day outside.', copy:'A living room of approximately 54 m², a separate kitchen and direct access to the garden and pool. An annexe with its own entrance adds space for guests, work or a separate daily routine.', features:['Living room & kitchen','Garden & pool access','Guest WC & separate annexe'], photo:'03', caption:'Garden-level living room'},
    {view:'f1', level:'Entrance level', kicker:'00 / The entrance floor', title:'The heart of the home.', copy:'Arrive from the street into the main social floor. A living and dining room of approximately 53 m² connects to a generous enclosed kitchen, utility space and an internally accessible garage.', features:['Main living & dining room','Kitchen, utility space & guest WC','Street entrance, garage & balcony'], photo:'04', caption:'Entrance-level living and dining room'},
    {view:'f2', level:'First floor', kicker:'01 / The bedroom floor', title:'A place for privacy.', copy:'The principal suite has its own dressing room and en-suite bathroom. Two more bedrooms, a family bathroom and a sitting area bring the private rooms together on one level.', features:['Principal suite & dressing room','Two further bedrooms & family bathroom','Sitting area, balcony & lift access'], photo:'19', caption:'First-floor principal bedroom'},
    {view:'f3', level:'Attic level', kicker:'02 / The attic floor', title:'Room for another rhythm.', copy:'Under the pitched roof, a sitting room, two bedrooms, a kitchenette and a bathroom create an additional living arrangement. A place for guests, grown children or a quieter working day, reached by the staircase.', features:['Sitting room & two bedrooms','Kitchenette & bathroom','Stair access; lift stops below'], photo:'09', caption:'Attic-level sitting room'},
  ];
  let chapterIndex = 0, chapterStarted = false, filmReady = false;
  const canvas = $('#chapter-canvas'), filmContext = canvas.getContext('2d', {alpha:true});
  let filmCount = 96, filmProgress = 0, filmPosition = 0, filmTarget = 0, filmActive = 0;
  const filmCache = new Map(), filmPending = new Set();
  let filmQueue = [], filmLoads = 0, filmFailures = 0;
  function drawFilm(index) {
    const bitmap = filmCache.get(index);
    if (!bitmap) return;
    filmActive = index;
    const scale = Math.min(canvas.width / bitmap.width, canvas.height / bitmap.height);
    const width = bitmap.width * scale, height = bitmap.height * scale;
    const next = index === filmTarget ? filmCache.get(index+1) : null;
    const blend = next ? filmPosition-filmTarget : 0;
    filmContext.clearRect(0,0,canvas.width,canvas.height);
    filmContext.globalAlpha=1-blend;
    filmContext.drawImage(bitmap,(canvas.width-width)/2,(canvas.height-height)/2,width,height);
    if (next && blend>0) {
      // Weighted additive compositing blends premultiplied alpha correctly,
      // keeping the transparent studio film opaque where both frames overlap.
      filmContext.globalCompositeOperation='lighter'; filmContext.globalAlpha=blend;
      filmContext.drawImage(next,(canvas.width-width)/2,(canvas.height-height)/2,width,height);
    }
    filmContext.globalAlpha=1; filmContext.globalCompositeOperation='source-over';
    canvas.dataset.frame = (index+blend).toFixed(2);
    $('.chapter-model').classList.add('loaded'); $('.chapter-model').classList.remove('film-error');
  }
  function resizeFilm() {
    const box = canvas.getBoundingClientRect(), ratio = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.max(1,Math.round(box.width * ratio));
    canvas.height = Math.max(1,Math.round(box.height * ratio)); drawFilm(filmActive);
  }
  new ResizeObserver(resizeFilm).observe(canvas);
  function trimFilmCache() {
    if (filmCache.size <= 18) return;
    const old = [...filmCache.keys()].sort((a,b) => Math.abs(b-filmTarget)-Math.abs(a-filmTarget));
    while (filmCache.size > 18) {
      const index = old.shift();
      if (index === filmActive || index === filmTarget) continue;
      filmCache.get(index)?.close?.(); filmCache.delete(index);
    }
  }
  async function loadFilmFrame(index) {
    const url = `./assets/residence/chapters/frame-${String(index).padStart(4,'0')}.webp`;
    let response = await fetch(url, {cache:'force-cache'});
    // A failed preview request can itself be cached. Retry failures against
    // the server rather than reusing an old 404 after a film is published.
    if (!response.ok) response = await fetch(url, {cache:'reload'});
    if (!response.ok) throw new Error('Frame unavailable');
    const blob = await response.blob();
    if ('createImageBitmap' in window) {
      const edge = Math.min(1440,Math.ceil(Math.max(canvas.width,canvas.height)) || 1440);
      return createImageBitmap(blob,{resizeWidth:edge,resizeHeight:edge,resizeQuality:'high'});
    }
    return new Promise((resolve,reject) => {const img = new Image(), url = URL.createObjectURL(blob); img.onload=() => {URL.revokeObjectURL(url); resolve(img);}; img.onerror=() => {URL.revokeObjectURL(url); reject(new Error('Frame decode failed'));}; img.src=url;});
  }
  function pumpFilmQueue() {
    while (filmLoads < 3 && filmQueue.length) {
      const index = filmQueue.shift();
      if (filmCache.has(index) || filmPending.has(index)) continue;
      filmLoads++; filmPending.add(index);
      loadFilmFrame(index).then(bitmap => {
        filmCache.set(index,bitmap); filmFailures=0;
        if (index === filmTarget || index === filmTarget+1) drawFilm(filmTarget);
        else if (!$('.chapter-model').classList.contains('loaded')) drawFilm(index);
        trimFilmCache();
      }).catch(error => {console.warn(`Chapter frame ${index}: ${error.message}`); if (++filmFailures >= 3) {$('#chapter-retry').hidden=false; $('.chapter-model').classList.add('film-error'); $('.chapter-loading p').textContent='The architectural film could not load.';}})
        .finally(() => {filmLoads--; filmPending.delete(index); pumpFilmQueue();});
    }
  }
  function seekFilm(progress) {
    filmProgress = Math.max(0,Math.min(1,progress));
    filmPosition = filmProgress * (filmCount-1); filmTarget = Math.floor(filmPosition);
    if (!chapterStarted || !filmReady) return;
    if (filmCache.has(filmTarget)) drawFilm(filmTarget);
    // Keep a small decode window rather than holding an entire high-resolution
    // film in memory. New scroll destinations replace stale queued requests.
    filmQueue = [filmTarget];
    for (let distance=1; distance<=5; distance++) {
      for (const index of [filmTarget+distance,filmTarget-distance]) if (index>=0 && index<filmCount) filmQueue.push(index);
    }
    pumpFilmQueue();
  }
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
    canvas.setAttribute('aria-label', `Architectural render: ${chapter.level}`);
    $('#chapter-panel').setAttribute('aria-labelledby',`chapter-tab-${index}`);
    $$('[data-chapter]').forEach(button => {const selected = Number(button.dataset.chapter) === index; button.setAttribute('aria-selected',String(selected)); button.tabIndex = selected ? 0 : -1;});
    $('#chapter-photo').src = `./assets/residence/photo-${chapter.photo}.jpg`; $('#chapter-photo').alt = chapter.caption;
    $('#chapter-photo-button').dataset.photo = chapter.photo; $('#chapter-photo-button').dataset.caption = chapter.caption;
    $('.chapter-progress i').style.width = `${(index + 1) * 25}%`;
    if (!chapterTrigger) seekFilm((index+.3)/4);
    if (hasMotion && !reduced) {
      gsap.fromTo('.chapter-copy', {y:12, opacity:.5}, {y:0, opacity:1, duration:.5, overwrite:true});
      gsap.fromTo('.chapter-photo', {y:22, rotation:-3, opacity:.4}, {y:0, rotation:3, opacity:1, duration:.75, ease:'power2.out', overwrite:true});
    }
  }
  async function startChapter() {
    if (chapterStarted) return;
    chapterStarted = true;
    $('#chapter-retry').hidden = true;
    try {
      const response = await fetch('./assets/residence/chapters/manifest.json');
      if (!response.ok) throw new Error('Film unavailable');
      const manifest = await response.json(); filmCount=manifest.frames; filmReady=true;
      seekFilm(filmProgress);
    } catch {chapterStarted=false; filmReady=false; $('#chapter-retry').hidden=false; $('.chapter-loading p').textContent='The architectural film could not load.';}
  }
  $('#chapter-retry').addEventListener('click', () => {chapterStarted=false; filmFailures=0; startChapter();});
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {if (entries.some(entry => entry.isIntersecting)) {startChapter(); observer.disconnect();}}, {rootMargin:'900px'});
    observer.observe($('#floors'));
  } else startChapter();
  function goChapter(index) {
    startChapter();
    if (chapterTrigger) scrollTo(chapterTrigger.start + (chapterTrigger.end - chapterTrigger.start) * ((index + .3) / 4));
    else {setChapter(index); scrollTo($('#floors'));}
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
  $$('[data-atlas-link]').forEach(button => button.addEventListener('click',()=>{window.dispatchEvent(new CustomEvent('angora:floor',{detail:Number(button.dataset.atlasLink)}));scrollTo($('#atlas'),{offset:-60});}));
  setChapter(0, true);

  const allGallery=[...window.ANGORA_ATLAS.photos].sort((a,b)=>(a.outdoor?0:a.floor+1)-(b.outdoor?0:b.floor+1)||a.id-b.id);
  let gallery=allGallery;
  const track = $('.gallery-track');
  let galleryIndex = 0;
  function renderGallery(filter='all'){
  gallery=allGallery.filter(point=>filter==='all'||(filter==='outdoor'?point.outdoor:!point.outdoor&&point.floor===Number(filter)));
  track.replaceChildren();track.scrollLeft=0;galleryIndex=0;
  gallery.forEach((point, index) => {
    const id=String(point.id).padStart(2,'0'),caption=point.en.replace('Basement ·','Garden level ·').replace('Ground floor ·','Entrance level ·').replace('Attic floor ·','Attic level ·');
    const figure = document.createElement('figure'); figure.className = 'gallery-item';
    const button = document.createElement('button'); button.dataset.photo = id; button.dataset.caption = caption; button.setAttribute('aria-label', `Enlarge photograph: ${caption}`);
    const img = document.createElement('img'); img.src = point.url; img.alt = caption; img.loading = 'lazy'; img.width = 1600; img.height = 1200;
    const expand = document.createElement('span'); expand.textContent = '↗'; expand.setAttribute('aria-hidden','true'); button.append(img,expand);
    const figcaption = document.createElement('figcaption'); const label = document.createElement('span'); label.textContent = caption;
    const number = document.createElement('span'); number.textContent = `Photo ${id}`; figcaption.append(label,number); figure.append(button,figcaption); track.append(figure);
  });
  $('#gallery-counter').textContent=`01 / ${gallery.length}`;$('#gallery-prev').disabled=true;$('#gallery-next').disabled=gallery.length<2;
  }
  renderGallery();
  $$('[data-gallery-filter]').forEach(button=>button.addEventListener('click',()=>{renderGallery(button.dataset.galleryFilter);$$('[data-gallery-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));}));
  function galleryGo(delta) {
    const next = Math.max(0, Math.min(gallery.length - 1, galleryIndex + delta));
    track.scrollTo({left:track.children[next].offsetLeft - track.children[0].offsetLeft, behavior:reduced ? 'instant' : 'smooth'});
  }
  $('#gallery-prev').addEventListener('click', () => galleryGo(-1)); $('#gallery-next').addEventListener('click', () => galleryGo(1));
  $('#gallery-prev').disabled = true;
  track.addEventListener('scroll', () => {
    const first = track.children[0].offsetLeft;
    let best = Infinity;
    [...track.children].forEach((figure,index) => {const distance = Math.abs(figure.offsetLeft - first - track.scrollLeft); if (distance < best) {best = distance; galleryIndex = index;}});
    if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 5) galleryIndex = gallery.length - 1;
    $('#gallery-counter').textContent = `${String(galleryIndex + 1).padStart(2,'0')} / ${gallery.length}`;
    $('#gallery-prev').disabled = galleryIndex === 0; $('#gallery-next').disabled = galleryIndex === gallery.length - 1;
  }, {passive:true});
  track.addEventListener('keydown', event => {if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {event.preventDefault(); galleryGo(event.key === 'ArrowRight' ? 1 : -1);}});

  const imageDialog = $('#image-dialog');
  function openDialog(dialog) {returnFocus = document.activeElement; dialog.showModal(); document.body.classList.add('locked'); lenis?.stop();}
  [imageDialog].forEach(dialog => {
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {if (event.target === dialog) {const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();}});
    dialog.addEventListener('close', () => {document.body.classList.remove('locked'); lenis?.start(); returnFocus?.focus({preventScroll:true});});
  });
  document.addEventListener('click', event => {
    const photo = event.target.closest('[data-photo]');
    if (photo) {$('#lightbox-image').src = window.ANGORA_ATLAS.photos.find(point=>point.id===Number(photo.dataset.photo))?.url || `./assets/residence/photo-${photo.dataset.photo}.jpg`; $('#lightbox-image').alt = photo.dataset.caption || ''; $('#lightbox-caption').textContent = photo.dataset.caption || ''; openDialog(imageDialog);}
    const tour = event.target.closest('[data-tour]');
    if (tour) {const url = `./index.html?lang=en&view=${encodeURIComponent(tour.dataset.tour)}`; window.open(url,'_blank','noopener');}
  });

  if (hasMotion && !reduced) {
    const mm = gsap.matchMedia();
    mm.add({desktop:'(min-width:801px)', mobile:'(max-width:800px)'}, context => {
      const mobile = context.conditions.mobile;
      const scrub = (trigger, extra = {}) => ({trigger, start:'top top', end:'bottom bottom', scrub:.75, invalidateOnRefresh:true, ...extra});
      const hero = gsap.timeline({scrollTrigger:scrub('.hero-story')});
      hero.to('.hero-photo', {clipPath:mobile?'inset(9% 5% 12% 5%)':'inset(10% 8% 12% 8%)',duration:.3,ease:'power2.inOut'},.15)
        .to('.hero-photo img',{scale:1.12,duration:1,ease:'none'},0)
        .to('.hero-photo',{clipPath:'inset(0% 0% 0% 0%)',duration:.26,ease:'power2.inOut'},.53)
        .to('.hero-title', {yPercent:-70, opacity:0, duration:.28, ease:'power1.in'}, .04)
        .to('.hero-sides,.hero-bottom', {opacity:0, duration:.2}, .08)
        .fromTo('.hero-arrival', {y:55, opacity:0}, {y:0, opacity:1, duration:.18}, .3)
        .to('.hero-arrival', {y:-50, opacity:0, duration:.18}, .62)
        .to('.hero-curtain', {clipPath:'circle(150% at 50% 110%)', duration:.28, ease:'power2.inOut'}, .72);
      gsap.timeline({scrollTrigger:scrub('.arrival-story')})
        .to('.arrival-frame',{clipPath:mobile?'inset(31% 7% 24% 7%)':'inset(15% 40% 16% 8%)',duration:.4,ease:'power2.inOut'},0)
        .fromTo('.arrival-frame img',{scale:1.08},{scale:1,duration:.6,ease:'none'},0)
        .to('.arrival-caption',{opacity:1,y:-12,duration:.2},.32)
        .fromTo('.arrival-detail',{y:100,rotation:8},{y:0,rotation:-3,opacity:1,duration:.3},.4)
        .to('.arrival-caption,.arrival-detail,.arrival-type',{opacity:0,duration:.15},.78)
        .to('.arrival-frame',{clipPath:'inset(0% 0% 0% 0%)',duration:.25,ease:'power2.inOut'},.75);
      gsap.timeline({scrollTrigger:scrub('.image-flight')})
        .fromTo('.fly-a', {xPercent:-45, yPercent:65, rotation:-12}, {xPercent:mobile ? 65 : 73, yPercent:10, rotation:-4, duration:.65, ease:'none'}, 0)
        .fromTo('.fly-b', {xPercent:50, yPercent:65, rotation:12}, {xPercent:mobile ? -73 : -90, yPercent:-20, rotation:3, duration:.65, ease:'none'}, .04)
        .fromTo('.fly-c', {yPercent:90, rotation:-8}, {yPercent:-165, xPercent:25, rotation:-3, duration:.7, ease:'none'}, .1)
        .to('.flight-type', {yPercent:-12, duration:1, ease:'none'}, 0)
        .to('.fly-a', {xPercent:mobile ? 99 : 125, yPercent:26, scale:mobile ? 2.2 : 2.4, rotation:0, duration:.35, ease:'power2.inOut'}, .65)
        .to('.fly-b,.fly-c,.flight-caption', {opacity:0, duration:.2}, .77);
      const garden = gsap.timeline({scrollTrigger:scrub('.garden-story', {onUpdate:self => setGarden(Math.min(2, Math.floor(self.progress * 3)))})});
      gardenTrigger = garden.scrollTrigger;
      garden.to('.garden-images',{clipPath:mobile?'inset(4% 5% 4% 5%)':'inset(6% 5% 6% 5%)',duration:.2,ease:'power2.inOut'},.02)
        .to('.garden-images',{clipPath:'inset(0% 0% 0% 0%)',duration:.15,ease:'power2.inOut'},.85);
      garden.fromTo('.garden-0', {scale:1.15, xPercent:1}, {scale:1, xPercent:0, duration:.42, ease:'none'}, 0)
        .to('.garden-0', {opacity:0, duration:.07}, .31)
        .to('.garden-1', {opacity:1, duration:.07}, .31)
        .fromTo('.garden-1', {scale:1.13, xPercent:-2}, {scale:1, xPercent:0, duration:.39, ease:'none'}, .32)
        .to('.garden-1', {opacity:0, duration:.07}, .65)
        .to('.garden-2', {opacity:1, duration:.07}, .65)
        .fromTo('.garden-2', {scale:1.15}, {scale:1, duration:.34, ease:'none'}, .66);
      gsap.timeline({scrollTrigger:scrub('.ritual-story')})
        .fromTo('.ritual-a', {yPercent:100, xPercent:-35, rotation:-12}, {yPercent:-50, xPercent:55, rotation:-3, duration:1, ease:'none'}, 0)
        .fromTo('.ritual-b', {yPercent:110, xPercent:30, rotation:14}, {yPercent:-90, xPercent:-50, rotation:4, duration:1, ease:'none'}, 0)
        .fromTo('.ritual-c', {yPercent:140, rotation:-10}, {yPercent:-115, rotation:0, duration:1, ease:'none'}, 0)
        .to('.ritual-scene h2', {yPercent:-12, duration:1, ease:'none'}, 0);
      chapterTrigger = ScrollTrigger.create({...scrub('.chapters'), onUpdate:self => {setChapter(Math.min(3, Math.floor(self.progress * 4))); seekFilm(self.progress);}});
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
