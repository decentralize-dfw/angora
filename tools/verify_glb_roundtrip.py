"""Re-import review GLBs with Draco and verify model scale and extents survived."""
import bpy,json,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'build/glb'
sys.path.insert(0,str(ROOT/'tools'))
from geometry_bounds import geometry_bounds
reports=json.loads((out/'export-report.json').read_text());results=[]
for report in reports:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(out/report['file']))
    bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
    geometry=[o for o in bpy.context.scene.objects if o.type=='MESH']
    assert geometry,'GLB imported no geometry'
    bounds=geometry_bounds(geometry,deps)
    difference=max(abs(a-b) for row1,row2 in zip(bounds,report['blender_bounds_m']) for a,b in zip(row1,row2))
    result={'file':report['file'],'imported_mesh_objects':len(geometry),'max_bounds_delta_m':difference,'bounds_check':'passed' if difference<.02 else 'failed','source_references_retained':sum('source_reference' in o for o in geometry),'expected_bounds_m':report['blender_bounds_m'],'imported_bounds_m':bounds}
    results.append(result);print(json.dumps(result),flush=True)
(out/'roundtrip-report.json').write_text(json.dumps(results,indent=2))
assert all(r['bounds_check']=='passed' for r in results),'GLB bounds differ; see roundtrip-report.json'
