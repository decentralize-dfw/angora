"""Prepare the CAD-guided road review, before touching the Blender libraries.

Normal Python with shapely / numpy / mapbox-earcut. Original site geometry is
read only. The northwest and southeast arterials follow registered curb paths;
connecting centerlines and widths away from villa 21 remain interpreted.
"""
import json
from pathlib import Path
import numpy as np
from shapely.geometry import LineString,Polygon,mapping
from shapely.ops import unary_union,linemerge
ROOT=Path(__file__).resolve().parents[1]
site=json.loads((ROOT/'build/cad/site.json').read_text())
curbs=linemerge(unary_union([LineString(l['points']) for l in site['site_lines'] if l['layer']=='2D$PYOLBORDUR']))
chains=list(curbs.geoms)
def source_chain(start,end):
    target=np.asarray([start,end]);candidates=[]
    for l in chains:
        p=np.asarray([l.coords[0],l.coords[-1]])
        candidates.append((float(np.linalg.norm(p-target)),l))
    error,line=min(candidates,key=lambda p:p[0]);assert error<.1,(start,end,error)
    return line
roads=[]
def centered(name,points,width,status='CAD_guided_centerline_interpreted'):
    line=LineString(points);poly=line.buffer(width/2,cap_style=2,join_style=1)
    roads.append({'name':name,'polygon':poly,'width_m':width,'evidence':status})
def edged(name,start,end,width,side):
    line=source_chain(start,end).simplify(.02)
    poly=line.buffer(width*side,single_sided=True,cap_style=2,join_style=1)
    roads.append({'name':name,'polygon':poly,'width_m':width,'evidence':'registered_CAD_curb_edge; opposite edge width interpreted'})
edged('Northwest arterial — CAD perimeter curb',(-133.650,-101.20),(114.94,147.65),8.2,-1)
edged('Southeast arterial — CAD curved curb',(-14.03,-156.39),(141.09,-51.81),6.0,-1)
edged('Eastern arterial — CAD curved curb',(141.91,133.35),(172.59,-13.32),5.15,1)
centered('Villa 21 street — front CAD alignment',
    [(-64,-13.633),(13.453,-13.633),(19.4,-15.9),(23.8,-22),(27.5,-30),(31,-45),(35.5,-59),(39.5,-70)],5.15,
    'front straight curb spacing verified; bend centerline CAD guided')
centered('Lower residential loop — CAD block perimeter',
    [(-109,-75.605),(-85,-75.605),(-65,-75.605),(-43,-75.65),(-38,-77),(-33,-84),(-27,-91),(-22,-96),
     (-16,-122),(-14,-126),(-10,-126),(0,-114),(16,-96),(37,-75),(41,-67)],5.15)
centered('Northern residential branch',[(6,60),(10,56.8),(39,51),(61,49),(72,38),(88,23)],5.3)
centered('Eastern residential street',[(83,121),(85,85),(88,49),(91,13),(94,-22),(97,-34)],5.5)
centered('Lower eastern connection',[(40,-70),(49,-64),(72,-47),(94,-37),(110,-31),(124,-29),(158,-24),(173,-23)],5.15)
polys=[r['polygon'] for r in roads];network=unary_union(polys)
hits=[]
for b in site['buildings']:
    area=network.intersection(Polygon(b['footprint'])).area
    if area>.001:hits.append({'building':b['number'],'overlap_m2':area})
report={'revision':18,'road_count':len(roads),'building_intersections':hits,
 'roads':[dict(name=r['name'],geometry=mapping(r['polygon']),width_m=r['width_m'],evidence=r['evidence'],dimension_label_allowed=False) for r in roads],
 'removed_assumptions':['Unsupported straight road at Y -49','Straight crossing through buildings 37 and 26'],
 'vertical_status':'road label heights interpolated; not a survey','photo_alignment_complete':False}
(ROOT/'build/intermediate/road-correction-proposed.json').write_text(json.dumps(report))
print('ROAD_CORRECTION_CHECK',len(roads),'routes',hits,flush=True)
assert not hits,'CAD footprint intersection: review centerline before editing Blender'
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
fig,ax=plt.subplots(figsize=(11,11))
for r in roads:
    for p in [r['polygon']] if r['polygon'].geom_type=='Polygon' else r['polygon'].geoms:ax.fill(*p.exterior.xy,color='#8c9898')
for b in site['buildings']:
    p=Polygon(b['footprint']);ax.fill(*p.exterior.xy,color='#baaa8c');ax.text(p.centroid.x,p.centroid.y,str(b['number']),fontsize=8)
ax.add_collection(LineCollection([l['points'] for l in site['site_lines'] if l['layer']=='2D$PYOLBORDUR'],color='#9b493b',linewidth=.5))
ax.set(xlim=(-145,182),ylim=(-175,155),aspect='equal',title='Road correction review — CAD curbs and footprints')
fig.tight_layout();fig.savefig(ROOT/'build/intermediate/road-plan-corrected.png',dpi=140)
