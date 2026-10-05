/* Angora 21 — web2. One gesture plays one complete transition; the page rests only on finished frames. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const S = window.ANGORA_STRINGS || {};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileQuery = matchMedia('(max-width: 800px)');
  const isMobile = () => mobileQuery.matches;
  const touch = matchMedia('(hover: none)').matches || 'ontouchstart' in window;
  const motion = !!(window.gsap && window.ScrollTrigger) && !reduced;
  if (motion) gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add(motion ? 'has-motion' : 'no-motion');
  const EASE = 'expo.out';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* Photographs: one helper for every responsive variant. */
  const photoName = file => String(file).replace(/\.[a-z]+$/i, '');
  window.AngoraPhoto = {
    src: (file, w = 1200) => `./assets/web2/photos/${photoName(file)}-${w}.webp`,
    srcset: file => [480, 800, 1200, 1600].map(w => `./assets/web2/photos/${photoName(file)}-${w}.webp ${w}w`).join(', ')
  };

  /* Scrolling: smooth on pointer devices, native on touch. Scenes hold it only while a transition plays. */
  let lenis = null;
  if (motion && window.Lenis && !touch) {
    lenis = new Lenis({ duration: .9, smoothWheel: true, syncTouch: false, prevent: node => !!node.closest('dialog, .menu') });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const headerH = () => $('.header').offsetHeight;
  const maxScroll = () => document.documentElement.scrollHeight - innerHeight;
  function scrollTo(top, immediate = false) {
    top = clamp(top, 0, maxScroll());
    if (lenis) lenis.scrollTo(top, { immediate, force: true, duration: immediate ? 0 : 1.1 });
    else window.scrollTo({ top, behavior: immediate || reduced ? 'instant' : 'smooth' });
  }
  let travelTween = null;
  function travel(top, duration = .65) {
    return new Promise(resolve => {
      top = clamp(top, 0, maxScroll());
      if (!motion || Math.abs(top - scrollY) < 1) { scrollTo(top, true); resolve(); return; }
      travelTween?.kill();
      const pos = { y: scrollY }, done = () => { travelTween = null; resolve(); };
      travelTween = gsap.to(pos, { y: top, duration, ease: 'power2.inOut', onUpdate: () => scrollTo(pos.y, true), onComplete: done, onInterrupt: done });
    });
  }

  /* Header theme follows the section under it. */
  const header = $('.header'), themed = $$('[data-theme]').filter(el => el !== header);
  function updateHeader() {
    const y = headerH() * .6; let theme = 'dark';
    for (const el of themed) { const r = el.getBoundingClientRect(); if (r.top <= y && r.bottom > y) theme = el.dataset.theme; }
    if (!$('#menu').hidden) theme = 'light';
    header.dataset.theme = theme;
  }
  let headerQueued = false;
  addEventListener('scroll', () => { if (headerQueued) return; headerQueued = true; requestAnimationFrame(() => { updateHeader(); headerQueued = false; }); }, { passive: true });
  addEventListener('resize', updateHeader);

  /* Frame player: compressed frames stay in memory, a clip is decoded right before it plays. */
  class Frames {
    constructor(canvas, { fit = 'cover', background = '#1a3129' } = {}) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false }); this.fit = fit; this.background = background;
      this.blobs = new Map(); this.bitmaps = new Map(); this.decoding = new Map(); this.last = null;
      new ResizeObserver(() => this.resize()).observe(canvas); this.resize();
    }
    resize() { const b = this.canvas.getBoundingClientRect(), r = Math.min(isMobile() ? 2 : 1.5, devicePixelRatio || 1); this.canvas.width = Math.max(1, Math.round(b.width * r)); this.canvas.height = Math.max(1, Math.round(b.height * r)); if (this.last) this.paint(this.last); }
    key(clip, i) { return `${clip.id}:${i}`; }
    url(clip, i) { return `${clip.root}/f-${String(i + 1).padStart(3, '0')}.webp`; }
    load(clip) {
      if (clip.loading) return clip.loading;
      let active = 0, cursor = 0; const self = this;
      clip.loading = new Promise(resolve => {
        const pump = () => {
          while (active < 4 && cursor < clip.frames) {
            const i = cursor++, key = self.key(clip, i); if (self.blobs.has(key)) continue; active++;
            fetch(self.url(clip, i), { cache: 'force-cache' }).then(r => r.ok ? r.blob() : Promise.reject()).then(b => self.blobs.set(key, b)).catch(() => { }).finally(() => { active--; cursor < clip.frames ? pump() : active === 0 && resolve(); });
          }
          if (cursor >= clip.frames && active === 0) resolve();
        }; pump();
      });
      return clip.loading;
    }
    bitmap(clip, i) {
      const key = this.key(clip, i); if (this.bitmaps.has(key)) return Promise.resolve(this.bitmaps.get(key));
      if (this.decoding.has(key)) return this.decoding.get(key);
      const blob = this.blobs.get(key); if (!blob) return Promise.resolve(null);
      const p = createImageBitmap(blob).then(b => { this.bitmaps.set(key, b); return b; }).catch(() => null).finally(() => this.decoding.delete(key));
      this.decoding.set(key, p); return p;
    }
    async ready(clip, ms = 2600) {
      const t0 = Date.now();
      await Promise.race([this.load(clip), wait(ms)]);
      const left = Math.max(250, ms - (Date.now() - t0));
      await Promise.race([Promise.all([...Array(clip.frames).keys()].map(i => this.bitmap(clip, i))), wait(left)]);
    }
    release(clip, keep) { for (const [key, bmp] of this.bitmaps) { if (key.startsWith(clip.id + ':') && key !== this.key(clip, keep)) { bmp.close?.(); this.bitmaps.delete(key); } } }
    paint(item) {
      const { width: w, height: h } = this.canvas, img = item.bitmap, ctx = this.ctx; ctx.fillStyle = this.background; ctx.fillRect(0, 0, w, h);
      const s = this.fit === 'cover' ? Math.max(w / img.width, h / img.height) : Math.min(w / img.width, h / img.height);
      ctx.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s); this.last = item;
    }
    show(clip, i) {
      i = clamp(Math.round(i), 0, clip.frames - 1);
      let bmp = this.bitmaps.get(this.key(clip, i));
      if (!bmp) { let best = Infinity; for (const [key, b] of this.bitmaps) { if (!key.startsWith(clip.id + ':')) continue; const d = Math.abs(Number(key.split(':')[1]) - i); if (d < best) { best = d; bmp = b; } } }
      if (bmp) this.paint({ clip, i, bitmap: bmp });
    }
    async still(clip, i) { await this.load(clip); await this.bitmap(clip, i); this.show(clip, i); }
    play(clip, direction = 1, seconds = .7, onProgress) {
      return new Promise(resolve => {
        const start = performance.now();
        const tick = () => {
          const t = clamp((performance.now() - start) / (seconds * 1000));
          this.show(clip, (direction > 0 ? t : 1 - t) * (clip.frames - 1)); onProgress?.(t);
          if (t < 1) requestAnimationFrame(tick); else resolve();
        };
        requestAnimationFrame(tick);
      });
    }
  }

  /* Scenes: a 100svh section whose gestures are steps. One gesture, one whole transition, no resting in between. */
  class Gate { constructor(quiet = 200) { this.quiet = quiet; this.last = -Infinity; this.busy = false; this.direction = 0; } accept(now, direction) { const fresh = now - this.last > this.quiet || direction !== this.direction; this.last = now; if (this.busy || !fresh) return false; this.busy = true; this.direction = direction; return true; } finish() { this.busy = false; } }
  const scenes = []; let busy = null, navLock = false, pending = Promise.resolve(), touchY = 0, touchConsumed = false, touchFree = false, lastY = scrollY;
  const blocked = () => !!document.querySelector('dialog[open]') || document.body.classList.contains('locked');
  const sceneTop = scene => scene.el.getBoundingClientRect().top + scrollY;
  function activeScene(direction = 1) { if (blocked()) return null; const band = direction < 0 ? .45 : .22; return scenes.find(s => { const r = s.el.getBoundingClientRect(); return r.top <= 24 && r.top > -innerHeight * band && r.bottom > innerHeight * .55; }) || null; }
  // A scene's top edge is a wall. Whatever would carry the page across it (a wheel flurry, smooth-scroll momentum, a fling) stops there, on the first frame.
  function incomingScene(from, to) {
    if (blocked() || !Math.sign(to - from)) return null;
    const lo = Math.min(from, to) - 1, hi = Math.max(from, to) + 1;
    return scenes.map(s => ({ s, top: sceneTop(s) })).filter(({ top }) => top > lo && top < hi && Math.abs(top - from) > 2).sort((a, b) => Math.abs(a.top - from) - Math.abs(b.top - from))[0]?.s || null;
  }
  function hold(scene) { scrollTo(sceneTop(scene), true); lenis?.stop(); }
  function release() { if (!blocked()) lenis?.start(); }
  function run(scene, work) {
    busy = scene; scene.el.dataset.transitioning = 'true';
    pending = Promise.resolve().then(work).catch(e => console.error('Scene transition', e)).finally(() => { scene.el.dataset.transitioning = 'false'; scene.gate.finish(); busy = null; release(); updateHeader(); });
    return pending;
  }
  function arrive(scene, direction) {
    scene.gate.last = performance.now();
    return run(scene, async () => {
      lenis?.stop(); await scene.enter?.(direction);
      const distance = Math.abs(sceneTop(scene) - scrollY);
      if (distance > 1) await travel(sceneTop(scene), Math.min(.55, .22 + distance / innerHeight * .4));
      hold(scene);
    });
  }
  function move(event, direction, goal = null) {
    if (blocked()) return;
    if (busy || navLock) { event.preventDefault(); event.stopImmediatePropagation(); if (busy) busy.gate.last = performance.now(); return; }
    const scene = activeScene(direction);
    if (!scene) {
      const from = scrollY, to = goal ?? from + direction * Math.max(innerHeight * .5, 48);
      const incoming = incomingScene(from, to);
      if (!incoming) return;
      event.preventDefault(); event.stopImmediatePropagation(); travelTween?.kill();
      if (!incoming.gate.accept(performance.now(), direction)) return;
      arrive(incoming, Math.sign(sceneTop(incoming) - from) || direction);
      return;
    }
    event.preventDefault(); event.stopImmediatePropagation(); travelTween?.kill();
    if (!scene.gate.accept(performance.now(), direction)) return;
    // A scene that is not yet aligned uses this gesture to settle on its first frame.
    if (Math.abs(scene.el.getBoundingClientRect().top) > 8) { run(scene, async () => { lenis?.stop(); await travel(sceneTop(scene), .4); hold(scene); }); return; }
    const next = scene.index + direction;
    if (next < 0 || next > scene.steps) {
      const top = sceneTop(scene) + (direction > 0 ? scene.el.offsetHeight : -innerHeight * .75);
      run(scene, async () => { lenis?.stop(); const handled = await scene.exit?.(direction, top); if (!handled) await travel(top, .65); });
      return;
    }
    run(scene, async () => { hold(scene); await scene.transition(scene.index, next); scene.index = next; scene.el.dataset.step = next; });
  }
  if (motion) {
    addEventListener('wheel', e => {
      if (e.ctrlKey || Math.abs(e.deltaY) < 1 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? innerHeight : 1, base = lenis ? lenis.targetScroll : scrollY;
      move(e, Math.sign(e.deltaY), clamp(base + e.deltaY * unit, 0, maxScroll()));
    }, { capture: true, passive: false });
    addEventListener('keydown', e => {
      if (e.target.closest('input,textarea,select,button,a') || e.altKey || e.ctrlKey || e.metaKey) return;
      if (!['PageDown', 'PageUp', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
      const direction = e.key === 'PageUp' || e.key === 'ArrowUp' || (e.key === ' ' && e.shiftKey) ? -1 : 1, step = e.key.startsWith('Arrow') ? 40 : innerHeight * .87;
      move(e, direction, clamp(scrollY + direction * step, 0, maxScroll()));
    }, { capture: true });
    // Safety net for every other way the page can move (a scrollbar drag, a fling): a crossed scene top is still a wall.
    addEventListener('scroll', () => {
      const y = scrollY, from = lastY; lastY = y;
      if (busy || navLock || blocked() || Math.abs(y - from) < 1 || Math.abs(y - from) > innerHeight * 1.2) return;
      const crossed = incomingScene(from, y); if (!crossed) return;
      if (Math.abs(sceneTop(crossed) - y) < 1 && activeScene(Math.sign(y - from))) return;
      arrive(crossed, Math.sign(y - from));
    }, { passive: true });
    const freeTouch = target => !!target.closest?.('.atlas-photo-strip, .atlas-schedule, .strip-track, .gallery-track, dialog, .menu');
    addEventListener('touchstart', e => { touchY = e.touches[0]?.clientY || 0; touchConsumed = false; touchFree = freeTouch(e.target); }, { passive: true });
    addEventListener('touchmove', e => {
      if (blocked() || touchFree) return;
      const delta = touchY - (e.touches[0]?.clientY || touchY);
      if (busy || navLock || activeScene(Math.sign(delta) || 1) || touchConsumed) { e.preventDefault(); return; }
      if (Math.abs(delta) < 35) return;
      if (incomingScene(scrollY, scrollY + delta * 1.6)) { touchConsumed = true; move(e, Math.sign(delta), scrollY + delta * 1.6); }
    }, { passive: false });
    addEventListener('touchend', e => { if (touchFree) return; const delta = touchY - (e.changedTouches[0]?.clientY || touchY); if (!touchConsumed && Math.abs(delta) > 35) move(e, Math.sign(delta), scrollY + delta * 1.6); }, { passive: false });
  }
  function register(el, steps, transition, { enter, exit } = {}) {
    const scene = { el, steps, transition, enter, exit, index: 0, gate: new Gate() }; el.dataset.step = 0; scenes.push(scene);
    scene.go = async target => { target = clamp(target, 0, steps); while (busy) await pending; if (target === scene.index) return; scene.gate.busy = true; return run(scene, async () => { hold(scene); await transition(scene.index, target); scene.index = target; el.dataset.step = target; }); };
    scene.reset = index => { scene.index = clamp(index, 0, steps); el.dataset.step = scene.index; scene.gate.finish(); scene.gate.last = -Infinity; };
    return scene;
  }
  const whenIdle = () => pending;

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
    const finish = () => { menu.hidden = true; document.body.classList.remove('locked'); if (!busy) lenis?.start(); updateHeader(); };
    if (!motion) { finish(); return Promise.resolve(); }
    return new Promise(r => gsap.to(menu, { opacity: 0, duration: .22, overwrite: true, onComplete: () => { finish(); gsap.set(menu, { clearProps: 'opacity' }); r(); } }));
  }
  toggle.addEventListener('click', () => menu.hidden ? openMenu() : closeMenu().then(() => returnFocus?.focus?.({ preventScroll: true })));
  document.addEventListener('keydown', e => {
    if (menu.hidden) return;
    if (e.key === 'Escape') { closeMenu(); toggle.focus(); }
    if (e.key === 'Tab') { const items = [toggle, ...menu.querySelectorAll('a')], i = items.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); items.at(-1).focus(); } else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); toggle.focus(); } }
  });

  /* Lightbox */
  const dialog = $('#image-dialog');
  function openPhoto(file, caption) {
    const img = $('#lightbox-image'); img.src = window.AngoraPhoto.src(file, 1600); img.srcset = window.AngoraPhoto.srcset(file); img.sizes = '94vw'; img.alt = caption || '';
    $('#lightbox-caption').textContent = caption || ''; returnFocus = document.activeElement;
    dialog.showModal(); document.body.classList.add('locked'); lenis?.stop();
    if (motion) gsap.fromTo(dialog, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .35, ease: 'power3.out', overwrite: true });
  }
  function closePhoto() { if (!dialog.open) return; const done = () => { dialog.close(); window.gsap?.set(dialog, { clearProps: 'all' }); }; motion ? gsap.to(dialog, { opacity: 0, y: 8, duration: .18, onComplete: done }) : done(); }
  dialog.querySelector('.dialog-close').addEventListener('click', closePhoto);
  dialog.addEventListener('cancel', e => { e.preventDefault(); closePhoto(); });
  dialog.addEventListener('click', e => { if (e.target === dialog) closePhoto(); });
  dialog.addEventListener('close', () => { document.body.classList.remove('locked'); if (!busy) lenis?.start(); returnFocus?.focus?.({ preventScroll: true }); });
  let swipeY = null; dialog.addEventListener('touchstart', e => swipeY = e.touches[0].clientY, { passive: true }); dialog.addEventListener('touchend', e => { if (swipeY !== null && Math.abs(e.changedTouches[0].clientY - swipeY) > 80) closePhoto(); swipeY = null; }, { passive: true });
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-photo]'); if (!el) return;
    const id = el.dataset.photo, atlas = window.ANGORA_ATLAS;
    const file = /^\d+$/.test(id) ? atlas?.photos.find(p => p.id === Number(id))?.file : id;
    if (file) openPhoto(file, el.dataset.caption);
  });
  document.addEventListener('click', e => { const tour = e.target.closest('[data-tour]'); if (tour) window.open(`./index.html?lang=en&view=${encodeURIComponent(tour.dataset.tour)}`, '_blank', 'noopener'); });
  $('#year').textContent = new Date().getFullYear();

  /* 01 Hero: three recorded camera moves. One gesture plays one of them, forwards or back. */
  const hero = $('.hero'), heroPin = $('.hero-pin'), heroMedia = $('.hero-media'), opening = $('.hero-opening');
  const CLIPS = ['approach', 'orbit', 'garden-return'].map(id => ({ id, frames: 41, root: `./assets/web2/films/${id}/${isMobile() ? 'm' : 'd'}` }));
  const captions = $$('.hero-caption'), trackButtons = $$('.hero-track button');
  opening.muted = true;
  if (!reduced) { opening.src = isMobile() ? opening.dataset.srcMobile : opening.dataset.srcDesktop; opening.preload = 'auto'; opening.playbackRate = 2; opening.load(); opening.play().catch(() => { }); opening.addEventListener('canplay', () => opening.play().catch(() => { }), { once: true }); opening.addEventListener('ended', () => opening.classList.add('is-done')); }
  let heroScene = null;
  function heroUI(step) {
    captions.forEach((c, i) => c.classList.toggle('is-on', i === step - 1));
    trackButtons.forEach((b, i) => { b.setAttribute('aria-current', String(i === step - 1)); b.querySelector('i').style.transform = `scaleX(${i < step ? 1 : 0})`; });
    heroPin.classList.toggle('is-scrolling', step > 0);
    $('#cinema-status')?.remove();
  }
  if (motion) {
    const player = new Frames($('.hero-canvas'), { fit: 'cover' });
    const preload = () => player.load(CLIPS[0]).then(() => player.ready(CLIPS[0])).then(() => player.load(CLIPS[1])).then(() => player.load(CLIPS[2]));
    if (document.readyState === 'complete') preload(); else addEventListener('load', preload, { once: true });
    const HERO_SECONDS = .7;
    heroScene = register(hero, 3, async (from, to) => {
      const step = Math.sign(to - from);
      for (let current = from; current !== to; current += step) {
        const next = current + step, clip = CLIPS[step > 0 ? current : next];
        await player.ready(clip);
        gsap.to('.hero-title', { autoAlpha: 0, y: -16, duration: .25, overwrite: true });
        gsap.to('.hero-caption.is-on', { autoAlpha: 0, y: 8, duration: .18, overwrite: true, onComplete: () => captions.forEach(c => c.classList.remove('is-on')) });
        heroPin.classList.add('is-scrolling'); opening.pause();
        await player.play(clip, step, HERO_SECONDS, t => { const b = trackButtons[step > 0 ? current : next]; if (b) b.querySelector('i').style.transform = `scaleX(${step > 0 ? t : 1 - t})`; });
        player.release(clip, step > 0 ? clip.frames - 1 : 0);
        if (next === 0) { heroPin.classList.remove('is-scrolling'); gsap.set('.hero-caption', { clearProps: 'all' }); gsap.to('.hero-title', { autoAlpha: 1, y: 0, duration: .5, ease: EASE, overwrite: true }); }
        else { gsap.set('.hero-caption', { clearProps: 'all' }); captions.forEach((c, i) => c.classList.toggle('is-on', i === next - 1)); }
        trackButtons.forEach((b, i) => { b.setAttribute('aria-current', String(i === next - 1)); b.querySelector('i').style.transform = `scaleX(${i < next ? 1 : 0})`; });
      }
      // Decode the neighbouring clips now, so the next gesture starts on its first frame.
      if (CLIPS[to]) player.ready(CLIPS[to]); if (to > 0) player.ready(CLIPS[to - 1]);
    }, {
      enter: direction => { if (direction < 0) { gsap.to(heroMedia, { clipPath: 'inset(0% 0% 0% 0%)', duration: .4, ease: 'power2.out' }); gsap.to(heroPin, { backgroundColor: '#223e35', duration: .4 }); $('.hero-shade').style.opacity = '1'; } },
      exit: async (direction, top) => {
        if (direction < 0) return false;
        const inset = isMobile() ? '6% 6% 6% 6%' : '7% 8% 7% 8%';
        await Promise.all([travel(top, .7), new Promise(r => gsap.timeline({ onComplete: r }).to('.hero-caption.is-on, .hero-track', { autoAlpha: 0, y: -8, duration: .25 }, 0).to(heroMedia, { clipPath: `inset(${inset})`, duration: .7, ease: 'power2.inOut' }, 0).to(heroPin, { backgroundColor: '#efede6', duration: .7 }, 0).to('.hero-shade', { opacity: 0, duration: .5 }, 0))]);
        gsap.set('.hero-caption, .hero-track', { clearProps: 'all' }); return true;
      }
    });
    heroScene.restore = () => { gsap.set(heroMedia, { clipPath: 'inset(0% 0% 0% 0%)' }); gsap.set(heroPin, { clearProps: 'backgroundColor' }); $('.hero-shade').style.opacity = '1'; heroScene.reset(0); heroUI(0); gsap.set('.hero-title', { autoAlpha: 1, y: 0 }); opening.currentTime = 0; opening.classList.remove('is-done'); opening.play().catch(() => { }); };
    trackButtons.forEach(b => b.addEventListener('click', () => heroScene.go(Number(b.dataset.heroStop))));
  } else { heroUI(0); }

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

  /* 02 Garden: three photographs. Each gesture opens the next one from below. */
  const gardens = S.gardens || [
    ['01 / Your own water', 'A pool, all to yourself.', 'The private pool sits at the same level as the lower living floor. Open the doors, cross the terrace and the day moves outside.'],
    ['02 / A place in the shade', 'Stay a little longer.', 'A covered terrace makes room for unhurried lunches, quiet mornings and long evenings. It connects the garden-level rooms with the pool and outdoor dining area.'],
    ['03 / Room to breathe', 'A garden with its own rhythm.', 'Approximately 900 m² of private garden surrounds the residence. Mature planting, lawn and paths create different places to sit, play and spend time outdoors.']
  ];
  const gardenPhotos = $$('.garden-photo'), gardenTabs = $$('[data-garden]');
  function gardenCopy(i, animate) {
    const [n, t, c] = gardens[i]; const swap = () => { $('#garden-number').textContent = n; $('#garden-title').textContent = t; $('#garden-text').textContent = c; };
    gardenTabs.forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.garden) === i)));
    if (!motion || !animate) { swap(); return Promise.resolve(); }
    return new Promise(r => gsap.timeline({ onComplete: r }).to('.garden-copy', { autoAlpha: 0, y: 8, duration: .2, overwrite: true }).call(swap).to('.garden-copy', { autoAlpha: 1, y: 0, duration: .5, ease: EASE }));
  }
  let gardenScene = null;
  if (motion) {
    gardenScene = register($('.garden'), 2, async (from, to) => {
      const step = Math.sign(to - from);
      for (let current = from; current !== to; current += step) {
        const next = current + step, photo = gardenPhotos[step > 0 ? next : current];
        const copy = gardenCopy(next, true);
        await new Promise(r => gsap.timeline({ onComplete: r })
          .fromTo(photo, { clipPath: step > 0 ? 'inset(100% 0 0 0)' : 'inset(0% 0 0 0)', scale: step > 0 ? 1.08 : 1 }, { clipPath: step > 0 ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)', scale: step > 0 ? 1 : 1.08, duration: 1, ease: 'power3.inOut' }, 0)
          .fromTo(gardenPhotos[step > 0 ? current : next], { scale: step > 0 ? 1 : 1.04 }, { scale: step > 0 ? 1.04 : 1, duration: 1, ease: 'power2.inOut' }, 0));
        await copy;
      }
    });
    gardenScene.restore = () => { gardenScene.reset(0); gardenPhotos.forEach((p, k) => gsap.set(p, { clipPath: k === 0 ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)', scale: 1 })); gardenCopy(0, false); };
    gardenTabs.forEach(b => b.addEventListener('click', () => gardenScene.go(Number(b.dataset.garden))));
  } else { gardenCopy(0, false); gardenTabs.forEach(b => b.addEventListener('click', () => { const i = Number(b.dataset.garden); gardenPhotos.forEach((p, k) => p.style.clipPath = k <= i ? 'inset(0)' : 'inset(100% 0 0 0)'); gardenCopy(i, false); })); }

  /* 03 Four chapters: the isometric cut. One gesture, one floor. */
  const chapters = S.chapters || [
    { level: 'Garden level', kicker: '1 / The garden floor', title: 'Open the day outside.', copy: 'A living room of approximately 54 m², a separate kitchen and direct access to the garden and pool. An annexe with its own entrance adds space for guests, work or a separate daily routine.', features: ['Living room & kitchen', 'Garden & pool access', 'Guest WC & separate annexe'] },
    { level: 'Entrance level', kicker: '2 / The entrance floor', title: 'The heart of the home.', copy: 'Arrive from the street into the main social floor. A living and dining room of approximately 53 m² connects to a generous enclosed kitchen, utility space and an internally accessible garage.', features: ['Main living & dining room', 'Kitchen, utility space & guest WC', 'Street entrance, garage & balcony'] },
    { level: 'First floor', kicker: '3 / The bedroom floor', title: 'A place for privacy.', copy: 'The principal suite has its own dressing room and en-suite bathroom. Two more bedrooms, a family bathroom and a sitting area bring the private rooms together on one level.', features: ['Principal suite & dressing room', 'Two further bedrooms & family bathroom', 'Sitting area, balcony & lift access'] },
    { level: 'Attic level', kicker: '4 / The attic floor', title: 'Room for another rhythm.', copy: 'Under the pitched roof, a sitting room, two bedrooms, a kitchenette and a bathroom create an additional living arrangement. A place for guests, grown children or a quieter working day, reached by the staircase.', features: ['Sitting room & two bedrooms', 'Kitchenette & bathroom', 'Stair access; lift stops below'] }
  ];
  const floorsSection = $('.floors'), floorTabs = $$('[data-floor]'), floorStill = $('.floors-still'), floorStage = $('.floors-stage'); let floorIndex = -1;
  function setFloor(i, animate = true) {
    if (i === floorIndex) return Promise.resolve(); floorIndex = i; const c = chapters[i];
    const swap = () => { $('#floor-kicker').textContent = c.kicker; $('#floor-title').textContent = c.title; $('#floor-copy').textContent = c.copy; $('#floor-features').replaceChildren(...c.features.map(t => { const li = document.createElement('li'); li.textContent = t; return li; })); $('#floor-level').textContent = c.level; };
    floorTabs.forEach(b => { const on = Number(b.dataset.floor) === i; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    $('.floors-progress i').style.width = `${(i + 1) * 25}%`; $('#floor-plan-link').dataset.atlasFloor = i;
    floorStill.src = `./assets/web2/chapters/iso-${i}-1440.webp`; floorStill.srcset = `./assets/web2/chapters/iso-${i}-800.webp 800w, ./assets/web2/chapters/iso-${i}-1440.webp 1440w`;
    if (!motion || !animate) { swap(); return Promise.resolve(); }
    return new Promise(r => gsap.timeline({ onComplete: r }).to('.floors-text', { autoAlpha: 0, y: 6, duration: .16, overwrite: true }).call(swap).to('.floors-text', { autoAlpha: 1, y: 0, duration: .45, ease: EASE }));
  }
  const FLOOR_CLIPS = [1, 2, 3].map(i => ({ id: `level-${i}`, frames: 22, root: `./assets/web2/chapters/level-${i}/${isMobile() ? 'm' : 'd'}` }));
  let floorsScene = null, atlasScene = null;
  if (motion) {
    const player = new Frames($('.floors-canvas'), { fit: 'contain', background: '#ffffff' });
    ScrollTrigger.create({ trigger: floorsSection, start: 'top 170%', once: true, onEnter: () => FLOOR_CLIPS.reduce((p, c) => p.then(() => player.load(c)), Promise.resolve()) });
    const holdFloor = i => { floorStage.classList.remove('is-live'); setFloor(i, false); };
    floorsScene = register(floorsSection, 3, async (from, to) => {
      const step = Math.sign(to - from);
      for (let current = from; current !== to; current += step) {
        const next = current + step, clip = FLOOR_CLIPS[Math.max(current, next) - 1];
        await player.ready(clip); floorStage.classList.add('is-live');
        let swapped = false;
        await player.play(clip, step, .55, t => { if (t >= .5 && !swapped) { swapped = true; setFloor(next, true); } });
        player.release(clip, step > 0 ? clip.frames - 1 : 0);
        floorStill.src = `./assets/web2/chapters/iso-${next}-1440.webp`;
      }
      if (FLOOR_CLIPS[to]) player.ready(FLOOR_CLIPS[to]); if (FLOOR_CLIPS[to - 1]) player.ready(FLOOR_CLIPS[to - 1]);
    }, {
      enter: direction => { if (direction > 0) { floorsScene.reset(0); holdFloor(0); } },
      exit: async (direction, top) => {
        if (direction < 0 || !atlasScene) return false;
        atlasScene.reset(0); window.AngoraPlan.selectFloor(0);
        await travel(top, .65); hold(atlasScene); return true;
      }
    });
    floorsScene.holdFloor = holdFloor;
    floorsScene.restore = () => { floorsScene.reset(0); holdFloor(0); };
    holdFloor(0);
  } else { setFloor(0, false); }

  /* 04 Plans: one gesture slides one floor sideways, garden level first, the same order as the model. */
  if (motion && window.AngoraPlan) {
    atlasScene = register($('.atlas'), 3, (from, to) => window.AngoraPlan.transition(to), {
      enter: direction => { const floor = direction < 0 ? 3 : 0; atlasScene.reset(floor); window.AngoraPlan.selectFloor(floor); },
      exit: async (direction, top) => {
        if (direction > 0 || !floorsScene) return false;
        floorsScene.reset(3); floorsScene.holdFloor(3);
        await travel(sceneTop(floorsScene), .65); hold(floorsScene); return true;
      }
    });
    atlasScene.restore = () => { atlasScene.reset(0); window.AngoraPlan.selectFloor(0); };
    window.AngoraPlan.navigate = floor => { const go = () => atlasScene.go(Number(floor)); if (Math.abs($('.atlas').getBoundingClientRect().top) > 5) navigate($('.atlas')).then(go); else go(); };
  }
  async function goFloor(i) {
    if (!floorsScene) { setFloor(i, false); travel(sceneTop({ el: floorsSection }), .8); return; }
    if (Math.abs(floorsSection.getBoundingClientRect().top) > 5) await navigate(floorsSection);
    await floorsScene.go(i);
  }
  floorTabs.forEach(b => { b.addEventListener('click', () => goFloor(Number(b.dataset.floor))); b.addEventListener('keydown', e => { const i = Number(b.dataset.floor); const next = e.key === 'ArrowRight' ? (i + 1) % 4 : e.key === 'ArrowLeft' ? (i + 3) % 4 : e.key === 'Home' ? 0 : e.key === 'End' ? 3 : null; if (next === null) return; e.preventDefault(); goFloor(next); $(`#floor-tab-${next}`).focus({ preventScroll: true }); }); });
  $$('[data-floor-link]').forEach(b => b.addEventListener('click', () => goFloor(Number(b.dataset.floorLink))));

  /* Navigation: distant links travel, scenes arrive at their first frame. */
  const sceneFor = el => scenes.find(s => s.el === el);
  async function navigate(target) {
    await closeMenu(); await whenIdle(); navLock = true;
    try {
      const scene = sceneFor(target); lenis?.stop();
      if (scene) { scene.restore?.(); await travel(sceneTop(scene), .9); hold(scene); }
      else await travel(target.getBoundingClientRect().top + scrollY - headerH() + 8, .9);
    } finally { navLock = false; lastY = scrollY; release(); updateHeader(); }
  }
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', async e => {
    if (link.hasAttribute('data-atlas-floor')) return;
    const id = link.hash.slice(1), target = document.getElementById(id); if (!target) return;
    e.preventDefault(); history.replaceState(null, '', link.hash); await navigate(target);
  }));
  window.AngoraGo = target => navigate(typeof target === 'string' ? document.getElementById(target) : target);

  /* 05 Gallery: a horizontal scrub on pointer devices, a native carousel on touch. */
  const atlas = window.ANGORA_ATLAS, caption = p => S.lang === 'tr' ? (p.tr || p.en).replace('Bodrum ·', 'Bahçe katı ·') : p.en.replace('Basement ·', 'Garden level ·').replace('Ground floor ·', 'Entrance level ·').replace('Attic floor ·', 'Attic level ·');
  const exteriors = (S.exteriors || [['angora_28.jpeg', 'The street elevation'], ['angora_24.jpg', 'The private garden & pool'], ['angora_26.jpg', 'The garden-facing elevation'], ['angora_27.jpg', 'The covered terrace & water']]).map(([file, en]) => ({ file, en, tr: en }));
  const byId = id => atlas.photos.find(p => p.id === id);
  const sets = { all: [5, 22, 40, 31, 33, 32, 7, 10].map(byId), outdoor: [exteriors[1], exteriors[0], exteriors[3], exteriors[2]], 0: [2, 5, 1].map(byId), 1: [4, 21, 23].map(byId), 2: [17, 12, 32].map(byId), 3: [7, 9, 15].map(byId) };
  const track = $('.gallery-track'), counter = $('#gallery-counter'), bar = $('.gallery-progress i'); let items = [], galleryTrigger = null, index = 0;
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
    if (galleryTrigger) { const distance = Math.max(1, track.scrollWidth - track.clientWidth), offset = clamp(fig.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft), 0, distance); scrollTo(galleryTrigger.start + (galleryTrigger.end - galleryTrigger.start) * (offset / distance)); }
    else track.scrollTo({ left: fig.offsetLeft - track.offsetLeft, behavior: reduced ? 'instant' : 'smooth' });
  }
  $('#gallery-prev').addEventListener('click', () => galleryGo(-1)); $('#gallery-next').addEventListener('click', () => galleryGo(1));
  track.addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); galleryGo(e.key === 'ArrowRight' ? 1 : -1); } });
  $$('[data-gallery-filter]').forEach(b => b.addEventListener('click', () => { if (b.getAttribute('aria-pressed') === 'true') return; $$('[data-gallery-filter]').forEach(o => o.setAttribute('aria-pressed', String(o === b))); const run = () => { renderGallery(b.dataset.galleryFilter); if (galleryTrigger) scrollTo(galleryTrigger.start, true); }; if (motion) gsap.to('.gallery-window', { opacity: 0, duration: .15, onComplete: () => { run(); gsap.to('.gallery-window', { opacity: 1, duration: .4 }); } }); else run(); }));
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
