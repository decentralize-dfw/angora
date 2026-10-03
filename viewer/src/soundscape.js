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
  const vel = () => (.031 + rand() * .013) * (tour ? .7 : 1) * (inside ? .88 : 1);
  if (preset === 'isik') {
    // yavaş kırık akor: 3-4 nota, alttan üste, aralarında nefes
    const n = 3 + (rand() < .35 ? 1 : 0), start = Math.floor(rand() * Math.max(1, t.length - n + 1));
    const spread = .2 + rand() * .14;
    for (let k = 0; k < n; k++) notes.push({midi: t[Math.min(t.length - 1, start + k)], at: k * spread, vel: vel() * (1 - k * .1), pan: -.25 + k * .17});
    if (rand() < .5) notes.push({midi: chord.bass, at: 0, vel: vel() * .8, pan: -.1});
    // akorun üstünde bir-iki nota şarkı söyler
    if (rand() < .55) { const top = t[Math.min(t.length - 1, start + n)] ?? t[t.length - 1]; notes.push({midi: top, at: n * spread + .5, vel: vel() * .85, pan: .25});
      if (rand() < .5) notes.push({midi: t[Math.max(0, t.indexOf(top) - 1)], at: n * spread + 1.05, vel: vel() * .75, pan: .3}); }
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
    if (rand() < .5) notes.push({midi: near(), at: .55 + rand() * .2, vel: vel() * .5, pan: .45});
    return {wait: (4 + rand() * 3) * slow, notes};
  }
  // oda: tek nota, iki adım, küçük bir cümle (3-4 nota, adım adım) ya da ikili.
  // 04.10 "yüzde 20 daha melodik": tek nota payı %58 -> %40, küçük cümleler eklendi.
  const r = rand(), a = near();
  if (r < .4) notes.push({midi: a, at: 0, vel: vel(), pan: (rand() - .5) * .5});
  else if (r < .72) { const b = near(); notes.push({midi: a, at: 0, vel: vel(), pan: -.15}, {midi: b, at: .5 + rand() * .25, vel: vel() * .82, pan: .2}); }
  else if (r < .92) {
    // adım adım küçük cümle: akor tonlarında yukarı ya da aşağı yürür, son nota uzar
    const dir = rand() < .5 ? 1 : -1, n = 3 + (rand() < .4 ? 1 : 0);
    let i = t.indexOf(a), at = 0;
    for (let k = 0; k < n; k++) {
      notes.push({midi: t[Math.max(0, Math.min(t.length - 1, i))], at, vel: vel() * (1 - k * .08), pan: -.2 + k * .14});
      i += dir; if (i < 0 || i >= t.length) {i -= 2 * dir;}
      at += .42 + rand() * .16 + (k === n - 2 ? .22 : 0);
    }
  }
  else { const b = t[Math.min(t.length - 1, t.indexOf(a) + 2)] ?? a; notes.push({midi: a, at: 0, vel: vel() * .9, pan: -.1}, {midi: b, at: .015, vel: vel() * .7, pan: .12}); }
  mem.beat = (mem.beat ?? 0) + 1;
  if (mem.beat % 3 === 0) notes.push({midi: chord.bass, at: -.4, vel: vel() * .75, pan: 0});
  mem.last = notes[notes.length - 1].midi;
  return {wait: (3.2 + rand() * 3.2) * slow, notes};
}

