import bpy,json
from pathlib import Path
from mathutils import Vector
R=Path(r"C:\Users\yigit\Downloads\angora-main (2)\angora-main");W=Path(r"C:\Users\yigit\angora-tur10")
bpy.ops.wm.read_factory_settings(use_empty=True)
for f in ['BUILDING-opt-v4-lm.glb','INTERIOR-opt-v2.decoded.glb']:bpy.ops.import_scene.gltf(filepath=str(R/'build/bake'/f))
out=[]
for ob in bpy.context.scene.objects:
 if ob.type!='MESH' or not any(m and m.name in ['wood_honey','X','FINISH | Silver mirror','terra_floor','ROUGHNSS1'] for m in ob.data.materials):continue
 me=ob.data;parent=list(range(len(me.vertices)))
 def find(a):
  while parent[a]!=a:parent[a]=parent[parent[a]];a=parent[a]
  return a
 for e in me.edges:
  a,b=map(find,e.vertices);parent[b]=a
 groups={}
 for v in me.vertices:groups.setdefault(find(v.index),[]).append(ob.matrix_world@v.co)
 for vs in groups.values():
  if len(vs)<4:continue
  lo=[min(p[i] for p in vs) for i in range(3)];hi=[max(p[i] for p in vs) for i in range(3)]
  if ob.name.startswith(('WOOD2','FINISH','ROUGHNESS63','ROUGHNSS90')):out.append({'obj':ob.name,'mat':[m.name for m in me.materials if m],'min':lo,'max':hi,'n':len(vs)})
(W/'adim08/islands.json').write_text(json.dumps(out,indent=1));print('islands',len(out))
