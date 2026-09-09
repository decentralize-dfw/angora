// Only the latest room jump may complete, and leaving the tour cancels it.
export class PendingAction {
  constructor(schedule=setTimeout,clear=clearTimeout){this.schedule=schedule;this.clear=clear;this.timer=null;this.revision=0;}
  cancel(){this.revision++;if(this.timer!==null)this.clear(this.timer);this.timer=null;}
  run(action,delay){this.cancel();const revision=this.revision;this.timer=this.schedule(()=>{
    if(revision!==this.revision)return;this.timer=null;action();
  },delay);}
}
