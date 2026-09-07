"""Apply/release the kitchen review consistently to Blender, GLB and the app.

Use --finalize-only after an already applied patch. The hosted app reads its
new model from GitHub main after these assets are committed and pushed.
"""
import argparse,hashlib,json,shutil,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--finalize-only',action='store_true');args=p.parse_args()
source=ROOT/'build/intermediate/angora21-monolithic.blend';master=ROOT/'build/blender/angora21-working.blend';library=ROOT/'build/blender/layers/20-fixed-fittings.blend'
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def run(path,script,*extra):
    cmd=['bash','tools/run_blender.sh',str(path),'--python','tools/'+script]
    if extra:cmd+=['--',*extra]
    log=ROOT/'build/intermediate'/('kitchen-delivery-'+path.stem+'-'+script+'.log')
    with log.open('w') as f:r=subprocess.run(cmd,cwd=ROOT,stdout=f,stderr=subprocess.STDOUT)
    if r.returncode:raise RuntimeError(log.read_text()[-6000:])
    print('KITCHEN_DELIVERY_STEP',path.name,script,flush=True)
if not args.finalize_only:
    backup=ROOT/'build/intermediate/before-kitchen-review-15';backup.mkdir(exist_ok=True)
    for path in [source,library,master]:
        if not (backup/path.name).exists():shutil.copy2(path,backup/path.name)
        run(path,'refine_entrance_kitchen.py')
path=ROOT/'build/blender/layer-manifest.json';manifest=json.loads(path.read_text());report=json.loads((ROOT/'build/intermediate/kitchen-review-source.json').read_text())
manifest.update(master_sha256=digest(master),source_monolithic_sha256=digest(source),
                source_vertices=report['mesh_vertices'],linked_vertices=report['mesh_vertices'],
                source_objects=report['geometry_and_empty_objects'],linked_scene_objects=report['geometry_and_empty_objects'],
                review_revision='15-entrance-kitchen-joinery')
for record in manifest['files']:
    file=ROOT/record['path'];record.update(bytes=file.stat().st_size,sha256=digest(file));assert record['bytes']<11800000
manifest['maximum_library_bytes']=max(f['bytes'] for f in manifest['files']);manifest.pop('delivery_snapshot_sha256',None)
path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
run(master,'verify_layer_delivery.py');run(source,'check_kitchen_review.py')
run(source,'export_streams.py','villa-f1.glb');run(source,'export_web_viewer.py','--views','floor-1')
subprocess.run([sys.executable,'tools/sync_web_viewer.py'],cwd=ROOT,check=True)
register=ROOT/'build/room-review-register.json';review=json.loads(register.read_text());review['native_master_sha256']=digest(master)
for group in review['groups']:
    if group['photo_group']=='kat_2_ust_mutfak':
        group['review_state']='photo_joinery_revision_15_applied_open_items_remain'
        group['completed_in_revision_15']=['Five-module sink cabinet layout, dishwasher and drainboard','Oven opening cleared and raised panel fronts','Cupboard mouldings and square backsplash joints','Vitrine positioned against measured native CAD wall face']
        group['open_items']=['Fotoğraftaki seramik deseninin, ahşap damar yönünün ve renginin eşleştirilmesi','Cam matlığı, pencere panjuru ve stor perdenin ayrıntıları','Tavan profili, avize ve fotoğraf ışığının eşleştirilmesi','Vitrin içi eşyalar ve kapı vitrayı; fotoğrafla son yerleşim kontrolü']
        group['photo_match_approved']=False
register.write_text(json.dumps(review,ensure_ascii=False,indent=2))
print('KITCHEN_DELIVERY_COMPLETE',digest(master),flush=True)
