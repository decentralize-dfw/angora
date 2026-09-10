"""Inspect source surfaces without mutating the linked delivery model."""
import bpy,json,hashlib
from pathlib import Path
from collections import defaultdict
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
(ROOT/'build/intermediate').mkdir(exist_ok=True)
records=[];triangles=defaultdict(list)
for o in bpy.context.scene.objects:
    if o.type!='MESH' or o.hide_render:continue
    names=' '.join([o.name]+[m.name for m in o.data.materials if m]).lower()
    if not any(s in names for s in ['terrain','grass','road','lawn','roof','çatii','clay tile','dorbak']):continue
    p=[o.matrix_world@Vector(v) for v in o.bound_box]
    records.append({'name':o.name,'library':o.library.filepath if o.library else None,
      'polygons':len(o.data.polygons),'materials':[m.name for m in o.data.materials if m],
      'bounds':[[min(v[i] for v in p) for i in range(3)],[max(v[i] for v in p) for i in range(3)]]})
    if len(o.data.polygons)>50000:continue
    o.data.calc_loop_triangles()
    world=[o.matrix_world@v.co for v in o.data.vertices]
    for t in o.data.loop_triangles:
        points=[world[i] for i in t.vertices]
        if (points[1]-points[0]).cross(points[2]-points[0]).length<1e-8:continue
        key=tuple(sorted(tuple(round(float(x),5) for x in v) for v in points))
        triangles[key].append(o.name)
duplicates=defaultdict(int)
for names in triangles.values():
    if len(names)>1:duplicates[tuple(sorted(set(names)))]+=len(names)-1
report={'model_sha256':hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest(),
        'objects':records,'duplicate_triangles':[{'objects':list(k),'count':v} for k,v in sorted(duplicates.items(),key=lambda x:-x[1])]}
(ROOT/'build/intermediate/surface-stack-audit.json').write_text(json.dumps(report,indent=2))
print('DUPLICATE_TRIANGLES',json.dumps(report['duplicate_triangles'][:35]),flush=True)
print('GROUND_SURFACES',json.dumps([r for r in records if any(w in r['name'].lower() for w in ['terrain','road','lawn','grass','dorbak'])][:60]),flush=True)