// --- ses motoru ---
// 04.10 üçüncü tur (ürün sahibi): "arkada dijital makinemsi ses var" - sinüs
// ped katmanı (aralıklı iki osilatörün vuruşması + nefes LFO'su) kaldırıldı.
// Arkadaki yankılı akorlar artık AYNI piyanodan: 15-22 sn'de bir, çok kısık,
// çoğu yankı olan yavaş bir akor. "Cızırtı olmasın": her harmonik kendi
// sönümünün -80 dB'sine inmeden durdurulmaz (kesilen sinüs tık yapıyordu),
// ana zincir: 35 Hz yüksek geçiren -> 7,5 kHz yumuşak alçak geçiren -> hafif
// kompresör -> -3 dBFS sınırlayıcı.
export function createSoundEngine(ctx, {output = ctx.destination} = {}) {
  const master = ctx.createGain(); master.gain.value = 0;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 35; hp.Q.value = .5;
  const warmth = ctx.createBiquadFilter(); warmth.type = 'lowpass'; warmth.frequency.value = 5200; warmth.Q.value = .25;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -24; comp.ratio.value = 2.2; comp.knee.value = 18; comp.attack.value = .03; comp.release.value = .6;
  const limit = ctx.createDynamicsCompressor();
  limit.threshold.value = -4; limit.ratio.value = 20; limit.knee.value = 1; limit.attack.value = .002; limit.release.value = .25;
  master.connect(hp); hp.connect(warmth); warmth.connect(comp); comp.connect(limit); limit.connect(output);
  // salon yankısı: sönen gürültü, kuyruk zamanla kararır (sıcak oda)
  const secs = 4.6, len = Math.floor(ctx.sampleRate * secs), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch); let lp = 0;
    for (let i = 0; i < len; i++) {
      const p = i / len, k = .36 - .31 * p;
      lp += k * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * Math.pow(1 - p, 2.3) * (i < ctx.sampleRate * .02 ? i / (ctx.sampleRate * .02) : 1);
    }
  }
  const verb = ctx.createConvolver(); verb.buffer = ir;
  const wet = ctx.createGain(); wet.gain.value = .85;   // 04.10: daha yankılı
  verb.connect(wet); wet.connect(master);
  const delay = ctx.createDelay(1.5); delay.delayTime.value = .62;
  const fb = ctx.createGain(); fb.gain.value = .3;
  const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 1300;
  delay.connect(dlp); dlp.connect(fb); fb.connect(delay); dlp.connect(verb); dlp.connect(master);
  // ön plan piyanosu: kuru + yankı + eko
  const bus = ctx.createGain();
  const dry = ctx.createGain(); dry.gain.value = .45; bus.connect(dry); dry.connect(master);
  bus.connect(verb);
  const send = ctx.createGain(); send.gain.value = .26; bus.connect(send); send.connect(delay);
  // arka plan akorları: neredeyse tamamen yankı
  const hall = ctx.createGain();
  const hallDry = ctx.createGain(); hallDry.gain.value = .22; hall.connect(hallDry); hallDry.connect(master);
  const hallVerb = ctx.createGain(); hallVerb.gain.value = 1.5; hall.connect(hallVerb); hallVerb.connect(verb);
  const hallSend = ctx.createGain(); hallSend.gain.value = .35; hall.connect(hallSend); hallSend.connect(delay);

  const PARTIALS = [[1, 1], [2, .34], [3, .13], [4, .06], [5, .028], [6, .014]];
  function piano(midi, t0, vel, pan = 0, len = null, toHall = false) {
    const f = NOTE(midi);
    const dur = len ?? Math.max(2.8, Math.min(9, 4 + (70 - midi) * .11));
    const out = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    if (out.pan) out.pan.value = Math.max(-1, Math.min(1, pan));
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = .2;
    lp.frequency.value = Math.min(2100, (toHall ? 340 : 420) + f * (toHall ? 1.4 : 1.9));   // 04.10: daha yumuşak
    lp.connect(out); out.connect(toHall ? hall : bus);
    const nodes = [];
    let last = t0;
    PARTIALS.forEach(([k, a], idx) => {
      const fk = f * k * Math.sqrt(1 + .00032 * k * k);
      if (fk > 5000) return;
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = fk;
      if (idx === 0) o.detune.value = .7;
      const g = ctx.createGain(), peak = vel * a, tau = dur / (3.4 + (k - 1) * 2.2);
      const attack = toHall ? .1 : .022;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + attack);
      g.gain.setTargetAtTime(0, t0 + attack, tau);
      o.connect(g); g.connect(lp);
      const stop = t0 + attack + tau * 9.5;           // -82 dB: kesilince tık yok
      o.start(t0); o.stop(stop);
      if (stop > last) last = stop;
      nodes.push(o, g);
    });
    const tail = ctx.createConstantSource ? ctx.createConstantSource() : null;
    if (tail) {tail.offset.value = 0; tail.connect(lp); tail.start(t0); tail.stop(last + .05);
      tail.onended = () => {for (const n of nodes) n.disconnect(); tail.disconnect(); lp.disconnect(); out.disconnect();};}
  }
  // Örnek sesler (woosh, tık, kuşlar): tepe/ortalama ölçülüp hedefe çekilir.
  function sample(buffer, t0, {gain = 1, rate = 1, pan = 0, lowpass = 0, highpass = 0, toHall = 0} = {}) {
    const src = ctx.createBufferSource(); src.buffer = buffer; src.playbackRate.value = rate;
    let node = src;
    const chain = [];
    if (highpass) {const h = ctx.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = highpass; node.connect(h); node = h; chain.push(h);}
    if (lowpass) {const l = ctx.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = lowpass; l.Q.value = .3; node.connect(l); node = l; chain.push(l);}
    const g = ctx.createGain(); g.gain.value = gain; node.connect(g); chain.push(g);
    const out = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    if (out.pan) out.pan.value = pan;
    g.connect(out); out.connect(master); chain.push(out);
    if (toHall) {const w = ctx.createGain(); w.gain.value = toHall; g.connect(w); w.connect(verb); chain.push(w);}
    src.start(t0);
    src.onended = () => {src.disconnect(); for (const n of chain) n.disconnect();};
    return src;
  }
  function level(to, secs = 1.6) {
    const now = ctx.currentTime, N = 24, curve = new Float32Array(N), from = master.gain.value;
    for (let i = 0; i < N; i++) curve[i] = from + (to - from) * (.5 - .5 * Math.cos(Math.PI * i / (N - 1)));
    try {master.gain.cancelScheduledValues(now); master.gain.setValueCurveAtTime(curve, now, secs);}
    catch {master.gain.linearRampToValueAtTime(to, now + secs);}
  }
  return {piano, sample, level, master};
}

