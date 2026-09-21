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
def closed_section(g,h):
 packed=pack(g);edges=[]
 lookup={tuple(x):i for i,x in enumerate(np.array(packed['p']).reshape(-1,2))}
 # A section is a volume: close the exposed sides down to basement datum.
 # These quads share the cap's material and draw, including during motion.
 for poly in [g] if g.geom_type=='Polygon' else getattr(g,'geoms',[]):
  if poly.geom_type!='Polygon':continue
  for ring in [poly.exterior,*poly.interiors]:
   coords=list(ring.coords)
   for a,b in zip(coords,coords[1:]):
    edges.extend([lookup[tuple(np.round(a,5))],lookup[tuple(np.round(b,5))]])
 return {**packed,'edges':edges,'bottom':-.5}
parcel=Polygon([(x,-y) for x,y in json.loads((ROOT/'build/web/native-current/plot-boundary.json').read_text())['polygon_native_xy']])
void=unpack(original);depot=box(-5.722,-6.81,-5.14,-3.43)
triangles=[];stair_footprints=[]
for item in items:
 if item['part']=='context-ground' or item['part']=='garden' and any(n in item['name'].lower() for n in ['stone_tile','limestone','white_trim']):
  p=np.array(item['attributes']['POSITION']).reshape(-1,3)
  for t in p[np.array(item['indices']).reshape(-1,3)]:
   g=Polygon(t[:,[0,2]])
   if g.is_valid and g.area>1e-7 and g.intersects(parcel):triangles.append(t)
   # Owner requested the complete side stair/cheek footprint in basement
   # section, including descending treads, rather than isolated skin strips.
   if item['part']=='garden' and any(n in item['name'] for n in ['stone_tile','white_trim']):
    if g.is_valid and g.area>1e-7 and t[:,1].max()>.45 and t[:,1].min()<3.1:
     for corridor in [box(-7.16,-4.86,-5.82,3.49),box(7.5,-4.54,8.85,1.45)]:
      if g.intersects(corridor):stair_footprints.append(g.intersection(corridor))
stairs=unary_union(stair_footprints).buffer(.012,join_style=2).buffer(-.012,join_style=2)
slices=[]
for h in np.arange(1.6,5.701,.1):
 parts=[void,stairs] if h<3.0996 else []
 for t in triangles:
  if t[:,1].max()<=h:continue
  vertices=[]
  for a,b in zip(t,np.roll(t,-1,axis=0)):
   if a[1]>h:vertices.append(a)
   if (a[1]>h)!=(b[1]>h):vertices.append(a+(b-a)*(h-a[1])/(b[1]-a[1]))
  if len(vertices)<3:continue
  g=Polygon([(a[0],a[2]) for a in vertices])
  if g.is_valid and g.area>1e-8:parts.append(g)
 soil=unary_union(parts).buffer(.08,join_style=2).buffer(-.08,join_style=2).intersection(parcel).difference(depot).buffer(0)
 # Isolated foundation stubs inside earth are not air pockets.
 soil=unary_union([Polygon(p.exterior,[r.coords for r in p.interiors if Polygon(r).area>.3]) for p in ([soil] if soil.geom_type=='Polygon' else soil.geoms) if p.geom_type=='Polygon']).difference(depot)
 slices.append({'height':round(float(h),4),**closed_section(soil,h)})
 if len(slices)==1:base=soil
data.update(slices=slices,step=.1,**pack(base),fill_area_m2=base.area,source='Closed earth volume with side faces; native terrain, stone steps, white stair cheeks and limestone retaining surfaces; depot preserved')
file.write_text(json.dumps(data,separators=(',',':')))
# Exterior fixtures embedded in earth use the earth hatch, not isolated dark bars.
capfile=ROOT/'build/web/native-current/sections-current.json';atlas=json.loads(capfile.read_text());s=atlas['slices'][0]
for pk,ik in [('p','i'),('q','j')]:
 if s.get(ik):
  packed=pack(unpack({'p':s[pk],'i':s[ik]}).difference(base.buffer(-.002)))
  s[pk]=packed['p'];s[ik]=packed['i']
capfile.write_text(json.dumps(atlas,separators=(',',':')))
print('soil slices',len(slices),'area',base.area,'bytes',file.stat().st_size)
