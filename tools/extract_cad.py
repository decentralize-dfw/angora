"""Extract model-space CAD curves, original layer names and masterplan into compact JSON.

Usage: PYTHONPATH=<deps> python tools/extract_cad.py build/intermediate/source.dxf
DWG is kept unchanged. This stage makes no surfaces and invents no measurements.
"""
import sys, json, gzip, collections, hashlib
from pathlib import Path
import numpy as np
import ezdxf
from ezdxf import path as ep

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'build'/'cad'
OUT.mkdir(parents=True, exist_ok=True)
doc = ezdxf.readfile(sys.argv[1])
layers = {}
counts = collections.Counter()
texts = []
dimensions = []
skipped = collections.Counter()
for e in doc.modelspace():
    typ=e.dxftype(); counts[typ]+=1
    name=e.dxf.layer
    rec={'handle':e.dxf.handle,'type':typ}
    points=[]
    if typ=='DIMENSION':
        d={k:(list(v) if hasattr(v,'x') else v) for k,v in e.dxfattribs().items()}
        d['measurement_status']='unmapped_to_villa_room';d['dimension_label_allowed']=False
        try:d['computed_measurement']=float(e.get_measurement())
        except Exception:pass
        dimensions.append(d)
        continue
    if typ in {'TEXT','MTEXT'}:
        texts.append({'handle':e.dxf.handle,'layer':name,'text':e.plain_text() if typ=='MTEXT' else e.dxf.text,'position':list(e.dxf.insert)})
        continue
    try:
        if typ=='LINE': points=[list(e.dxf.start),list(e.dxf.end)]
        elif typ in {'POLYLINE','LWPOLYLINE','ARC','CIRCLE','ELLIPSE','SPLINE'}:
            points=[list(v) for v in ep.make_path(e).flattening(.1)]
            if typ=='SPLINE':
                rec['degree']=e.dxf.degree
                rec['control_points']=[list(v) for v in e.control_points]
                rec['knots']=list(e.knots)
                rec['weights']=list(e.weights)
        elif typ=='3DFACE': points=[list(e.dxf.get('vtx'+str(i))) for i in range(4)]
        else: skipped[typ]+=1
    except Exception as err:
        skipped[f'{typ}: {type(err).__name__}']+=1
    if len(points)<2: continue
    rec['points']=[[round(float(v),6) for v in p] for p in points]
    layers.setdefault(name,[]).append(rec)
report={'source_dwg_sha256':hashlib.sha256((ROOT/'ANGORA-.dwg').read_bytes()).hexdigest(),
        'dxf_insunits':doc.header.get('$INSUNITS'), 'modelspace_entities':sum(counts.values()),
        'entity_types':dict(counts),'skipped':dict(skipped), 'layers':[]}
for name,curves in layers.items():
    pp=np.array([p for c in curves for p in c['points']])
    report['layers'].append({'name':name,'curves':len(curves),'bounds':[pp.min(0).tolist(),pp.max(0).tolist()]})
with gzip.open(OUT/'source-curves.json.gz','wt',encoding='utf-8') as f: json.dump({'layers':layers,'texts':texts},f,ensure_ascii=True,separators=(',',':'))
(OUT/'extraction-report.json').write_text(json.dumps(report,ensure_ascii=True,indent=2))
(OUT/'dimension-source.json').write_text(json.dumps(dimensions,ensure_ascii=True,indent=2))
print(json.dumps({k:v for k,v in report.items() if k!='layers'},ensure_ascii=False),flush=True)
print('Layers:',len(layers),'Curves:',sum(len(v) for v in layers.values()),flush=True)
