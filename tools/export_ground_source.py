"""Export the current road/terrain meshes as an intermediate geometry snapshot."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
out=[]
for o in bpy.context.scene.objects:
 if not o.name.startswith(('Terrain','Context road','Front road','Front pedestrian sidewalk')):continue
 if o.type!='MESH':continue
 out.append({'name':o.name,'vertices':[list(o.matrix_world@v.co) for v in o.data.vertices],'faces':[list(p.vertices) for p in o.data.polygons],
  'uv':[[list(o.data.uv_layers.active.data[i].uv) for i in p.loop_indices] for p in o.data.polygons] if o.data.uv_layers.active else []})
(ROOT/'build/intermediate/context-ground-source.json').write_text(json.dumps(out));print([(o['name'],len(o['faces'])) for o in out])
