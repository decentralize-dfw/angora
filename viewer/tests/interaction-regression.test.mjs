import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {CameraFlight} from '../src/camera-flight.js';
import {createInterfaceSound} from '../src/interface-sound.js';

test('Camera crosses the angle seam by the shortest arc',()=>{
  const previous=globalThis.matchMedia;globalThis.matchMedia=()=>({matches:false});
  try {
    const camera=new THREE.PerspectiveCamera(30,1,.1,1000),controls={target:new THREE.Vector3(),update(){}};
    camera.position.setFromSpherical(new THREE.Spherical(30,1,Math.PI-.02));
    const flight=new CameraFlight(camera,controls,()=>{},()=>{});
    flight.go({target:new THREE.Vector3(),polar:1,span:20,azimuth:-Math.PI+.02});
    assert.ok(Math.abs(flight.active.to.azimuth-flight.active.from.azimuth-.04)<1e-9);
    flight.update(flight.active.endTime);assert.equal(flight.active,null);assert.equal(controls.enabled,true);
  } finally {globalThis.matchMedia=previous;}
});
class Button extends EventTarget {attrs={};setAttribute(k,v){this.attrs[k]=v;}}

test('A delayed native GPU frame does not skip the camera flight',()=>{
  const previous=globalThis.matchMedia;globalThis.matchMedia=()=>({matches:false});
  try {
    const camera=new THREE.PerspectiveCamera(30,1,.1,1000),controls={target:new THREE.Vector3(),update(){}};
    camera.position.set(20,30,20);
    const flight=new CameraFlight(camera,controls,()=>{},()=>{});flight.limitFrameStep=true;
    const destination={target:new THREE.Vector3(1,2,3),polar:.001,span:15};
    flight.go(destination);let time=flight.active.start+7000;
    flight.update(time);assert.ok(flight.active);assert.equal(controls.enabled,false);
    for(let i=0;i<100&&flight.active;i++){time+=16;flight.update(time);}
    assert.equal(flight.active,null);assert.equal(controls.enabled,true);
    assert.ok(controls.target.distanceTo(destination.target)<1e-8);
    flight.go(destination,true);assert.equal(flight.active,null);
  } finally {globalThis.matchMedia=previous;}
});
test('Audio remains opt-in and denied storage does not block the control',()=>{
  const button=new Button(),root=new EventTarget();
  const sound=createInterfaceSound({button,root,Context:class{},storage:{getItem(){throw Error('denied');},setItem(){throw Error('denied');}}});
  assert.equal(sound.enabled,false);assert.equal(button.attrs['aria-pressed'],'false');
  button.dispatchEvent(new Event('click'));assert.equal(sound.enabled,true);
  button.dispatchEvent(new Event('click'));assert.equal(sound.enabled,false);
});
test('Unavailable audio is disabled without breaking the viewer',()=>{
  const button=new Button();createInterfaceSound({button,root:new EventTarget(),storage:null,Context:null});
  assert.equal(button.disabled,true);
});

// The neighbourhood labels every plot with its number, which is useful when
// you are reading the street - and during the narrated tour it is two
// numbering systems in one picture, competing with the camera marks that
// match the photo cards. The tour owns the numbering while it runs.
test('the neighbours give up their numbers to the tour', () => {
  const site = readFileSync(new URL('../src/site-context.js', import.meta.url), 'utf8');
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(site, /update\(view,camera,target,transitioning,walking,numbering\)/,
    'site-context takes no numbering flag');
  assert.match(site, /&&!numbering;/, 'the numbering flag does not put the labels away');
  assert.match(main, /siteContext\?\.update\(.*Boolean\(guidedTour\?\.active\)\)/,
    'main never tells the site context that the tour is numbering');
});

// "dil seyini ayarlara koy. giriste yuklenirken orta alt ksimda secilebilsin."
// The switch lives in the settings panel like every other option, and a copy
// sits under the loading card - the one moment every visitor spends looking
// at that corner of the screen, and the last moment before the tour speaks.
test('the language can be chosen while the model loads, and from the settings', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

  const topbar = html.slice(html.indexOf('<header class="topbar">'), html.indexOf('</header>'));
  assert.ok(!topbar.includes('lang-flag'), 'the switch is still floating in the chrome');

  const options = html.slice(html.indexOf('id="options-panel"'), html.indexOf('</section>', html.indexOf('id="options-panel"')));
  assert.match(options, /class="lang-flag" data-lang="tr"/, 'settings has no Turkish button');
  assert.match(options, /class="lang-flag" data-lang="en"/, 'settings has no English button');
  assert.match(options, /data-i18n="language"/, 'the settings row is unlabelled');

  const loading = html.slice(html.indexOf('id="load-language"'), html.indexOf('</div>', html.indexOf('id="load-language"') + 400));
  assert.match(loading, /data-lang="tr"/, 'the loading panel offers no Turkish');
  assert.match(loading, /data-lang="en"/, 'the loading panel offers no English');

  // Bottom centre, and it retires with the loading card rather than sitting
  // over the model for the rest of the session.
  assert.match(css, /\.load-language\{[^}]*bottom:\s*\d+px/, 'the loading picker is not anchored to the bottom');
  assert.match(css, /\.load-language\{[^}]*left:50%/, 'the loading picker is not centred');
  assert.match(css, /#app:not\(\[data-booting=true\]\) \.load-language\{[^}]*visibility:hidden/,
    'the loading picker never goes away');

  // One handler drives every copy, and it is bound before the model loads -
  // otherwise the picker would be dead for the whole time it is on screen.
  assert.match(main, /document\.querySelectorAll\('\.lang-flag'\)\.forEach\(button=>\{\s*\n\s*button\.onclick=\(\)=>setLang\(button\.dataset\.lang,refreshChrome\);/,
    'the language buttons are not bound by one handler');
  assert.ok(main.indexOf('bindInterface();') < main.indexOf('loadModel();'),
    'the interface is bound after the model starts loading');
});

// Two recordings, so switching language mid-tour is not only a caption change.
test('a language switch reaches the recording, not just the subtitles', () => {
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const tour = readFileSync(new URL('../src/guided-tour.js', import.meta.url), 'utf8');
  assert.match(main, /guidedTour\?\.setLanguage\(currentLang\(\)\)/,
    'refreshChrome never tells the tour the language changed');
  assert.match(tour, /function setLanguage\(next\)/, 'the tour cannot change language');
  // It keeps the sentence rather than the clock: the recordings are different
  // lengths and their sentences do not line up.
  const fn = tour.slice(tour.indexOf('function setLanguage(next)'), tour.indexOf('return {', tour.indexOf('function setLanguage(next)')));
  assert.match(fn, /steps\[spoken\]\.at/, 'the switch keeps the clock instead of the sentence');
  assert.match(fn, /loadedmetadata/, 'the switch seeks before the new recording has a duration');
});
