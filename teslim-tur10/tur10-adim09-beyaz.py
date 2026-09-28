import bpy,json,math
from mathutils import Vector
from pathlib import Path
W=Path(r'C:\Users\yigit\angora-tur10');bpy.ops.wm.open_mainfile(filepath=str(W/'adim09/kontrol-sahne.blend'));s=bpy.context.scene;c=s.camera;bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();out=[]
for u,v in [(x/100,y/100) for x in [52,56,60] for y in [47,50,53,56]]:
 d=c.matrix_world.to_3x3()@Vector(((2*u-1)*math.tan(c.data.angle/2),(1-2*v)*math.tan(c.data.angle/2)*s.render.resolution_y/s.render.resolution_x,-1));hit,pos,n,idx,ob,mat=s.ray_cast(deps,c.location,d.normalized())
 if hit:out.append({'uv':[u,v],'ob':ob.name,'pos':list(pos),'normal':list(n),'mat':ob.data.materials[ob.data.polygons[idx].material_index].name})
(W/'adim09/white47.json').write_text(json.dumps(out,indent=1));print(out)
