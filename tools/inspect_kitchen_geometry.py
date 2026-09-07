import bpy,json
from pathlib import Path
from mathutils import Vector
c=bpy.data.collections['Photo kitchen — entrance']
r=[]
for o in c.all_objects:
    r.append({'name':o.name,'location':list(o.location),'dimensions':list(o.dimensions),'angle':o.rotation_euler.z,'materials':[m.name for m in o.data.materials if m]})
Path('build/intermediate/kitchen-geometry.json').write_text(json.dumps(r,ensure_ascii=False,indent=2))
