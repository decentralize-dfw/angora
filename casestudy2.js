import { FLOWS, LAYERS, clampTime, sceneAt, counterpart } from './casestudy2-data.js';
import { renderReview } from './casestudy2-review.js';

const $ = id => document.getElementById(id);
const video = $('recording');
const projectNames = { era: 'ERA Residence', likova: 'Likova', active: '03 · Angora web2 / Aktif inceleme' };
const state = { flow: FLOWS['era-desktop'], scene: null, pendingTime: 0, loading: true, error: false, layers: new Set(Object.keys(LAYERS)), query: '' };
const clock = (time, decimals = false) => {
 const centiseconds = Math.round(Math.max(0, time || 0) * 100), seconds = Math.floor(centiseconds / 100);
 return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}${decimals ? '.' + String(centiseconds % 100).padStart(2, '0') : ''}`;
};
const el = (tag, text, className) => {
 const node = document.createElement(tag);
 if (text != null) node.textContent = text;
 if (className) node.className = className;
 return node;
};
function status(message) { $('stage-status').textContent = message; $('stage-status').hidden = !message; }
function fitFrame() {
 const stage = $('stage'), frame = $('media-frame'), { width, height } = state.flow;
 const availableWidth = stage.clientWidth, availableHeight = Math.max(1, stage.clientHeight - 42);
 const scale = Math.min(availableWidth / width, availableHeight / height);
 Object.assign(frame.style, { width: `${width * scale}px`, height: `${height * scale}px`, top: `${30 + (availableHeight - height * scale) / 2}px` });
}
new ResizeObserver(fitFrame).observe($('stage'));

function renderCatalog() {
 const { flow, scene } = state;
 const needle = state.query.toLocaleLowerCase('tr');
 const filtered = flow.scenes.filter(s => `${s.title} ${s.family} ${s.summary}`.toLocaleLowerCase('tr').includes(needle));
 $('scene-count').textContent = `${filtered.length}${needle ? '/' + flow.scenes.length : ''} sahne`;
 $('take-duration').textContent = clock(flow.duration);
 const fragment = document.createDocumentFragment();
 filtered.forEach(s => {
  const button = el('button', null, 'scene-item'); button.dataset.scene = s.id;
  button.setAttribute('aria-current', String(s.id === scene.id));
  button.append(el('span', String(s.id).padStart(2, '0'), 'index'));
  const title = el('span'); title.append(el('b', s.title), el('small', `${s.family} · ${clock(s.duration, true)} · kaynak ${clock(s.sourceStart)}`));
  if (s.review) title.append(el('small', `${s.review.verdict} · ${s.review.score.toFixed(1)} / 10`, 'catalog-verdict'));
  button.append(title); button.addEventListener('click', () => selectScene(flow, s)); fragment.append(button);
 });
 if (!filtered.length) fragment.append(el('p', 'Bu kayıtta eşleşen sahne yok.', 'empty-search'));
 $('scene-list').replaceChildren(fragment);
}
function renderTracks() {
 const fragment = document.createDocumentFragment();
 Object.entries(LAYERS).forEach(([type, layer]) => {
  const row = el('div', null, 'layer-row'); row.style.setProperty('--layer', layer.color);
  const label = el('label', null, 'layer-toggle');
  const input = document.createElement('input'); input.type = 'checkbox'; input.checked = state.layers.has(type);
  input.addEventListener('change', () => { input.checked ? state.layers.add(type) : state.layers.delete(type); renderAnnotations(); updatePlayback(); });
  label.append(input, el('span', layer.label));
  const lane = el('div', null, 'lane'); lane.dataset.type = type;
  state.scene.layers.filter(l => l.type === type).forEach(l => {
   const bar = el('button'); bar.style.left = `${l.range[0] * 100}%`; bar.style.width = `${(l.range[1] - l.range[0]) * 100}%`;
   bar.title = l.note; bar.setAttribute('aria-label', `${layer.label}: ${l.note}`);
   bar.dataset.start = l.range[0]; bar.dataset.end = l.range[1];
   bar.addEventListener('click', () => seek(state.scene.start + l.range[0] * state.scene.duration)); lane.append(bar);
  });
  lane.append(el('span', null, 'playhead')); row.append(label, lane); fragment.append(row);
 });
 $('layer-tracks').replaceChildren(fragment);
}
function renderAnnotations() {
 const svg = $('annotations'); svg.replaceChildren(); svg.style.display = $('show-annotations').checked ? '' : 'none';
 $('stage').querySelector('.stage-caption span:last-child').textContent = $('show-annotations').checked ? 'ORIGINAL + ANALYSIS' : 'ORIGINAL CAPTURE';
 const ns = 'http://www.w3.org/2000/svg';
 const badgePositions = new Map();
 state.scene.layers.forEach(l => {
  if (!l.box || !state.layers.has(l.type)) return;
  const group = document.createElementNS(ns, 'g'); group.dataset.start = l.range[0]; group.dataset.end = l.range[1];
  const [x, y, w, h] = l.box.map(n => n * 10), color = LAYERS[l.type].color;
  const rect = document.createElementNS(ns, 'rect');
  for (const [key, value] of Object.entries({ x, y, width: w, height: h, stroke: color, class: 'annotation-box' })) rect.setAttribute(key, value);
  const origin = `${x},${y}`, level = badgePositions.get(origin) || 0; badgePositions.set(origin, level + 1);
  const badgeY = Math.min(y + 32 * level, 968), badgeX = Math.min(x, 825);
  const badge = document.createElementNS(ns, 'rect'); badge.setAttribute('x', badgeX); badge.setAttribute('y', badgeY); badge.setAttribute('width', '175'); badge.setAttribute('height', '30'); badge.setAttribute('fill', color);
  const label = document.createElementNS(ns, 'text'); label.setAttribute('x', badgeX + 8); label.setAttribute('y', badgeY + 20); label.setAttribute('class', 'annotation-label'); label.textContent = LAYERS[l.type].label.toLocaleUpperCase('tr');
  group.append(rect, badge, label); svg.append(group);
 });
}
function renderDetails() {
 const { flow, scene } = state;
 $('breakdown-title').textContent = scene.title;
 $('scene-summary').textContent = scene.summary;
 $('scene-tags').replaceChildren(...[scene.family, `${clock(scene.duration, true)} kayıt aralığı`, flow.device === 'mobile' ? 'Mobil emülasyon' : 'Desktop', '60 fps'].map(t => el('span', t)));
 $('scene-lesson').textContent = scene.lesson;
 const matches = counterpart(flow, scene);
 $('device-note').textContent = flow.deviceNote + (matches ? ` Bu sahnenin diğer kayıttaki karşılığı: “${matches.title}”.` : ' Bu sahnenin diğer kayıtta doğrudan karşılığı bulunmuyor.');
 $('counterpart').disabled = !matches;
 $('coverage-note').textContent = `${flow.source} · kaynak ${clock(flow.offset, true)}–${clock(flow.offset + flow.duration, true)}. ${flow.coverage}`;
 $('missing-note').textContent = `Kapsam dışında: ${flow.gaps}`;
 $('recording-download').href = flow.video;
 $('provenance-link').href = flow.video.replace('.mp4', '-provenance.json');
 const phaseFragment = document.createDocumentFragment();
 scene.phases.forEach(([fraction, title, note]) => {
  const time = clampTime(scene.start + scene.duration * fraction, scene);
  const phase = el('div', null, 'phase'), button = el('button', clock(time - scene.start, true)), text = el('div');
  button.setAttribute('aria-label', `${title} karesine git`); button.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'instant' }); seek(time); });
  text.append(el('b', title), el('p', note)); phase.append(button, text); phaseFragment.append(phase);
 });
 $('phase-list').replaceChildren(phaseFragment);
 $('layer-notes').replaceChildren(...scene.layers.map(l => {
  const note = el('div', null, 'layer-note'); note.style.setProperty('--layer', LAYERS[l.type].color);
  note.append(el('b', LAYERS[l.type].label), el('p', l.note)); return note;
 }));
 const stills = [0, .5, 1].map((fraction, index) => {
  const time = clampTime(scene.start + scene.duration * fraction, scene);
  const button = el('button'), figure = el('figure'), imageFrame = el('div', null, 'still'), img = document.createElement('img');
  img.src = `./assets/casestudy2/${flow.project}/stills/${flow.device}-${scene.id}-${index}.jpg`;
  img.alt = `${scene.title}, ${['başlangıç', 'orta', 'son'][index]} karesi`; img.loading = 'lazy'; img.width = flow.device === 'desktop' ? 640 : 426; img.height = flow.device === 'desktop' ? 350 : 636;
  imageFrame.append(img); const caption = el('figcaption'); caption.append(el('span', ['01 / Başlangıç', '02 / Orta', '03 / Son kare'][index]), el('span', clock(time + flow.offset, true)));
  figure.append(imageFrame, caption); button.append(figure); button.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'instant' }); seek(time); }); return button;
 });
 $('contact-sheet').replaceChildren(...stills);
 renderReview(flow, scene, seek);
}
function updateSceneUI() {
 const { flow, scene } = state;
 $('scene-location').textContent = `${projectNames[flow.project]} / ${flow.device === 'desktop' ? 'Desktop' : 'Mobil emülasyon'} / ${scene.family}`;
 $('scene-number').textContent = String(scene.id).padStart(2, '0'); $('scene-title').textContent = scene.title;
 $('take-label').textContent = `${flow.viewport} · 60 FPS`;
 $('previous-scene').disabled = scene.id === 1; $('next-scene').disabled = scene.id === flow.scenes.length;
 $('scrub').step = String(1000 / (scene.duration * flow.fps));
 for (const button of document.querySelectorAll('[data-project]')) button.setAttribute('aria-pressed', String(button.dataset.project === flow.project));
 for (const button of document.querySelectorAll('[data-device]')) button.setAttribute('aria-pressed', String(button.dataset.device === flow.device));
 $('live-reference').href = {era:'https://www.era-residence.com/',likova:'https://likova.space/',active:'./web2.html'}[flow.project];
 history.replaceState(null, '', `#${flow.id}-${scene.id}`);
 renderCatalog(); renderTracks(); renderAnnotations(); renderDetails(); fitFrame();
}
function selectScene(flow, scene, { seekVideo = true, scrollTop = true } = {}) {
 const differentVideo = flow.id !== state.flow.id || !video.getAttribute('src');
 state.flow = flow; state.scene = scene; state.pendingTime = scene.start;
 if (seekVideo) video.pause();
 updateSceneUI(); closeCatalog();
 if (scrollTop) window.scrollTo({ top: 0, behavior: 'instant' });
 if (differentVideo) {
  state.loading = true; state.error = false; $('media-frame').setAttribute('aria-busy', 'true'); status('Kaynak görüntü yükleniyor…');
  video.poster = `./assets/casestudy2/${flow.project}/stills/${flow.device}-${scene.id}-0.jpg`;
  video.src = flow.video; video.load();
 } else if (seekVideo) seek(scene.start);
 updatePlayback();
}
function seek(time) {
 video.pause();
 state.pendingTime = clampTime(time, state.scene, state.flow.fps);
 if (video.readyState >= 1) { $('media-frame').setAttribute('aria-busy', 'true'); video.currentTime = state.pendingTime; }
 updatePlayback();
}
async function play() {
 if (state.loading || video.readyState < 2) return;
 const { scene, flow } = state;
 if (!$('continuous').checked && video.currentTime >= scene.end - 1 / flow.fps - .01) video.currentTime = scene.start;
 try { await video.play(); status(''); } catch (error) { status(`Oynatma başlatılamadı: ${error.message}`); }
}
function updatePlayback() {
 if (!state.scene) return;
 const { flow, scene } = state, time = state.loading ? state.pendingTime : video.currentTime;
 const fraction = Math.max(0, Math.min(1, (time - scene.start) / scene.duration));
 $('scrub').value = String(fraction * 1000);
 $('clip-time').textContent = clock(Math.min(scene.duration, Math.max(0, time - scene.start)), true);
 $('source-time').textContent = `Kaynak ${clock(time + flow.offset, true)} · ${flow.device === 'mobile' ? '459 × 686 emülasyon' : '1920 × 1050'}`;
 $('play').textContent = video.paused ? 'Oynat ▷' : 'Duraklat Ⅱ'; $('play').setAttribute('aria-label', video.paused ? 'Kaydı oynat' : 'Kaydı duraklat');
 $('play').disabled = state.loading || state.error;
 document.querySelectorAll('.playhead').forEach(p => p.style.left = `${fraction * 100}%`);
 document.querySelectorAll('.lane').forEach(lane => {
  lane.style.opacity = state.layers.has(lane.dataset.type) ? '1' : '.25';
  lane.querySelectorAll('button').forEach(b => b.classList.toggle('is-active', fraction >= +b.dataset.start && fraction <= +b.dataset.end));
 });
 $('annotations').querySelectorAll('g').forEach(g => g.style.display = fraction >= +g.dataset.start && fraction <= +g.dataset.end ? '' : 'none');
}
function tick() {
 if (!video.paused && !video.seeking && state.scene) {
  if ($('continuous').checked) {
   const current = sceneAt(state.flow, video.currentTime);
   if (current.id !== state.scene.id) selectScene(state.flow, current, { seekVideo: false, scrollTop: false });
  } else if (video.currentTime >= state.scene.end - 1 / state.flow.fps) {
   if ($('loop').checked) { video.currentTime = state.scene.start; }
   else { video.pause(); video.currentTime = state.scene.end - 1 / state.flow.fps; }
  }
 }
 updatePlayback(); requestAnimationFrame(tick);
}
video.addEventListener('loadedmetadata', () => { video.currentTime = state.pendingTime; video.playbackRate = +$('speed').value; });
video.addEventListener('loadeddata', () => { state.loading = false; if (!video.seeking) $('media-frame').setAttribute('aria-busy', 'false'); status(''); updatePlayback(); });
video.addEventListener('seeking', () => $('media-frame').setAttribute('aria-busy', 'true'));
video.addEventListener('seeked', () => { $('media-frame').setAttribute('aria-busy', 'false'); if (video.readyState >= 2) { state.loading = false; status(''); } updatePlayback(); });
video.addEventListener('error', () => { state.loading = false; state.error = true; $('media-frame').setAttribute('aria-busy', 'false'); status('Bu kayıt yüklenemedi. Yerel video dosyasını ve bağlantıyı kontrol edin.'); updatePlayback(); });
video.addEventListener('ended', () => { if ($('loop').checked && !$('continuous').checked) { video.currentTime = state.scene.start; play(); } else video.pause(); });
video.addEventListener('click', () => video.paused ? play() : video.pause());
$('play').addEventListener('click', () => video.paused ? play() : video.pause());
$('frame-back').addEventListener('click', () => seek(video.currentTime - 1 / state.flow.fps));
$('frame-forward').addEventListener('click', () => seek(video.currentTime + 1 / state.flow.fps));
$('scrub').addEventListener('input', () => seek(state.scene.start + state.scene.duration * +$('scrub').value / 1000));
$('speed').addEventListener('change', () => video.playbackRate = +$('speed').value);
$('show-annotations').addEventListener('change', () => { renderAnnotations(); updatePlayback(); });
$('continuous').addEventListener('change', () => { if (!$('continuous').checked) seek(clampTime(video.currentTime, state.scene)); });
$('previous-scene').addEventListener('click', () => selectScene(state.flow, state.flow.scenes[state.scene.id - 2]));
$('next-scene').addEventListener('click', () => selectScene(state.flow, state.flow.scenes[state.scene.id]));
$('counterpart').addEventListener('click', () => { const match = counterpart(state.flow, state.scene); if (match) selectScene(FLOWS[`${state.flow.project}-${state.flow.device === 'desktop' ? 'mobile' : 'desktop'}`], match); });
for (const button of document.querySelectorAll('[data-project]')) button.addEventListener('click', () => {
 const flow = FLOWS[`${button.dataset.project}-${state.flow.device}`]; if (flow === state.flow) return;
 state.query = ''; $('scene-search').value = ''; selectScene(flow, flow.scenes[0]);
});
for (const button of document.querySelectorAll('[data-device]')) button.addEventListener('click', () => {
 const flow = FLOWS[`${state.flow.project}-${button.dataset.device}`]; if (flow === state.flow) return;
 const scene = flow.scenes.find(s => s.key === state.scene.key) || flow.scenes[0];
 state.query = ''; $('scene-search').value = ''; selectScene(flow, scene);
});
$('scene-search').addEventListener('input', () => { state.query = $('scene-search').value; renderCatalog(); });
$('details-link').addEventListener('click', event => { event.preventDefault(); $('breakdown').scrollIntoView({ block: 'start', behavior: 'instant' }); });
function closeCatalog() { $('catalog').classList.remove('is-open'); $('open-catalog').setAttribute('aria-expanded', 'false'); }
$('open-catalog').addEventListener('click', () => { $('catalog').classList.add('is-open'); $('open-catalog').setAttribute('aria-expanded', 'true'); $('close-catalog').focus(); });
$('close-catalog').addEventListener('click', () => { closeCatalog(); $('open-catalog').focus(); });
document.addEventListener('pointerdown', event => { if ($('catalog').classList.contains('is-open') && !$('catalog').contains(event.target) && !$('open-catalog').contains(event.target)) closeCatalog(); });
$('fullscreen').addEventListener('click', async () => { try { document.fullscreenElement ? await document.exitFullscreen() : await $('stage').requestFullscreen(); } catch { status('Bu tarayıcı tam ekranı desteklemiyor.'); } });
document.addEventListener('fullscreenchange', fitFrame);
document.addEventListener('keydown', event => {
 if (event.key === 'Escape') { closeCatalog(); return; }
 if (event.target.matches('input,select,textarea,button,a') || event.ctrlKey || event.metaKey || event.altKey) return;
 if (event.code === 'Space') { event.preventDefault(); video.paused ? play() : video.pause(); }
 if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); seek(video.currentTime + (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 1 : 1 / state.flow.fps)); }
});
function fromHash() {
 const match = location.hash.match(/^#(era|likova|active)-(desktop|mobile)-(\d+)$/);
 if (!match) return null;
 const flow = FLOWS[`${match[1]}-${match[2]}`], scene = flow.scenes[+match[3] - 1]; return scene ? { flow, scene } : null;
}
window.addEventListener('hashchange', () => { const target = fromHash(); if (target) selectScene(target.flow, target.scene); });
const initial = fromHash(); selectScene(initial?.flow || state.flow, initial?.scene || state.flow.scenes[0]); tick();
