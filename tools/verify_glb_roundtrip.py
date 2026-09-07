"""Re-import manifest GLBs with Draco and verify common origin, scale and maps."""
import bpy,json,sys,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'build/glb'
sys.path.insert(0,str(ROOT/'tools'))
from geometry_bounds import geometry_bounds
manifest=json.loads((out/'scene-manifest.json').read_text())
reports=manifest['assets'];results=[];integrity=[]
selected=set(sys.argv[sys.argv.index('--')+1:]) if '--' in sys.argv else set()
prior_path=out/'stream-qa-report.json'
if selected and prior_path.exists():
    prior=json.loads(prior_path.read_text());old_sha={r['file']:r['sha256'] for r in prior.get('integrity',[])}
    current_sha={r['file']:r['sha256'] for r in reports}
    results=[r for r in prior.get('roundtrip',[]) if r['file'] not in selected and old_sha.get(r['file'])==current_sha.get(r['file'])]
for report in reports:
    data=(out/report['file']).read_bytes()
    assert hashlib.sha256(data).hexdigest()==report['sha256'],report['file']+' digest changed'
    header=json.loads(data[20:20+int.from_bytes(data[12:16],'little')].decode().rstrip('\0 '))
    materials=header.get('materials',[])
    missing=[m.get('name','unnamed') for m in materials if 'normalTexture' not in m or 'metallicRoughnessTexture' not in m.get('pbrMetallicRoughness',{})]
    assert not missing,(report['file'],missing)
    integrity.append({'file':report['file'],'sha256':report['sha256'],'materials':len(materials),'normal_and_orm':'passed'})
for report in reports:
    if selected and report['file'] not in selected:continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(out/report['file']))
    bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
    geometry=[o for o in bpy.context.scene.objects if o.type=='MESH']
    assert geometry,'GLB imported no geometry'
    bounds=geometry_bounds(geometry,deps)
    difference=max(abs(a-b) for row1,row2 in zip(bounds,report['blender_bounds_m']) for a,b in zip(row1,row2))
    result={'file':report['file'],'imported_mesh_objects':len(geometry),'max_bounds_delta_m':difference,'bounds_check':'passed' if difference<.02 else 'failed','source_references_retained':sum('source_reference' in o for o in geometry),'expected_bounds_m':report['blender_bounds_m'],'imported_bounds_m':bounds}
    result['sha256']=report['sha256'];results.append(result);print(json.dumps(result),flush=True)
(out/'stream-qa-report.json').write_text(json.dumps({'source_native_sha256':manifest['source_native_sha256'],'integrity':integrity,'roundtrip':results,'tolerance_m':.02,'mobile_performance_validated':False},indent=2))
assert all(r['bounds_check']=='passed' for r in results),'GLB bounds differ; see roundtrip-report.json'
