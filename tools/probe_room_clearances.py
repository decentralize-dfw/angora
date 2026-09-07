"""Check recently corrected furniture groups against CAD room extents."""
import bpy,json,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from geometry_bounds import geometry_bounds
deps=bpy.context.evaluated_depsgraph_get()
rooms={'Master bedroom':(-5.03,4.03,.12,8.077),'Walk-in closet':(.32,3.32,3.118,5.98),'Southwest bedroom':(-5.03,-4.03,-2.03,.13),
       'Master bathroom':(.32,6.15,3.118,9.04),'Shared bathroom':(1.94,-4.03,3.94,-.57)}
report=[]
for name,(x0,y0,x1,y1) in rooms.items():
    col=bpy.data.collections[name];bad=[]
    for obj in col.all_objects:
        if obj.type not in {'MESH','CURVE'}:continue
        bounds=geometry_bounds([obj],deps)
        mn,mx=bounds
        if mn[0]<x0-.035 or mx[0]>x1+.035 or mn[1]<y0-.035 or mx[1]>y1+.035:bad.append({'object':obj.name,'bounds':bounds})
    report.append({'room':name,'room_bounds_xy':[x0,y0,x1,y1],'objects_outside':bad,'passed':not bad})
(ROOT/'build/room-clearance-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('ROOM_CLEARANCES',json.dumps(report,ensure_ascii=False),flush=True)
assert all(row['passed'] for row in report),'A corrected fitting extends beyond its CAD room boundary'
hit,loc,normal,face,obj,matrix=bpy.context.scene.ray_cast(deps,Vector((6.8,.5,12)),Vector((0,0,-1)),distance=12)
print('GARAGE_ROOF_TOP',obj.name if hit else None,list(loc),flush=True)
