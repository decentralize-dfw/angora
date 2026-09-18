// One Escape action per press: an open sheet is above the room tour.
export function handleEscape(event,{panelOpen,closePanel,walkActive,immersive,exitWalk}) {
  if(event.key!=='Escape'&&event.code!=='Escape')return null;
  if(panelOpen){event.preventDefault();closePanel();return 'panel';}
  if(walkActive&&!immersive){event.preventDefault();exitWalk();return 'walk';}
  return null;
}
