"""Export source architectural/ground triangles for planar-overlap QA."""
import bpy,json,gzip,hashlib,numpy as np
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
objects=set(bpy.data.collections['10_ARCHITECTURE'].all_objects)|set(bpy.data.collections['15_EXTERIOR_DETAILS'].all_objects)
objects|={o for o in bpy.context.scene.objects if o.name.startswith(('Terrain','CAD roads','Front pedestrian'))}
records=[]
deps=bpy.context.evaluated_depsgraph_get()
for o in sorted(objects,key=lambda o:o.name):
    if o.type!='MESH' or o.hide_render or not o.data.polygons:continue
    ev=o.evaluated_get(deps);me=ev.to_mesh(preserve_all_data_layers=True,depsgraph=deps);me.calc_loop_triangles()
    local=np.array([list(v.co) for v in me.vertices],dtype='<f4');tri=np.array([list(t.vertices) for t in me.loop_triangles],dtype='<i4')
    world=[list(o.matrix_world@v.co) for v in me.vertices]
    records.append({'name':o.name,'vertices':world,'triangles':tri.tolist(),
       'geometry_sha256':hashlib.sha256(local.tobytes()+tri.tobytes()).hexdigest(),
       'library':o.library.filepath if o.library else None})
    ev.to_mesh_clear()
with gzip.open(ROOT/'build/intermediate/skin-audit.json.gz','wt') as f:json.dump(records,f)
print('SKIN_AUDIT_EXPORTED',len(records),sum(len(r['triangles']) for r in records),flush=True)
