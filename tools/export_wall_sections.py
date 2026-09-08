"""Export structural wall triangles for view-independent section contours."""
import bpy,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
triangles=[];objects=[]
deps=bpy.context.evaluated_depsgraph_get()
for o in bpy.context.scene.objects:
 if not (o.get('source_layer','').endswith('$DUVAR') or o.name.startswith(('Lift shaft','Lift landing jamb wall','Lift lintel wall'))):continue
 if o.hide_render:continue
 ev=o.evaluated_get(deps);me=ev.to_mesh();me.calc_loop_triangles()
 v=[o.matrix_world@v.co for v in me.vertices]
 triangles.extend([[list(v[i]) for i in t.vertices] for t in me.loop_triangles]);objects.append(o.name);ev.to_mesh_clear()
path=ROOT/'build/intermediate/wall-triangles.json';path.parent.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
path.write_text(json.dumps({'objects':objects,'triangles':triangles,'source_native_sha256':sha(Path(bpy.data.filepath)),
 'library_hashes':{name:sha(ROOT/'build/blender/layers'/name) for name in ['10-architecture.blend','20-fixed-fittings.blend']}}))
print('Wall triangles',len(triangles),flush=True)
