"""Place room names on actual floor faces and publish only matched CAD dimensions."""
import json,gzip,math,hashlib
from pathlib import Path
import numpy as np
from shapely.geometry import Polygon,Point,LineString
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[1]
datums=[0,3.0996,6.3714,9.4705]
registration=json.loads((ROOT/'build/cad/plan-registration.json').read_text())
dims=json.loads((ROOT/'build/cad/dimension-source.json').read_text())
atlas=json.loads((ROOT/'build/web/full/sections.json').read_text())
geo=json.load(gzip.open(ROOT/'build/intermediate/review-geometry.json.gz','rt'))
floor_tris=np.concatenate([np.array(o['vertices'])[o['triangles']] for o in geo if o['props'].get('source_layer','').endswith(('$ZEMİN','$ZEMİN KAPLAMA'))])
# Room codes and usage read from source-2d-floor-plans.png. Photo usage is
# explicit for the basement kitchen/lounge and the attic rooms. Anchors are
# presentation positions; they are not survey points or area measurements.
specs=[
 [("B06","Bahçe salonu",(-2.8,6.0)),("B05","Mutfak",(-3.0,1.3)),("B01","Hol",(-.45,2.55)),
  ("B04","Oda",(1.55,6.0)),("B10","Banyo",(2.0,4.05)),("B02","Oda",(5.85,2.5))],
 [("Z06","Salon",(-.4,6.25)),("Z05","Yemek alanı",(-3.0,2.35)),("Z04","Mutfak",(-3.3,-2.0)),
  ("Z02","Antre",(.5,-.1)),("Z01","Giriş",(2.15,-3.0)),("Z03","WC",(3.25,-1.45)),
  ("Z07","Garaj",(5.8,2.0)),("Z08","Tesisat odası",(6.0,5.85))],
 [("102","Ebeveyn yatak odası",(-1.35,5.1)),("103","Giyinme odası",(1.3,4.9)),("104","Ebeveyn banyosu",(1.5,7.2)),
  ("105","Oturma alanı",(-3.85,2.0)),("101","Kat holü",(-.2,2.35)),("106","Yatak odası",(-3.7,-1.1)),
  ("107","Yatak odası",(-.5,-1.85)),("108","Banyo",(2.95,-2.1))],
 [("C01","Kat holü",(-.65,2.3)),("C05","Oturma alanı",(-3.9,2.3)),("C02","Yatak odası",(-1.45,4.8)),
  ("C03","Banyo",(.7,7.3)),("C04","Yatak odası",(-.6,-.9))]
]
def ground(x,y,f):
    tris=floor_tris[(floor_tris[:,:,2].min(1)>datums[f]-.41)&(floor_tris[:,:,2].max(1)<datums[f]+.12)]
    a=tris[:,0,:2];u=tris[:,1,:2]-a;v=tris[:,2,:2]-a;q=np.array([x,y])-a
    det=u[:,0]*v[:,1]-u[:,1]*v[:,0];valid=abs(det)>1e-10
    b=np.divide(q[:,0]*v[:,1]-q[:,1]*v[:,0],det,out=np.zeros_like(det),where=valid)
    c=np.divide(u[:,0]*q[:,1]-u[:,1]*q[:,0],det,out=np.zeros_like(det),where=valid)
    hit=valid&(b>=-.0001)&(c>=-.0001)&(b+c<=1.0001)
    z=tris[:,0,2]+b*(tris[:,1,2]-tris[:,0,2])+c*(tris[:,2,2]-tris[:,0,2])
    return float(max(z[hit])) if hit.any() else None
