import bpy,json
from mathutils import Vector
from pathlib import Path
deps=bpy.context.evaluated_depsgraph_get()
walls=[o for o in bpy.data.collections['10_ARCHITECTURE'].all_objects if o.type=='MESH' and o.get('floor_index')==1 and 'DUVAR' in o.get('source_layer','')]
out=[]
for y in [-3.9,-3.5,-3,-2.65,-2,-1.4,-.8]:
 origin=Vector((-3,y,4.6));direction=Vector((1,0,0));hits=[]
 for o in walls:
  e=o.evaluated_get(deps);inv=e.matrix_world.inverted();ok,p,n,idx=e.ray_cast(inv@origin,inv.to_3x3()@direction)
  if ok:
   q=e.matrix_world@p;hits.append({'object':o.name,'position':list(q),'distance':(q-origin).length})
 out.append({'y':y,'hits':sorted(hits,key=lambda h:h['distance'])[:4]})
Path('build/intermediate/kitchen-wall-probes.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
