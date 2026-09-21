import json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'.runtime/finishing';sys.path.insert(0,str(OUT/'deps'))
import numpy as np,mapbox_earcut
from shapely.geometry import Polygon,LineString,box
from shapely.ops import unary_union,linemerge
items=json.loads((OUT/'repaired.json').read_text());atlas=json.loads((ROOT/'build/web/native-current/sections-current.json').read_text());report=[]
def cut(item,h):
 p=np.array(item['attributes']['POSITION']).reshape(-1,3);tri=p[np.array(item['indices']).reshape(-1,3)];result=[]
 for t in tri[(tri[:,:,1].min(1)<h)&(tri[:,:,1].max(1)>h)]:
  points=[]
  for a,b in zip(t,np.roll(t,-1,axis=0)):
   if (a[1]<h)!=(b[1]<h):points.append((a+(b-a)*(h-a[1])/(b[1]-a[1]))[[0,2]])
  if len(points)==2 and np.linalg.norm(points[0]-points[1])>.001:result.append(LineString(np.round(points,4)))
 return result
def pack(g):
 pts=[];idx=[]
 for p in [g] if g.geom_type=='Polygon' else g.geoms:
  if p.geom_type!='Polygon' or p.area<1e-8:continue
  rings=[p.exterior,*p.interiors];xy=np.array([v for r in rings for v in list(r.coords)[:-1]],dtype=np.float64);ends=np.cumsum([len(r.coords)-1 for r in rings],dtype=np.uint32);faces=mapbox_earcut.triangulate_float64(xy,ends);offset=len(pts)//2;pts.extend(xy.ravel().tolist());idx.extend((faces+offset).tolist())
 return pts,idx
for f,s in enumerate(atlas['slices']):
 p=np.array(s['p']).reshape(-1,2);original=unary_union([Polygon(p[t]) for t in np.array(s['i']).reshape(-1,3)])
 lines=[]
 for item in items:
  if item['part']=='architecture' and (item['name'] in ['interior.001','stucco [imported]'] or any(n in item['name'] for n in ['cream tile','wall tile','wall ceramic','ochre tile','mosaic band'])):lines.extend(cut(item,s['height']))
 net=unary_union(lines);net=linemerge(net) if net.geom_type=='MultiLineString' else net;segments=[]
 for line in [net] if net.geom_type=='LineString' else net.geoms:
  coords=np.array(line.simplify(.0005).coords)
  for a,b in zip(coords,coords[1:]):
   length=np.linalg.norm(b-a)
   if length>.003:segments.append((a,b,(b-a)/length,length))
 patches=[original,net.buffer(.009,cap_style=2,join_style=2)]
 # Pair opposite source skins by shared interval, selecting nearest face.
 for a,b,u,length in segments:
  candidates=[]
  for c,d,v,l in segments:
   if abs(np.dot(u,v))<.999:continue
   offset=u[0]*(c-a)[1]-u[1]*(c-a)[0];t0=np.dot(c-a,u);t1=np.dot(d-a,u);lo=max(0,min(t0,t1));hi=min(length,max(t0,t1))
   if .035<abs(offset)<.51 and hi-lo>.004:candidates.append((lo,hi,offset))
  knots=sorted({0,length,*[t for r in candidates for t in r[:2]]})
  for lo,hi in zip(knots,knots[1:]):
   middle=(lo+hi)/2;active=[r for r in candidates if r[0]<=middle<=r[1]]
   if not active:continue
   off=min(active,key=lambda r:abs(r[2]))[2];n=np.array([-u[1],u[0]])*off;patches.append(Polygon([a+u*lo,a+u*hi,a+u*hi+n,a+u*lo+n]))
 result=unary_union(patches).buffer(.018,join_style=2).buffer(-.018,join_style=2)
 # Owner-marked narrow basement storage recess: keep its interior empty.
 # Native exterior x=-5.832 and inner skin x=-5.03, end returns z=-6.93/-3.31.
 if f==0:result=result.difference(box(-5.722,-6.81,-5.14,-3.43))
 s['p'],s['i']=pack(result)
 report.append({'floor':f,'before_m2':original.area,'after_m2':result.area,'added_m2':result.difference(original).area,'removed_m2':original.difference(result).area})
atlas['finishing_method']='Existing sections plus nearest parallel structural skins and 18mm corner closure; basement storage void preserved'
(OUT/'sections-current.json').write_text(json.dumps(atlas,separators=(',',':')));(OUT/'section-report.json').write_text(json.dumps(report,indent=2));print(report,flush=True)

