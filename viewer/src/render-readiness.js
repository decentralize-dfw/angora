// Shader compilation and draw submission do not mean texture uploads have
// finished on the GPU. Keep the loading state until the warm-up fence signals.
export function waitForGPU(renderer,{schedule=requestAnimationFrame,now=()=>performance.now(),timeoutMs=15000}={}){
 const gl=renderer.getContext();
 if(gl.isContextLost())return Promise.reject(new Error('WebGL context lost'));
 if(!gl.fenceSync){gl.finish();return Promise.resolve();}
 const fence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);
 if(!fence)return Promise.reject(new Error('GPU readiness fence unavailable'));
 gl.flush();const started=now();
 return new Promise((resolve,reject)=>{
  function check(){
   const status=gl.clientWaitSync(fence,0,0);
   if(status===gl.ALREADY_SIGNALED||status===gl.CONDITION_SATISFIED){gl.deleteSync(fence);resolve();return;}
   if(status===gl.WAIT_FAILED||gl.isContextLost()){gl.deleteSync(fence);reject(new Error('GPU preparation interrupted'));return;}
   // Yavaş GPU (tümleşik kart, ilk açılışta yüzlerce doku) çiti zamanında bitiremeyebilir: bu bir hata değil.
   // Eskiden burada reddediliyordu ve kat geçişi kamera/ışık kurulmadan "yüklenemedi" ile kesiliyordu.
   if(now()-started>timeoutMs){gl.deleteSync(fence);console.warn('GPU hazırlığı uzun sürdü, beklemeden devam');resolve();return;}
   schedule(check);
  }
  schedule(check);
 });
}
