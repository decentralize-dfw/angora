"""Offline coplanar cleanup; interpolate existing light/AO UVs, keep room voids."""
import json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'.runtime/finishing'
sys.path.insert(0,str(OUT/'deps'))
import numpy as np
from shapely.geometry import Polygon,box,Point
from shapely.ops import unary_union
import mapbox_earcut
items=json.loads((OUT/'input.json').read_text());report=[];seen={}
attic_tiles=[]
for item in items:
 if item['name']=='R31 | R33 attic cream tile':
  p=np.array(item['attributes']['POSITION']).reshape(-1,3)
  for t in p[np.array(item['indices']).reshape(-1,3)]:
   if np.ptp(t[:,1])<.001 and abs(t[:,1].mean()-9.38956)<.003:
    g=Polygon(t[:,[0,2]])
    if g.is_valid and g.area>1e-9:attic_tiles.append(g)
attic_tile_floor=unary_union(attic_tiles)
if attic_tile_floor.is_empty:raise RuntimeError('Original attic cream tile floor missing')
service_tiles=[]
for item in items:
 if item['name']=='stone_tile':
  p=np.array(item['attributes']['POSITION']).reshape(-1,3)
  for t in p[np.array(item['indices']).reshape(-1,3)]:
   if np.ptp(t[:,1])<.001 and abs(t[:,1].mean()-3.0605)<.002:
    g=Polygon(t[:,[0,2]])
    if g.is_valid and g.area>1e-9:service_tiles.append(g)
service_union=unary_union(service_tiles)
service_floor=unary_union([g for g in ([service_union] if service_union.geom_type=='Polygon' else service_union.geoms) if g.covers(Point(5.8,-2)) or g.covers(Point(6,-5.85))])
if service_floor.is_empty:raise RuntimeError('Original garage/service stone floor missing')
def tri(poly):
 rings=[poly.exterior,*poly.interiors];xy=np.array([c for r in rings for c in list(r.coords)[:-1]],dtype=np.float64)
 ends=np.cumsum([len(r.coords)-1 for r in rings],dtype=np.uint32)
 return xy,mapbox_earcut.triangulate_float64(xy,ends).reshape(-1,3)
def polygons(g):
 return [g] if g.geom_type=='Polygon' else [p for p in getattr(g,'geoms',[]) if p.geom_type=='Polygon']
