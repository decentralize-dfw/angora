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
      const now=context.currentTime,span=Math.max(.25,Math.min(2.5,ms/1000));
      const from=rising?196:392,to=rising?392:196;
      const filter=context.createBiquadFilter();
      filter.type='bandpass';filter.Q.value=1.1;
      filter.frequency.setValueAtTime(from*2,now);
      filter.frequency.exponentialRampToValueAtTime(to*2,now+span);
      const gain=context.createGain();
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(.016,now+span*.22);
      gain.gain.setValueAtTime(.016,now+span*.6);
      gain.gain.exponentialRampToValueAtTime(.0001,now+span);
      const voices=[from,from*1.5].map((hz,i)=>{
        const tone=context.createOscillator();
        tone.type=i?'triangle':'sine';
        tone.frequency.setValueAtTime(hz,now);
        tone.frequency.exponentialRampToValueAtTime(hz*to/from,now+span);
        tone.connect(filter);tone.start(now);tone.stop(now+span+.05);
        return tone;
      });
      filter.connect(gain);gain.connect(context.destination);
      voices[0].onended=()=>{for(const v of voices)v.disconnect();filter.disconnect();gain.disconnect();};
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
