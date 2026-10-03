// Revised photographs keep the original camera coordinates and room association.
(() => {
  for(const photo of window.ANGORA_ATLAS.photos){
    photo.en=photo.en.replace(/ \((?:C)?\d+\)/g,'');
    photo.originalUrl=photo.url;
    photo.url=`./photogallery-v2/${photo.file}`;
  }
})();
