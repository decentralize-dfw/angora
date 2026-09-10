function percentile(sorted,p) {return sorted[Math.max(0,Math.ceil(sorted.length*p)-1)]??null;}
export function summarizeFrames(samples) {
  const intervals=samples.map(s=>s.interval_ms).filter(v=>Number.isFinite(v)&&v>0).sort((a,b)=>a-b);
  const total=intervals.reduce((a,b)=>a+b,0);
  return {
    frames:intervals.length,elapsed_ms:total,
    fps:total?intervals.length*1000/total:null,
    frame_ms_p50:percentile(intervals,.5),frame_ms_p95:percentile(intervals,.95),
    frame_ms_max:intervals.at(-1)??null,
    frames_over_33_4_ms:intervals.filter(v=>v>33.4).length,
    draw_calls_max:Math.max(0,...samples.map(s=>s.draw_calls??0)),
    triangles_max:Math.max(0,...samples.map(s=>s.triangles??0)),
    drawing_buffers:[...new Set(samples.map(s=>s.drawing_buffer).filter(Boolean))],
    views:[...new Set(samples.map(s=>s.view).filter(Boolean))]
  };
}

export class FrameMeasurement {
  constructor(duration=15000){this.duration=duration;this.active=false;this.result=null;}
  start(time,metadata){this.startTime=time;this.lastTime=null;this.metadata=metadata;this.samples=[];this.active=true;this.result=null;}
  sample(time,frame) {
    if(!this.active)return false;
    if(this.lastTime!==null&&time>this.lastTime)this.samples.push({...frame,offset_ms:time-this.startTime,interval_ms:time-this.lastTime});
    this.lastTime=time;
    if(time>=this.startTime+this.duration){this.finish('recorded');return true;}
    return false;
  }
  finish(status='interrupted') {
    if(!this.active)return this.result;
    this.active=false;
    this.result={schema_version:1,status,visual_acceptance:'not_reviewed',physical_device_verified:false,
      measurement:'requestAnimationFrame intervals during continuous full-scene rendering; not GPU timer queries',
      metadata:this.metadata,summary:summarizeFrames(this.samples),samples:this.samples};
    return this.result;
  }
}
