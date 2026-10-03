// Revised photographs keep the original camera coordinates and room association.
(() => {
  const revised=new Set([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,21,22,23,29,30,31,32,33,34,35]);
  for(const photo of window.ANGORA_ATLAS.photos){
    photo.en=photo.en.replace(/ \((?:C)?\d+\)/g,'');
    if(!photo.outdoor&&revised.has(photo.id)){
      photo.originalUrl=photo.url;
      photo.url=`./photogallery-v2/angora_${String(photo.id).padStart(2,'0')}.${photo.id===32?'png':'jpg'}`;
    }
  }
})();
