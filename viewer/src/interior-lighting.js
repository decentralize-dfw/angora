// Reuse four source-positioned spotlights. A slot fades to zero before its
// source changes; retained fixtures keep their slots when proximity ranks swap.
export class InteriorLightController {
  constructor(lights, {fadeMs=300, hysteresisMetres=.6}={}) {
    if (!(fadeMs>0)) throw new Error('A positive light fade duration is required');
    this.fadeMs=fadeMs;this.hysteresisMetres=hysteresisMetres;
    this.slots=lights.map(light=>({light,source:null,desired:null,level:0,fade:null}));
    this.fixtures=[];this.floor=null;this.position=[0,0,0];this.enabled=true;
    // A lamp measured for the room it stands in. Seen from the garden at
    // night, through glass, at the exposure an exterior is graded for, a 6 m
    // throw is nothing at all - so the whole-house mode may ask for more.
    // The lamps stay where the register put them; only their reach changes.
    this.gain=1;this.reach=null;
    this.throw$=lights.map(light=>light.distance);
  }
  setFixtures(fixtures, time=performance.now()) {
    this.fixtures=fixtures??[];this.choose(time);
  }
  select(floor, position, time=performance.now()) {
    this.floor=floor;this.position=position??[0,0,0];this.choose(time);
  }
  // gain multiplies the rendered candela, reach replaces the spot's cutoff
  // distance in metres; null puts each light back on its own.
  setBoost({gain=1, reach=null}={}) {
    if(gain===this.gain&&reach===this.reach)return false;
    this.gain=gain;this.reach=reach;
    this.slots.forEach((slot,i)=>{slot.light.distance=reach??this.throw$[i];});
    return true;
  }
  setEnabled(enabled, time=performance.now()) {
    this.enabled=enabled;this.choose(time);
  }
  choose(time) {
    const retained=new Set(this.slots.map(slot=>slot.desired));
    const score=fixture=>Math.hypot(...fixture.position.map((v,i)=>v-this.position[i]))
      -(retained.has(fixture)?this.hysteresisMetres:0);
    const selected=this.enabled&&this.floor!==null?this.pick(score):[];
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
  // Which fixtures the slots are spent on. Walking a storey spends them all
  // on that storey, nearest the visitor - four lamps around one room is what
  // being in the room looks like.
  //
  // 'all' is the house seen from outside after dark, which is not one lit
  // storey: it is a window here and a window there. So the slots go one to a
  // storey, each the nearest of its own, and only double up where the house
  // has fewer storeys than slots.
  pick(score) {
    const ordered=this.fixtures.slice().sort((a,b)=>score(a)-score(b));
    if(this.floor!=='all')
      return ordered.filter(f=>f.floor_index===this.floor).slice(0,this.slots.length);
    const perStorey=new Map();
    for(const fixture of ordered)
      if(!perStorey.has(fixture.floor_index))perStorey.set(fixture.floor_index,fixture);
    const chosen=[...perStorey.values()].slice(0,this.slots.length);
    const taken=new Set(chosen);
    for(const fixture of ordered){
      if(chosen.length>=this.slots.length)break;
      if(!taken.has(fixture)){chosen.push(fixture);taken.add(fixture);}
    }
    return chosen;
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
      light.intensity=slot.source?slot.source.intensity_cd*slot.level*this.gain:0;
      // Native floor streams retain the same shader light count while fixtures
      // fade. Hiding zero-intensity slots would compile a new shader variant
      // at both ends of every fade, after the floor's GPU warm-up.
      light.visible=Boolean(this.keepSlotsVisible)||light.intensity>0;
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
