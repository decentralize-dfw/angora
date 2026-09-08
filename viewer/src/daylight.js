// NOAA fractional-year solar equations. Local civil time is UTC+3.
// The model-to-north angle is separately recorded; this is a visual study,
// not a certified insolation survey.
export function solarPosition(hour, {latitude=39.88, longitude=32.73, day=172, northRotation=0}={}) {
  const rad=Math.PI/180, g=2*Math.PI/365*(day-1+(hour-12)/24);
  const eq=229.18*(.000075+.001868*Math.cos(g)-.032077*Math.sin(g)-.014615*Math.cos(2*g)-.040849*Math.sin(2*g));
  const dec=.006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+.000907*Math.sin(2*g)-.002697*Math.cos(3*g)+.00148*Math.sin(3*g);
  const ha=(hour*60+eq+4*longitude-180)/4*rad-Math.PI, lat=latitude*rad;
  const east=-Math.cos(dec)*Math.sin(ha);
  const north=Math.cos(lat)*Math.sin(dec)-Math.sin(lat)*Math.cos(dec)*Math.cos(ha);
  const up=Math.sin(lat)*Math.sin(dec)+Math.cos(lat)*Math.cos(dec)*Math.cos(ha);
  const c=Math.cos(northRotation),s=Math.sin(northRotation);
  return {direction:[east*c+north*s,up,east*s-north*c],altitude:Math.asin(Math.max(-1,Math.min(1,up)))/rad};
}
export function clockLabel(hour) {
  const minutes=Math.round(hour*60);
  return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
}
