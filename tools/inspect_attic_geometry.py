"""Read-only attic geometry inventory for the photo correction review."""
import bpy,json
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]
bpy.context.view_layer.update()
records=[]
for o in bpy.data.collections['10_ARCHITECTURE'].all_objects:
    if o.type!='MESH' or o.get('floor_index')!=3:continue
    points=[o.matrix_world@Vector(p) for p in o.bound_box]
    records.append({'name':o.name,'vertices':len(o.data.vertices),'faces':len(o.data.polygons),
      'bounds':[[min(p[i] for p in points) for i in range(3)],[max(p[i] for p in points) for i in range(3)]],
      'metadata':{k:o[k] for k in o.keys()},'library':o.library.filepath if o.library else None})
path=root/'build/intermediate/attic-geometry.json';path.write_text(json.dumps(records,ensure_ascii=False,indent=2))
print('ATTIC_OBJECTS',json.dumps(records,ensure_ascii=False),flush=True)
