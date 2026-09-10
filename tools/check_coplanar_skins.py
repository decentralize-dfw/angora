"""Find intersecting, almost-coplanar source skins with different tessellation.

Edges meeting without shared area are allowed. This complements, rather than
claims to replace, furniture collision checks and visual GPU verification.
"""
import json,gzip,numpy as np,sys,hashlib
from pathlib import Path
from collections import defaultdict
from shapely.geometry import Polygon
from shapely.strtree import STRtree
ROOT=Path(__file__).resolve().parents[1]
records=json.load(gzip.open(ROOT/'build/intermediate/skin-audit.json.gz','rt'))
patched='--patched' in sys.argv
if patched:
    patch=json.load(gzip.open(ROOT/'build/cad/web-surface-patches-r27.json.gz','rt'))['villa']
    for rec in records:
        if rec['name'] not in patch:continue
        vertices=np.array(rec['vertices']);new=[]
        for ti,idx in enumerate(rec['triangles']):
            for weights in patch[rec['name']]['triangles'].get(str(ti),[[[1,0,0],[0,1,0],[0,0,1]]]):new.extend((np.asarray(weights)@vertices[idx]).tolist())
        rec['vertices']=new;rec['triangles']=np.arange(len(new)).reshape(-1,3).tolist()
planes=defaultdict(list);pairs=defaultdict(lambda:{'triangles':0,'overlap_m2':0,'examples':[]})
for rec in records:
    vertices=np.asarray(rec['vertices'])
    for ti,idx in enumerate(rec['triangles']):
        p=vertices[idx];n=np.cross(p[1]-p[0],p[2]-p[0]);length=np.linalg.norm(n)
        if length<1e-7:continue
        n/=length;axis=int(np.argmax(abs(n)))
        if n[axis]<0:n=-n
        d=float(n@p[0]);axes=[i for i in range(3) if i!=axis]
        key=(*np.round(n,3),round(d,2))
        planes[key].append((rec['name'],ti,p,n,Polygon(p[:,axes]),axis))
for group in planes.values():
    if len(group)<2:continue
    shapes=[r[4] for r in group];tree=STRtree(shapes)
    for i,a in enumerate(group):
        for j in tree.query(a[4],predicate='intersects'):
            if j<=i:continue
            b=group[j]
            if abs(a[3]@b[3])<.999999 or max(abs((b[2]-a[2][0])@a[3]))>.0006:continue
            # Snap only Boolean arithmetic (0.1 micrometre). GEOS floating
            # intersection can misclassify an almost-identical shared edge
            # as an entire triangle even when DE-9IM says disjoint interiors.
            area=a[4].intersection(b[4],grid_size=1e-7).area/abs(a[3][a[5]])
            if area<.0004:continue
            key=tuple(sorted((a[0],b[0])));row=pairs[key];row['triangles']+=1;row['overlap_m2']+=area
            if len(row['examples'])<3:row['examples'].append({'faces':[a[1],b[1]],'centers':[a[2].mean(0).tolist(),b[2].mean(0).tolist()]})
out={'tolerance_m':.0006,'minimum_overlap_m2':.0004,'source_objects':len(records),
     'patch_sha256':hashlib.sha256((ROOT/'build/cad/web-surface-patches-r27.json.gz').read_bytes()).hexdigest() if patched else None,
     'tested_triangles':sum(len(r['triangles']) for r in records),'pairs':[dict(objects=list(k),**v) for k,v in sorted(pairs.items(),key=lambda x:-x[1]['overlap_m2'])],
     'scope':'Native architecture, exterior details, roads and terrain; no claim of complete photo or GPU acceptance.'}
(ROOT/('build/coplanar-skins-r27-after.json' if patched else 'build/coplanar-skins-r27.json')).write_text(json.dumps(out,indent=2))
print(json.dumps({**out,'pairs':out['pairs'][:18]}),flush=True)
