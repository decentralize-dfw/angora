import bpy,sys
from mathutils import Vector
scene=bpy.context.scene;cam=bpy.data.objects['01_front'];frame=cam.data.view_frame(scene=scene)
deps=bpy.context.evaluated_depsgraph_get()
for u,v in [(x/900,y/675) for x in range(270,551,35) for y in range(150,316,33)]:
    x=min(p.x for p in frame)+u*(max(p.x for p in frame)-min(p.x for p in frame))
    y=min(p.y for p in frame)+(1-v)*(max(p.y for p in frame)-min(p.y for p in frame))
    d=(cam.matrix_world.to_3x3()@Vector((x,y,frame[0].z))).normalized()
    hit,loc,n,index,obj,mat=scene.ray_cast(deps,cam.location,d)
    if obj and obj.type=='MESH' and index<len(obj.data.polygons):
        p=obj.data.polygons[index];material=obj.data.materials[p.material_index].name
        if material in ['interior','ceiling','white_trim']:print('HIT',round(u*900),round(v*675),obj.name,index,material,tuple(loc),flush=True)
