import bpy,json,math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
for name in ['wood_dark (4)','interior.001','ceiling [imported]','roof.003']:
 o=bpy.data.objects.get(name);v=[o.matrix_world@p.co for p in o.data.vertices];bvh=BVHTree.FromPolygons(v,[p.vertices[:] for p in o.data.polygons])
 for x,z in [(.14,-4.94),(-2.2,-8)]:
  for origin,direction,distance in [(Vector((x,-z,6.451)),Vector((0,0,1)),1.68)]+[(Vector((x,-z,6.371+dz)),Vector((math.cos(a*math.pi/4),math.sin(a*math.pi/4),0)),.21) for dz in [.25,.85,1.5] for a in range(8)]:
   hit,n,idx,dist=bvh.ray_cast(origin,direction,distance)
   if hit:print('BLOCK',name,(x,z),'hit',list(hit),'face',[list(v[i]) for i in o.data.polygons[idx].vertices],flush=True);break
 # Ceiling forward/up rays from the inspected attic bedroom.
 for direction in [(0,-.3,1),(0,-1,.2),(0,-1,0)]:
  hit,n,idx,d=bvh.ray_cast(Vector((-.6,-.9,11.09)),Vector(direction).normalized(),8)
  if hit:print('ATTIC',name,direction,tuple(hit),d,flush=True)
