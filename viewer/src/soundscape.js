// Angora'nın sesi: kaydedilmiş müzik yok, sahnenin kendisinden bestelenen sakin
// piyano. VEA'nın ses motorunun matematiği (her sahne bir akor, sesler sahneden
// sahneye kaymayla geçer, motif kendine stereo alanın öbür yanından cevap verir,
// sentezlenmiş salon yankısı, kosinüs geçişler) - ama enstrüman sıcak, keçeli bir
// piyano; makine uğultusu, gürültü dokusu, ped ve tekno vuruş yok.
//
// Uyum kuralı: bütün sahneler TEK tonun (Re majör) içinde kalır. Bölge, yakın
// çevre ve her kat o tonun kendi akorudur (Dmaj9, Gmaj9, Bm9, D6/9, Em9, Aadd9);
// sahne değişince yeni akor eskisinin içinden doğar, hiçbir geçiş ton dışına
// düşmez. Kat yükseldikçe ses de yükselir (bodrum koyu, çatı açık).
//
// Üç senaryo (sol ortadaki seçici):
//   oda    - Odalar: tek tek, aralıklı notalar; her oda kendi akorunda. En sade.
//   isik   - Gün ışığı: yavaş kırık akorlar; akorun rengi saate göre döner
//            (gündüz açık, akşam minör, gece seyrek ve alçak).
//   motif  - Anlatı: villanın dört notalık kendi motifi; her katta o katın
//            akoruna taşınır, değişir, karşı kanaldan yankılanır.
//
// Tarayıcı sesi ancak bir dokunuştan sonra başlatır: ilk basışta yumuşakça
// açılır. Tek hoparlör düğmesi hepsini susturur; seçim hatırlanır.

const NOTE = m => 440 * 2 ** ((m - 69) / 12);
// Re majör, MIDI. Motif bu diziden derece sayarak yürür.
const D_MAJOR = [];
for (let o = 2; o <= 6; o++) for (const pc of [2, 4, 6, 7, 9, 11, 13]) D_MAJOR.push(12 * (o + 1) + pc);
D_MAJOR.sort((a, b) => a - b);

// Sahne akorları: bas (tek, alçak bir piyano notası) + melodi tonları.
export const SCENES = Object.freeze({
  region:       {bass: 38, tones: [57, 61, 62, 64, 66, 69], degree: 0, octave: 0},   // Dmaj9, geniş
  neighborhood: {bass: 43, tones: [59, 62, 66, 67, 69, 74], degree: 3, octave: 0},   // Gmaj9, açık hava
  f0:           {bass: 47, tones: [54, 57, 59, 61, 62, 66], degree: 5, octave: -1},  // Bm9, bodrum: koyu
  f1:           {bass: 38, tones: [62, 64, 66, 69, 71], degree: 0, octave: 0},       // D6/9, giriş: ev
  f2:           {bass: 40, tones: [64, 66, 67, 71, 74], degree: 1, octave: 0},       // Em9, yatak katı
  f3:           {bass: 45, tones: [64, 66, 69, 71, 73, 76], degree: 4, octave: 0},   // Aadd9, çatı: açık (E5'in üstüne çıkmaz)
});
// Akşam rengi: aynı tonun içinde bir üçlü aşağıdaki akor (Re majör -> Si minör ...).
const DUSK_SHIFT = -3;

export const SOUND_PRESETS = Object.freeze({
  oda:   {tr: 'Odalar',    en: 'Rooms'},
  isik:  {tr: 'Gün ışığı', en: 'Daylight'},
  motif: {tr: 'Anlatı',    en: 'Motif'},
});
export const DEFAULT_PRESET = 'oda';
// Villanın motifi, dizi dereceleri: kök, beşli, üçlü, ikili - inen, soran bir cümle.
const MOTIF = [0, 4, 2, 1];

export function sceneKey({view = 'region', walking = false, outdoor = false, tourView = null} = {}) {
  const v = tourView ?? view;
  if (walking && outdoor) return 'neighborhood';
  return SCENES[v] ? v : v === 'building' ? 'f3' : 'region';
}

