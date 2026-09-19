// Fit into the unobscured portion of the viewport. The projection offset keeps
// OrbitControls' target on the building while placing it above the bottom dock.
export function frameInsets(width,height,{dockTop=height,topBottom=0}={}){
  const top=Math.min(height*.3,Math.max(12,topBottom+12));
  const bottom=Math.min(height*.35,Math.max(12,height-dockTop+12));
  return {verticalFraction:Math.max(.35,(height-top-bottom)/height),
    horizontalFraction:Math.max(.5,(width-24)/width),offsetY:(bottom-top)/2};
}
