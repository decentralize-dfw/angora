// Angora 21 presentation site: one scroll loop, native scrolling, and every
// motion smoothed in the animation layer rather than by hijacking the wheel.
// The 3D module is loaded only when the explore section comes near.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ticks = new Set();
const view = {y: 0, h: innerHeight};
(function loop() {
  view.y = scrollY; view.h = innerHeight;
  for (const fn of ticks) fn();
  requestAnimationFrame(loop);
})();

// --- Preloader: counts while the hero decodes, then the curtain lifts -----
function preloader() {
  const el = $('#preloader');
  if (!el) {html.classList.add('is-ready'); return;}
  html.classList.add('is-loading');
  const count = $('.pre-count', el);
  const hero = $('.hero-img');
  const decoded = Promise.race([
    (hero?.decode ? hero.decode() : Promise.resolve()).catch(() => {}),
    new Promise((r) => setTimeout(r, 2600)),
  ]);
  const t0 = performance.now(), dur = reduced ? 150 : 1400;
  (function tick(now) {
    const p = Math.min(1, (now - t0) / dur);
    if (count) count.textContent = String(Math.round(p * 100)).padStart(3, '0');
    if (p < 1) return requestAnimationFrame(tick);
    decoded.then(() => {
      el.classList.add('is-done');
      html.classList.remove('is-loading');
      html.classList.add('is-ready');
      setTimeout(() => el.remove(), 1500);
    });
  })(t0);
}

// --- Navigation: hides on the way down, returns on the way up -------------
function nav() {
  const bar = $('#nav'), burger = $('.nav-burger'), menu = $('#menu');
  if (!bar) return;
  let last = scrollY, hidden = false;
  ticks.add(() => {
    bar.classList.toggle('is-scrolled', view.y > 40);
    const dy = view.y - last;
    if (Math.abs(dy) < 8) return;
    const h = view.y > 240 && dy > 0 && !html.classList.contains('menu-open');
    if (h !== hidden) {hidden = h; bar.classList.toggle('is-hidden', h);}
    last = view.y;
  });
  const closeMenu = () => {menu?.classList.remove('is-open'); burger?.setAttribute('aria-expanded', 'false'); html.classList.remove('menu-open');};
  burger?.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    html.classList.toggle('menu-open', open);
  });
  addEventListener('keydown', (e) => {if (e.key === 'Escape') closeMenu();});
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const t = id.length > 1 && document.getElementById(id.slice(1));
    if (!t) return;
    e.preventDefault();
    closeMenu();
    const top = t.getBoundingClientRect().top + scrollY - (t.dataset.offset ? +t.dataset.offset : 0);
    scrollTo({top, behavior: reduced ? 'auto' : 'smooth'});
    history.replaceState(null, '', id);
  }));
  const links = new Map($$('.nav-links a[href^="#"]').map((a) => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) {
      links.forEach((a) => a.classList.remove('is-active'));
      links.get(e.target.id)?.classList.add('is-active');
    }
  }, {rootMargin: '-40% 0px -55% 0px'});
  links.forEach((_, id) => {const s = document.getElementById(id); if (s) io.observe(s);});
}

// --- The page's background follows the section under the viewport centre --
function themes() {
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) html.dataset.theme = e.target.dataset.theme;
  }, {rootMargin: '-50% 0px -50% 0px'});
  $$('[data-theme]').forEach((s) => io.observe(s));
}

// --- Reveals: masks, clips and rises, once, as things enter ----------------
function reveals() {
  $$('[data-reveal="lines"]').forEach((b) => $$('.line', b).forEach((l, i) => l.style.setProperty('--i', i)));
  const els = $$('[data-reveal]');
  if (reduced) {els.forEach((e) => e.classList.add('is-in')); return;}
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) {e.target.classList.add('is-in'); io.unobserve(e.target);}
  }, {rootMargin: '0px 0px -10% 0px', threshold: 0.04});
  els.forEach((e) => io.observe(e));
}

