/* Angora 21 — web2. Scroll-driven scenes, one motion language, no scroll locks. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileQuery = matchMedia('(max-width: 800px)');
  const isMobile = () => mobileQuery.matches;
  const touch = matchMedia('(hover: none)').matches || 'ontouchstart' in window;
  const motion = !!(window.gsap && window.ScrollTrigger) && !reduced;
  if (motion) gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add(motion ? 'has-motion' : 'no-motion');
  const EASE = 'expo.out';
  const S = window.ANGORA_STRINGS || {};
  let gardenTrigger = null, galleryTrigger = null;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  /* Photographs: one helper for every responsive variant. */
  const photoName = file => String(file).replace(/\.[a-z]+$/i, '');
  window.AngoraPhoto = {
    src: (file, w = 1200) => `./assets/web2/photos/${photoName(file)}-${w}.webp`,
    srcset: file => [480, 800, 1200, 1600].map(w => `./assets/web2/photos/${photoName(file)}-${w}.webp ${w}w`).join(', ')
  };

  /* Scrolling: smooth on pointer devices, native on touch, never stopped mid-page. */
  let lenis = null;
  if (motion && window.Lenis && !touch) {
    lenis = new Lenis({ duration: .95, smoothWheel: true, syncTouch: false, prevent: node => !!node.closest('dialog, .menu') });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const headerH = () => $('.header').offsetHeight;
  function go(target, { offset = 0, immediate = false } = {}) {
    const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY + offset;
    if (lenis) lenis.scrollTo(top, { duration: immediate ? 0 : 1.3, immediate, easing: t => 1 - Math.pow(1 - t, 4) });
    else window.scrollTo({ top, behavior: immediate || reduced ? 'instant' : 'smooth' });
  }
  window.AngoraGo = go;

  /* Header theme follows the section under it. */
  const header = $('.header'), themed = $$('[data-theme]').filter(el => el !== header);
  function updateHeader() {
    const y = headerH() * .6; let theme = 'dark';
    for (const el of themed) { const r = el.getBoundingClientRect(); if (r.top <= y && r.bottom > y) { theme = el.dataset.theme; } }
    if (!$('#menu').hidden) theme = 'light';
    header.dataset.theme = theme;
  }
  let headerQueued = false;
  addEventListener('scroll', () => { if (headerQueued) return; headerQueued = true; requestAnimationFrame(() => { updateHeader(); headerQueued = false; }); }, { passive: true });
  addEventListener('resize', updateHeader);

  /* Menu */
  const menu = $('#menu'), toggle = $('.menu-toggle');
  let returnFocus = null;
  function openMenu() {
    menu.hidden = false; toggle.setAttribute('aria-expanded', 'true'); header.classList.add('menu-open');
    document.body.classList.add('locked'); lenis?.stop(); returnFocus = document.activeElement;
    if (motion) { gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: .35, ease: 'power2.out', overwrite: true }); gsap.fromTo(menu.querySelectorAll('a'), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .6, stagger: .035, ease: EASE, overwrite: true }); }
    menu.querySelector('a').focus({ preventScroll: true }); updateHeader();
  }
  function closeMenu() {
    if (menu.hidden) return Promise.resolve();
    toggle.setAttribute('aria-expanded', 'false'); header.classList.remove('menu-open');
    const finish = () => { menu.hidden = true; document.body.classList.remove('locked'); lenis?.start(); updateHeader(); };
    if (!motion) { finish(); return Promise.resolve(); }
    return new Promise(r => gsap.to(menu, { opacity: 0, duration: .22, overwrite: true, onComplete: () => { finish(); gsap.set(menu, { clearProps: 'opacity' }); r(); } }));
  }
  toggle.addEventListener('click', () => menu.hidden ? openMenu() : closeMenu().then(() => returnFocus?.focus?.({ preventScroll: true })));
  document.addEventListener('keydown', e => {
    if (menu.hidden) return;
    if (e.key === 'Escape') { closeMenu(); toggle.focus(); }
    if (e.key === 'Tab') { const items = [toggle, ...menu.querySelectorAll('a')], i = items.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); items.at(-1).focus(); } else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); toggle.focus(); } }
  });

  /* Anchor navigation */
  const anchorOffset = id => (['home', 'garden', 'floors', 'gallery', 'contact'].includes(id) ? 0 : -headerH() + 8);
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', async e => {
    const id = link.hash.slice(1), target = document.getElementById(id); if (!target) return;
    e.preventDefault(); await closeMenu();
    history.replaceState(null, '', link.hash);
    if (id === 'floors' && window.AngoraFloors) return window.AngoraFloors.go(0);
    if (id === 'home') return go(0);
    if (id === 'garden' && gardenTrigger) return go(gardenTrigger.start);
    if (id === 'gallery' && galleryTrigger) return go(galleryTrigger.start);
    go(target, { offset: anchorOffset(id) });
  }));
  $('#year').textContent = new Date().getFullYear();
  document.addEventListener('click', e => { const tour = e.target.closest('[data-tour]'); if (tour) window.open(`./index.html?lang=en&view=${encodeURIComponent(tour.dataset.tour)}`, '_blank', 'noopener'); });

  /* Lightbox */
  const dialog = $('#image-dialog');
  function openPhoto(file, caption) {
    const img = $('#lightbox-image'); img.src = window.AngoraPhoto.src(file, 1600); img.srcset = window.AngoraPhoto.srcset(file); img.sizes = '94vw'; img.alt = caption || '';
    $('#lightbox-caption').textContent = caption || ''; returnFocus = document.activeElement;
    dialog.showModal(); document.body.classList.add('locked'); lenis?.stop();
    if (motion) gsap.fromTo(dialog, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .35, ease: 'power3.out', overwrite: true });
  }
  function closePhoto() { if (!dialog.open) return; const done = () => { dialog.close(); gsap?.set?.(dialog, { clearProps: 'all' }); }; motion ? gsap.to(dialog, { opacity: 0, y: 8, duration: .18, onComplete: done }) : done(); }
  dialog.querySelector('.dialog-close').addEventListener('click', closePhoto);
  dialog.addEventListener('cancel', e => { e.preventDefault(); closePhoto(); });
  dialog.addEventListener('click', e => { if (e.target === dialog) closePhoto(); });
  dialog.addEventListener('close', () => { document.body.classList.remove('locked'); lenis?.start(); returnFocus?.focus?.({ preventScroll: true }); });
  let swipeY = null; dialog.addEventListener('touchstart', e => swipeY = e.touches[0].clientY, { passive: true }); dialog.addEventListener('touchend', e => { if (swipeY !== null && Math.abs(e.changedTouches[0].clientY - swipeY) > 80) closePhoto(); swipeY = null; }, { passive: true });
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-photo]'); if (!el) return;
    const id = el.dataset.photo, atlas = window.ANGORA_ATLAS;
    const file = /^\d+$/.test(id) ? atlas?.photos.find(p => p.id === Number(id))?.file : id;
    if (file) openPhoto(file, el.dataset.caption);
  });

  /* Frame player: compressed blobs stay, decoded bitmaps are a small window. */
  class Frames {
    constructor(canvas, { fit = 'cover', background = '#1a3129' } = {}) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false }); this.fit = fit; this.background = background;
      this.blobs = new Map(); this.bitmaps = new Map(); this.limit = isMobile() ? 14 : 26; this.last = null; this.target = null; this.decoding = new Set();
      new ResizeObserver(() => this.resize()).observe(canvas); this.resize();
    }
    resize() { const b = this.canvas.getBoundingClientRect(), r = Math.min(isMobile() ? 2 : 1.5, devicePixelRatio || 1); this.canvas.width = Math.max(1, Math.round(b.width * r)); this.canvas.height = Math.max(1, Math.round(b.height * r)); if (this.last) this.paint(this.last); }
    url(clip, i) { return `${clip.root}/f-${String(i + 1).padStart(3, '0')}.webp`; }
    load(clip, limit = Infinity) {
      if (clip.loading && (clip.loadedLimit === Infinity || limit <= clip.loadedLimit)) return clip.loading;
      clip.loadedLimit = limit; clip.loading = null;
      const seq = [...Array(Math.min(clip.frames, limit)).keys()];
      let active = 0, cursor = 0; const self = this;
      clip.loading = new Promise(resolve => {
        const pump = () => {
          while (active < 4 && cursor < seq.length) {
            const i = seq[cursor++], key = `${clip.id}:${i}`; if (self.blobs.has(key)) continue; active++;
            fetch(self.url(clip, i), { cache: 'force-cache' }).then(r => r.ok ? r.blob() : Promise.reject()).then(b => { self.blobs.set(key, b); if (self.target?.key === key) self.show(clip, i); }).catch(() => { }).finally(() => { active--; cursor < seq.length ? pump() : active === 0 && resolve(); });
          }
          if (cursor >= seq.length && active === 0) resolve();
        }; pump();
      });
      return clip.loading;
    }
    async bitmap(clip, i) {
      const key = `${clip.id}:${i}`; if (this.bitmaps.has(key)) return this.bitmaps.get(key);
      const blob = this.blobs.get(key); if (!blob || this.decoding.has(key)) return null; this.decoding.add(key);
      try { const bmp = await createImageBitmap(blob); this.bitmaps.set(key, bmp); this.trim(); return bmp; } catch { return null; } finally { this.decoding.delete(key); }
    }
    trim() { if (this.bitmaps.size <= this.limit) return; const t = this.target; const far = [...this.bitmaps.keys()].sort((a, b) => this.distance(b, t) - this.distance(a, t)); for (const k of far) { if (this.bitmaps.size <= this.limit) break; if (k === t?.key) continue; this.bitmaps.get(k).close?.(); this.bitmaps.delete(k); } }
    distance(key, t) { if (!t) return 0; const [id, i] = key.split(':'); return id === t.clip.id ? Math.abs(Number(i) - t.i) : 1000; }
    paint(item) {
      const { width: w, height: h } = this.canvas, img = item.bitmap, ctx = this.ctx; ctx.fillStyle = this.background; ctx.fillRect(0, 0, w, h);
      const s = this.fit === 'cover' ? Math.max(w / img.width, h / img.height) : Math.min(w / img.width, h / img.height);
      ctx.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s); this.last = item;
    }
    async show(clip, i) {
      i = clamp(Math.round(i), 0, clip.frames - 1); const key = `${clip.id}:${i}`; this.target = { clip, i, key };
      let bmp = this.bitmaps.get(key) || await this.bitmap(clip, i);
      if (!bmp) { const near = [...this.bitmaps.keys()].filter(k => k.startsWith(clip.id + ':')).sort((a, b) => Math.abs(Number(a.split(':')[1]) - i) - Math.abs(Number(b.split(':')[1]) - i))[0]; if (near) bmp = this.bitmaps.get(near); }
      if (this.target.key !== key) return; if (bmp) this.paint({ clip, i, bitmap: bmp });
      for (const d of [1, -1, 2, -2, 3, -3]) { const j = i + d; if (j >= 0 && j < clip.frames && this.blobs.has(`${clip.id}:${j}`) && !this.bitmaps.has(`${clip.id}:${j}`)) this.bitmap(clip, j); }
    }
  }

  /* Hero: three recorded camera moves, scrubbed, with reading stops between them. */
  const hero = $('.hero'), heroPin = $('.hero-pin'), heroMedia = $('.hero-media'), opening = $('.hero-opening');
  opening.muted = true; const tryPlay = () => opening.play().catch(() => { });
  if (!reduced) { opening.src = isMobile() ? opening.dataset.srcMobile : opening.dataset.srcDesktop; opening.preload = 'auto'; opening.addEventListener('canplay', tryPlay, { once: true }); opening.load(); tryPlay(); opening.addEventListener('ended', () => opening.classList.add('is-done')); }
  const CLIPS = ['approach', 'orbit', 'garden-return'].map(id => ({ id, frames: 41, root: `./assets/web2/films/${id}/${isMobile() ? 'm' : 'd'}` }));
  const heroCanvas = $('.hero-canvas'), captions = $$('.hero-caption'), trackButtons = $$('.hero-track button');
  const HOLD = .12, SEG = .3, END = .9;
  function heroState(p) {
    if (p >= END) return { clip: 2, frame: 40, local: 1, index: 2, ending: (p - END) / (1 - END) };
    const t = p / SEG, index = Math.min(2, Math.floor(t)), local = t - index, move = clamp((local - HOLD) / (1 - 2 * HOLD));
    return { clip: index, frame: move * 40, local, index, ending: 0 };
  }
  if (motion) {
    const player = new Frames(heroCanvas, { fit: 'cover' });
    const whenReady = () => player.load(CLIPS[0], 12);
    if (document.readyState === 'complete') whenReady(); else addEventListener('load', whenReady, { once: true });
    const loadAll = () => { player.load(CLIPS[0]); removeEventListener('wheel', loadAll); removeEventListener('touchstart', loadAll); removeEventListener('keydown', loadAll); };
    addEventListener('wheel', loadAll, { passive: true }); addEventListener('touchstart', loadAll, { passive: true }); addEventListener('keydown', loadAll);
    let shown = -1;
    const apply = p => {
      const s = heroState(p);
      heroPin.classList.toggle('is-scrolling', p > .004);
      player.show(CLIPS[s.clip], s.frame);
      if (s.clip >= 1) player.load(CLIPS[1]); if (s.clip >= 1 && s.local > .5 || s.clip === 2) player.load(CLIPS[2]);
      const stop = s.ending > 0 ? 2 : (s.local >= .86 ? s.index : (s.local <= HOLD && s.index > 0 ? s.index - 1 : -1));
      if (stop !== shown) { captions.forEach((c, i) => c.classList.toggle('is-on', i === stop)); shown = stop; }
      trackButtons.forEach((b, i) => { b.setAttribute('aria-current', String(i === s.index)); b.querySelector('i').style.transform = `scaleX(${i < s.index ? 1 : i === s.index ? s.local : 0})`; });
      gsap.set('.hero-title', { autoAlpha: 1 - clamp(p / .05), y: -clamp(p / .05) * 24 });
      const e = gsap.parseEase('power2.inOut')(s.ending), inset = isMobile() ? 6 : 8;
      heroMedia.style.clipPath = `inset(${(e * inset * 1.4).toFixed(2)}% ${(e * inset).toFixed(2)}% ${(e * inset * 1.4).toFixed(2)}% ${(e * inset).toFixed(2)}%)`;
      heroPin.style.backgroundColor = e > 0 ? gsap.utils.interpolate('#223e35', '#efede6', e) : '';
      $('.hero-shade').style.opacity = String(1 - e); hero.dataset.theme = e > .5 ? 'light' : 'dark';
      $('.hero-track').style.opacity = String(p > .004 ? 1 - e : 0); $('.hero-captions').style.opacity = String(1 - clamp(s.ending * 2));
    };
    const trigger = ScrollTrigger.create({ trigger: hero, start: 'top top', end: () => `bottom-=${innerHeight} bottom`, scrub: .35, onUpdate: self => apply(self.progress), snap: { snapTo: [0, .3, .6, .9], directional: false, duration: { min: .25, max: .8 }, delay: .08, ease: 'power2.inOut' } });
    window.AngoraHero = { reset: () => go(0, { immediate: true }) };
    trackButtons.forEach(b => b.addEventListener('click', () => { const p = Number(b.dataset.heroStop) * SEG; go(trigger.start + (trigger.end - trigger.start) * p); }));
    window.AngoraHeroTrigger = trigger;
    apply(0);
  } else { heroPin.classList.remove('is-scrolling'); }

  /* Reveals: one family. Lines rise through a mask, blocks fade, frames open. */
  function splitLines(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => { const f = document.createDocumentFragment(); node.textContent.split(/(\s+)/).forEach(w => { if (!w.trim()) { f.append(document.createTextNode(w)); return; } const o = document.createElement('span'), i = document.createElement('span'); o.className = 'w'; i.textContent = w; o.append(i); f.append(o); }); node.replaceWith(f); });
    el.classList.add('is-split');
  }
  if (motion) {
    $$('[data-reveal="lines"]').forEach(el => { splitLines(el); gsap.fromTo(el.querySelectorAll('.w>span'), { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: .05, ease: EASE, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }); });
    $$('[data-reveal="fade"]').forEach(el => gsap.fromTo(el, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
    $$('[data-reveal="frame"]').forEach(el => gsap.fromTo(el, { clipPath: 'inset(10% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: EASE, scrollTrigger: { trigger: el, start: 'top 86%', once: true } }));
    $$('img[data-parallax]').forEach(img => gsap.fromTo(img, { yPercent: -6, scale: 1.14 }, { yPercent: 6, scale: 1.14, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: .3 } }));
  } else { $$('[data-reveal="lines"]').forEach(el => el.classList.add('is-split')); }

  /* Rooms and kitchens: progress follows the travelling column. */
  $$('.strip').forEach(section => {
    const track = section.querySelector('.strip-track'), bar = section.querySelector('.strip-progress i');
    const fromScroll = () => { const max = track.scrollWidth - track.clientWidth; bar.style.transform = `scaleX(${max > 0 ? clamp(track.scrollLeft / max) : 1})`; };
    track.addEventListener('scroll', fromScroll, { passive: true });
    if (motion) ScrollTrigger.create({ trigger: track, start: 'top 70%', end: 'bottom 60%', scrub: .3, onUpdate: self => { if (!isMobile()) bar.style.transform = `scaleX(${self.progress})`; } });
    track.addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); track.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * track.clientWidth * .86, behavior: 'smooth' }); } });
  });

  /* Garden: each photograph opens from below, copy changes at the stops. */
  const gardens = S.gardens || [
    ['01 / Your own water', 'A pool, all to yourself.', 'The private pool sits at the same level as the lower living floor. Open the doors, cross the terrace and the day moves outside.'],
    ['02 / A place in the shade', 'Stay a little longer.', 'A covered terrace makes room for unhurried lunches, quiet mornings and long evenings. It connects the garden-level rooms with the pool and outdoor dining area.'],
    ['03 / Room to breathe', 'A garden with its own rhythm.', 'Approximately 900 m² of private garden surrounds the residence. Mature planting, lawn and paths create different places to sit, play and spend time outdoors.']
  ];
  const gardenPhotos = $$('.garden-photo'), gardenTabs = $$('[data-garden]'); let gardenIndex = -1;
  function setGarden(i) {
    if (i === gardenIndex) return; gardenIndex = i; const [n, t, c] = gardens[i];
    const swap = () => { $('#garden-number').textContent = n; $('#garden-title').textContent = t; $('#garden-text').textContent = c; };
    gardenTabs.forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.garden) === i)));
    if (!motion) { swap(); gardenPhotos.forEach((p, k) => p.style.clipPath = k <= i ? 'inset(0)' : 'inset(100% 0 0 0)'); return; }
    gsap.timeline().to('.garden-copy', { autoAlpha: 0, y: 8, duration: .2, overwrite: true }).call(swap).to('.garden-copy', { autoAlpha: 1, y: 0, duration: .5, ease: EASE });
  }
  if (motion) {
    const windows = [[.3, .5], [.65, .85]];
    gardenTrigger = ScrollTrigger.create({ trigger: '.garden', start: 'top top', end: () => `bottom-=${innerHeight} bottom`, scrub: .3, onUpdate: self => {
      const p = self.progress;
      gardenPhotos.forEach((photo, k) => { if (k === 0) { photo.style.transform = `scale(${1.06 - .06 * clamp(p / .3)})`; return; } const [a, b] = windows[k - 1], r = gsap.parseEase('power2.inOut')(clamp((p - a) / (b - a))); photo.style.clipPath = `inset(${((1 - r) * 100).toFixed(2)}% 0 0 0)`; photo.style.transform = `scale(${1.08 - .08 * r})`; });
      setGarden(p < .42 ? 0 : p < .77 ? 1 : 2);
    } });
    gardenTabs.forEach(b => b.addEventListener('click', () => { const p = [.1, .56, .92][Number(b.dataset.garden)]; go(gardenTrigger.start + (gardenTrigger.end - gardenTrigger.start) * p); }));
  } else { setGarden(0); gardenTabs.forEach(b => b.addEventListener('click', () => setGarden(Number(b.dataset.garden)))); }

  /* Four chapters: the isometric cut is scrubbed through three recorded moves. */
  const chapters = S.chapters || [
    { level: 'Garden level', kicker: '1 / The garden floor', title: 'Open the day outside.', copy: 'A living room of approximately 54 m², a separate kitchen and direct access to the garden and pool. An annexe with its own entrance adds space for guests, work or a separate daily routine.', features: ['Living room & kitchen', 'Garden & pool access', 'Guest WC & separate annexe'] },
    { level: 'Entrance level', kicker: '2 / The entrance floor', title: 'The heart of the home.', copy: 'Arrive from the street into the main social floor. A living and dining room of approximately 53 m² connects to a generous enclosed kitchen, utility space and an internally accessible garage.', features: ['Main living & dining room', 'Kitchen, utility space & guest WC', 'Street entrance, garage & balcony'] },
    { level: 'First floor', kicker: '3 / The bedroom floor', title: 'A place for privacy.', copy: 'The principal suite has its own dressing room and en-suite bathroom. Two more bedrooms, a family bathroom and a sitting area bring the private rooms together on one level.', features: ['Principal suite & dressing room', 'Two further bedrooms & family bathroom', 'Sitting area, balcony & lift access'] },
    { level: 'Attic level', kicker: '4 / The attic floor', title: 'Room for another rhythm.', copy: 'Under the pitched roof, a sitting room, two bedrooms, a kitchenette and a bathroom create an additional living arrangement. A place for guests, grown children or a quieter working day, reached by the staircase.', features: ['Sitting room & two bedrooms', 'Kitchenette & bathroom', 'Stair access; lift stops below'] }
  ];
  const floorsSection = $('.floors'), floorTabs = $$('[data-floor]'), floorStill = $('.floors-still'); let floorIndex = -1;
  function setFloor(i, animate = true) {
    if (i === floorIndex) return; floorIndex = i; const c = chapters[i];
    const swap = () => { $('#floor-kicker').textContent = c.kicker; $('#floor-title').textContent = c.title; $('#floor-copy').textContent = c.copy; $('#floor-features').replaceChildren(...c.features.map(t => { const li = document.createElement('li'); li.textContent = t; return li; })); $('#floor-level').textContent = c.level; };
    floorTabs.forEach(b => { const on = Number(b.dataset.floor) === i; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    $('.floors-progress i').style.width = `${(i + 1) * 25}%`; $('#floor-plan-link').dataset.atlasFloor = i;
    floorStill.src = `./assets/web2/chapters/iso-${i}-1440.webp`; floorStill.srcset = `./assets/web2/chapters/iso-${i}-800.webp 800w, ./assets/web2/chapters/iso-${i}-1440.webp 1440w`;
    if (motion && animate) gsap.timeline().to('.floors-text', { autoAlpha: 0, y: 6, duration: .18, overwrite: true }).call(swap).to('.floors-text', { autoAlpha: 1, y: 0, duration: .5, ease: EASE }); else swap();
  }
  const FLOOR_CLIPS = [1, 2, 3].map(i => ({ id: `level-${i}`, frames: 22, root: `./assets/web2/chapters/level-${i}/${isMobile() ? 'm' : 'd'}` }));
  let floorsTrigger = null;
  if (motion) {
    const stage = $('.floors-stage'), player = new Frames($('.floors-canvas'), { fit: 'contain', background: '#ffffff' });
    ScrollTrigger.create({ trigger: floorsSection, start: 'top 160%', once: true, onEnter: () => FLOOR_CLIPS.reduce((p, c) => p.then(() => player.load(c)), Promise.resolve()) });
    floorsTrigger = ScrollTrigger.create({ trigger: floorsSection, start: 'top top', end: () => `bottom-=${innerHeight} bottom`, scrub: .35, snap: { snapTo: [0, 1 / 3, 2 / 3, 1], directional: false, duration: { min: .25, max: .7 }, delay: .08, ease: 'power2.inOut' }, onUpdate: self => {
      const t = self.progress * 3, seg = Math.min(2, Math.floor(t)), local = t - seg, move = clamp((local - .2) / .6);
      const live = self.progress > .002 && self.progress < .998;
      stage.classList.toggle('is-live', live);
      if (live) player.show(FLOOR_CLIPS[seg], move * 21); else floorStill.src = `./assets/web2/chapters/iso-${self.progress < .5 ? 0 : 3}-1440.webp`;
      setFloor(local < .5 ? seg : seg + 1);
    } });
    const goFloor = i => go(floorsTrigger.start + (floorsTrigger.end - floorsTrigger.start) * (i / 3));
    window.AngoraFloors = { go: goFloor };
    floorTabs.forEach(b => { b.addEventListener('click', () => goFloor(Number(b.dataset.floor))); b.addEventListener('keydown', e => { const i = Number(b.dataset.floor); const next = e.key === 'ArrowRight' ? (i + 1) % 4 : e.key === 'ArrowLeft' ? (i + 3) % 4 : e.key === 'Home' ? 0 : e.key === 'End' ? 3 : null; if (next === null) return; e.preventDefault(); goFloor(next); $(`#floor-tab-${next}`).focus({ preventScroll: true }); }); });
    $$('[data-floor-link]').forEach(b => b.addEventListener('click', () => goFloor(Number(b.dataset.floorLink))));
  } else { floorTabs.forEach(b => b.addEventListener('click', () => setFloor(Number(b.dataset.floor), false))); $$('[data-floor-link]').forEach(b => b.addEventListener('click', () => { setFloor(Number(b.dataset.floorLink), false); go(floorsSection); })); }
  setFloor(0, false);
  $('#floor-plan-link').addEventListener('click', e => { e.preventDefault(); window.dispatchEvent(new CustomEvent('angora:floor', { detail: Number($('#floor-plan-link').dataset.atlasFloor || 0) })); go($('#atlas'), { offset: -headerH() + 8 }); });

  /* Gallery: a horizontal scrub on pointer devices, a native carousel on touch. */
  const atlas = window.ANGORA_ATLAS, caption = p => S.lang === 'tr' ? (p.tr || p.en).replace('Bodrum ·', 'Bahçe katı ·') : p.en.replace('Basement ·', 'Garden level ·').replace('Ground floor ·', 'Entrance level ·').replace('Attic level ·', 'Attic level ·').replace('Attic floor ·', 'Attic level ·');
  const exteriors = (S.exteriors || [['angora_28.jpeg', 'The street elevation'], ['angora_24.jpg', 'The private garden & pool'], ['angora_26.jpg', 'The garden-facing elevation'], ['angora_27.jpg', 'The covered terrace & water']]).map(([file, en]) => ({ file, en, tr: en }));
  const byId = id => atlas.photos.find(p => p.id === id);
  const sets = { all: [5, 22, 40, 31, 33, 32, 7, 10].map(byId), outdoor: [exteriors[1], exteriors[0], exteriors[3], exteriors[2]], 0: [2, 5, 1].map(byId), 1: [4, 21, 23].map(byId), 2: [17, 12, 32].map(byId), 3: [7, 9, 15].map(byId) };
  const track = $('.gallery-track'), counter = $('#gallery-counter'), bar = $('.gallery-progress i'); let items = [], index = 0;
  const desktopGallery = () => motion && !isMobile();
  function updateCounter() { counter.textContent = `${String(index + 1).padStart(2, '0')} / ${items.length}`; $('#gallery-prev').disabled = index === 0; $('#gallery-next').disabled = index >= items.length - 1; }
  function fitGallery() { const h = track.clientHeight - 52; if (h > 50) track.style.setProperty('--gallery-w', `${Math.min(innerWidth * .62, h * 1.6)}px`); }
  function renderGallery(key = 'all') {
    items = sets[key]; galleryTrigger?.kill(true); galleryTrigger = null; track.replaceChildren(); window.gsap?.set(track, { clearProps: 'transform' }); track.scrollLeft = 0; index = 0;
    items.forEach((p, i) => { const fig = document.createElement('figure'), btn = document.createElement('button'), img = document.createElement('img'), span = document.createElement('span'), cap = document.createElement('figcaption'); fig.className = 'gallery-item'; btn.type = 'button'; btn.dataset.photo = p.file; btn.dataset.caption = caption(p); btn.setAttribute('aria-label', `${S.enlarge || 'Enlarge'} ${caption(p)}`); img.src = window.AngoraPhoto.src(p.file, 1200); img.srcset = window.AngoraPhoto.srcset(p.file); img.sizes = '(max-width: 800px) 86vw, 62vw'; img.alt = caption(p); img.loading = i < 2 ? 'eager' : 'lazy'; img.decoding = 'async'; img.width = 1600; img.height = 1000; span.textContent = '↗'; btn.append(img, span); cap.textContent = `${String(i + 1).padStart(2, '0')} / ${caption(p)}`; fig.append(btn, cap); track.append(fig); });
    if (desktopGallery()) {
      fitGallery();
      const distance = () => Math.max(0, track.scrollWidth - track.clientWidth);
      galleryTrigger = gsap.to(track, { x: () => -distance(), ease: 'none', scrollTrigger: { trigger: '.gallery', pin: '.gallery-pin', start: 'top top', end: () => `+=${distance() + innerHeight * .15}`, scrub: .3, invalidateOnRefresh: true, onUpdate: self => { bar.style.transform = `scaleX(${self.progress})`; const figs = [...track.children]; const x = self.progress * distance(); index = figs.reduce((best, f, i) => Math.abs(f.offsetLeft - x) < Math.abs(figs[best].offsetLeft - x) ? i : best, 0); updateCounter(); } } }).scrollTrigger;
      ScrollTrigger.refresh();
    }
    updateCounter();
  }
  track.addEventListener('scroll', () => { if (desktopGallery()) return; const figs = [...track.children], x = track.scrollLeft; index = figs.reduce((best, f, i) => Math.abs(f.offsetLeft - track.offsetLeft - x) < Math.abs(figs[best].offsetLeft - track.offsetLeft - x) ? i : best, 0); const max = track.scrollWidth - track.clientWidth; bar.style.transform = `scaleX(${max > 0 ? clamp(x / max) : 1})`; updateCounter(); }, { passive: true });
  function galleryGo(delta) {
    const next = clamp(index + delta, 0, items.length - 1), fig = track.children[next]; if (!fig) return;
    if (galleryTrigger) { const distance = Math.max(1, track.scrollWidth - track.clientWidth), offset = clamp(fig.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft), 0, distance); go(galleryTrigger.start + (galleryTrigger.end - galleryTrigger.start) * (offset / distance)); }
    else track.scrollTo({ left: fig.offsetLeft - track.offsetLeft, behavior: reduced ? 'instant' : 'smooth' });
  }
  $('#gallery-prev').addEventListener('click', () => galleryGo(-1)); $('#gallery-next').addEventListener('click', () => galleryGo(1));
  track.addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); galleryGo(e.key === 'ArrowRight' ? 1 : -1); } });
  $$('[data-gallery-filter]').forEach(b => b.addEventListener('click', () => { if (b.getAttribute('aria-pressed') === 'true') return; $$('[data-gallery-filter]').forEach(o => o.setAttribute('aria-pressed', String(o === b))); const run = () => { renderGallery(b.dataset.galleryFilter); if (galleryTrigger) go(galleryTrigger.start, { immediate: true }); }; if (motion) gsap.to('.gallery-window', { opacity: 0, duration: .15, onComplete: () => { run(); gsap.to('.gallery-window', { opacity: 1, duration: .4 }); } }); else run(); }));
  renderGallery();
  if (motion) new ResizeObserver(() => { if (desktopGallery()) { fitGallery(); ScrollTrigger.refresh(); } }).observe($('.gallery-window'));

  /* Enquiry: compose a WhatsApp message, keep the call link beside it. */
  $('#enquiry').addEventListener('submit', e => {
    e.preventDefault(); const f = new FormData(e.target); const name = (f.get('name') || '').toString().trim(), contact = (f.get('contact') || '').toString().trim(), when = (f.get('when') || '').toString().trim();
    if (!name || !contact) { e.target.querySelector(name ? '[name=contact]' : '[name=name]').focus(); return; }
    const text = S.lang === 'tr' ? `Merhaba, Angora 21 (Hatırlı Sokak, Angora Evleri) için bir görüntüleme randevusu almak istiyorum.\nAd: ${name}\nİletişim: ${contact}${when ? `\nTercih edilen zaman: ${when}` : ''}` : `Hello, I would like to arrange a viewing of Angora 21 (Hatırlı Sokak, Angora Evleri).\nName: ${name}\nContact: ${contact}${when ? `\nPreferred time: ${when}` : ''}`;
    window.open(`https://wa.me/905333048359?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });

  /* Settle measurements after fonts and images. */
  updateHeader();
  if (motion) { document.fonts?.ready.then(() => ScrollTrigger.refresh()); addEventListener('load', () => ScrollTrigger.refresh(), { once: true }); }
  mobileQuery.addEventListener?.('change', () => location.reload());
})();
