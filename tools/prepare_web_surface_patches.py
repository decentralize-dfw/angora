"""Partition coplanar skins into one visible surface, preserving coverage/UVs.

Writes barycentric triangle patches for the derived web exporter. Native CAD
and closed collision geometry remain untouched. Finishes own shared planes.
"""
import json,gzip,numpy as np,hashlib,sys
from pathlib import Path
from collections import defaultdict
from shapely.geometry import Polygon
from shapely.strtree import STRtree
from shapely import union_all,constrained_delaunay_triangles,set_precision,make_valid
from shapely.errors import GEOSException
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'build/intermediate/skin-audit.json.gz';records=json.load(gzip.open(source,'rt'))

def priority(name):
    if 'DUVAR KAPLAMA' in name:return 90
    if 'ZEMİN KAPLAMA' in name or 'attic parquet' in name:return 85
    if 'recess' in name:return 82
    if 'ÇERÇEVE' in name or 'FRAME' in name:return 80
    if 'TAVAN' in name or 'head ceiling' in name:return 70
    if 'ÇATII' in name:return 50
    if '$DUVAR' in name:return 40
    if '$ZEMİN' in name or 'attic structure' in name:return 30
    if '$CAM' in name:return 10
    return 75

def pieces(g):
    if g.is_empty:return []
    if g.geom_type=='Polygon':return [g]
    return [p for child in getattr(g,'geoms',[]) for p in pieces(child)]

def stable_union(shapes):
    return union_all([p for shape in shapes for p in pieces(shape) if p.area>1e-12],grid_size=1e-7)

def partition(rows):
    planes=defaultdict(list);patches=defaultdict(dict);removed=0;coverage_error=0;changed=0;remaining_overlap=0
    for rec in rows:
        vertices=np.asarray(rec['vertices'])
        for ti,idx in enumerate(rec['triangles']):
            p=vertices[idx];n=np.cross(p[1]-p[0],p[2]-p[0]);length=np.linalg.norm(n)
            if length<1e-7:continue
            n/=length;axis=int(np.argmax(abs(n)))
            if n[axis]<0:n=-n
            axes=[i for i in range(3) if i!=axis];poly=set_precision(Polygon(p[:,axes]),1e-7);d=float(n@p[0])
            if poly.is_empty:continue
            key=(*np.round(n,3),round(d,2))
            planes[key].append((rec['name'],ti,p,n,poly,axis,axes))
    for group in planes.values():
        if len(group)<2:continue
        group.sort(key=lambda r:(-priority(r[0]),-r[4].area,r[0],r[1]))
        shapes=[r[4] for r in group];tree=STRtree(shapes);accepted={}
        for i,a in enumerate(group):
            owners=[accepted[int(j)] for j in tree.query(a[4],predicate='intersects') if j<i and int(j) in accepted
              and abs(a[3]@group[j][3])>.999999 and min(max(abs((group[j][2]-a[2][0])@a[3])),max(abs((a[2]-group[j][2][0])@group[j][3])))<.0012]
            if owners:
                coverage=stable_union(owners)
                remainder=a[4].difference(coverage,grid_size=1e-7)
            else:remainder=a[4]
            loss=a[4].area-remainder.area
            accepted[i]=remainder
            if loss<1e-9:continue
            changed+=1;removed+=loss/abs(a[3][a[5]])
            result=[];xy=a[2][:,a[6]];matrix=np.c_[xy,np.ones(3)].T;triangulated_area=0
            for poly in pieces(remainder):
                if poly.area<1e-10:continue
                try:triangulation=constrained_delaunay_triangles(poly)
                except GEOSException:triangulation=constrained_delaunay_triangles(make_valid(set_precision(poly,1e-8)))
                for face in triangulation.geoms:
                    tri=np.array(face.exterior.coords)[:3]
                    part=np.linalg.solve(matrix,np.c_[tri,np.ones(3)].T).T
                    triangulated_area+=face.area
                    # Triangulator winding may differ from the source face.
                    if np.linalg.det(part)<0:part=part[::-1]
                    result.append(part.round(12).tolist())
            patches[a[0]][str(a[1])]=result
            error=abs(triangulated_area-remainder.area);coverage_error+=error
            assert error<1e-6,(a[0],a[1],error,'Remainder triangulation changed coverage')
    return {r['name']:{'geometry_sha256':r['geometry_sha256'],'triangles':patches[r['name']]} for r in rows if patches[r['name']]},dict(changed_source_triangles=changed,removed_duplicate_area_m2=removed,remainder_triangulation_error_m2=coverage_error)

