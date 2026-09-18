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
  return {play,get enabled(){return enabled;}};
}
