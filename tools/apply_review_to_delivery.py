"""Apply the bounded review patch to source and linked delivery, then verify."""
import subprocess,json,hashlib,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run(path,script,*args):
    command=['bash','tools/run_blender.sh',str(path),'--python','tools/'+script]
    if args:command+=['--',*args]
    result=subprocess.run(command,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    (ROOT/'build/intermediate'/('review-run-'+Path(path).stem+'-'+Path(script).stem+'.log')).write_text(result.stdout)
    if result.returncode:
        print(result.stdout[-6000:],flush=True);result.check_returncode()
    print('REVIEW_STEP',Path(path).name,script,'passed',flush=True)
source=ROOT/'build/intermediate/angora21-monolithic.blend';master=ROOT/'build/blender/angora21-working.blend'
run(master,'apply_photo_review_patch.py','--discover')
libraries=[Path(p) for p in json.loads((ROOT/'build/intermediate/review-patch-libraries.json').read_text())]
backup=ROOT/'build/intermediate/before-photo-review-12';backup.mkdir(parents=True,exist_ok=True)
for path in [source,master,*libraries]:
    destination=backup/path.name
    if not destination.exists():shutil.copy2(path,destination)
for path in [source,*libraries,master]:run(path,'apply_photo_review_patch.py')
manifest_path=ROOT/'build/blender/layer-manifest.json';manifest=json.loads(manifest_path.read_text())
report=json.loads((ROOT/'build/intermediate/review-patch-source.json').read_text())
manifest.update(master_sha256=digest(master),source_monolithic_sha256=digest(source),
                source_vertices=report['mesh_vertices'],linked_vertices=report['mesh_vertices'],
                source_objects=report['geometry_and_empty_objects'],linked_scene_objects=report['geometry_and_empty_objects'],
                review_geometry_bounds_m=report['review_geometry_bounds_m'],
                review_revision='12-pool-kitchen-photo-review')
for record in manifest['files']:
    path=ROOT/record['path'];record.update(bytes=path.stat().st_size,sha256=digest(path))
    assert record['bytes']<11_500_000,record['path']
manifest['maximum_library_bytes']=max(r['bytes'] for r in manifest['files'])
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
run(master,'verify_layer_delivery.py')
run(source,'check_scene.py')
run(source,'check_lift_fixture_clearance.py')
run(source,'export_streams.py','villa-f0.glb','villa-f1.glb','villa-garden-ground.glb')
print('REVIEW_DELIVERY_PATCH_COMPLETE',digest(master),flush=True)
