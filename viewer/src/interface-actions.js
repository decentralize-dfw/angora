// One Escape action per press, from the top of the stack down: an open sheet
// is above an open photograph, which is above the room tour.
export function handleEscape(event,{panelOpen,closePanel,photoOpen,closePhoto,walkActive,immersive,exitWalk}) {
  if(event.key!=='Escape'&&event.code!=='Escape')return null;
  if(panelOpen){event.preventDefault();closePanel();return 'panel';}
  if(photoOpen){event.preventDefault();closePhoto();return 'photo';}
  if(walkActive&&!immersive){event.preventDefault();exitWalk();return 'walk';}
  return null;
}
