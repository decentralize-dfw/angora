import {t} from './web3-i18n.js?v=20261006-refinement-2';
import {decodedImage} from './web3-media.js?v=20261006-refinement-2';
import {photoURL} from './web3-plans.js?v=20261006-refinement-2';
export function installOverlays({state,manifest,history,onNavigate}){
  let opener=null,current=null,afterClose=null,imageToken=0;
  const dialogs=[...document.querySelectorAll('dialog')];
  function announce(message){document.querySelector('#status').textContent=message;setTimeout(()=>document.querySelector('#status').textContent='',3500);}
  function finishClose(){
    imageToken++;dialogs.forEach(d=>{if(d.open)d.close();});current=null;state.close();
    (opener?.isConnected?opener:document.querySelector('#plan-surface [data-open-camera]'))?.focus?.({preventScroll:true});opener=null;
    const callback=afterClose;afterClose=null;return callback;
  }
  function close(callback){
    afterClose=callback||null;
    if(history.restoring){finishClose()?.();return;}
    if(window.history.state?.web3?.overlay){window.history.back();}else{const callback=finishClose();history.write();callback?.();}
  }
  function show(origin,push=true){
    if(current)finishClose();opener=document.activeElement;
    // The parent history entry must record the actual opening position, even
    // when a horizontal rail has moved since its last selected-card update.
    if(push)history.write();
    if(!state.open(origin))return;
    current=origin.type==='photo'?document.querySelector('#photo-dialog'):origin.type==='menu'?document.querySelector('#menu-dialog'):document.querySelector('#enquiry-dialog');
    current.showModal();current.querySelector('[data-close]').focus({preventScroll:true});
    if(origin.type==='photo'){current.querySelector('img').style.visibility='hidden';showPhoto(origin.index);}
    if(push)history.write(true);
  }
  async function showPhoto(index){
    const origin=state.snapshot().overlay;if(origin?.type!=='photo')return;
    const items=origin.collection,indexSafe=(index+items.length)%items.length,item=items[indexSafe],token=++imageToken;
    try{const image=await decodedImage(photoURL(manifest,item.key,1600));if(token!==imageToken||!current?.open)return;
      const img=current.querySelector('img');img.src=image.src;img.alt=item.title;img.style.visibility='visible';
      document.querySelector('#photo-dialog-caption').textContent=item.title;
      document.querySelector('#photo-position').textContent=`${indexSafe+1} / ${items.length}`;
      state.local('overlay-photo',{overlay:{...origin,index:indexSafe,key:item.key}});history.write();
    }catch{announce('This photograph could not load. Please try another viewpoint.');}
  }
  dialogs.forEach(dialog=>{
    dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
    dialog.querySelector('[data-close]').addEventListener('click',()=>close());
  });
  document.querySelector('#photo-prev').addEventListener('click',()=>showPhoto(state.snapshot().overlay.index-1));
  document.querySelector('#photo-next').addEventListener('click',()=>showPhoto(state.snapshot().overlay.index+1));
  document.querySelector('#photo-dialog').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();showPhoto(state.snapshot().overlay.index+(e.key==='ArrowLeft'?-1:1));}});
  document.querySelector('#menu-toggle')?.addEventListener('click',()=>show({type:'menu',y:scrollY,section:state.snapshot().section}));
  function enquiry(purchase){
    document.querySelector('#enquiry-title').innerHTML=purchase?'Discuss a <em>purchase.</em>':'Arrange a <em>viewing.</em>';
    document.querySelector('[name="message"]').value=t(purchase?'I would like to discuss purchasing Angora Twenty One.':'I would like to arrange a viewing of Angora Twenty One.');
    show({type:'enquiry',purchase,y:scrollY,section:state.snapshot().section});
  }
  document.querySelector('#enquiry-open').addEventListener('click',()=>enquiry(false));document.querySelector('#purchase-open').addEventListener('click',()=>enquiry(true));
  document.querySelector('#enquiry-form').addEventListener('submit',e=>{
    e.preventDefault();const data=new FormData(e.target);const text=`${String(data.get('name')).trim()}: ${String(data.get('message')).trim()}`;
    window.open('https://wa.me/905333048359?text='+encodeURIComponent(text),'_blank','noopener');
  });
  document.querySelector('#menu-dialog nav').addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;e.preventDefault();e.stopPropagation();close(()=>onNavigate(a.hash));});
  return {show,close,finishClose,showPhoto,get isOpen(){return !!current;}};
}