// Arkadaki akorun notaları: bas bir oktav yukarıda + akorun alt üç tonu, orta-alçak kayıtta.
export function padChord(chord) {
  const fold = m => {while (m > 64) m -= 12; while (m < 45) m += 12; return m;};
  return [fold(chord.bass + 12), ...chord.tones.slice(0, 3).map(fold)];
}
const MASTER = .9, TOUR_MASTER = .62;

// Örnek sesler audio/11lbs'ten: kat geçişi woosh'u, arayüz tıkı, yakın çevrede kuşlar.
const FILES = {
  woosh: 'WHSH-slow_woosh._Gentle_w-Elevenlabs.mp3',
  click: 'UIClick-Create_a_clean,_mini-Elevenlabs.mp3',
  birds: 'AMBHome-Peaceful_spring_afte-Elevenlabs.mp3',
};
// hedefler: tek atımlıklar tepeye, kuşlar ortalamaya göre (dBFS)
const TARGET = {woosh: -22, click: -33, birds: -46};
function birdsWanted(state) {
  const outside = state.tourView ? state.tourView === 'neighborhood' : state.walking ? state.outdoor : state.view === 'neighborhood';
  return outside && (state.daylight ?? 1) > .2;
}

export function createSoundscape({buttons = [], root = document, storage, audioRoot = null, Context = globalThis.AudioContext ?? globalThis.webkitAudioContext} = {}) {
  let enabled = true, ctx = null, engine = null, unlocked = false, timer = null, nextAt = 0, chordAt = 0, lastClick = -Infinity, hiddenTimer = null;
  if (storage === undefined) try {storage = globalThis.localStorage;} catch {}
  try {enabled = storage?.getItem('angora.sound') !== 'off';} catch {}
  let preset = DEFAULT_PRESET;
  try {const p = storage?.getItem('angora.sound-preset'); if (SOUND_PRESETS[p]) preset = p;} catch {}
  let state = {view: 'region', daylight: 1};
  const mem = {};
  const chord = () => chordFor(state, preset);
  const running = () => enabled && ctx && ctx.state === 'running' && !root.hidden;
  const target = () => enabled ? (state.tourView ? TOUR_MASTER : MASTER) : 0;

  // örnekler: bir kez indirilir, ölçülür
  const buffers = {}, loading = {};
  function load(key) {
    if (buffers[key] || !audioRoot || !ctx) return Promise.resolve(buffers[key] ?? null);
    return loading[key] ??= fetch(new URL(encodeURIComponent(FILES[key]), audioRoot)).then(r => r.ok ? r.arrayBuffer() : null)
      .then(data => data && new Promise((res, rej) => ctx.decodeAudioData(data, res, rej)))
      .then(buffer => {
        if (!buffer) return null;
        const d = buffer.getChannelData(0); let sum = 0, n = 0, peak = 0;
        for (let i = 0; i < d.length; i += 2) {const v = Math.abs(d[i]); if (v > peak) peak = v; if (v > 1e-5) {sum += v * v; n++;}}
        const lvl = key === 'birds' ? 20 * Math.log10(Math.sqrt(sum / Math.max(1, n)) || 1e-6) : 20 * Math.log10(peak || 1e-6);
        buffer._gain = Math.min(30, 10 ** ((TARGET[key] - lvl) / 20));
        return (buffers[key] = buffer);
      }).catch(() => null);
  }
  function shot(key, opts = {}) {
    if (!running()) return;
    load(key).then(b => {if (b && running()) engine.sample(b, ctx.currentTime + (opts.delay ?? .01), {...opts, gain: b._gain * (opts.gain ?? 1)});});
  }

  // kuşlar: kendiyle çapraz geçerek döner; tıslamayı kesmek için 400 Hz - 6,5 kHz bandı
  let birds = null;
  function birdsOn() {
    if (birds || !running()) return;
    const g = ctx.createGain(); g.gain.value = 0;
    const h = ctx.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = 400;
    const l = ctx.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = 6500; l.Q.value = .3;
    h.connect(l); l.connect(g); g.connect(engine.master);
    birds = {g, h, alive: true, timer: null};
    const me = birds;
    load('birds').then(buffer => {
      if (!buffer || !me.alive) return;
      g.gain.setTargetAtTime(buffer._gain, ctx.currentTime, 1.4);
      const FADE = 2.5;
      const spawn = (at, offset) => {
        if (!me.alive) return;
        const src = ctx.createBufferSource(), fg = ctx.createGain(); src.buffer = buffer;
        const length = buffer.duration - offset, edge = Math.min(FADE, length / 3);
        fg.gain.setValueAtTime(offset ? 1 : 0, at); if (!offset) fg.gain.linearRampToValueAtTime(1, at + edge);
        fg.gain.setValueAtTime(1, at + length - edge); fg.gain.linearRampToValueAtTime(0, at + length);
        src.connect(fg); fg.connect(h); src.start(at, offset); src.stop(at + length + .05);
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
    setTimeout(() => {b.g.disconnect(); b.h.disconnect();}, 5000);
  }
  function syncAmbience() {
    if (!engine || !unlocked) return;
    if (enabled && birdsWanted(state)) birdsOn(); else birdsOff();
  }
  // arka plan akoru: aynı piyano, yavaş tellenir, neredeyse hep yankı
  function ambientChord(at, vel = .016) {
    padChord(chord()).forEach((m, k) => engine.piano(m, at + k * (.11 + Math.random() * .05), vel * (k ? .8 : 1), -.3 + k * .2, 9, true));
  }

  function schedule() {
    if (!running()) return;
    while (nextAt < ctx.currentTime + .4) {
      const at = Math.max(nextAt, ctx.currentTime + .05);
      const phrase = nextPhrase(preset, chord(), state, mem);
      for (const n of phrase.notes) engine.piano(n.midi, Math.max(ctx.currentTime + .02, at + n.at), n.vel, n.pan, n.len);
      nextAt = at + phrase.wait;
    }
    if (chordAt < ctx.currentTime + .4) {
      ambientChord(Math.max(chordAt, ctx.currentTime + .05), state.tourView ? .011 : .016);
      chordAt = Math.max(chordAt, ctx.currentTime) + 15 + Math.random() * 7;
    }
  }
  async function unlock() {
    if (!enabled || !Context) return;
    if (!ctx) {ctx = new Context(); engine = createSoundEngine(ctx);}
    try {if (ctx.state === 'suspended') await ctx.resume();} catch {return;}
    if (ctx.state !== 'running') return;
    if (!unlocked) {
      unlocked = true;
      engine.level(target(), 3);
      chordAt = ctx.currentTime + .4;               // önce yankılı bir akor, sonra melodi
      nextAt = ctx.currentTime + 3;
      for (const k of ['woosh', 'click']) load(k);
      syncAmbience();
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
      if (engine) engine.level(target(), .8);
      if (enabled) void unlock().then(() => syncAmbience()); else {clearInterval(timer); timer = null; birdsOff();}
    });
  }
  root.addEventListener('click', event => {
    const control = event.target.closest?.('button,select,[role=button],summary');
    if (!control || buttons.includes(control) || control.disabled) return;
    api.play();
  });
  // Sekme değişince / küçültülünce yumuşak çıkış, dönünce yumuşak giriş (şak diye değil).
  const onVisibility = () => {
    if (!ctx || !engine || !unlocked) return;
    clearTimeout(hiddenTimer);
    if (root.hidden || root.visibilityState === 'hidden') {
      engine.level(0, .7);
      hiddenTimer = setTimeout(() => {try {void ctx.suspend().catch(() => {});} catch {}}, 800);
    } else if (enabled) {
      Promise.resolve(ctx.state === 'suspended' ? ctx.resume() : null).catch(() => {})
        .then(() => {engine.level(target(), 1.8); nextAt = Math.max(nextAt, ctx.currentTime + 1.5);});
    }
  };
  root.addEventListener('visibilitychange', onVisibility);
  globalThis.addEventListener?.('pagehide', () => {if (engine && unlocked) engine.level(0, .3);});

  const api = {
    get enabled() {return enabled;},
    get preset() {return preset;},
    set(next) {
      const before = sceneKey(state), wasTour = Boolean(state.tourView), wasBirds = birdsWanted(state);
      state = {...state, ...next};
      if (engine && unlocked && wasTour !== Boolean(state.tourView)) engine.level(target(), 2);
      if (sceneKey(state) !== before) mem.last = undefined;
      if (wasBirds !== birdsWanted(state)) syncAmbience();
    },
    setPreset(name) {
      if (!SOUND_PRESETS[name]) return;
      preset = name; for (const k of Object.keys(mem)) delete mem[k];
      try {storage?.setItem('angora.sound-preset', name);} catch {}
      void unlock().then(() => {if (running()) {ambientChord(ctx.currentTime + .05); nextAt = Math.max(nextAt, ctx.currentTime + 2.5);}});
    },
    // Kat geçişi: woosh (yukarı biraz parlak, aşağı biraz koyu) + yeni katın tek notası.
    transition(ms = 950, rising = true) {
      if (!running()) return;
      shot('woosh', {rate: (rising ? 1.03 : .92) * Math.max(.9, Math.min(1.08, 950 / Math.max(500, ms))), lowpass: rising ? 6000 : 3800, toHall: .15});
      const c = chord(), m = rising ? c.tones[Math.floor(c.tones.length / 2)] : c.tones[0];
      engine.piano(m, ctx.currentTime + .45, .026, rising ? .15 : -.15);
      nextAt = Math.max(nextAt, ctx.currentTime + 3.2);
    },
    // Ölçek geçişi (Bölge / Yakın çevre / Villa, bulut perdesiyle): uzun, yavaş,
    // havadar bir rüzgâr - woosh yavaşlatılıp koyulaştırılır ve yankıya gömülür;
    // bulut açılırken yeni sahnenin akoru yankıdan doğar.
    scale(into = 'neighborhood') {
      if (!running()) return;
      const outward = into === 'region';
      shot('woosh', {rate: outward ? .68 : .78, lowpass: 2600, highpass: 120, toHall: .7, gain: .85});
      shot('woosh', {rate: outward ? .6 : .7, lowpass: 1800, highpass: 160, toHall: .9, gain: .45, pan: .35, delay: .18});
      ambientChord(ctx.currentTime + .55, .02);
      chordAt = ctx.currentTime + 12 + Math.random() * 6;
      nextAt = Math.max(nextAt, ctx.currentTime + 3.6);
    },
    // Arayüz tıkı: kısa, temiz, kısık örnek; hızlı ardışık basışlarda tekrar etmez.
    play() {
      if (!running()) return;
      const now = performance.now(); if (now - lastClick < 80) return; lastClick = now;
      shot('click', {lowpass: 7000});
    },
    open() {
      if (!running()) return;
      const c = chord(); engine.piano(c.tones[1], ctx.currentTime + .02, .02, .1, 3);
    },
    sting() {}, alert() {}, intro() {},
  };
  return api;
}
