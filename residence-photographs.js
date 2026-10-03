// Revised photographs keep the original camera coordinates and room association.
(() => {
  for(const photo of window.ANGORA_ATLAS.photos){
    photo.en=photo.en.replace(/ \((?:C)?\d+\)/g,'');
    if(!photo.outdoor){
      photo.originalUrl=photo.url;
      photo.url=`./photogallery-v2/angora_${String(photo.id).padStart(2,'0')}.${photo.id===32?'png':'jpg'}`;
    }
  }
})();
