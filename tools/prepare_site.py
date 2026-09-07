"""Register masterplan building 21 to the detailed villa coordinate system."""
import gzip,json,math,re
from pathlib import Path
import numpy as np
from shapely.geometry import Polygon, Point

ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'build'/'cad'
data=json.load(gzip.open(OUT/'source-curves.json.gz','rt'))
anchor=np.array([-18658.25101927186,-7309.499215126354])
edge=np.array([-18481.01752755248,-7428.987088623016])-anchor
angle=math.pi-math.atan2(edge[1],edge[0])
rotation=np.array([[math.cos(angle),-math.sin(angle)],[math.sin(angle),math.cos(angle)]])
offset=np.array([3.318416790387928,8.277263642530197])
def transform(points):return ((np.asarray(points)[:,:2]-anchor)@rotation.T*.04+offset)
numbers=[t for t in data['texts'] if t['layer']=='2D$YBN' and t['text'].strip().isdigit()]
sbk=[t for t in data['texts'] if re.search(r'SBK\s*[:=]?\s*\d',t['text'],re.I)]
buildings=[];centers=[]
for name,curves in data['layers'].items():
    if name not in {'2D$B','2D$BINA','2D$BİNA'}:continue
    for c in curves:
        pp=np.array(c['points'])[:,:2]
        if len(pp)<4:continue
        closing_edge_inferred=bool(np.linalg.norm(pp[0]-pp[-1])>1)
        poly=Polygon(pp).simplify(.001,preserve_topology=True)
        if not poly.is_valid:poly=poly.buffer(0)
        if poly.geom_type!='Polygon' or not 15000<poly.area<250000:continue
        pp=np.array(poly.exterior.coords)
        p=np.array(poly.centroid.coords[0])
        if not (-23500<p[0]<-14000 and -8800<p[1]<-3900):continue
        if any(np.linalg.norm(p-q)<3 for q in centers):continue
        centers.append(p)
        near=sorted(numbers,key=lambda t:np.linalg.norm(np.array(t['position'][:2])-p))
        number=int(near[0]['text'].strip()) if near else None
        nearsbk=sorted(sbk,key=lambda t:np.linalg.norm(np.array(t['position'][:2])-p))
        elev=None
        if nearsbk:
            m=re.search(r'SBK\s*[:=]?\s*(\d+(?:[.,]\d+)?)',nearsbk[0]['text'],re.I)
            if m:elev=float(m.group(1).replace(',','.'))
        buildings.append({'source_handle':c['handle'],'number':number,'footprint':transform(pp).tolist(),
             'footprint_area_m2':poly.area*.04**2,'masterplan_sbk':elev,
             'base_z':(elev-1029.5+2.8) if elev else 2.8,
             'footprint_status':'cad_registered','closing_edge_inferred':closing_edge_inferred,
             'facade_status':'inferred','height_status':'inferred'})
lines=[]
for name,curves in data['layers'].items():
    if name not in {'2D$PYOLBORDUR','2D$PDUVAR'}:continue
    for c in curves:
        pp=np.array(c['points'])[:,:2];mean=pp.mean(0)
        if -23500<mean[0]<-14000 and -8800<mean[1]<-3900:
            lines.append({'layer':name,'source_handle':c['handle'],'points':transform(pp).tolist()})
out={'registration':{'master_anchor':anchor.tolist(),'model_anchor':offset.tolist(),'scale':.04,'rotation_radians':angle,
       'target_handle':'22E1A','status':'registration_requires_final_corner_review'},'buildings':buildings,'site_lines':lines,
       'pool':{'center_xy':[-.5,15.45],'inner_size_xy':[8.,4.],'depth':1.4,'status':'photo_inferred','dimension_label':False,
               'reference':['WhatsApp Image 2026-08-27 at 20.31.29.jpeg','asdf.jpeg','kat_1_bahce']}}
(OUT/'site.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
print('Footprints',len(buildings),'site lines',len(lines),'target',[(b['number'],b['footprint_area_m2']) for b in buildings if b['source_handle']=='22E1A'])
