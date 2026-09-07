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
print('Viewer models synchronized:',len(manifest['assets']))
