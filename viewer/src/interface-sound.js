// Quiet, opt-in feedback, synthesized locally without downloading audio.
export function createInterfaceSound({button,root=document,storage,Context=globalThis.AudioContext??globalThis.webkitAudioContext}={}) {
  let enabled=false,context=null,last=-Infinity,generation=0;
  if(storage===undefined)try {storage=globalThis.localStorage;} catch {}
  try {enabled=storage?.getItem('angora.interface-sound')==='on';} catch {}
  const update=()=>{button.setAttribute('aria-pressed',String(enabled));button.textContent=enabled?'Arayüz sesi açık':'Arayüz sesi kapalı';};
  const suspend=()=>{try {void context?.suspend?.()?.catch(()=>{});} catch {}};
  async function play() {
    if(!enabled||!Context||root.hidden)return;
    const ticket=generation;
    try {
      context??=new Context();
      if(context.state==='suspended')await context.resume();
      if(!enabled||ticket!==generation||root.hidden||context.state!=='running')return;
      const now=context.currentTime;
      if(now-last<.08)return;
      last=now;
      const tone=context.createOscillator(),gain=context.createGain();
      tone.type='sine';tone.frequency.setValueAtTime(620,now);tone.frequency.exponentialRampToValueAtTime(420,now+.055);
      gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.025,now+.007);gain.gain.exponentialRampToValueAtTime(.0001,now+.07);
      tone.connect(gain);gain.connect(context.destination);tone.start(now);tone.stop(now+.08);
      tone.onended=()=>{tone.disconnect();gain.disconnect();};
    } catch { /* Audio availability must never interrupt navigation. */ }
  }
  // The section cut has a sound now: two soft sines sweeping the way the plane
  // travels, over exactly as long as the plane takes. It is deliberately small
  // - a transmission, not a whoosh - and it plays for the narrated tour even
  // when the interface click is switched off, because the tour is already an
  // audio piece and a silent cut inside it reads as a dropout.
  async function transition(ms=950,rising=true,force=false) {
    if((!enabled&&!force)||!Context||root.hidden)return;
    const ticket=generation;
    try {
      context??=new Context();
      if(context.state==='suspended')await context.resume();
      if((!enabled&&!force)||ticket!==generation||root.hidden||context.state!=='running')return;
      const now=context.currentTime,span=Math.max(.3,Math.min(2.5,ms/1000));
      // A swell, not a sweep. Two sines a fifth apart drifting by barely a
      // tone, under a lowpass that opens and closes - so the cut is FELT
      // rather than heard as an effect. The earlier version ran a bandpass
      // over an octave glide and read as a sci-fi door.
      const base=rising?174.6:146.8,drift=rising?1.12:0.89;
      const filter=context.createBiquadFilter();
      filter.type='lowpass';filter.Q.value=.5;
      filter.frequency.setValueAtTime(320,now);
      filter.frequency.linearRampToValueAtTime(1150,now+span*.45);
      filter.frequency.linearRampToValueAtTime(300,now+span);
      const gain=context.createGain();
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.linearRampToValueAtTime(.03,now+span*.38);
      gain.gain.linearRampToValueAtTime(.024,now+span*.7);
      gain.gain.exponentialRampToValueAtTime(.0001,now+span);
      const voices=[[base,'sine',1],[base*1.5,'sine',.5],[base*2,'triangle',.18]].map(([hz,type,level])=>{
        const tone=context.createOscillator(),level$=context.createGain();
        tone.type=type;level$.gain.value=level;
        tone.frequency.setValueAtTime(hz,now);
        tone.frequency.linearRampToValueAtTime(hz*drift,now+span);
        tone.connect(level$);level$.connect(filter);tone.start(now);tone.stop(now+span+.08);
        return {tone,level$};
      });
      filter.connect(gain);gain.connect(context.destination);
      voices[0].tone.onended=()=>{for(const v of voices){v.tone.disconnect();v.level$.disconnect();}filter.disconnect();gain.disconnect();};
    } catch { /* Audio availability must never interrupt navigation. */ }
  }
  button.disabled=!Context;
  update();
  button.addEventListener('click',()=>{
    enabled=!enabled;generation++;update();
    try {storage?.setItem('angora.interface-sound',enabled?'on':'off');} catch {}
    if(enabled)void play();
    else suspend();
  });
  root.addEventListener('click',event=>{
    const control=event.target.closest?.('button');
    if(control&&control!==button&&!control.disabled)void play();
  });
  root.addEventListener('visibilitychange',()=>{if(root.hidden){generation++;suspend();}});
  return {play,transition,get enabled(){return enabled;}};
}