// Diyatonik kaydırma: tonları dizide `steps` derece taşı (tonun dışına çıkmaz).
function shiftDiatonic(midi, steps) {
  let i = D_MAJOR.indexOf(midi);
  if (i < 0) i = D_MAJOR.findIndex(m => m >= midi);
  return D_MAJOR[Math.max(0, Math.min(D_MAJOR.length - 1, i + steps))];
}

// Sahnenin o anki akoru (senaryo + saat + iç/dış).
export function chordFor(state, preset) {
  const base = SCENES[sceneKey(state)];
  let tones = base.tones, bass = base.bass;
  if (preset === 'isik') {
    const d = state.daylight ?? 1;
    if (d < .25) { tones = base.tones.slice(0, 3).map(m => m - 12 >= 50 ? m - 12 : m); }
    else if (d < .7) { tones = base.tones.map(m => shiftDiatonic(m, DUSK_SHIFT)); bass = shiftDiatonic(bass, DUSK_SHIFT); }
  }
  return {tones, bass};
}

// --- olay üreteci: saf fonksiyon, test ve çevrimdışı render aynı kodu kullanır ---
// rand: [0,1) üreten fonksiyon. Döner: {wait, notes:[{midi, at, vel, pan, len}]}
export function nextPhrase(preset, chord, state, mem, rand = Math.random) {
  const tour = Boolean(state.tourView), inside = state.walking && !state.outdoor;
  const night = (state.daylight ?? 1) < .25;
  const slow = (tour ? 1.5 : 1) * (inside ? 1.2 : 1) * (night ? 1.4 : 1);
  const t = chord.tones, notes = [];
  const near = () => {
    // ses yürütme: son notanın yanından seç (sıçrama yok)
    const last = mem.last ?? t[Math.floor(t.length / 2)];
    let i = t.reduce((b, m, k) => Math.abs(m - last) < Math.abs(t[b] - last) ? k : b, 0);
    i = Math.max(0, Math.min(t.length - 1, i + [-2, -1, -1, 1, 1, 2][Math.floor(rand() * 6)]));
    return t[i];
  };
  const vel = () => (.036 + rand() * .016) * (tour ? .7 : 1) * (inside ? .88 : 1);
  if (preset === 'isik') {
    // yavaş kırık akor: 3-4 nota, alttan üste, aralarında nefes
    const n = 3 + (rand() < .35 ? 1 : 0), start = Math.floor(rand() * Math.max(1, t.length - n + 1));
    const spread = .2 + rand() * .14;
    for (let k = 0; k < n; k++) notes.push({midi: t[Math.min(t.length - 1, start + k)], at: k * spread, vel: vel() * (1 - k * .1), pan: -.25 + k * .17});
    if (rand() < .5) notes.push({midi: chord.bass, at: 0, vel: vel() * .8, pan: -.1});
    mem.last = notes[notes.length - 1].midi;
    return {wait: (5.2 + rand() * 4.2) * slow, notes};
  }
  if (preset === 'motif') {
    mem.count = (mem.count ?? 0) + 1;
    const scene = SCENES[sceneKey(state)];
    if (mem.count % 2 === 1) {
      // motif: sahnenin derecesine taşınır; bazen tersten, bazen eksik, bazen oktav üstü biter
      const root = D_MAJOR.indexOf(62) + scene.degree + 7 * scene.octave;
      let degs = MOTIF.slice();
      const r = rand();
      if (r < .28) degs.reverse(); else if (r < .5) degs = degs.slice(0, 3);
      const gap = .62 + rand() * .12;
      degs.forEach((d, k) => notes.push({midi: D_MAJOR[root + d], at: k * gap * (1 + (k === degs.length - 1 ? .25 : 0)), vel: vel() * (k === 0 ? 1 : .9), pan: -.2}));
      notes.push({midi: chord.bass, at: 0, vel: vel() * .7, pan: 0});
      mem.last = notes[0].midi;
      return {wait: (6.5 + rand() * 3.5) * slow, notes};
    }
    // aradaki cevap: motifin son notası karşı kanalda, daha kısık
    const echo = mem.last ?? t[0];
    notes.push({midi: echo, at: 0, vel: vel() * .55, pan: .4});
    return {wait: (4 + rand() * 3) * slow, notes};
  }
  // oda: tek nota (çoğu zaman), bazen iki adım, nadiren ikili
  const r = rand(), a = near();
  if (r < .58) notes.push({midi: a, at: 0, vel: vel(), pan: (rand() - .5) * .5});
  else if (r < .86) { const b = near(); notes.push({midi: a, at: 0, vel: vel(), pan: -.15}, {midi: b, at: .55 + rand() * .3, vel: vel() * .82, pan: .2}); }
  else { const b = t[Math.min(t.length - 1, t.indexOf(a) + 2)] ?? a; notes.push({midi: a, at: 0, vel: vel() * .9, pan: -.1}, {midi: b, at: .015, vel: vel() * .7, pan: .12}); }
  mem.beat = (mem.beat ?? 0) + 1;
  if (mem.beat % 3 === 0) notes.push({midi: chord.bass, at: -.4, vel: vel() * .75, pan: 0});
  mem.last = notes[notes.length - 1].midi;
  return {wait: (3.4 + rand() * 3.4) * slow, notes};
}

