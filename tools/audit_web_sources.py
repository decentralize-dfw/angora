import bpy,json
from pathlib import Path
r={}
for name in ['10_ARCHITECTURE','15_EXTERIOR_DETAILS','40_LANDSCAPE','50_NEIGHBORHOOD']:
 c=bpy.data.collections[name]
 r[name]=sorted([{'name':o.name,'faces':len(o.data.polygons),'layer':o.get('source_layer'),'mat':[m.name for m in o.data.materials if m]} for o in c.all_objects if o.type=='MESH'],key=lambda x:-x['faces'])[:40]
Path('build/intermediate/web-sources.json').write_text(json.dumps(r,ensure_ascii=False,indent=2))
