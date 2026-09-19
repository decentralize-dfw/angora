// Decode budgets cover every model request, including the optional soil cap.
export function assetLoadBudget({compact=false,cores=4}={}) {
  return {models:compact?1:2,draco:compact?1:Math.max(1,Math.min(4,(cores||4)-1)),textures:compact?1:2};
}

export function createLoadQueue(limit) {
  if(!Number.isInteger(limit)||limit<1)throw Error('Positive load limit required');
  const pending=[];let active=0;
  function pump(){
    while(active<limit&&pending.length){
      const {run,resolve,reject}=pending.shift();active++;
      Promise.resolve().then(run).then(resolve,reject).finally(()=>{active--;pump();});
    }
  }
  return run=>new Promise((resolve,reject)=>{pending.push({run,resolve,reject});pump();});
}
