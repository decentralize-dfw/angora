"""Section the owner's original stair solid, without generating replacement walls."""
import json,gzip,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'.runtime/finishing/deps'))
import numpy as np,mapbox_earcut
from shapely.geometry import Polygon,LineString
from shapely.ops import unary_union,polygonize
source=json.loads((ROOT/'.runtime/finishing/owner-solid-stair.json').read_text())
p=np.array(source['attributes']['POSITION']).reshape(-1,3);triangles=p[np.array(source['indices']).reshape(-1,3)]
def section(h):
 lines=[]
 for t in triangles:
  points=[]
  for a,b in zip(t,np.roll(t,-1,axis=0)):
   if (a[1]<h)!=(b[1]<h):points.append(np.round((a+(b-a)*(h-a[1])/(b[1]-a[1]))[[0,2]],4))
  if len(points)==2 and np.linalg.norm(points[0]-points[1])>.00001:lines.append(LineString(points))
 return unary_union(list(polygonize(unary_union(lines))))
def pack(g):
 points=[];indices=[]
 for poly in [g] if g.geom_type=='Polygon' else g.geoms:
  if poly.geom_type!='Polygon' or poly.area<1e-8:continue
  rings=[poly.exterior,*poly.interiors];xy=np.array([v for r in rings for v in list(r.coords)[:-1]],dtype=np.float64)
  faces=mapbox_earcut.triangulate_float64(xy,np.cumsum([len(r.coords)-1 for r in rings],dtype=np.uint32));indices.extend((faces+len(points)//2).tolist());points.extend(xy.ravel().tolist())
 return points,indices
report=[]
for name in ['sections-current.json','transition-sections.json.gz']:
 file=ROOT/'build/web/native-current'/name;raw=file.read_bytes();data=json.loads(gzip.decompress(raw) if name.endswith('.gz') else raw)
 for s in data['slices']:
  if not -.06<s['height']<2.8682:continue
  cut=section(s['height'])
  if cut.is_empty:continue
  pts=np.array(s['p']).reshape(-1,2);old=unary_union([Polygon(pts[t]) for t in np.array(s['i']).reshape(-1,3)])
  s['p'],s['i']=pack(old.union(cut));report.append({'file':name,'height':s['height'],'solid_area_m2':cut.area})
 data['owner_basement_stair_sha256']=source['source_sha256'];raw=json.dumps(data,separators=(',',':')).encode();file.write_bytes(gzip.compress(raw,mtime=0) if name.endswith('.gz') else raw)
(ROOT/'build/web/native-current/owner-stair-restoration.json').write_text(json.dumps({'source_file':source['source'],'sha256':source['source_sha256'],'triangles':source['triangles'],'sections':report},indent=2))
print('Owner stair sections',len(report),'basement',section(1.6).area)
# Update only local basement collision cells against the same owner solid.
navfile=ROOT/'build/web/native-current/native-navigation.json';nav=json.loads(navfile.read_text());grid=nav['grid'];changed=0
e1=triangles[:,1]-triangles[:,0];e2=triangles[:,2]-triangles[:,0]
def hits(origin,direction,distance):
 direction=np.array(direction);q=np.cross(np.broadcast_to(direction,e2.shape),e2);det=np.einsum('ij,ij->i',e1,q);valid=abs(det)>1e-9;inv=np.divide(1,det,out=np.zeros_like(det),where=valid)
 delta=np.array(origin)-triangles[:,0];u=np.einsum('ij,ij->i',delta,q)*inv;r=np.cross(delta,e1);v=r@direction*inv;t=np.einsum('ij,ij->i',e2,r)*inv
 return np.unique(np.round(t[valid&(u>=-1e-7)&(v>=-1e-7)&(u+v<=1.0000001)&(t>.001)&(t<distance)],5))
for layer in nav['layers']:
 if layer['floor_index']!=0:continue
 for row,runs in enumerate(layer['rows']):
  cells=[]
  for start,length,height,flags in runs:
   for col in range(start,start+length):
    x=grid['x']+(col+.5)*grid['step'];z=grid['z']+(row+.5)*grid['step'];y=height/1000;blocked=False
    if .55<x<4.44 and -3.36<z<-.67 and y<2.87:
     blocked=len(hits((x,y+.1,z),(1,0,0),100))%2==1 or len(hits((x,y+.08,z),(0,1,0),nav['minimum_headroom_m']))>0
     if not blocked:
      blocked=any(len(hits((x,y+dy,z),(dx,0,dz),nav['body_radius_m'])) for dy in [.25,.85,1.5] for dx,dz in [(1,0),(-1,0),(0,1),(0,-1)])
    flag=flags|1 if blocked else flags;changed+=flag!=flags;cells.append((col,height,flag))
  compact=[]
  for col,h,f in cells:
   if compact and compact[-1][0]+compact[-1][1]==col and compact[-1][2:]==[h,f]:compact[-1][1]+=1
   else:compact.append([col,1,h,f])
  layer['rows'][row]=compact
nav['owner_basement_stair_sha256']=source['source_sha256'];navfile.write_text(json.dumps(nav,separators=(',',':')));print('Solid stair collision cells corrected',changed)
