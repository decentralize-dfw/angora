import bpy,json,sys
from pathlib import Path
from mathutils import Vector
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');A=W/'adim09';(A/'web-calisma').mkdir(exist_ok=True)
def bounds(ob):
 ps=[ob.matrix_world@v.co for v in ob.data.vertices]
 return [[min(p[i] for p in ps) for i in range(3)],[max(p[i] for p in ps) for i in range(3)]] if ps else None
bpy.ops.wm.read_factory_settings(use_empty=True);src={}
for role,f in [('BUILDING','BUILDING-opt-v4-lm.glb'),('INTERIOR','INTERIOR-opt-v2.decoded.glb')]:
 before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(R/'build/bake'/f))
 for ob in set(bpy.context.scene.objects)-before:
  if ob.type=='MESH':src[role+'|'+ob.name]={'bbox':bounds(ob),'v':len(ob.data.vertices),'f':len(ob.data.polygons),'mesh':ob.data.name,'mat':[m.name if m else None for m in ob.data.materials]}
(A/'web-calisma/kaynak-bounds.json').write_text(json.dumps(src,ensure_ascii=False,indent=1),encoding='utf-8')
bpy.ops.wm.open_mainfile(filepath=str(A/'kontrol-sahne.blend'));mats=[]
for m in bpy.data.materials:
 if not m.users or not m.use_nodes:continue
 bs=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
 mats.append({'name':m.name,'original':m.get('angora_original'),'nodes':[(n.name,n.type) for n in m.node_tree.nodes],'images':[(n.name,n.image.filepath,list(n.image.size),n.image.colorspace_settings.name) for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image],'links':[(l.from_node.name,l.from_socket.name,l.to_node.name,l.to_socket.name) for l in m.node_tree.links]})
(A/'web-calisma/material-graph.json').write_text(json.dumps(mats,ensure_ascii=False,indent=1),encoding='utf-8')
print('SOURCE MESH',len(src),'MATERIAL',len(mats));print('IMAGE SOURCES',[(m['name'],len(m['images'])) for m in mats if m['images']][:20]);print('EXPORT PROPS',[(p.identifier,p.default) for p in bpy.ops.export_scene.gltf.get_rna_type().properties if 'image' in p.identifier or 'original' in p.identifier or 'texture' in p.identifier])
