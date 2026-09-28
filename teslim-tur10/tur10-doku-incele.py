import bpy
from pathlib import Path
p=Path(r'C:\Users\yigit\angora-tur10\doku-inceleme');p.mkdir(exist_ok=True)
for m in bpy.data.materials:
 if any(s in m.name.lower() for s in ['damask','bedroom line','hall picture']):
  n=next((n for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image),None)
  if n:
   name='perde' if 'damask' in m.name else ('tablo' if 'bedroom' in m.name else 'hol')
   n.image.filepath_raw=str(p/(name+'.png'));n.image.file_format='PNG';n.image.save();print(name,n.image.size[:])
