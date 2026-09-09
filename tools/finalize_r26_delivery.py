"""Fingerprint the resumed delivery without claiming unresolved acceptance."""
import json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
master=ROOT/'build/blender/angora21-working.blend'
manifest=json.loads((ROOT/'build/web/full/manifest.json').read_text())
assert manifest['source_native_sha256']==sha(master)
for path,digest in manifest['library_hashes'].items():assert sha(ROOT/path)==digest,path
for asset in manifest['assets']:
    p=ROOT/'build/web/full'/asset['file'];assert p.stat().st_size==asset['bytes'] and sha(p)==asset['sha256'],p
for key in ['room_annotations','navigation','section_atlas']:
    a=manifest[key];assert sha(ROOT/'build/web/full'/a['file'])==a['sha256'],key
native=json.loads((ROOT/'build/r26-native-qa.json').read_text());assert native['status']=='passed'
assert native['terrain_sha256']==sha(ROOT/'build/blender/layers/50-neighborhood-10.blend')
assert native['architecture_sha256']==sha(ROOT/'build/blender/layers/10-architecture.blend')
rp=ROOT/'build/room-review-register.json';register=json.loads(rp.read_text())
register['native_master_sha256']=sha(master)
for g in register['groups']:
    if g['photo_group'] in ['exterior','kat_1_bahce','kat_2_giris']:
        existing=g.setdefault('completed_corrections',[])
        if not any(r.get('revision')==26 for r in existing):
            existing.append({'revision':26,'change':'Applied source stair aperture and terraced garden geometry; completed geometry checks, photographic acceptance remains open',
                'evidence':'build/r26-native-qa.json'})
rp.write_text(json.dumps(register,ensure_ascii=False,indent=2))
report={'revision':26,'phase_1_complete':False,'native_master_sha256':sha(master),
    'web_manifest_sha256':sha(ROOT/'build/web/full/manifest.json'),
    'geometry_checks':'passed','viewer_automated_tests':17,
    'implemented':['7.15 m² entrance stair opening','Four garden terraces with perimeter reveal faces',
      'Updated model exports and source-based navigation','Perspective pinch altitude lock','Stale room transition cancellation',
      'Evidence-labelled floor and site model surface totals'],
    'mobile_gpu':'blocked: cloud browser WebGL context disabled','physical_xr':'not_verified',
    'regional_services':'blocked_pending_explicit_external_coordinate_sharing_permission',
    'individual_room_areas':'not_published_pending_source_partition_verification',
    'photo_acceptance':'open; see room-review-register.json',
    'publication':'verify GitHub Pages deployment for the eventual commit'}
(ROOT/'build/review-r26.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('R26_DELIVERY_FINGERPRINTS_PASSED',report['web_manifest_sha256'])
