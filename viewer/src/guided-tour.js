import {resolveCues, cueKey, TOUR_CUES} from './tour-script.js';
// The narrated tour's clock. The voiceover is the timeline - it never stops
// for a camera - so the driver reads the audio element and asks the viewer to
// catch up, rather than stepping the viewer and hoping the words follow.
//
// The recording is one unbroken read, so a step button would have nothing to
// step BETWEEN; what it offers instead is a transport: pause, scrub, leave.
const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Which cue is being spoken at this moment. Binary search so scrubbing a
// four-minute recording costs the same as playing it.
export function cueAt(steps, time) {
  let low = 0, high = steps.length - 1, found = 0;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (steps[mid].at <= time) {found = mid; low = mid + 1;} else high = mid - 1;
  }
  return time < steps[0].at ? -1 : found;
}
export function createGuidedTour({element, src, apply, caption, onEnd, onError, cues = TOUR_CUES}) {
  const steps = resolveCues(cues);
  const audio = new Audio();
  audio.preload = 'none';
  audio.src = src;
  const $ = s => element.querySelector(s);
  const play = $('#tour-play'), fill = $('#tour-fill'), readout = $('#tour-clock'), track = $('#tour-track');
  let index = -1, key = '', running = false, holdTimer = null, scrubbed = false;
  // A cue may ask the recording to wait on it - the lift is shown in a
  // silence the script does not contain - so the hold is taken out of the
  // voice rather than out of the timeline. Only playback triggers it: a
  // scrub that lands on the same cue must not stop the audio it just asked
  // to hear.
  const release = () => {clearTimeout(holdTimer); holdTimer = null;};

  function show(now, total) {
    const share = total ? Math.min(1, now / total) : 0;
    fill.style.width = `${(share * 100).toFixed(2)}%`;
    readout.textContent = `${clock(now)} / ${clock(total || 0)}`;
    track.setAttribute('aria-valuenow', String(Math.round(share * 100)));
  }
  // Applied on a cue change, not on every frame: a sentence about a room
  // already framed turns over its subtitle and leaves the camera alone.
  function tick() {
    if (!running) return;
    const now = audio.currentTime;
    const at = cueAt(steps, now);
    if (at !== index) {
      index = at;
      const step = steps[Math.max(0, at)];
      caption(at < 0 ? null : step);
      const next = cueKey(step);
      if (at >= 0 && next !== key) {key = next; apply(step, at);}
      if (at >= 0 && step.hold && !scrubbed && !audio.paused) {
        audio.pause(); release();
        holdTimer = setTimeout(() => {holdTimer = null; if (running) audio.play().catch(() => {});}, step.hold * 1000);
      }
      scrubbed = false;
    }
    show(now, audio.duration || 0);
  }
  audio.addEventListener('timeupdate', tick);
  audio.addEventListener('loadedmetadata', () => show(audio.currentTime, audio.duration));
  audio.addEventListener('ended', () => {running = false; onEnd?.(true);});
  // A recording that cannot be fetched must say so. Left alone the transport
  // sits on Play, the shade never lifts, and the tour looks merely stuck.
  audio.addEventListener('error', () => {running = false; release(); onError?.();});
  audio.addEventListener('play', () => {play.dataset.state = 'playing'; play.setAttribute('aria-label', play.dataset.pauseLabel || 'Duraklat');});
  audio.addEventListener('pause', () => {play.dataset.state = 'paused'; play.setAttribute('aria-label', play.dataset.playLabel || 'Devam et');});

  // A press during a hold owns the transport from then on.
  play.onclick = () => {release(); audio.paused ? audio.play().catch(() => {}) : audio.pause();};
  // Nothing may be asked of the element before it has metadata: seeking a
  // media element with no duration is an error, not a no-op.
  const loaded = () => Number.isFinite(audio.duration) && audio.duration > 0;
  const seekTo = event => {
    if (!loaded()) return;
    const rect = track.getBoundingClientRect();
    const share = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    audio.currentTime = share * audio.duration;
    // A scrub lands mid-sentence, so the cue is re-read from scratch rather
    // than waiting for the next boundary to notice the jump.
    release(); index = -1; scrubbed = true; tick();
  };
  // Capture is a convenience for dragging, not a precondition for seeking:
  // a pointer that is no longer active makes it throw, and the press that
  // asked for the seek would then be swallowed by the exception.
  track.onpointerdown = event => {
    try {track.setPointerCapture(event.pointerId);} catch {/* no live pointer */}
    seekTo(event);
  };
  track.onpointermove = event => {if (track.hasPointerCapture?.(event.pointerId)) seekTo(event);};
  track.onkeydown = event => {
    const jump = {ArrowLeft: -10, ArrowRight: 10, Home: -1e5, End: 1e5}[event.key];
    if (jump === undefined || !loaded()) return;
    event.preventDefault();
    audio.currentTime = Math.min(audio.duration, Math.max(0, audio.currentTime + jump));
    release(); index = -1; scrubbed = true; tick();
  };
  return {
    steps,
    get active() {return running;},
    get paused() {return audio.paused;},
    get time() {return audio.currentTime;},
    async start() {
      running = true; index = -1; key = ''; release(); scrubbed = false;
      if (loaded()) audio.currentTime = 0;
      // Play is claimed FIRST, while the click that started the tour is still
      // the browser's active user activation. Applying the opening view means
      // waiting on a storey to be made ready, which can outlast that window
      // and get the recording refused; the first sentence does not begin for
      // another seven tenths of a second, so nothing is heard out of place.
      const playing = audio.play().catch(() => {/* refused: the transport shows Play */});
      caption(steps[0]); key = cueKey(steps[0]); index = 0;
      show(0, audio.duration || 0);
      await apply(steps[0], 0);
      await playing;
    },
    stop() {running = false; release(); audio.pause(); if (loaded()) audio.currentTime = 0; index = -1; key = '';},
    refresh() {if (running) {const at = Math.max(0, index); caption(steps[at]);}},
  };
}