// --- Parallax: a smoothed offset from the viewport centre ------------------
function parallax() {
  if (reduced) return;
  const narrow = matchMedia('(max-width: 760px)');
  const items = $$('[data-parallax]').map((el) => ({el, s: +el.dataset.parallax || 0.1, cur: 0, scale: el.tagName === 'IMG' ? ' scale(1.12)' : ''}));
  ticks.add(() => {
    if (narrow.matches) return;
    for (const it of items) {
      const r = it.el.getBoundingClientRect();
      if (r.bottom < -300 || r.top > view.h + 300) continue;
      const c = r.top + r.height / 2 - view.h / 2;
      it.cur = lerp(it.cur, -c * it.s, 0.14);
      it.el.style.transform = `translate3d(0,${it.cur.toFixed(2)}px,0)${it.scale}`;
    }
  });
}

// --- Figures count up when they are seen -----------------------------------
function counters() {
  const io = new IntersectionObserver((es) => {
    for (const e of es) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, dec = (el.dataset.count.split('.')[1] || '').length;
      const fmt = (v) => v.toLocaleString('en-GB', {minimumFractionDigits: dec, maximumFractionDigits: dec});
      const t0 = performance.now(), dur = reduced ? 0 : 1500;
      (function f(now) {
        const p = dur ? Math.min(1, (now - t0) / dur) : 1;
        el.textContent = fmt(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(f); else el.textContent = fmt(end);
      })(t0);
    }
  }, {threshold: 0.5});
  $$('[data-count]').forEach((e) => io.observe(e));
}

// --- Pinned sections: progress 0..1 across a tall track, smoothed ----------
function scrub(track, onProgress) {
  let cur = 0, visible = false;
  new IntersectionObserver(([e]) => {visible = e.isIntersecting;}, {rootMargin: '25% 0px'}).observe(track);
  ticks.add(() => {
    if (!visible) return;
    const r = track.getBoundingClientRect();
    const target = clamp(-r.top / Math.max(1, r.height - view.h), 0, 1);
    cur = reduced ? target : lerp(cur, target, 0.12);
    if (Math.abs(cur - target) < 0.0004) cur = target;
    onProgress(cur, target);
  });
}

// --- The 3D section ---------------------------------------------------------
function explore() {
  const sec = $('#explore');
  if (!sec) return;
  const pin = $('.explore-pin', sec), stage = $('.stage-3d', sec), steps = $$('.step', sec), dots = $$('.stage-rail button', sec);
  const bar = $('.stage-loader i', sec), hint = $('.stage-hint', sec);
  const N = steps.length;
  let api = null, failed = false, lastStep = -1, pending = 0;
  const setStep = (i) => {
    if (i === lastStep) return;
    lastStep = i;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    dots.forEach((d, k) => {d.classList.toggle('is-active', k === i); d.setAttribute('aria-current', k === i ? 'step' : 'false');});
  };
  scrub(pin, (p, target) => {pending = p; api?.setProgress(p); setStep(Math.round(target * (N - 1)));});
  dots.forEach((d, k) => d.addEventListener('click', () => {
    const r = pin.getBoundingClientRect();
    scrollTo({top: scrollY + r.top + (r.height - innerHeight) * (k / (N - 1)) + 2, behavior: reduced ? 'auto' : 'smooth'});
  }));
  const fail = (err) => {failed = true; sec.classList.add('is-3d-failed'); sec.classList.remove('is-3d-loading'); console.warn('[angora] 3D model unavailable:', err);};
  async function boot() {
    if (api || failed) return;
    sec.classList.add('is-3d-loading');
    try {
      const mod = await import('./villa3d.js');
      api = await mod.mountVilla({container: stage, onProgress: (f) => {if (bar) bar.style.transform = `scaleX(${f.toFixed(3)})`;}});
      api.setProgress(pending);
      sec.classList.remove('is-3d-loading');
      sec.classList.add('is-3d-ready');
      stage.addEventListener('villa3d:lost', () => fail('context lost'), {once: true});
    } catch (err) {fail(err);}
  }
  new IntersectionObserver((es, io) => {if (es[0].isIntersecting) {boot(); io.disconnect();}}, {rootMargin: '150% 0px'}).observe(sec);
  let dragging = false, lx = 0;
  stage.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || !api) return;
    dragging = true; lx = e.clientX; stage.setPointerCapture(e.pointerId); hint?.classList.add('is-used');
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    api.addYaw((e.clientX - lx) / innerWidth * Math.PI);
    lx = e.clientX;
  });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) stage.addEventListener(ev, () => {dragging = false;});
}

