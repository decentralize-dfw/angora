// The site's sound: a quiet bed under whatever is on screen, its own music for
// each chapter of the narrated tour, a soft air movement on every cut and a
// small click under the hand. Nothing here should be noticed on its own - it
// is there so the picture feels like a place rather than a screen.
//
// The ElevenLabs set (audio/11lbs) arrives at very different levels (the
// spring afternoon sits ~45 dB under the rest), so every file is measured once
// it is decoded and played at a target loudness, never at its raw level. Beds
// loop by crossfading into a fresh copy of themselves, so a file whose ends do
// not meet still never clicks at the seam.
//
// Browsers only start audio after a gesture: the bed waits for the first
// press anywhere, then fades in. One switch (#toggle-sound) silences all of it
// and is remembered.
export const SOUND_FILES = Object.freeze({
  estate: 'AMBHome-Luxury_real_estate_a-Elevenlabs.mp3',
  spring: 'AMBHome-Peaceful_spring_afte-Elevenlabs.mp3',
  elegant: 'MUSCInst-Elegant,_premium_cin-Elevenlabs.mp3',
  intro: 'MUSCInst-Luxury_ambient_intro-Elevenlabs.mp3',
  piano: 'MUSCKeyd-Minimal_modern_piano-Elevenlabs.mp3',
  warm: 'MUSCLoop-Soft_warm_cinematic_-Elevenlabs.mp3',
  spa: 'MUSCMisc-luxury_skincare_ambi-Elevenlabs.mp3',
  strings: 'MUSCStr-مثال_للـ_Prompt_على_-Elevenlabs.mp3',
  synth: 'MUSCSynth-Cinematic_ambient-el-Elevenlabs.mp3',
  alert: 'UIAlert-Create_a_notificatio-Elevenlabs.mp3',
  open: 'UIClick-A_short,_clean_UI_so-Elevenlabs.mp3',
  click: 'UIClick-Create_a_clean,_mini-Elevenlabs.mp3',
  sting: 'UIMisc-Confident_and_modern-Elevenlabs.mp3',
  woosh: 'WHSH-slow_woosh._Gentle_w-Elevenlabs.mp3',
});

// Loudness targets. Beds are RMS over their audible part; one-shots are by
// peak, since a short hit with a long tail has no meaningful RMS.
const SHOT_DB = {woosh: -26, click: -30, open: -28, sting: -26, alert: -28, intro: -30};
const FADE = 2.5;

// 03.10 ürün sahibi: "müzik çok baskın, uyumlu değil, dramatik olmasın" -
// dört sakin seçenek, sol ortadan denenir. Her seçenek TEK bir müzik
// parçasını her yerde kullanır (görünüm değişince başka tonda bir parçaya
// geçmek uyumsuzluğun kaynağıydı); synth, yaylılar, "premium sinematik" ve
// açılış imzaları hiçbirinde yok. Seviyeler eskisinden ~8-10 dB aşağıda.
export const SOUND_PRESETS = Object.freeze({
  sakin:  {tr: 'Sakin',  en: 'Calm',   music: 'spa',   musicDb: -43, tourDb: -48, ambience: 'estate', ambDb: -47, birdsDb: -45,
           transition: {key: 'woosh', db: -30, rate: .82}},
  piyano: {tr: 'Piyano', en: 'Piano',  music: 'piano', musicDb: -41, tourDb: -47, ambience: null,     ambDb: -99, birdsDb: -46,
           transition: {key: 'woosh', db: -29, rate: .9}},
  sicak:  {tr: 'Sıcak',  en: 'Warm',   music: 'warm',  musicDb: -42, tourDb: -48, ambience: 'estate', ambDb: -49, birdsDb: -46,
           transition: {key: 'open', db: -33, rate: .92}},
  doga:   {tr: 'Doğa',   en: 'Nature', music: null,    musicDb: -99, tourDb: -99, ambience: 'estate', ambDb: -43, birdsDb: -41,
           transition: {key: 'woosh', db: -32, rate: .78}},
});
export const DEFAULT_PRESET = 'sakin';
// Tour chapters keep the preset's one track, under the voice.
export const TOUR_MUSIC = Object.freeze(Object.fromEntries(Object.entries(SOUND_PRESETS).map(([k, p]) => [k, p.music])));

