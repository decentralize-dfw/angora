import bpy
for m in bpy.data.materials:
 if any(s in m.name.lower() for s in ['room','curtain','art','damask']):
  print('MATERIAL',m.name)
  if m.node_tree:
   for n in m.node_tree.nodes:
    if n.type=='TEX_IMAGE' and n.image:print('IMAGE',n.image.name,tuple(n.image.size),n.image.filepath)
