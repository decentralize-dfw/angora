"""Compare linked and editable source object counts without changing either."""
import bpy,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
data={}
for o in bpy.context.scene.objects:
    if o.type!='MESH':continue
    r={'vertices':len(o.data.vertices),'location':list(o.location)}
    if o.name.startswith(('Pool terrace','Review kitchen','Flush ceiling','Opal ceiling')):
        p=[o.matrix_world@Vector(v) for v in o.bound_box]
        r['bounds']=[[min(v[i] for v in p) for i in range(3)],[max(v[i] for v in p) for i in range(3)]]
        r['library']=o.library.filepath if o.library else None
    data[o.name]=r
(ROOT/'build/intermediate'/('objects-'+Path(bpy.data.filepath).stem+'.json')).write_text(json.dumps(data,indent=2))
