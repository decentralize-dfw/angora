"""Register original plan dimensions against the recovered, unmodified CAD walls.

The translation is estimated from all repeated dimension witness coordinates,
then scored against independent wall-face coordinates. No display permission is
granted here: individual room spans still need endpoint and free-space checks.
"""
import json, collections
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
dims=json.loads((ROOT/'build/cad/dimension-source.json').read_text())
atlas=json.loads((ROOT/'build/web/full/sections.json').read_text())
registration=[]
for floor,(lo,hi) in enumerate([(-2000,0),(0,2250),(2250,4500),(4500,6800)]):
    source=[d for d in dims if lo<d['defpoint2'][0]<hi and -8200<d['defpoint2'][1]<-6200 and d['dimstyle']=='NES']
    s=min(atlas['slices'],key=lambda s:abs(s['height']-[1.6,4.6996,7.9714,11.0705][floor]))
    native=np.array(s['p']).reshape(-1,2)*[1,-1]
    offsets=[];evidence=[]
    for axis in [0,1]:
        raw=collections.Counter(round(d[p][axis]*.01,6) for d in source for p in ['defpoint2','defpoint3'])
        src=np.array([v for v,n in raw.items() if n>=4])
        targets=collections.Counter(np.round(native[:,axis],4))
        target=np.array([v for v,n in targets.items() if n>=4])
        candidates=np.unique(np.round((target[:,None]-src[None,:]).flatten(),3))
        scores=[]
        for t in candidates:
            residual=np.min(abs(src[:,None]+t-target[None,:]),axis=1)
            scores.append(sum(raw[float(v)] for v,r in zip(src,residual) if r<.006))
        best=candidates[np.argmax(scores)]
        nearest=target[np.argmin(abs(src[:,None]+best-target[None,:]),axis=1)]
        mask=abs(src+best-nearest)<.006
        best=float(np.median(nearest[mask]-src[mask]));offsets.append(best)
        evidence.append({'axis':'XY'[axis],'matched_witness_axes':int(mask.sum()),'total_witness_axes':len(src),
                         'maximum_axis_residual_m':float(max(abs(src[mask]+best-nearest[mask]))),
                         'matches':[[float(x),float(y)] for x,y in zip(src[mask],nearest[mask])]})
    registration.append({'floor_index':floor,'scale':.01,'translation_xy':offsets,'source_records':len(source),'axis_evidence':evidence})
out=ROOT/'build/cad/plan-registration.json';out.write_text(json.dumps(registration,indent=2))
print(json.dumps([{k:v for k,v in r.items() if k!='axis_evidence'} for r in registration],indent=2))
