"""Build wall cross sections without relying on inconsistent CAD face winding.

Opposite parallel source faces define thickness; closed thin cells retain posts
and corners. Door/window gaps wider than 0.501 m are never bridged. The four
requested floor cuts are exact samples; transition samples are 8 cm apart.
The original architecture remains untouched. Requires the exported triangles.
"""
import json,hashlib
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
import numpy as np
import mapbox_earcut
from shapely.geometry import LineString,Polygon,Point
from shapely.ops import unary_union,snap
ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'build/intermediate/wall-triangles.json').read_text())
TRIS=np.array(DATA['triangles']);MIN=TRIS[:,:,2].min(1);MAX=TRIS[:,:,2].max(1)
FLOORS=[1.6,4.6996,7.9714,10.7705]

def section(height):
    z=height+.000001;active=TRIS[(MIN<z)&(MAX>z)];segments=[];edges=[]
    for tri in active:
        points=[]
        for a,b in zip(tri,np.roll(tri,-1,axis=0)):
            if (a[2]<z)!=(b[2]<z):points.append((a+(b-a)*((z-a[2])/(b[2]-a[2])))[:2])
        if len(points)!=2:continue
        a,b=points;length=np.linalg.norm(b-a)
        if length<.000001:continue
        segments.append(LineString(points))
        if length>.004:edges.append((a,b,(b-a)/length,length))
    if not segments:return {'height':height,'p':[],'i':[],'area':0}
    network=unary_union(segments);network=snap(network,network,.004)
    stroke=network.buffer(.004,quad_segs=1,join_style=2)
    polys=[stroke] if stroke.geom_type=='Polygon' else list(getattr(stroke,'geoms',[]))
    candidates=[]
    for poly in polys:
        for ring in poly.interiors:
            hole=Polygon(ring)
            if hole.buffer(-.31).is_empty:candidates.append(hole)
    # Vectorize candidate pairing; construct only compatible opposing faces.
    a=np.array([e[0] for e in edges]);b=np.array([e[1] for e in edges]);u=np.array([e[2] for e in edges])
    lengths=np.array([e[3] for e in edges])
    if len(edges):
        parallel=np.abs(u@u.T)>.999
        delta=a[None,:,:]-a[:,None,:]
        normal_distance=np.abs(delta[:,:,0]*u[:,None,1]-delta[:,:,1]*u[:,None,0])
        ids=np.argwhere(np.triu(parallel&(normal_distance>.034)&(normal_distance<.502),1))
        for i,j in ids:
            t0,t1=np.dot(a[j]-a[i],u[i]),np.dot(b[j]-a[i],u[i])
            lo=max(0,min(t0,t1));hi=min(lengths[i],max(t0,t1))
            if hi-lo<.004:continue
            denom=np.dot(b[j]-a[j],u[i])
            if abs(denom)<1e-8:continue
            aa=a[i]+u[i]*lo;bb=a[i]+u[i]*hi
            cc=a[j]+(b[j]-a[j])*((hi-t0)/denom);dd=a[j]+(b[j]-a[j])*((lo-t0)/denom)
            distances=[np.linalg.norm(aa-dd),np.linalg.norm(bb-cc)]
            if min(distances)<.035 or max(distances)>.501:continue
            poly=Polygon([aa,bb,cc,dd])
            if poly.is_valid and poly.area>1e-6:candidates.append(poly)
    cap=unary_union(candidates).buffer(0).simplify(.0005,preserve_topology=True)
    polys=[cap] if cap.geom_type=='Polygon' else list(getattr(cap,'geoms',[]))
    positions=[];indices=[]
    for poly in polys:
        if poly.geom_type!='Polygon' or poly.area<.0001:continue
        rings=[poly.exterior]+list(poly.interiors)
        xy=np.array([p for ring in rings for p in list(ring.coords)[:-1]],dtype=np.float64)
        ends=np.cumsum([len(ring.coords)-1 for ring in rings],dtype=np.uint32)
        faces=mapbox_earcut.triangulate_float64(xy,ends)
        base=len(positions)//2
        positions.extend(round(float(v),4) for x,y in xy for v in (x,-y))
        indices.extend(base+int(i) for i in faces)
    if height==7.9714:
        for p in [(1,.4),(2,1.2),(-3.35,6.9)]:assert not cap.covers(Point(p)),('Room/void incorrectly filled',p)
        # Source face intersections here are X=-5.232 and X=-5.032 m.
        assert cap.covers(Point((-5.132,5))), 'Known external wall lacks a solid section'
    return {'height':height,'p':positions,'i':indices,'area':round(cap.area,5)}

def main():
    for name in ['10-architecture.blend','20-fixed-fittings.blend']:
        assert DATA.get('library_hashes',{}).get(name)==hashlib.sha256((ROOT/'build/blender/layers'/name).read_bytes()).hexdigest(), 'Re-export current wall triangles before building sections: '+name
    heights=sorted(set([round(float(v),4) for v in np.arange(-.48,14.57,.08)]+FLOORS))
    with ProcessPoolExecutor(max_workers=4) as executor:slices=list(executor.map(section,heights,chunksize=8))
    sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
    atlas={'version':1,'coordinate_system':'glTF_XZ','method':'paired_source_wall_faces_and_closed_thin_contours',
      'source_architecture_sha256':sha(ROOT/'build/blender/layers/10-architecture.blend'),
      'source_fittings_sha256':sha(ROOT/'build/blender/layers/20-fixed-fittings.blend'),
      'exact_floor_heights_m':FLOORS,'transition_sample_step_m':.08,'coordinate_snap_m':.004,
      'maximum_paired_face_distance_m':.501,'dimension_label_allowed':False,'slices':slices}
    path=ROOT/'build/web/full/sections.json';path.write_text(json.dumps(atlas,separators=(',',':')))
    record={'file':path.name,'bytes':path.stat().st_size,'sha256':sha(path)}
    manifest_path=path.parent/'manifest.json';manifest=json.loads(manifest_path.read_text())
    manifest.update(section_caps='prepared_geometric_wall_contours',section_atlas=record)
    manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
    report={k:v for k,v in atlas.items() if k!='slices'}
    report.update(status='passed',slice_count=len(slices),file=record,
      exact_floor_sections=[{'height':s['height'],'area_m2':s['area'],'triangles':len(s['i'])//3} for s in slices if s['height'] in FLOORS],
      room_and_gallery_test_points_clear=True,known_external_wall_filled=True,
      note='Deterministic geometry caps; original open CAD mesh winding is not used for screen-space filling.')
    (ROOT/'build/wall-section-qa.json').write_text(json.dumps(report,indent=2))
    print('SECTION_ATLAS',len(slices),record,flush=True)
if __name__=='__main__':main()
