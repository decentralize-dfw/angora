"""Reject non-lift fixtures/furniture intersecting the usable cabin volumes."""
import bpy,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];hits=[]
objects=set()
for name in ['20_FIXED_FITTINGS','30_FURNITURE_PLACEHOLDERS']:
    objects.update(bpy.data.collections[name].all_objects)
for o in objects:
    if o.type!='MESH' or o.hide_render or o.name.startswith('Lift'):continue
    points=[o.matrix_world@Vector(p) for p in o.bound_box]
    lo=[min(p[i] for p in points) for i in range(3)];hi=[max(p[i] for p in points) for i in range(3)]
    for floor,z in enumerate([0,3.0996,6.3714,9.4705]):
        a=[-2.61,.28,z+.08];b=[-1.43,1.44,z+2.13]
        overlap=[min(hi[i],b[i])-max(lo[i],a[i]) for i in range(3)]
        if all(v>.006 for v in overlap):hits.append({'object':o.name,'floor':floor,'overlap_m':overlap})
report={'status':'passed' if not hits else 'failed','foreign_fixture_intersections':hits,'scope':'fixed fittings and furniture, usable lift cabin volumes on four landings'}
(ROOT/'build/lift-fixture-qa.json').write_text(json.dumps(report,indent=2));print('LIFT_FIXTURE_QA',json.dumps(report),flush=True)
assert not hits,'Foreign fixtures intersect the lift cabin'
