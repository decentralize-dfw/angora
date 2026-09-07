"""Merge degree-two CAD edge chains and simplify within 2 mm for the display proxy."""
import gzip,json,collections
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1];p=ROOT/'build/cad/surfaces.json.gz'
j=json.load(gzip.open(p,'rt'))
def rdp(points,tol=.002):
    if len(points)<3:return points
    first=points[0];last=points[-1];delta=last-first;length=np.linalg.norm(delta)
    if length<1e-10:dist=np.linalg.norm(points-first,axis=1)
    else:dist=np.linalg.norm(np.cross(points-first,delta),axis=1)/length
    i=int(dist.argmax())
    if dist[i]<=tol:return points[[0,-1]]
    return np.concatenate([rdp(points[:i+1],tol)[:-1],rdp(points[i:],tol)])
for layer in j['layers']:
    if 'KORKULUK' not in layer['source_layer'].upper():continue
    vv=np.asarray(layer['vertices']);edges=layer['edges'];adj=collections.defaultdict(list)
    for i,(a,b) in enumerate(edges):adj[a].append(i);adj[b].append(i)
    used=set();chains=[]
    def walk(start,edge):
        chain=[start];point=start
        while edge not in used:
            used.add(edge);a,b=edges[edge];point=b if a==point else a;chain.append(point)
            if len(adj[point])!=2:break
            nxt=[e for e in adj[point] if e not in used]
            if not nxt:break
            edge=nxt[0]
        return chain
    for point,near in adj.items():
        if len(near)==2:continue
        for e in near:
            if e not in used:chains.append(walk(point,e))
    for e,(a,b) in enumerate(edges):
        if e not in used:chains.append(walk(a,e))
    paths=[rdp(vv[chain]).tolist() for chain in chains]
    layer['display_paths']=paths;layer['display_tolerance_m']=.002
    print('Ironwork edges',len(edges),'chains',len(chains),'display segments',sum(len(c)-1 for c in paths),flush=True)
with gzip.open(p,'wt',encoding='utf-8') as f:json.dump(j,f,ensure_ascii=True,separators=(',',':'))
