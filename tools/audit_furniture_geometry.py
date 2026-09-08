"""Inspect every furniture part against wall solids and independent assemblies.

Use actual evaluated triangle sections, not just bounding boxes. The 8 cm wall
atlas is the same reviewed CAD solid used by the viewer. Small objects also get
interior height samples. Joined parts of one assembly are explicitly recorded.
"""
import gzip,json,re,hashlib
from pathlib import Path
from functools import lru_cache
import numpy as np
from shapely.geometry import Polygon,LineString,box
from shapely.ops import unary_union,polygonize
ROOT=Path(__file__).resolve().parents[1]
rows=json.load(gzip.open(ROOT/'build/intermediate/review-geometry.json.gz','rt'))
objects=[r for r in rows if r['category']=='30_FURNITURE_PLACEHOLDERS']
atlas=json.loads((ROOT/'build/web/full/sections.json').read_text())
heights=np.array([s['height'] for s in atlas['slices']])
walls=[]
for s in atlas['slices']:
    p=np.array(s['p']).reshape(-1,2)*[1,-1]
    walls.append(unary_union([Polygon(p[s['i'][i:i+3]]) for i in range(0,len(s['i']),3)]).buffer(-.008))
def center(o):return np.mean(o['bounds'],axis=0)
def nearest(o,anchors):return min(anchors,key=lambda a:np.linalg.norm(center(o)[:2]-center(a)[:2]))['name']
for o in objects:
    col=o['collections'][0]; peers=[p for p in objects if p['collections'][0]==col];name=o['name'].lower()
    if o['props'].get('assembly_id'):anchor=None
    elif 'wardrobe' in col.lower() or col=='Walk-in closet':anchor=col
    elif 'bedroom' in col.lower():
        if any(s in name for s in ['dresser','drawer','lamp','finial']) and 'iron bed' not in name:
            anchor=nearest(o,[p for p in peers if p['name'].startswith('Dresser carcass')])
        elif 'chair' in name:anchor='Master upholstered chair'
        else:anchor='Bed'
    elif 'wardrobe' in col.lower() or col=='Walk-in closet' or col.startswith('Master '):anchor=col
    elif col.startswith('Photo furniture'):
        if any(s in name for s in ['vitrine','cabinet','porcelain','glass shelf']):anchor='Display cabinet'
        elif 'chair' in name:
            seats=[p for p in peers if p['name'].startswith(('Upholstered chair seat','Garden chair seat'))]
            anchor=nearest(o,seats)
        elif any(s in name for s in ['table','inset glass']):
            anchor=nearest(o,[p for p in peers if p['name'].startswith(('Bowed table top','Garden dining table top'))])
        else:anchor=nearest(o,[p for p in peers if p['name'].startswith('Leather sofa base')])
    elif col=='Upper hall':anchor='Hall table' if 'table' in name else 'Hall sofa'
    elif col=='Attic lounge table':anchor='TV' if 'screen' in name or name.startswith('tv') else 'Coffee table'
    else:anchor=col
    o['assembly']=o['props'].get('assembly_id') or col+' / '+anchor
    o['_tris']=np.array(o['vertices'])[o['triangles']]
    o['_min']=o['_tris'][:,:,2].min(1);o['_max']=o['_tris'][:,:,2].max(1)
def section(o,z):
    active=o['_tris'][(o['_min']<z)&(o['_max']>z)]
    lines=[]
    for tri in active:
        points=[]
        for a,b in zip(tri,np.roll(tri,-1,axis=0)):
            if (a[2]<z)!=(b[2]<z):points.append(np.round((a+(b-a)*((z-a[2])/(b[2]-a[2])))[:2],5))
        if len(points)==2 and np.linalg.norm(points[1]-points[0])>.00001:lines.append(LineString(points))
    if not lines:return Polygon()
    network=unary_union(lines)
    return unary_union(list(polygonize(network))).union(network.buffer(.0005))
@lru_cache(maxsize=30000)
def profile(index,z):return section(objects[index],z)
wall_hits=[];pair_hits=[];item_reports=[]
for i,o in enumerate(objects):
    low,high=np.array(o['bounds']); span=high[2]-low[2]
    samples=sorted(set([round(low[2]+span*t,5) for t in [.15,.5,.85]]+
                       [float(z) for z in heights if low[2]+.002<z<high[2]-.002]))
    max_area=0.;worst=None
    for z in samples:
        wall=walls[int(np.argmin(abs(heights-z)))];a=profile(i,z).intersection(wall).area
        if a>max_area:max_area=a;worst=z
    if max_area>.00015:wall_hits.append({'object':o['name'],'assembly':o['assembly'],'max_overlap_m2':round(max_area,6),'sample_z':worst})
    item_reports.append({'object':o['name'],'assembly':o['assembly'],'collection':o['collections'][0],
                         'bounds':o['bounds'],'wall_samples':len(samples),'max_wall_overlap_m2':round(max_area,6),
                         'wall_check':'review' if max_area>.00015 else 'clear'})
    if i%80==0:print('WALL_CHECK',i,len(objects),flush=True)
for i,a in enumerate(objects):
    alo,ahi=np.array(a['bounds'])
    for j in range(i+1,len(objects)):
        b=objects[j]
        if a['assembly']==b['assembly']:continue
        blo,bhi=np.array(b['bounds']);lo=np.maximum(alo,blo);hi=np.minimum(ahi,bhi)
        if min(hi-lo)<.004:continue
        max_area=0.;worst=None
        zs=np.linspace(lo[2]+.001,hi[2]-.001,max(5,min(35,int((hi[2]-lo[2])/.04)+1)))
        for z in zs:
            z=round(float(z),5);area=profile(i,z).intersection(profile(j,z)).area
            if area>max_area:max_area=area;worst=z
        if max_area>.00015:pair_hits.append({'a':a['name'],'b':b['name'],'assembly_a':a['assembly'],'assembly_b':b['assembly'],
                                           'max_overlap_m2':round(max_area,6),'sample_z':worst})
report={'method':'evaluated_mesh_horizontal_sections_and_CAD_wall_solid_atlas',
        'source_furniture_sha256':hashlib.sha256((ROOT/'build/blender/layers/30-furniture-placeholders.blend').read_bytes()).hexdigest(),
        'wall_atlas_sha256':hashlib.sha256((ROOT/'build/web/full/sections.json').read_bytes()).hexdigest(),
        'tolerances':{'wall_inset_m':.008,'mesh_skin_m':.0005,'review_overlap_m2':.00015,'wall_height_sampling_m':.08},
        'parts_checked':len(objects),'assemblies_checked':len(set(o['assembly'] for o in objects)),
        'items':item_reports,'wall_intersections':wall_hits,'furniture_intersections':pair_hits,
        'passed':not wall_hits and not pair_hits,
        'limitations':['Horizontal sampled sections; roof slopes and door swings require separate checks.',
                       'Deliberate joints within each explicitly listed furniture assembly are excluded.']}
out=ROOT/'build/furniture-collision-report.json';out.write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('COLLISION_REPORT',len(objects),report['assemblies_checked'],len(wall_hits),len(pair_hits),flush=True)
