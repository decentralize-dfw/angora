import bpy,math
from mathutils import Vector
s=bpy.context.scene;d=bpy.context.evaluated_depsgraph_get()
for p in [(-.817,1.148,4.65),(-.817,.3,4.65),(-.1,.3,4.65),(-1.6,1.148,4.65)]:
 print('ORIGIN',p)
 for angle in range(0,360,30):
  a=math.radians(angle);hit,loc,n,i,obj,m=s.ray_cast(d,Vector(p),Vector((math.cos(a),math.sin(a),0)),distance=12)
  if hit:
   mat=obj.data.materials[obj.data.polygons[i].material_index].name if i<len(obj.data.polygons) else '?'
   print(angle,[round(v,3) for v in loc],round((loc-Vector(p)).length,3),mat)

