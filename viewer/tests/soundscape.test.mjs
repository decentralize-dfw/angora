import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCENES, SOUND_PRESETS, chordFor, nextPhrase, sceneKey, createSoundscape} from '../src/soundscape.js';

// Re majör perde sınıfları: D E F# G A B C#
const D_MAJOR_PC = new Set([2, 4, 6, 7, 9, 11, 1]);
const seeded = (s = 3) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;

test('every scene, every preset, every hour stays inside one key - nothing clashes between scenes', () => {
  const rand = seeded();
  for (const preset of Object.keys(SOUND_PRESETS)) for (const view of Object.keys(SCENES)) for (const daylight of [1, .5, .1]) {
    const state = {view, daylight}, mem = {}, c = chordFor(state, preset);
    for (const m of [...c.tones, c.bass]) assert.ok(D_MAJOR_PC.has(m % 12), `${preset}/${view}/${daylight}: ${m}`);
    for (let i = 0; i < 40; i++) for (const n of nextPhrase(preset, c, state, mem, rand).notes)
      assert.ok(D_MAJOR_PC.has(n.midi % 12), `${preset}/${view}: note ${n.midi} out of key`);
  }
});

test('three scenario presets, each sparse and quiet - single notes, never a wall of sound', () => {
  assert.equal(Object.keys(SOUND_PRESETS).length, 3);
  const rand = seeded(11);
  for (const preset of Object.keys(SOUND_PRESETS)) {
    const mem = {}, state = {view: 'f1', daylight: 1};
    let time = 0, notes = 0;
    for (let i = 0; i < 60; i++) {const p = nextPhrase(preset, chordFor(state, preset), state, mem, rand); time += p.wait; notes += p.notes.length;
      for (const n of p.notes) assert.ok(n.vel < .08, `${preset} too loud`);}
    assert.ok(notes / time < 1.2, `${preset}: ${(notes / time).toFixed(2)} notes/s is busy`);
  }
});

test('floors climb in register: the basement sits lowest, the attic highest', () => {
  const mid = v => SCENES[v].tones.reduce((a, b) => a + b) / SCENES[v].tones.length;
  assert.ok(mid('f0') < mid('f1') && mid('f1') < mid('f2') && mid('f2') < mid('f3'));
  assert.equal(sceneKey({walking: true, outdoor: true, view: 'f1'}), 'neighborhood');
  assert.equal(sceneKey({tourView: 'f2', view: 'region'}), 'f2');
});

test('the tour plays sparser and softer under the voice', () => {
  const r1 = seeded(5), r2 = seeded(5), c = chordFor({view: 'f1'}, 'oda');
  const a = nextPhrase('oda', c, {view: 'f1'}, {}, r1), b = nextPhrase('oda', c, {view: 'f1', tourView: 'f1'}, {}, r2);
  assert.ok(b.wait > a.wait && b.notes[0].vel < a.notes[0].vel);
});

class Button extends EventTarget {attrs = {}; setAttribute(k, v) {this.attrs[k] = v;}}
test('sound is on by default, one switch silences it, denied storage and no audio do not break it', () => {
  const button = new Button();
  const sound = createSoundscape({buttons: [button], root: new EventTarget(), Context: class {},
    storage: {getItem() {throw Error('denied');}, setItem() {throw Error('denied');}}});
  assert.equal(sound.enabled, true); assert.equal(button.attrs['aria-pressed'], 'true');
  button.dispatchEvent(new Event('click')); assert.equal(sound.enabled, false);
  const dead = new Button(); createSoundscape({buttons: [dead], root: new EventTarget(), storage: null, Context: null});
  assert.equal(dead.disabled, true);
});

test('the speaker switch is on the page; the trial preset picker is gone', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal((html.match(/data-sound-toggle/g) ?? []).length, 2);
  assert.doesNotMatch(html, /data-sound-preset=/);
});