// What plays where. Inside the house the music drops a little further and
// the birds go; outside (neighbourhood, garden walk) the birds follow the
// daylight and are gone at night.
export function sceneMix({view = 'region', walking = false, outdoor = false, daylight = 1, tourView = null, preset = DEFAULT_PRESET} = {}) {
  const p = SOUND_PRESETS[preset] ?? SOUND_PRESETS[DEFAULT_PRESET];
  const night = Math.max(0, Math.min(1, daylight));
  const outside = tourView ? tourView === 'neighborhood' : walking ? outdoor : view === 'neighborhood';
  const indoors = walking && !outdoor;
  const birds = outside && night > .2 ? {key: 'spring', db: p.birdsDb + 10 * Math.log10(night) - (tourView ? 4 : 0)} : null;
  const musicDb = tourView ? p.tourDb : indoors ? p.musicDb - 3 : p.musicDb;
  return {
    music: p.music ? {key: p.music, db: musicDb} : null,
    ambience: p.ambience && !tourView ? {key: p.ambience, db: p.ambDb - (indoors ? 3 : 0)} : null,
    birds,
  };
}

// Level of a decoded buffer in dBFS: RMS over the samples above the noise
// floor (so a long silent tail does not drag a bed down), and the peak.
export function measure(channels) {
  let sum = 0, count = 0, peak = 0;
  for (const data of channels) for (let i = 0; i < data.length; i += 4) {
    const v = Math.abs(data[i]);
    if (v > peak) peak = v;
    if (v > 1e-4) {sum += v * v; count++;}
  }
  const db = v => 20 * Math.log10(Math.max(v, 1e-6));
  return {rms: db(Math.sqrt(sum / Math.max(1, count))), peak: db(peak)};
}
const gainFor = (level, target) => Math.min(40, 10 ** ((target - level) / 20));

