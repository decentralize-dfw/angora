"""Read-only native inventory for room and furniture QA; no model mutation."""
import bpy, json, gzip, hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
deps=bpy.context.evaluated_depsgraph_get()
records=[]; floors=[]
for cname in ['10_ARCHITECTURE','20_FIXED_FITTINGS','30_FURNITURE_PLACEHOLDERS']:
    for o in sorted(bpy.data.collections[cname].all_objects,key=lambda o:o.name):
        if o.type not in {'MESH','CURVE'} or o.hide_render:continue
        ev=o.evaluated_get(deps);me=ev.to_mesh(preserve_all_data_layers=True,depsgraph=deps)
        if not me or not me.polygons:
            ev.to_mesh_clear();continue
        verts=[tuple(o.matrix_world@v.co) for v in me.vertices]
        bounds=[[min(v[i] for v in verts) for i in range(3)],[max(v[i] for v in verts) for i in range(3)]]
        props={k:o[k] for k in o.keys() if isinstance(o[k],(str,int,float,bool))}
        record={'name':o.name,'category':cname,'collections':[c.name for c in o.users_collection],
                'bounds':bounds,'props':props,'materials':[m.name for m in me.materials if m]}
        records.append(record)
        layer=o.get('source_layer','')
        if cname=='30_FURNITURE_PLACEHOLDERS' or layer.endswith(('$ZEMİN','$ZEMİN KAPLAMA','$MERDİVEN')) or o.name.startswith(('Lift cabin','Lift landing')):
            me.calc_loop_triangles()
            floors.append({**record,'vertices':verts,'triangles':[list(t.vertices) for t in me.loop_triangles]})
        ev.to_mesh_clear()
    print('INVENTORY',cname,len(records),flush=True)
out=ROOT/'build/intermediate';out.mkdir(exist_ok=True,parents=True)
(out/'review-inventory.json').write_text(json.dumps(records,ensure_ascii=False))
with gzip.open(out/'review-geometry.json.gz','wt') as f:json.dump(floors,f,ensure_ascii=False,separators=(',',':'))
print('INVENTORY_COMPLETE',len(records),len(floors),flush=True)
