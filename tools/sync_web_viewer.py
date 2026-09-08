"""Refresh the review app from canonical web model derivatives."""
import hashlib,json,shutil,argparse
from pathlib import Path
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--viewer',type=Path,default=root/'viewer');args=parser.parse_args()
source=root/'build/web';manifest=json.loads((source/'manifest.json').read_text())
assert len(manifest['assets'])==6
destination=args.viewer/'public/models';destination.mkdir(parents=True,exist_ok=True)
for asset in manifest['assets']:
    path=source/asset['file'];raw=path.read_bytes()
    assert hashlib.sha256(raw).hexdigest()==asset['sha256'],path
    assert len(raw)==asset['bytes'],path
    shutil.copy2(path,destination/path.name)
shutil.copy2(source/'manifest.json',destination/'manifest.json')
full=json.loads((source/'full/manifest.json').read_text())
assert full['full_scene'] and not full['geometry_preclipped']
for asset in full['assets']:
    path=source/'full'/asset['file'];raw=path.read_bytes()
    assert hashlib.sha256(raw).hexdigest()==asset['sha256'],path
    assert len(raw)==asset['bytes'],path
    target=destination/'full'/asset['file'];target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(path,target)
shutil.copy2(source/'full/manifest.json',destination/'full/manifest.json')
if full.get('section_atlas'):
    atlas=full['section_atlas'];path=source/'full'/atlas['file']
    assert hashlib.sha256(path.read_bytes()).hexdigest()==atlas['sha256']
    shutil.copy2(path,destination/'full'/atlas['file'])
print('Viewer models synchronized:',len(full['assets']), 'uncut assets + legacy snapshots')
