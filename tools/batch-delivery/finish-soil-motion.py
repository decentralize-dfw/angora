"""Precompute parcel earth contours; runtime uses one cached draw at cut height."""
import json,sys,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]; OUT=ROOT/'.runtime/finishing'
sys.path.insert(0,str(OUT/'deps'))
import numpy as np, mapbox_earcut
from shapely.geometry import Polygon,box
from shapely.ops import unary_union
items=json.loads((OUT/'input.json').read_text())
file=ROOT/'build/web/native-current/native-soil-section.json'
data=json.loads(file.read_text())
original=json.loads(subprocess.check_output(['git','show','27dcb56:build/web/native-current/native-soil-section.json'],cwd=ROOT))
def unpack(s):
 p=np.array(s['p']).reshape(-1,2)
 return unary_union([Polygon(p[t]) for t in np.array(s['i']).reshape(-1,3)])
def pack(g):
 points=[];indices=[]
 for p in [g] if g.geom_type=='Polygon' else getattr(g,'geoms',[]):
  if p.geom_type!='Polygon' or p.area<1e-7:continue
  rings=[p.exterior,*p.interiors];xy=np.array([v for r in rings for v in list(r.coords)[:-1]],dtype=np.float64)
  faces=mapbox_earcut.triangulate_float64(xy,np.cumsum([len(r.coords)-1 for r in rings],dtype=np.uint32))
  indices.extend((faces+len(points)//2).tolist());points.extend(np.round(xy.ravel(),5).tolist())
 return {'p':points,'i':indices}
parcel=Polygon([(x,-y) for x,y in json.loads((ROOT/'build/web/native-current/plot-boundary.json').read_text())['polygon_native_xy']])
void=unpack(original);depot=box(-5.722,-6.81,-5.14,-3.43)
triangles=[]
for item in items:
 if item['part']=='context-ground' or item['part']=='garden' and ('stone_tile' in item['name'] or 'limestone' in item['name']):
  p=np.array(item['attributes']['POSITION']).reshape(-1,3)
  for t in p[np.array(item['indices']).reshape(-1,3)]:
   g=Polygon(t[:,[0,2]])
   if g.is_valid and g.area>1e-7 and g.intersects(parcel):triangles.append(t)
slices=[]
for h in np.arange(1.6,5.701,.1):
 parts=[void] if h<3.0996 else []
 for t in triangles:
  if t[:,1].max()<=h:continue
  vertices=[]
  for a,b in zip(t,np.roll(t,-1,axis=0)):
   if a[1]>h:vertices.append(a)
   if (a[1]>h)!=(b[1]>h):vertices.append(a+(b-a)*(h-a[1])/(b[1]-a[1]))
  if len(vertices)<3:continue
  g=Polygon([(a[0],a[2]) for a in vertices])
  if g.is_valid and g.area>1e-8:parts.append(g)
 soil=unary_union(parts).intersection(parcel).difference(depot).buffer(0)
 # Isolated foundation stubs inside earth are not air pockets.
 soil=unary_union([Polygon(p.exterior,[r.coords for r in p.interiors if Polygon(r).area>.3]) for p in ([soil] if soil.geom_type=='Polygon' else soil.geoms) if p.geom_type=='Polygon']).difference(depot)
 slices.append({'height':round(float(h),4),**pack(soil)})
 if len(slices)==1:base=soil
data.update(slices=slices,step=.1,**pack(base),fill_area_m2=base.area,source='Height-dependent native terrain, garden steps and retaining surfaces; original basement void below ground slab; depot preserved')
file.write_text(json.dumps(data,separators=(',',':')))
# Exterior fixtures embedded in earth use the earth hatch, not isolated dark bars.
capfile=ROOT/'build/web/native-current/sections-current.json';atlas=json.loads(capfile.read_text());s=atlas['slices'][0]
for pk,ik in [('p','i'),('q','j')]:
 if s.get(ik):
  packed=pack(unpack({'p':s[pk],'i':s[ik]}).difference(base.buffer(-.002)))
  s[pk]=packed['p'];s[ik]=packed['i']
capfile.write_text(json.dumps(atlas,separators=(',',':')))
print('soil slices',len(slices),'area',base.area,'bytes',file.stat().st_size)
