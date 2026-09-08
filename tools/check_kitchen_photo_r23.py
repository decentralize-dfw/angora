"""Check the new kitchen parts against CAD wall solids and movable furniture.

Uses evaluated triangle sections. Deliberate cabinet joinery is not treated as
a collision between independent furniture; walls and movable objects are.
"""
import json,gzip,hashlib
from pathlib import Path
from functools import lru_cache
import numpy as np
from shapely.geometry import Polygon,LineString
from shapely.ops import unary_union,polygonize
ROOT=Path(__file__).resolve().parents[1]
all_rows=json.load(gzip.open(ROOT/'build/intermediate/review-geometry.json.gz','rt'))
report=json.loads((ROOT/'build/kitchen-photo-r23.json').read_text())
names=set(report['new_parts']+report['changed_panels'])
fixtures=[o for o in all_rows if 'Photo kitchen — entrance' in o['collections']]
furniture=[o for o in all_rows if o['category']=='30_FURNITURE_PLACEHOLDERS']
assert names<={o['name'] for o in fixtures},'Missing updated kitchen geometry'
atlas=json.loads((ROOT/'build/web/full/sections.json').read_text())
assert atlas['source_fittings_sha256']==hashlib.sha256((ROOT/'build/blender/layers/20-fixed-fittings.blend').read_bytes()).hexdigest()
walls=[];heights=np.array([s['height'] for s in atlas['slices']])
for s in atlas['slices']:
    xy=np.array(s['p']).reshape(-1,2)*[1,-1]
    walls.append(unary_union([Polygon(xy[s['i'][i:i+3]]) for i in range(0,len(s['i']),3)]).buffer(-.008))
objects=fixtures+furniture
for o in objects:
    o['_tris']=np.array(o['vertices'])[o['triangles']]
    o['_min']=o['_tris'][:,:,2].min(1);o['_max']=o['_tris'][:,:,2].max(1)
@lru_cache(maxsize=10000)
def profile(index,z):
    o=objects[index];tris=o['_tris'][(o['_min']<z)&(o['_max']>z)];lines=[]
    for tri in tris:
        points=[]
        for a,b in zip(tri,np.roll(tri,-1,axis=0)):
            if (a[2]<z)!=(b[2]<z):points.append(np.round((a+(b-a)*((z-a[2])/(b[2]-a[2])))[:2],5))
        if len(points)==2 and np.linalg.norm(points[1]-points[0])>.00001:lines.append(LineString(points))
    if not lines:return Polygon()
    network=unary_union(lines)
    return unary_union(list(polygonize(network))).union(network.buffer(.0005))
items=[];hits=[]
for index,o in enumerate(fixtures):
    low,high=np.array(o['bounds']);span=high[2]-low[2]
    samples=sorted(set([round(low[2]+span*t,5) for t in [.15,.5,.85]]+[float(z) for z in heights if low[2]+.001<z<high[2]-.001]))
    maximum=0.;other=[]
    for z in samples:
        area=profile(index,z).intersection(walls[int(np.argmin(abs(heights-z)))]).area
        maximum=max(maximum,area)
    for j,f in enumerate(furniture,start=len(fixtures)):
        a,b=np.array(f['bounds']);lo=np.maximum(low,a);hi=np.minimum(high,b)
        if min(hi-lo)<.004:continue
        area=max(profile(index,round(float(z),5)).intersection(profile(j,round(float(z),5))).area
                 for z in np.linspace(lo[2]+.001,hi[2]-.001,7))
        if area>.00015:other.append({'furniture':f['name'],'overlap_m2':round(area,6)})
    r={'object':o['name'],'wall_overlap_m2':round(maximum,6),'furniture_intersections':other}
    items.append(r)
    if maximum>.00015 or other:hits.append(r)
    if 'timber blind slat' in o['name']:assert .012<span<.015,'Blind slat rotated about wrong axis'
solid=[o for o in fixtures if o['name'].startswith('Upper cupboard inset')]
assert len(solid)==3 and all(o['materials']==['wood_honey'] for o in solid)
satin=[o for o in fixtures if o['materials']==['Kitchen satin glazing']]
assert len(satin)==8
result={'source_fittings_sha256':atlas['source_fittings_sha256'],
 'source_furniture_sha256':hashlib.sha256((ROOT/'build/blender/layers/30-furniture-placeholders.blend').read_bytes()).hexdigest(),
 'kitchen_fixture_parts_checked':len(fixtures),'new_or_modified_parts':len(names),'movable_furniture_parts_checked':len(furniture),
 'solid_hob_doors':len(solid),'satin_glass_panes':len(satin),'items':items,'intersections':hits,
 'passed':not hits,'wall_inset_tolerance_m':.008,'overlap_review_threshold_m2':.00015,
 'limitations':['Horizontal evaluated triangle sections; the internal joints of a single cabinet are intentional.',
                'Photo fabrication proportions remain interpreted.']}
(ROOT/'build/kitchen-photo-r23-qa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print('KITCHEN_R23_QA',len(fixtures),len(hits),json.dumps(hits),flush=True)
