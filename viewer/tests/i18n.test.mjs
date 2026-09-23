import test from 'node:test';
import assert from 'node:assert/strict';
import {t, currentLang, roomName, setLang} from '../src/i18n.js';

// DAİMİ EMİR A5: i18n is on the regression list and shipped untested.
// Node side has no location/localStorage, so the module boots in 'tr' -
// the property's own language - and setLang drives the switch.

test('boots Turkish, t() falls back key -> tr -> key', () => {
  assert.equal(currentLang(), 'tr');
  assert.equal(t('f1'), 'Giriş katı');
  assert.equal(t('no-such-key'), 'no-such-key');
});

test('the demo-critical keys resolve in BOTH languages - a miss falls back mid-demo', () => {
  for (const key of ['f0', 'f1', 'f2', 'f3', 'lift', 'explore', 'listing',
    'loading', 'retry', 'enterVR', 'measurements', 'roomTour', 'walkHelp',
    'daylight', 'photos', 'plan']) {
    setLang('en', null);
    assert.notEqual(t(key), key, `key ${key} missing in en`);
    const en = t(key);
    setLang('tr', null);
    assert.notEqual(t(key), key, `key ${key} missing in tr`);
    // NOT asserted different: 'Plan' is honestly the same word in both.
    void en;
  }
});

test('roomName translates drawing names only away from Turkish', () => {
  setLang('tr', null);
  assert.equal(roomName('Havuz'), 'Havuz');
  setLang('en', null);
  assert.equal(roomName('Havuz'), 'Pool');
  assert.equal(roomName('Merdiven'), 'Stairs');
  assert.equal(roomName('Z99 unknown'), 'Z99 unknown', 'unknown names pass through');
  setLang('tr', null);
});

test('setLang notifies once and ignores a no-op switch', () => {
  let calls = 0;
  setLang('en', () => calls++);
  assert.equal(calls, 1);
  setLang('en', () => calls++);
  assert.equal(calls, 1, 'same language = no event');
  setLang('tr', () => calls++);
  assert.equal(calls, 2);
});