def refined_partition(original,seed=None):
    rows=original;mapping={r['name']:[(i,np.eye(3)) for i in range(len(r['triangles']))] for r in rows};rounds=[]
    if seed:
        rows=[];mapping={}
        for r in original:
            v=np.asarray(r['vertices']);points=[];mapped=[];changes=seed.get(r['name'],{}).get('triangles',{})
            for ti,idx in enumerate(r['triangles']):
                for weights in changes.get(str(ti),[[[1,0,0],[0,1,0],[0,0,1]]]):
                    weights=np.asarray(weights);points.extend((weights@v[idx]).tolist());mapped.append((ti,weights))
            rows.append({**r,'vertices':points,'triangles':np.arange(len(points)).reshape(-1,3).tolist()});mapping[r['name']]=mapped
    for iteration in range(4):
        patch,report=partition(rows);rounds.append(report);print('PARTITION_PASS',iteration+1,json.dumps(report),flush=True)
        if not report['changed_source_triangles']:break
        following=[];nextmap={}
        for r in rows:
            v=np.asarray(r['vertices']);points=[];mapped=[];changes=patch.get(r['name'],{}).get('triangles',{})
            for ti,idx in enumerate(r['triangles']):
                original_index,original_bary=mapping[r['name']][ti]
                for weights in changes.get(str(ti),[[[1,0,0],[0,1,0],[0,0,1]]]):
                    weights=np.asarray(weights);points.extend((weights@v[idx]).tolist());mapped.append((original_index,weights@original_bary))
            following.append({**r,'vertices':points,'triangles':np.arange(len(points)).reshape(-1,3).tolist()});nextmap[r['name']]=mapped
        rows=following;mapping=nextmap
    final={}
    for r in original:
        out={str(i):[] for i in range(len(r['triangles']))}
        for ti,bary in mapping[r['name']]:out[str(ti)].append(bary.round(12).tolist())
        out={k:v for k,v in out.items() if not (len(v)==1 and np.max(abs(np.array(v[0])-np.eye(3)))<1e-10)}
        if out:final[r['name']]={'geometry_sha256':r['geometry_sha256'],'triangles':out}
    return final,{'passes':rounds,'changed_source_triangles':sum(len(r['triangles']) for r in final.values()),
       'removed_duplicate_area_m2':sum(r['removed_duplicate_area_m2'] for r in rounds),
       'remainder_triangulation_error_m2':sum(r['remainder_triangulation_error_m2'] for r in rounds)}

if '--refine-existing' in sys.argv:
    data=json.load(gzip.open(ROOT/'build/cad/web-surface-patches-r27.json.gz','rt'))
    pairs=json.loads((ROOT/'build/coplanar-skins-r27-after.json').read_text())['pairs']
    names={name for pair in pairs for name in pair['objects']}
    # This focused refinement is safe only for finish objects omitted by the
    # context LOD; cloned structural patches require a complete rebuild.
    assert all('TAVAN' in name or 'DUVAR KAPLAMA' in name for name in names)
    villa,vr=refined_partition([r for r in records if r['name'] in names],data['villa'])
    data['villa'].update(villa);data['report']['villa']['final_interface_refinement']=vr
else:
    villa,vr=refined_partition(records)
    # Neighbour LOD omits coverings/ceilings. Generate ownership for that exact
    # subset, so removing a structural duplicate cannot expose a missing finish.
    context_rows=[r for r in records if r['name'].startswith('F') and not any(s in r['name'] for s in
     ['SHUTTER AİM','TAVAN','DUVAR KAPLAMA','ZEMİN KAPLAMA','MERDİVEN','KAPI İÇ','DORBAK'])]
    context,cr=refined_partition(context_rows)
    data={'revision':27,'source_audit_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'villa':villa,
          'context_by_geometry':{v['geometry_sha256']:v for v in context.values()},'report':{'villa':vr,'context':cr}}
    assert cr['remainder_triangulation_error_m2']<.0001
assert vr['remainder_triangulation_error_m2']<.0001
with gzip.open(ROOT/'build/cad/web-surface-patches-r27.json.gz','wt') as f:json.dump(data,f,separators=(',',':'))
(ROOT/'build/web-surface-repair-r27.json').write_text(json.dumps(data['report'],indent=2))
print(json.dumps(data['report']),flush=True)
