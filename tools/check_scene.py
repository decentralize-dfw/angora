"""Blender QA: scene statistics, camera/furniture intersections and source coverage."""
import bpy,json,sys,re
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
scene=bpy.context.scene;deps=bpy.context.evaluated_depsgraph_get()
sources=set(bpy.data.collections['00_SOURCE_REFERENCE'].all_objects)
furniture=list(bpy.data.collections['30_FURNITURE_PLACEHOLDERS'].all_objects)
hits=[]
for camera in [o for o in scene.objects if o.type=='CAMERA']:
    p=camera.location
    for obj in furniture:
        inv=obj.matrix_world.inverted();q=inv@p
        bb=[Vector(c) for c in obj.bound_box]
        if all(min(c[i] for c in bb)<q[i]<max(c[i] for c in bb) for i in range(3)):
            hits.append({'camera':camera.name,'furniture_object':obj.name})
evaluated_triangles=0;visible_objects=0
for obj in scene.objects:
    if obj in sources or obj.hide_render or obj.type not in {'MESH','CURVE'}:continue
    ev=obj.evaluated_get(deps);me=ev.to_mesh();me.calc_loop_triangles()
    evaluated_triangles+=len(me.loop_triangles);visible_objects+=1;ev.to_mesh_clear()
report={'visible_geometry_objects':visible_objects,'evaluated_triangles':evaluated_triangles,
        'furniture_objects':len(furniture),'camera_furniture_bbox_intersections':hits,
        'dimension_labels_enabled':False,'photo_alignment_complete':False,
        'publication_ready':False,'web_texture_baking_complete':all(mat.get('pbr_maps_json') for o in scene.objects if o.type in {'MESH','CURVE'} for mat in o.data.materials if mat)}
hit,loc,normal,face,obj,matrix=scene.ray_cast(deps,Vector((-4.4,5.4,4.3)),Vector((0,0,-1)),distance=5)
report['living_split_level_probe']={'hit':obj.name if hit else None,'z_m':float(loc.z) if hit else None,'passed':bool(hit and 2.79<loc.z<2.83)}
hit,loc,normal,face,obj,matrix=scene.ray_cast(deps,Vector((5.675,-8,4.3)),Vector((0,1,0)),distance=15)
report['garage_visibility_probe']={'first_hit':obj.name if hit else None,'passed':bool(hit and obj.name.startswith(('Garage roller slat','Garage sectional panel','Garage panel recess','Garage panel moulding')))}
floor_errors=[]
for obj in bpy.data.collections['10_ARCHITECTURE'].all_objects:
    match=re.match(r'^KAT\s*([0-3])\$',obj.get('source_layer',''))
    if match and obj.get('floor_index')!=int(match.group(1)):
        floor_errors.append(obj.name)
report['cad_floor_ownership_errors']=floor_errors
hit,loc,normal,face,obj,matrix=scene.ray_cast(deps,Vector((-.5,15.45,-.3)),Vector((0,0,-1)),distance=3)
report['pool_basin_probe']={'first_hit':obj.name if hit else None,'z_m':float(loc.z) if hit else None,
    'passed':bool(hit and obj.name.startswith('Pool basin floor'))}
terrace_probes=[]
for x,y in [(-.5,13.12),(-.5,17.74),(-6,13.5),(5,17.5)]:
    hit,loc,normal,face,obj,matrix=scene.ray_cast(deps,Vector((x,y,.5)),Vector((0,0,-1)),distance=2)
    terrace_probes.append({'xy_m':[x,y],'first_hit':obj.name if hit else None,
        'passed':bool(hit and obj.name.startswith('Pool terrace'))})
report['pool_terrace_coverage']=terrace_probes
hit,loc,normal,face,obj,matrix=scene.ray_cast(deps,Vector((-4.1,1.5,1.35)),Vector((0,0,-1)),distance=3)
report['basement_kitchen_ground_clearance']={'first_hit':obj.name if hit else None,'z_m':float(loc.z) if hit else None,
    'passed':bool(hit and not obj.name.startswith('Terrain') and loc.z<1.0)}
hit,loc,normal,face,obj,matrix=scene.ray_cast(deps,Vector((-2.02,.86,2.50)),Vector((0,0,1)),distance=8)
report['lift_vertical_void']={'first_hit':obj.name if hit else None,'z_m':float(loc.z) if hit else None,
    'passed':bool(not hit or loc.z>9.6)}
(ROOT/'build/qa-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False),flush=True)
assert report['living_split_level_probe']['passed'],'Living floor is occluded by an upper slab cap'
assert report['garage_visibility_probe']['passed'],'Garage door is occluded by source wall geometry'
assert not floor_errors,'Split-level geometry belongs to the wrong floor'
assert report['pool_basin_probe']['passed'],'Terrain blocks the pool basin'
assert all(p['passed'] for p in terrace_probes),'Unintended gaps remain in the pool terrace'
assert report['basement_kitchen_ground_clearance']['passed'],'Terrain intrudes into the basement kitchen'
assert report['lift_vertical_void']['passed'],'An intermediate floor blocks the lift shaft'
