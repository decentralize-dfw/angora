// Reuse four source-positioned spotlights. A slot fades to zero before its
// source changes; retained fixtures keep their slots when proximity ranks swap.
export class InteriorLightController {
  constructor(lights, {fadeMs=300, hysteresisMetres=.6}={}) {
    if (!(fadeMs>0)) throw new Error('A positive light fade duration is required');
    this.fadeMs=fadeMs;this.hysteresisMetres=hysteresisMetres;
    this.slots=lights.map(light=>({light,source:null,desired:null,level:0,fade:null}));
    this.fixtures=[];this.floor=null;this.position=[0,0,0];this.enabled=true;
  }
  setFixtures(fixtures, time=performance.now()) {
    this.fixtures=fixtures??[];this.choose(time);
  }
  select(floor, position, time=performance.now()) {
    this.floor=floor;this.position=position??[0,0,0];this.choose(time);
  }
  setEnabled(enabled, time=performance.now()) {
    this.enabled=enabled;this.choose(time);
  }
  choose(time) {
    const retained=new Set(this.slots.map(slot=>slot.desired));
    const score=fixture=>Math.hypot(...fixture.position.map((v,i)=>v-this.position[i]))
      -(retained.has(fixture)?this.hysteresisMetres:0);
    const selected=this.enabled&&this.floor!==null
      ?this.fixtures.filter(f=>f.floor_index===this.floor).sort((a,b)=>score(a)-score(b)).slice(0,this.slots.length):[];
    const remaining=new Set(selected),desired=this.slots.map(()=>null);
    // A fixture selected again during fade-out reverses in its original slot.
    for(const field of ['source','desired'])this.slots.forEach((slot,i)=>{
      if(!desired[i]&&remaining.has(slot[field])){desired[i]=slot[field];remaining.delete(slot[field]);}
    });
    this.slots.forEach((_slot,i)=>{
      if(!desired[i]&&remaining.size){desired[i]=remaining.values().next().value;remaining.delete(desired[i]);}
    });
    this.slots.forEach((slot,i)=>{
      if(slot.desired===desired[i])return;
      slot.desired=desired[i];
      // Start at the selection event, not the last frame before a long idle.
      this.fadeTo(slot,slot.source&&slot.source===slot.desired?1:0,time);
    });
  }
  fadeTo(slot,to,start) {
    slot.fade={from:slot.level,to,start,end:start+Math.abs(to-slot.level)*this.fadeMs};
  }
  get active() {
    return this.slots.some(slot=>slot.source!==slot.desired||slot.fade!==null);
  }
  update(time) {
    let changed=false,shadowChanged=false;
    for(const slot of this.slots) {
      const {light}=slot,previousVisible=light.visible,previousIntensity=light.intensity;
      // Absolute deadlines avoid accumulating rounding errors across frames.
      // At most two phases can complete here: old source out, new source in.
      while(slot.fade) {
        const fade=slot.fade;
        if(time<fade.end) {
          const t=fade.end===fade.start?0:Math.max(0,(time-fade.start)/(fade.end-fade.start));
          slot.level=fade.from+(fade.to-fade.from)*t;break;
        }
        slot.level=fade.to;slot.fade=null;
        if(slot.source!==slot.desired) {
          slot.source=slot.desired;
          if(slot.source) {
            light.position.fromArray(slot.source.position);
            light.target.position.fromArray(slot.source.direction).add(light.position);
            light.color.fromArray(slot.source.color);
            this.fadeTo(slot,1,fade.end);
          }
          changed=true;shadowChanged=true;
        }
      }
      light.intensity=slot.source?slot.source.intensity_cd*slot.level:0;
      light.visible=light.intensity>0;
      changed||=previousIntensity!==light.intensity||previousVisible!==light.visible;
      shadowChanged||=previousVisible!==light.visible;
    }
    return {active:this.active,changed,shadowChanged};
  }
  snapshot() {
    return this.slots.filter(slot=>slot.source).map(({source,desired,level,light})=>({
      fixture:source.name??source.object,position:[...source.position],floor:source.floor_index,
      source_intensity_cd:source.intensity_cd,rendered_intensity_cd:light.intensity,
      intensity_status:source.intensity_status,weight:level,transitioning:source!==desired||level<1
    }));
  }
}