// --- ses motoru ---
// 03.10 ikinci tur (ürün sahibi: "çok techno, alarm gibi"): sabit dalga + üç
// aralıklı osilatör sentez gibi vızıldıyordu, tık sesleri de akorun en tepesinden
// bir oktav yukarıda çınlıyordu. Şimdi:
//   - piyano TOPLAMALI: her harmonik kendi sinüsü, hafif inharmonik (gerçek tel),
//     üst harmonikler çok daha hızlı söner - vuruştan sonra yalnız yumuşak bir
//     temel kalır. Keçe: 14 ms yumuşak vuruş, koyu filtre.
//   - arkada YANKILI AKORLAR: sahnenin akoru, yavaş açılan/kapanan yumuşak
//     sinüs katmanı; sahne değişince sesler yeni akora KAYAR (yeniden vurulmaz),
//     her 14-20 sn'de nefes alır - sabit bir uğultu değil.
//   - tıklar sessiz; geçiş tek yumuşak nota + akor kayması.
export function createSoundEngine(ctx, {output = ctx.destination} = {}) {
  const master = ctx.createGain(); master.gain.value = 0;
  const warmth = ctx.createBiquadFilter(); warmth.type = 'lowpass'; warmth.frequency.value = 3800; warmth.Q.value = .3;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -26; comp.ratio.value = 2.5; comp.knee.value = 16; comp.attack.value = .03; comp.release.value = .5;
  master.connect(warmth); warmth.connect(comp); comp.connect(output);
  // salon yankısı: sönen gürültü, kuyruk zamanla kararır (sıcak oda)
  const secs = 4.2, len = Math.floor(ctx.sampleRate * secs), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch); let lp = 0;
    for (let i = 0; i < len; i++) {
      const p = i / len, k = .4 - .34 * p;
      lp += k * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * Math.pow(1 - p, 2.3) * (i < ctx.sampleRate * .02 ? i / (ctx.sampleRate * .02) : 1);
    }
  }
  const verb = ctx.createConvolver(); verb.buffer = ir;
  const wet = ctx.createGain(); wet.gain.value = .62;
  const dry = ctx.createGain(); dry.gain.value = .62;
  const delay = ctx.createDelay(1.5); delay.delayTime.value = .62;
  const fb = ctx.createGain(); fb.gain.value = .32;
  const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 1300;
  const send = ctx.createGain(); send.gain.value = .2;
  const bus = ctx.createGain();
  bus.connect(dry); dry.connect(master);
  bus.connect(verb); verb.connect(wet); wet.connect(master);
  bus.connect(send); send.connect(delay); delay.connect(dlp); dlp.connect(fb); fb.connect(delay); dlp.connect(verb); dlp.connect(master);

  const PARTIALS = [[1, 1], [2, .34], [3, .13], [4, .06], [5, .028], [6, .014]];
  function piano(midi, t0, vel, pan = 0, len = null) {
    const f = NOTE(midi);
    const dur = len ?? Math.max(2.8, Math.min(9, 4 + (70 - midi) * .11));
    const out = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    if (out.pan) out.pan.value = Math.max(-1, Math.min(1, pan));
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = .2;
    lp.frequency.value = Math.min(2600, 500 + f * 2.4);
    lp.connect(out); out.connect(bus);
    const nodes = [];
    PARTIALS.forEach(([k, a], idx) => {
      const fk = f * k * Math.sqrt(1 + .00032 * k * k);
      if (fk > 5000) return;
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = fk;
      if (idx === 0) o.detune.value = .7;
      const g = ctx.createGain(), peak = vel * a, tau = dur / (3.4 + (k - 1) * 2.2);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + .014);
      g.gain.setTargetAtTime(0, t0 + .014, tau);
      o.connect(g); g.connect(lp);
      o.start(t0); o.stop(t0 + dur + .4);
      nodes.push(o, g);
    });
    nodes[0].onended = () => {for (const n of nodes) n.disconnect(); lp.disconnect(); out.disconnect();};
  }

  // Yankılı akor katmanı: 4 ses, yavaş nefes, kayarak akor değiştirir.
  const padBus = ctx.createGain(); padBus.gain.value = 0;
  const padLp = ctx.createBiquadFilter(); padLp.type = 'lowpass'; padLp.frequency.value = 820; padLp.Q.value = .3;
  padBus.connect(padLp); padLp.connect(bus);
  const breath = ctx.createOscillator(), breathAmt = ctx.createGain();
  breath.frequency.value = 1 / 17; breathAmt.gain.value = 0;
  breath.connect(breathAmt); breathAmt.connect(padBus.gain); breath.start();
  const padVoices = [];
  for (let i = 0; i < 4; i++) {
    const g = ctx.createGain(); g.gain.value = [.5, .34, .28, .18][i];
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    if (pan.pan) pan.pan.value = [-.35, .3, -.1, .4][i];
    const oscs = [-3, 3].map(c => {const o = ctx.createOscillator(); o.type = 'sine'; o.detune.value = c; o.connect(g); o.start(); return o;});
    g.connect(pan); pan.connect(padBus);
    padVoices.push(oscs);
  }
  let padLevel = 0;
  function pad(midis, glideSecs = 3.5, now = ctx.currentTime) {
    padVoices.forEach((oscs, i) => {
      const m = midis[i % midis.length];
      for (const o of oscs) {
        if (!o._set) {o.frequency.setValueAtTime(NOTE(m), now); o._set = true;}
        else o.frequency.setTargetAtTime(NOTE(m), now, glideSecs / 3);
      }
    });
  }
  function padTo(levelTo, secs = 4, now = ctx.currentTime) {
    padLevel = levelTo;
    padBus.gain.cancelScheduledValues(now);
    padBus.gain.setValueAtTime(padBus.gain.value, now);
    padBus.gain.linearRampToValueAtTime(levelTo, now + secs);
    breathAmt.gain.setTargetAtTime(levelTo * .55, now, secs / 2);   // nefes: sabit uğultu değil
  }
  function level(to, secs = 1.6) {
    const now = ctx.currentTime, N = 24, curve = new Float32Array(N), from = master.gain.value;
    for (let i = 0; i < N; i++) curve[i] = from + (to - from) * (.5 - .5 * Math.cos(Math.PI * i / (N - 1)));
    try {master.gain.cancelScheduledValues(now); master.gain.setValueCurveAtTime(curve, now, secs);}
    catch {master.gain.linearRampToValueAtTime(to, now + secs);}
  }
  return {piano, pad, padTo, level, master, bus, get padLevel() {return padLevel;}};
}

