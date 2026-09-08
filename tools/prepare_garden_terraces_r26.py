"""Prepare separate garden terraces; roads and horizontal coverage are retained.
Front elevation comes from DORBAK; rear elevation from the CAD TK annotation.
Intermediate side breaklines remain interpretations, not surveyed coordinates.
"""
import json,gzip
from pathlib import Path
import numpy as np
import mapbox_earcut
from shapely.geometry import Polygon,box
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[1]
source=json.loads((ROOT/'build/intermediate/context-ground-source.json').read_text())
terrain=next(o for o in source if o['name'].startswith('Terrain'))
site=json.loads((ROOT/'build/cad/site-elevations.json').read_text())
own=Polygon([(-9.038,-10.058),(10.518,-10.058),(10.518,5.39),(26.30,21.35),(-9.038,28.65)])
footprints=unary_union([Polygon(b['footprint']) for b in site['buildings']])
stairs=unary_union([box(x-.72,-3.20,x+.72,8.25) for x in [-6.42,8.12]])
pads=[]
for name,y0,y1,z,status in [
 ('Ön bahçe',-10.058,-1.3977,2.7996,'source_DORBAK_top'),
 ('Yan bahçe üst teras',-1.3977,2.10,2.0664,'intermediate_stair_landing_interpretation'),
 ('Yan bahçe alt teras',2.10,5.80,1.0332,'intermediate_stair_landing_interpretation'),
 ('Havuz bahçesi',5.80,28.65,-.1,'CAD_TK_annotation_minus_0_10')]:
 p=own.intersection(box(-40,y0,40,y1)).difference(footprints).difference(stairs)
 pads.append({'name':name,'geometry':p,'z':z,'status':status})
mask=unary_union([p['geometry'] for p in pads])
vertices=[];faces=[];matids=[];areas={p['name']:0 for p in pads};original_area=0;remaining_area=0

def pieces(g):
 if g.is_empty:return []
 if g.geom_type=='Polygon':return [g]
 return [p for p in getattr(g,'geoms',[]) if p.geom_type=='Polygon']

def append(poly,height,material=0):
 for p in pieces(poly):
  if p.area<1e-8:continue
  rings=[np.array(p.exterior.coords)[:-1]]+[np.array(r.coords)[:-1] for r in p.interiors]
  xy=np.concatenate(rings);ends=np.cumsum([len(r) for r in rings],dtype=np.uint32)
  triangles=mapbox_earcut.triangulate_float64(xy,ends).reshape(-1,3)
  first=len(vertices);z=height(xy) if callable(height) else np.full(len(xy),height)
  vertices.extend(np.c_[xy,z].tolist())
  for t in triangles:
   a,b,c=xy[t];u=b-a;v=c-a;signed=u[0]*v[1]-u[1]*v[0]
   if abs(signed)<1e-8:continue
   faces.append((t if signed>0 else t[::-1])+first);matids.append(material)

v=np.array(terrain['vertices'])
for face in terrain['faces']:
 tri=v[face];poly=Polygon(tri[:,:2]);original_area+=poly.area
 if poly.area<1e-8:continue
 if not poly.intersects(mask):
  first=len(vertices);vertices.extend(tri.tolist());faces.append(np.array([first,first+1,first+2]));matids.append(0);remaining_area+=poly.area;continue
 xy=tri[:,:2];coeff=np.linalg.solve(np.c_[xy,np.ones(3)],tri[:,2]);rest=poly.difference(mask)
 append(rest,lambda xy:np.c_[xy,np.ones(len(xy))]@coeff);remaining_area+=rest.area
 for pad in pads:
  part=poly.intersection(pad['geometry']);append(part,pad['z']);areas[pad['name']]+=part.area
for left,right in zip(pads,pads[1:]):
 common=left['geometry'].boundary.intersection(right['geometry'].boundary)
 lines=[common] if common.geom_type=='LineString' else [g for g in getattr(common,'geoms',[]) if g.geom_type=='LineString']
 for line in lines:
  coords=list(line.coords)
  for a,b in zip(coords,coords[1:]):
   if np.linalg.norm(np.array(a)-b)<.02:continue
   first=len(vertices);vertices.extend([[*a,left['z']],[*b,left['z']],[*b,right['z']],[*a,right['z']]])
   faces.extend([np.array([first,first+1,first+2]),np.array([first,first+2,first+3])]);matids.extend([1,1])
assert abs(original_area-remaining_area-sum(areas.values()))<.002
report={'revision':26,'datum_absolute_BK_m':1026.4,'front_DORBAK_top_z_m':2.7996,'rear_TK_z_m':-.1,
 'pads':[{'name':p['name'],'z_m':p['z'],'terrain_surface_area_m2':round(areas[p['name']],3),'evidence':p['status']} for p in pads],
 'horizontal_coverage_error_m2':original_area-remaining_area-sum(areas.values()),'source_terrain_triangles':len(terrain['faces']),
 'output_triangles':len(faces),'roads_changed':False,'neighbor_BK_levels_changed':False,'pool_dimensions_changed':False,
 'photo_match_approved':False,'millimetric_survey_certified':False,
 'limitations':['Side terrace breaklines inferred from modeled stair landings','Plot limits registered from CAD; source registration still needs survey control','Unseen neighbor garden terraces remain under review']}
data={'vertices':vertices,'faces':[f.tolist() for f in faces],'material_ids':matids,'report':report}
with gzip.open(ROOT/'build/cad/garden-terraces-r26.json.gz','wt') as f:json.dump(data,f,separators=(',',':'))
(ROOT/'build/garden-terraces-r26.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False),flush=True)
