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
  f3:           {bass: 45, tones: [69, 71, 73, 76, 78], degree: 4, octave: 0},       // Aadd9, çatı: açık
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
  const vel = () => (.042 + rand() * .022) * (tour ? .7 : 1) * (inside ? .88 : 1);
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
      if (rand() < .22) notes[notes.length - 1].midi += 12;
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
export function createSoundEngine(ctx, {output = ctx.destination} = {}) {
  // Keçeli piyano tınısı: harmonikler hızla incelir; iki tel hafif aralıklı.
  const wave = ctx.createPeriodicWave(new Float32Array(10), new Float32Array([0, 1, .38, .17, .1, .055, .032, .02, .012, .008]));
  const master = ctx.createGain(); master.gain.value = 0;
  const warmth = ctx.createBiquadFilter(); warmth.type = 'lowpass'; warmth.frequency.value = 5200; warmth.Q.value = .3;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -24; comp.ratio.value = 3; comp.knee.value = 14; comp.attack.value = .02; comp.release.value = .4;
  master.connect(warmth); warmth.connect(comp); comp.connect(output);
  // salon yankısı: sönen gürültü, kuyruk zamanla kararır (sıcak oda, metal değil)
  const secs = 3.6, len = Math.floor(ctx.sampleRate * secs), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch); let lp = 0;
    for (let i = 0; i < len; i++) {
      const p = i / len, k = .55 - .45 * p;          // kuyruk ilerledikçe daha koyu
      lp += k * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * Math.pow(1 - p, 2.6) * (i < ctx.sampleRate * .012 ? i / (ctx.sampleRate * .012) : 1);
    }
  }
  const verb = ctx.createConvolver(); verb.buffer = ir;
  const wet = ctx.createGain(); wet.gain.value = .55;
  const dry = ctx.createGain(); dry.gain.value = .7;
  // cevap yankısı: 0,46 sn, kararan geri besleme
  const delay = ctx.createDelay(1); delay.delayTime.value = .46;
  const fb = ctx.createGain(); fb.gain.value = .26;
  const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 1700;
  const send = ctx.createGain(); send.gain.value = .16;
  const bus = ctx.createGain();
  bus.connect(dry); dry.connect(master);
  bus.connect(verb); verb.connect(wet); wet.connect(master);
  bus.connect(send); send.connect(delay); delay.connect(dlp); dlp.connect(fb); fb.connect(delay); dlp.connect(verb);

  function piano(midi, t0, vel, pan = 0, len = null) {
    const f = NOTE(midi);
    const dur = len ?? Math.max(2.4, Math.min(8, 3.4 + (70 - midi) * .1));
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = .5;
    const bright = Math.min(5200, 700 + f * 2.2 + vel * 9000);
    lp.frequency.setValueAtTime(bright, t0);
    lp.frequency.setTargetAtTime(Math.max(260, f * 1.6), t0 + .02, dur * .22);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vel, t0 + .009);           // keçe: yumuşak vuruş
    g.gain.setTargetAtTime(vel * .42, t0 + .009, .16);        // ilk düşüş
    g.gain.setTargetAtTime(0, t0 + .35, dur / 4.2);           // uzun sönüm
    const out = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    if (out.pan) out.pan.value = Math.max(-1, Math.min(1, pan));
    const strings = [0, 1.8, -1.1].map((cents, k) => {
      const o = ctx.createOscillator(); o.setPeriodicWave(wave);
      o.frequency.value = f; o.detune.value = cents;
      const lvl = ctx.createGain(); lvl.gain.value = k ? .35 : .6;
      o.connect(lvl); lvl.connect(lp);
      o.start(t0); o.stop(t0 + dur + .6);
      return {o, lvl};
    });
    lp.connect(g); g.connect(out); out.connect(bus);
    strings[0].o.onended = () => {for (const s of strings) {s.o.disconnect(); s.lvl.disconnect();} lp.disconnect(); g.disconnect(); out.disconnect();};
  }
  function level(to, secs = 1.6) {
    const now = ctx.currentTime, N = 24, curve = new Float32Array(N), from = master.gain.value;
    for (let i = 0; i < N; i++) curve[i] = from + (to - from) * (.5 - .5 * Math.cos(Math.PI * i / (N - 1)));
    try {master.gain.cancelScheduledValues(now); master.gain.setValueCurveAtTime(curve, now, secs);}
    catch {master.gain.linearRampToValueAtTime(to, now + secs);}
  }
  return {piano, level, master};
}