export function createSoundscape({buttons = [], root = document, audioRoot, storage, label = null,
                                  Context = globalThis.AudioContext ?? globalThis.webkitAudioContext} = {}) {
  let enabled = true, context = null, master = null, unlocked = false, lastClick = -Infinity;
  if (storage === undefined) try {storage = globalThis.localStorage;} catch {}
  try {enabled = storage?.getItem('angora.sound') !== 'off';} catch {}
  const buffers = new Map(), loading = new Map(), levels = new Map();
  const beds = {music: null, ambience: null, birds: null};
  let preset = DEFAULT_PRESET;
  try {preset = SOUND_PRESETS[storage?.getItem('angora.sound-preset')] ? storage.getItem('angora.sound-preset') : DEFAULT_PRESET;} catch {}
  let state = {preset}, mix = sceneMix(state);

  const ready = () => enabled && context && context.state === 'running' && !root.hidden;
  function ensure() {
    if (!Context) return null;
    if (!context) {
      context = new Context();
      master = context.createGain();
      master.gain.value = enabled ? 1 : 0;
      master.connect(context.destination);
    }
    return context;
  }
  function load(key) {
    if (buffers.has(key)) return Promise.resolve(buffers.get(key));
    if (loading.has(key)) return loading.get(key);
    const url = new URL(encodeURIComponent(SOUND_FILES[key]), audioRoot).href;
    const job = fetch(url).then(r => {if (!r.ok) throw new Error(r.status); return r.arrayBuffer();})
      .then(data => new Promise((resolve, reject) => context.decodeAudioData(data, resolve, reject)))
      .then(buffer => {
        const channels = Array.from({length: buffer.numberOfChannels}, (_, i) => buffer.getChannelData(i));
        levels.set(key, measure(channels));
        buffers.set(key, buffer); loading.delete(key);
        return buffer;
      })
      .catch(() => {loading.delete(key); return null;});
    loading.set(key, job);
    return job;
  }

  // A bed: copies of one buffer handed over every (duration - FADE) seconds,
  // each fading in over the last one's fade out.
  function startBed(role, {key, db}) {
    const gain = context.createGain();
    gain.gain.value = 0; gain.connect(master);
    const bed = {key, db, gain, alive: true, timer: null};
    load(key).then(buffer => {
      if (!bed.alive || !buffer) return;
      const target = gainFor(levels.get(key).rms, bed.db);
      const now = context.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(target, now + FADE);
      const spawn = (at, offset) => {
        if (!bed.alive) return;
        const source = context.createBufferSource(), fade = context.createGain();
        source.buffer = buffer;
        const length = buffer.duration - offset, edge = Math.min(FADE, length / 3);
        fade.gain.setValueAtTime(offset ? 1 : 0, at);
        if (!offset) fade.gain.linearRampToValueAtTime(1, at + edge);
        fade.gain.setValueAtTime(1, at + length - edge);
        fade.gain.linearRampToValueAtTime(0, at + length);
        source.connect(fade); fade.connect(gain);
        source.start(at, offset); source.stop(at + length + .05);
        source.onended = () => {source.disconnect(); fade.disconnect();};
        const next = at + length - edge;
        bed.timer = setTimeout(() => spawn(Math.max(context.currentTime + .05, next), 0),
          Math.max(0, (next - context.currentTime - 1) * 1000));
      };
      // Joining a bed part-way through, not from its first bar every time a
      // view changes, is what keeps a revisited scene from sounding replayed.
      spawn(now + .02, (Math.random() * .5) * buffer.duration);
    });
    beds[role] = bed;
  }
  function stopBed(role) {
    const bed = beds[role];
    if (!bed) return;
    beds[role] = null; bed.alive = false; clearTimeout(bed.timer);
    const now = context.currentTime;
    bed.gain.gain.cancelScheduledValues(now);
    bed.gain.gain.setValueAtTime(bed.gain.gain.value, now);
    bed.gain.gain.linearRampToValueAtTime(0, now + FADE);
    setTimeout(() => bed.gain.disconnect(), (FADE + .3) * 1000);
  }
  function applyMix() {
    if (!unlocked || !context) return;
    for (const role of Object.keys(beds)) {
      const want = mix[role], have = beds[role];
      if (!want) {stopBed(role); continue;}
      if (have && have.key === want.key) {
        if (Math.abs(have.db - want.db) > .5 && levels.has(want.key)) {
          have.db = want.db;
          const now = context.currentTime;
          have.gain.gain.cancelScheduledValues(now);
          have.gain.gain.setValueAtTime(have.gain.gain.value, now);
          have.gain.gain.linearRampToValueAtTime(gainFor(levels.get(want.key).rms, want.db), now + FADE);
        }
        continue;
      }
      stopBed(role); startBed(role, want);
    }
  }
  function shot(key, {rate = 1, delay = 0, db = SHOT_DB[key]} = {}) {
    if (!ready()) return;
    load(key).then(buffer => {
      if (!buffer || !ready()) return;
      const source = context.createBufferSource(), gain = context.createGain();
      source.buffer = buffer; source.playbackRate.value = rate;
      gain.gain.value = gainFor(levels.get(key).peak, db);
      source.connect(gain); gain.connect(master);
      source.start(context.currentTime + delay);
      source.onended = () => {source.disconnect(); gain.disconnect();};
    });
  }

  const update = () => {
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(enabled));
      if (label) button.textContent = label(enabled);
    }
  };
  async function unlock() {
    if (!enabled || !ensure()) return;
    try {if (context.state === 'suspended') await context.resume();} catch {return;}
    if (context.state !== 'running') return;
    unlocked = true; applyMix();
    // The one-shots are small; have them decoded before they are needed.
    for (const key of ['woosh', 'click', 'open']) load(key);
  }
  const gesture = () => {void unlock();};
  for (const type of ['pointerdown', 'keydown', 'touchend']) root.addEventListener(type, gesture, {capture: true, passive: true});

  update();
  for (const button of buttons) {
    button.disabled = !Context;
    button.addEventListener('click', () => {
      enabled = !enabled; update();
      try {storage?.setItem('angora.sound', enabled ? 'on' : 'off');} catch {}
      if (context && master) {
        const now = context.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(enabled ? 1 : 0, now + .4);
      }
      if (enabled) void unlock().then(() => shot('click'));
    });
  }
  root.addEventListener('click', event => {
    const control = event.target.closest?.('button,select,[role=button]');
    if (!control || buttons.includes(control) || control.disabled) return;
    const now = performance.now();
    if (now - lastClick < 80) return;
    lastClick = now;
    shot('click');
  });
  root.addEventListener('visibilitychange', () => {
    if (!context) return;
    try {void (root.hidden ? context.suspend() : enabled && unlocked ? context.resume() : null)?.catch?.(() => {});} catch {}
  });

  return {
    get enabled() {return enabled;},
    // The viewer reports where it is; the mix follows with long crossfades.
    set(next) {
      const merged = {...state, ...next};
      if (JSON.stringify(merged) === JSON.stringify(state)) return;
      state = merged; mix = sceneMix(state); applyMix();
    },
    // A cut or a camera move: the woosh, pitched with the direction so a rise
    // and a fall are told apart without being announced.
    transition(ms = 950, rising = true) {
      const t = SOUND_PRESETS[preset].transition;
      shot(t.key, {db: t.db, rate: t.rate * (rising ? 1.03 : .95) * Math.max(.9, Math.min(1.05, 950 / Math.max(500, ms)))});
    },
    get preset() {return preset;},
    setPreset(name) {
      if (!SOUND_PRESETS[name]) return;
      preset = name;
      try {storage?.setItem('angora.sound-preset', name);} catch {}
      this.set({preset: name});
      void unlock().then(() => this.transition(950, true));
    },
    play() {shot('click');},
    open() {shot('open');},
    sting() {},   // 03.10: imza sesleri kaldırıldı ("dramatik olmasın")
    alert() {shot('alert');},
    intro() {},
  };
}