rooms=[];dimensions=[];qa=[]
for f,entries in enumerate(specs):
    s=min(atlas['slices'],key=lambda s:abs(s['height']-datums[f]-1.0));p=np.array(s['p']).reshape(-1,2)*[1,-1]
    wall=unary_union([Polygon(p[s['i'][i:i+3]]) for i in range(0,len(s['i']),3)])
    reg=registration[f];off=np.array(reg['translation_xy'])
    source=[]
    for d in dims:
        if d['dimstyle']!='NES' or not -8200<d['defpoint2'][1]<-6200:continue
        axis=0 if abs(math.sin(math.radians(d.get('angle',0))))<.0001 else 1 if abs(math.cos(math.radians(d.get('angle',0))))<.0001 else None
        if axis is None:continue
        a=np.array(d['defpoint2'][:2])*.01+off;b=np.array(d['defpoint3'][:2])*.01+off
        value=abs(a[axis]-b[axis]);actual=d.get('actual_measurement',0)*.01
        if not .8<value<12 or abs(value-actual)>.001:continue
        if not -7<min(a[0],b[0])<8 or not -7<max(a[0],b[0])<8:continue
        # Rounded or overridden text is not silently promoted to an exact span.
        try:text_value=float(d.get('text') or d['actual_measurement'])*.01
        except ValueError:continue
        if abs(text_value-value)>.0051:continue
        source.append((d,axis,a,b,value))
    for code,label,(x,y) in entries:
        z=ground(x,y,f)
        assert z is not None,(f,code,'no supporting source floor',x,y)
        assert wall.distance(Point(x,y))>.06,(f,code,'label inside wall')
        room={'id':f'f{f}-{code}','floor_index':f,'code':code,'name':label,
              'position':[x,round(z+.026,5),-y],'label_anchor_status':'presentation_position_on_source_floor',
              'name_source':'build/reference/source-2d-floor-plans.png; room photo groups',
              'photo_match_approved':False,'dimensions':[]}
        for axis in [0,1]:
            candidates=[];q=np.array([x,y]);other=1-axis
            for d,ax,a,b,value in source:
                if ax!=axis or not min(a[axis],b[axis])+.08<q[axis]<max(a[axis],b[axis])-.08:continue
                if abs((a[other]+b[other])/2-q[other])>3.0:continue
                for delta in [-.6,.6,-1.0,1.0,0,-1.5,1.5]:
                    aa=q.copy();bb=q.copy();aa[axis]=min(a[axis],b[axis]);bb[axis]=max(a[axis],b[axis]);aa[other]+=delta;bb[other]+=delta
                    da=wall.boundary.distance(Point(aa));db=wall.boundary.distance(Point(bb))
                    if max(da,db)>.006:continue
                    line=LineString([aa,bb])
                    if line.intersection(wall.buffer(-.006)).length>.003:continue
                    anchor=q.copy();anchor[other]=aa[other]
                    if LineString([q,anchor]).intersection(wall.buffer(-.006)).length>.003:continue
                    # Avoid bridges over gallery/stair openings or steps in floor finish.
                    direction=(bb-aa)/np.linalg.norm(bb-aa)
                    # Finish meshes stop at wall faces; do not reject a correct
                    # dimension because a sub-millimetre registration residual
                    # lies just outside the triangulated floor boundary.
                    support=[ground(*pt,f) for pt in np.linspace(aa+direction*.012,bb-direction*.012,13)]
                    if any(v is None or abs(v-z)>.012 for v in support):continue
                    score=abs(delta+.6)+abs((a[other]+b[other])/2-aa[other])*.15
                    candidates.append((score,d,aa,bb,value,max(da,db)))
            if candidates:
                _,d,a,b,value,error=min(candidates,key=lambda c:c[0])
                row={'id':room['id']+'-'+str(axis),'room_id':room['id'],'floor_index':f,
                     'a':[round(a[0],6),round(z+.022,5),round(-a[1],6)],
                     'b':[round(b[0],6),round(z+.022,5),round(-b[1],6)],
                     'metres':round(value,6),'display':f'{value:.2f}'.replace('.',',')+' m',
                     'source_dimension_handle':d['handle'],'source_actual_measurement_cm':d['actual_measurement'],
                     'source_witness_points':[d['defpoint2'],d['defpoint3']],
                     'registration':reg['translation_xy'],'maximum_wall_endpoint_residual_m':round(error,6),
                     'verification':'original_dimension_value_and_registered_opposite_wall_faces_with_continuous_source_floor',
                     'dimension_label_allowed':True}
                room['dimensions'].append(row['id']);dimensions.append(row)
        rooms.append(room);qa.append({'room':room['id'],'source_floor_z':z,'verified_dimensions':len(room['dimensions'])})
data={'version':1,'coordinate_system':'glTF_Y_up','floor_datums_m':datums,
      'source_architecture_sha256':atlas['source_architecture_sha256'],
      'source_dimension_file_sha256':hashlib.sha256((ROOT/'build/cad/dimension-source.json').read_bytes()).hexdigest(),
      'rooms':rooms,'dimensions':dimensions,'inferred_site_dimensions_included':False}
path=ROOT/'build/web/full/rooms.json';path.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
mp=path.parent/'manifest.json';manifest=json.loads(mp.read_text())
manifest['room_annotations']={'file':path.name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
mp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(ROOT/'build/room-annotation-qa.json').write_text(json.dumps({'rooms':qa,'rooms_count':len(rooms),'verified_dimensions_count':len(dimensions),
 'source_dimensions_remain_unchanged':True,'plan_registration':'build/cad/plan-registration.json'},ensure_ascii=False,indent=2))
print('ROOM_ANNOTATIONS',len(rooms),len(dimensions));print(json.dumps(qa,indent=2))