// Akor katmanının notaları: bas bir oktav yukarıda + akorun alt üç tonu, orta-alçak kayıtta.
export function padChord(chord) {
  const fold = m => {while (m > 64) m -= 12; while (m < 45) m += 12; return m;};
  return [fold(chord.bass + 12), ...chord.tones.slice(0, 3).map(fold)];
}
const PAD_LEVEL = .011, PAD_TOUR = .007;
const MASTER = .9, TOUR_MASTER = .62;

// Yakın çevrede kuşlar (ürün sahibi: "kuş sesleri iyiydi"): bahar öğleden
// sonrası kaydı, seviyesi ölçülüp kısık bir hedefe çekilir, kendiyle çapraz
// geçerek döner. Yalnız dışarıda ve gündüz.
const BIRDS_FILE = 'AMBHome-Peaceful_spring_afte-Elevenlabs.mp3', BIRDS_DB = -43;
function birdsWanted(state) {
  const outside = state.tourView ? state.tourView === 'neighborhood' : state.walking ? state.outdoor : state.view === 'neighborhood';
  return outside && (state.daylight ?? 1) > .2;
}

export function createSoundscape({buttons = [], root = document, storage, audioRoot = null, Context = globalThis.AudioContext ?? globalThis.webkitAudioContext} = {}) {
  let enabled = true, ctx = null, engine = null, unlocked = false, timer = null, nextAt = 0;
  if (storage === undefined) try {storage = globalThis.localStorage;} catch {}
  try {enabled = storage?.getItem('angora.sound') !== 'off';} catch {}
  let preset = DEFAULT_PRESET;
  try {const p = storage?.getItem('angora.sound-preset'); if (SOUND_PRESETS[p]) preset = p;} catch {}
  let state = {view: 'region', daylight: 1};
  const mem = {};
  const chord = () => chordFor(state, preset);
  const running = () => enabled && ctx && ctx.state === 'running' && !root.hidden;

  // kuşlar
  let birdsBuffer = null, birdsLoading = null, birds = null;
  function loadBirds() {
    if (birdsBuffer || birdsLoading || !audioRoot) return birdsLoading;
    birdsLoading = fetch(new URL(encodeURIComponent(BIRDS_FILE), audioRoot)).then(r => r.ok ? r.arrayBuffer() : null)
      .then(data => data && new Promise((res, rej) => ctx.decodeAudioData(data, res, rej)))
      .then(buffer => {
        if (!buffer) return null;
        let sum = 0, n = 0; const d = buffer.getChannelData(0);
        for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i]) > 1e-5) {sum += d[i] * d[i]; n++;}
        buffer._gain = Math.min(60, 10 ** ((BIRDS_DB - 20 * Math.log10(Math.sqrt(sum / Math.max(1, n)) || 1e-6)) / 20));
        return (birdsBuffer = buffer);
      }).catch(() => null);
    return birdsLoading;
  }
  function birdsOn() {
    if (birds || !running()) return;
    const g = ctx.createGain(); g.gain.value = 0; g.connect(engine.master);
    birds = {g, alive: true, timer: null};
    const me = birds;
    Promise.resolve(loadBirds()).then(buffer => {
      if (!buffer || !me.alive) return;
      const target = buffer._gain, FADE = 2.5;
      g.gain.setTargetAtTime(target, ctx.currentTime, 1.2);
      const spawn = (at, offset) => {
        if (!me.alive) return;
        const src = ctx.createBufferSource(), fg = ctx.createGain(); src.buffer = buffer;
        const length = buffer.duration - offset, edge = Math.min(FADE, length / 3);
        fg.gain.setValueAtTime(offset ? 1 : 0, at); if (!offset) fg.gain.linearRampToValueAtTime(1, at + edge);
        fg.gain.setValueAtTime(1, at + length - edge); fg.gain.linearRampToValueAtTime(0, at + length);
        src.connect(fg); fg.connect(g); src.start(at, offset); src.stop(at + length + .05);
        src.onended = () => {src.disconnect(); fg.disconnect();};
        const next = at + length - edge;
        me.timer = setTimeout(() => spawn(Math.max(ctx.currentTime + .05, next), 0), Math.max(0, (next - ctx.currentTime - 1) * 1000));
      };
      spawn(ctx.currentTime + .05, Math.random() * buffer.duration * .5);
    });
  }
  function birdsOff() {
    if (!birds) return;
    const b = birds; birds = null; b.alive = false; clearTimeout(b.timer);
    if (ctx) b.g.gain.setTargetAtTime(0, ctx.currentTime, .9);
    setTimeout(() => b.g.disconnect(), 4000);
  }
  function syncAmbience(glide = 3.5) {
    if (!engine || !unlocked) return;
    engine.pad(padChord(chord()), glide);
    if (enabled) engine.padTo(state.tourView ? PAD_TOUR : PAD_LEVEL, 4);
    if (enabled && birdsWanted(state)) birdsOn(); else birdsOff();
  }

  function schedule() {
    if (!running()) return;
    while (nextAt < ctx.currentTime + .4) {
      const at = Math.max(nextAt, ctx.currentTime + .05);
      const phrase = nextPhrase(preset, chord(), state, mem);
      for (const n of phrase.notes) engine.piano(n.midi, Math.max(ctx.currentTime + .02, at + n.at), n.vel, n.pan, n.len);
      nextAt = at + phrase.wait;
    }
  }
  async function unlock() {
    if (!enabled || !Context) return;
    if (!ctx) {ctx = new Context(); engine = createSoundEngine(ctx);}
    try {if (ctx.state === 'suspended') await ctx.resume();} catch {return;}
    if (ctx.state !== 'running') return;
    if (!unlocked) {
      unlocked = true;
      engine.level(state.tourView ? TOUR_MASTER : MASTER, 3);
      nextAt = ctx.currentTime + 2.5;               // önce akor katmanı açılır, sonra ilk nota
      syncAmbience(0);
    }
    clearInterval(timer); timer = setInterval(schedule, 120);
  }
  const gesture = () => {void unlock();};
  for (const type of ['pointerdown', 'keydown', 'touchend']) root.addEventListener(type, gesture, {capture: true, passive: true});

  const update = () => {for (const b of buttons) b.setAttribute('aria-pressed', String(enabled));};
  update();
  for (const button of buttons) {
    button.disabled = !Context;
    button.addEventListener('click', () => {
      enabled = !enabled; update();
      try {storage?.setItem('angora.sound', enabled ? 'on' : 'off');} catch {}
      if (engine) engine.level(enabled ? (state.tourView ? TOUR_MASTER : MASTER) : 0, .6);
      if (enabled) void unlock().then(() => syncAmbience()); else {clearInterval(timer); timer = null; birdsOff();}
    });
  }
  root.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    try {void (root.hidden ? ctx.suspend() : enabled && unlocked ? ctx.resume() : null)?.catch?.(() => {});} catch {}
  });

  // Geçiş: akor katmanı yeni akora kayar, üstünde tek yumuşak nota.
  function arrive(ms = 950, rising = true) {
    if (!running()) return;
    syncAmbience(Math.max(1.5, ms / 300));
    const c = chord(), m = rising ? c.tones[Math.floor(c.tones.length / 2)] : c.tones[0];
    engine.piano(m, ctx.currentTime + .25, .028, rising ? .15 : -.15);
    nextAt = Math.max(nextAt, ctx.currentTime + 3.2);
  }

  const api = {
    get enabled() {return enabled;},
    get preset() {return preset;},
    set(next) {
      const before = sceneKey(state), wasTour = Boolean(state.tourView), wasBirds = birdsWanted(state), oldChord = JSON.stringify(chord());
      state = {...state, ...next};
      if (engine && unlocked && wasTour !== Boolean(state.tourView)) engine.level(enabled ? (state.tourView ? TOUR_MASTER : MASTER) : 0, 2);
      if (sceneKey(state) !== before) mem.last = undefined;
      if (JSON.stringify(chord()) !== oldChord || wasBirds !== birdsWanted(state) || wasTour !== Boolean(state.tourView)) syncAmbience();
    },
    setPreset(name) {
      if (!SOUND_PRESETS[name]) return;
      preset = name; for (const k of Object.keys(mem)) delete mem[k];
      try {storage?.setItem('angora.sound-preset', name);} catch {}
      void unlock().then(() => arrive(950, true));
    },
    transition(ms = 950, rising = true) {arrive(ms, rising);},
    // Arayüz tıkları sessiz (ürün sahibi: "alarm gibi"); fotoğraf açılınca tek yumuşak orta nota.
    play() {},
    open() {
      if (!running()) return;
      const c = chord(); engine.piano(c.tones[1], ctx.currentTime + .02, .02, .1, 3);
    },
    sting() {}, alert() {}, intro() {},
  };
  return api;
}
