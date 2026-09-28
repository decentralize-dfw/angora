import bpy,math
from mathutils import Vector
s=bpy.context.scene;d=bpy.context.evaluated_depsgraph_get()
for p in [(0.744,-1.453,7.921),(.4,-2.4,7.921),(.784,-4.757,7.921),(-1.001,2.823,7.921),(-1.1,1.22,7.921)]:
 print('ORIGIN',p)
 for angle in range(0,360,30):
  a=math.radians(angle);hit,loc,n,i,obj,m=s.ray_cast(d,Vector(p),Vector((math.cos(a),math.sin(a),0)),distance=12)
  if hit:
   mat=obj.data.materials[obj.data.polygons[i].material_index].name if i<len(obj.data.polygons) else '?'
   print(angle,[round(v,3) for v in loc],round((loc-Vector(p)).length,3),mat)
