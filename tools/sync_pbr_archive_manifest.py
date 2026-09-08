"""Reconcile only the already-recorded R14 color repairs with the map index.

The archived PNGs were repaired in R14 but 62 manifest hashes still described
their earlier encodings. Do not silently accept arbitrary changed maps: every
discrepancy must match the explicit repair record before metadata is updated.
No texture pixels or Blender materials are modified here.
"""
import json,hashlib,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];folder=ROOT/'assets/pbr'
path=folder/'manifest.json';manifest=json.loads(path.read_text())
repairs=json.loads((folder/'color-encoding-report.json').read_text())
known={Path(r['map']).name:r['sha256'] for r in repairs['changed']}
archive_path=folder/'pbr-maps.zip';temporary=archive_path.with_suffix('.zip.tmp')
corrections=[]
with zipfile.ZipFile(archive_path) as archive:
    assert len(archive.namelist())==len(set(archive.namelist()))
    for name,expected in manifest['file_sha256'].items():
        actual=hashlib.sha256(archive.read(name)).hexdigest()
        if actual!=expected:
            assert name in known and actual==known[name],('Unrecorded texture change',name)
            corrections.append({'file':name,'stale_sha256':expected,'recorded_repair_sha256':actual})
            manifest['file_sha256'][name]=actual
manifest['hash_index_revision']='23-index-reconciled-with-recorded-r14-color-repairs'
path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
with zipfile.ZipFile(archive_path) as old,zipfile.ZipFile(temporary,'w',compression=zipfile.ZIP_DEFLATED) as archive:
    for entry in old.infolist():
        if entry.filename not in ['manifest.json','README.md']:archive.writestr(entry,old.read(entry))
    archive.write(path,'manifest.json');archive.write(folder/'README.md','README.md')
temporary.replace(archive_path)
with zipfile.ZipFile(archive_path) as archive:
    assert json.loads(archive.read('manifest.json'))==manifest
    assert archive.read('README.md')==(folder/'README.md').read_bytes()
    for name,expected in manifest['file_sha256'].items():
        assert hashlib.sha256(archive.read(name)).hexdigest()==expected,name
result={'revision':23,'material_count':len(manifest['materials']),'verified_png_count':len(manifest['file_sha256']),
        'map_archive_sha256':hashlib.sha256(archive_path.read_bytes()).hexdigest(),
        'manifest_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
        'recorded_color_repair_index_corrections':corrections,'texture_pixels_modified':False,'passed':True}
(ROOT/'build/pbr-archive-qa-r23.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print('PBR_ARCHIVE_VERIFIED',result['material_count'],result['verified_png_count'],len(corrections),flush=True)
