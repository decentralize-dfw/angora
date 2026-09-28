import bpy
from mathutils import Vector
from pathlib import Path
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main')
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(R/'build/bake/BUILDING-opt-v4-lm.glb'))
dg=bpy.context.evaluated_depsgraph_get()
for y in [3.45,3.65,3.90,4.4]:
 for x in [-1.,-.3,0,.5,1.,1.5,2.]:
  h,p,n,i,ob,m=bpy.context.scene.ray_cast(dg,Vector((x,y,9.6)),Vector((0,0,1)),distance=4)
  if h:print('[CATI]',x,y,[round(v,4) for v in p],ob.data.materials[ob.data.polygons[i].material_index].name,flush=True)
