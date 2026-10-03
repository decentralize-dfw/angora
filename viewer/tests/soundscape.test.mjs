import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {sceneMix, measure, SOUND_FILES, TOUR_MUSIC, createSoundscape} from '../src/soundscape.js';

test('every sound the soundscape names is in audio/11lbs', () => {
  for (const file of Object.values(SOUND_FILES))
    assert.ok(existsSync(new URL(`../../audio/11lbs/${file}`, import.meta.url)), file);
});

test('each tour chapter has its own music, quieter than the site bed', () => {
  const chapters = ['region', 'neighborhood', 'f0', 'f1', 'f2', 'f3'];
  assert.equal(new Set(chapters.map(v => TOUR_MUSIC[v])).size, chapters.length - 0);
  for (const v of chapters) assert.ok(sceneMix({tourView: v}).music.db < sceneMix({view: v}).music.db, v);
});

test('the walk plays the place, not music, outdoors; no birds at night', () => {
  const out = sceneMix({walking: true, outdoor: true, daylight: 1});
  assert.equal(out.music, null); assert.equal(out.birds.key, 'spring');
  assert.equal(sceneMix({walking: true, outdoor: true, daylight: 0}).birds, null);
  assert.equal(sceneMix({walking: true, outdoor: false}).birds, null);
});

test('level measure ignores silent tails', () => {
  const tone = new Float32Array(4000).fill(.1), tail = new Float32Array(40000);
  const both = new Float32Array(44000); both.set(tone);
  assert.ok(Math.abs(measure([both]).rms - measure([tone]).rms) < .5);
  assert.ok(Math.abs(measure([tone]).peak - -20) < .1);
  void tail;
});

class Button extends EventTarget {attrs = {}; setAttribute(k, v) {this.attrs[k] = v;}}
test('sound is on by default, one switch silences it, denied storage and no audio do not break it', () => {
  const button = new Button();
  const sound = createSoundscape({buttons: [button], root: new EventTarget(), audioRoot: 'http://x/', Context: class {},
    storage: {getItem() {throw Error('denied');}, setItem() {throw Error('denied');}}});
  assert.equal(sound.enabled, true); assert.equal(button.attrs['aria-pressed'], 'true');
  button.dispatchEvent(new Event('click')); assert.equal(sound.enabled, false);
  const dead = new Button(); createSoundscape({buttons: [dead], root: new EventTarget(), audioRoot: 'http://x/', storage: null, Context: null});
  assert.equal(dead.disabled, true);
});

test('the speaker switch sits in both language capsules and is not a language button', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal((html.match(/data-sound-toggle/g) ?? []).length, 2);
  assert.doesNotMatch(html, /class="lang-flag sound-toggle"/);
});
