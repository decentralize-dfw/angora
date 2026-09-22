// A bed under the narration. Synthesized, because a music file would be
// another megabyte over the wire for something that must never be in front.
//
// It is three voices on one chord with a slow filter over them, mixed at
// about a fiftieth of the voice: enough that a six-minute presentation has a
// floor under it, quiet enough that nobody has to talk over it. The chord
// moves with the tour - the map, the settlement, the house, the rooms, the
// closing - so the piece goes somewhere without ever announcing itself.
//
// Root notes, one per section of the tour, in Hz. A minor sixth apart at most,
// so the move between any two is a step rather than a modulation.
const MOODS = [
  {name: 'region', root: 110.00, fifth: 1.5, third: 1.2},   // A - open
  {name: 'street', root: 123.47, fifth: 1.5, third: 1.2},   // B - a tone up
  {name: 'house', root: 146.83, fifth: 1.5, third: 1.25},   // D - major third
  {name: 'rooms', root: 110.00, fifth: 1.5, third: 1.25},   // A major, warmer
  {name: 'close', root: 87.31, fifth: 1.5, third: 1.25},    // F - settles under
];
const GAIN = 0.021, GLIDE = 6;

export function createTourAmbient(Context = globalThis.AudioContext ?? globalThis.webkitAudioContext) {
  if (!Context) return null;
  let context = null, master = null, filter = null, voices = [], mood = -1;

  function build() {
    context = new Context();
    master = context.createGain();
    master.gain.value = 0;
    filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.6;
    // Root, fifth, third - and the fifth a breath detuned, which is what
    // keeps a synthesized chord from sounding like a test tone.
    voices = [[1, 'sine', 1], [1.5, 'sine', .55], [1.2, 'triangle', .3], [2.004, 'sine', .18]]
      .map(([ratio, type, level]) => {
        const tone = context.createOscillator(), gain = context.createGain();
        tone.type = type; gain.gain.value = level;
        tone.connect(gain); gain.connect(filter);
        tone.start();
        return {tone, gain, ratio};
      });
    filter.connect(master); master.connect(context.destination);
  }
  function chord(index, when = 0) {
    const set = MOODS[Math.max(0, Math.min(MOODS.length - 1, index))];
    const now = context.currentTime;
    for (const voice of voices) {
      const hz = set.root * (voice.ratio === 1.5 ? set.fifth : voice.ratio === 1.2 ? set.third : voice.ratio);
      voice.tone.frequency.setTargetAtTime(hz, now + when, GLIDE / 3);
    }
    // The higher the section, the more air over it.
    filter.frequency.setTargetAtTime(420 + index * 90, now, GLIDE / 2);
  }
  return {
    get mood() {return mood;},
    async start() {
      try {
        if (!context) build();
        if (context.state === 'suspended') await context.resume();
        if (mood < 0) {mood = 0; chord(0);}
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(GAIN, context.currentTime, 2.5);
      } catch { /* a bed is never worth an interruption */ }
    },
    // Called on every cue; only a change of section costs anything.
    set(index) {
      if (!context || index === mood) return;
      mood = index; chord(index);
    },
    stop() {
      if (!context) return;
      try {
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(0, context.currentTime, 1.2);
        setTimeout(() => {try {void context.suspend();} catch {}}, 4000);
      } catch { /* ignore */ }
      mood = -1;
    },
  };
}
// Which section of the tour a moment belongs to, by the view it is showing.
// The bed follows the shape of the thing rather than a clock.
export function moodFor(step, at) {
  if (at >= 343) return 4;                      // the closing settles under
  if (/^f[0-3]$/.test(step.view)) return 3;     // inside the house
  if (at > 105) return 2;                       // the villa, from outside
  // The opening map is its own thing; the map the tour comes BACK to, for the
  // woods and the universities, belongs with the settlement around it - a
  // return to the first chord there would read as an edit rather than a move.
  return at < 27 ? 0 : 1;
}