# Decorative bathroom skins take precedence over coincident plain plaster.
items.sort(key=lambda a:0 if a['part']=='architecture' and ('tile' in a['name'] or 'ceramic' in a['name'] or 'mosaic' in a['name']) else 1)
for item in items:
 if item['part']!='architecture' and not(item['part']=='garden' and ('limestone' in item['name'] or 'pool' in item['name'])):continue
 attrs={k:np.array(a).reshape(len(item['attributes']['POSITION'])//3,-1) for k,a in item['attributes'].items()};pos=attrs['POSITION'];output={k:[] for k in attrs};removed=0;changed=0
 for ids in np.array(item['indices']).reshape(-1,3):
  xyz=pos[ids];cross=np.cross(xyz[1]-xyz[0],xyz[2]-xyz[0]);length=np.linalg.norm(cross)
  if length<1e-10:continue
  normal=cross/length;axis=np.argmax(abs(normal));axes=[i for i in range(3) if i!=axis];canonical=normal*np.sign(normal[axis]);distance=np.dot(canonical,xyz[0]);key=tuple(np.round(canonical,4))+ (round(distance,3),)
  poly=Polygon(xyz[:,axes]);remaining=poly
  # Original finishes are buried under additional floor skins: remove those
  # skins only inside the source finish contours, preserving original UVs.
  if item['name']=='wood_floor.001' and axis==1 and abs(xyz[:,1].mean()-9.38956)<.06:
   remaining=remaining.difference(attic_tile_floor)
  if item['name']=='terra_floor' and axis==1 and 3.06<xyz[:,1].mean()<3.12:
   remaining=remaining.difference(service_floor)
  # Only structural skins are compared across objects, never roof against wall.
  family='wall' if item['name']=='interior.001' or any(k in item['name'] for k in ['tile','ceramic','mosaic']) and item['part']=='architecture' else item['name']
  key=(family,*key)
  previous=seen.get(key)
  if previous is not None:remaining=remaining.difference(previous)
  seen[key]=poly if previous is None else previous.union(poly)
  removed+=max(0,poly.area-remaining.area)
  if remaining.area<poly.area-1e-8:changed+=1
  if remaining.area<1e-9:continue
  pieces=[(xyz[:,axes],np.array([[0,1,2]]))] if remaining.equals(poly) else [tri(p) for p in polygons(remaining) if p.area>1e-9]
  basis=np.vstack([xyz[:,axes].T,np.ones(3)])
  for points,faces in pieces:
   weights=np.linalg.solve(basis,np.vstack([points.T,np.ones(len(points))])).T
   values={k:weights@a[ids] for k,a in attrs.items()}
   if 'NORMAL' in values:values['NORMAL'][:]=normal
   for face in faces:
    # Earcut winding may differ from source. Preserve the source winding.
    p=values['POSITION'][face]
    if np.dot(np.cross(p[1]-p[0],p[2]-p[0]),normal)<0:face=face[::-1]
    for k in attrs:output[k].extend(values[k][face].tolist())
 item['attributes']={k:np.array(a).ravel().tolist() for k,a in output.items()};item['indices']=list(range(len(output['POSITION'])))
 report.append({'object':item['name'],'overlap_projected_area_removed_m2':round(removed,6),'trimmed_triangles':changed,'triangles':len(item['indices'])//3})
 print(report[-1],flush=True)
# One continuous world-aligned parquet field, retaining all original boundaries.
for item in items:
 if item['name']=='wood_floor.001':
  p=np.array(item['attributes']['POSITION']).reshape(-1,3);item['metricUV']=(p[:,[0,2]]/np.array([3.2,3.2])).ravel().tolist()
 # Neutral metric plaster avoids the enlarged blotchy ceiling normal map.
 if item['name']=='ceiling [imported]':item['neutralCeiling']=True
(OUT/'repaired.json').write_text(json.dumps([i for i in items if i['part']!='context-ground'],separators=(',',':')))
(OUT/'repair-report.json').write_text(json.dumps(report,indent=2))
# Earth at the basement plane = actual terrain higher than cut, clipped to parcel.
plot=json.loads((ROOT/'build/web/native-current/plot-boundary.json').read_text())['polygon_native_xy'];parcel=Polygon([(x,-y) for x,y in plot]);parts=[]
for item in items:
 if item['part']!='context-ground':continue
 p=np.array(item['attributes']['POSITION']).reshape(-1,3)
 for ids in np.array(item['indices']).reshape(-1,3):
  xyz=p[ids]
  if xyz[:,1].max()<1.6005:continue
  poly=[]
  for a,b in zip(xyz,np.roll(xyz,-1,axis=0)):
   if a[1]>1.6005:poly.append(a)
   if (a[1]>1.6005)!=(b[1]>1.6005):poly.append(a+(b-a)*(1.6005-a[1])/(b[1]-a[1]))
  if len(poly)<3:continue
  g=Polygon([(a[0],a[2]) for a in poly])
  if g.is_valid and g.area>1e-8 and g.intersects(parcel):parts.append(g.intersection(parcel))
old=json.loads((ROOT/'build/web/native-current/native-soil-section.json').read_text());p=np.array(old['p']).reshape(-1,2)
parts.extend(Polygon(p[t]) for t in np.array(old['i']).reshape(-1,3))
soil=unary_union(parts).buffer(0).difference(box(-5.722,-6.81,-5.14,-3.43));positions=[];indices=[]
for poly in polygons(soil):
 xy,faces=tri(poly);offset=len(positions)//2;positions.extend(xy.ravel().tolist());indices.extend((faces.ravel()+offset).tolist())
old.update(p=positions,i=indices,fill_area_m2=soil.area,source='Existing basement void plus above-cut native terrain inside owner parcel; no room envelope filled')
(OUT/'native-soil-section.json').write_text(json.dumps(old))
print('SOIL',soil.area,flush=True)