// --- Horizontal gallery: scroll down, the strip moves across ---------------
function gallery() {
  const sec = $('#gallery');
  if (!sec) return;
  const pin = $('.gallery-pin', sec), track = $('.hgal-track', sec), bar = $('.hgal-progress i', sec);
  const items = $$('.hgal-item', track);
  const narrow = matchMedia('(max-width: 760px)');
  scrub(pin, (p) => {
    if (narrow.matches) {track.style.transform = ''; return;}
    const max = Math.max(0, track.scrollWidth - pin.clientWidth);
    track.style.transform = `translate3d(${(-p * max).toFixed(1)}px,0,0)`;
    if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
    for (const it of items) {
      const r = it.getBoundingClientRect();
      if (r.right < 0 || r.left > innerWidth) continue;
      const c = (r.left + r.width / 2 - innerWidth / 2) / innerWidth;
      const img = it.firstElementChild;
      if (img) img.style.transform = `translate3d(${(c * -7).toFixed(2)}%,0,0) scale(1.14)`;
    }
  });
}

// --- Lightbox over every photograph marked for it ---------------------------
function lightbox() {
  const dlg = $('#lightbox');
  if (!dlg || !dlg.showModal) return;
  const img = $('img', dlg), cap = $('.lb-caption', dlg), num = $('.lb-count', dlg);
  const items = $$('[data-lightbox]');
  let i = 0;
  const show = (k) => {
    i = (k + items.length) % items.length;
    const el = items[i];
    img.src = el.dataset.lightbox || el.currentSrc || el.src;
    img.alt = el.alt || '';
    cap.textContent = el.dataset.caption || el.closest('figure')?.querySelector('figcaption')?.textContent || el.alt || '';
    num.textContent = `${i + 1} / ${items.length}`;
  };
  items.forEach((el, k) => {
    el.style.cursor = 'zoom-in';
    el.addEventListener('click', () => {show(k); dlg.showModal(); html.classList.add('lb-open');});
  });
  $('.lb-prev', dlg)?.addEventListener('click', () => show(i - 1));
  $('.lb-next', dlg)?.addEventListener('click', () => show(i + 1));
  $('.lb-close', dlg)?.addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => {if (e.target === dlg) dlg.close();});
  dlg.addEventListener('close', () => html.classList.remove('lb-open'));
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(i + 1);
    if (e.key === 'ArrowLeft') show(i - 1);
  });
}

