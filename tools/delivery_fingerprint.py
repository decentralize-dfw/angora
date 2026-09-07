"""Fingerprint the master and all linked files used for a review render."""
import hashlib, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]


def delivery_snapshot():
    manifest = json.loads((ROOT / 'build/blender/layer-manifest.json').read_text())
    paths = [manifest['master']] + [row['path'] for row in manifest['files']]
    files = [{'path': path, 'sha256': hashlib.sha256((ROOT / path).read_bytes()).hexdigest()}
             for path in sorted(paths)]
    digest = hashlib.sha256(json.dumps(files, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    return {'sha256': digest, 'files': files}
