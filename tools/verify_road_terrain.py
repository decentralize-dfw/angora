"""Check that the linked native road/terrain edit matches its prepared mesh."""
import bpy,json,gzip,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
planned=json.load(gzip.open(ROOT/'build/cad/road-ground-r18.json.gz','rt'))
checks=[]
for name,key in [('CAD roads — corrected block loops and arterials','roads'),
                 ('Terrain — CAD TK and road levels with terraced pads','terrain')]:
    obj=bpy.data.objects[name];expected=planned[key]['vertices']
    assert len(obj.data.vertices)==len(expected)
    delta=max(abs(a-b) for v,p in zip(obj.data.vertices,expected) for a,b in zip(obj.matrix_world@v.co,p))
    assert delta<.00002,(name,delta)
    assert all(p.normal.z>0 for p in obj.data.polygons),'Downward or collapsed ground face'
    checks.append({'object':name,'vertices':len(obj.data.vertices),'triangles':len(obj.data.polygons),'prepared_mesh_max_delta_m':delta})
count=sum(o.type not in ['LIGHT','CAMERA'] for o in bpy.context.scene.objects)
assert count==5084,(count,'expected baseline 5090 minus seven former roads plus one unified road mesh')
report={'status':'passed','revision':18,'geometry_objects':count,'checks':checks,
 'prepared_plan_building_intersections':planned['report']['building_intersections'],
 'source_archive_sha256':hashlib.sha256((ROOT/'build/cad/road-ground-r18.json.gz').read_bytes()).hexdigest(),
 'photo_alignment_complete':False}
(ROOT/'build/road-terrain-native-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('ROAD_TERRAIN_NATIVE_QA',json.dumps(report),flush=True)
