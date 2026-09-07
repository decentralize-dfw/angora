"""Read actual masterplan level annotations; register the common villa family.

Text insertion XY is an annotation location, NOT a surveyed spot coordinate.
Native villa geometry is retained. BK 1026.40 is the garden datum; the 0.20–0.30 m
differences between entrance threshold and adjacent TK labels are not erased.
"""
import gzip,json,re,math
from pathlib import Path
import numpy as np
from shapely.geometry import Polygon
from shapely.affinity import affine_transform

ROOT=Path(__file__).resolve().parents[1]
site=json.loads((ROOT/'build/cad/site.json').read_text())
raw=json.load(gzip.open(ROOT/'build/cad/source-curves.json.gz','rt'))
reg=site['registration'];a=reg['rotation_radians']
R=np.array([[math.cos(a),-math.sin(a)],[math.sin(a),math.cos(a)]])
anchor=np.array(reg['master_anchor']);offset=np.array(reg['model_anchor'])
def xy(p):return ((np.array(p[:2])-anchor)@R.T*reg['scale']+offset).tolist()
levels=[]
for t in raw['texts']:
    s=t['text'].strip();match=re.search(r'(?<![A-Za-z])(SBK|GrK|BK|TZK|TK)\s*[:=]?\s*(10\d{2}[.,]\d+)',s,re.I)
    kind=None;value=None
    if match:kind=match[1].upper();value=float(match[2].replace(',','.'))
    elif t['layer'] in ['2D$YOLKOTLARIYENI','2D$YKOT'] and re.fullmatch(r'10\d{2}[.,]\d+',s):
        kind='ROAD';value=float(s.replace(',','.'))
    if kind:
        levels.append(dict(source_handle=t['handle'],source_layer=t['layer'],text=s,kind=kind,
                           absolute_m=value,relative_to_garden_m=round(value-1026.40,4),
                           annotation_xy=xy(t['position']),xy_status='text_insertion_not_survey_point'))
source=next(b for b in site['buildings'] if b['number']==21)
sp=Polygon(source['footprint']);sc=np.array(sp.centroid.coords[0])
source_xy=np.array(source['footprint'][:-1]);src_edge=source_xy[1]-source_xy[0]
def family_fit(b):
    """Rigid/reflected common typology fit, with residuals explicitly recorded."""
    dst=Polygon(b['footprint']);dc=np.array(dst.centroid.coords[0]);p=np.array(b['footprint'][:-1])
    candidates=[]
    edges=list(zip(p,np.roll(p,-1,axis=0)))
    # Most masterplan polylines begin at the rear long edge. Preserve that
    # registration rather than rotating a modified garage wing by 90 degrees.
    if 8.0<np.linalg.norm(p[1]-p[0])<9.0:edges=edges[:1]
    for v,w in edges:
        e=w-v
        if np.linalg.norm(e)<2:continue
        for flip in [1,-1]:
            M=np.diag([flip,1.]);s=M@src_edge
            theta=math.atan2(e[1],e[0])-math.atan2(s[1],s[0])
            Q=np.array([[math.cos(theta),-math.sin(theta)],[math.sin(theta),math.cos(theta)]])@M
            shift=(v+w)/2-Q@((source_xy[0]+source_xy[1])/2)
            poly=Polygon(source_xy@Q.T+shift)
            err=poly.symmetric_difference(dst).area
            candidates.append((err,Q,shift,poly))
    err,Q,t,poly=min(candidates,key=lambda v:v[0])
    return dict(matrix_xy=Q.tolist(),translation_xy=t.tolist(),
                footprint_symmetric_difference_m2=round(err,4),
                footprint_hausdorff_m=round(poly.hausdorff_distance(dst),4),
                status='common_CAD_typology_photo_interpreted_facade_not_exact_neighbor_survey')
for b in site['buildings']:
    c=np.array(Polygon(b['footprint']).centroid.coords[0])
    sbk=min((v for v in levels if v['kind']=='SBK'),key=lambda t:np.linalg.norm(np.array(t['annotation_xy'])-c))
    nearby=[v for v in levels if np.linalg.norm(np.array(v['annotation_xy'])-np.array(sbk['annotation_xy']))<3.2]
    bk=next((v for v in nearby if v['kind']=='BK'),None)
    grk=next((v for v in nearby if v['kind']=='GRK'),None)
    b['grade']={'sbk':sbk,'bk':bk,'grk':grk,
                'garden_base_z':round((bk['absolute_m'] if bk else sbk['absolute_m']-3.1)-1026.4,4),
                'garden_base_status':'CAD_BK_annotation' if bk else 'inferred_SBK_minus_3_1_common_typology'}
    b['typology_transform']=family_fit(b)
    if b['number']==21:b['typology_transform']['matrix_xy']=[[1,0],[0,1]];b['typology_transform']['translation_xy']=[0,0]
result=dict(datum={'absolute_garden_BK_m':1026.4,'native_garden_floor_z':0,
                   'source_handle':'32213','native_entrance_threshold_z':3.0996,
                   'adjacent_front_TK_z':3.3,'note':'Do not treat text insertion points as surveyed grading coordinates.'},
            levels=levels,buildings=site['buildings'])
(ROOT/'build/cad/site-elevations.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
for b in result['buildings']:
    if b['number'] in [19,20,21,22,23]:print(b['number'],b['grade']['garden_base_z'],b['grade']['garden_base_status'],b['typology_transform'])
print('Extracted',len(levels),'level annotations')
