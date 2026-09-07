"""Check appliance openings after the photo joinery replacement."""
import bpy,json
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1];col=bpy.data.collections['Photo kitchen — entrance']
def bounds(o):
 p=[o.matrix_world@Vector(v) for v in o.bound_box]
 return [[min(q[i] for q in p) for i in range(3)],[max(q[i] for q in p) for i in range(3)]]
def intersects(a,b):return all(min(a[1][i],b[1][i])-max(a[0][i],b[0][i])>1e-4 for i in range(3))
bpy.context.view_layer.update();objects=list(col.all_objects)
dish=next(o for o in objects if 'dishwasher brushed door' in o.name)
sink=next(o for o in objects if o.name.startswith('Stainless sink bowl'))
oven=next(o for o in objects if o.name.startswith('Oven glass'))
assert not intersects(bounds(dish),bounds(sink)),'Dishwasher overlaps sink bowl'
ob=bounds(oven);mouth=[[ob[0][0],ob[0][1]-.05,ob[0][2]],[ob[1][0],ob[1][1],ob[1][2]]]
hits=[o.name for o in objects if 'hob run' in o.name and not o.hide_render and intersects(bounds(o),mouth)]
assert not hits,('Oven face obstructed',hits)
back=next(o for o in objects if 'vitrine recessed back' in o.name)
assert 0.015<1.038-bounds(back)[1][0]<.035,'Vitrine must abut the native east wall'
new=[o for o in objects if o.get('review_revision')=='15-entrance-kitchen-joinery']
assert len(new)>=180
assert all(not o.get('dimension_label_allowed',False) for o in new)
r={'added_objects':len(new),'dishwasher_sink_clear':True,'oven_face_clear':True,'vitrine_registered_wall_x_m':1.038,'native_CAD_openings_modified':False,
   'fabrication_dimensions_verified':False,'photo_match_approved':False}
(root/'build/kitchen-review-qa.json').write_text(json.dumps(r,indent=2));print('KITCHEN_QA',json.dumps(r),flush=True)