// --- Floors: the plan on the left follows the floor being read ------------
function floors() {
  const sec = $('#floors');
  if (!sec) return;
  const tabs = $$('.floor-tabs [data-floor]', sec), spreads = $$('.floor-spread', sec), figure = $('.plan-figure', sec);
  const base = figure?.dataset.planBase || './media/plan-f{i}.svg';
  const cache = {};
  const loadPlan = async (i) => {
    if (cache[i]) return cache[i];
    const url = base.replace('{i}', i);
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(r.status);
      cache[i] = (await r.text()).replace(/<\?xml[^>]*>/, '').replace(/\swidth="\d+"\sheight="\d+"/, '');
    } catch {cache[i] = `<img src="${url}" alt="">`;}
    return cache[i];
  };
  let active = -1, pending = -1;
  async function setPlan(i) {
    if (i === active || i === pending) return;
    pending = i;
    tabs.forEach((t) => t.setAttribute('aria-current', String(+t.dataset.floor === i)));
    const markup = await loadPlan(i);
    if (pending !== i) return;
    if (figure) {
      figure.classList.add('is-switching');
      await new Promise((r) => setTimeout(r, reduced ? 0 : 240));
      if (pending !== i) return;
      figure.innerHTML = markup;
      figure.classList.remove('is-switching');
    }
    active = i; pending = -1;
  }
  // Rows light their rooms on the plan, and rooms light their rows.
  const rowsOf = (i) => $$('[data-room-ids]', spreads.find((s) => +s.dataset.floor === i) || sec);
  const matches = (row, path) => row.dataset.roomIds.split(' ').some((id) => (path.dataset.rooms || '').split(' ').includes(id));
  spreads.forEach((spread) => {
    const i = +spread.dataset.floor;
    $$('[data-room-ids]', spread).forEach((row) => {
      row.addEventListener('mouseenter', () => {if (active === i && figure) $$('.room', figure).forEach((p) => p.classList.toggle('is-hover', matches(row, p)));});
      row.addEventListener('mouseleave', () => {if (figure) $$('.room.is-hover', figure).forEach((p) => p.classList.remove('is-hover'));});
    });
  });
  figure?.addEventListener('mouseover', (e) => {
    const path = e.target.closest('.room');
    if (!path || active < 0) return;
    rowsOf(active).forEach((row) => row.classList.toggle('is-hover', matches(row, path)));
  });
  figure?.addEventListener('mouseleave', () => $$('.room-list li.is-hover', sec).forEach((row) => row.classList.remove('is-hover')));
  tabs.forEach((t) => t.addEventListener('click', () => {
    const target = spreads.find((s) => +s.dataset.floor === +t.dataset.floor);
    if (!target) return;
    const top = target.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
    scrollTo({top, behavior: reduced ? 'auto' : 'smooth'});
  }));
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) setPlan(+e.target.dataset.floor);
  }, {rootMargin: '-30% 0px -55% 0px'});
  spreads.forEach((s) => io.observe(s));
  // phones carry a plan inside each spread instead of the sticky column
  const inlineIo = new IntersectionObserver((es, obs) => {
    for (const e of es) if (e.isIntersecting) {
      const box = e.target; obs.unobserve(box);
      loadPlan(+box.dataset.plan).then((m) => {box.innerHTML = m;});
    }
  }, {rootMargin: '80% 0px'});
  $$('.plan-inline', sec).forEach((b) => inlineIo.observe(b));
  setPlan(0);
  new IntersectionObserver((es, obs) => {if (es[0].isIntersecting) {[1, 2, 3].forEach(loadPlan); obs.disconnect();}}, {rootMargin: '60% 0px'}).observe(sec);
}

// --- The narrated tour, as a plain player -----------------------------------
function audio() {
  const wrap = $('.audio-player');
  if (!wrap) return;
  const a = $('audio', wrap), btn = $('.audio-toggle', wrap), seek = $('.audio-seek', wrap), time = $('.audio-time', wrap);
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  btn.addEventListener('click', () => {a.paused ? a.play() : a.pause();});
  a.addEventListener('play', () => {wrap.classList.add('is-playing'); btn.setAttribute('aria-label', 'Pause the narrated tour');});
  a.addEventListener('pause', () => {wrap.classList.remove('is-playing'); btn.setAttribute('aria-label', 'Play the narrated tour');});
  a.addEventListener('loadedmetadata', () => {time.textContent = `0:00 / ${fmt(a.duration)}`;});
  a.addEventListener('timeupdate', () => {
    if (!a.duration) return;
    seek.value = String(Math.round(a.currentTime / a.duration * 1000));
    time.textContent = `${fmt(a.currentTime)} / ${fmt(a.duration)}`;
  });
  seek.addEventListener('input', () => {if (a.duration) a.currentTime = +seek.value / 1000 * a.duration;});
}

preloader();
nav();
themes();
reveals();
parallax();
counters();
explore();
gallery();
lightbox();
floors();
audio();
