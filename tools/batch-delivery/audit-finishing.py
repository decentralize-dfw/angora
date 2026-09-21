import bpy,json,numpy as np
from pathlib import Path
from collections import Counter
out=Path(__file__).resolve().parents[2]/'.runtime/finishing'
out.mkdir(parents=True,exist_ok=True)
result=[]
for o in bpy.context.scene.objects:
 if o.type!='MESH':continue
 if not any(k in o.name.lower() for k in ['interior.001','ceiling','stair','pool','water','wood_floor','limestone','curtain']):continue
 m=o.data;world=np.array([o.matrix_world@v.co for v in m.vertices]);keys=Counter(tuple(sorted(tuple(np.round(world[i],4)) for i in p.vertices)) for p in m.polygons)
 parent=list(range(len(m.vertices)))
 def root(i):
  while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
  return i
 for e in m.edges:
  a,b=map(root,e.vertices);parent[a]=b
 groups={}
 for i in range(len(parent)):groups.setdefault(root(i),[]).append(i)
 comps=[{'n':len(ids),'min':world[ids].min(0).round(4).tolist(),'max':world[ids].max(0).round(4).tolist()} for ids in groups.values() if len(ids)>2]
 result.append({'name':o.name,'vertices':len(m.vertices),'faces':len(m.polygons),'smooth':sum(p.use_smooth for p in m.polygons),'duplicates':sum(n-1 for n in keys.values()),'uv':[u.name for u in m.uv_layers],'materials':[x.name if x else None for x in m.materials],'components':comps})
(out/(Path(bpy.data.filepath).stem+'.json')).write_text(json.dumps(result,indent=2))
print('FINISH_AUDIT',[(x['name'],x['duplicates'],x['smooth']) for x in result],flush=True)