const MASTER = .9, TOUR_MASTER = .62;

export function createSoundscape({buttons = [], root = document, storage, Context = globalThis.AudioContext ?? globalThis.webkitAudioContext} = {}) {
  let enabled = true, ctx = null, engine = null, unlocked = false, timer = null, nextAt = 0, lastClick = -Infinity;
  if (storage === undefined) try {storage = globalThis.localStorage;} catch {}
  try {enabled = storage?.getItem('angora.sound') !== 'off';} catch {}
  let preset = DEFAULT_PRESET;
  try {const p = storage?.getItem('angora.sound-preset'); if (SOUND_PRESETS[p]) preset = p;} catch {}
  let state = {view: 'region', daylight: 1};
  const mem = {};
  const chord = () => chordFor(state, preset);
  const running = () => enabled && ctx && ctx.state === 'running' && !root.hidden;

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
      nextAt = ctx.currentTime + 1.2;               // açılış: bir nefes sessizlik, sonra ilk nota
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
      if (enabled) void unlock(); else {clearInterval(timer); timer = null;}
    });
  }
  root.addEventListener('click', event => {
    const control = event.target.closest?.('button,select,[role=button]');
    if (!control || buttons.includes(control) || control.disabled) return;
    api.play();
  });
  root.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    try {void (root.hidden ? ctx.suspend() : enabled && unlocked ? ctx.resume() : null)?.catch?.(() => {});} catch {}
  });

  // Geçiş: yeni sahnenin akoru kendi içinden açılır - yukarı çıkışta yükselen,
  // inişte alçalan üç nota, kesitin süresine yayılır.
  function arrive(ms = 950, rising = true) {
    if (!running()) return;
    const c = chord(), t0 = ctx.currentTime + .03;
    if (preset === 'motif') {
      const scene = SCENES[sceneKey(state)], rootI = D_MAJOR.indexOf(62) + scene.degree + 7 * scene.octave;
      MOTIF.slice(0, 2).forEach((d, k) => engine.piano(D_MAJOR[rootI + d], t0 + k * .34, .04 * (1 - k * .15), -.2 + k * .4));
    } else {
      const pick = [c.tones[0], c.tones[Math.floor(c.tones.length / 2)], c.tones[c.tones.length - 1]];
      const seq = rising ? pick : pick.slice().reverse(), step = Math.max(.07, Math.min(.16, ms / 6000));
      seq.forEach((m, k) => engine.piano(m, t0 + k * step, .036 * (1 - k * .14), -.3 + k * .3));
    }
    nextAt = Math.max(nextAt, ctx.currentTime + 2.6);   // geçişten sonra sahne bir an susar
  }

  const api = {
    get enabled() {return enabled;},
    get preset() {return preset;},
    set(next) {
      const before = sceneKey(state), wasTour = Boolean(state.tourView);
      state = {...state, ...next};
      if (engine && unlocked && wasTour !== Boolean(state.tourView)) engine.level(enabled ? (state.tourView ? TOUR_MASTER : MASTER) : 0, 2);
      if (sceneKey(state) !== before) mem.last = undefined;
    },
    setPreset(name) {
      if (!SOUND_PRESETS[name]) return;
      preset = name; for (const k of Object.keys(mem)) delete mem[k];
      try {storage?.setItem('angora.sound-preset', name);} catch {}
      void unlock().then(() => arrive(950, true));
    },
    transition(ms = 950, rising = true) {arrive(ms, rising);},
    // Tık: o anki akorun en üst tonu, çok kısa ve çok kısık - arayüz de aynı tonda.
    play() {
      if (!running()) return;
      const now = performance.now(); if (now - lastClick < 90) return; lastClick = now;
      const c = chord(); engine.piano(c.tones[c.tones.length - 1] + 12, ctx.currentTime + .01, .011, .2, 1.1);
    },
    open() {
      if (!running()) return;
      const c = chord(), t0 = ctx.currentTime + .01;
      engine.piano(c.tones[c.tones.length - 2], t0, .02, -.15, 2.2);
      engine.piano(c.tones[c.tones.length - 1], t0 + .09, .016, .15, 2.4);
    },
    sting() {}, alert() {}, intro() {},
  };
  return api;
}
